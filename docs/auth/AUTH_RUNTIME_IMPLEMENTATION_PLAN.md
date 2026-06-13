# DCA OS v1 - Auth Runtime Implementation Plan

## 1. Purpose

Define the runtime auth implementation shape for later work.

This is a plan only. No runtime auth is implemented here.

## 2. Backend Routes Later

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- optional `POST /api/v1/auth/change-password`
- admin password reset later under users/admin, not public auth

## 3. Service Boundaries

- auth routes
- auth controller
- auth service
- session service
- password service
- audit service integration
- tenant access resolver
- permission resolver
- module entitlement resolver

## 3A. Session Persistence Boundary

- session persistence remains blocked until the database/runtime gate is approved
- the current boundary functions return controlled not-implemented results
- no Prisma DB access is wired yet

## 3B. Route Skeleton

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- existing placeholder auth routes remain as non-runtime skeletons

## 3C. Auth Context Middleware Skeleton

- auth context middleware remains fail closed
- tenant and permission middleware remain skeleton-only
- no active route protection is wired yet

## 3D. Tenant Access Resolver Skeleton

- request-context interpretation only
- no `TenantMembership` database lookup
- no permission or module entitlement resolution
- no protected-route wiring yet

## 3E. Permission Resolver Skeleton

- request-context-only inspection
- no persistence-backed RBAC lookup
- fail closed and unenforced

## 3F. Module Access Resolver Skeleton

- request-context-only inspection
- no module entitlement lookup
- fail closed and unenforced

## 3G. Auth Implementation Preflight Gate

- document the boundary before real auth runtime
- stop auth implementation until database/runtime gate approval
- no active route protection is wired yet

## 4. Login Flow

1. validate credentials
2. check user status
3. check password hash
4. reset or increment failed login count
5. create a session token
6. store the hashed token
7. set the httpOnly cookie
8. audit success or failure

## 5. Protected Request Flow

Session cookie -> session lookup -> user -> selected tenant -> TenantMembership -> roles -> permissions -> TenantModule -> handler

## 6. Logout Flow

- revoke the session
- clear the cookie
- audit logout

## 7. Admin Password Reset Flow

- DCA admin resets password manually
- set the new hash
- set `forcePasswordChange = true`
- revoke existing sessions
- audit the event

## 8. Permission Denied Flow

- deny with a safe response
- audit permission denied without leaking secrets

## 9. Cookie / Env Requirements

- document required future env vars only
- do not add secrets yet
- `SESSION_SECRET` is not required for opaque DB-backed sessions
- if a signing secret is later recommended, treat it as future-only until approved

## 10. Frontend Later

- login page
- current user endpoint
- tenant selector if the user belongs to multiple tenants
- route guards
- logout button
- forced password change screen if required

## 11. Security Review Checklist

- no plaintext passwords
- no token plaintext in DB
- no secrets in `AuditLog`
- no public registration
- no `tenantId` from request body for protected operations
- no cross-tenant role leaks
- no runtime tenant lookup before gate approval
- no runtime permission or module entitlement lookup before gate approval

## 12. Recommended Next Block

Proceed to the next controlled implementation block only after schema changes are validated and reviewed.

## 13. Blocked Items

- runtime auth implementation
- login/logout endpoints
- frontend login UI
- password hashing runtime
- public registration
- MFA
- external auth provider runtime
- migration and `db push`
