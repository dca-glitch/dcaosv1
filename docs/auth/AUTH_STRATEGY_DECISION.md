# DCA OS v1 - Auth Strategy Decision

## 1. Executive Decision

For the DCA OS v1 MVP, use a controlled internal auth model:

- admin-created users only
- username/email + password login
- no public registration
- no self-signup
- no Google/OIDC required for MVP
- no Keycloak/Auth0/Clerk required for MVP
- no magic link required for MVP
- manual password reset by a DCA admin for MVP
- httpOnly cookie-based app sessions
- DB-backed sessions
- TenantMembership remains the tenant access boundary
- RBAC remains membership-based
- AuditLog remains required

This is the preferred strategy for both DCA/internal users and client users in the first controlled release.

## 2. Why This Fits DCA OS v1

DCA OS v1 is a small controlled business platform, not a high-scale public SaaS. The team expects a limited number of users and companies, with access managed directly by DCA. In that environment, the simplest secure-enough path is the one that keeps ownership of identity, tenant assignment, and revocation inside the app.

This approach:

- keeps the login surface understandable
- avoids provider lock-in for the first MVP
- matches the small-user, small-tenant operating model
- keeps tenant membership and permission resolution explicit
- supports a clean audit trail
- avoids introducing a second auth model for client users

## 3. Approved / Deferred Scope

Approved for planning:

- controlled password auth flow
- admin-created user lifecycle
- DB-backed session design
- tenant membership resolution
- RBAC sequence
- audit event mapping
- password reset by admin for MVP
- lockout and throttling planning

Deferred:

- auth runtime implementation
- schema changes
- password hashing implementation
- login UI
- public registration
- Google/OIDC runtime
- managed auth provider runtime
- magic link runtime
- production deployment settings

## 4. Required Future Decisions

- password hashing library
- minimum password policy
- session table shape
- session expiration policy
- revocation policy
- cookie domain
- CSRF timing for the first state-changing authenticated routes
- forced password change after admin reset
- lockout thresholds and reset rules

## 5. Gate Impact

- auth implementation remains blocked until the implementation gate approves runtime work
- tenant middleware remains blocked
- DB runtime integration remains blocked until explicitly approved
