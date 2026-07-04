# Pre-Staging Readiness and Manual QA Pack (Block A)

**Status:** Local repo-side GO / NO-GO pack. Does **not** authorize VPS execution, DNS, migrations on staging, or production touch.

**Purpose:** Practical checklist to decide whether `main` is ready to **request** staging work (G4) — not to deploy staging.

**Current baseline (2026-07-03):** `main` synced with `origin/main`; latest commit `3dc1de6` (`feat(web): extract AiDelivery WordPress publish confirm modal`); CI green; working tree clean; **0% deployed** to production; G4 VPS execution **not approved**; staging DNS **not created**.

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

## 1. Current main / CI expectations

| Expectation | Pass criteria |
|-------------|---------------|
| Branch | `main` synced with `origin/main` |
| Working tree | Clean (no uncommitted runtime changes) |
| CI | Green on pinned commit SHA |
| Production deploy | **None** — `system.digitalcubeagency.net` unchanged |
| Staging deploy | **None** — G4 not approved |
| Staging target (G1) | `staging.digitalcubeagency.net` documented; DNS not created |
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
| `R2_*` | Strict R2 roundtrip (`smoke:r2-byte-roundtrip:local`) |
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

Covers: `validate`, `git diff --check`, AI Delivery revenue engine + reviews + workflow browser, MI core/integration/hardening/market-intelligence/operator browser/summary-delivery browser, delivery handoff readiness, **client approval happy-path** (`smoke-client-approval-happy-path-local.mjs` — self-SKIP when portal user unavailable; uses `puriva@puriva.id` fallback), client final visibility (skip if no `AUTH_SEED_TESTER_EMAIL`), WordPress publish disabled-safe, R2 disabled-safe, Puriva client portal boundary, client portal local/browser, monthly report MI context + client/admin browser. Logs to `$env:TEMP` and opens Notepad. Stops on first hard failure. API restart between browser batches; one retry on HTTP 429.

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

Full catalog: [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md).

**Operational caveats:**

- **Prisma EPERM:** run `validate` before starting dev servers, or stop locking `node.exe`.
- **HTTP 429:** restart API (`npm.cmd run dev:api`); `smoke:pre-staging:local` restarts API automatically.
- **R2 / WP open-gate probes:** optional; not required for Block A GO.

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
| Live R2 / WP / OpenRouter on staging | Owner gates at G4 |

---

## 9. GO / NO-GO criteria

### GO (ready to **request** G4 staging work)

All must be true:

- [ ] `main` synced; pinned SHA matches green CI
- [ ] `npm.cmd run validate` PASS
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
