# Production Safety Checklist

**Status:** Consolidated pre-deploy / post-deploy / STOP checklist. Reference only — does not authorize G50.

**Source of truth:** [`docs/STATUS.md`](../STATUS.md) · [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md) · [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) · [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) · [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md)

---

## 1. Pre-deploy checklist (all required before G50)

- [ ] G54 HSTS/proxy — PASS
- [ ] G53 production safety plan approved (planning)
- [ ] G49 dry-run / read-only proof — public probes PASS; explicit owner approval sentence recorded for full gate closure
- [ ] Staging deploy/smoke proof (G46d/G47) — PASS
- [ ] Exact commit SHA for promotion identified and CI green confirmed
- [ ] Production backup (DB + dist) taken and verified restorable — see `PRODUCTION_ROLLBACK.md` §3
- [ ] Production env separation from staging confirmed (no staging credentials in production env)
- [ ] Schema/migration safety confirmed — stop if any migration would drop tables/columns without a separate explicit migration approval
- [ ] Live integrations remain gated unless separately approved (AI provider, WordPress, R2, GA/GSC, email)
- [ ] Explicit owner approval sentence for G50, naming the commit SHA

## 2. During-deploy checklist

- [ ] Only the API container (and web dist, if changed) is touched — DB is not recreated unless migration explicitly approved
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
|------|-----------------|
| Owner | Approves G49/G50 execution blocks; approves commit/push; makes the STOP/GO call |
| Operator/agent | Executes only the explicitly approved, bounded step; documents evidence; never improvises beyond scope |

## 6. Current status snapshot (2026-07-11)

| Item | Status |
|------|--------|
| Production readiness | **NO** — production remains frozen for unrelated deployment |
| G49 | Public read-only proof collected (see `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md` §1); formal gate closure sentence still required |
| G50 | Not executed |
| Production PostgreSQL/API credential rotation Phase A | **RECOVERED AFTER FAILURE** — PostgreSQL password and `DATABASE_URL` rotated; production API recreated via `/opt/dca/apps/dcaosv1/app/docker-compose.production-api-only.yml`; production and staging health HTTP 200; `dcaosv1-postgres` and `dca-caddy` unchanged |
| Turnstile / R2 credential rotation | **OPEN DEFERRED SECURITY WORK** — owner explicitly deferred; requires separate Phase B/C/D gates |
| Rollback evidence | Production DB dump + env + dist backups taken 2026-07-11; emergency recovery executed successfully; old unproven env candidates were **not** used as rollback source |
| Puriva Launch | Blocked — separate gate, see `PURIVA_LAUNCH_GATE.md` |
