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
| Env names (no values) | [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md) |
| Deferred scope | [`deferred-scope-register.md`](./deferred-scope-register.md) |

**Run location:** External Windows PowerShell from `C:\dcaosv1`. Log long runs to `$env:TEMP` and open in Notepad. Stop on first failure.

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

Reference: [`docs/database/PRISMA_CLIENT_GENERATION_READINESS.md`](../database/PRISMA_CLIENT_GENERATION_READINESS.md).

---

## 4. Admin operations recovery

**Surface:** Dashboard → Operational readiness; `GET /api/v1/admin/operations/summary`.

| Symptom | First action |
|---------|----------------|
| Validate failed | Read validate log in `$env:TEMP`; fix first failing workspace |
| Prisma EPERM | §3 above |
| Smoke failed after validate | Rerun single smoke; confirm API/web running |
| `missing_config` in readiness | Check [`ENV_READINESS_INVENTORY.md`](./ENV_READINESS_INVENTORY.md); restart API after env change |
| Integration `disabled` | Expected local default |
| WordPress publish disabled | `WORDPRESS_PUBLISH_ENABLED` not true — draft prep only |
| R2 disabled | Guarded IO; strict roundtrip needs explicit env |
| Closeout status `manual_run_required` | Expected — no fake green; run smokes manually |

**Smoke:** `npm.cmd run smoke:admin-operations:local`

Full detail: [`docs/runbooks/ADMIN_OPERATIONS_RECOVERY.md`](../runbooks/ADMIN_OPERATIONS_RECOVERY.md).

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
