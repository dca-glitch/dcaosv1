# DCA OS Lite — Admin Workflow Polish Audit

**Status:** Read-only audit (2026-07-09)  
**Scope:** Operator/admin UX across AI Delivery, Monthly Reports, Client Portal archive, Finance Lite, Market Intelligence, empty/error/loading states, copy clarity, next actions, dark-theme consistency, and Puriva operator flow.  
**Constraint:** High-impact **small polish blocks** only — no broad UI redesign, no backend/API/schema/auth changes, no design-system migration.  
**Related:** [`docs/ui-ux/V0_UI_UX_AUDIT_PACK.md`](../ui-ux/V0_UI_UX_AUDIT_PACK.md) (external design review) · [`docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md`](../ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md) · [`docs/operator/first-client-next-actions.md`](../operator/first-client-next-actions.md)

---

## Executive summary

Local/admin workflows are **functionally complete** and smoke-proven for Puriva's first-client path. The largest remaining gaps are **operator guidance** (what to do next), **state-component consistency** (loading/error/empty), and **copy aimed at developers instead of operators**. Dark Nebula density baseline is in place; polish should stay frontend-only and lane-scoped.

| Area | Readiness | Top polish gap |
|------|-----------|----------------|
| AI Delivery admin | Strong foundation | Collapsed metrics; seven lane primaries; no dynamic next-step |
| Monthly report admin | Strong | Status transitions need explicit next-action labels |
| Client Portal archive | Strong client-safe | Inconsistent empty component on project list |
| Finance Lite | Usable foundation | No `LoadingState`/`ErrorState`; no prerequisite deep-links |
| Market Intelligence | Best practice states | Handoff empty states lack cross-module CTA |
| Admin cockpit | Good Puriva path | Static step badges; empty queues lack navigation CTAs |
| Puriva operator flow | Documented E2E | UI does not reflect real progress on daily path |

**Queued blocks:** UX-P1 through UX-P12 below. Activate one block at a time via normal DCA MODE gate.

---

## Audit findings by module

### 1. AI Delivery admin workflow

**Files:** `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx`, `AiDeliveryProjectWorkspaceSections.tsx`, `AiDeliveryOperatorSummary.tsx`, `MonthlyReportPanel.tsx`

**Strengths**

- `PageHeader` + project picker + seven-lane workflow map align with Puriva delivery order.
- `Delivery chain readiness` panel gives deterministic checklist without blocking work.
- Empty states for no projects and MI handoff gaps are present.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| AD-1 | `AiDeliveryOperatorSummary` metrics hidden inside `<details>` by default | Operators miss tenant snapshot until they expand |
| AD-2 | Each workflow lane uses `primary-action` — up to seven purple primaries visible | Violates one-primary-per-surface; visual noise |
| AD-3 | Custom `AiDeliveryInlineLoading` / `AiDeliveryInlineAlert` instead of shared `LoadingState` / `ErrorState` | Inconsistent with MI, Client Hub, WorkflowBriefs |
| AD-4 | No dynamic “next step” on selected project (lanes are static buttons) | Operator must infer order from lane numbers |
| AD-5 | MI handoff/summary empty states lack link to `#/ai-market-intelligence` | Extra navigation friction |

### 2. Monthly report admin workflow

**Files:** `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx`

**Strengths**

- Clear FINAL vs draft messaging; client visibility called out in panel description.
- Create shell CTA on empty persisted report.
- Metrics and MI context sections have scoped empty states.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| MR-1 | `Move to Admin Review` / `Finalize` lack “what happens next” helper text | Operators unsure when client sees report |
| MR-2 | `MonthlyReportInlineLoading` / inline alerts vs shared state components | Same inconsistency as AI Delivery |
| MR-3 | Metrics empty state does not mention manual snapshot / deferred live GA/GSC | Operators may expect live sync |

### 3. Client Portal — final deliverables / archive

**Files:** `apps/web/src/pages/client-portal/ClientPortalPage.tsx`, `ClientPortalRouter.tsx`, `ArchiveHubPage.tsx`, `PendingApprovalsPage.tsx`

**Strengths**

- Client-safe field boundary is enforced; download UX uses “Opening…” feedback.
- Tabbed deliverables / catalog / monthly reports structure is clear.
- `EmptyState` used widely in detail panels.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| CP-1 | Project list empty uses raw `<p className="inline-empty">` not `EmptyState` | Visual inconsistency vs detail column |
| CP-2 | `ArchiveHubPage` 90-day rule not repeated in main portal empty copy | Clients/operators confuse “empty” vs “too recent” |
| CP-3 | Performance snapshot empty does not explain placeholder/manual metrics | Expectation gap for Puriva monthly report |

### 4. Finance Lite

**Files:** `apps/web/src/pages/invoices/InvoicesPage.tsx`, `bills/BillsPage.tsx`, `credit-notes/CreditNotesPage.tsx`, `invoice-items/InvoiceItemsPage.tsx`

**Strengths**

- Prerequisite empty states (“Add a client first”, “Create an invoice first”).
- `PageHeader` present on invoices; status badges on lifecycle.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| FN-1 | Loading uses bare `Spinner`; errors use `Alert` not `ErrorState` | Inconsistent operator experience vs MI |
| FN-2 | Prerequisite empties lack navigation CTA to Clients / Invoices | Extra clicks for new operators |
| FN-3 | No admin UI for Puriva finance attribution scaffolds (backend-only DRAFT placeholders) | Operators cannot see attribution readiness in-app |
| FN-4 | No cross-link from AI Delivery `revenueChainReadiness` to Finance records | Delivery-to-finance handoff is mental only |

### 5. Market Intelligence

**Files:** `apps/web/src/pages/ai-market-intelligence/AiMarketIntelligencePage.tsx`

**Strengths**

- `WORKFLOW_STEPS` strip documents operator sequence.
- Full `LoadingState` / `ErrorState` / `EmptyState` coverage.
- Internal-only / deterministic disclaimers present.

**Gaps**

| ID | Finding | Impact |
|----|---------|--------|
| MI-1 | Handoff empty states do not link to AI Delivery project picker | Breaks Puriva path after MI READY |
| MI-2 | Project list empty has no “create project” CTA when `canEdit` | Dead end for first-time setup |

### 6. Empty / error / loading states (cross-cutting)

| Pattern | Modules using shared components | Modules using ad-hoc pattern |
|---------|--------------------------------|------------------------------|
| `LoadingState` | WorkflowBriefs, MI, Client Hub, Company Profile | AI Delivery, Finance, Client Portal (inline), Archive, Cockpit |
| `ErrorState` | WorkflowBriefs, MI, Client Hub, Company Profile | AI Delivery (inline alert), Finance (`Alert`), Client Portal (`Alert`) |
| `EmptyState` | Most modules | Client Portal project list (plain text) |

**Recommendation:** Standardize on shared primitives for page-level and section-level states without restyling modals.

### 7. Copy clarity

| Location | Current copy | Issue |
|----------|--------------|-------|
| WorkflowBriefs empty list | “Create a brief via API or seed data to get started.” | Developer-facing; wrong for Puriva operators |
| AI Delivery revenue warnings | Leading `⚠` character in muted text | Informal; may render inconsistently |
| Admin cockpit daily path | Static `StatusBadge` per step (e.g. step 7 always “Complete”) | Misleading progress signal |
| Monthly report metrics | “Snapshot metrics not loaded yet” | Does not say admin must import/manual enter |

### 8. Operator next actions

| Surface | Next-action quality |
|---------|---------------------|
| Admin Daily Operations Cockpit | Strong “Start here” CTA; weak empty queue states (muted paragraph only) |
| WorkflowBriefs | Strong readiness checklist when brief selected |
| AI Delivery lanes | Buttons exist but no single highlighted next step |
| Monthly report panel | Good create CTA; weak post-finalize guidance |
| Client Portal | Read-only — appropriate |

### 9. Dark theme consistency

- Compact density (`data-density="compact"`) is applied on key admin pages.
- Residual issues: multiple `primary-action` gradients per viewport, `state-panel` empty orbs vs inline empties on same page, cockpit `project-summary-item` uses utility classes (`bg-surface`, `border-border`) alongside global CSS elsewhere.
- No blocking contrast failures identified in code review; polish is hierarchy and consistency, not a new theme.

### 10. Puriva-specific operator flow

**Canonical path:** Intake → WorkflowBriefs → AI Delivery lanes → Finalize monthly report → Client Portal visibility ([`first-client-next-actions.md`](../operator/first-client-next-actions.md), [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](../runbooks/PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md)).

**UI alignment gaps**

| Step | Docs expectation | UI gap |
|------|------------------|--------|
| Submit brief before run-ai | Documented in first-client doc | WorkflowBriefs empty copy does not state this |
| Cockpit daily path | Seven ordered steps | Badges do not reflect live project state |
| Finalize monthly report | Client sees FINAL only | Finalize button lacks client-impact note |
| Finance attribution | DRAFT scaffold in backend | No operator visibility |

**Client nav:** `filterNavigationByRole` correctly limits client-only users to `CLIENT_ONLY_NAV_VIEWS` — prior “admin nav visible to clients” concern is **mitigated** for `client` role without `admin`/`owner`.

---

## High-impact small polish blocks

Each block: frontend-only, ≤3 files, no API/schema/auth, validate with `npm run -w @dca-os-v1/web check`.

### UX-P1 — WorkflowBriefs operator empty copy

| Field | Value |
|-------|-------|
| Files | `WorkflowBriefsPage.tsx` |
| Change | Replace API/seed message with operator path: create brief from Clients/Client Hub or cockpit; note submit-before-run-ai |
| Gate | KEEP — copy only |

### UX-P2 — AI Delivery operator summary default open

| Field | Value |
|-------|-------|
| Files | `AiDeliveryOperatorSummary.tsx` |
| Change | Open `<details>` by default or remove collapse for ≤4 metrics |
| Gate | KEEP — CSS/markup only |

### UX-P3 — AI Delivery single highlighted next step

| Field | Value |
|-------|-------|
| Files | `AiDeliveryProjectWorkspaceSections.tsx` (optional small helper in same folder) |
| Change | Derive one “Suggested next” from `revenueChainReadiness` first non-pass check; ghost link to relevant lane |
| Gate | FIX if logic stays read-only from existing API payload |

### UX-P4 — AI Delivery lane button hierarchy

| Field | Value |
|-------|-------|
| Files | `AiDeliveryProjectWorkspaceSections.tsx`, `styles.css` (scoped class) |
| Change | Only first incomplete lane uses `primary-action`; others `secondary-action` or `ghost-action` |
| Gate | KEEP — visual hierarchy |

### UX-P5 — Shared loading/error on AI Delivery page shell

| Field | Value |
|-------|-------|
| Files | `AiDeliveryPage.tsx` |
| Change | Replace page-level inline loading/alert with `LoadingState` / `ErrorState` |
| Gate | KEEP — component swap |

### UX-P6 — Monthly report finalize next-action copy

| Field | Value |
|-------|-------|
| Files | `MonthlyReportPanel.tsx` |
| Change | Add muted helper under status actions: FINAL → visible in Client Portal monthly reports |
| Gate | KEEP — copy only |

### UX-P7 — Monthly report metrics deferred-source note

| Field | Value |
|-------|-------|
| Files | `MonthlyReportPanel.tsx` |
| Change | Extend metrics empty message: manual snapshot / import; live GA/GSC deferred |
| Gate | KEEP — copy only |

### UX-P8 — Client Portal project list EmptyState

| Field | Value |
|-------|-------|
| Files | `ClientPortalPage.tsx` |
| Change | Use `EmptyState variant="inline"` for zero projects (match detail column) |
| Gate | KEEP |

### UX-P9 — Finance Lite state component alignment

| Field | Value |
|-------|-------|
| Files | `InvoicesPage.tsx`, `BillsPage.tsx`, `CreditNotesPage.tsx` |
| Change | `LoadingState` for load; `ErrorState` for fatal error; keep inline empties |
| Gate | KEEP |

### UX-P10 — Finance prerequisite navigation CTAs

| Field | Value |
|-------|-------|
| Files | Same as UX-P9 |
| Change | EmptyState `action` button: “Go to Clients” / “Go to Invoices” via hash nav |
| Gate | KEEP |

### UX-P11 — Admin cockpit empty queue CTAs

| Field | Value |
|-------|-------|
| Files | `AdminDailyOperationsCockpit.tsx` |
| Change | Replace muted empty paragraphs with compact EmptyState + links to WorkflowBriefs, AI Delivery, MI |
| Gate | KEEP |

### UX-P12 — Cockpit Puriva path dynamic labels

| Field | Value |
|-------|-------|
| Files | `AdminDailyOperationsCockpit.tsx` |
| Change | Remove misleading static Complete/Active badges; use neutral step numbers or link each step to hash route |
| Gate | KEEP — copy/nav only |

### Deferred (larger than polish — do not mix into above)

| Item | Why deferred |
|------|----------------|
| Finance attribution admin panel | Needs API surface or read-only summary endpoint |
| AiDelivery modal split / scroll reduction | Listed in deferred-scope register |
| Full design-system primitive swap inside modals | Broad UI implementation |
| Client Portal archive 90-day UX education | May need product copy review across admin + client |

---

## Suggested implementation order (Puriva operator)

1. **UX-P1** — fixes first step confusion for new operators  
2. **UX-P11 + UX-P12** — cockpit trust and navigation  
3. **UX-P3 + UX-P4** — AI Delivery daily driver  
4. **UX-P6 + UX-P7** — monthly report handoff clarity  
5. **UX-P8 + UX-P9 + UX-P10** — client portal + finance consistency  

---

## Validation (per block)

```powershell
cd C:\dcaosv1
git diff --check
npm.cmd run -w @dca-os-v1/web check
```

Optional after UX-P8: `npm.cmd run smoke:client-portal:browser` when local auth env is set.

---

## Puriva approval UX smoke coverage (detail)

**Added:** 2026-07-09 (docs/smoke-prep block — Subagent I). Read-only smoke-script and code audit; no frontend/backend changes in this block.

### Canonical approval UX smoke path

1. **Admin sends for review** — admin marks a deliverable `send-for-client-review`; a direct client-review fetch is `403 CLIENT_REVIEW_DEFERRED` until then.
2. **Client-safe review surface** — item appears on `#/client-portal/pending-approvals` with no internal fields (`storageKey`, `workflowRunId`, `structuredInputJson`, MI/provider metadata, etc.).
3. **Image set placeholder approval/reject** — each attached image must be individually approved, rejected (with reason), or left pending; the article itself cannot be approved while any image is unresolved (`CLIENT_APPROVAL_IMAGES_PENDING`).
4. **Reject reason** — both article-level and image-level rejection persist a `rejectionReason` and return the item to an actionable admin state for rework.
5. **WordPress draft-prep gating** — `publication-handoff` always reports `executionMode: PREPARE_WORDPRESS_DRAFT`; `execute-publication-handoff` stays blocked with an explicit gate code until the release package is finalized. No live-publish path exists.
6. **Final archive visibility** — once approved, the deliverable is visible client-side only in `DELIVERED`/`ACCEPTED` final form, still stripped of internal/admin fields.

### Coverage matrix

| Phase | Script(s) | Level | Status |
|---|---|---|---|
| 1. Send-for-review + `CLIENT_REVIEW_DEFERRED` gate | `smoke-client-approval-happy-path-local.mjs` | API | Covered |
| 2. Client-safe pending-approvals list | `smoke-client-approval-happy-path-local.mjs`, `smoke-puriva-client-portal-boundary-local.mjs` | API + browser | Covered |
| 3a. Article approve (edit body → save → approve) | `smoke-client-approval-happy-path-local.mjs` | API + browser (clicks "Approve this version") | Covered |
| 3b. Article reject with reason | `smoke-client-approval-happy-path-local.mjs` | API only — "Request changes" button never clicked in browser | Partial |
| 3c. Image set placeholder approve | `smoke-workflow-brief-publication-handoff-browser-local.mjs` | API only, used as a setup step toward the WP handoff gate — not a UI click | Partial |
| 3d. Image set placeholder reject with reason | none found | — | **Gap — zero coverage** |
| 3e. Image set undo (revert approve/reject) | none found | — | **Gap — zero coverage** |
| 4. `IMAGES_PENDING` block on article approve | none found | — | **Gap — zero coverage** |
| 5. WordPress draft-prep gating | `smoke-puriva-full-delivery-local.mjs`, `smoke-workflow-brief-publication-handoff-browser-local.mjs` | API + browser | Covered |
| 6. Final archive visibility (client-safe FINAL only) | `smoke-client-final-visibility-local.mjs`, `smoke-puriva-full-delivery-local.mjs` | API | Covered |

Endpoints confirmed reachable (`apps/api/src/routes/client-portal.ts`) but never exercised by any smoke script or automated test in this repo: `PATCH /client-portal/deliverables/:id/images/:imageId/reject` and `.../undo`. The corresponding client UI (`apps/web/src/pages/client-portal/ArticleApprovalEditor.tsx`) is fully built — per-image Approve / Reject-with-reason / Undo, plus the `allImagesReviewed` gate before the article approve button unlocks — but has no smoke or integration proof.

### Gaps found (documentation only — no code changed)

- **UXP-A1** — Image `reject` and `undo` (client-portal) have zero test coverage anywhere (smoke or integration). Only `approve` is exercised, and only as an API-level setup step.
- **UXP-A2** — Article "Request changes" (reject) is never driven via browser automation; only exercised via a direct API call on a second fixture.
- **UXP-A3** — The server-side `IMAGES_PENDING` article-approval gate (`CLIENT_APPROVAL_IMAGES_PENDING`) is untested.
- **UXP-A4** — `smoke-client-approval-happy-path-local.mjs` and `smoke-client-final-visibility-local.mjs` exist and are already documented as direct `node scripts/...` commands (`LOCAL_SMOKE_MATRIX.md`, `STAGING_READINESS.md`, `PRE_STAGING_VALIDATION_GATE.md`) but have no `npm run smoke:*` alias in `package.json`. Pre-existing pattern, not introduced by this block — flagged only because it breaks `npm run smoke:*` discoverability parity with every other script. Adding an alias requires a `package.json` edit, which is out of scope for this docs-only block per workspace rule.

### Recommended smoke command today (no code change required)

Existing infrastructure already supports the full approval-UX-relevant chain without any new script; consolidated here for operator convenience:

```powershell
cd C:\dcaosv1
$env:AUTH_SEED_TEST_PASSWORD = "<local seed password>"
$env:AUTH_SEED_TESTER_EMAIL = "<optional - omit to use puriva@puriva.id portal fallback>"
npm.cmd run dev:api
npm.cmd run dev:web
node scripts/smoke-client-approval-happy-path-local.mjs
node scripts/smoke-client-final-visibility-local.mjs
npm.cmd run smoke:workflow-brief-publication-handoff:browser
npm.cmd run smoke:puriva-full-delivery:local
```

Set `SMOKE_ALLOW_SKIP=true` before the first command only for discovery/demo runs where a client-portal test user is not yet seeded.

### Deferred to a future scoped block (not performed here)

- Extend `smoke-client-approval-happy-path-local.mjs` (or a new sibling script) to browser-click per-image Approve / Reject / Undo and the article "Request changes" flow, and assert the `IMAGES_PENDING` gate. Requires local API/web + Playwright execution to validate — out of scope for this read-only block.
- Register `smoke:client-approval-happy-path:local` and `smoke:client-final-visibility:local` in `package.json` for `npm run` parity — requires a `package.json` edit; flag to owner for a small approved block.

---

## Audit metadata

| Item | Value |
|------|-------|
| Mode | Read-only code + docs review |
| Backend/API/schema/auth | Not touched |
| Production/staging/VPS | Not touched |
| New files | `docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md` |
| Updated docs | `docs/STATUS.md`, `docs/operator/deferred-scope-register.md` |
