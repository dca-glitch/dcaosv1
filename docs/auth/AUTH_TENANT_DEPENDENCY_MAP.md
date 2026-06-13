# DCA OS v1 - Auth and Tenant Dependency Map

## 1. Executive Summary

No auth implementation is included in this task.

No tenant middleware is included either. This document only maps the dependency chain after the DB-1 schema.

## 2. Dependency Chain

1. DB-1 schema
2. local DB setup
3. migration
4. Prisma client and data access plan
5. auth strategy approval
6. session strategy approval
7. auth middleware
8. tenant context middleware
9. RBAC permission middleware
10. frontend protected shell

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

- auth provider
- session store
- tenant switch UX
- client portal auth path
- CSRF and rate-limit timing

## 8. Recommended Next Step

Use this map after local DB and migration planning are approved.
