# Frontend Auth, Tenant, And Module Integration

## Runtime Calls

- `POST /api/v1/auth/login` signs in with controlled MVP credentials.
- `GET /api/v1/auth/me` loads the current authenticated user and session summary.
- `GET /api/v1/auth/context` loads active tenant roles and effective permissions.
- `POST /api/v1/auth/logout` revokes the current session token.
- `GET /api/v1/tenants` lists tenant memberships available to the signed-in user.
- `POST /api/v1/tenants/current/switch` switches the active membership for the current session.
- `GET /api/v1/modules` lists the global module catalog.
- `GET /api/v1/modules/current` lists module enablement for the active tenant.
- `POST /api/v1/modules/current/:moduleKey/enable` enables a module for the active tenant.
- `POST /api/v1/modules/current/:moduleKey/disable` disables a module for the active tenant.
- `GET /api/v1/tenants/current/members` lists active members for the current tenant.
- `GET /api/v1/tenants/current/settings` loads the current tenant's read-only settings summary.

## Frontend Rules

- Keep login public and keep app shell views behind a loaded session.
- Use the backend-issued bearer token as the controlled MVP credential.
- Store the token only in tab-scoped session storage for this MVP shell.
- Do not log tokens, credentials, password hashes, session token hashes, cookies, or auth headers.
- Derive tenant and permission state from `/auth/context` and `/tenants`; do not trust tenant ids from user input.
- Hide or disable module management actions unless the active context has `modules:manage`, `owner`, or `admin`.
- Keep Team and Settings read-only until invite, role editing, and settings mutation gates are approved.

## Pages

- Dashboard shows the authenticated user, current tenant, active roles, and permission count.
- Tenants lists available tenant memberships and switches the current session membership.
- Modules shows the global module catalog and current tenant enablement.
- Team lists current tenant members when the user has `users:read`.
- Settings shows user profile context and tenant settings summary when the user has `settings:read`.

## Out Of Scope

- OAuth.
- Password reset.
- Invite flow.
- Account registration.
- Billing.
- Marketplace.
- Finance Lite runtime mounting.
- Role editing or tenant administration UI.
- Settings mutation and destructive account actions.
