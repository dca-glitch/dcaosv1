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
|------|-----------------|
| Owner | Approves G49/G50 execution blocks; approves commit/push; makes the STOP/GO call |
| Operator/agent | Executes only the explicitly approved, bounded step; documents evidence; never improvises beyond scope |

## 6. Current status snapshot

### Active (2026-07-14 G49 formal review)

| Item | Status |
|------|--------|
| Local/main tip | `01b7e04` |
| Staging-proven G50 candidate | `c5e03eb` |
| Current production runtime | `57f9c52` / image `bd61d5deb331` |
| G49 | **PASS** Â· classification `CONDITIONAL_GO` Â· [`PRODUCTION_DEPLOY_GO_NO_GO_REVIEW_2026-07-14.md`](../audits/PRODUCTION_DEPLOY_GO_NO_GO_REVIEW_2026-07-14.md) |
| G50 | Not executed Â· not authorized Â· owner sentence naming `c5e03eb` required |
| G50 preconditions | Fresh prod DB/web/compose backups; migration **SKIP**; recreate API only; Caddy untouched by default |
| Production deploy authorized | **no** |
| GA4/GSC | **WITHDRAWN** |
| In-system notification E2E | **DEFERRED_NON_BLOCKING** |
| Puriva Launch | Separate / blocked |

### Historical snapshot (2026-07-11 â€” retained)

| Item | Status |
|------|--------|
| Production readiness | **NO** â€” production remains frozen for unrelated deployment |
| G49 | Public read-only proof collected (see `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md` Â§1); formal gate closure sentence still required *(superseded for active truth by 2026-07-14 formal PASS)* |
| G50 | Not executed |
| Production PostgreSQL/API credential rotation Phase A | **RECOVERED AFTER FAILURE** â€” PostgreSQL password and `DATABASE_URL` rotated; production API recreated via `/opt/dca/apps/dcaosv1/app/docker-compose.production-api-only.yml`; production and staging health HTTP 200; `dcaosv1-postgres` and `dca-caddy` unchanged |
| Turnstile / R2 credential rotation | **OPEN DEFERRED SECURITY WORK** â€” owner explicitly deferred; requires separate Phase B/C/D gates |
| Rollback evidence | Production DB dump + env + dist backups taken 2026-07-11; emergency recovery executed successfully; old unproven env candidates were **not** used as rollback source |
| Puriva Launch | Blocked â€” separate gate, see `PURIVA_LAUNCH_GATE.md` |
