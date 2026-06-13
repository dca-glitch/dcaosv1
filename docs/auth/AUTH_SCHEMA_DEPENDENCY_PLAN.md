# DCA OS v1 - Auth Schema Dependency Plan

## 1. Purpose

Document the schema shape that the controlled password MVP will likely need later. This file does not approve schema edits in the current phase.

## 2. Current Rule

Do not change Prisma schema in this phase.

The schema work below is planning only and should be implemented only after the relevant gate is approved.

## 3. Likely User Model Additions

Future `User` fields may include:

- `passwordHash`
- `passwordChangedAt`
- `forcePasswordChange`
- `failedLoginCount`
- `lockedUntil`
- `lastLoginAt`
- optional `deletedAt` / `status` interaction notes for deactivation and session revocation

Email-first login is the recommended MVP direction. A username field should stay deferred unless a later review proves it is necessary.

## 4. Likely Session Model

A future `Session` table should likely include:

- `id`
- `userId`
- `sessionTokenHash`
- `createdAt`
- `expiresAt`
- `revokedAt`
- `lastSeenAt`
- `ipAddress`
- `userAgent`

## 5. Possible Admin Reset Tracking

The password reset flow may later need one of the following:

- `passwordResetRequestedAt`
- `passwordResetByUserId`
- `passwordResetNote`
- or a separate reset token table if a more formal reset flow is approved

## 6. Audit Event Constants

Audit action names should stay consistent with the controlled auth model. Proposed constants:

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

## 7. Model Alignment Rules

- `TenantMembership` remains the canonical tenant access boundary
- roles attach to `TenantMembership`, not directly to `User`
- permission is system-defined in DB-1
- `AuditLog` remains append-only
- `AuditLog.actorType` stays part of the design

## 8. Blocked Until Later

- schema migration
- schema push
- runtime auth
- runtime session management
- runtime password reset
- runtime lockout enforcement
