# DCA OS v1 - Session Strategy Decision

## 1. Executive Decision

Recommended v1 session strategy:

- cookie-based app session
- httpOnly cookies
- secure cookies in production
- sameSite=lax initially unless cross-site needs require adjustment
- session store decision deferred until DB/auth implementation
- no JWT-as-primary-session for v1 unless later approved

## 2. Rationale

This path is preferred because it:

- improves revocation options
- lowers token exposure
- stays compatible with tenant context
- supports server-side permission resolution

## 3. Cookie Policy

- httpOnly
- secure in production
- sameSite
- path
- domain later for `system.digitalcubeagency.net`
- expiration

## 4. CSRF Plan

- sameSite baseline
- CSRF token for state-changing routes later if needed
- no state-changing auth writes implemented now

## 5. Session Store Options

Compare:

- database session table later
- Redis later
- encrypted cookie only

Safest v1 planning recommendation:

- prefer cookie-based app sessions with a future explicit session-store decision
- do not introduce JWT as the primary session mechanism now

## 6. Blocked Items

- no session runtime
- no secrets
- no login/logout routes
- no cookies set by app yet

## 7. Human Decisions Needed

- final session store
- cookie domain
- session expiration policy
- logout invalidation policy
- CSRF timing for the first state-changing authenticated routes
