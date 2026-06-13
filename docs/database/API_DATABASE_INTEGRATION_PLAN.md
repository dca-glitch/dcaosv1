# DCA OS v1 - API Database Integration Plan

## 1. Executive Summary

No runtime integration now.

API DB integration remains blocked until approved. Auth and tenant context are still needed before protected tenant data access.

## 2. Integration Goals

- API imports data package only through an approved boundary
- request context maps to `TenantContext` later
- tenant-safe repositories
- audit write hooks
- consistent error handling

## 3. Non-Goals

- no auth implementation now
- no tenant middleware now
- no protected routes now
- no production DB now
- no deployment now

## 4. Required Dependency Chain

1. Prisma Client generation ready
2. data package boundary approved
3. auth strategy approved
4. session strategy approved
5. tenant context middleware approved
6. RBAC middleware approved
7. route integration approved

## 5. API Layer Pattern Later

- controller -> service -> data package repository
- no direct Prisma in controllers
- no raw tenantId from body
- tenant context from request
- audit on sensitive actions

## 6. Forbidden Patterns

- direct Prisma Client imports in API routes/controllers
- tenantId from request body for protected operations
- unchecked writes
- cross-tenant admin without explicit system context
- silent permission denial without audit for sensitive paths

## 7. Future Implementation Checklist

- approve runtime integration boundary
- wire request context
- verify tenant-safe reads
- verify audit writes
- add isolated tests

Phase 8 adds non-mounted request-context, middleware, and service skeletons only.

## 8. Open Decisions

- whether API uses thin services or richer domain services
- whether all reads go through repository methods or some shared query helpers
- whether system-context operations need separate handlers

## 9. Recommended Next Step

Keep runtime integration blocked until auth and tenant middleware are approved.
