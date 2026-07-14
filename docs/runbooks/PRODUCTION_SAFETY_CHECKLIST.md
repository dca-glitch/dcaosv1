# Production Safety Checklist

**Status:** Consolidated pre-deploy / post-deploy / STOP checklist. Reference only â€” does not authorize G50.

**Source of truth:** [`docs/STATUS.md`](../STATUS.md) Â· [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md) Â· [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) Â· [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) Â· [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md)

---

## 1. Pre-deploy checklist (all required before G50)

- [ ] G54 HSTS/proxy â€” PASS
- [ ] G53 production safety plan approved (planning)
- [ ] G49 dry-run / read-only proof â€” public probes PASS; explicit owner approval sentence recorded for full gate closure
- [ ] Staging deploy/smoke proof (G46d/G47) â€” PASS
- [ ] Exact commit SHA for promotion identified and CI green confirmed
- [ ] Production backup (DB + dist) taken and verified restorable â€” see `PRODUCTION_ROLLBACK.md` Â§3
- [ ] Production env separation from staging confirmed (no staging credentials in production env)
- [ ] Schema/migration safety confirmed â€” stop if any migration would drop tables/columns without a separate explicit migration approval
- [ ] Live integrations remain gated unless separately approved (AI provider, WordPress, R2, GA/GSC, email)
- [ ] Explicit owner approval sentence for G50, naming the commit SHA

## 2. During-deploy checklist

- [ ] Only the API container (and web dist, if changed) is touched â€” DB is not recreated unless migration explicitly approved
- [ ] Health check run immediately after container recreate
- [ ] No Caddy/DNS change unless that was the explicitly approved scope
- [ ] No `.env`/secret value read, printed, or logged

## 3. Post-deploy validation checklist

- [ ] `GET /api/v1/health` returns `200` with `database.status: ready`
- [ ] Production root returns `200` with HSTS header present
- [ ] Staging remains unaffected (separate containers/ports confirmed still healthy)
- [ ] No unexpected error spike in API logs for a reasonable observation window
- [ ] Evidence log saved to `$env:TEMP` and archived into a docs-only closeout commit (separate approval for commit)

## 4. STOP criteria (abort / roll back immediately)

Stop and do not proceed (or roll back per `PRODUCTION_ROLLBACK.md`) if any of the following occur:

- Health check returns non-200 or `database.status` is not `ready`
- HSTS header is missing on production root after deploy
- Any forbidden action (migration, Caddy/DNS change, secret print) was required to make the deploy "work"
- Staging health degrades as a side effect of a production action
- Rollback evidence cannot be produced within a reasonable window
- Any doubt exists about which commit is actually running in production

## 5. Roles

| Role | Responsibility |
|------|---------### Active (2026-07-14 G50 PASS)

| Item | Status |
|------|--------|
| Local/main tip | `e5eb08f` |
| Production runtime | `c5e03eb` / `app-dcaosv1-api:c5e03eb` (`5a3515acfc05`) |
| Production artifact | `/opt/dca/production-artifacts/c5e03eb` |
| Rollback baseline | `57f9c52` / `app-dcaosv1-api:57f9c52` |
| G49 | **PASS** (2026-07-14) |
| G50 | **PASS** + post-deploy proof **PARTIAL** (owner auth harness not_available) - [`G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md`](../audits/G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md) |
| Production first-run | `CLEAN_FIRST_RUN_OWNER_SETUP`; 0 active clients; setup not mutated |
| GA4/GSC | **WITHDRAWN** |
| In-system notification E2E | **DEFERRED_NON_BLOCKING** |
| Puriva Launch | Separate / blocked |

### Historical snapshot (2026-07-11 â€” retained)

| Item | Status |
|------|### Active (2026-07-14 G50 PASS)

| Item | Status |
|------|--------|
| Local/main tip | `e5eb08f` |
| Production runtime | `c5e03eb` / `app-dcaosv1-api:c5e03eb` (`5a3515acfc05`) |
| Production artifact | `/opt/dca/production-artifacts/c5e03eb` |
| Rollback baseline | `57f9c52` / `app-dcaosv1-api:57f9c52` |
| G49 | **PASS** (2026-07-14) |
| G50 | **PASS** + post-deploy proof **PARTIAL** (owner auth harness not_available) - [`G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md`](../audits/G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md) |
| Production first-run | `CLEAN_FIRST_RUN_OWNER_SETUP`; 0 active clients; setup not mutated |
| GA4/GSC | **WITHDRAWN** |
| In-system notification E2E | **DEFERRED_NON_BLOCKING** |
| Puriva Launch | Separate / blocked |
