# DCA OS v1 - Auth and Tenant Dependency Map

## 1. Executive Summary

No auth runtime implementation is included in this task.

No tenant middleware is included either. This document only maps the dependency chain after the DB-1 schema.

## 2. Dependency Chain

1. DB-1 schema
2. local DB setup
3. migration
4. Prisma client and data access plan
5. auth strategy approval
6. session strategy approval
7. password security requirements
8. auth middleware skeleton
9. tenant context middleware skeleton
10. RBAC permission middleware skeleton
11. frontend protected shell planning

## 3. Data Dependencies

Auth and tenant context will depend on:

- User
- Tenant
- TenantMembership
- Role
- Permission
- MembershipRole
- AuditLog

## 4. Request Context Shape Later

Future request context should include:

- `userId`
- `tenantId`
- `tenantMembershipId`
- `roles`
- `permissions`
- `requestId`

No implementation is approved here.

Current Phase 8 skeletons align the API type surface with this shape without mounting real enforcement.

## 5. Tenant Resolution Flow Later

1. login
2. tenant selection
3. membership verification
4. active tenant storage
5. protected API request
6. tenant-scoped query

## 6. RBAC Enforcement Flow Later

1. `requireAuth`
2. `requireTenant`
3. `requirePermission`
4. audit denied access

## 7. Open Decisions

- password policy
- hashing library
- session store
- tenant switch UX
- CSRF and rate-limit timing
- forced password change after admin reset

## 8. Recommended Next Step

Use this map after local DB and migration planning are approved.
