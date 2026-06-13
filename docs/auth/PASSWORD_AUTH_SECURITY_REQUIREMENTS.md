# DCA OS v1 - Password Auth Security Requirements

## 1. Purpose

Define the security requirements for the controlled username/email + password MVP.

## 2. Required Security Rules

- store password hashes only
- never store plaintext passwords
- never log passwords
- never place password material in `AuditLog.metadata`
- use a modern password hashing algorithm approved at implementation time, with Argon2id preferred and bcrypt acceptable if the implementation gate requires it
- support manual password reset by a DCA admin for MVP
- recommend forced password change after an admin reset
- record failed login attempts
- record password reset events
- record permission denied events
- keep login and session handling auditable

## 3. Password Policy Direction

For a small controlled business platform, the policy should favor usability and real strength:

- minimum length should be meaningful for a business system, with 12 characters or more as the recommended baseline
- passphrases should be allowed
- composition theater should not be the main control unless a later review requires it
- breached-password checks may be added later if the implementation gate approves them

## 4. Throttling and Lockout

The MVP should plan for:

- basic login throttling
- progressive delay or lockout after repeated failures
- reset of failure counters after successful login
- unlock path managed by DCA admin

## 5. Session Security Requirements

- use httpOnly cookies
- use Secure cookies in production
- use SameSite=Lax or stricter
- store only a hash of the session token in the database
- revoke the session on logout
- revoke active sessions when a user is deactivated
- expire sessions explicitly

## 6. Operational Requirements

- no public registration route
- no self-signup
- no secrets in repository files
- no provider credentials in repo
- no auth runtime until the gate approves implementation

## 7. Audit Requirements

Audit the following events at minimum:

- login success
- login failure
- logout
- password reset by admin
- session revocation
- permission denied
- user creation
- user update
- membership update
