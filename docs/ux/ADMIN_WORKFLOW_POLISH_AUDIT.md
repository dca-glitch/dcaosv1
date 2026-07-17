# DCA OS Lite — Admin Workflow Polish Audit

**Status:** Extended audit (2026-07-10, G429–G448 UI lane)
**Scope:** Operator/admin UX across AI Delivery, Monthly Reports, Client Portal archive (docs review only), Finance Lite, Market Intelligence, AI Operations, empty/error/loading states, copy clarity, proof-state vocabulary, and Puriva operator flow.
**Constraint:** High-impact **small polish blocks** only — no broad UI redesign, no backend/API/schema/auth changes, no design-system migration.
**Related:** [`docs/ui-ux/V0_UI_UX_AUDIT_PACK.md`](../ui-ux/V0_UI_UX_AUDIT_PACK.md) · [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](../ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md) · [`docs/ui/ADMIN_SURFACE_INVENTORY.md`](../ui/ADMIN_SURFACE_INVENTORY.md) · [`docs/ui/ai-delivery-hotspot-file-review.md`](../ui/ai-delivery-hotspot-file-review.md) · [`docs/operator/first-client-next-actions.md`](../operator/first-client-next-actions.md)

---

## Executive summary

Local/admin workflows remain **functionally complete** and smoke-proven for Puriva's first-client path. G429–G448 adds **surface inventories**, **hotspot split planning**, **proof-state / integration-truth / launch-blocker badge designs (docs)**, and **UI testability notes**. The largest remaining gaps are still **operator guidance**, **state-component consistency**, and **avoiding live/staging overclaim** in admin copy.

| Area | Readiness | Top polish gap |
|------|-----------|----------------|
| AI Delivery admin | Strong foundation; **~5.7k-line hotspot** | Collapsed metrics; seven lane primaries; no dynamic next-step; split planning only |
| Monthly report admin | Strong; copy-safety tightened G429 | Status transitions need explicit next-action labels (partially addressed) |
| Client Portal archive | Strong client-safe (Lane 6 owns pages) | Inconsistent empty component on project list — propose only |
| Finance Lite | Usable foundation | No `LoadingState`/`ErrorState`; no prerequisite deep-links |
| Market Intelligence | Best practice states | Handoff empty states lack cross-module CTA |
| Admin cockpit / AI Ops | Good Puriva path + safe disclaimers | Static step badges; empty queues lack navigation CTAs |
| Proof-state vocabulary | Docs + tiny helper | Badge UI not implemented — design only |

**Queued blocks:** UX-P1 through UX-P12 (unchanged) plus UX-P13–UX-P16 from G429–G448. Activate one block at a time via normal DCA MODE gate.

---

## G429–G448 delta (this refresh)

| Gate theme | Deliverable | Location |
|------------|-------------|----------|
| Admin surface inventory | Hash routes, roles, density notes | [`docs/ui/ADMIN_SURFACE_INVENTORY.md`](../ui/ADMIN_SURFACE_INVENTORY.md) |
| Client portal surface inventory | Docs-only review (Lane 6 owns pages) | [`docs/ui/CLIENT_PORTAL_SURFACE_INVENTORY.md`](../ui/CLIENT_PORTAL_SURFACE_INVENTORY.md) |
| AI Delivery hotspot review | Split plan for `AiDeliveryPage.tsx` | [`docs/ui/ai-delivery-hotspot-file-review.md`](../ui/ai-delivery-hotspot-file-review.md) |
| Monthly / portal UI testability | Smoke + unit gaps | [`docs/ux/monthly-report-ui-testability.md`](./monthly-report-ui-testability.md), [`docs/ux/client-portal-ui-testability.md`](./client-portal-ui-testability.md) |
| Badge designs | Proof-state, integration truth, launch-blocker board | [`docs/ui/admin-proof-state-badge-design.md`](../ui/admin-proof-state-badge-design.md), [`docs/ui/INTEGRATION_TRUTH_BADGE_DESIGN.md`](../ui/INTEGRATION_TRUTH_BADGE_DESIGN.md), [`docs/ui/LAUNCH_BLOCKER_BOARD_DESIGN.md`](../ui/LAUNCH_BLOCKER_BOARD_DESIGN.md) |
| Proof-state vocabulary | Labels + overclaim helper | [`docs/ux/proof-state-vocabulary.md`](./proof-state-vocabulary.md), `apps/web/src/lib/proof-state-labels.ts` |
| UI docs closeout / blockers / next gate | Lane closeout | [`docs/ux/ui-docs-closeout-g429-g448.md`](./ui-docs-closeout-g429-g448.md), [`docs/ux/remaining-ui-blockers.md`](./remaining-ui-blockers.md), [`docs/ux/next-gate-proposal-ui.md`](./next-gate-proposal-ui.md) |

**Tiny code (copy-safety only):** `MonthlyReportPanel.tsx` FINAL/metrics empty copy now states Client Portal visibility timing and deferred live GA/GSC. No routing, shell, or design-system changes.

---

## Audit findings by module

### 1. AI Delivery admin workflow

**Files:** `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` (~5765 lines), `AiDeliveryProjectWorkspaceSections.tsx`, `AiDeliveryOperatorSummary.tsx`, `MonthlyReportPanel.tsx` (~1593 lines)

**Strengths**

- `PageHeader` + project picker + seven-lane workflow map align with Puriva delivery order.
- `Delivery chain readiness` panel gives deterministic checklist without blocking work.
- Empty states for no projects and MI handoff gaps are present.
- WordPress confirm modal already extracted; publish copy correctly says live publish is deferred.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| AD-1 | `AiDeliveryOperatorSummary` metrics hidden inside `<details>` by default | Operators miss tenant snapshot until they expand |
| AD-2 | Each workflow lane uses `primary-action` — up to seven purple primaries visible | Violates one-primary-per-surface; visual noise |
| AD-3 | Custom `AiDeliveryInlineLoading` / `AiDeliveryInlineAlert` instead of shared `LoadingState` / `ErrorState` | Inconsistent with MI, Client Hub, WorkflowBriefs |
| AD-4 | No dynamic “next step” on selected project (lanes are static buttons) | Operator must infer order from lane numbers |
| AD-5 | MI handoff/summary empty states lack link to `#/ai-market-intelligence` | Extra navigation friction |
| AD-6 | Monolith file size blocks safe polish (see hotspot review) | High merge/conflict risk for any UI block |

### 2. Monthly report admin workflow

**Files:** `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx`

**Strengths**

- Clear FINAL vs draft messaging; client visibility called out in panel description.
- Create shell CTA on empty persisted report.
- Metrics and MI context sections have scoped empty states.
- Summary panel already labels GA/GSC and 12-month trends as **Deferred**.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| MR-1 | `Move to Admin Review` / `Finalize` lack adjacent “what happens next” helper (hint exists below actions) | Operators may still miss Client Portal timing |
| MR-2 | `MonthlyReportInlineLoading` / inline alerts vs shared state components | Same inconsistency as AI Delivery |
| MR-3 | Metrics empty — **partially fixed G429** (manual/CSV + deferred GA/GSC) | Keep wording if further polish lands |

### 3. Client Portal — final deliverables / archive

**Files:** `apps/web/src/pages/client-portal/*` — **Lane 6 owns page edits**. This audit proposes only.

**Strengths**

- Client-safe field boundary is enforced; download UX uses “Opening…” feedback.
- `toClientPortalStatusLabel` hides internal DRAFT/PENDING-style statuses.
- Tabbed deliverables / catalog / monthly reports structure is clear.

**Gaps (propose to Lane 6)**

| ID | Finding | Impact |
|----|---------|--------|
| CP-1 | Project list empty uses raw `<p className="inline-empty">` not `EmptyState` | Visual inconsistency vs detail column |
| CP-2 | `ArchiveHubPage` 90-day rule not repeated in main portal empty copy | Clients/operators confuse “empty” vs “too recent” |
| CP-3 | Performance snapshot empty does not explain placeholder/manual metrics | Expectation gap for Puriva monthly report |

### 4. Finance Lite

**Files:** `apps/web/src/pages/invoices/InvoicesPage.tsx`, `bills/BillsPage.tsx`, `credit-notes/CreditNotesPage.tsx`, `invoice-items/InvoiceItemsPage.tsx`

**Gaps:** FN-1–FN-4 unchanged (state components, prerequisite CTAs, attribution visibility, delivery→finance link).

### 5. Market Intelligence

**Files:** `apps/web/src/pages/ai-market-intelligence/AiMarketIntelligencePage.tsx`

**Gaps:** MI-1–MI-2 unchanged (handoff CTA to AI Delivery; create-project CTA when `canEdit`).

### 6. Empty / error / loading states (cross-cutting)

| Pattern | Modules using shared components | Modules using ad-hoc pattern |
|---------|--------------------------------|------------------------------|
| `LoadingState` | WorkflowBriefs, MI, Client Hub, Company Profile | AI Delivery, Finance, Client Portal (inline), Archive, Cockpit |
| `ErrorState` | WorkflowBriefs, MI, Client Hub, Company Profile | AI Delivery (inline alert), Finance (`Alert`), Client Portal (`Alert`) |
| `EmptyState` | Most modules | Client Portal project list (plain text) |

### 7. Copy clarity / live overclaim

| Location | Current copy | Issue / status |
|----------|--------------|----------------|
| WorkflowBriefs empty list | “Create a brief via API or seed data…” | Developer-facing (UX-P1) |
| AI Delivery revenue warnings | Leading `⚠` in muted text | Informal (keep or soft-replace later) |
| Admin cockpit daily path | Static `StatusBadge` per step | Misleading progress (UX-P12) |
| Monthly report FINAL hint | Client Portal + deferred GA/GSC | **Improved G429** |
| Monthly metrics empty | Manual/CSV + deferred live | **Improved G429** |
| Cockpit / AdminOperationsPanel | Explicit “no live calls” / practice-path disclaimers | Good — preserve |

Helper for future sweeps: `looksLikeLiveOverclaim()` in `apps/web/src/lib/proof-state-labels.ts`.

### 8. Operator next actions

Unchanged from prior audit: cockpit Start-here strong; AI Delivery lanes lack single highlighted next step; monthly finalize guidance improved via action hint.

### 9. Dark theme consistency

Compact density remains on key admin pages. Residual: multiple `primary-action` gradients per viewport; cockpit static badges.

### 10. Puriva-specific operator flow

Canonical path unchanged. UI still does not reflect live progress on cockpit daily path (UX-P12). Finance attribution remains backend-only.

---

## High-impact small polish blocks

Each block: frontend-only, ≤3 files, no API/schema/auth, validate with `npm run -w @dca-os-v1/web check`.

### UX-P1 — UX-P12

Unchanged — see prior sections / original queue. Prefer UX-P1, UX-P11+P12, UX-P3+P4, UX-P6+P7 (partially done), then UX-P8–P10 (Lane 6 for portal).

### UX-P13 — Proof-state badge leaf (optional)

| Field | Value |
|-------|-------|
| Files | New tiny component under `apps/web/src/components/ui/` + consumer on AI Ops or AdminOperationsPanel only |
| Change | Render `formatProofStateLabel` / tone; no live claims |
| Gate | KEEP — presentation only; design first in [`admin-proof-state-badge-design.md`](../ui/admin-proof-state-badge-design.md) |

### UX-P14 — AiDelivery types extract (cosmetic split prep)

| Field | Value |
|-------|-------|
| Files | New `ai-delivery-types.ts`; re-export from `AiDeliveryPage.tsx` |
| Change | Move exported types only; zero behavior change |
| Gate | KEEP — see hotspot review Phase A |

### UX-P15 — Monthly report shared LoadingState/ErrorState

| Field | Value |
|-------|-------|
| Files | `MonthlyReportPanel.tsx` |
| Change | Replace page-section inline loading/alert with shared primitives |
| Gate | KEEP — component swap |

### UX-P16 — Cockpit empty queue EmptyState CTAs

| Field | Value |
|-------|-------|
| Files | `AdminDailyOperationsCockpit.tsx` |
| Change | Same as UX-P11 if not yet done |
| Gate | KEEP |

### Deferred (larger than polish)

| Item | Why deferred |
|------|----------------|
| Full `AiDeliveryPage.tsx` behavioral split | Hotspot Phase B+; high conflict risk |
| Finance attribution admin panel | Needs API surface |
| Client Portal page edits | Lane 6 |
| Full design-system primitive swap inside modals | Broad UI |
| Launch-blocker board UI implementation | Design-only until owner gate |

---

## Suggested implementation order (Puriva operator)

1. **UX-P1** — WorkflowBriefs operator empty copy
2. **UX-P11 + UX-P12** — cockpit trust and navigation
3. **UX-P3 + UX-P4** — AI Delivery daily driver
4. **UX-P14** — types extract only if a larger AI Delivery polish block is approved
5. **UX-P8** via Lane 6 — client portal EmptyState
6. **UX-P9 + UX-P10** — finance consistency

---

## Validation (per block)

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run -w @dca-os-v1/web check
```

Optional: `npm.cmd run -w @dca-os-v1/web test:unit` when touching `proof-state-labels` or other helpers.

---

## Puriva approval UX smoke coverage (detail)

**Preserved from 2026-07-09 Subagent I.** Gaps UXP-A1–A4 (image reject/undo, article request-changes browser, `IMAGES_PENDING`, npm smoke aliases) remain documentation-only. See original matrix in git history / prior section body if needed; full matrix also summarized in [`client-portal-ui-testability.md`](./client-portal-ui-testability.md).

### Recommended smoke command today

```powershell
cd C:\dcaosv1
$env:AUTH_SEED_TEST_PASSWORD = "<local seed password>"
npm.cmd run dev:api
npm.cmd run dev:web
node scripts/smoke-client-approval-happy-path-local.mjs
node scripts/smoke-client-final-visibility-local.mjs
npm.cmd run smoke:workflow-brief-publication-handoff:browser
npm.cmd run smoke:puriva-full-delivery:local
```

---

## Audit metadata

| Item | Value |
|------|-------|
| Mode | Docs + tiny copy-safety + helper/tests |
| Backend/API/schema/auth | Not touched |
| Production/staging/VPS | Not touched |
| Design-system / App.tsx / AppLayout | Not touched |
| Client-portal pages | Not edited (Lane 6) |
| Updated | `docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md` |
| New docs | See G429–G448 delta table |
