# DCA OS v1 - Auth Password Service Foundation

## 1. What Is Implemented

Block 19B adds a password helper foundation only. It does not add login behavior.

Implemented helpers:

- password policy config
- password policy validation
- password hashing with Node.js `crypto` scrypt
- password verification with constant-time comparison

## 2. Security Notes

- plaintext passwords are never stored
- plaintext passwords are never logged
- the helper is isolated from routes and controllers
- no user enumeration behavior is introduced

## 3. Password Hashing Decision

No dependency was installed in this block.

The foundation uses built-in Node.js `crypto` scrypt so the repo stays dependency-neutral until runtime auth is explicitly approved.

Later, `argon2` remains the preferred package if a dependency is introduced.

## 4. What Remains Blocked

- login/logout behavior
- admin password reset flow
- DB persistence of password hashes
- auth middleware
- tenant resolver
- RBAC resolver
- public registration
- OIDC / OAuth / magic-link / MFA runtime
