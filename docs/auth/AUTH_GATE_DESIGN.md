# DCA OS v1 - Auth Gate Design

## 1. Executive Summary

This is design only.

- no auth implementation is approved yet
- no password/session/JWT code is approved yet
- database schema may include identity foundations only after DB-1 approval
- tenant context depends on auth but is not implemented yet

The auth gate should define a secure, simple, extensible path for internal DCA access first, with later support for client portal users.

## 2. Auth Goals

The auth system should:

- secure access to DCA OS
- support internal DCA users
- support future client portal users
- remain aware of multi-tenant membership
- apply least privilege
- support auditability
- stay ready for future deployment hardening

## 3. Non-Goals

This gate does not approve:

- auth implementation now
- OAuth setup now
- password reset implementation now
- email sending now
- session storage now
- production secrets now
- deployment now

## 4. Identity Model Alignment

Auth should align with the database plan:

- `User` is global identity
- `TenantMembership` controls tenant access
- roles attach to membership
- auth authenticates user identity
- tenant context authorizes workspace access
- no direct `UserRole` for tenant roles

## 5. Recommended Auth Strategy for v1

Options to consider:

| Option | Strengths | Risks | Fit for DCA OS v1 |
|---|---|---|---|
| A. Email/password first-party auth | Familiar, self-contained | Password reset, storage, throttling, more security surface | Viable, but heavier for v1 |
| B. Magic link | Simpler, no passwords | Email dependency, token delivery, token replay controls | Good for medium-security internal tools |
| C. OAuth/Google Workspace | Strong for internal DCA users, less credential burden | Client portal may need additional paths | Strong fit for internal-first rollout |
| D. External auth provider | Fastest way to production-grade auth controls | Provider lock-in, setup complexity | Good if the team already wants managed identity |

Recommended safest practical v1 path:

- use an external identity provider or Google Workspace-style OIDC flow for internal DCA users first
- keep the session and tenant-context model inside DCA OS
- plan a later invite or magic-link path for client portal users if needed

Why this is the safest practical path:

- avoids storing passwords in the first auth pass
- fits internal DCA users first
- keeps later client portal expansion possible
- reduces the amount of credential handling logic needed in the app itself

## 6. Session Strategy

Design direction:

- prefer cookie-based sessions over JWT for the app shell
- use `httpOnly` cookies
- use `secure` cookies in production
- use `sameSite=lax` by default unless a stricter mode is later approved
- protect state-changing requests with CSRF-aware controls as needed
- keep sessions short-lived enough to reduce risk
- define logout as session invalidation

Session storage dependency:

- session storage is not implemented in this gate
- session storage may later live in a dedicated session store or in DB-1 if the auth and database gates explicitly approve that step

## 7. Password / Credential Strategy

If first-party auth is later chosen:

- passwords must be hashed with a modern password hashing algorithm
- no plaintext passwords
- password reset must be rate-limited
- email verification should be part of the later flow
- login throttling and lockout controls should be planned

If external auth or OIDC is used:

- the provider handles primary credential verification
- DCA OS should still manage session security, tenant context, and audit events

No password code is approved yet.

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
- password reset request/complete
- invitation sent/accepted
- role changed
- membership created/disabled
- tenant switched
- permission denied
- suspicious access

## 13. Secrets and Environment Variables

Future env vars should remain placeholders until needed:

- session secret
- cookie domain
- auth provider credentials if any
- email provider keys if any

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
- email/provider strategy is approved if needed
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

- should v1 use external auth provider/OIDC, magic link, or a first-party login system?
- should internal DCA users authenticate through workspace SSO or a simpler invite-based path?
- should client portal access reuse the same auth strategy or have a constrained separate path later?
- should sessions be backed by a database table later or by another store?
- should CSRF protections be implemented before any state-changing authenticated endpoints?

## 17. Recommended Next Step

Safest next task:

**Proceed with DB-1 schema implementation without migrations first**
