# DCA OS v1 - Auth Runtime Preparation Plan

## 1. Purpose

Prepare the safe runtime boundaries for controlled password auth without implementing a real login flow.

This is Block 19A preparation only.

## 2. Scope Decision

Keep the active skeleton under `apps/api/src/auth/` for now.

That matches the existing repo structure and avoids a refactor into `src/modules/auth/` before the runtime implementation itself is approved.

## 3. Password Hashing Package Recommendation

Recommended later package: `argon2`

Why:

- modern password hashing design
- widely used for password storage
- good fit for a controlled business app

Fallback if build or native install issues appear later: `bcrypt`

This block does not install either package.

## 4. Future Env Vars

Document these future-only env vars:

- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_TTL_MINUTES`
- `AUTH_SESSION_SECURE_COOKIES`
- `AUTH_SESSION_SAME_SITE`
- `AUTH_PASSWORD_MIN_LENGTH`
- `AUTH_LOGIN_MAX_FAILED_ATTEMPTS`
- `AUTH_LOGIN_LOCKOUT_MINUTES`

Notes:

- `SESSION_SECRET` is not required for opaque DB-backed sessions in the approved MVP shape
- if a signing secret is ever recommended later, it should be documented as future-only until explicitly approved

## 5. Runtime Boundaries

The later runtime implementation should be split by responsibility:

- `auth.routes.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `password.service.ts`
- `session.service.ts`
- `auth.constants.ts`
- `auth.types.ts`

The current block may prepare constants and file boundaries, but it must not implement real credential checking, cookie issuance, session persistence, or database lookup.

## 6. Audit Boundary

Keep auth event names stable and centralized.

The runtime prep should align with these future audit actions:

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

## 7. Validation Guard Direction

The auth skeleton validator should continue to block:

- public registration runtime
- OIDC / OAuth runtime
- magic link runtime
- MFA runtime
- password hashing implementation
- migration files
- any real login or session behavior

## 8. Recommended Next Block

Proceed to controlled runtime implementation only after this preparation is committed and reviewed.
