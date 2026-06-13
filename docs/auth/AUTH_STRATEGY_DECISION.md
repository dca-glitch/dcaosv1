# DCA OS v1 - Auth Strategy Decision

## 1. Executive Decision

Recommend an external provider or OIDC-first strategy for v1, with app-managed session and tenant context inside DCA OS.

For the first auth phase:

- use external/OIDC-first for internal DCA users later
- keep sessions and tenant context managed by the app
- defer client portal auth to a later invite or magic-link based path
- do not add first-party passwords in the first auth phase unless explicitly approved later

## 2. Rationale

This approach is the safest practical choice for a small team because it:

- reduces password handling liability
- keeps secret handling minimal
- fits the internal DCA user path first
- stays compatible with tenant memberships and tenant-scoped permissions
- supports auditability without forcing a full credential system into the app
- leaves room for a client portal later without locking the project into a risky first implementation

## 3. Approved / Deferred Scope

Approved for planning:

- identity provider integration concept
- session design
- tenant context design
- RBAC sequence

Deferred:

- runtime implementation
- provider credentials
- login UI
- protected routes
- client portal auth

## 4. Required Future Decisions

- provider choice
- session store
- cookie domain
- callback URLs
- invitation flow
- client portal flow
- rate limit and CSRF timing

## 5. Gate Impact

- auth implementation remains blocked
- tenant middleware remains blocked
- DB runtime integration remains blocked until explicitly approved
