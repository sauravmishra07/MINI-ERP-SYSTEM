# Mini ERP — Client

React + Vite frontend for the Mini ERP Purchase Request Management Module. Provides email/password authentication with role selection, role-based dashboards, purchase request lifecycle management, and an audit trail.

**Local URL:** `http://localhost:5173`  
**Backend URL:** `http://localhost:3000`

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Routes and pages](#routes-and-pages)
- [Authentication flow](#authentication-flow)
- [Role-based access](#role-based-access)
- [Components](#components)
- [API layer](#api-layer)
- [Scripts](#scripts)

---

## Tech stack

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

## Prerequisites

- Node.js 18+
- The **server** running at `http://localhost:3000` (see `../server/README.md`)

---

## Project structure

```
client/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + 401 interceptor
│   │   ├── auth.js           # register, login, getMe, logout
│   │   ├── requests.js       # CRUD + submit/approve/reject + export URL
│   │   └── dashboard.js      # stats, activity
│   ├── components/
│   │   ├── ActivityTimeline.jsx
│   │   ├── ConfirmationModal.jsx
│   │   ├── DashboardCard.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FilterBar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   ├── Pagination.jsx
│   │   ├── PriorityBadge.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RequestTable.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Sidebar.jsx
│   │   └── StatusBadge.jsx
│   ├── constants/
│   │   └── index.js          # ROLES, STATUS, PRIORITY, badge colors, API_URL
│   ├── context/
│   │   └── AuthContext.jsx   # User session state (user, setUser, loading)
│   ├── hooks/
│   │   └── useRequests.js    # Fetch + filter + pagination hook
│   ├── layouts/
│   │   └── AppLayout.jsx     # Sidebar + Navbar shell
│   ├── pages/
│   │   ├── LoginPage.jsx     # Sign In + Register tabs with role selector
│   │   ├── DashboardPage.jsx
│   │   ├── RequestsPage.jsx
│   │   ├── CreateRequestPage.jsx
│   │   ├── RequestDetailPage.jsx
│   │   ├── ApprovalPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── utils/
│   │   └── index.js          # formatDate, timeAgo, getErrorMessage, buildQueryString
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Getting started

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Make sure the backend server is running first.

---

## Environment variables

Create a `.env` file in the `client/` folder:

```env
VITE_API_URL=http://localhost:3000
```

| Variable       | Required | Default                 | Description              |
| -------------- | -------- | ----------------------- | ------------------------ |
| `VITE_API_URL` | No       | `http://localhost:3000` | Backend API base URL     |

---

## Routes and pages

All routes except `/login` and `*` are protected — unauthenticated users are redirected to `/login`.

| Route           | Page                | Access               | Description                                                                 |
| --------------- | ------------------- | -------------------- | --------------------------------------------------------------------------- |
| `/login`        | `LoginPage`         | Public               | Sign In and Register tabs. Role selector on both forms.                     |
| `/`             | —                   | Protected            | Redirects to `/dashboard`.                                                  |
| `/dashboard`    | `DashboardPage`     | All roles            | Stats cards + recent activity timeline.                                     |
| `/requests`     | `RequestsPage`      | All roles            | Paginated request table with search, filters, and CSV export.               |
| `/requests/new` | `CreateRequestPage` | All roles            | Form to create a new purchase request (saved as `DRAFT`).                   |
| `/requests/:id` | `RequestDetailPage` | Owner / MANAGER / ADMIN | Full request details, audit trail, submit button for draft owners.       |
| `/approvals`    | `ApprovalPage`      | MANAGER / ADMIN only | Table of `SUBMITTED` requests with Approve / Reject actions.                |
| `*`             | `NotFoundPage`      | Public               | 404 page.                                                                   |

### Page details

#### `/login` — LoginPage

Two tabs: **Sign In** and **Register**.

**Register tab fields:**
- Full Name
- Company Email (must end with `@k95foods.com`)
- Password (min 6 characters)
- Role — `Employee` | `Manager` | `Admin`

**Sign In tab fields:**
- Company Email
- Password
- Role — must match the role stored in the database for that account

On success, the JWT cookie is set by the backend and the user is redirected to `/dashboard`.

#### `/dashboard` — DashboardPage

- Calls `GET /api/v1/dashboard/stats` → four stat cards: Total, Pending, Approved, Rejected.
- Calls `GET /api/v1/dashboard/activity` → activity timeline (last 10 audit log entries).
- Shows skeleton placeholders while loading.

#### `/requests` — RequestsPage

- Calls `GET /api/v1/requests` with active filter params.
- `SearchBar` filters by department.
- `FilterBar` filters by status, priority, and date range.
- `Pagination` appears when `totalPages > 1`.
- "Export CSV" opens `GET /api/v1/requests/export` with current filters.
- Shows `EmptyState` when no results.

#### `/requests/new` — CreateRequestPage

React Hook Form with validation. Fields: Item Name, Quantity, Unit, Department, Required Date, Reason, Priority. On success redirects to `/requests`.

#### `/requests/:id` — RequestDetailPage

Full request details with `StatusBadge` and `PriorityBadge`. Audit log rendered as `ActivityTimeline`. "Submit for Approval" button shown to draft owners.

#### `/approvals` — ApprovalPage

MANAGER/ADMIN only. Lists `SUBMITTED` requests. Each row has Approve and Reject buttons that open a `ConfirmationModal` with an optional remarks field.

#### `*` — NotFoundPage

404 with a link back to the dashboard.

---

## Authentication flow

1. User fills in the Register form → `POST /api/v1/auth/register` → JWT cookie set → redirect to `/dashboard`.
2. Returning user fills in Sign In form → `POST /api/v1/auth/login` → backend validates password and role → JWT cookie set → redirect to `/dashboard`.
3. On app load, `AuthContext` calls `GET /api/v1/auth/me` to restore the session from the cookie.
4. If the call fails (no cookie / expired), the user is unauthenticated and `ProtectedRoute` redirects to `/login`.
5. Logout calls `POST /api/v1/auth/logout`, clears the cookie, clears user state, redirects to `/login`.
6. Any `401` response from the Axios interceptor also redirects to `/login`.

---

## Role-based access

| Feature                       | EMPLOYEE | MANAGER | ADMIN |
| ----------------------------- | -------- | ------- | ----- |
| View dashboard                | Own data | All     | All   |
| View request list             | Own only | All     | All   |
| Create request                | ✅       | ✅      | ✅    |
| Submit own draft              | ✅       | —       | —     |
| View request details          | Own only | All     | All   |
| Approve / Reject requests     | —        | ✅      | ✅    |
| Approval Management page      | Hidden   | ✅      | ✅    |
| Export CSV                    | Own only | All     | All   |

The sidebar hides the "Approval Management" link for `EMPLOYEE` users. The `/approvals` route is wrapped in a `ProtectedRoute` that checks for `MANAGER` or `ADMIN` role.

---

## Components

| Component           | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `Sidebar`           | Left navigation with links, active route highlight, collapsible on mobile.   |
| `Navbar`            | Top bar with user avatar, name, and logout button.                           |
| `AppLayout`         | Shell combining `Sidebar` + `Navbar` + `<Outlet />`.                         |
| `ProtectedRoute`    | Redirects unauthenticated users to `/login`. Accepts optional `roles` prop.  |
| `DashboardCard`     | Stat card with icon, title, value, and loading skeleton.                     |
| `ActivityTimeline`  | Vertical timeline of audit log entries.                                      |
| `RequestTable`      | Responsive table of purchase requests. `showActions` prop for approve/reject.|
| `StatusBadge`       | Gray (DRAFT), blue (SUBMITTED), green (APPROVED), red (REJECTED).            |
| `PriorityBadge`     | Green (LOW), amber (MEDIUM), red (HIGH).                                     |
| `FilterBar`         | Dropdowns for status, priority, and date range.                              |
| `SearchBar`         | Text input filtering by department.                                          |
| `Pagination`        | Page controls, hidden when `totalPages ≤ 1`.                                 |
| `ConfirmationModal` | Modal with optional remarks textarea for approve/reject.                     |
| `EmptyState`        | Centered empty state with title, description, and optional action.           |
| `LoadingSpinner`    | Full-area centered spinner.                                                  |

---

## API layer

All calls go through `src/api/axios.js`:
- `baseURL` = `${VITE_API_URL}/api/v1`
- `withCredentials: true` — sends the `token` cookie on every request
- Response interceptor redirects to `/login` on `401`

| File               | Exports                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `api/auth.js`      | `register()`, `login()`, `getMe()`, `logout()`                                             |
| `api/requests.js`  | `createRequest()`, `getRequests()`, `getRequest()`, `submitRequest()`, `approveRequest()`, `rejectRequest()`, `getExportUrl()` |
| `api/dashboard.js` | `getStats()`, `getActivity()`                                                              |

---

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server on port 5173 |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run ESLint                         |

---

## Related

- **Server:** `../server` — Express + TypeScript API
- **Server env:** Ensure `FRONTEND_URL=http://localhost:5173` is set in `server/.env`

---

## License

ISC
