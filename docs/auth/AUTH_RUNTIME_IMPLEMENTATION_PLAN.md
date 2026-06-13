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
