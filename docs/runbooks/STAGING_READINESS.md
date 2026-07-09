# Pre-Staging Readiness and Manual QA Pack (Block A)

**Status:** Local repo-side GO / NO-GO pack. Does **not** authorize VPS execution, DNS, migrations on staging, or production touch.

**Purpose:** Practical checklist to decide whether `main` is ready to **request** staging work (G4) — not to deploy staging.

**Current baseline (2026-07-09):** latest proven full local closeout commit `217c11c` (`test: stabilize G35 Phase B browser smokes`); G35 Phase C controlled staging refresh completed on commit `5e1ea5a` (`docs: record staging discovery facts`); G46d controlled staging deploy/proof PASS using API context `/opt/dca/staging-artifacts/5e1ea5a` and host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`; G47/G47b/G47c staging smoke/proof PASS on baseline `f25158d` with staging root 200, staging health 200, production health-only 200, MVP staging smoke PASS, and staging security baseline 31/31 PASS with one HSTS warning; G48 production readiness planning PASS on latest baseline commit before G48b docs `1b4e03c` (`docs: record G47 staging smoke proof`) with production deploy ready **NO**; latest local pre-staging re-check is G43 PASS on current `main` at `a18dcc1` after G38/G39/G41 copy polish; CI green for those copy-polish commits; full local `smoke:pre-staging:local` PASS for G35 Phase B; staging artifact refreshed from `5ee8389` to `5e1ea5a`; staging API recreated; MVP smoke PASS; production untouched; **further staging refresh/execution or any production deploy requires fresh explicit owner approval**.

**Ground-truth notice (updated 2026-07-09 post-G46d proof):** G46d controlled staging deploy/proof is PASS. Staging artifact/API context was `/opt/dca/staging-artifacts/5e1ea5a`; host-side web target was `/opt/dca/apps/dcaosv1/staging/web/dist`; staging compose was `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml`; compose requires `--env-file .env.staging`; correct staging API compose service is `dcaosv1-staging-api`, not `api`. Final proof: staging root HTTP 200, staging health HTTP 200, production health-only HTTP 200. Production deploy attempted: NO. Production app/API/DB mutation: NO. Any further staging refresh/VPS execution/migration/deploy requires fresh explicit owner approval with bounded execution block instructions. This docs update authorizes no new VPS, staging, production, deploy, DNS, migration, SSH, Docker, or Caddy action without explicit owner instruction.

**G47 staging smoke/proof notice (updated 2026-07-09):** G47 minimal staging proof PASS (`staging-root-http=200`, `staging-health-http=200`, `prod-health-only-http=200`) and staging/prod separation confirmed. G47b MVP staging smoke PASS requires explicit `MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1`; initial run without explicit target refused/failed by target guard, retry passed with `smoke-mvp-staging-exit=0`. G47c staging security baseline PASS requires explicit `DCA_SMOKE_REMOTE_TARGET=staging`; initial run without explicit target refused by remote target guard, retry passed with `smoke-staging-security-baseline-exit=0`; result `31/31 passed, 1 warning(s)`. HSTS missing is a known proxy hardening warning only. Production health probe inside smoke was skipped unless explicitly approved. No repo/source edits, deploy, VPS/staging/prod mutation, commit, or push occurred during smoke gates.

**G48 production readiness planning notice (updated 2026-07-09):** G48 production readiness planning PASS. Production deploy ready: **NO**. Production deploy attempted: **NO**. VPS/staging/prod mutation: **NO**. Refreshed runtime proof: `staging-root-http=200`, `staging-health-http=200`, `production-root-http=200`, `production-health-http=200`. Production remains frozen/deferred until separate explicit owner approval. G54 HSTS/proxy: **PASS**. Production deploy is not authorized by staging PASS, G47 PASS, G48 planning PASS, or G54 HSTS fix.

**G53 production safety plan notice (updated 2026-07-09):** G53 production safety plan **approved** — planning only. Does **not** authorize G49 dry-run, G50 deploy, or production mutation. Production readiness: **NO**. G49/G50: **not executed**. G54 HSTS/proxy: **PASS**. Next production path remains G49 dry-run before G50, only after owner approval. Puriva Launch: **blocked** pending live proof gates. Staging proven (G46d/G47); production deploy frozen. Full plan: [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md). G49 runbook: [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md).

**Source of truth:** [`docs/STATUS.md`](../STATUS.md). **Operator runbook:** [`docs/operator/OPERATOR_RUNBOOK.md`](../operator/OPERATOR_RUNBOOK.md).

Related:

- [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — one-command local gate (`smoke:pre-staging:local`)
- [`STAGING_LOCAL_EXECUTION_PACK.md`](./STAGING_LOCAL_EXECUTION_PACK.md) — pre-G4 checklists and decision template
- [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md) — full smoke catalog
- [`STAGING_MIGRATION_PROCEDURE.md`](./STAGING_MIGRATION_PROCEDURE.md) — execute at G4 only
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md) — env names (no values)
- [`../operator/deferred-scope-register.md`](../operator/deferred-scope-register.md) — intentional non-blockers
- [`PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](./PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md) — client boundary proof

**Run location:** External PowerShell on Windows. Log long runs to `$env:TEMP` and open in Notepad. Stop on first failure.

---

## 0. Pre-staging gate (Blocks 1–4 + Claude audit)

Before **requesting** G4 staging work (not deploy), all must be true:

| # | Gate |
|---|------|
| 1 | Blocks 1–4 + audit remediation complete; CI green on pinned SHA (`217c11c` current proven closeout) |
| 2 | **Claude audit remediation** closed on `main` (`2437c84`–`e54445f`); 5D-B local closeout PASS — separate from owner G4 approval |
| 3 | `npm.cmd run validate` PASS |
| 4 | Required local smokes PASS — Block A minimum (`smoke:staging-readiness:local`) plus Block 1–2 (`smoke:external-integrations-readiness:local`, `smoke:admin-operations:local`) |
| 5 | Working tree clean (no uncommitted runtime changes) |
| 6 | `main` synced with `origin/main` |
| 7 | No live calls / publish / sync / crawl during gate |
| 8 | Staging deploy proof **not performed** — repo-side gate only |
| 9 | G43 local re-check PASS on `main` at `a18dcc1` — validate plus four focused local smokes; no repo edits, commit/push/deploy/staging/VPS/prod |
| 10 | Explicit owner approval before touching staging infrastructure |

---

## 1. Current main / CI expectations

| Expectation | Pass criteria |
|-------------|---------------|
| Branch | `main` synced with `origin/main` |
| Working tree | Clean (no uncommitted runtime changes) |
| CI | Green on pinned commit SHA |
| Closed blocks | 1 `136e93a`, 2 `5308f19`, 3 `cc40160`, 4 `c7af674`, 5A–5D-A `2437c84`–`e54445f`, 5D-B local closeout PASS, G35 Phase B closeout PASS on `217c11c` |
| Production deploy | **Not deployed** — `system.digitalcubeagency.net` unchanged; untouched during Phase C refresh |
| Staging deploy | **Phase C refresh COMPLETE** — G35 Phase C refresh on `5e1ea5a` PASS; artifact updated, API/web/MVP smoke verified (see STAGING_READINESS §2.1 and STATUS §2.2/§2.8); further staging work requires fresh owner approval |
| Staging target (G1) | `staging.digitalcubeagency.net` resolves to the same VPS as `system.digitalcubeagency.net`; route/web/API exist |
| Default AI execution | Local deterministic; live provider opt-in only |
| Client Portal | Client-safe final data only; admin review required before publication |

Record before GO decision:

```text
Date:
Commit SHA:
CI run URL/id:
Branch: main
```

---

## 2. Required local preflight

Complete **before** smoke or manual QA.

| # | Step | Command / action | Notes |
|---|------|------------------|-------|
| 1 | Sync repo | `git fetch origin` then confirm `main` = `origin/main` | Pin exact SHA |
| 2 | Stop locking dev servers | Stop `node.exe` on ports 4000/5173 if needed | Avoids Prisma EPERM on Windows |
| 3 | Full validation | `npm.cmd run validate` | Stop on first failure |
| 4 | Set smoke password | `$env:AUTH_SEED_TEST_PASSWORD` in shell only | Min 8 chars; **never commit or print** |
| 5 | Local PostgreSQL | Running; API can reach DB | Required for smokes |
| 6 | Start services when needed | `npm.cmd run dev:api` + `npm.cmd run dev:web` | Browser smokes need `:5173` |
| 7 | Review deferred scope | Read [`deferred-scope-register.md`](../operator/deferred-scope-register.md) | Non-blockers listed in §8 |
| 8 | No secrets in evidence | Review diff/logs | No `.env` values in reports |

**Logging pattern (recommended):**

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-pre-staging-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
npm.cmd run validate 2>&1 | Tee-Object -FilePath $log
notepad $log
```

---

## 2.1 Block 5D-B local closeout (2026-07-05)

**Result:** PASS with manual workaround. **Does not authorize G4 staging action or deploy.**

| Item | State |
|------|-------|
| Preflight | `main` = `origin/main`; clean tree; `git diff --check` exit 0 |
| Validate + tests | `validate`, `test:unit`, `test:integration` — PASS |
| Guard refusal proofs | Staging security baseline and bootstrap check exit 1 with refusal text; no remote/DB execution |
| Block 1–2 smokes | External integrations readiness; admin operations 16/16; client-role API boundary 48/48 |
| Puriva boundary | `smoke:puriva-client-portal-boundary:local` — 153/153 PASS |
| Block A core smokes | PASS via manual fallback (see orchestrator caveat below) |

**Default remote guards verified (5D-B):**

- Staging security baseline smoke requires explicit `DCA_SMOKE_REMOTE_TARGET=staging` — refuses without opt-in.
- Bootstrap script requires explicit target + write confirmation and refuses production-shaped host (`dcaosv1-postgres`).

**Not performed:** staging/prod URLs, remote DB, bootstrap write, SSH/VPS/docker/DNS, deploy.

---

## 3. Required env checklist (names only)

Values belong in shell or server-side env only. See [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md).

### Local pre-staging (required)

| Variable | Required for | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | API + all smokes | Local PostgreSQL only |
| `AUTH_SEED_TEST_PASSWORD` | Authenticated smokes | Shell env; never commit |
| `AUTH_SEED_TEST_EMAIL` | Optional | Defaults to `admin@dca.local` |

### Local optional (does not block staging prep)

| Variable | Enables |
|----------|---------|
| `AUTH_SEED_TESTER_EMAIL` | Client portal approval happy-path + final visibility smokes |
| `AUTH_SEED_TESTER_PASSWORD` | Optional when tester password differs from `AUTH_SEED_TEST_PASSWORD` |
| `R2_*` | Optional guarded/local R2 proof (`smoke:r2-byte-roundtrip:local`); live real-bucket proof requires explicit env approval |
| `CREDENTIAL_ENCRYPTION_MASTER_KEY` | Credential encryption smoke |
| `WORDPRESS_PUBLISH_ENABLED` | Open-gate WP probe only (not default) |

### Staging (G4 — prepare names only; do not set locally)

| Area | Variables | Gate |
|------|-----------|------|
| Core | `DATABASE_URL`, `PORT`, `VITE_API_BASE_URL` | Staging DB only — never production |
| Auth | `AUTH_SESSION_TTL_MINUTES`, Turnstile vars | Owner decision at G4 |
| Storage | `R2_*` | Staging bucket; separate from prod |
| WordPress | `WORDPRESS_PUBLISH_ENABLED`, `CREDENTIAL_ENCRYPTION_MASTER_KEY` | Draft-only until owner opens |
| Modules | `TENANT_MODULE_ENFORCEMENT` | Start `off` or `dry_run` |
| Bootstrap | `DCA_BOOTSTRAP_DATABASE_TARGET`, `DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN` | Staging admin bootstrap is mutation-capable; owner-approved at G4 only; refuses `dcaosv1-postgres` host |

**Never print** staging or production secret values in logs, chat, or this pack.

---

## 4. Migration checklist (G4 reference — do not run locally)

Execute only after G4 owner approval and staging infrastructure exist. Full procedure: [`STAGING_MIGRATION_PROCEDURE.md`](./STAGING_MIGRATION_PROCEDURE.md).

| # | Item | Owner |
|---|------|-------|
| 1 | Confirm target is **staging**, not `system.digitalcubeagency.net` | Human |
| 2 | Pin exact commit SHA matching green CI | Human |
| 3 | List pending Prisma migrations; confirm order | Human + DBA |
| 4 | Fresh staging backup **before** `migrate deploy` | Human |
| 5 | Run `prisma migrate deploy`; capture timestamped log | Human |
| 6 | API health + focused smoke after success only | Human |
| 7 | Rollback plan ready if migration or health fails | Human |
| 8 | Production stack untouched | Verified |

Local repo readiness does **not** require running staging migrations.

---

## 5. Smoke checklist (Block A focused subset)

Run from `C:\dcaosv1` in external PowerShell. Requires `AUTH_SEED_TEST_PASSWORD`. Stop on first failure.

### Production Readiness closeout (Mega Block 1 + Block 2 client approval — recommended before staging discussion)

One-command orchestrator:

```powershell
cd C:\dcaosv1
$env:AUTH_SEED_TEST_PASSWORD = "<shell-only>"
npm.cmd run smoke:production-readiness:local
```

List planned steps without running smokes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-production-readiness-local.ps1 -List
```

Covers: `validate`, `git diff --check`, AI Delivery revenue engine + reviews + workflow browser, MI core/integration/hardening/market-intelligence/operator browser/summary-delivery browser, delivery handoff readiness, **client approval happy-path** (`smoke-client-approval-happy-path-local.mjs` — self-SKIP when portal user unavailable; uses `puriva@puriva.id` fallback), client final visibility (skip if no `AUTH_SEED_TESTER_EMAIL`), WordPress publish disabled-safe, R2 disabled-safe (`R2_STORAGE_NOT_CONFIGURED` guard, no storage-reference persistence when config is absent), Puriva client portal boundary, client portal local/browser, monthly report MI context + client/admin browser. Logs to `$env:TEMP` and opens Notepad. Stops on first hard failure. API restart between browser batches; one retry on HTTP 429.

**Client approval happy-path** (`node scripts/smoke-client-approval-happy-path-local.mjs`): requires `AUTH_SEED_TEST_PASSWORD`; proves pending approvals, Review → `ArticleApprovalEditor`, Save & Continue / Approve / Reject, admin `for-approval` 403, no internal leakage, `CLIENT_REVIEW_DEFERRED` on phased plan/draft review. SKIP when portal user cannot be ensured.

### Block A minimum (before staging GO discussion)

One-command orchestrator (Block B):

```powershell
cd C:\dcaosv1
$env:AUTH_SEED_TEST_PASSWORD = "<shell-only>"
npm.cmd run smoke:staging-readiness:local
```

List planned steps without running smokes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/staging-readiness-local.ps1 -List
```

Optional flags on the wrapper: `-IncludeOptional` (metrics + PDF), `-IncludeFullGates` (`smoke:puriva-readiness:local`, `smoke:pre-staging:local`). Logs to `$env:TEMP` and opens Notepad. Stops on first failure. Prisma EPERM: stops only `C:\Program Files\nodejs\node.exe` PIDs, retries `validate` once.

| Order | Command | Primary proof |
|-------|---------|---------------|
| 0 | `npm.cmd run validate` | Typecheck + build all workspaces |
| 1 | `npm.cmd run smoke:puriva-client-portal-boundary:local` | Puriva client-safe boundary |
| 2 | `npm.cmd run smoke:ai-delivery-reviews` | Content plan, drafts, images, deliverables, WP draft prep |
| 3 | `npm.cmd run smoke:ai-seo-content-plan-pdf` | Content plan PDF export + private storage |
| 4 | `npm.cmd run smoke:ai-knowledge-context` | Knowledge isolation + WorkflowBriefs wiring |
| 5 | `npm.cmd run smoke:client-portal-monthly-report:browser` | Client FINAL-only monthly reports UI |
| 6 | `npm.cmd run smoke:monthly-report:browser` | Admin monthly report modal |
| 7 | `npm.cmd run smoke:monthly-report:mi-context` | MI context admin + client non-exposure |

**Prerequisites for browser smokes:** local API on `:4000`, web on `:5173`.

### Optional broader gates (recommended before G4 request)

| Command | When |
|---------|------|
| `npm.cmd run smoke:pre-staging:local` | Full local repo closeout orchestrator |
| `npm.cmd run smoke:puriva-readiness:local` | Puriva setup + full delivery chain |
| `npm.cmd run smoke:monthly-report:local` | Admin report lifecycle API |
| `npm.cmd run smoke:monthly-report:pdf` | PDF generation path |
| `npm.cmd run smoke:monthly-report:metrics` | Metrics snapshot API |
| `node scripts/smoke-delivery-handoff-readiness-local.mjs` | Delivery handoff readiness + WP draft prep disabled-safe (Mega Layer 2) |
| `node scripts/smoke-client-final-visibility-local.mjs` | Client portal final deliverables/reports boundary |
| `node scripts/smoke-ai-delivery-revenue-engine-local.mjs` | Deterministic revenue chain (Mega Layer 1) |

### Staging smoke/proof target guards (G47)

Staging smoke scripts may intentionally refuse to run without explicit remote target env. This is expected safety behavior, not a staging failure.

| Gate | Required explicit env | G47 proof |
|------|-----------------------|-----------|
| MVP staging smoke | `MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1` | PASS after retry with explicit target; `smoke-mvp-staging-exit=0` |
| Staging security baseline | `DCA_SMOKE_REMOTE_TARGET=staging` | PASS after retry with explicit target; `smoke-staging-security-baseline-exit=0`; `31/31 passed, 1 warning(s)` |

HSTS proxy hardening was fixed in **G54**; HSTS is now present on staging and production. Do not run production probes or mutate proxy/Caddy/staging/prod unless explicitly approved in a separate bounded gate.

### Production readiness checklist (G48/G53 sealed planning checklist)

Production deploy remains frozen/deferred. **Production readiness: NO.** G49/G50 **not executed**. G54 HSTS/proxy: **PASS**. Next production path remains G49 dry-run before G50, only after owner approval. Before any production deploy or production mutation, all blockers below must be resolved:

1. Explicit owner approval for a production deploy gate.
2. Confirm exact artifact/commit intended for production promotion.
3. Confirm production backup and rollback evidence before any mutation.
4. Confirm production env separation from staging and no staging credentials in production.
5. Confirm schema/migration safety; stop if migration would drop tables/columns.
6. **G54 HSTS/proxy** — **PASS** (closed 2026-07-09).
7. Keep live integrations gated unless separately approved: AI provider, WordPress, R2, GA/GSC, and transactional email (workflow — not marketing).
8. Run **G49** production deploy dry-run/read-only proof before any production mutation.
9. **G50** production deploy gate only after G49 PASS and explicit owner approval.

Puriva Launch remains **blocked** until live proof gates pass (see [`deferred-scope-register.md`](../operator/deferred-scope-register.md)).

Full plan: [`G53_PRODUCTION_SAFETY_PLAN.md`](./G53_PRODUCTION_SAFETY_PLAN.md).

Full catalog: [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md).

**Operational caveats:**

- **Prisma EPERM:** run `validate` before starting dev servers, or stop locking `node.exe`.
- **Prisma EPERM recovery note:** if the Windows lock persists, stop the locking `node.exe`, remove the generated Prisma client, then rerun `validate` once.
- **G43 runtime order:** for future runtime gates, stop local Node processes first, remove the generated Prisma client folder only if needed, run `npm.cmd run validate`, start API/Web only after validate passes, then run smokes.
- **Runner construction:** do not create PowerShell runners through inline `powershell -Command` or shell interpolation. If a temporary runner is needed, create it through direct file-write/edit capability so quoting and exit-code capture stay deterministic.
- **Exit-code capture:** do not let `Tee-Object` or pipeline output become the source of truth for success/failure; capture actual process exit codes immediately after each native command.
- **HTTP 429:** restart API (`npm.cmd run dev:api`); `smoke:pre-staging:local` restarts API automatically.
- **R2 / WP open-gate probes:** optional; not required for Block A GO. Do not treat local R2 disabled-safe proof as live R2 real-bucket proof, staging/env proof, or production storage readiness.
- **`smoke:staging-readiness:local` orchestrator hang (5D-B):** on local Windows PowerShell, the orchestrator may hang after `smoke:puriva-client-portal-boundary:local` completes even when that step PASSed. If the orchestrator appears stuck after a completed step:
  1. Inspect per-step stdout/stderr logs under `$env:TEMP` (orchestrator opens Notepad on failure; check recent `dca-*` logs).
  2. Confirm the completed step PASSed from its log before proceeding.
  3. Run **only the remaining** Block A scripts manually — do not re-run completed steps unless debugging:
     - `npm.cmd run smoke:ai-delivery-reviews`
     - `npm.cmd run smoke:ai-seo-content-plan-pdf`
     - `npm.cmd run smoke:ai-knowledge-context`
     - `npm.cmd run smoke:client-portal-monthly-report:browser`
     - `npm.cmd run smoke:monthly-report:browser`
     - `npm.cmd run smoke:monthly-report:mi-context`
  4. **No staging/prod commands** during manual fallback — local only.
  5. Before G4 request, owner must fix orchestrator **or** explicitly accept this manual workaround.
- **G35 Phase B closeout:** `npm.cmd run smoke:pre-staging:local` passed locally on `217c11c`; this was a smoke stabilization closeout only and did not perform any VPS, staging, or production deploy.
- **Phase C controlled refresh (2026-07-07):** G35 Phase C refresh complete. Staging artifact updated from `5ee8389` to `5e1ea5a` with local validation PASS before artifact creation. Staging DNS/routes/containers/web/API confirmed responding with artifact context `/opt/dca/staging-artifacts/5e1ea5a`. Staging API health 200/DB ready; web root 200 serving DCA OS v1 HTML; MVP smoke PASS. Production and staging use separate API/Postgres containers and loopback ports; production untouched. Admin bootstrap verified with explicit guard. No `.env` files read or printed.
- **G46d controlled staging deploy/proof (2026-07-09):** PASS. Use staging compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml` with `--env-file .env.staging`; use compose service `dcaosv1-staging-api` (not `api`). Staging API image: `staging-dcaosv1-staging-api:latest`; staging API container: `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; staging DB: `dcaosv1-staging-postgres` on `127.0.0.1:5435->5432`. Production API `dcaosv1-api` on `127.0.0.1:4010->4000` and production DB `dcaosv1-postgres` on `127.0.0.1:5434->5432` remained running. Staging web backup created at `/opt/dca/apps/dcaosv1/staging/backups/web-dist-before-g46d-20260709-084640`. Shared Caddy recreate was approved only to refresh stale staging web bind mount after host-side `dist` replacement; working pattern: `cd /opt/dca && docker compose -f /opt/dca/docker-compose.yml up -d --force-recreate --no-deps caddy`.
- **Caddy mount refresh lesson:** do not replace a mounted `dist` directory with `rm -rf` + `mv` without recreating Caddy afterward. Preferred future pattern is either copy contents into the existing mounted `dist` directory or force recreate Caddy with `--force-recreate --no-deps` after replacing `dist`. Caddy final view for G46d included `/srv/dcaosv1-staging/web/dist/index.html`.

---

## 6. Rollback checklist (G4 execution reference)

| Step | Action |
|------|--------|
| 1 | Stop unhealthy staging containers |
| 2 | Revert to previous recorded image/git revision |
| 3 | Restore staging DB from pre-migration backup if migration ran |
| 4 | Confirm production stack untouched |
| 5 | Re-run staging API health |
| 6 | Record failure evidence; do not promote |

Local Block A does not execute rollback — document only.

---

## 7. Manual QA checklist

Perform in local browser after smokes pass. Use admin `admin@dca.local` and a client test user (e.g. Puriva portal user). **Do not print passwords, tokens, or env values.**

### 7.1 Admin login

| # | Check | Pass |
|---|-------|------|
| 1 | Navigate to app; login as admin | Dashboard loads |
| 2 | Tenant context visible | Current tenant shown |
| 3 | Logout works | Session cleared |
| 4 | Admin routes reachable | AI Delivery, Workflow Briefs, Settings visible |

### 7.2 Client login

| # | Check | Pass |
|---|-------|------|
| 1 | Login as client-only user | Lands on client shell |
| 2 | Admin routes blocked | No admin nav / 403 on admin APIs |
| 3 | Client sees only granted client data | No cross-client leakage |

### 7.3 Client Portal archive (`#/client-portal`)

| # | Check | Pass |
|---|-------|------|
| 1 | Archive list loads | Projects/deliverables visible when seeded |
| 2 | Empty states sane | No internal errors exposed |
| 3 | No publication handoff UI | No "Prepare WordPress drafts" for client |
| 4 | `#/monthly-reports` alias | Same archive UI as `#/client-portal` |

### 7.4 Client monthly reports

| # | Check | Pass |
|---|-------|------|
| 1 | Only FINAL reports listed | Draft/admin reports hidden |
| 2 | Detail view client-safe | No admin notes, import metadata, raw snapshots |
| 3 | `performanceSummary` provenance only | `sourceType` / disclaimer allowed; no raw provider payloads |

### 7.5 Downloads / PDF references

| # | Check | Pass |
|---|-------|------|
| 1 | Monthly report download (client) | Works when `hasDocument`; no `storageKey` in UI/network |
| 2 | Content plan PDF (admin) | Download ready/not-ready state sane; stale PDF cleared on edit |
| 3 | Deliverable documents (admin) | Signed/reference flow; client sees final only |

### 7.6 AiDelivery workspace (`#/ai-delivery`)

| # | Check | Pass |
|---|-------|------|
| 1 | Project list and workspace open | Status badges and sections load |
| 2 | Brief / content plan / drafts sections | Navigation works without console errors |
| 3 | Operator summary collapsible | Metrics optional; no secrets |
| 4 | WordPress publish confirm modal | Confirm/cancel only; no live publish by default |

### 7.7 AI SEO content plan

| # | Check | Pass |
|---|-------|------|
| 1 | Research → summary → plan flow reachable | Admin workflow shell shows readiness |
| 2 | Plan status actions | Review/approve/changes paths work |
| 3 | PDF handoff state | Ready/not-ready matches backend |

### 7.8 WorkflowBriefs (`#/workflow-briefs`)

| # | Check | Pass |
|---|-------|------|
| 1 | Admin brief list/detail | MI/SEO runs, production plan visible |
| 2 | Client "Production Plan Review" | Client-safe labels only |
| 3 | Release package boundary | Client does not see `releasePackageId` or admin internals |

### 7.9 Knowledge visibility

| # | Check | Pass |
|---|-------|------|
| 1 | Admin knowledge items (if routed) | Approved items manageable |
| 2 | WorkflowBriefs knowledge metadata | Read-only safe fields on admin only |
| 3 | Client surfaces | No knowledge tables, prompts, or context bodies |

### 7.10 WordPress draft handoff status

| # | Check | Pass |
|---|-------|------|
| 1 | Admin sees draft-prep / handoff status | Publication log or guarded disabled state |
| 2 | No auto-publish | Publish disabled unless explicitly configured |
| 3 | Client forbidden | No WP credentials or handoff controls |

### 7.11 Client forbidden-field sanity

Confirm absent in client API responses and portal HTML (see [`PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](./PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)):

`storageKey`, `workflowRunId`, `executionLog`, `prompt`, raw AI output, `miHandoffId`, `miContextDraft`, `tenantId`, `adminSummaryNotes`, `releasePackageId`, provider metadata, draft-only content.

### 7.12 Secrets discipline

| # | Check | Pass |
|---|-------|------|
| 1 | No staging/prod secrets in browser devtools | Network tab reviewed |
| 2 | No secrets in QA notes | Names only in reports |
| 3 | `.env` not committed | `git status` clean |

---

## 8. Deferred items (must NOT block staging prep)

These are intentionally out of scope for Block A GO. See [`deferred-scope-register.md`](../operator/deferred-scope-register.md).

| Deferred item | Why it does not block local → staging prep |
|---------------|---------------------------------------------|
| GA / GSC live sync | Snapshot-first metrics; manual/Puriva placeholder path proven |
| Live provider proof | Local deterministic default; OpenRouter opt-in only |
| WorkflowBriefs knowledge picker/override (6C-v2) | Execution wiring + admin read-only visibility (6C-v1) complete |
| `AiContextSnapshot` per-brief audit/schema (6D) | No `briefId` FK today; safety proven via smokes |
| `ClientMonthlyBrief` deprecation | Legacy intake active at `#/client-portal/briefs`; removal needs separate block |
| Large AiDelivery modal refactor | WordPress confirm modal extracted (`3dc1de6`); further splits cosmetic |
| Production deploy | Frozen; G4 staging is separate approval |
| Client approval/comment/magic links | Phased after MVP visibility |
| DNS / Caddy / Docker on VPS | G4 only |
| Live R2 real-bucket proof / WP / OpenRouter on staging | Owner gates at G4; no bucket IO or production storage readiness claim in local closeout |

---

## 9. GO / NO-GO criteria

### GO (ready to **request** G4 staging work)

All must be true:

- [ ] Blocks 1–4 + audit remediation complete; `main` synced; pinned SHA matches green CI
- [ ] Claude audit remediation closed (`2437c84`–`e54445f`); 5D-B local closeout PASS
- [ ] `npm.cmd run validate` PASS
- [ ] Block 1–2 smokes PASS (`external-integrations-readiness`, `admin-operations`)
- [ ] Block A smoke subset (§5) PASS
- [ ] Manual QA checklist (§7) PASS or N/A with documented reason per area
- [ ] No secrets in evidence
- [ ] Deferred items (§8) acknowledged — none treated as blockers
- [ ] Owner explicitly approves **G4 request** (not deploy)

### NO-GO (stop — do not request staging)

Any of:

- Validation or Block A smoke failure (unexplained)
- Client forbidden-field leak in manual QA or boundary smoke
- Undocumented schema/API drift vs docs
- Secrets in logs or committed files
- Attempt to run migrations or deploy without G4 approval
- Critical admin delivery path broken (login, portal archive, monthly reports, AI Delivery workspace)

### Conditional GO

- Full `smoke:pre-staging:local` not yet run → GO for **Block A planning** only; run full orchestrator before G4 request.
- Browser QA blocked by local auth seed issues → report blocker; continue with API smokes only if explicitly accepted.

---

## 10. Decision record template

```text
PRE-STAGING BLOCK A — GO / NO-GO
Date:
Commit SHA:
Operator:

PREFLIGHT
[ ] main synced
[ ] validate PASS
[ ] AUTH_SEED_TEST_PASSWORD set (not printed)

SMOKES (§5)
[ ] puriva-client-portal-boundary
[ ] ai-delivery-reviews
[ ] ai-seo-content-plan-pdf
[ ] ai-knowledge-context
[ ] client-portal-monthly-report:browser
[ ] monthly-report:browser
[ ] monthly-report:mi-context

MANUAL QA (§7)
[ ] Admin login
[ ] Client login
[ ] Client portal archive
[ ] Monthly reports
[ ] Downloads/PDF
[ ] AiDelivery workspace
[ ] AI SEO content plan
[ ] WorkflowBriefs
[ ] Knowledge visibility
[ ] WordPress handoff status
[ ] Forbidden-field sanity
[ ] No secrets printed

DEFERRED (§8) ACKNOWLEDGED: yes / no

DECISION: GO / NO-GO / CONDITIONAL GO

Blockers:
Next step (if GO): Request G4 approval per STAGING_LOCAL_EXECUTION_PACK.md — do not deploy.
```

---

## 11. UI note (Block A discovery)

No admin-only staging checklist UI was added. Existing surfaces (Settings read-only summary, AI Operations workflow review, AiDelivery workspace readiness panels) are module-specific, not staging GO/NO-GO. A static checklist would require new routing (`App.tsx`) — out of scope for Block A. **Docs-only.**

## 12. Consolidated smoke/test matrix and gate-required packs (mega-block addition, 2026-07-09)

**Purpose:** Single consolidated reference for which smoke packs are required before each remaining gate (G49, G50, Puriva Launch), plus known fragile areas. Does not replace [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md) — that remains the full catalog; this section is the gate-mapping view.

### 12.1 Required packs by gate

| Gate | Required local packs | Additional requirement |
|------|----------------------|-------------------------|
| **G49 (production dry-run / read-only proof)** | None (read-only public probes only — no local smoke required) | Public probes §8 of `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`; owner approval sentence |
| **G50 (production deploy)** | `npm.cmd run validate`; Block 1–2 (`smoke:external-integrations-readiness:local`, `smoke:admin-operations:local`, `smoke:client-role-api-boundary:local`); Block A (§5 of this doc); full `smoke:pre-staging:local` recommended | G49 PASS; rollback evidence; exact commit SHA; explicit owner approval naming G50 |
| **Puriva Launch** | All of the above, plus `smoke:puriva-client-portal-boundary:local`, `smoke:puriva-readiness:local`, `smoke:puriva-full-delivery:local`, monthly report + client portal packs | Live proof gates per [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) — R2, GA/GSC, live AI, image gen, transactional notifications, AI Model Research/Policy |

### 12.2 Consolidated STOP criteria (applies to any gate above)

- Any local smoke fails and the failure is not already a documented/expected skip (see §12.3)
- Any client forbidden-field leak observed in manual QA or boundary smoke
- Secrets appear in any log, smoke output, or diff
- Any attempt to run migrations, deploy, or mutate VPS without the specific gate's explicit owner approval
- Critical admin delivery path broken (login, portal archive, monthly reports, AI Delivery workspace)
- Public probe (G49) returns non-200, missing HSTS, or DB not ready

### 12.3 Known fragile areas / expected skips (do not treat as failures)

| Area | Symptom | Expected handling |
|------|---------|---------------------|
| Prisma EPERM (Windows) | `query_engine-windows.dll.node` EPERM during `prisma generate` | Stop locking `node.exe`, remove generated client, rerun `validate` once (see `OPERATOR_RUNBOOK.md` §3) |
| `smoke:staging-readiness:local` orchestrator hang | Hangs after Puriva boundary smoke completes on local Windows PowerShell | Inspect `$env:TEMP` per-step logs; run remaining Block A scripts manually (§5 operational caveats) |
| HTTP 429 | Local rate limit (300 req/15 min) | Restart API; rerun failed smoke |
| R2/WordPress disabled-safe skip | `R2_STORAGE_NOT_CONFIGURED` / `provider_disabled` | Expected default; not a failure |
| `smoke-client-final-visibility-local` skip | `AUTH_SEED_TESTER_EMAIL` absent | Expected discovery-only skip |
| Staging remote smokes refuse without explicit target env | MVP staging smoke / staging security baseline exit non-zero without `MVP_SMOKE_API_BASE_URL` / `DCA_SMOKE_REMOTE_TARGET` | Expected safety refusal, not a bug — see G47 target-guard lesson |

### 12.4 Recommended hardening (not executed this session — docs-only recommendation)

1. Fix the `smoke:staging-readiness:local` orchestrator hang at its root cause (Windows PowerShell process/log handling after the Puriva boundary smoke) rather than relying on the manual fallback indefinitely.
2. Add an `email` category to `GET /api/v1/integrations/readiness` (see `INTEGRATIONS_TRUTH_MATRIX.md` M-2) so the readiness API and this smoke matrix stay in sync as new integrations are added.
3. Consider a lightweight CI job that runs `git diff --check` + doc-link validation on every docs-only PR, to catch stale cross-references automatically (this mega-block's stale scan was manual).

---

## G54 HSTS/proxy fix completion (2026-07-09)

**Result:** PASS — HSTS/proxy fix applied on VPS.

**Scope:** Caddy/proxy only. No app deploy, no API/DB/schema/source changes, no migrations, no production app deployment.

**Changed runtime file:** `/opt/dca/caddy/Caddyfile`

**Backup:** `/opt/dca/backups/Caddyfile.G54-HSTS.20260709-073546.bak`

**Reload scope:** `dca-caddy` only.

**Proof:**

- `https://staging.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `https://system.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- staging `/api/v1/health` returned OK with database ready
- production `/api/v1/health` returned OK with database ready

**Warning:** Caddy emitted a formatting warning only. `caddy validate` passed. No formatting-only change was applied during G54 to keep scope minimal.

**Remaining production status:** Production readiness remains **NO**. G54 clears the HSTS/proxy blocker only. G49 dry-run and G50 production deploy are still **not executed** and require separate owner approval.
