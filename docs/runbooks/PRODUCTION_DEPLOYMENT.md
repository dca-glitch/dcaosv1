# Production Deployment Procedure (G50 Reference)

**Status:** Planning/reference document only. Does **not** authorize a production deploy. G50 has **not** been executed.

**Source of truth:** [`docs/STATUS.md`](../STATUS.md) · [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md) · [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md)

---

## 1. Preconditions (all required before G50)

| # | Precondition | Status |
|---|--------------|--------|
| 1 | G54 HSTS/proxy fix | **PASS** |
| 2 | G53 production safety plan approved | **PASS** (planning only) |
| 3 | G49 production dry-run / read-only proof | Public probe evidence collected; formal gate closure requires explicit owner approval sentence |
| 4 | Staging deploy/smoke proof | **PASS** (G46d/G47) |
| 5 | Rollback/restore evidence | **Not yet proven** — see [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md) |
| 6 | Env/secrets separation confirmed | Not production-proven; names-only inventory exists |
| 7 | Exact artifact/commit for promotion confirmed | Not yet selected |
| 8 | Explicit owner approval for G50 | **Not given** |

**Production readiness: NO.** This document does not change that status.

---

## 2. Target environment

| Item | Value |
|------|-------|
| Production URL | `system.digitalcubeagency.net` |
| Production API container | `dcaosv1-api` (`127.0.0.1:4010->4000`) |
| Production DB container | `dcaosv1-postgres` (`127.0.0.1:5434->5432`) |
| Shared proxy | `dca-caddy` |
| Staging URL (reference, not target) | `staging.digitalcubeagency.net` |
| Staging API container | `dcaosv1-staging-api` (`127.0.0.1:4011->4000`) |
| Staging DB container | `dcaosv1-staging-postgres` (`127.0.0.1:5435->5432`) |

---

## 3. Deployment sequence (reference only — not executed)

This sequence mirrors the proven G46d staging pattern, adapted for production and gated behind explicit owner approval at each numbered step.

1. Confirm exact commit SHA for promotion; confirm CI green on that SHA.
2. Confirm G49 PASS evidence is archived and still current.
3. Take a full production backup (DB dump + current artifact/image reference) — see [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md) §2.
4. Confirm no pending Prisma migrations that would drop tables/columns without an explicit, separately approved migration plan.
5. Build the production artifact/image from the approved commit (same pattern as staging: `staging-dcaosv1-staging-api:latest` → production-equivalent tag).
6. Stop only the production API container (`dcaosv1-api`); leave DB running unless migration explicitly approved.
7. Recreate `dcaosv1-api` with the new image/artifact context.
8. If web assets changed, replace the mounted `dist` contents in place (copy-in pattern) rather than `rm -rf` + `mv`, to avoid the Caddy stale-mount issue observed during G46d. If a full directory swap is unavoidable, force-recreate Caddy afterward: `docker compose -f /opt/dca/docker-compose.yml up -d --force-recreate --no-deps caddy`.
9. Run production health check (`/api/v1/health`) — expect `200` and `database.status: ready`.
10. Run a minimal MVP smoke against production only if separately approved (mirrors `smoke:mvp:staging` pattern, pointed at production with explicit `MVP_SMOKE_API_BASE_URL`).
11. Record final proof: HTTP status, HSTS header, DB ready, container names, timestamps.
12. If any step fails, execute [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md) immediately and stop.

**Nothing in this section has been executed.** It exists so a future approved G50 block has a concrete, low-ambiguity procedure instead of improvising against a live production system.

---

## 4. Forbidden during planning (this document)

- Any container recreate, restart, or image build on production or staging
- Any migration execution
- Any Caddy/DNS change
- Any `.env`/secret read, print, or edit
- Any commit/push tied to this planning document beyond the docs themselves

---

## 5. Post-deploy validation (reference)

See [`PRODUCTION_SAFETY_CHECKLIST.md`](./PRODUCTION_SAFETY_CHECKLIST.md) §3 for the exact post-deploy checklist to run after any future approved G50 execution.

---

## 6. Owner approval sentence pattern

Following the [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](./G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) pattern, G50 execution should only proceed after the owner supplies an explicit, written approval naming: the gate (G50), the exact commit SHA, and confirmation that rollback evidence exists. Absent that sentence, no agent should attempt any step in §3.
