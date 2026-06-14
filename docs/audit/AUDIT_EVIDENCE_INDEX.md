# Audit Evidence Index

## Latest Important Commits

- `7749cc0` - Prepare production readiness before VPS deployment.
- `aab1704` - MVP permission hardening and module contract.
- `db9e59f` - Local browser QA and settings team skeleton.
- `668584f` - Frontend auth tenant module integration skeleton.
- `377bd45` - Module registry backend skeleton.

## Validation Commands

```powershell
npm.cmd run validate
npm.cmd run -w @dca-os-v1/data prisma:validate
npm.cmd run -w @dca-os-v1/data check
npm.cmd run -w @dca-os-v1/data check:data-layer
npm.cmd run -w @dca-os-v1/api check:auth-skeleton
git diff --check
```

## Smoke Command

```powershell
npm.cmd run smoke:mvp:local
```

Requires local-only env vars:

- `AUTH_SEED_TEST_EMAIL`
- `AUTH_SEED_TEST_PASSWORD`
- Optional `AUTH_SEED_TESTER_EMAIL`
- Optional `AUTH_SEED_TESTER_PASSWORD`

Current coverage includes local health, login, auth/me, auth/context, current tenant, current modules, module enable/disable for admin, tenant members, tenant settings, optional tester forbidden module enable, logout, and reused-token denial. It does not currently cover invalid module keys, tenant switch negative cases, member-detail cross-tenant IDs, or missing active-tenant context.

## Docs Available

- `docs/MVP_READINESS.md`
- `docs/DEPLOYMENT_PLAN.md`
- `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md`
- `docs/frontend/AUTH_TENANT_MODULE_INTEGRATION.md`
- `docs/modules/MODULE_CONTRACT_SKELETON.md`
- `docs/auth/AUTH_BACKEND_ROUTE_PATTERNS.md`
- `docs/audit/*`

## Scripts Available

- `scripts/check-workspace.mjs`
- `scripts/check-package.mjs`
- `scripts/smoke-mvp-local.mjs`
- `apps/api/scripts/check-auth-skeleton.mjs`
- `packages/data/scripts/validate-prisma-schema.mjs`
- `packages/data/scripts/run-prisma-validate.mjs`
- `packages/data/scripts/check-data-layer.mjs`
- `packages/data/scripts/seed-db1.mjs`

## Endpoints Implemented

- Health: `GET /api/v1/health`.
- Auth: login, logout, me, context, skeleton status/start/callback/change-password.
- Tenants: list, current, switch, members, member detail, settings read/update.
- Modules: catalog, module detail, current tenant modules, enable, disable.

## Current Known Limitations

- Local MVP only; no VPS deployment.
- No staging smoke command.
- Local browser QA/dev-server smoke completed in prior gates; staging/client browser QA evidence still needs to be collected.
- No password reset, invite flow, OAuth, billing, marketplace, or Finance Lite migration.
- No production start strategy.
- No CORS/security headers verification.
- No backup/restore drill.
- No external pen-test report.

## Evidence Gaps To Collect Later

- CI screenshots/logs for release candidates.
- VPS staging logs.
- Browser QA screenshots.
- Staging smoke logs.
- External pen-test report.
- Backup restore logs.
- Proxy/TLS/security header evidence.
- Tenant isolation negative test results.
