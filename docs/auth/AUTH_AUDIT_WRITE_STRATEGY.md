# Auth Audit Write Strategy

This document defines the future auth audit event shape for the controlled auth MVP.

No runtime audit implementation is added here.

## 1. Event Set

- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `auth.session.revoked`
- `auth.password.changed`
- `auth.password.reset_by_admin`
- `auth.permission.denied`
- `admin.user.created`
- `admin.user.updated`
- `admin.membership.updated`
- `admin.role.updated`
- `admin.module_access.updated`

## 2. Actor Rules

- `actorType` is required on every audit event.
- `actorUserId` is required for user-scoped events.
- `actorUserId` may be null for system or platform bootstrap events.
- `tenantId` is required for tenant-scoped user actions.
- `tenantId` is nullable only for platform, system, or bootstrap events.

## 3. Metadata Rules

- metadata must never contain secrets
- metadata should not include raw password material
- metadata should not include session tokens or signing secrets
- include `ipAddress` when available
- include `userAgent` when available

## 4. Login and Failure Rules

- failed login events should avoid user enumeration
- failure metadata should stay generic
- the audit event should not reveal whether an account exists

## 5. Admin Reset Rules

- admin password reset should revoke existing sessions
- admin reset should emit a dedicated audited event
- admin reset should not leave stale active sessions behind

## 6. Recommended Shape Later

Future runtime code should write to the same append-only audit stream used by the database design.
