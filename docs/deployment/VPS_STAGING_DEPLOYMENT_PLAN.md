# VPS Staging Deployment Plan

## Goal

Prepare DCA OS v1 for a future VPS staging deployment without deploying in this block.

The first staging target should prove that the API, web build, PostgreSQL connection, auth/session runtime, tenant context, module registry, Team read-only view, Settings read-only view, and MVP smoke checks work outside local development.

## Pre-Deploy Checklist

- CI is green on `main`.
- Local validation passes with `npm.cmd run validate`.
- Prisma schema validates with `npm.cmd run -w @dca-os-v1/data prisma:validate`.
- No uncommitted local changes.
- No secrets are committed.
- Staging `DATABASE_URL` points to the approved staging database only.
- Production database credentials are not present on the staging host.
- Backups and rollback path are agreed before migration execution.
- Reverse proxy and TLS configuration are reviewed before public exposure.

## Environment Contract

Use real values only in the deployment environment. Commit names and placeholder examples only.

### API Runtime

- `PORT`
- `DATABASE_URL`
- `AUTH_SESSION_TTL_MINUTES`
- `AUTH_LOGIN_MAX_FAILED_ATTEMPTS`
- `AUTH_LOGIN_LOCKOUT_MINUTES`

### Web Build Or Runtime

- `VITE_API_BASE_URL`

For same-origin reverse proxy deployment, prefer `/api/v1`.

### Database

- `DATABASE_URL`

Local development may also use:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

### Smoke Credentials

Smoke credentials are local/staging-only and must never be committed:

- `AUTH_SEED_TEST_EMAIL`
- `AUTH_SEED_TEST_PASSWORD`
- `AUTH_SEED_TESTER_EMAIL`
- `AUTH_SEED_TESTER_PASSWORD`
- `MVP_SMOKE_API_BASE_URL`

### CORS And Origin

No API CORS environment variable is currently implemented. The preferred staging shape is same-origin routing through a reverse proxy, with the frontend using `/api/v1`.

If cross-origin staging is required later, add a reviewed CORS implementation before deployment rather than relying on undocumented environment variables.

## Build Commands

Install and validate:

```powershell
npm.cmd ci
npm.cmd run validate
npm.cmd run -w @dca-os-v1/data prisma:validate
```

Build web output:

```powershell
npm.cmd run -w @dca-os-v1/web build
```

Build API type surface:

```powershell
npm.cmd run -w @dca-os-v1/api build
```

## Start Commands

Local development:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Production-like API start is not yet formalized. The current API command is TypeScript/`tsx` based and suitable for local/dev validation only:

```powershell
npm.cmd run -w @dca-os-v1/api dev
```

Before VPS deployment, add an approved production start strategy, such as a compiled API output or supervised Node process that does not depend on development-only assumptions.

## Migration Policy

- Do not use `prisma db push` in staging or production.
- Do not run migrations against production from a local shell.
- Staging migrations must be an explicit approved deployment step.
- Production migrations require a separate owner approval, backup check, and rollback plan.
- Seed scripts are local/staging bootstrap tools only and must not create production users.

## Database Safety Policy

- Local smoke must target only `127.0.0.1` or `localhost`.
- Staging smoke must use a staging-only API base URL and staging-only credentials.
- Scripts must not print `DATABASE_URL`, passwords, tokens, cookies, auth headers, password hashes, or session token hashes.
- Production and staging database credentials must never be mixed.

## Smoke Commands

Local API smoke:

```powershell
$env:AUTH_SEED_TEST_EMAIL="<local-test-email>"
$env:AUTH_SEED_TEST_PASSWORD="<local-test-password>"
$env:AUTH_SEED_TESTER_EMAIL="<local-tester-email>"
$env:AUTH_SEED_TESTER_PASSWORD="<local-tester-password>"
npm.cmd run smoke:mvp:local
```

The current local smoke script intentionally refuses non-local API hosts. Add a separate reviewed staging smoke command before running smoke against a VPS.

## First Staging Smoke Checklist

- Health endpoint returns ok.
- Failed login returns safe generic error.
- Login succeeds for staging-only test user.
- `/api/v1/auth/me` returns safe user/session summary.
- `/api/v1/auth/context` returns safe tenant and permission context.
- `/api/v1/tenants/current` returns current tenant context.
- `/api/v1/modules` returns module catalog.
- `/api/v1/modules/current` returns current tenant module state.
- `/api/v1/tenants/current/members` returns read-only Team data when authorized.
- `/api/v1/tenants/current/settings` returns read-only Settings data when authorized.
- Logout revokes the session.
- Reused token returns unauthorized.
- No password hashes, session token hashes, raw tokens, cookies, auth headers, or secrets appear in logs or responses.

## Rollback Concept

- Keep the previous working application revision available.
- Keep database backups before any staging or production migration.
- If application smoke fails before migration, roll back application revision only.
- If migration smoke fails, stop and review before any further migration attempt.
- Do not stack fixes directly on the VPS without committing and validating them locally first.

## Explicit Non-Goals

- No client access yet.
- No production data.
- No billing.
- No OAuth.
- No invite flow.
- No password reset.
- No Finance Lite migration.
- No marketplace.
- No production deployment in this block.
