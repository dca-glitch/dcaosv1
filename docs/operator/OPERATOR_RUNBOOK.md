# DCA OS Lite — Operator Runbook (Consolidated)

**Status:** Single operator entry point for local validation, smoke, recovery, and staging/production prerequisites. **PRE-STAGING closure refresh (2026-07-10)** after G469–G708 ultra-block / G649–G660 operator docs. Hard truths: local foundations expanding; **live proofs deferred**; **Puriva Launch BLOCKED**; **production frozen** (readiness **NO**); staging/prod live proofs **NOT proven** by this closeout; no smoke after failed validate; PowerShell one-command-per-line. **Next stage = owner-approved staging/live proof only** (default first candidate: R2 target-bucket per [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md)) — local ready ≠ launch ready; `configured_shape_ok` ≠ live_proven. G35 Phase B local pre-staging gate passed on `217c11c`; G35 Phase C controlled staging refresh completed on commit `5e1ea5a`. G46d/G47 staging deploy/smoke/proof PASS (historical only — not standing authorization). G48 production readiness planning PASS. **G53 production safety plan approved (planning only).** G49 public read-only probes PASS, but formal G49 closure still needs the owner-approval sentence; G50 **not executed**. G54 HSTS/proxy: **PASS**. Next production path remains formal G49 closure before G50, only after owner approval. Prior operator refreshes: G138-G144, G223-G227, G409–G428 (prefer [`SECURITY_CHECKLIST_G409.md`](../security/SECURITY_CHECKLIST_G409.md)). Post-G708 roadmap: [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md). G649–G660 closeout: [`G649_G660_OPERATOR_CLOSEOUT.md`](./G649_G660_OPERATOR_CLOSEOUT.md). PRE-STAGING operator closeout: [`PRE_STAGING_OPERATOR_CLOSEOUT.md`](./PRE_STAGING_OPERATOR_CLOSEOUT.md). No live calls, staging/prod mutation, commit, push, or deploy in this docs lane.
**Source of truth for product state:** [`docs/STATUS.md`](../STATUS.md)

Related detailed runbooks:

| Topic | Document |
|-------|----------|
| Staging GO/NO-GO | [`docs/runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) |
| Pre-staging one-command gate | [`docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`](../runbooks/PRE_STAGING_VALIDATION_GATE.md) |
| Smoke catalog | [`docs/runbooks/LOCAL_SMOKE_MATRIX.md`](../runbooks/LOCAL_SMOKE_MATRIX.md) |
| External integrations readiness | [`docs/runbooks/EXTERNAL_INTEGRATIONS_READINESS.md`](../runbooks/EXTERNAL_INTEGRATIONS_READINESS.md) |
| Admin operations recovery | [`docs/runbooks/ADMIN_OPERATIONS_RECOVERY.md`](../runbooks/ADMIN_OPERATIONS_RECOVERY.md) |
| Client delivery SOP | [`docs/operator/client-delivery-sop.md`](./client-delivery-sop.md) |
| Client delivery readiness | [`docs/ai-delivery/client-delivery-readiness.md`](../ai-delivery/client-delivery-readiness.md) |
| Puriva operating pack (canonical) | [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md) |
| G9 environment proof gate | [`docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) |
| G53 production safety plan | [`docs/runbooks/G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md) |
| G49 production dry-run proof | [`docs/runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](../runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) |
| Production deployment / rollback / checklist (reference, G50 not executed) | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md) · [`docs/runbooks/PRODUCTION_ROLLBACK.md`](../runbooks/PRODUCTION_ROLLBACK.md) · [`docs/runbooks/PRODUCTION_SAFETY_CHECKLIST.md`](../runbooks/PRODUCTION_SAFETY_CHECKLIST.md) |
| Puriva Launch Gate (15-area evaluation) | [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md) |
| Storage/R2 live proof plan | [`docs/runbooks/STORAGE_R2_PROOF.md`](../runbooks/STORAGE_R2_PROOF.md) |
| Integrations truth matrix | [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md) |
| G138 security checklist refresh (historical) | [`docs/security/SECURITY_CHECKLIST_G138.md`](../security/SECURITY_CHECKLIST_G138.md) |
| G223 security checklist (historical) | [`docs/security/SECURITY_CHECKLIST_G223.md`](../security/SECURITY_CHECKLIST_G223.md) |
| G409 security checklist (prefer) | [`docs/security/SECURITY_CHECKLIST_G409.md`](../security/SECURITY_CHECKLIST_G409.md) |
| Production freeze / staging guard sweeps | [`PRODUCTION_FREEZE_SWEEP.md`](../security/PRODUCTION_FREEZE_SWEEP.md) · [`STAGING_GUARD_SWEEP.md`](../security/STAGING_GUARD_SWEEP.md) |
| Redaction inventories | [`SECRETS_REDACTION_INVENTORY.md`](../security/SECRETS_REDACTION_INVENTORY.md) · [`STORAGE_KEY_REDACTION_INVENTORY.md`](../security/STORAGE_KEY_REDACTION_INVENTORY.md) · [`CLIENT_BOUNDARY_INVENTORY.md`](../security/CLIENT_BOUNDARY_INVENTORY.md) |
| G651 / G419 package-script test/smoke inventory | [`TEST_SMOKE_INVENTORY.md`](./TEST_SMOKE_INVENTORY.md) |
| G650 / G418 validation command guards | [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md) |
| No-live / live-approval / owner checklists | [`NO_LIVE_PROOF_CATALOGUE.md`](./NO_LIVE_PROOF_CATALOGUE.md) · [`LIVE_PROOF_APPROVAL_CHECKLIST.md`](./LIVE_PROOF_APPROVAL_CHECKLIST.md) · [`OWNER_GATE_CHECKLIST.md`](./OWNER_GATE_CHECKLIST.md) · [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md) |
| Next-gate execution / PowerShell safety | [`NEXT_GATE_EXECUTION_CHECKLIST.md`](./NEXT_GATE_EXECUTION_CHECKLIST.md) · [`POWERSHELL_SAFETY_CHECKLIST.md`](./POWERSHELL_SAFETY_CHECKLIST.md) |
| Env names (no values) | [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md) |
| Deferred scope (main-owned) | [`deferred-scope-register.md`](./deferred-scope-register.md) |
| G468 next-50 / G649–G660 / PRE-STAGING closeout | [`G468_NEXT_50_GATES.md`](./G468_NEXT_50_GATES.md) · [`G649_G660_OPERATOR_CLOSEOUT.md`](./G649_G660_OPERATOR_CLOSEOUT.md) · [`PRE_STAGING_OPERATOR_CLOSEOUT.md`](./PRE_STAGING_OPERATOR_CLOSEOUT.md) |

**Run location:** External Windows PowerShell from `C:\dcaosv1`. Log long runs to `$env:TEMP` and open in Notepad. Stop on first failure.

## 0. G9 environment proof index

1. Read `docs/STATUS.md` and `docs/STATUS_COMPLETION.md`.
2. Confirm [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md), [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md), and `PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`.
3. Read `docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`.
4. Wait for explicit owner approval.
5. If approved, use the Sonnet-only execution prompt in the G9 gate doc.
6. If the proof passes, run the docs-only closeout later.
7. If the proof fails, stop and preserve logs/evidence.

---

## 1. Local validation procedure

### Order

1. `git fetch origin` — confirm `main` = `origin/main`; pin SHA.
2. `git diff --check` — fix whitespace issues.
3. Stop dev servers if Prisma EPERM risk (ports 4000/5173).
4. `npm.cmd run validate` — prisma generate + check + build all workspaces.
5. Run smokes **only after validate PASS**.
6. Latest proven local pre-staging closeout: `npm.cmd run smoke:pre-staging:local` PASS on `217c11c`; G35 Phase C controlled staging refresh complete on `5e1ea5a` with pre-artifact validation PASS; CI green; browser drift blockers resolved in the Phase B smoke set; staging artifact, API, and MVP smoke verified.
7. G43 local re-check confirmed validate-before-services ordering on current `main` at `a18dcc1`: `npm.cmd run validate`, `smoke:client-portal:populated-delivery:browser`, `smoke:client-portal:edge-cases:browser`, `smoke:client-portal:sparse-delivery:browser`, and `smoke:monthly-report:local` all PASS after G38/G39/G41 copy polish. This remains local-only and does not authorize staging/VPS/prod/deploy.

### Command (with logging)

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-validate-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
npm.cmd run validate 2>&1 | Tee-Object -FilePath $log
notepad $log
```

### What validate proves

- Prisma client generates
- Typecheck passes all workspaces
- Build passes (web + packages)

### What validate does not prove

- Runtime API behavior
- Database seed state
- Browser UI flows
- External integrations
- Staging or production readiness

See [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md).

G143 operator guard reference: [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md). It records PowerShell-only command discipline, validate-before-smoke ordering, Prisma EPERM recovery, staging/production command boundaries, and change-type validation expectations.

---

## 2. Local smoke procedure

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| `DATABASE_URL` | Local PostgreSQL |
| `AUTH_SEED_TEST_PASSWORD` | Shell only; min 8 chars; **never commit or print** |
| Local API `:4000` | Required for most smokes |
| Local Web `:5173` | Required for `*:browser` smokes |

Set password in shell only:

```powershell
$env:AUTH_SEED_TEST_PASSWORD = "<from-local-shell-only>"
```

### Recommended smoke tiers

| Tier | Command | When |
|------|---------|------|
| **Block 1–2 focused** | `smoke:external-integrations-readiness:local`, `smoke:admin-operations:local` | After validate; fast config/boundary proof |
| **Block A minimum** | `npm.cmd run smoke:staging-readiness:local` | Pre-staging GO discussion |
| **Closeout** | `npm.cmd run smoke:production-readiness:local` | Broad deterministic delivery proof (long) |
| **Full repo** | `npm.cmd run smoke:pre-staging:local` | Full local closeout before G4 request |

### Logging pattern

```powershell
cd C:\dcaosv1
$log = Join-Path $env:TEMP "dca-smoke-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
npm.cmd run smoke:admin-operations:local 2>&1 | Tee-Object -FilePath $log
notepad $log
```

### Staging smoke target guards (G47 lesson)

Remote staging smokes require explicit target env and may intentionally refuse to run without it:

| Smoke | Required explicit env | G47 result |
|-------|-----------------------|------------|
| MVP staging smoke | `MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1` | PASS after target-guard retry; `smoke-mvp-staging-exit=0` |
| Staging security baseline | `DCA_SMOKE_REMOTE_TARGET=staging` | PASS after remote-target-guard retry; `smoke-staging-security-baseline-exit=0`; `31/31 passed, 1 warning(s)` |

G47c reported HSTS missing at G47 time (historical). **G54 HSTS/proxy: PASS** — HSTS is now present on staging and production. Do not run production probes, deploy, or mutate VPS/staging/prod without separate explicit approval. Next production path: **G49** read-only dry-run proof before G50.

### HTTP 429 recovery

Local API rate limit: 300 req / 15 min per IP. Restart API (`npm.cmd run dev:api`) and rerun failed smoke. Orchestrators restart API between browser batches.

---

## 3. Prisma EPERM / DLL lock recovery (Windows)

**Symptom:** `prisma generate` fails with EPERM on `query_engine-windows.dll.node`.

**Cause:** Running `node.exe` (usually `dev:api` or `dev:web`) holds the Prisma query engine DLL.

### Recovery steps

1. Run validate **before** starting dev servers (preferred).
2. If already running, list Node PIDs: `Get-Process -Name node | Select-Object Id, StartTime`
3. Stop **only** locking PIDs — prefer `C:\Program Files\nodejs\node.exe` from dev servers.
4. Remove the generated Prisma client before retrying.
5. **Do not** use `Stop-Process -Name node` (kills unrelated processes).
6. Retry `npm.cmd run validate` **once**.
7. If still failing, stop and report — do not guess further.

`smoke:staging-readiness:local` and `smoke:production-readiness:local` include one EPERM retry (Program Files `node.exe` only).

**G43 runtime gate order:** stop local Node processes first; remove the generated Prisma client folder only if needed; run `npm.cmd run validate`; start API/Web only after validate passes; then run smokes. This avoids Windows Prisma DLL locks during validation.

**G46d validation lesson:** initial local validate failed due to Windows Prisma `query_engine` DLL `EPERM` lock. Recovery was stopping `node.exe`, waiting, then rerunning validate; rerun PASS. Stop after one retry if the same runtime error persists.

**Orchestrator hang caveat (5D-B):** `smoke:staging-readiness:local` may hang on local Windows PowerShell after Puriva boundary smoke completes. If stuck, inspect `$env:TEMP` per-step logs and run only the remaining Block A scripts manually — see [`STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) §5 operational caveats. No staging/prod commands during fallback.

**G35 Phase B note:** the follow-on browser smoke stabilization closeout passed through full local `smoke:pre-staging:local` on `217c11c` with CI green. This closed browser drift blockers only; no app/backend/API/schema/auth/business-logic, staging, VPS, or production changes were made.

Reference: [`docs/database/PRISMA_CLIENT_GENERATION_READINESS.md`](../database/PRISMA_CLIENT_GENERATION_READINESS.md).

---

## 4. Admin operations recovery

**Surface:** Dashboard → Operational readiness; `GET /api/v1/admin/operations/summary`.
**Cockpit cue:** `AdminDailyOperationsCockpit` groups work into `Ready now`, `Needs review`, and `Blocked / waiting`. Start there before opening deeper consoles.

| Symptom | First action |
|---------|----------------|
| Validate failed | Read validate log in `$env:TEMP`; fix first failing workspace |
| Prisma EPERM | §3 above |
| Smoke failed after validate | Rerun single smoke; confirm API/web running |
| `missing_config` in readiness | Check [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md); restart API after env change |
| Integration `disabled` | Expected local default |
| WordPress publish disabled | `WORDPRESS_PUBLISH_ENABLED` not true — draft prep only |
| R2 disabled | Expected and safe locally; guarded paths return `R2_STORAGE_NOT_CONFIGURED` instead of persisting storage references; live real-bucket proof needs explicit env approval |
| Environment / owner gate blocked | Stop in the cockpit; no environment proof or execution until separate owner approval |
| Closeout status `manual_run_required` | Expected — no fake green; run smokes manually |

**Smoke:** `npm.cmd run smoke:admin-operations:local`

Full detail: [`docs/runbooks/ADMIN_OPERATIONS_RECOVERY.md`](../runbooks/ADMIN_OPERATIONS_RECOVERY.md).

---

## 4.0 G138-G144 / G409-G428 / G649-G660 owned-doc truth sweep

This runbook refresh is docs-only. It does not supersede `docs/STATUS.md`, `deferred-scope-register.md`, `INTEGRATIONS_TRUTH_MATRIX.md`, `PURIVA_LAUNCH_GATE.md`, or `G708_NEXT_GATES.md`.

| Gate | Outcome |
|------|---------|
| G138 | Security checklist refreshed in [`docs/security/SECURITY_CHECKLIST_G138.md`](../security/SECURITY_CHECKLIST_G138.md). |
| G139 | Integrations truth matrix changes are report-only proposals; protected file not edited by this subagent. |
| G140 | Production readiness truth sweep recorded in owned docs; production readiness remains **NO**. |
| G141 | Staging readiness truth sweep recorded in owned docs; staging proof remains historical and future staging action needs fresh approval. |
| G142 | Package-script test/smoke inventory added in [`TEST_SMOKE_INVENTORY.md`](./TEST_SMOKE_INVENTORY.md). |
| G143 | Validation command guard doc added in [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md). |
| G144 | Operator runbook refreshed with links, truth sweep, and report-only protected-doc patch proposals. |
| G409–G428 | Security checklist G409 + redaction/freeze/staging inventories; validation/smoke/runbook refresh; no-live catalogue; live-proof and owner checklists; local-only taxonomy; lane roadmap notes in [`G409_NEXT_GATES.md`](./G409_NEXT_GATES.md). |
| G649–G660 | Operator runbook / validation / proof-approval refresh for G469–G708 ultra-block; next-gate + PowerShell safety checklists; closeout in [`G649_G660_OPERATOR_CLOSEOUT.md`](./G649_G660_OPERATOR_CLOSEOUT.md). |

Truth sweep summary (current):

- Local foundations: expanding under G469–G708 lanes (no-IO / disabled-safe / design-only). Do **not** treat as launch proof. Local ready ≠ launch ready; `configured_shape_ok` ≠ live_proven.
- Live proofs: **deferred** until a separately approved execution gate. **Next stage = owner-approved staging/live proof only** (default first candidate: R2 target-bucket per [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md)).
- Staging: G46d/G47 PASS is recorded for the prior artifact/context only; no fresh staging action was performed here; further staging needs **fresh** owner approval ([`STAGING_GUARD_SWEEP.md`](../security/STAGING_GUARD_SWEEP.md)).
- Production: G49 public read-only probes PASS, formal G49 closure pending owner sentence, G50 not executed, production readiness **NO**, production **frozen** ([`PRODUCTION_FREEZE_SWEEP.md`](../security/PRODUCTION_FREEZE_SWEEP.md)).
- Puriva Launch: **BLOCKED** pending live proof gates and product workflow gates.
- Integrations: no staging/production live proof is newly claimed; local/config-shape evidence remains labeled as such.
- `.cursor/settings.json`: must remain **untracked**; never `git add` (observed `??` during PRE-STAGING closure).

---

## 4.1 AI SEO planning + content drafts operator path

AI SEO lives in the local operator workflow inside **WorkflowBriefs** and **AI Delivery**. Use WorkflowBriefs first for intake, approved KB/context, MI/SEO reports, production/content plan generation, content objective seeding, draft generation, package completeness, and draft-only publication handoff. Use AI Delivery for the monthly content plan, content drafts, review/polish records, deliverables, PDF/export handoff status, monthly report handoff, and client-safe final/archive surfaces.

Approved local sequence:

1. Submit WorkflowBrief with verified intake facts.
2. Run local deterministic MI/SEO outputs from the submitted brief.
3. Generate the production/content plan.
4. Seed content objectives into AI Delivery.
5. Generate drafts, then review/polish before packaging.
6. Package/export handoff status, then prepare the AI Delivery handoff.

Local export rules: R2-disabled behavior is safe and expected unless R2 env is explicitly configured; guarded storage writes return `R2_STORAGE_NOT_CONFIGURED` instead of persisting storage references. Admin handoffs may expose safe download-reference fields; client-safe responses must never expose `storageKey`. Google Docs live export, R2 live IO, live WordPress publish, live crawling, GSC/GA sync, and live provider execution remain deferred unless a separate owner-approved block proves them.

Focused proof commands after `npm.cmd run validate` passes:

```powershell
npm.cmd run smoke:ai-seo-content-plan-pdf
npm.cmd run smoke:workflow-brief-publication-handoff:browser
npm.cmd run smoke:ai-delivery-workflow:browser
npm.cmd run smoke:ai-delivery-reviews
```

---

## 4.2 AI Delivery workflow operator path

AI Delivery is the local operator execution surface after WorkflowBriefs/AI SEO context composition closes. The complete local sequence is: monthly project → brief/context handoff (from WorkflowBriefs) → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report → client-safe archive handoff.

Approved local sequence:

1. Create or select the monthly AI Delivery project and confirm the brief/context handoff from WorkflowBriefs (verified intake → approved KB/context → brief → SEO plan).
2. Open Workflow runs for run visibility and status tracking (local deterministic gateway by default).
3. Review the monthly content plan and content objectives seeded from WorkflowBriefs.
4. Generate and review content drafts; keep review/polish operator-side until approved.
5. Move approved drafts and approved/final-ready article images into deliverable reviews and packaging.
6. Prepare the WordPress draft (draft-only; live publish stays disabled unless a separately approved block enables `WORDPRESS_PUBLISH_ENABLED=true`).
7. Prepare the monthly report and confirm client-safe FINAL-only archive visibility in Client Portal.

Local export rules: R2-disabled behavior is safe and expected; the system must not expose `storageKey`, prompts, draft bodies, review notes, internal notes, contentDraftId/articleImageId storage internals, tenant IDs, or provider/model/gateway/audit/cost metadata on client-visible surfaces. Deliverable and monthly report client downloads use safe `downloadReference` responses, and `exportUrl` is intentionally client-visible only when admin provides a safe external handoff link. Live AI provider execution, live WordPress publish, live GA/GSC sync, live R2 IO, Google Docs live export, staging/environment proof, and production readiness remain deferred.

Focused proof commands after `npm.cmd run validate` passes:

```powershell
npm.cmd run smoke:ai-delivery-workflow:browser
npm.cmd run smoke:ai-delivery-reviews
npm.cmd run smoke:workflow-brief-publication-handoff:browser
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:client-portal:browser
npm.cmd run smoke:ai-seo-content-plan-pdf
```

---

## 5. External integrations readiness

**Purpose:** Config-shape validation only — no live provider calls, publish, sync, crawl, or bucket mutation.

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:external-integrations-readiness:local
```

Optional API probe (API on `:4000`, `AUTH_SEED_TEST_PASSWORD` set):

```powershell
$env:SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API = "true"
npm.cmd run smoke:external-integrations-readiness:local
```

Admin API: `GET /api/v1/integrations/readiness` (owner/admin, read-only).

Full detail: [`docs/runbooks/EXTERNAL_INTEGRATIONS_READINESS.md`](../runbooks/EXTERNAL_INTEGRATIONS_READINESS.md).

---

## 6. Staging prerequisites

**Does not authorize deploy.** Prepares repo-side GO/NO-GO for G4 request.

| # | Prerequisite |
|---|--------------|
| 1 | Blocks 1–4 complete; CI green on pinned SHA |
| 2 | Claude full-code audit completed (separate approved block) |
| 3 | `npm.cmd run validate` PASS |
| 4 | Block A smokes PASS (`smoke:staging-readiness:local` minimum) |
| 5 | Manual QA per [`STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) §7 |
| 6 | Working tree clean; `main` = `origin/main` |
| 7 | Deferred items acknowledged — not treated as blockers |
| 8 | Owner explicitly approves **G4 request** (not deploy) |
| 9 | Staging env names prepared — values server-side only at G4 |
| 10 | Staging DB separate from production; migration procedure reviewed |

**Staging target:** `staging.digitalcubeagency.net` (G1 documented; G35 Phase C controlled refresh complete on `5e1ea5a`; artifact context `/opt/dca/staging-artifacts/5e1ea5a`; staging API/web/MVP smoke PASS; production untouched; any further staging/VPS/prod work requires fresh explicit owner approval).

**G46d staging deploy/proof facts:** staging API context `/opt/dca/staging-artifacts/5e1ea5a`; host-side staging web target `/opt/dca/apps/dcaosv1/staging/web/dist`; staging compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml`; compose requires `--env-file .env.staging`; correct staging API service is `dcaosv1-staging-api` (not `api`). Staging web backup: `/opt/dca/apps/dcaosv1/staging/backups/web-dist-before-g46d-20260709-084640`; API image: `staging-dcaosv1-staging-api:latest`; staging API container `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; staging DB `dcaosv1-staging-postgres` on `127.0.0.1:5435->5432`. Production API `dcaosv1-api` on `127.0.0.1:4010->4000` and production DB `dcaosv1-postgres` on `127.0.0.1:5434->5432` remained running.

**Caddy mount refresh lesson:** G46d required an approved shared Caddy force recreate only because staging web deploy used `rm -rf` + `mv` on the host-side `dist` path, leaving Caddy seeing stale/missing mounted content until container recreate. Working pattern: `cd /opt/dca && docker compose -f /opt/dca/docker-compose.yml up -d --force-recreate --no-deps caddy`. Preferred future pattern: copy contents into the existing mounted `dist` directory, or force recreate Caddy with `--force-recreate --no-deps` after replacing `dist`. G46d final Caddy view included `/srv/dcaosv1-staging/web/dist/index.html`.

**Forbidden before G4 approval:** VPS login, Docker apply, Caddy/DNS, staging migrations, `smoke:mvp:staging` without owner approval.

**Staging admin bootstrap warning:** `npm run bootstrap:staging-admin` is mutation-capable (admin password hash, tenant, modules). Requires `DCA_BOOTSTRAP_DATABASE_TARGET=staging`, approved staging `DATABASE_URL` host (`dcaosv1-staging-postgres` or loopback only — **`dcaosv1-postgres` refused**), and write-mode confirmation `DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN=I_UNDERSTAND_THIS_MUTATES_STAGING`. Owner-approved at G4 only; never CI or local default gate. `--check` is read-only but still requires target guard + approved `DATABASE_URL`.

---

## 7. Production prerequisites

**Production is not ready.** Production remains **frozen** unless explicitly approved in a separate block. G48/G53 planning PASS; production deploy ready remains **NO**. **No deploy until G49 dry-run + G50 explicit owner approval.** G49/G50 have **not** been executed.

| # | Prerequisite (when approved) |
|---|---------------------------|
| 1 | Explicit owner approval for a production deploy gate |
| 2 | Confirm exact artifact/commit intended for production promotion |
| 3 | Confirm production backup and rollback evidence before any mutation |
| 4 | Confirm production env separation from staging and no staging credentials in production |
| 5 | Confirm schema/migration safety; stop if migration would drop tables/columns |
| 6 | **G54 HSTS/proxy** — **PASS** (closed 2026-07-09) |
| 7 | Keep live integrations gated unless separately approved: AI provider, WordPress, R2, GA/GSC, and email sending |
| 8 | Run **G49** production deploy dry-run/read-only proof before any production mutation |
| 9 | **G50** production deploy gate only after G49 PASS and explicit owner approval |

### Production v1 operating rules

- **Controlled agency ops** — not full automation; admin-controlled, approval-gated workflows.
- **AI admin-controlled** — AI prepares; admin reviews and decides what becomes final.
- **WordPress draft/handoff required** for Puriva Launch; WordPress auto-publish remains deferred.
- **Email = transactional workflow** (approval, handoff, delivery status) — not marketing campaigns.
- **Puriva Launch blocked** until live proof gates pass: R2, GA/GSC, live AI, image gen, transactional notifications, and product workflow gates (see deferred-scope register).

**Next gates (ordered reference):** G49 production dry-run/read-only proof before any production deploy path. Puriva Launch proof gates remain separate: R2 proof → GA/GSC proof → AI Model Research → AI Model Policy → live AI proof → image generation proof → transactional notifications proof.

**G48/G53 runtime proof (historical):** `staging-root-http=200`; `staging-health-http=200`; `production-root-http=200`; `production-health-http=200`. Runtime separation: shared Caddy `dca-caddy`; staging API `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; production API `dcaosv1-api` on `127.0.0.1:4010->4000`.

**Production URL:** `system.digitalcubeagency.net` — production deploy is not authorized by staging PASS, G47 PASS, G48/G53 planning PASS, or G52-B baseline.

Full plan: [`docs/runbooks/G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).

---

## 8. Rollback notes

### Local

- Revert uncommitted changes: `git checkout -- <file>` or `git restore`.
- Do not use destructive git commands without explicit approval.

### Staging (G4 reference only — not executed in doc blocks)

| Step | Action |
|------|--------|
| 1 | Stop unhealthy staging containers |
| 2 | Revert to previous recorded image/git revision |
| 3 | Restore staging DB from pre-migration backup if migration ran |
| 4 | Confirm production stack untouched |
| 5 | Re-run staging API health |
| 6 | Record failure evidence; do not promote |

Local doc blocks do not execute rollback.

---

## 9. Commit / push policy

| Rule | Detail |
|------|--------|
| No commit without approval | Human reviews diff after validate/smoke |
| No push without separate approval | Commit and push are separate gates |
| One file per `git add` during UI migration tasks | See `.cursor/rules/design-system-migration.mdc` |
| No force push to `main` | Warn if requested |
| No amend after failed hook | Create new commit |
| Branch strategy | Feature branches for implementation; docs-only may commit on `main` when approved |
| Agent rule | Copilot/CLI blocks `git commit` and `git push` by default |

Reference: [`docs/ai-delivery/copilot-cli-permissions.md`](../ai-delivery/copilot-cli-permissions.md), [`AGENTS.md`](../../AGENTS.md).

---

### Safe commit/push runner-control pattern

Use the reusable PowerShell helper library at [`scripts/lib/runner-control.ps1`](../../scripts/lib/runner-control.ps1) for any manual commit gate or future script that may commit or push.

Core rules:

- Set `Set-StrictMode -Version Latest` and `$ErrorActionPreference = "Stop"` at the top of the script.
- Run each native command through `Invoke-LoggedNativeStep` so `$LASTEXITCODE` is captured immediately after that command finishes.
- Treat warning-only stderr as informational unless the command exits non-zero or you explicitly match a fatal sentinel.
- Use `throw` for fail-fast paths; do **not** rely on `return` alone inside a top-level wrapper.
- Run `git commit` only after all validation checks pass.
- Run `git push` only after commit success and `Assert-WorkingTreeClean` confirms an empty `git status --porcelain`.
- Open the log in Notepad from `finally` or after the gate completes.
- Avoid inline `powershell -Command` runner generation or shell interpolation for complex runners; if a runner is needed, create it through direct file-write/edit capability.

Minimal pattern:

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\runner-control.ps1"

$log = New-RunnerControlLogPath -Prefix "dca-git-gate"
try {
  Invoke-LoggedNativeStep -Label "git diff --check" -Command { git diff --check } -LogPath $log
  Invoke-LoggedNativeStep -Label "npm.cmd run validate" -Command { npm.cmd run validate } -LogPath $log
  Assert-WorkingTreeClean -LogPath $log

  Invoke-LoggedNativeStep -Label "git add" -Command { git add docs/STATUS.md docs/STATUS_COMPLETION.md } -LogPath $log
  Invoke-LoggedNativeStep -Label "git commit" -Command { git commit -m "docs: record closeout" } -LogPath $log
  Assert-WorkingTreeClean -LogPath $log
  Invoke-LoggedNativeStep -Label "git push" -Command { git push origin main } -LogPath $log
} finally {
  Open-RunnerControlLog -LogPath $log
}
```

This pattern prevents a failed validate/check from flowing into commit/push, even when the command output includes warning text on stderr.

## 10. Secret handling policy

| Rule | Detail |
|------|--------|
| Never commit secrets | No `.env`, tokens, passwords, or `DATABASE_URL` values in repo |
| Never print secrets | Reports use variable **names** only |
| Local admin password | `$env:AUTH_SEED_TEST_PASSWORD` in shell only |
| Local admin email | Convention: `admin@dca.local` |
| Staging vs production | Separate env files; staging must not use production DB |
| Logs | Review before sharing; redact if accidental exposure |
| Smoke output | Scripts must not print passwords, tokens, cookies, or hashes |
| Credential files | Do not read, print, or modify `.env`, `.env.local`, or credential files in agent tasks |

Full inventory: [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md).

---

## Quick command reference

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:external-integrations-readiness:local
npm.cmd run smoke:admin-operations:local
npm.cmd run smoke:staging-readiness:local
npm.cmd run smoke:production-readiness:local
node scripts/smoke-client-approval-happy-path-local.mjs
```

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

## G49 formal closure documentation + fresh public probes (2026-07-09, Subagent B)

Fresh public read-only probes were re-run from Windows PowerShell (no SSH, no mutation): all four §6.2 targets (staging root, staging health, production root, production health) returned HTTP 200 with HSTS present and database ready. Full detail: [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](../runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) §1.2 and §17. **G49 formal gate closure still requires a separately recorded owner-approval sentence** (§10 item 1 of that runbook) — this task did not supply it. **G50 remains not executed / not authorized. Production readiness remains NO.**

## G138-G144 report-only proposed patches for protected docs

These are handoff notes for the main agent. This subagent did **not** edit `docs/STATUS.md`, `docs/operator/deferred-scope-register.md`, `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`, or `docs/runbooks/PURIVA_LAUNCH_GATE.md`.

### Proposed `docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md` patch (G139)

- Add a post-G138 note: "G138 security checklist refresh and G142/G143 operator docs introduced no integration proof changes. Staging proof remains `Not proven` and production proof remains `Not proven` for every live integration row unless already recorded otherwise."
- Add explicit no-call scope: no OpenRouter, WordPress, GA/GSC, R2, Resend, image-provider, staging, production, VPS, commit, push, or deploy action occurred in G138-G144.
- Preserve current local-only distinction for OpenRouter and disabled/config-shape distinction for R2, GA/GSC, WordPress, email, and image generation.

### Proposed `docs/STATUS.md` patch (G140-G141)

- Add a compact G138-G144 docs row under the current gate/status table:
  - G138 security checklist refreshed in `docs/security/SECURITY_CHECKLIST_G138.md`.
  - G139 integrations matrix patch proposed only.
  - G140 production truth sweep recorded in owned docs; production readiness remains **NO**.
  - G141 staging truth sweep recorded in owned docs; historical staging PASS does not authorize future staging action.
  - G142 package-script test/smoke inventory added.
  - G143 validation command guards added.
  - G144 operator runbook refreshed.
- Preserve current production wording: G49 public probes PASS, formal G49 closure pending owner sentence, G50 not executed.
- Preserve current Puriva Launch wording: blocked pending live proof gates and product workflow gates.

### Proposed `docs/operator/deferred-scope-register.md` patch (report-only)

- Add one line in the production/deployment truth area noting G138-G144 were docs-only and did not move any deferred live integration, staging/prod proof, or production deploy item out of deferred status.
- Do not alter the Puriva Launch blocker list unless a separately approved proof closes a blocker.

### Proposed `docs/runbooks/PURIVA_LAUNCH_GATE.md` patch (report-only)

- Add a short cross-reference to `docs/security/SECURITY_CHECKLIST_G138.md` under security evidence.
- Keep overall verdict **BLOCKED**.
- Do not count the G138 checklist as launch proof; it is a checklist/truth sweep only.
