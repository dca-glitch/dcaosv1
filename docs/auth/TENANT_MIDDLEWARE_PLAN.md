# DCA OS v1 - Tenant Middleware Plan

## 1. Executive Summary

No implementation yet.

## 2. Goals

- derive active tenant from authenticated context
- verify TenantMembership
- attach TenantContext to request
- block cross-tenant access
- avoid tenantId from request body

## 3. Required Inputs

- authenticated userId
- selected or active tenantId from session or context
- TenantMembership lookup
- membership status
- roles and permissions later

## 4. Tenant Resolution Flow

1. require authenticated user
2. determine active tenant
3. verify membership
4. load role and permission context
5. attach request context
6. continue route

## 5. Forbidden Patterns

- tenantId from body for protected operations
- direct cross-tenant lookup
- silent fallback to first tenant
- controller-level ad hoc tenant filtering
- direct Prisma in route

## 6. Error Handling

Plan for these cases:

- unauthenticated
- no active tenant
- membership disabled
- tenant disabled
- forbidden cross-tenant access

## 7. Audit Events

- tenant switch
- denied membership
- disabled membership access
- suspicious tenant mismatch

## 8. Future Implementation Files

Suggested future locations only:

- `apps/api/src/types/request-context.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/middleware/tenant.middleware.ts`
- `apps/api/src/middleware/permission.middleware.ts`

## 9. Test Plan Later

- cross-tenant leak tests
- disabled membership tests
- tenant body spoof tests

## 10. Open Decisions

- active tenant selection UX
- tenant switch persistence
- system-context handling
- audit severity for repeated mismatch attempts
