# DCA OS Lite — Status (Source of Truth)

**Last updated:** 2026-07-05 (Block 5D-C — pre-staging local closeout docs)
**Operator index:** [`docs/operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)  
**Architecture map:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) § Current application map  
**Smoke matrix:** [`docs/runbooks/LOCAL_SMOKE_MATRIX.md`](./runbooks/LOCAL_SMOKE_MATRIX.md)  
**Staging gate:** [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md)  
**Env inventory (names only):** [`docs/operator/ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md)  
**Deferred scope:** [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)

---

## 1. Current branch / main status

| Item | State |
|------|--------|
| Branch | `main` synced with `origin/main` |
| HEAD (pinned) | `e54445f` — `fix(scripts): harden staging admin bootstrap guards` |
| CI | Green on Blocks 1–4 and audit remediation commits (5A–5D-B) |
| Working tree | Clean before Block 5D-C doc edits |
| Pre-staging local closeout (5D-B) | **PASS** — manual workaround for orchestrator hang; see §2.1 |
| Production deploy | **None** — `system.digitalcubeagency.net` unchanged |
| Staging deploy | **None** — G4 not approved; DNS not created |
| Staging target (G1) | `staging.digitalcubeagency.net` documented only |
| Default AI execution | Local deterministic; live OpenRouter opt-in only |
| Work mode | Local-first on Windows PowerShell from `C:\dcaosv1` |

**Rule:** Merge to `main` does not authorize staging or production deploy. Explicit owner approval required before touching staging or production.

---

## 2. Latest closed blocks (Blocks 1–4)

| Block | Commit | Scope | CI |
|-------|--------|-------|-----|
| **1** — External integrations readiness | `136e93a` | Config-only readiness layer: `GET /api/v1/integrations/readiness`, `check:external-integrations-readiness`, `smoke:external-integrations-readiness:local`. No live calls, publish, sync, or bucket IO. | Green |
| **2** — Admin operations | `5308f19` | Read-only `GET /api/v1/admin/operations/summary`, dashboard Operational readiness panel, recovery runbook, `smoke:admin-operations:local`. | Green |
| **3** — UI density | `cc40160` | Dark-theme UI density consolidation for admin and client surfaces (CSS-only). No backend/schema/API/auth changes. | Green |
| **4** — Docs + operator runbook | `c7af674` | Consolidate STATUS, architecture map, smoke matrix, operator runbooks, env inventory, staging gate, deferred roadmap. Docs-only. | Green |
| **5A–5D-A** — Claude audit remediation | `2437c84` … `e54445f` | Admin tenant-read RBAC, fail-closed client boundary smokes, CI unit-test proof, cross-platform test globs, remote staging opt-in, bootstrap guard hardening. | Green |

Prior closeout baseline (still valid context): client approval happy-path `58db726`, production-readiness closeout pack `179dc04`.

### 2.1 Block 5D-B — pre-staging local closeout (2026-07-05)

**Result:** PASS with manual workaround. **Does not authorize G4 staging action or deploy.**

| Phase | Result | Proof (compact) |
|-------|--------|-----------------|
| 0 Preflight | PASS | `main` = `origin/main`; clean tree; `git diff --check` exit 0 |
| 1 No-service / local tests | PASS | `npm run validate`, `npm run test:unit`, `npm run test:integration`; syntax checks; guard tests |
| 1b Guard refusal proofs | PASS | Staging security baseline and bootstrap check both exit 1 with refusal text; no remote/DB execution |
| 2 Audit / Block 1–2 smokes | PASS | External integrations readiness; admin operations 16/16; client-role API boundary 48/48 |
| 3 Block A core smokes | PASS (manual fallback) | Puriva client portal boundary 153/153; remaining core smokes run individually — all PASS |

**Phase 3 manual core smokes (orchestrator fallback):** `smoke:ai-delivery-reviews`, `smoke:ai-seo-content-plan-pdf`, `smoke:ai-knowledge-context`, `smoke:client-portal-monthly-report:browser`, `smoke:monthly-report:browser`, `smoke:monthly-report:mi-context`. Final status: `PHASE3_MANUAL_CORE_PASS`.

**Audit remediation commits (5A–5D-A, on `main`):**

| Commit | Summary |
|--------|---------|
| `2437c84` | `fix(api): require admin role for internal tenant reads` |
| `8b084a2` | `test(smoke): fail closed on client boundary prerequisites` |
| `c26e241` | `test(ci): add unit test proof and remove integration false greens` |
| `acd8962` | `fix(api): use node test runner globs for cross-platform CI` |
| `5f37243` | `fix(smoke): require explicit opt-in for remote staging baseline` |
| `e54445f` | `fix(scripts): harden staging admin bootstrap guards` |

**Not performed during 5D-B:** staging/prod URLs, remote DB, bootstrap write, SSH/VPS/docker/DNS, deploy, commit, or push.

**Known issue:** `npm run smoke:staging-readiness:local` orchestrator can hang after Puriva smoke completes (local PowerShell/log/process handling). Manual fallback for remaining Block A core smokes succeeded. Before G4, fix orchestrator or explicitly accept the manual workaround — see [`STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md).

**Next gate:** G4 staging action remains **blocked** until explicit owner approval. Local 5D-B PASS alone does not authorize staging infrastructure work or deploy.

---

## 3. Module readiness (local admin-operated)

Percentages are **local MVP readiness**, not production-proven. See [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md) for detail.

| Module / area | Local readiness | Safe for admin now | Not production-proven |
|---------------|-----------------|--------------------|------------------------|
| **Core platform** (auth, tenant, modules, RBAC) | ~90% | Login, tenant switch, module enable/disable, settings read | Turnstile on staging; invite/reset flows |
| **AI Delivery** | ~84–88% | Projects, briefs, workflow runs, deliverables, reviews, export, WP draft prep (disabled by default) | Live AI provider, live WP publish, staging deploy |
| **Workflow Briefs** | ~85% | MI/SEO runs, production plan, drafts, client Production Plan Review boundary | Knowledge picker (6C-v2), per-brief audit (6D) |
| **AI SEO / content plan** | ~85% | Research, summaries, plans, PDF export, stale-PDF invalidation | Live crawling, GSC sync, Google Docs export |
| **Market Intelligence** | ~80% | Findings, summaries, handoffs, delivery integration, operator hardening | Live AI, scraping, client-facing MI view |
| **Monthly Reports** | ~88% | Admin CRUD, PDF, metrics snapshots, MI context, client FINAL-only archive | Live GA/GSC sync, client metrics automation |
| **Client Portal** | ~88–92% | Archive, monthly reports, pending approvals happy-path, boundary smokes | Magic links, public share links, full comments |
| **Private storage / R2** | ~76–84% | Guarded upload/download when configured; disabled-safe default | Strict real-bucket proof without env; prod R2 switch |
| **WordPress handoff** | ~50–60% | Draft prep, publish gate metadata, disabled-safe smokes | Live publish, client-triggered publish |
| **External integrations readiness** | Block 1 closed | Config-shape checks only | Live provider, WP, R2 IO, GA/GSC sync |
| **Admin operations / recovery** | Block 2 closed | Dashboard panel, operations summary API, recovery hints | Durable closeout store (manual run only) |
| **Finance Lite** | ~70% | Admin ledger, invoices, browser smoke | Payment collection, Stripe, bank feeds |
| **Email / notifications** | Foundation only | Read-only outbox, audit writer | Real sending, queues |
| **UI (Dark Nebula)** | Block 3 closed | Compact admin/client density pass | Full design-system shell migration |

---

## 4. Current local readiness state

**Safe to run locally (admin-operated, no deploy):**

- `npm.cmd run validate` — prisma generate + check + build all workspaces
- `npm.cmd run smoke:external-integrations-readiness:local` — config shape only
- `npm.cmd run smoke:admin-operations:local` — admin summary + client boundary
- `node scripts/smoke-client-approval-happy-path-local.mjs` — when `AUTH_SEED_TEST_PASSWORD` set
- `npm.cmd run smoke:staging-readiness:local` — Block A focused subset
- `npm.cmd run smoke:production-readiness:local` — broad closeout (long; restarts API)

**Required local env (names only):** `DATABASE_URL`, `AUTH_SEED_TEST_PASSWORD` for authenticated smokes. See [`ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md).

**Typical local integration statuses (Block 1):**

| Category | Typical status | Meaning |
|----------|----------------|---------|
| AI provider | `configured_shape_ok` (gateway `local`) | Deterministic default |
| WordPress | `disabled` | Publish not enabled |
| R2 | `disabled` | Bucket env absent |
| GA/GSC | `disabled` | Sync not enabled |

---

## 5. What is safe / admin-operated now

- Local login/logout, tenant context, module entitlements, owner/admin RBAC
- AI Delivery deterministic workflow chain (local gateway default)
- Market Intelligence admin MVP (findings, summaries, handoffs, delivery bridge)
- Monthly report admin lifecycle + client FINAL-only portal archive
- Client portal read-only archive, monthly reports, approval happy-path (when seeded)
- Content plan PDF export + private storage handoff (admin)
- WordPress **draft preparation** with publish gate disabled by default
- External integrations **readiness inspection** (no live calls)
- Admin operations summary and recovery hints on dashboard
- Finance Lite admin records (local smoke-proven boundaries)

**Admin rule:** AI prepares; admin reviews and decides what becomes final. Clients see client-safe final material only.

---

## 6. What is not production-proven

- Staging deploy on `staging.digitalcubeagency.net`
- Production deploy on `system.digitalcubeagency.net`
- Live OpenRouter / AI provider HTTP execution
- Live WordPress publish to any host
- Strict R2 real-bucket roundtrip without explicit local env
- GA4 / GSC OAuth and live metrics sync
- Scraping / crawling ingestion
- Background queues / autonomous agents
- Real email provider sending
- Turnstile on staging (owner gate)
- Client-facing curated Market Intelligence view
- Revenue Hub, POD AI Toolkit, Finance Lite completion
- Public / share approval links

---

## 7. Staging / production — untouched

| Target | URL | Status |
|--------|-----|--------|
| Production | `system.digitalcubeagency.net` | Live VPS; **current `main` not deployed** |
| Staging (G1) | `staging.digitalcubeagency.net` | Documented; DNS not created; G4 not approved |
| Deploy proof | — | **0%** for current `main` on staging and production |

No VPS, Caddy, Docker, DNS, migration on staging, or production restart was performed in Blocks 1–4.

---

## 8. Pre-staging gates (explicit checklist)

All must pass before **requesting** G4 staging work (not deploy):

| # | Gate | Command / proof |
|---|------|-----------------|
| 1 | Blocks 1–4 + audit remediation complete; CI green | Pin SHA `e54445f` or later; green CI on `main` |
| 2 | **Claude full-code audit remediation** | Commits `2437c84`–`e54445f` on `main`; 5D-B local closeout PASS — not a substitute for owner G4 approval |
| 3 | Validate PASS | `npm.cmd run validate` — PASS in 5D-B |
| 4 | Required local smokes PASS | Block A core smokes PASS (5D-B manual fallback after orchestrator hang); Block 1–2 smokes PASS |
| 5 | Working tree clean | No uncommitted runtime changes |
| 6 | `main` synced | `main` = `origin/main` |
| 7 | No live calls | No publish, sync, crawl, or live provider during gate |
| 8 | Staging deploy proof | Still **not performed** — gate is repo-side only |
| 9 | Owner approval | Explicit approval before touching staging infrastructure |

Full pack: [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md). One-command local gate: `npm.cmd run smoke:pre-staging:local`.

---

## 9. Deferred / future roadmap

| Item | Status |
|------|--------|
| Staging deploy proof | Deferred — G4 |
| Production deploy proof | Deferred — frozen |
| Live AI provider / OpenRouter execution | Deferred — opt-in only |
| Live WordPress publish | Deferred — draft prep only |
| Strict R2 real bucket proof | Deferred — optional local env |
| GA/GSC live sync | Deferred — snapshot-first metrics |
| Scraping / crawling ingestion | Deferred |
| Autonomous agents / background queues | Deferred |
| Client-facing curated MI view | Deferred |
| Revenue Hub | Deferred — [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) |
| POD AI Toolkit | Deferred — [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) |
| Finance Lite completion | Deferred |
| Hard deliverable gates | Deferred |
| Richer client collaboration / comments | Deferred |
| Public / share links | Deferred |
| WorkflowBriefs knowledge picker (6C-v2) | Deferred |
| `AiContextSnapshot` per-brief audit (6D) | Deferred |
| `ClientMonthlyBrief` deprecation | Deferred — legacy intake active |

Full register: [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md).

---

## 10. Route map (client vs admin)

| Route | Surface | Notes |
|-------|---------|-------|
| `#/client-portal` | Client | Canonical archive + monthly reports |
| `#/monthly-reports` | Client | Alias → same as `#/client-portal` |
| `#/archive` | Client | Archive hub |
| `#/client-portal/pending-approvals` | Client | Pending approvals list |
| `#/client-portal/briefs` | Client | Legacy `ClientMonthlyBrief` intake |
| `#/client-portal/deliverables/:id/approve` | Client | `ArticleApprovalEditor` |
| `#/ai-delivery` | Admin | AI Delivery workspace |
| `#/workflow-briefs` | Admin / client | Admin full; client "Production Plan Review" |
| Dashboard → Operational readiness | Admin | Block 2 summary |

Client-only users: `#/client-portal` and granted routes only; admin routes blocked.

---

## Historical foundations (abbreviated)

The following remain true; detail preserved in linked docs and git history.

- Repository/workspace, validation, CI, Dark Nebula UI direction, data-dense admin UI phase 1/2.
- AI Delivery project/brief/workflow/deliverables/reviews/export/handoff foundation.
- AI Gateway v1 + AI Operations Console v1 (local deterministic default).
- Market Intelligence Mega Blocks 1–3; AI Delivery Revenue Engine Layer 1; Delivery Handoff Layer 2.
- Production Readiness closeout pack; Client Approval happy-path hardening.
- Blocks 1–3 (external integrations readiness, admin operations, UI density) on `main`.
- **Block 5A–5D-A (Claude audit remediation):** closed on `main` — admin tenant RBAC, fail-closed boundary smokes, CI unit tests, cross-platform globs, remote staging opt-in, bootstrap guards (`2437c84`–`e54445f`).
- **Block 5D-B (pre-staging local closeout):** PASS with manual orchestrator workaround; G4 still blocked.
- Client Access Admin UI; EN2 audit writer foundation; security headers + rate limiting.
- AI SEO Blocks 3B–3G, 4A–4G, 5A, 6A–6C-v1; Knowledge integration proven via `smoke:ai-knowledge-context`.
- Phase F roadmap: [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md).
- Completion matrix: [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md).

## Current constraints

- Work is local-first on Windows PowerShell.
- No commit, push, deploy, VPS, or production action unless explicitly approved after review.
- ChatGPT controls scope; Codex/Copilot executes sealed tasks.
- Client Portal MVP required for Puriva; advanced portal features phased.
- AI Delivery defaults to local deterministic execution.
- Production/VPS frozen unless explicitly approved.

## AI SEO / Content Plan closure

AI SEO admin-operated MVP shell is in place. Live crawling, Google OAuth / GSC sync, autonomous SEO agents, and production deploy remain deferred. See §9 and [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## Next work (after Block 5D-C)

- Owner review of 5D-B local closeout evidence and this status update.
- Decide: fix `smoke:staging-readiness:local` orchestrator hang **or** accept manual fallback as standard operator procedure.
- G4 staging request only after **explicit owner approval** — local 5D-B PASS does not authorize staging action or deploy.
