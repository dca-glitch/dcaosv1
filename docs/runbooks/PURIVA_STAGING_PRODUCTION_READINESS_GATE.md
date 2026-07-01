# Puriva Staging and Production Readiness Gate

**Status:** Local proof and operator runbook only. Does **not** deploy, mutate staging/prod, run remote migrations, or enable live providers.

**Block:** 20 — Staging and Production Readiness Gates

**Branch:** `feature/blok-6-comprehensive-test-suite`

**Baseline commit (pre–Block 20 doc):** `89c8dd1` — Add Puriva finance attribution foundation

**Proof date:** 2026-07-01

Related:

- [`PURIVA_FULL_DELIVERY_SMOKE_GATE.md`](./PURIVA_FULL_DELIVERY_SMOKE_GATE.md)
- [`PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](./PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)
- [`PRE_STAGING_CLIENT_DELIVERY_READINESS.md`](./PRE_STAGING_CLIENT_DELIVERY_READINESS.md)
- [`STAGING_LOCAL_EXECUTION_PACK.md`](./STAGING_LOCAL_EXECUTION_PACK.md)
- [`BACKUP_RESTORE_PROCEDURE.md`](./BACKUP_RESTORE_PROCEDURE.md)
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)
- [`../operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`scripts/smoke-puriva-readiness-local.ps1`](../../scripts/smoke-puriva-readiness-local.ps1)

---

## Purpose

Prepare a complete readiness gate for taking the Puriva-ready DCA OS Lite branch from local proof toward staging/production **review** — without executing deploy, VPS, remote migration, or live integration steps.

This document is the single operator entry point for:

1. Local final validation gate
2. Branch status / commit summary
3. Puriva smoke inventory
4. Schema/migration impact statement
5. Environment variable checklist
6. Staging preflight checklist
7. Production readiness checklist
8. Merge/PR checklist
9. Known risks and deferred items
10. Next human decision points

---

## 1. Local final validation gate

Run from `C:\dcaosv1` in external PowerShell. Stop on first failure.

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| `AUTH_SEED_TEST_PASSWORD` | **Required** — minimum 8 characters; never commit or print |
| Local PostgreSQL | API health must report `database.status: ready` |
| No Prisma lock | Stop `dev:api` / `dev:web` **before** validate if Windows EPERM on `query_engine-windows.dll.node` |

### Recommended one-command orchestrator

```powershell
cd C:\dcaosv1
npm.cmd run smoke:puriva-readiness:local
```

This runs: pre-validate → four Puriva smokes (with API restart before boundary smoke) → post-validate.

### Manual sequence (equivalent)

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:puriva-client-setup:local
npm.cmd run smoke:puriva-full-delivery:local
# Restart API on port 4000 if login rate limits appear, then:
npm.cmd run smoke:puriva-client-portal-boundary:local
npm.cmd run smoke:workflow-brief-publication-handoff:browser
# Stop API/web, then:
npm.cmd run validate
```

### Block 20 local proof (2026-07-01)

| Step | Result |
|------|--------|
| Pre-smoke `npm.cmd run validate` | **PASS** |
| `smoke:puriva-client-setup:local` | **PASS** — 111/111 |
| `smoke:puriva-full-delivery:local` | **PASS** — 92/92 |
| `smoke:puriva-client-portal-boundary:local` | **PASS** — 131/131 (API restart required after prior smokes; first attempt failed on login rate limit) |
| `smoke:workflow-brief-publication-handoff:browser` | **PASS** — 19/19 |
| Post-smoke `npm.cmd run validate` | **PASS** |

### Operational caveats

- Smokes auto-start local API (`TENANT_MODULE_ENFORCEMENT=off`) and web when not running.
- Long smoke chains share API login rate limits (~300 req / 15 min). **Restart API** between heavy smokes if portal auth fails.
- Browser smokes need Playwright; publication handoff smoke skips optional client cross-check when `AUTH_SEED_TESTER_EMAIL` is unset.

---

## 2. Branch status / commit summary

### Branch

| Field | Value |
|-------|-------|
| Branch | `feature/blok-6-comprehensive-test-suite` |
| HEAD (pre–Block 20 commit) | `89c8dd1` — Add Puriva finance attribution foundation |
| Divergence | Ahead of `main` — includes BLOK 6 test suite, design-system migration, Brief UI, workflow brief chain, and Puriva foundations |

### Puriva foundation commits (newest first)

| Commit | Summary |
|--------|---------|
| `89c8dd1` | Puriva finance attribution foundation |
| `50bdc43` | Sanitize client portal delivery summary markers |
| `8cda539` | Sanitize client portal monthly report titles |
| `f157dd6` | Client portal manual metrics placeholder guard |
| `78a2243` | Puriva manual metrics foundation |
| `4541718` | Puriva monthly report foundation |
| `10a5314` | Puriva client portal boundary proof |
| `e91fa09` | Puriva full local delivery smoke |
| `60e65b3` | Puriva image package foundation |
| `70bde83` | Puriva content production foundation |
| `934e0b6` | Puriva SEO plan foundation |
| `51f9fb1` | Puriva market intelligence foundation |
| `0fb189c` | Puriva medical compliance guardrails |
| `dc1ccd3` | Puriva service taxonomy foundation |
| `2250592` | Puriva local client setup foundation |

### Workflow brief / publication handoff chain (prerequisite)

| Commit | Summary |
|--------|---------|
| `4719730` | Workflow brief publication handoff smoke |
| `987329d` | Publication handoff admin UI |
| `b364083` | Publication handoff execution API |
| `38ce209` | Publication handoff status API |
| `a510e20` | Publication handoff helpers |
| `d42ac2c` | Workflow brief final release package |
| `101440c` | Image and release prep bridge |
| `3ebcf63` | Deliverable packaging bridge |
| `8eaaca4` | Draft generation pipeline |
| `2510437` | Content production seed |
| `895d0a2` | Pre-production flow |
| `9eaa862` | Workflow brief AI execution |
| `826c370` | Workflow brief foundation |

### Untracked / build artifacts

- `apps/api/dist/**` may appear after `validate` / `build` — **do not commit** (build output).
- `_launch_readiness_audit.md` and `_status_report.md` are scratch files — exclude from commits.

---

## 3. Smoke inventory summary

| Script | Package command | What it proves | Block 20 result |
|--------|-----------------|----------------|-----------------|
| Puriva local client setup | `smoke:puriva-client-setup:local` | Idempotent Puriva client, taxonomy, MI, SEO, content/image scaffolds, monthly report, manual metrics, finance attribution placeholders; no credentials; draft-prep handoff mode | **PASS** 111/111 |
| Puriva full delivery | `smoke:puriva-full-delivery:local` | End-to-end structured input chain, gated release/package/handoff APIs, admin UI safety wording, client portal boundary | **PASS** 92/92 |
| Puriva client portal boundary | `smoke:puriva-client-portal-boundary:local` | Client API/UI omits forbidden internals, scaffolds, finance markers, handoff paths; admin paths denied | **PASS** 131/131 |
| Publication handoff browser | `smoke:workflow-brief-publication-handoff:browser` | Admin workflow-briefs panel shows draft-prep-only controls; no live publish wording | **PASS** 19/19 |

### Key safety assertions (all smokes)

- Publication handoff mode: `PREPARE_WORDPRESS_DRAFT` only; `canExecuteHandoff=false` on foundation brief
- Release prepare/finalize blocked with expected gate codes (`RELEASE_PREP_MISSING_PROJECT`, etc.)
- Client portal: no `storageKey`, prompts, `structuredInputJson`, finance attribution markers, or handoff UI
- Medical review and internal scaffold gates remain blocking — smokes do not bypass
- No live publish, OpenRouter, or WordPress HTTP publish in baseline local runs

---

## 4. Schema / migration impact statement

**Block 20 adds no schema or migration files.** Impact below is from the Puriva-ready branch relative to `main` — required reading before **approved** staging migration rehearsal.

### New migrations on branch (not on `main`)

| Migration | Impact |
|-----------|--------|
| `20260701015212_add_brief_table` | Creates `Brief` table + `BriefType` / `BriefStatus` enums for Puriva client brief UI (`MONTHLY` / `ADDITIONAL`) |
| `20260701153000_workflow_brief_foundation` | Creates `WorkflowBrief`, `AiBriefRun`, `AiMiReport`, `AiSeoReport`, `BriefApproval`, `ProductionPlan`; links `AiDeliveryProject.sourceBriefId`, deliverable `briefId` / `productionPlanId` |

### Staging migration rehearsal rules (human-approved only)

1. Backup staging DB first — [`BACKUP_RESTORE_PROCEDURE.md`](./BACKUP_RESTORE_PROCEDURE.md)
2. Run `prisma migrate deploy` only on **staging** DB with explicit approval
3. Never point staging `DATABASE_URL` at production
4. Verify `/api/v1/health` → `database.status: ready` after migrate
5. Re-run Puriva smokes against staging only after separate G4 approval (`smoke:mvp:staging` is baseline, not full Puriva chain)

### Production

- Same migrations apply in order when production deploy is separately approved
- Production migration requires backup + rollback plan + maintenance window approval

---

## 5. Environment variable checklist

Names only — see [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md). Never commit or print values.

### Auth

| Variable | Local smoke | Staging (G4) | Production |
|----------|-------------|--------------|------------|
| `AUTH_SEED_TEST_PASSWORD` | **Required** for smokes | Staging smoke only | N/A (use real admin policy) |
| `AUTH_SEED_TEST_EMAIL` | Optional (`admin@dca.local`) | Optional | Configure per tenant |
| `AUTH_SESSION_TTL_MINUTES` | Optional | Set | Set |
| `AUTH_LOGIN_MAX_FAILED_ATTEMPTS` | Optional | Set | Set |
| `AUTH_LOGIN_LOCKOUT_MINUTES` | Optional | Set | Set |
| `TURNSTILE_*` | Typically off locally | Owner gate | Owner gate |

### Database

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Required locally; staging and production must use **separate** databases; never commit |

### WordPress draft prep (placeholders)

| Variable | Local | Staging/prod |
|----------|-------|--------------|
| `WORDPRESS_PUBLISH_ENABLED` | Default **false** — draft prep scaffolding only | Owner gate; no auto-publish without approval |
| `CREDENTIAL_ENCRYPTION_MASTER_KEY` | Optional locally | Required before encrypted publication targets |

Puriva setup seeds publication target label **"Puriva WordPress (draft prep only)"** with no stored credentials in baseline smokes.

### GA / GSC — **deferred**

- No live Google Analytics or Search Console OAuth in Puriva MVP path
- Monthly metrics use admin-controlled placeholder snapshots (`PURIVA_MANUAL_METRICS_V1`); client UI shows `placeholderOnly` disclaimer

### Provider / OpenRouter — **deferred**

| Variable | Local default | Staging/prod |
|----------|---------------|--------------|
| `AI_TEXT_GATEWAY` | `local` (deterministic) | Owner gate for `openrouter` |
| `OPENROUTER_API_KEY` | Unset | Server-only; never commit |

Live provider proof requires `SMOKE_EXPECT_OPENROUTER_LIVE=true` — **not** part of Puriva readiness gate.

### Storage / R2 — **deferred or existing**

| Variable | Notes |
|----------|-------|
| `R2_*` | Unset locally → `R2_STORAGE_NOT_CONFIGURED` guard; staging bucket is separate G4 gate |

### Core runtime

| Variable | Notes |
|----------|-------|
| `PORT` | API default 4000 |
| `VITE_API_BASE_URL` | Build-time on staging |

### Smoke-only

| Variable | Purpose |
|----------|---------|
| `MVP_SMOKE_API_BASE_URL` | Staging MVP smoke (`smoke:mvp:staging`) — approved staging host only |
| `AUTH_SEED_TESTER_EMAIL` | Optional second-user client portal cross-check in publication handoff browser smoke |

---

## 6. Staging preflight checklist

Execute only after PR merge approval and **separate** staging deploy approval. Check — do not auto-run.

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | **Health** | `GET https://staging.digitalcubeagency.net/api/v1/health` → `ok: true`, `database.status: ready` |
| 2 | **DB readiness** | Migrations applied on staging DB only; not production |
| 3 | **Admin seed** | Admin login works; Turnstile policy per owner gate |
| 4 | **Client boundary smoke** | Run Puriva boundary concepts on staging after auth env configured — or `smoke:mvp:staging` minimum |
| 5 | **No live publish** | `WORDPRESS_PUBLISH_ENABLED` false unless explicit open-gate probe |
| 6 | **No live provider** | `AI_TEXT_GATEWAY=local` or guarded; no OpenRouter key required for baseline |
| 7 | **Rate limits** | Space smoke runs; restart API between chains |
| 8 | **Secrets** | Staging env file server-side only; not in repo |
| 9 | **Puriva data** | Run `setup:puriva:local` equivalent on staging only with approval — idempotent markers |

**Explicit non-goals on staging preflight:** no production DB, no live WordPress publish, no payment APIs, no GA/GSC OAuth.

---

## 7. Production readiness checklist

Production host: `system.digitalcubeagency.net` (DCA OS Lite). **Frozen** until explicit production deploy approval.

| # | Area | Requirement |
|---|------|-------------|
| 1 | **Backup** | PostgreSQL backup per [`BACKUP_RESTORE_PROCEDURE.md`](./BACKUP_RESTORE_PROCEDURE.md) before migrate/deploy |
| 2 | **Rollback** | Documented rollback: redeploy previous image/commit + DB restore plan if migration ran |
| 3 | **Secrets** | Production env isolated; `CREDENTIAL_ENCRYPTION_MASTER_KEY`, `DATABASE_URL`, session secrets server-only |
| 4 | **Rate limits** | `AUTH_LOGIN_*` lockout configured; API rate limits reviewed |
| 5 | **Client boundary** | Puriva portal boundary smokes pass on production-like config before client access |
| 6 | **Medical compliance review** | High-risk taxonomy categories (wegovy/semaglutide, stem cell) require medical review gates — smokes assert blockers; human sign-off required before client-facing FINAL content |
| 7 | **Manual metrics disclaimer** | Client monthly reports must show placeholder disclaimer when metrics are manual-only (`placeholderOnly=true`) |
| 8 | **Finance attribution** | DRAFT invoice placeholders only — no ISSUED/PAID without separate finance workflow approval |
| 9 | **Email** | `EMAIL_PROVIDER=resend` + keys only with approval; brief-submit email still not wired |
| 10 | **R2 / WordPress / OpenRouter** | Each is a separate owner gate — not enabled by Puriva readiness alone |

---

## 8. Merge / PR checklist

| # | Item | Status at Block 20 |
|---|------|-------------------|
| 1 | CI green | Run CI on PR — not executed in Block 20 |
| 2 | Branch clean | No unintended source changes; exclude `apps/api/dist/`, scratch `_*_report.md` |
| 3 | Commit list | Puriva foundation + workflow brief chain documented in §2 |
| 4 | No untracked secrets | `.env` / credentials never staged |
| 5 | `npm.cmd run validate` | **PASS** (pre and post smoke) |
| 6 | Puriva readiness smokes | **PASS** (see §3) |
| 7 | Block 20 scope | Docs + local orchestrator only — no schema/API/feature changes |
| 8 | AGENTS.md safety | No deploy, VPS, remote migration, or prod mutation in this block |

### Suggested PR title

`Puriva foundations + staging/production readiness gate`

### Review focus

- Client portal boundary regressions (marker sanitization, finance attribution isolation)
- Workflow brief handoff remains draft-prep-only
- Two pending migrations understood and scheduled for staging rehearsal

---

## 9. Known risks and explicit deferred items

### Known risks

| Risk | Mitigation |
|------|------------|
| Login rate limits during long local smoke chains | Restart API between smokes; use `smoke:puriva-readiness:local` orchestrator |
| Two migrations not yet on `main` | Staging migrate rehearsal required before Puriva brief/workflow features work in deployed DB |
| Brief submit email not wired | Documented in launch audit; not blocking local Puriva delivery proof |
| Staging docs may be stale vs live host | Verify health at runtime; do not trust DNS-pending docs alone |
| Medical/high-risk content | Automated gates block unsafe approval; human medical review still required for production client copy |
| Manual metrics are placeholders | Client UI disclaimer required; no live GA/GSC |

### Explicit deferred (unchanged by Block 20)

From [`deferred-scope-register.md`](../operator/deferred-scope-register.md):

- Live WordPress publish (draft prep only locally)
- OpenRouter / live AI provider production proof
- Google OAuth, live GA/GSC sync
- Production VPS deploy, production R2, production email
- Payment processors / external accounting APIs (Puriva finance attribution is DRAFT placeholder only)
- Client approval buttons, public approval links, client comments
- Block G4 controlled VPS staging execution without separate approval

---

## 10. Operator instructions — next human decisions

Stop after Block 20. The human operator decides each gate separately:

```text
1. PR REVIEW     → Open PR from feature/blok-6-comprehensive-test-suite → main; review Puriva + migration impact
2. CI CHECK      → Confirm GitHub Actions green on PR
3. MERGE TO MAIN → Approve merge only after review + CI (separate approval)
4. STAGING DEPLOY → Approve G4 staging deploy + staging migrate rehearsal + backup (separate approval)
5. PRODUCTION DEPLOY → Approve production backup + deploy + migrate (separate approval; highest gate)
```

**Block 20 does not perform steps 3–5.**

### Quick reference commands (local only)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:puriva-readiness:local
git status
git log main..HEAD --oneline
```

---

## Forbidden scope proof (Block 20)

Block 20 files are documentation and local orchestration only:

| Check | Result |
|-------|--------|
| Schema/migration changes in Block 20 | **None** |
| Deploy / staging / prod mutation scripts | **None** |
| Live provider enablement | **None** — orchestrator runs local deterministic smokes only |
| Live WordPress / OAuth / payment API | **None** |
| Remote SSH / VPS | **None** |

---

## GATE summary

| Field | Value |
|-------|-------|
| **GATE** | KEEP |
| **agent** | yes |
| **budget** | medium |
| **mistakes** | 1 (boundary smoke first attempt — login rate limit; resolved by API restart) |
| Backend/schema/deploy touched in Block 20 | **no** |
| Commit | `Add Puriva staging production readiness gate` (after this doc lands) |
| Push | Current branch when approved |
