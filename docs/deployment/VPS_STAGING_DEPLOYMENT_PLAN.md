# VPS Staging Deployment Plan

## Goal

Prepare DCA OS v1 for a future VPS staging deployment without deploying in this block.

The first staging target should prove that the API, web build, PostgreSQL connection, auth/session runtime, tenant context, module registry, Team read-only view, Settings read-only view, and MVP smoke checks work outside local development.

Final execution approval boundaries are summarized in [VPS Staging Execution Approval Pack](VPS_STAGING_EXECUTION_APPROVAL_PACK.md).

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
- Client access remains blocked.

## Current Assumptions To Verify

- Production domain is planned as `system.digitalcubeagency.net`.
- Staging should use a separate staging host, currently expected as `staging.system.digitalcubeagency.net`.
- The API is Express under `/api/v1`.
- The web app is React/Vite and defaults to same-origin `/api/v1`.
- The preferred staging shape is same-origin HTTPS through a reverse proxy.
- No API CORS runtime is implemented yet.
- The API production-like repo strategy is compiled JavaScript started with Node.
- The VPS still needs an approved external process supervisor/restart policy.
- PostgreSQL staging must be separate from production and must contain no production data.
- Prisma migrations are the only allowed schema-change path; `prisma db push` is forbidden for staging and production.

## Environment Contract

Use real values only in the deployment environment. Commit names and placeholder examples only.

### Backend

- `PORT`
- `DATABASE_URL`

### Frontend / Build

- `VITE_API_BASE_URL`

For same-origin reverse proxy deployment, prefer `/api/v1`.

### Database

- `DATABASE_URL`

Local development may also use:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

Staging must use separate database credentials and no production data.

### Session / Cookie / Auth

Implemented controlled MVP auth runtime:

- `AUTH_SESSION_TTL_MINUTES`
- `AUTH_LOGIN_MAX_FAILED_ATTEMPTS`
- `AUTH_LOGIN_LOCKOUT_MINUTES`

Cookie/session env names below are planned/helper-level only and are not yet wired as the active client credential transport:

- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_SECURE_COOKIES`
- `AUTH_SESSION_SAME_SITE`

Auth provider skeleton placeholders remain future-only:

- `DCAOSV1_AUTH_PROVIDER_VENDOR`
- `DCAOSV1_AUTH_CALLBACK_URL_PLACEHOLDER`
- `DCAOSV1_AUTH_SESSION_COOKIE_NAME`

### CORS / Origin

No API CORS environment variable is currently implemented. The preferred staging shape is same-origin routing through a reverse proxy, with the frontend using `/api/v1`.

If cross-origin staging is required later, add a reviewed CORS implementation before deployment rather than relying on undocumented environment variables.

### Deployment / Runtime

No deployment/runtime env contract is finalized beyond process manager configuration and `PORT`.

Expected deployment-side values to document outside Git:

- app directory/path
- process name
- Node.js version
- reverse proxy site host
- TLS contact/email, if required by the proxy
- log location
- backup location

### Smoke Credentials

Smoke credentials are local/staging-only and must never be committed:

- `AUTH_SEED_TEST_EMAIL`
- `AUTH_SEED_TEST_PASSWORD`
- `AUTH_SEED_TESTER_EMAIL`
- `AUTH_SEED_TESTER_PASSWORD`
- `MVP_SMOKE_API_BASE_URL`

Staging smoke must use:

- `MVP_SMOKE_API_BASE_URL=https://staging.system.digitalcubeagency.net/api/v1`

Do not use `system.digitalcubeagency.net` for staging smoke unless the owner explicitly approves that host as the staging target.

## Staging Host Build Commands

Install and validate:

```bash
npm ci
npm run validate
npm run -w @dca-os-v1/data prisma:validate
```

Build web output:

```bash
npm run -w @dca-os-v1/web build
```

Build API compiled output:

```bash
npm run -w @dca-os-v1/api build
```

The compiled API entry is:

```text
apps/api/dist/apps/api/src/server.js
```

## Start Commands

Local Windows development:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Production-like API start after build:

```bash
npm run -w @dca-os-v1/api start
```

The staging VPS should run that command under an approved process supervisor/restart mechanism. Do not use `npm run -w @dca-os-v1/api dev` for staging runtime; it is TypeScript/`tsx` based and suitable for local development only.

## Dry-Run Command Plan

Run these from the repo root after pulling the approved commit on the staging host. This is a plan only; do not run on a VPS without explicit approval.

```bash
npm ci
npm run validate
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/web build
npm run -w @dca-os-v1/api build
npm run -w @dca-os-v1/api start
```

After the API and web are served through the approved staging reverse proxy:

```bash
export MVP_SMOKE_API_BASE_URL="https://staging.system.digitalcubeagency.net/api/v1"
npm run smoke:mvp:staging
```

Set staging-only smoke credentials in the shell before running smoke. Do not print passwords, tokens, cookies, auth headers, password hashes, session token hashes, or full database URLs.

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

The local smoke script intentionally refuses non-local API hosts.

Staging API smoke, after staging-only credentials and the staging host are approved:

```bash
export MVP_SMOKE_API_BASE_URL="https://staging.system.digitalcubeagency.net/api/v1"
export AUTH_SEED_TEST_EMAIL="<staging-test-email>"
export AUTH_SEED_TEST_PASSWORD="<staging-test-password>"
export AUTH_SEED_TESTER_EMAIL="<staging-tester-email>"
export AUTH_SEED_TESTER_PASSWORD="<staging-tester-password>"
npm run smoke:mvp:staging
```

The staging smoke command refuses unknown hosts, non-HTTPS URLs, missing explicit `MVP_SMOKE_API_BASE_URL`, and API paths other than `/api/v1`.

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

## Migration Policy Checklist

- [ ] Confirm target database is staging-only.
- [ ] Confirm `DATABASE_URL` by host/database name without printing the value.
- [ ] Confirm production credentials are absent from the shell and host.
- [ ] Confirm backup exists before any staging migration.
- [ ] Run Prisma validation before migration.
- [ ] Run only approved Prisma migration commands.
- [ ] Never run `prisma db push`.
- [ ] Stop if Prisma asks for destructive reset or unexpected data loss.

## Evidence Collection Checklist

- [ ] Commit hash and CI run ID.
- [ ] Staging host/domain confirmation.
- [ ] Env var presence check by name only.
- [ ] Build and validation logs.
- [ ] API compiled-output path exists.
- [ ] Process supervisor/restart policy recorded.
- [ ] Migration command and result, if separately approved.
- [ ] Health endpoint result.
- [ ] Staging smoke result with secrets and tokens masked.
- [ ] Browser QA screenshots on HTTPS staging.
- [ ] Reverse proxy/TLS/security header evidence.
- [ ] Backup/restore evidence.
- [ ] Rollback drill result.

## Rollback Concept

- Keep the previous working application revision available.
- Keep database backups before any staging or production migration.
- Record the previous process supervisor target before switching versions.
- If application smoke fails before migration, roll back application revision only.
- If migration smoke fails, stop and review before any further migration attempt.
- Do not stack fixes directly on the VPS without committing and validating them locally first.

## Client Access Gate

Client access remains blocked until:

- VPS staging deployment succeeds.
- Staging smoke passes.
- Staging browser QA evidence is collected.
- Tenant isolation negative tests pass.
- External security review is complete.
- Backup/restore and rollback are tested.
- Security headers, HTTPS, CORS/origin behavior, and session behavior are verified.
- Password reset, invite/onboarding, or an approved manual access process is in place.

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
