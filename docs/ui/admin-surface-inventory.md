# Admin Surface Inventory (G429–G448)

**Status:** Docs-only inventory (2026-07-10). No routing or shell changes.  
**Source:** `apps/web/src/App.tsx` navigation + page modules under `apps/web/src/pages/` and `components/admin/`.  
**Density baseline:** [`admin-data-dense-ui.md`](./admin-data-dense-ui.md)

## Role legend

| Audience | Meaning |
|----------|---------|
| Admin/owner | Core sidebar; full operator tools |
| Staff | Same core nav when role allows (non-client) |
| Client-only | Filtered to client shell views — not listed as admin surfaces |

## Core admin / operator surfaces

| Hash | Label | Primary file(s) | Density | Notes |
|------|-------|-----------------|---------|-------|
| `#/dashboard` | Dashboard | `App.tsx` dashboard view | Mixed | Entry overview; not AI Delivery |
| `#/clients` | Clients | `pages/clients/*` | Dense Phase 1 | Client access section |
| `#/projects` | Projects | `pages/projects/*` | Dense Phase 2 | |
| `#/tasks` | Tasks | `pages/tasks/*` | Dense Phase 2 | |
| `#/ai-delivery` | AI Delivery | `pages/ai-delivery/AiDeliveryPage.tsx` (+ panels) | Dense overview + heavy workspace | **Hotspot** — see hotspot review |
| `#/admin-daily-cockpit` | Daily Cockpit | `pages/ai-operations/AdminDailyOperationsCockpit.tsx` | Compact panels | Puriva practice path; static step badges |
| `#/ai-operations` | AI Operations | `pages/ai-operations/AiOperationsPage.tsx` | Dense list + detail | Read-only runs console |
| `#/ai-market-intelligence` | Market Intelligence | `pages/ai-market-intelligence/AiMarketIntelligencePage.tsx` | Bespoke; good states | Compaction deferred |
| `#/invoices` | Invoices | `pages/invoices/InvoicesPage.tsx` | Dense Phase 1 | Finance Lite |
| `#/bills` | Bills | `pages/bills/BillsPage.tsx` | Dense Phase 2 | |
| `#/credit-notes` | Credit Notes | `pages/credit-notes/CreditNotesPage.tsx` | Dense Phase 2 | |
| `#/invoice-items` | Invoice Items | `pages/invoice-items/InvoiceItemsPage.tsx` | Dense | |
| `#/company-profile` | Company Profile | `pages/company-profile/*` | Form | Shared Loading/Error states |
| `#/modules` | Modules | `App.tsx` modules view | Cards | Module catalog |

## Embedded admin panels (no dedicated hash)

| Panel | File | Host | Safety copy |
|-------|------|------|-------------|
| Admin operations / integrations readiness | `components/admin/AdminOperationsPanel.tsx` | Admin ops host | “no live calls” / config-shape only |
| AI Orchestrator Lite | `components/admin/AiOrchestratorLitePanel.tsx` | Admin ops host | Pre-live; dry-run ledger; live proof pending |

## AI Delivery sub-surfaces (same hash `#/ai-delivery`)

| Surface | File | Approx. size | Notes |
|---------|------|--------------|-------|
| Page shell + modals + CRUD | `AiDeliveryPage.tsx` | ~5765 lines | Split candidate |
| Project picker | `AiDeliveryProjectPicker.tsx` | ~44 lines | Extracted |
| Operator summary | `AiDeliveryOperatorSummary.tsx` | ~58 lines | Collapsed by default |
| Workflow lanes + readiness | `AiDeliveryProjectWorkspaceSections.tsx` | ~293 lines | Seven primaries |
| Monthly report modal | `MonthlyReportPanel.tsx` | ~1593 lines | Copy-safety updated G429 |
| Knowledge context | `AiKnowledgeContextPanel.tsx` | ~313 lines | Admin-only |
| WP publish confirm | `AiDeliveryWordPressPublishConfirmModal.tsx` | ~64 lines | Deferred live publish copy |

## Explicitly out of admin inventory

| Hash / area | Why |
|-------------|-----|
| `#/client-portal`, `#/pending-approvals`, `#/monthly-reports`, `#/archive` | Client shell — see [`client-portal-surface-inventory.md`](./client-portal-surface-inventory.md) |
| `#/login` | Auth — do not change |
| Design-system demos | `apps/web/src/design-system/` — do not modify |

## Copy-safety checklist (admin)

- Prefer “local”, “disabled-safe”, “deferred”, “owner-gated” over “live”, “connected”, “production ready”.
- Run metadata (`liveProviderCalled`) is factual for a run — do not promote to environment proof.
- Helper: `apps/web/src/lib/proof-state-labels.ts` → `looksLikeLiveOverclaim`.

## Polish queue cross-ref

See [`docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md`](../ux/ADMIN_WORKFLOW_POLISH_AUDIT.md) UX-P1–UX-P16.
