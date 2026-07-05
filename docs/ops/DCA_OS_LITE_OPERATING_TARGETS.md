# DCA OS Lite — Production Operating Targets

Permanent production target rules for DCA OS Lite.

## Production VPS

SSH: deploy@system.digitalcubeagency.net
Expected hostname: DCA01

## Production URL

https://system.digitalcubeagency.net

## Production containers on DCA01

API: dcaosv1-api
Postgres: dcaosv1-postgres
Caddy: dca-caddy

## Health checks

VPS local API health: http://127.0.0.1:4010/api/v1/health
Public API health: https://system.digitalcubeagency.net/api/v1/health

## Runtime database target

**Docs-indicated only — not runtime-confirmed here.** Prior documentation indicated the production API container `DATABASE_URL` may point to:

host: dcaosv1-postgres  
port: 5432  
database: dcaosv1_staging  
schema: public

That host/database shape overlaps the staging bootstrap target name (`dcaosv1_staging`). **Owner must confirm actual DCA01 runtime DB naming on VPS before any remote bootstrap or migration work.** Do not assume this section reflects live production without read-only VPS inspection and explicit owner approval.

**Staging admin bootstrap safety:** `npm run bootstrap:staging-admin` refuses production-shaped host `dcaosv1-postgres` and requires approved staging host `dcaosv1-staging-postgres` or loopback tunnel only, plus explicit write confirmation env. See [`docs/operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md).

## Critical warning

Do not use local Windows Docker context as production.
Local Docker may show different containers and is not the production environment.

Before production work:
1. SSH to deploy@system.digitalcubeagency.net
2. Confirm hostname is DCA01
3. Confirm docker ps shows dcaosv1-api, dcaosv1-postgres, dca-caddy
4. If DB work is needed, inspect runtime DATABASE_URL from dcaosv1-api
5. Redact all secrets
6. Use read-only commands first

## Strict prohibitions unless explicitly approved

- No deletes
- No truncates
- No production updates
- No migrations
- No Prisma migrate deploy
- No Prisma db push
- No deployment
- No Docker restart/recreate
- No Caddy reload
- No VPS changes
- No Finance Lite container actions
- No secrets printed

## Finance Lite warning

Finance Lite containers/data are separate and must not be touched unless explicitly approved.

## Standard Codex/Cline prompt header

Before doing any production-related work:
- Use VPS only: deploy@system.digitalcubeagency.net
- Confirm hostname is DCA01.
- Production API container is dcaosv1-api.
- Production DB container is dcaosv1-postgres.
- Production Caddy container is dca-caddy.
- Do not use local Windows Docker context as production.
- If Docker on DCA01 does not show dcaosv1-api, stop and report.
- Read-only first.
- No deletes, migrations, deploys, restarts, or Finance Lite actions without explicit approval.
- Do not print secrets.
