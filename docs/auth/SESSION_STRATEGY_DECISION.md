# DCA OS v1 - Session Strategy Decision

## 1. Executive Decision

Use an httpOnly cookie session backed by a database session table.

Recommended MVP session strategy:

- httpOnly cookies
- secure cookies in production
- sameSite=Lax by default
- path `/`
- cookie domain deferred until production cookie rules are approved
- opaque session token in the browser cookie
- session token hash stored in the database, not the raw token
- DB-backed session expiration and revocation
- no JWT as the primary session mechanism for MVP

## 2. Rationale

This path is preferred because it:

- keeps the session model simple
- supports server-side revocation
- fits membership-based authorization
- avoids exposing long-lived bearer tokens to client scripts
- works cleanly with tenant context and audit requirements

## 3. Cookie Policy

- `httpOnly`
- `Secure` in production
- `SameSite=Lax` by default
- `Path=/`
- domain deferred until the production domain is approved
- short and explicit expiration

## 4. Session Store Direction

The preferred direction is a DB-backed `Session` table with:

- session id
- user id
- session token hash
- created at
- expires at
- revoked at
- last seen at
- optional IP address
- optional user agent

## 5. CSRF Plan

- rely on same-site cookies as the baseline
- add explicit CSRF protection if and when state-changing authenticated routes are introduced
- do not implement session writes now

## 6. Blocked Items

- no session runtime
- no secrets
- no login/logout routes
- no cookies set by app yet

## 7. Human Decisions Needed

- session duration
- idle timeout
- cookie domain
- revocation policy
- forced logout behavior after password reset or user deactivation
