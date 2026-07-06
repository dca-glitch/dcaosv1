# DCA OS Lite — Operator Runbook (Consolidated)

**Status:** Single operator entry point for local validation, smoke, recovery, and staging/production prerequisites.  
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
| G9 environment proof gate | [`docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) |
| Env names (no values) | [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md) |
| Deferred scope | [`deferred-scope-register.md`](./deferred-scope-register.md) |

**Run location:** External Windows PowerShell from `C:\dcaosv1`. Log long runs to `$env:TEMP` and open in Notepad. Stop on first failure.

## 0. G9 environment proof index

1. Read `docs/STATUS.md` and `docs/STATUS_COMPLETION.md`.
2. Confirm `PURIVA_OPERATING_PACK_V1_GO_NO_GO.md` and `PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`.
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
4. **Do not** use `Stop-Process -Name node` (kills unrelated processes).
5. Retry `npm.cmd run validate` **once**.
6. If still failing, stop and report — do not guess further.

`smoke:staging-readiness:local` and `smoke:production-readiness:local` include one EPERM retry (Program Files `node.exe` only).

**Orchestrator hang caveat (5D-B):** `smoke:staging-readiness:local` may hang on local Windows PowerShell after Puriva boundary smoke completes. If stuck, inspect `$env:TEMP` per-step logs and run only the remaining Block A scripts manually — see [`STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) §5 operational caveats. No staging/prod commands during fallback.

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

**Staging target:** `staging.digitalcubeagency.net` (G1 documented; DNS not created; G4 not approved).

**Forbidden before G4 approval:** VPS login, Docker apply, Caddy/DNS, staging migrations, `smoke:mvp:staging` without owner approval.

**Staging admin bootstrap warning:** `npm run bootstrap:staging-admin` is mutation-capable (admin password hash, tenant, modules). Requires `DCA_BOOTSTRAP_DATABASE_TARGET=staging`, approved staging `DATABASE_URL` host (`dcaosv1-staging-postgres` or loopback only — **`dcaosv1-postgres` refused**), and write-mode confirmation `DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN=I_UNDERSTAND_THIS_MUTATES_STAGING`. Owner-approved at G4 only; never CI or local default gate. `--check` is read-only but still requires target guard + approved `DATABASE_URL`.

---

## 7. Production prerequisites

Production remains **frozen** unless explicitly approved in a separate block.

| # | Prerequisite (when approved) |
|---|---------------------------|
| 1 | Staging deploy proof complete on approved staging host |
| 2 | Staging smokes PASS (`smoke:mvp:staging` with explicit HTTPS URL) |
| 3 | Production env separate from staging; no staging DB credentials in prod |
| 4 | R2, WordPress, AI provider, Turnstile — owner gates per category |
| 5 | Backup before migration/deploy |
| 6 | Rollback plan documented and tested on staging |
| 7 | Explicit production deploy approval — separate from staging |

**Production URL:** `system.digitalcubeagency.net` — current `main` is **0% deployed**.

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
