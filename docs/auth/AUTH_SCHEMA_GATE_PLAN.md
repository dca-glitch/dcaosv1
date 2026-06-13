# DCA OS v1 - Auth Schema Gate Plan

## 1. Purpose

Define the exact future auth schema additions for the controlled password MVP.

This is planning only. It does not approve migrations or runtime auth.

## 2. Recommendation

Use email-first login for MVP.

- email is enough for a controlled platform with roughly 20 users across up to 5 companies/clients
- admin-created users can be uniquely managed by email
- email-first keeps the schema smaller and the login surface simpler
- username can remain deferred until there is a real need for it

## 3. Future `User` Fields

Likely future additions:

- `passwordHash`
- `passwordChangedAt`
- `forcePasswordChange`
- `failedLoginCount`
- `lockedUntil`
- `lastLoginAt`

Interaction notes:

- `User.status` and `User.deletedAt` should continue to represent deactivation and removal
- active session revocation should be driven by user status changes and password reset events

## 4. Future `Session` Model

Likely future fields:

- `id`
- `userId`
- `sessionTokenHash`
- `createdAt`
- `expiresAt`
- `revokedAt`
- `lastSeenAt`
- `ipAddress`
- `userAgent`

## 5. Session Rules

- store the token only as a hash in the database
- keep the browser cookie `httpOnly`
- keep the cookie `Secure` in production
- use `SameSite=Lax` or `SameSite=Strict`
- logout revokes the session
- user deactivation revokes sessions
- expiration is required

## 6. Password Reset and Admin Reset

- manual admin reset only for MVP
- force password change after reset is recommended
- no email reset flow in MVP
- no magic link in MVP

## 7. Lockout and Throttling

- track failed login count
- apply a temporary lockout after repeated failures
- audit failed login attempts
- avoid enterprise-heavy anti-abuse infrastructure for MVP

## 8. Audit Action Constants

Proposed audit actions:

- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `auth.session.revoked`
- `auth.password.reset_by_admin`
- `auth.password.changed`
- `auth.permission.denied`
- `admin.user.created`
- `admin.user.updated`
- `admin.membership.updated`
- `admin.role.updated`
- `admin.module_access.updated`

## 9. Explicit Schema Non-Goals

- no OAuth account table
- no OIDC provider table
- no magic link token table
- no MFA table
- no public registration table
- no invite token table unless separately approved
- no migrations in this block

## 10. Go / No-Go

Go for Block 18D.

The schema additions are minimal, fit the approved auth strategy, preserve `TenantMembership`/RBAC, and do not require introducing any external identity provider or runtime auth feature.
