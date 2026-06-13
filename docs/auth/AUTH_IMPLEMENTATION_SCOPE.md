# DCA OS v1 - Auth Implementation Scope

## 1. Purpose

Define what the next auth implementation phase may and may not do.

## 2. Allowed in Next Phase

- auth config placeholder validation
- session option types and config
- auth route skeletons not wired to runtime auth
- controlled password auth planning
- local-only session status placeholder if it stays non-sensitive
- tenant selection planning and skeletons
- audit event contract integration
- tests and checks for no secrets and no password leakage

## 3. Blocked in Next Phase

- real provider credentials
- production callback URLs
- auth runtime
- password hashing runtime
- login/logout endpoints
- deployed auth
- protected business routes
- tenant data exposure
- production DB
- deployment

## 4. Required Human Decisions Before Real Provider Runtime

- password policy
- hashing library
- session store
- cookie domain
- CSRF and rate-limit timing
- reset and lockout rules
- admin email for local test

## 5. Validation Requirements

- `npm.cmd run check`
- `npm.cmd run build`
- `npm.cmd run -w @dca-os-v1/data prisma:validate`
- `npm.cmd run -w @dca-os-v1/data check`
- `npm.cmd run -w @dca-os-v1/data check:data-layer`
- `git diff --check`
