# Mini ERP — Server

Express + TypeScript API for the Mini ERP system. It provides Google OAuth authentication, JWT session cookies, and a PostgreSQL data layer via Prisma.

**Base URL (local):** `http://localhost:3000`

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Google OAuth setup](#google-oauth-setup)
- [Database](#database)
- [Scripts](#scripts)
- [Authentication](#authentication)
- [API documentation](#api-documentation)
  - [Common conventions](#common-conventions)
  - [Health](#health)
  - [Auth](#auth)
- [Error responses](#error-responses)
- [Protecting routes](#protecting-routes)

---

## Tech stack

| Layer        | Technology                          |
| ------------ | ------------------------------------- |
| Runtime      | Node.js                               |
| Framework    | Express 5                             |
| Language     | TypeScript                          |
| Database     | PostgreSQL                          |
| ORM          | Prisma                              |
| Auth         | Passport (Google OAuth 2.0) + JWT     |
| Validation   | Zod                                 |
| Logging      | Winston                             |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** running locally or remotely
- **Google Cloud Console** project with OAuth 2.0 credentials
- **npm** (or compatible package manager)

---

## Project structure

```
server/
├── src/
│   ├── config/           # App, auth, logger, Passport config
│   ├── controllers/      # Route handlers
│   ├── lib/              # Prisma client singleton
│   ├── middlewares/      # Auth, errors, correlation ID
│   ├── prisma/
│   │   ├── schema.prisma # Database schema & migrations
│   │   └── migrations/
│   ├── routers/
│   │   ├── v1/           # API v1 routes
│   │   └── v2/           # API v2 (placeholder)
│   ├── services/         # Business logic
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # JWT helpers, errors, etc.
│   ├── validators/       # Zod schemas
│   └── server.ts         # Application entry point
├── package.json
├── tsconfig.json
└── .env                  # Local secrets (not committed)
```

---

## Getting started

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Create a `.env` file in the `server` folder (see [Environment variables](#environment-variables)).

### 3. Set up the database

Ensure PostgreSQL is running and `DATABASE_URL` points to your database, then:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start the development server

```bash
npm run dev
```

The API listens on `http://localhost:3000` (or the port set in `PORT`).

For production:

```bash
npm start
```

---

## Environment variables

| Variable               | Required | Default                                              | Description |
| ---------------------- | -------- | ---------------------------------------------------- | ----------- |
| `PORT`                 | No       | `3001` (see `src/config/index.ts`)                   | HTTP port. Use `3000` for local dev to match OAuth callback. |
| `DATABASE_URL`         | Yes      | —                                                    | PostgreSQL connection string |
| `JWT_SECRET`           | Yes      | —                                                    | Secret used to sign JWT tokens |
| `GOOGLE_CLIENT_ID`     | Yes      | —                                                    | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes      | —                                                    | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL`  | No       | `http://localhost:3000/api/v1/auth/google/callback` | Must match Google Console redirect URI |
| `FRONTEND_URL`         | No       | `http://localhost:5173`                              | CORS origin and post-login redirect |
| `ALLOWED_EMAIL_DOMAIN` | No       | `@k95foods.com`                                      | Only emails ending with this domain can sign in |
| `NODE_ENV`             | No       | —                                                    | Set to `production` for secure cookies |

**Example `.env`:**

```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/mini_erp"
JWT_SECRET=your-long-random-secret
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

> Never commit `.env` or real secrets to version control.

---

## Google OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** (application type: **Web application**).
3. Add an **Authorized redirect URI**:
   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```
4. Copy the **Client ID** and **Client secret** into `.env`.
5. Ensure `FRONTEND_URL` matches your React app (e.g. Vite on port `5173`).

---

## Database

Schema lives in `src/prisma/schema.prisma`.

| Model             | Description                                      |
| ----------------- | ------------------------------------------------ |
| `User`            | Authenticated users (email, name, avatar, role)  |
| `PurchaseRequest` | Purchase requests with status workflow           |
| `AuditLog`        | Audit trail for purchase request actions         |

**Roles:** `EMPLOYEE`, `MANAGER`, `ADMIN`  
**Request status:** `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`  
**Priority:** `LOW`, `MEDIUM`, `HIGH`

---

## Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start server with nodemon + ts-node  |
| `npm start`             | Start server (ts-node)               |
| `npm run prisma:generate` | Generate Prisma Client             |
| `npm run prisma:migrate`  | Run migrations in development      |

---

## Authentication

### Flow

1. Client redirects the user to `GET /api/v1/auth/google`.
2. User signs in with Google.
3. Google redirects to `GET /api/v1/auth/google/callback`.
4. Server validates the email domain, creates or updates the user in PostgreSQL, issues a **JWT**, and sets it in an **httpOnly cookie** named `token`.
5. User is redirected to `FRONTEND_URL` (e.g. `http://localhost:5173`).
6. Protected endpoints read the JWT from the cookie or `Authorization: Bearer <token>` header.

### Cookie

| Property   | Value                                      |
| ---------- | ------------------------------------------ |
| Name       | `token`                                    |
| HttpOnly   | `true`                                     |
| SameSite   | `lax`                                      |
| Max-Age    | 7 days                                     |
| Secure     | `true` when `NODE_ENV=production`          |

### CORS

The server allows requests from `FRONTEND_URL` with `credentials: true` so the browser can send cookies on cross-origin API calls.

---

## API documentation

All versioned routes are prefixed with `/api/v1` or `/api/v2`.

### Common conventions

**Success response (JSON):**

```json
{
  "success": true,
  "data": { }
}
```

**Error response (JSON):**

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

**Authentication for protected routes:**

- **Cookie:** `token=<jwt>` (set automatically after Google login), or  
- **Header:** `Authorization: Bearer <jwt>`

---

### Health

#### `GET /api/v1/ping/health`

Simple liveness check. No authentication required.

**Response `200`**

```
OK
```

---

#### `GET /api/v1/ping`

Ping endpoint with request validation. No authentication required.

**Response `200`**

```json
{
  "message": "Pong!"
}
```

---

### Auth

Base path: `/api/v1/auth`

---

#### `GET /api/v1/auth/google`

Starts the Google OAuth sign-in flow.

**Authentication:** None

**Behavior:** Redirects the browser to Google’s consent screen.

**Usage (browser):**

```
http://localhost:3000/api/v1/auth/google
```

**Scopes requested:** `profile`, `email`

---

#### `GET /api/v1/auth/google/callback`

OAuth callback endpoint. Called by Google after the user signs in. **Do not call this manually** except via the OAuth redirect.

**Authentication:** None (handled by Google + Passport)

**Success behavior:**

1. Finds or creates a `User` record (`email`, `name`, `avatar`).
2. Sets the `token` httpOnly cookie (JWT, 7-day expiry).
3. Redirects to `FRONTEND_URL` (e.g. `http://localhost:5173`).

**Failure behavior:**

Redirects to:

```
{FRONTEND_URL}/login?error={encoded_message}
```

**Example failure redirect:**

```
http://localhost:5173/login?error=Only%20%40k95foods.com%20accounts%20are%20allowed
```

**Domain restriction:** Only emails ending with `ALLOWED_EMAIL_DOMAIN` (default `@k95foods.com`) are accepted.

---

#### `GET /api/v1/auth/me`

Returns the currently authenticated user.

**Authentication:** Required (cookie or Bearer token)

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@k95foods.com",
      "name": "Jane Doe",
      "avatar": "https://lh3.googleusercontent.com/...",
      "role": "EMPLOYEE",
      "createdAt": "2026-05-23T10:40:38.000Z"
    }
  }
}
```

**`role` values:** `EMPLOYEE` | `MANAGER` | `ADMIN`

**Example (fetch with cookie):**

```javascript
fetch("http://localhost:3000/api/v1/auth/me", {
  credentials: "include",
});
```

**Example (curl with Bearer token):**

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### `POST /api/v1/auth/logout`

Clears the auth cookie and ends the session.

**Authentication:** Required (cookie or Bearer token)

**Response `200`**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Example:**

```javascript
fetch("http://localhost:3000/api/v1/auth/logout", {
  method: "POST",
  credentials: "include",
});
```

---

### API v2

`/api/v2` is reserved for future endpoints. No routes are registered yet.

---

## Error responses

| Status | When |
| ------ | ---- |
| `400`  | Bad request (validation, malformed input) |
| `401`  | Missing or invalid authentication |
| `403`  | Authenticated but not allowed (e.g. wrong email domain at OAuth) |
| `404`  | Resource not found |
| `409`  | Conflict |
| `500`  | Unexpected server error |

**Example `401`:**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Protecting routes

Use the `authenticate` middleware on any route that requires a logged-in user:

```typescript
import { authenticate } from "../middlewares/auth.middleware";

router.get("/example", authenticate, yourHandler);
```

Inside the handler, the user is available via `AuthenticatedRequest`:

```typescript
import { AuthenticatedRequest } from "../types/auth.types";

export const yourHandler = (req: Request, res: Response) => {
  const { authenticatedUser } = req as AuthenticatedRequest;
  // authenticatedUser.id, .email, .role, etc.
};
```

---

## Related

- **Client app:** `../client` — React frontend that consumes these auth endpoints.
- **Client env:** Set `VITE_API_URL=http://localhost:3000` to match this server.

---

## License

ISC
