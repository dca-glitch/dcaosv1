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
- `GET /api/v1/tenants/current` returns the server-derived current tenant context
- selection persistence is not implemented yet because the current session schema does not store a selected tenant
- explicit tenant switching should wait for a future schema/session decision

## Tenant Member Route

- `GET /api/v1/tenants/current/members` lists members for the active tenant
- `GET /api/v1/tenants/current/members/:membershipId` returns one member from the active tenant
- protect member reads with tenant context and permission checks

## Tenant Settings Route

- `GET /api/v1/tenants/current/settings` returns the active tenant profile
- `PATCH /api/v1/tenants/current/settings` updates only safe existing fields
- keep updates limited to schema-backed fields already present on `Tenant`

## Response Rule

- never return password hashes, raw tokens, or DB objects
- keep failures generic
