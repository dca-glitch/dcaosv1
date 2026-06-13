# DCA OS v1 - Data Access Layer Plan

## 1. Executive Summary

No API runtime integration yet.

The local migration exists, but the data access layer should be planned as a tenant-safe boundary before any runtime wiring happens.

## 2. Goals

- tenant-safe queries
- central Prisma access
- audit support
- no tenantId from request body
- typed service and repository boundaries

## 3. Proposed Package Boundary

Recommended locations:

- `packages/data/src/client`
- `packages/data/src/repositories`
- `packages/data/src/services`
- `packages/data/src/types`
- `packages/data/src/audit`

## 4. Tenant-Safe Query Pattern

- every tenant-scoped repository requires `tenantId` or tenant context
- `tenantId` comes from auth context later
- no raw `tenantId` from public request body
- cross-tenant admin access requires explicit system context

## 5. Core Repositories Later

- `tenantRepository`
- `userRepository`
- `membershipRepository`
- `roleRepository`
- `permissionRepository`
- `moduleRepository`
- `settingRepository`
- `auditLogRepository`

## 6. Audit Write Pattern

Use a dedicated append-only audit service contract.

Audit writes should be one-way and should never update or delete prior audit rows in normal application code.

## 7. Error and Result Pattern

Keep the repository layer explicit.

Prefer small, typed result objects or domain-specific errors instead of ad hoc throwing from every call site.

## 8. Testing Plan Later

- cross-tenant isolation tests
- denied access tests
- audit write tests

## 9. Open Decisions

- whether repositories return raw Prisma records or mapped domain objects
- whether the data package exports a shared error type set
- whether system-context operations are allowed in one service layer or isolated further

## 10. Recommended Next Step

Add the skeleton data package files and keep runtime integration blocked until Prisma Client strategy is approved.

