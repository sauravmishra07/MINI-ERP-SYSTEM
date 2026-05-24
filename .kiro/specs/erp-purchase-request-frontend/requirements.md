# Requirements Document

## Introduction

A complete React.js frontend for a Mini ERP Purchase Request Management Module. The application provides Google OAuth authentication, role-based dashboards, purchase request lifecycle management (create, submit, approve, reject), and an audit trail. It consumes a REST API at `http://localhost:3000` and runs on `http://localhost:5173`.

## Glossary

- **App**: The React.js single-page application
- **AuthContext**: The React context that holds the authenticated user state
- **User**: An authenticated person with a role of `EMPLOYEE`, `MANAGER`, or `ADMIN`
- **PurchaseRequest**: A record representing a request to purchase items, with statuses `DRAFT`, `SUBMITTED`, `APPROVED`, or `REJECTED`
- **AuditLog**: An immutable record of a status change or action performed on a PurchaseRequest
- **ProtectedRoute**: A route wrapper that redirects unauthenticated users to the login page
- **API**: The backend REST API at `http://localhost:3000/api/v1`
- **Dashboard**: The landing page after login showing stats and recent activity
- **ApprovalPage**: The page where MANAGER and ADMIN users review and act on submitted requests
- **StatusBadge**: A visual label component displaying a PurchaseRequest status
- **PriorityBadge**: A visual label component displaying a PurchaseRequest priority
- **Toast**: A transient notification shown to the user after an action

---

## Requirements

### Requirement 1: Authentication

**User Story:** As a user, I want to sign in with my Google account, so that I can securely access the ERP system.

#### Acceptance Criteria

1. THE App SHALL display a Login page at the `/login` route with a "Sign in with Google" button.
2. WHEN the user clicks "Sign in with Google", THE App SHALL redirect the browser to `GET /api/v1/auth/google`.
3. WHEN the OAuth callback succeeds, THE App SHALL redirect the user to the Dashboard page.
4. WHEN the URL contains an `?error=` query parameter on the login page, THE App SHALL display the decoded error message to the user.
5. WHEN the user clicks "Logout", THE App SHALL call `POST /api/v1/auth/logout`, clear the local user state, and redirect to `/login`.
6. THE AuthContext SHALL call `GET /api/v1/auth/me` on application load to restore the authenticated user session.
7. IF `GET /api/v1/auth/me` returns a non-2xx response, THEN THE AuthContext SHALL treat the user as unauthenticated.
8. THE ProtectedRoute SHALL redirect unauthenticated users to `/login` before rendering any protected page.
9. WHILE the AuthContext is loading the user session, THE App SHALL display a full-page loading spinner.

---

### Requirement 2: Navigation and Layout

**User Story:** As a user, I want a consistent navigation layout, so that I can move between pages efficiently.

#### Acceptance Criteria

1. THE App SHALL render a Sidebar with navigation links for: Dashboard, Purchase Requests, Create Request, and (for MANAGER/ADMIN) Approval Management.
2. THE Sidebar SHALL highlight the currently active route.
3. THE Navbar SHALL display the authenticated user's name, avatar, and a Logout button.
4. WHERE the user role is `EMPLOYEE`, THE App SHALL hide the Approval Management link from the Sidebar.
5. THE App SHALL render a 404 Not Found page for any unmatched route.
6. THE App SHALL be responsive, with the Sidebar collapsible on smaller viewports.

---

### Requirement 3: Dashboard

**User Story:** As a user, I want to see a summary of my purchase requests, so that I can quickly understand the current state of activity.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE App SHALL call `GET /api/v1/dashboard/stats` and display four stat cards: Total, Pending, Approved, and Rejected.
2. WHEN the Dashboard page loads, THE App SHALL call `GET /api/v1/dashboard/activity` and display the last 10 audit log entries in an ActivityTimeline component.
3. WHILE the stats or activity data is loading, THE App SHALL display loading skeleton placeholders.
4. IF the stats or activity API call fails, THEN THE App SHALL display an error message in place of the data.
5. THE ActivityTimeline SHALL display for each entry: the action performed, the item name, the performer's name, and the relative timestamp.

---

### Requirement 4: Purchase Request List

**User Story:** As a user, I want to browse and filter purchase requests, so that I can find specific requests quickly.

#### Acceptance Criteria

1. WHEN the Purchase Requests page loads, THE App SHALL call `GET /api/v1/requests` and display results in a RequestTable.
2. THE RequestTable SHALL display columns: Item Name, Department, Priority, Status, Requested By, Required Date, and Actions.
3. THE App SHALL provide a FilterBar allowing the user to filter by status, priority, department, and date range.
4. WHEN the user changes a filter, THE App SHALL re-fetch the request list with the updated query parameters.
5. THE App SHALL provide a SearchBar that filters by department using the `department` query parameter.
6. THE App SHALL render a Pagination component when `totalPages` is greater than 1.
7. WHEN the user clicks a page number, THE App SHALL fetch the corresponding page of results.
8. THE App SHALL provide an "Export CSV" button that triggers a download from `GET /api/v1/requests/export` with the current active filters applied.
9. WHILE the request list is loading, THE App SHALL display a loading spinner or skeleton rows.
10. IF the request list is empty, THEN THE App SHALL display an EmptyState component with a prompt to create a new request.
11. WHERE the user role is `EMPLOYEE`, THE App SHALL not display requests belonging to other users (enforced by the API).

---

### Requirement 5: Create Purchase Request

**User Story:** As a user, I want to create a new purchase request, so that I can initiate the procurement process.

#### Acceptance Criteria

1. THE Create Request page SHALL render a form with fields: Item Name, Quantity, Unit, Department, Required Date, Reason, and Priority.
2. THE App SHALL validate all fields using React Hook Form before submission.
3. THE form SHALL require: Item Name (non-empty), Quantity (positive number), Unit (non-empty), Department (non-empty), Required Date (valid future date), Reason (minimum 10 characters), Priority (one of `LOW`, `MEDIUM`, `HIGH`).
4. WHEN the form is submitted with valid data, THE App SHALL call `POST /api/v1/requests` with the form values.
5. WHEN the API returns a `201` response, THE App SHALL display a success Toast and redirect the user to the Purchase Requests page.
6. IF the API returns a `400` response, THEN THE App SHALL display the validation error message in a Toast.
7. WHILE the form submission is in progress, THE App SHALL disable the submit button and show a loading indicator.

---

### Requirement 6: Request Details

**User Story:** As a user, I want to view the full details and history of a purchase request, so that I can understand its current state and audit trail.

#### Acceptance Criteria

1. WHEN the Request Details page loads, THE App SHALL call `GET /api/v1/requests/:id` and display all request fields.
2. THE Request Details page SHALL display: Item Name, Quantity, Unit, Department, Required Date, Reason, Priority (as PriorityBadge), Status (as StatusBadge), Created By, and Created At.
3. THE Request Details page SHALL render the `auditLogs` array as an ActivityTimeline showing action, performer name, remarks, and timestamp for each entry.
4. WHERE the request status is `DRAFT` and the authenticated user is the owner, THE App SHALL display a "Submit for Approval" button.
5. WHEN the user clicks "Submit for Approval", THE App SHALL call `PATCH /api/v1/requests/:id/submit`.
6. WHEN the submit call succeeds, THE App SHALL display a success Toast and refresh the request data.
7. IF the API returns an error on submit, THEN THE App SHALL display the error message in a Toast.

---

### Requirement 7: Approval Management

**User Story:** As a MANAGER or ADMIN, I want to review and act on submitted purchase requests, so that I can approve or reject procurement needs.

#### Acceptance Criteria

1. THE Approval Management page SHALL only be accessible to users with role `MANAGER` or `ADMIN`.
2. WHEN the Approval Management page loads, THE App SHALL call `GET /api/v1/requests?status=SUBMITTED` and display results in a RequestTable.
3. THE RequestTable on the Approval Management page SHALL include "Approve" and "Reject" action buttons for each row.
4. WHEN the user clicks "Approve" or "Reject", THE App SHALL display a ConfirmationModal asking for optional remarks.
5. WHEN the user confirms approval, THE App SHALL call `PATCH /api/v1/requests/:id/approve` with optional remarks.
6. WHEN the user confirms rejection, THE App SHALL call `PATCH /api/v1/requests/:id/reject` with optional remarks.
7. WHEN an approve or reject action succeeds, THE App SHALL display a success Toast and refresh the request list.
8. IF an approve or reject API call fails, THEN THE App SHALL display the error message in a Toast.
9. IF the Approval Management page is accessed by an `EMPLOYEE`, THEN THE App SHALL redirect the user to the Dashboard page.

---

### Requirement 8: Status and Priority Badges

**User Story:** As a user, I want visual indicators for request status and priority, so that I can scan lists quickly.

#### Acceptance Criteria

1. THE StatusBadge component SHALL render `DRAFT` with a gray color, `SUBMITTED` with a blue color, `APPROVED` with a green color, and `REJECTED` with a red color.
2. THE PriorityBadge component SHALL render `LOW` with a green color, `MEDIUM` with a yellow/amber color, and `HIGH` with a red color.
3. THE StatusBadge and PriorityBadge SHALL be used consistently across the RequestTable, Request Details page, and Approval Management page.

---

### Requirement 9: Notifications

**User Story:** As a user, I want to receive feedback after performing actions, so that I know whether my actions succeeded or failed.

#### Acceptance Criteria

1. THE App SHALL use React Hot Toast to display Toast notifications.
2. WHEN any API mutation (create, submit, approve, reject, logout) succeeds, THE App SHALL display a success Toast.
3. WHEN any API mutation fails, THE App SHALL display an error Toast with the error message from the API response.
4. THE Toast SHALL auto-dismiss after a reasonable duration without requiring user interaction.

---

### Requirement 10: API Integration

**User Story:** As a developer, I want a centralized API layer, so that all HTTP calls are consistent and maintainable.

#### Acceptance Criteria

1. THE App SHALL configure an Axios instance with `baseURL` set to `VITE_API_URL` and `withCredentials: true`.
2. THE App SHALL define all API calls in dedicated modules under `src/api/`.
3. WHEN an API response has status `401`, THE App SHALL redirect the user to `/login`.
4. THE App SHALL use the Axios instance for all API calls, not the native `fetch` API.
