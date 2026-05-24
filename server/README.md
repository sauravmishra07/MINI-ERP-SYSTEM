# Mini ERP — Server

Express + TypeScript REST API for the Mini ERP Purchase Request Management Module. Provides email/password authentication with role selection, optional Google OAuth, JWT session cookies, and a PostgreSQL data layer via Prisma.

**Base URL (local):** `http://localhost:3000`

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Authentication](#authentication)
- [API documentation](#api-documentation)
- [Role-based access](#role-based-access)
- [Error responses](#error-responses)
- [Scripts](#scripts)

---

## Tech stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Runtime    | Node.js 18+                       |
| Framework  | Express 5                         |
| Language   | TypeScript                        |
| Database   | PostgreSQL                        |
| ORM        | Prisma                            |
| Auth       | JWT + bcryptjs (email/password)   |
| OAuth      | Passport + Google OAuth 2.0       |
| Validation | Zod                               |
| Export     | json2csv                          |
| Logging    | Winston + daily-rotate-file       |

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally or remotely
- npm

---

## Project structure

```
server/
├── src/
│   ├── config/           # App, auth, logger, Passport config
│   ├── controllers/      # auth, requests, dashboard
│   ├── lib/              # Prisma client singleton
│   ├── middlewares/      # authenticate, requireRole, error handler, correlation ID
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routers/v1/       # auth, requests, dashboard, ping routers
│   ├── services/         # auth.service (register, login, findOrCreateUser)
│   ├── types/            # AuthenticatedRequest type
│   ├── utils/            # JWT helpers, error classes
│   ├── validators/       # auth.validator, request.validator
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Getting started

```bash
cd server
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Run the database migration:

```bash
npm run prisma:migrate
```

Start the dev server:

```bash
npm run dev
```

The API listens on `http://localhost:3000`.

---

## Environment variables

| Variable               | Required | Default                   | Description                                      |
| ---------------------- | -------- | ------------------------- | ------------------------------------------------ |
| `PORT`                 | No       | `3001`                    | HTTP port — use `3000` locally                   |
| `DATABASE_URL`         | Yes      | —                         | PostgreSQL connection string                     |
| `JWT_SECRET`           | Yes      | —                         | Secret for signing JWT tokens                    |
| `FRONTEND_URL`         | No       | `http://localhost:5173`   | CORS origin and post-OAuth redirect              |
| `ALLOWED_EMAIL_DOMAIN` | No       | `@k95foods.com`           | Only emails with this domain can register/login  |
| `GOOGLE_CLIENT_ID`     | No       | —                         | Google OAuth client ID (optional)                |
| `GOOGLE_CLIENT_SECRET` | No       | —                         | Google OAuth client secret (optional)            |
| `GOOGLE_CALLBACK_URL`  | No       | `…/auth/google/callback`  | Must match Google Console redirect URI           |
| `NODE_ENV`             | No       | —                         | Set to `production` for secure cookies           |

---

## Authentication

### Email / Password (primary)

Users register with their company email, a password, and select a role. On login they must provide the same role they registered with — the backend validates it matches the stored role.

**Register flow:**
1. `POST /api/v1/auth/register` with `{ name, email, password, role }`
2. Backend validates email domain (`@k95foods.com`)
3. Password is hashed with bcrypt (10 rounds)
4. User is created; JWT cookie is set; user object returned

**Login flow:**
1. `POST /api/v1/auth/login` with `{ email, password, role }`
2. Backend verifies password hash
3. Backend checks that `role` matches the user's stored role
4. JWT cookie is set; user object returned

### Google OAuth (optional)

If Google credentials are configured in `.env`, users can also sign in via `GET /api/v1/auth/google`. The email domain restriction still applies.

### JWT Cookie

| Property | Value                             |
| -------- | --------------------------------- |
| Name     | `token`                           |
| HttpOnly | `true`                            |
| SameSite | `lax`                             |
| Max-Age  | 7 days                            |
| Secure   | `true` in production              |

---

## API documentation

All routes are prefixed with `/api/v1`.

### Auth — `POST /api/v1/auth/register`

Register a new user with email and password.

**Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@k95foods.com",
  "password": "secret123",
  "role": "EMPLOYEE"
}
```

`role` values: `EMPLOYEE` | `MANAGER` | `ADMIN`

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "jane@k95foods.com", "name": "Jane Doe", "role": "EMPLOYEE", ... }
  }
}
```

**Errors:** `400` validation, `403` wrong domain, `409` email already registered

---

### Auth — `POST /api/v1/auth/login`

Sign in with email, password, and role.

**Body:**

```json
{
  "email": "jane@k95foods.com",
  "password": "secret123",
  "role": "EMPLOYEE"
}
```

**Response `200`:** Same shape as register.

**Errors:** `401` wrong credentials, `403` role mismatch

---

### Auth — `GET /api/v1/auth/me`

Returns the currently authenticated user. Requires cookie or `Authorization: Bearer <token>`.

**Response `200`:**

```json
{
  "success": true,
  "data": { "user": { "id": "...", "email": "...", "name": "...", "role": "EMPLOYEE", ... } }
}
```

---

### Auth — `POST /api/v1/auth/logout`

Clears the auth cookie.

**Response `200`:** `{ "success": true, "message": "Logged out successfully" }`

---

### Auth — `GET /api/v1/auth/google`

Starts Google OAuth flow (optional). Redirects browser to Google consent screen.

---

### Purchase Requests — `POST /api/v1/requests`

Create a new request (status starts as `DRAFT`). Auth required.

**Body:**

| Field          | Type   | Rules                          |
| -------------- | ------ | ------------------------------ |
| `itemName`     | string | required                       |
| `quantity`     | number | > 0                            |
| `unit`         | string | e.g. `pcs`, `kg`, `litre`      |
| `department`   | string | required                       |
| `requiredDate` | string | ISO 8601 datetime              |
| `reason`       | string | min 10 chars                   |
| `priority`     | string | `LOW` \| `MEDIUM` \| `HIGH`    |

**Response `201`:** Created request object.

---

### Purchase Requests — `GET /api/v1/requests`

List requests with filters and pagination. Auth required.

**Query params:** `status`, `department`, `priority`, `from`, `to`, `page` (default 1), `limit` (default 10, max 100)

`EMPLOYEE` sees only their own requests. `MANAGER`/`ADMIN` see all.

**Response `200`:** `{ requests, total, page, limit, totalPages }`

---

### Purchase Requests — `GET /api/v1/requests/export`

Download filtered requests as CSV. Same filters as list (page/limit ignored).

**Response `200`:** `Content-Type: text/csv`, file `purchase_requests.csv`

---

### Purchase Requests — `GET /api/v1/requests/:id`

Get a single request with audit log. Auth required. Employee can only access own requests.

---

### Purchase Requests — `PATCH /api/v1/requests/:id/submit`

Submit a DRAFT request for approval. Owner only.

---

### Purchase Requests — `PATCH /api/v1/requests/:id/approve`

Approve a SUBMITTED request. `MANAGER`/`ADMIN` only. Optional body: `{ "remarks": "..." }`

---

### Purchase Requests — `PATCH /api/v1/requests/:id/reject`

Reject a SUBMITTED request. `MANAGER`/`ADMIN` only. Optional body: `{ "remarks": "..." }`

---

### Dashboard — `GET /api/v1/dashboard/stats`

Returns `{ total, pending, approved, rejected }` counts. Scoped by role.

---

### Dashboard — `GET /api/v1/dashboard/activity`

Returns last 10 audit log entries. Scoped by role.

---

## Role-based access

| Endpoint                     | EMPLOYEE | MANAGER | ADMIN |
| ---------------------------- | -------- | ------- | ----- |
| `POST /requests`             | ✅       | ✅      | ✅    |
| `GET /requests`              | Own only | All     | All   |
| `GET /requests/export`       | Own only | All     | All   |
| `GET /requests/:id`          | Own only | All     | All   |
| `PATCH /:id/submit`          | Own only | —       | —     |
| `PATCH /:id/approve`         | —        | ✅      | ✅    |
| `PATCH /:id/reject`          | —        | ✅      | ✅    |
| `GET /dashboard/stats`       | Own only | All     | All   |
| `GET /dashboard/activity`    | Own only | All     | All   |

---

## Error responses

| Status | When                                              |
| ------ | ------------------------------------------------- |
| `400`  | Validation error or bad input                     |
| `401`  | Missing/invalid token or wrong credentials        |
| `403`  | Wrong email domain or role mismatch               |
| `404`  | Resource not found                                |
| `409`  | Email already registered                          |
| `500`  | Unexpected server error                           |

---

## Scripts

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `npm run dev`             | Start with nodemon + ts-node       |
| `npm start`               | Start with ts-node                 |
| `npm run prisma:generate` | Regenerate Prisma Client           |
| `npm run prisma:migrate`  | Run migrations (dev)               |

---

## Related

- **Client:** `../client` — React frontend
- **Client env:** Set `VITE_API_URL=http://localhost:3000`

---

## License

ISC
