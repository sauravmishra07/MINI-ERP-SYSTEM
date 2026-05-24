# Mini ERP — Purchase Request Management Module

> Developed by **Saurav Mishra** for **K95 Foods Pvt. Ltd. | Toyo Kombucha**
> Frontend UI styling assisted by **Cursor** and **Kiro (AWS)**

A full-stack Mini ERP system that allows employees to raise purchase requests and managers/admins to review, approve, or reject them — with a complete audit trail, role-based access, CSV export, and a modern dashboard.

---

## Table of contents

- [Project overview](#project-overview)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment configuration](#environment-configuration)
- [Database setup](#database-setup)
- [Run instructions](#run-instructions)
- [Test accounts](#test-accounts)
- [Application routes](#application-routes)
- [Screenshots](#screenshots)
- [Features](#features)
- [API overview](#api-overview)
- [AI usage disclosure](#ai-usage-disclosure)
- [Known limitations and improvements](#known-limitations-and-improvements)

---

## Project overview

| Field              | Detail                                      |
| ------------------ | ------------------------------------------- |
| Assignment         | Mini ERP – Purchase Request Management Module |
| Company            | K95 Foods Pvt. Ltd. \| Toyo Kombucha        |
| Developer          | Saurav Mishra                               |
| Role               | Junior Full Stack Developer                 |
| Frontend URL       | http://localhost:5173                       |
| Backend URL        | http://localhost:3000                       |

---

## Tech stack

### Backend (`/server`)

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Runtime    | Node.js 18+                         |
| Framework  | Express 5                           |
| Language   | TypeScript                          |
| Database   | PostgreSQL                          |
| ORM        | Prisma 6                            |
| Auth       | JWT + bcryptjs (email/password)     |
| OAuth      | Passport.js + Google OAuth 2.0      |
| Validation | Zod                                 |
| Export     | json2csv                            |
| Logging    | Winston + daily-rotate-file         |

### Frontend (`/client`)

| Layer       | Technology          |
| ----------- | ------------------- |
| Framework   | React 19 + Vite     |
| Styling     | Tailwind CSS v3     |
| Routing     | React Router DOM v7 |
| HTTP client | Axios               |
| Forms       | React Hook Form     |
| Toasts      | React Hot Toast     |
| Icons       | Lucide React        |

---

## Project structure

```
Mini ERP System/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/              # Axios instance + API modules
│   │   ├── components/       # Reusable UI components
│   │   ├── constants/        # Roles, statuses, priorities, colors
│   │   ├── context/          # AuthContext (session state)
│   │   ├── hooks/            # useRequests (fetch + filter + pagination)
│   │   ├── layouts/          # AppLayout (sidebar + navbar shell)
│   │   ├── pages/            # Page components
│   │   └── utils/            # Date formatters, error helpers
│   ├── .env                  # Frontend env (VITE_API_URL)
│   └── package.json
│
├── server/                   # Express + TypeScript backend
│   ├── src/
│   │   ├── config/           # App, auth, logger, Passport config
│   │   ├── controllers/      # auth, requests, dashboard
│   │   ├── lib/              # Prisma client singleton
│   │   ├── middlewares/      # authenticate, requireRole, error handler
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   ├── seed.ts       # Seed script (test users + dummy data)
│   │   │   └── migrations/   # Prisma migration history
│   │   ├── routers/v1/       # auth, requests, dashboard, ping routers
│   │   ├── services/         # Business logic (auth service)
│   │   ├── types/            # AuthenticatedRequest type
│   │   ├── utils/            # JWT helpers, error classes
│   │   └── validators/       # Zod schemas
│   ├── .env                  # Server env (not committed)
│   ├── .env.example          # Template env file
│   └── package.json
│
└── README.md                 # This file
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** running locally (default port 5432)
- **npm** 9+
- *(Optional)* Google Cloud Console project with OAuth 2.0 credentials for Google sign-in

---

## Environment configuration

### Backend — `server/.env`

Create `server/.env` by copying the example:

```bash
cp server/.env.example server/.env
```

Then fill in your values:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mini_erp"
JWT_SECRET=replace-with-a-long-random-secret-string
FRONTEND_URL=http://localhost:5173
ALLOWED_EMAIL_DOMAIN=@k95foods.com

# Google OAuth — optional, only needed for "Continue with Google" button
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

| Variable               | Required | Default                   | Description                                     |
| ---------------------- | -------- | ------------------------- | ----------------------------------------------- |
| `PORT`                 | No       | `3001`                    | HTTP port — use `3000` locally                  |
| `DATABASE_URL`         | Yes      | —                         | PostgreSQL connection string                    |
| `JWT_SECRET`           | Yes      | —                         | Secret for signing JWT tokens (keep private)    |
| `FRONTEND_URL`         | No       | `http://localhost:5173`   | CORS origin + post-OAuth redirect               |
| `ALLOWED_EMAIL_DOMAIN` | No       | `@k95foods.com`           | Only emails with this domain can register/login |
| `GOOGLE_CLIENT_ID`     | No       | —                         | Google OAuth client ID                          |
| `GOOGLE_CLIENT_SECRET` | No       | —                         | Google OAuth client secret                      |
| `GOOGLE_CALLBACK_URL`  | No       | `…/auth/google/callback`  | Must match Google Console redirect URI          |
| `NODE_ENV`             | No       | —                         | Set to `production` for secure cookies          |

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:3000
```

| Variable       | Required | Default                 | Description          |
| -------------- | -------- | ----------------------- | -------------------- |
| `VITE_API_URL` | No       | `http://localhost:3000` | Backend API base URL |

---

## Database setup

### 1. Create the database

```sql
CREATE DATABASE mini_erp;
```

Or via psql:

```bash
psql -U postgres -c "CREATE DATABASE mini_erp;"
```

### 2. Run migrations

```bash
cd server
npm install
npm run prisma:migrate
```

This creates all tables: `users`, `purchase_requests`, `audit_logs`.

### 3. Seed test data

```bash
npm run prisma:seed
```

This inserts 3 test users and 11 dummy purchase requests across all statuses (DRAFT, SUBMITTED, APPROVED, REJECTED) with full audit trails.

---

## Run instructions

### Start the backend

```bash
cd server
npm install
npm run dev
```

Server starts at **http://localhost:3000**

### Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

App opens at **http://localhost:5173**

> Start the backend first — the frontend calls `/api/v1/auth/me` on load to restore the session.

### Production build (frontend)

```bash
cd client
npm run build
npm run preview
```

---

## Test accounts

All test accounts use the password: **`password123`**

| Role     | Email                      | Password      | Access level                                      |
| -------- | -------------------------- | ------------- | ------------------------------------------------- |
| Employee | `employee@k95foods.com`    | `password123` | Own requests only — create, submit, view          |
| Manager  | `manager@k95foods.com`     | `password123` | All requests — approve, reject, export            |
| Admin    | `admin@k95foods.com`       | `password123` | All requests — full access including admin panel  |

### How to sign in

1. Open http://localhost:5173
2. Click the **Sign In** tab
3. Enter the email and password from the table above
4. Select the matching **Role** from the dropdown
5. Click **Sign In**

> The role selector on the login form must match the role stored in the database. If you select the wrong role, the backend returns a `403` error.

---

## Application routes

| Route           | Page                  | Access               | Description                                                    |
| --------------- | --------------------- | -------------------- | -------------------------------------------------------------- |
| `/login`        | Login / Register      | Public               | Sign In and Register tabs with role selector + Google OAuth    |
| `/`             | —                     | Protected            | Redirects to `/dashboard`                                      |
| `/dashboard`    | Dashboard             | All roles            | Stats cards (total, pending, approved, rejected) + activity    |
| `/requests`     | Purchase Requests     | All roles            | Paginated table with search, filters, status badges, CSV export|
| `/requests/new` | Create Request        | All roles            | Form to create a new purchase request (saved as DRAFT)         |
| `/requests/:id` | Request Details       | Owner / Manager / Admin | Full details, audit trail, submit button for draft owners   |
| `/approvals`    | Approval Management   | Manager / Admin only | Review SUBMITTED requests — approve or reject with remarks     |
| `*`             | 404 Not Found         | Public               | Friendly 404 page                                              |

---

## Screenshots

### Login / Register page
![Login / Register page](docs/images/authpage.png)

### Employee — Dashboard
![Employee Dashboard](docs/images/employee-dashboard.png)

### Admin / Manager — Dashboard
![Admin and Manager Dashboard](docs/images/admin-manager-dashboard.png)

### Employee — Purchase Requests list
![Employee Purchase Requests](docs/images/employee-purchaserequest.png)

### Admin / Manager — Purchase Requests list
![Admin and Manager Purchase Requests](docs/images/admin-manager-purchase-req.png)

### Create Request form
![Create Request Form](docs/images/request-form.png)

### Admin — Approval Management
![Approval Management](docs/images/admin-approval-management.png)

---

## Features

### Feature 1 — Authentication
- Email + password registration and login with company domain restriction (`@k95foods.com`)
- Role selection at login — backend validates role matches stored value
- Optional Google OAuth 2.0 sign-in
- JWT stored in httpOnly cookie (7-day expiry)
- Session restored on page load via `/auth/me`
- Auto-redirect to `/login` on `401` responses

### Feature 2 — Dashboard
- Total, Pending, Approved, Rejected request counts (scoped by role)
- Recent activity timeline — last 10 audit log entries
- Loading skeleton states

### Feature 3 — Purchase Request Form
- Fields: Item Name, Quantity, Unit, Department, Required Date, Reason, Priority
- Full client-side validation with React Hook Form
- Inline field error messages

### Feature 4 — Request Status Workflow
```
DRAFT → SUBMITTED → APPROVED
                  ↘ REJECTED
```
Every status transition writes an immutable AuditLog entry.

### Feature 5 — Approval Management
- Managers and Admins see all SUBMITTED requests
- Approve or Reject with a single click
- Optional remarks/comments on every decision
- Confirmation modal before action

### Feature 6 — Search and Filters
- Search by department (partial match)
- Filter by status, priority, and date range
- Filters persist across pagination

### Feature 7 — Audit Log
- Every status change recorded with action, old/new status, performer, timestamp, and optional remarks
- Displayed as a visual timeline on the Request Details page
- Recent activity shown on the Dashboard

### Feature 8 — Export
- CSV export of purchase requests
- Export respects currently active filters
- Columns: id, itemName, quantity, unit, department, requiredDate, priority, status, reason, createdByName, createdByEmail, createdAt

---

## API overview

Base path: `http://localhost:3000/api/v1`

### Auth

| Method | Endpoint              | Auth     | Description                          |
| ------ | --------------------- | -------- | ------------------------------------ |
| POST   | `/auth/register`      | None     | Register with email, password, role  |
| POST   | `/auth/login`         | None     | Login — validates password and role  |
| GET    | `/auth/me`            | Required | Returns current user                 |
| POST   | `/auth/logout`        | Required | Clears cookie                        |
| GET    | `/auth/google`        | None     | Start Google OAuth flow              |

### Purchase Requests

| Method | Endpoint                  | Roles              | Description                    |
| ------ | ------------------------- | ------------------ | ------------------------------ |
| POST   | `/requests`               | All                | Create request (DRAFT)         |
| GET    | `/requests`               | All (scoped)       | List with filters + pagination |
| GET    | `/requests/export`        | All (scoped)       | Download CSV                   |
| GET    | `/requests/:id`           | Owner / Mgr / Admin| Single request + audit log     |
| PATCH  | `/requests/:id/submit`    | Owner only         | Submit DRAFT for approval      |
| PATCH  | `/requests/:id/approve`   | Manager / Admin    | Approve SUBMITTED request      |
| PATCH  | `/requests/:id/reject`    | Manager / Admin    | Reject SUBMITTED request       |

### Dashboard

| Method | Endpoint               | Roles        | Description                    |
| ------ | ---------------------- | ------------ | ------------------------------ |
| GET    | `/dashboard/stats`     | All (scoped) | Total, pending, approved, rejected counts |
| GET    | `/dashboard/activity`  | All (scoped) | Last 10 audit log entries      |

---

## AI usage disclosure

This project was built with AI assistance. Full transparency below as required by the assignment.

### Tools used

| Tool   | Purpose                                                  |
| ------ | -------------------------------------------------------- |
| Kiro (AWS) | Primary AI IDE used for backend and frontend code generation, debugging, and architecture decisions |
| Cursor | Frontend UI layout, Tailwind CSS styling, and component design |

### Key prompts used

1. **Full frontend scaffold prompt** — A detailed prompt specifying the complete tech stack (React + Vite, Tailwind, React Router, Axios, React Hook Form, React Hot Toast, Lucide React), all required pages (Login, Dashboard, Requests, Create, Detail, Approvals, 404), all components (Sidebar, Navbar, StatusBadge, PriorityBadge, ActivityTimeline, RequestTable, Pagination, FilterBar, SearchBar, ConfirmationModal, EmptyState, LoadingSpinner), folder structure, role-based UI rules, and API integration requirements.

2. **Auth replacement prompt** — "Replace Google-only OAuth with email/password register and login. At login, user selects their role and the backend validates it matches the stored role. Keep Google OAuth as an optional button."

3. **Seed data prompt** — "Add dummy data with 3 test users (employee, manager, admin) and realistic purchase requests across all statuses with full audit trails."

4. **Bug fix prompt** — "Backend is logging repeated 401 UnauthorizedError. The Google sign-in button is missing from the login page."

### AI-assisted modules

| Module / Feature                  | AI involvement                                                  |
| --------------------------------- | --------------------------------------------------------------- |
| Full frontend folder structure    | AI-generated (Kiro)                                             |
| All page components               | AI-generated (Kiro + Cursor for styling)                        |
| Sidebar, Navbar, AppLayout        | AI-generated with Tailwind styling (Cursor)                     |
| Dashboard stats cards + timeline  | AI-generated layout (Cursor), API wiring (Kiro)                 |
| RequestTable + FilterBar          | AI-generated (Kiro)                                             |
| ConfirmationModal with remarks    | AI-generated (Kiro)                                             |
| StatusBadge + PriorityBadge       | AI-generated (Kiro)                                             |
| Auth context + ProtectedRoute     | AI-generated (Kiro)                                             |
| Axios instance + interceptors     | AI-generated (Kiro)                                             |
| Email/password auth (backend)     | AI-generated with bcryptjs + role validation (Kiro)             |
| Prisma schema + migrations        | AI-assisted (Kiro)                                              |
| Seed script                       | AI-generated (Kiro)                                             |
| Server README + Client README     | AI-generated (Kiro)                                             |

### Bugs debugged manually

1. **401 redirect loop** — `AuthContext` calls `/auth/me` on every load. When unauthenticated, the backend returns `401`, the Axios interceptor redirected to `/login`, which reloaded the app, which called `/auth/me` again — infinite loop. Diagnosed by reading the interceptor logic and `AuthContext` together. Fixed by adding a URL check in the interceptor to skip the redirect for `/auth/me` calls specifically.

2. **Prisma client stale types** — After adding the `password` field to the schema and running `prisma migrate`, the TypeScript language server still showed errors because it was using a cached version of the generated client. Resolved by running `prisma generate` explicitly and confirming the field existed in `node_modules/.prisma/client/index.d.ts`.

3. **Migration timeout** — `prisma migrate dev` timed out in the shell because it waits for interactive input. Resolved by passing `--skip-seed` flag and running `prisma migrate deploy` separately.

4. **Google button missing after auth refactor** — When the login page was rewritten to support email/password, the Google OAuth button was accidentally removed. Identified by reviewing the rendered UI, then re-added with the correct `href` pointing to the backend OAuth route.

### Manual testing performed

- Registered new accounts for all three roles via the Register tab
- Signed in with each role and verified correct sidebar items and page access
- Created purchase requests as Employee and verified DRAFT status
- Submitted a DRAFT request and verified status changed to SUBMITTED
- Logged in as Manager and approved a request with remarks — verified audit log updated
- Logged in as Manager and rejected a request — verified status and remarks
- Tested role mismatch on login (selecting wrong role) — verified `403` error toast
- Tested wrong domain email on register — verified `403` error toast
- Tested CSV export with active filters — verified downloaded file matched filtered data
- Tested pagination on the requests list
- Tested 401 redirect — cleared cookies manually and verified redirect to `/login`
- Tested 404 page by navigating to an unknown route

---

## Known limitations and improvements

| # | Limitation / Issue                                                                 | Suggested improvement                                              |
|---|------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| 1 | No email verification on registration — any valid-domain email can register        | Add email verification flow with a confirmation link               |
| 2 | No password reset / forgot password flow                                           | Implement reset via email OTP or link                              |
| 3 | Role is self-selected at registration — no admin approval of role assignments      | Add an admin panel to manage user roles after registration         |
| 4 | No real-time notifications when a request is approved/rejected                     | Add WebSocket or polling-based notifications                       |
| 5 | CSV export opens in a new tab (browser download) — no progress indicator           | Stream the download with a loading state                           |
| 6 | No edit functionality for DRAFT requests                                           | Allow editing item details before submission                       |
| 7 | Dashboard charts are placeholder — no visual chart library integrated              | Integrate Recharts or Chart.js for trend visualisation             |
| 8 | No unit or integration tests                                                       | Add Vitest for frontend and Jest/Supertest for backend             |
| 9 | Google OAuth requires real Google Cloud credentials to work                        | Document setup steps more clearly or provide a mock OAuth option   |
| 10| No deployment configuration included                                               | Add Dockerfile + docker-compose for easy local and cloud deployment|

---

## License

ISC

---

*Developed by Saurav Mishra for K95 Foods Pvt. Ltd. | Toyo Kombucha*
*Frontend UI styling assisted by Cursor and Kiro (AWS)*
