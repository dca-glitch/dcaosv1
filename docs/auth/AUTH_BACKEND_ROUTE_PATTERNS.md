# DCA OS v1 - Auth Backend Route Patterns

## Public Route

- no auth middleware
- no tenant middleware
- safe for login and discovery endpoints only

## Authenticated Route

- `requireAuth`
- returns user-scoped data only
- no tenant selection from request input

## Tenant-Aware Route

- `requireAuth`
- `requireTenant`
- derives active membership from server context
- denies by default when no active membership exists
- does not trust tenantId from body, query, or arbitrary headers

## Permission-Protected Route

- `requireAuth`
- `requireTenant`
- `requireRole(...)` or `requirePermission(...)`
- returns `AUTH_FORBIDDEN` when authenticated access is insufficient

## Tenant List And Current Route

- `GET /api/v1/tenants` returns the authenticated user's available active memberships
- `GET /api/v1/tenants/current` returns the session-selected current tenant context
- active tenant selection is stored on `Session.activeTenantMembershipId`
- session context resolves the selected active membership when it still belongs to the authenticated user and remains active
- if the stored selected membership is null or stale, session context falls back to the first active membership for compatibility
- `/current` routes use the server-resolved session membership and do not accept tenant ids from body, query, or arbitrary headers

## Tenant Switch Route

- `POST /api/v1/tenants/current/switch` switches only the current authenticated session
- request body must contain `tenantMembershipId`, not `tenantId`
- route uses `requireAuth`; it validates the requested membership against the authenticated user
- requested membership must belong to the authenticated user and be active
- related tenant must be active
- unauthorized, inactive, or unknown membership ids return a generic forbidden response
- switching does not change roles, memberships, users, tenants, or any other session

## Tenant Member Route

- `GET /api/v1/tenants/current/members` lists members for the active tenant
- `GET /api/v1/tenants/current/members/:membershipId` returns one member from the active tenant
- protect member reads with tenant context and permission checks

## Tenant Settings Route

- `GET /api/v1/tenants/current/settings` returns the active tenant profile
- `PATCH /api/v1/tenants/current/settings` updates only safe existing fields
- keep updates limited to schema-backed fields already present on `Tenant`

## Module Registry Route

- `GET /api/v1/modules` returns the global module catalog
- `GET /api/v1/modules/current` returns modules enabled for the current tenant
- `POST /api/v1/modules/current/:moduleKey/enable` enables a module for the current tenant
- `POST /api/v1/modules/current/:moduleKey/disable` disables a module for the current tenant
- catalog data stays server-owned; tenant routes require auth, tenant context, and `modules:manage`

## Response Rule

- never return password hashes, raw tokens, or DB objects
- keep failures generic
