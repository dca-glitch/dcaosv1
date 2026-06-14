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

## Response Rule

- never return password hashes, raw tokens, or DB objects
- keep failures generic
