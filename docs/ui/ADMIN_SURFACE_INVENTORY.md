# Admin Surface Inventory (G661)

**Status:** Docs inventory refreshed 2026-07-10 (Lane 17 / G661–G672).  
**Source:** `apps/web/src/App.tsx` (`navigationItems`, `ViewKey`, page mounts).  
**Density baseline:** [`admin-data-dense-ui.md`](./admin-data-dense-ui.md)  
**Prior kebab inventory:** [`admin-surface-inventory.md`](./admin-surface-inventory.md) (G429–G448; keep both until main consolidates)

## Role legend

| Audience | Meaning |
|----------|---------|
| Admin/owner | Core sidebar; full operator tools |
| Staff | Same core nav when role allows (non-client) |
| Client-only | Filtered via `CLIENT_ALLOWED_ROUTE_VIEWS` — not admin surfaces |

## Core admin / operator surfaces

| Hash | Label | Primary file(s) | Density | Notes |
|------|-------|-----------------|---------|-------|
| `#/dashboard` | Dashboard | `App.tsx` dashboard view | Mixed | Entry overview |
| `#/modules` | Modules | `App.tsx` modules view | Cards | Module catalog |
| `#/tenants` | Tenants | `App.tsx` tenants view | Dense | Admin tenant switch |
| `#/clients` | Clients | `pages/clients/*` | Dense Phase 1 | Client access |
| `#/projects` | Projects | `pages/projects/*` | Dense Phase 2 | |
| `#/tasks` | Tasks | `pages/tasks/*` | Dense Phase 2 | |
| `#/ai-delivery` | AI Delivery | `pages/ai-delivery/AiDeliveryPage.tsx` (+ panels) | Dense + heavy workspace | **Hotspot** — see [`AI_DELIVERY_HOTSPOT_SPLIT_PLAN.md`](./AI_DELIVERY_HOTSPOT_SPLIT_PLAN.md) |
| `#/admin-daily-cockpit` | Daily Cockpit | `pages/ai-operations/AdminDailyOperationsCockpit.tsx` | Compact panels | Puriva practice path |
| `#/ai-operations` | AI Operations | `pages/ai-operations/AiOperationsPage.tsx` | Dense list + detail | Read-only runs console |
| `#/ai-market-intelligence` | Market Intelligence | `pages/ai-market-intelligence/AiMarketIntelligencePage.tsx` | Bespoke | Compaction deferred |
| `#/workflow-briefs` | Workflow Briefs | `pages/WorkflowBriefsPage.tsx` | Dense | Admin + client-visible label differs |
| `#/invoices` | Invoices | `pages/invoices/InvoicesPage.tsx` | Dense Phase 1 | Finance Lite |
| `#/bills` | Bills | `pages/bills/BillsPage.tsx` | Dense Phase 2 | |
| `#/credit-notes` | Credit Notes | `pages/credit-notes/CreditNotesPage.tsx` | Dense Phase 2 | |
| `#/invoice-items` | Services Library | `pages/invoice-items/InvoiceItemsPage.tsx` | Dense | |
| `#/company-profile` | Company Profile | `pages/company-profile/*` | Form | Shared Loading/Error |
| `#/settings` | Settings | `App.tsx` settings view | Form | Tenant settings |
| `#/team` | Team | `App.tsx` team view | Dense | Members |
| `#/briefs-panel` | Briefs (admin client section) | Brief panel page | Mixed | Admin nav `section: client` |

## Embedded admin panels (no dedicated hash)

| Panel | File | Host | Safety copy |
|-------|------|------|-------------|
| Admin operations / integrations readiness | `components/admin/AdminOperationsPanel.tsx` | Admin ops host | Config-shape / no live calls |
| AI Orchestrator Lite | `components/admin/AiOrchestratorLitePanel.tsx` | Admin ops host | Pre-live; dry-run ledger |

## AI Delivery sub-surfaces (same hash `#/ai-delivery`)

| Surface | File | ~Lines (2026-07-10) | Notes |
|---------|------|---------------------|-------|
| Page shell + modals + CRUD | `AiDeliveryPage.tsx` | 5765 | Split candidate |
| Project picker | `AiDeliveryProjectPicker.tsx` | 44 | Extracted |
| Operator summary | `AiDeliveryOperatorSummary.tsx` | 58 | Collapsed by default |
| Workflow lanes + readiness | `AiDeliveryProjectWorkspaceSections.tsx` | 293 | Seven primaries |
| Monthly report modal | `MonthlyReportPanel.tsx` | 1595 | Copy-safety G429+ |
| Knowledge context | `AiKnowledgeContextPanel.tsx` | 313 | Admin-only |
| WP publish confirm | `AiDeliveryWordPressPublishConfirmModal.tsx` | 64 | Deferred live publish copy |

## Explicitly out of admin inventory

| Hash / area | Why |
|-------------|-----|
| `#/client-portal`, `#/pending-approvals`, `#/monthly-reports`, `#/archive`, `#/briefs` | Client shell — see [`CLIENT_PORTAL_SURFACE_INVENTORY.md`](./CLIENT_PORTAL_SURFACE_INVENTORY.md) |
| `#/login` | Auth — do not change |
| `#/admin/design-system` | Design-system demo — do not modify `apps/web/src/design-system/` |
| Deferred `#/content-plan-review`, `#/content-draft-review` | Deferred client review views |

## Copy-safety checklist (admin)

- Prefer “local”, “disabled-safe”, “deferred”, “owner-gated” over “live”, “connected”, “production ready”.
- Run metadata (`liveProviderCalled`) is factual for a run — do not promote to environment proof.
- Helper: `apps/web/src/lib/proof-state-labels.ts` → `looksLikeLiveOverclaim`, `formatProofStateLabel`.

## Related

- [`PROOF_STATE_BADGE_LABELS.md`](./PROOF_STATE_BADGE_LABELS.md)
- [`INTEGRATION_TRUTH_BADGE_DESIGN.md`](./INTEGRATION_TRUTH_BADGE_DESIGN.md)
- [`LAUNCH_BLOCKER_BOARD_DESIGN.md`](./LAUNCH_BLOCKER_BOARD_DESIGN.md)
- [`UI_EMPTY_ERROR_STATE_SAFETY.md`](./UI_EMPTY_ERROR_STATE_SAFETY.md)
