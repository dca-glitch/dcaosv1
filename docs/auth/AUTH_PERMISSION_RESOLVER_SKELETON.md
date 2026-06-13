# Auth Permission Resolver Skeleton

This block records the permission resolver boundary used by the auth phase before any real RBAC enforcement.

## Implemented

- `apps/api/src/auth/permission.resolver.ts`
- request-context-only inspection
- fail-closed, unenforced results

## Not Implemented

- role lookup from persistence
- permission lookup from persistence
- TenantMembership lookup
- RBAC enforcement
- route protection wiring

## Safety Note

Permission decisions stay skeletal until database-backed auth and RBAC runtime are approved.
