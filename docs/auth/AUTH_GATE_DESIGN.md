# DCA OS v1 - Auth Gate Design

## 1. Executive Summary

This is design only.

- no auth runtime implementation is approved yet
- no password/session/JWT runtime code is approved yet
- database schema may include identity foundations only after DB-1 approval
- tenant context depends on auth but is not implemented yet

The auth gate should define a secure, simple, extensible path for a controlled admin-created password login system, with later expansion only if needed.

## 2. Auth Goals

The auth system should:

- secure access to DCA OS
- support internal DCA users and client users under the same controlled login model
- remain aware of multi-tenant membership
- apply least privilege
- support auditability
- stay ready for future deployment hardening
- keep the first MVP small and manageable

## 3. Non-Goals

This gate does not approve:

- auth implementation now
- OAuth setup now
- password reset implementation now
- email sending now
- session storage now
- production secrets now
- deployment now
- public registration now
- magic link now
- managed auth provider runtime now

## 4. Identity Model Alignment

Auth should align with the database plan:

- `User` is global identity
- `TenantMembership` controls tenant access
- roles attach to membership
- auth authenticates user identity
- tenant context authorizes workspace access
- no direct `UserRole` for tenant roles
- permission is system-defined in DB-1

## 5. Recommended Auth Strategy for v1

Recommended safest practical v1 path:

- controlled username/email + password login
- admin-created users only
- no public registration
- no self-signup
- no Google/OIDC for MVP
- no managed auth provider for MVP
- manual admin password reset for MVP
- DB-backed sessions with httpOnly cookies

Why this is the safest practical path:

- it matches the actual operating scale
- it keeps identity ownership inside the business
- it keeps the implementation understandable for a small team
- it avoids introducing provider complexity before the app needs it
- it keeps tenant membership and audit rules central

## 6. Session Strategy

Design direction:

- prefer cookie-based sessions over JWT for the app shell
- use `httpOnly` cookies
- use `secure` cookies in production
- use `sameSite=lax` by default unless a stricter mode is later approved
- protect state-changing requests with CSRF-aware controls as needed
- keep sessions short-lived enough to reduce risk
- define logout as session invalidation
- store the session token as a hash in the database

Session storage dependency:

- session storage is not implemented in this gate
- session storage should later live in a dedicated database session table if the auth and database gates explicitly approve that step

## 7. Password / Credential Strategy

- passwords must be hashed with a modern password hashing algorithm
- no plaintext passwords
- password reset must be rate-limited
- login throttling and lockout controls should be planned
- forced password change after admin reset is recommended
- failed login attempts should be audited

No password runtime code is approved yet.

## 8. Tenant Context Resolution

Design:

- the user authenticates as a global identity
- the user selects an active tenant after login if they belong to more than one tenant
- active tenant is stored in session/context, not supplied by request body
- API derives tenantId from authenticated context later
- membership is checked before tenant-scoped actions
- super-admin or system context is deferred and should not be assumed

## 9. RBAC Enforcement Plan

Design:

- authentication proves identity
- tenant membership proves workspace access
- RBAC proves action authorization
- middleware layers should be distinct later
- permission checks should use module/action keys
- role resolution should flow through TenantMembership
- denied access attempts should be audited
- client portal roles should remain minimal and isolated

## 10. API Security Design

Later API hardening should include:

- auth middleware
- tenant middleware
- permission middleware
- input validation
- rate limiting
- CORS
- security headers
- safe error responses
- request IDs and logging

The current API foundation should not be treated as authenticated just because routes exist.

## 11. Frontend Auth UX Plan

Later frontend auth work should include:

- login page
- tenant switcher
- protected route shell
- permission-aware navigation
- client portal separation

The frontend should not assume a selected tenant until auth is in place.

## 12. Audit and Security Events

Events to audit later:

- login success/failure
- logout
- password reset by admin
- role changed
- membership created/disabled
- tenant switched
- permission denied
- suspicious access

## 13. Secrets and Environment Variables

Future env vars should remain placeholders until needed:

- session store config
- cookie domain
- password reset operational settings if any

Rules:

- no real secrets in repo
- `.env` must remain ignored
- production secrets must be managed outside GitHub source

## 14. Auth Implementation Gate Checklist

Before implementation:

- DB-1 schema is approved
- session strategy is approved
- credential strategy is approved
- rate-limit strategy is approved
- tenant context strategy is approved
- RBAC middleware sequence is approved
- audit events are approved
- security review has passed

## 15. Recommended Auth Implementation Phases Later

1. auth design approval
2. DB identity model alignment
3. backend auth skeleton
4. session middleware
5. login/logout
6. tenant context
7. RBAC middleware
8. frontend protected shell
9. audit security events
10. tests and security review

## 16. Open Decisions for Human Approval

Open decisions:

- what exact password policy should v1 use?
- what hashing library should be used at implementation time?
- what session expiration and revocation rules should be used?
- should forced password change after admin reset be mandatory?
- what lockout thresholds should be used for the MVP?

## 17. Recommended Next Step

Safest next task:

**Proceed with auth schema dependency planning and password security review before any runtime implementation**
