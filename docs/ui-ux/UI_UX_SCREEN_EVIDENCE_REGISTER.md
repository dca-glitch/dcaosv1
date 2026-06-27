# DCA OS Lite — UI/UX Screen Evidence Register

**Status:** Evidence register (not approved design)
**Density:** low = mostly chrome/summary · medium = mixed · high = operator lists/workflows

---

## Login

| Field | Value |
|-------|-------|
| Route/hash | `#/login` (unauthenticated) |
| Component | `LoginScreen` in `App.tsx` |
| Layout type | **Form** (split hero + panel on wide screens) |
| Density | Low |
| Main patterns | `.login-page`, `.login-panel`, `.auth-form`, `.primary-action`, Turnstile block |
| Key actions | Sign in |
| Modals/panels | None |
| Access | Public |
| UI pain | Large hero typography; Turnstile block adds height |
| Recommended layout | Form (KEEP); SHRINK hero on admin-only deployments |

---

## Dashboard

| Field | Value |
|-------|-------|
| Route | `#/dashboard` |
| Component | `DashboardView` in `App.tsx` |
| Layout type | **Document + panels** |
| Density | Medium |
| Main patterns | `PageHeader`, 4× `MetricCard`, `SectionPanel`, audit timeline, quick links/actions |
| Key actions | Audit filter chips; links to Tasks/Projects/Finance/Modules |
| Modals/panels | None |
| Access | Admin-only |
| UI pain | 4 metric cards before audit feed; quick action grid mixes real links + future pills |
| Recommended layout | Document dashboard; SHRINK metrics to 2 or inline header stats |

---

## Modules

| Field | Value |
|-------|-------|
| Route | `#/modules`, `#/modules/{key}` |
| Component | `ModuleRegistryView` in `App.tsx` |
| Layout type | **Card grid** |
| Density | Medium |
| Main patterns | `PageHeader`, `.module-grid`, `.module-card`, `StatusBadge`, placeholder panel |
| Key actions | Enable/disable module; open module link |
| Modals/panels | Placeholder panel for selected module key |
| Access | Admin-only |
| UI pain | Cards appropriate here but description text long |
| Recommended layout | Card grid (KEEP) |

---

## Tenants

| Field | Value |
|-------|-------|
| Route | `#/tenants` |
| Component | `TenantView` in `App.tsx` |
| Layout type | **List** |
| Density | Low–medium |
| Main patterns | Manual `.section-header`, `.tenant-list`, `.tenant-row` |
| Key actions | Switch tenant |
| Modals/panels | None |
| Access | Admin-only |
| UI pain | Manual header (no PageHeader); rows acceptable |
| Recommended layout | List (KEEP); standardize PageHeader |

---

## Clients

| Field | Value |
|-------|-------|
| Route | `#/clients` |
| Component | `ClientsPage.tsx` |
| Layout type | **Dense list** (should be **table** at scale) |
| Density | High |
| Main patterns | Manual `.section-header`, dual `.filter-bar`, `.dense-list`, `.row-action-menu`, `Modal`, client access `.dense-access-list` |
| Key actions | Add client; edit; archive; open hub; manage portal access |
| Modals/panels | Create/edit client modal; access linking panel in modal |
| Access | Admin-only |
| UI pain | Two filter groups in toolbar; card-row duplicates meta/fields; no table |
| Recommended layout | **Table** with row actions (REPLACE) |

---

## Client Hub

| Field | Value |
|-------|-------|
| Route | In-page from `#/clients` (no hash) |
| Component | `ClientHubPage.tsx` |
| Layout type | **Workflow / form sections** |
| Density | High |
| Main patterns | `PageHeader`, multiple `SectionPanel`, forms, publication targets, analytics, catalog, logs |
| Key actions | Add publication target; save credentials; analytics profile; catalog CRUD |
| Modals/panels | Inline sections (no central modal) |
| Access | Admin-only |
| UI pain | Many sections vertical scroll; credential UI must stay secure-looking |
| Recommended layout | Workflow sections with sticky sub-nav (DEFER); form layout KEEP |

---

## Projects

| Field | Value |
|-------|-------|
| Route | `#/projects` |
| Component | `ProjectsPage.tsx` |
| Layout type | **Dense list** |
| Density | Medium–high |
| Main patterns | Manual header, compact `SectionPanel` cross-links, `.dense-list`, `row-action-menu` |
| Key actions | Add project; edit; archive |
| Modals/panels | Create/edit modal |
| Access | Admin-only |
| UI pain | Cross-links panel consumes space; list OK density |
| Recommended layout | Table or KEEP dense list; SHRINK cross-links to header links |

---

## Tasks

| Field | Value |
|-------|-------|
| Route | `#/tasks` |
| Component | `TasksPage.tsx` |
| Layout type | **Dense list** |
| Density | High |
| Main patterns | Manual header, compact `SectionPanel`, `.dense-list`, `row-action-menu` |
| Key actions | Add task; edit; archive; link project |
| Modals/panels | Create/edit modal |
| Access | Admin-only |
| UI pain | Due date scannability; same card-row pattern |
| Recommended layout | **Table** with due date column (REPLACE) |

---

## Invoices

| Field | Value |
|-------|-------|
| Route | `#/invoices` |
| Component | `InvoicesPage.tsx` |
| Layout type | **Card list** (should be **table**) |
| Density | High |
| Main patterns | Manual header, tab filter chips (invoices/recurring), `InvoiceCards`/`RecurringInvoiceCards` dense-list, `Modal`, payment modal, `row-action-menu` lifecycle groups |
| Key actions | Add invoice/recurring; edit; send; payment; cancel; archive |
| Modals/panels | Invoice editor; recurring editor; payment registration |
| Access | Admin-only |
| UI pain | Finance data as stacked cards — poor scan; expanded payment not inline |
| Recommended layout | **Table** + expandable payment row or side detail (REPLACE) |

---

## Credit Notes

| Field | Value |
|-------|-------|
| Route | `#/credit-notes` |
| Component | `CreditNotesPage.tsx` |
| Layout type | **Dense list** |
| Density | Medium–high |
| Main patterns | Manual header, `.dense-list`, `row-action-menu`, modals |
| Key actions | Create; issue; void |
| Modals/panels | Credit note editor |
| Access | Admin-only |
| UI pain | Same card-list pattern as invoices |
| Recommended layout | **Table** (REPLACE) |

---

## Services Library

| Field | Value |
|-------|-------|
| Route | `#/invoice-items` |
| Component | `InvoiceItemsPage.tsx` |
| Layout type | **Mixed** (PageHeader + metrics + dense list) |
| Density | Medium |
| Main patterns | `PageHeader`, `MetricCard`, `.dense-list`, `row-action-menu` |
| Key actions | Add service; archive/restore |
| Modals/panels | Service editor modal |
| Access | Admin-only |
| UI pain | Metrics + list — acceptable for smaller dataset |
| Recommended layout | Table if catalog grows (REPLACE at scale) |

---

## Bills / Vendors

| Field | Value |
|-------|-------|
| Route | `#/bills` |
| Component | `BillsPage.tsx` |
| Layout type | **Dense list** (vendors + bills sections) |
| Density | High |
| Main patterns | Manual header, vendor section + bill section, `.dense-list`, dual row menus, upload |
| Key actions | Vendor CRUD; bill CRUD; document upload |
| Modals/panels | Vendor/bill modals |
| Access | Admin-only |
| UI pain | Two entity types on one page — long scroll |
| Recommended layout | **Table** per section or tabs (REPLACE/SPLIT) |

---

## AI Delivery

| Field | Value |
|-------|-------|
| Route | `#/ai-delivery` |
| Component | `AiDeliveryPage.tsx` |
| Layout type | **Workflow** (list + many modals) |
| Density | High |
| Main patterns | Manual header, muted explainer, `SectionPanel` with 9× `MetricCard`, `.dense-list`, extensive `row-action-menu`, many `Modal`s |
| Key actions | Add project; Brief; Content Plan; Research; MI Context; Workflow Runs; Drafts; Images; Deliverables; Reviews; Monthly Report |
| Modals/panels | Add/Edit project; Brief; AI SEO/Content Plan; Research/Sources; MI Context; Workflow Runs; Content Production; Image Production; Deliverables (+ reviews); WordPress confirm |
| Access | Admin-only |
| UI pain | Biggest scroll + modal depth; operator summary 9 cards; action hierarchy unclear |
| Recommended layout | **Workflow** — list primary; collapse summary; side-sheet DEFER |

---

## Market Intelligence

| Field | Value |
|-------|-------|
| Route | `#/ai-market-intelligence` |
| Component | `AiMarketIntelligencePage.tsx` |
| Layout type | **Split pane workflow** |
| Density | High |
| Main patterns | `PageHeader`, split grid (queue + detail), `.dense-list`, compact `SectionPanel`s, metrics, row menus |
| Key actions | New project; sources; runs; insights; handoffs; status updates |
| Modals/panels | Project, source, insight modals |
| Access | Admin-only |
| UI pain | Detail pane stacks many compact sections — long scroll; execution log in row menu |
| Recommended layout | **Workflow** split pane (KEEP); SHRINK section count visible |

---

## Monthly Report panel

| Field | Value |
|-------|-------|
| Route | In-page within AI Delivery modal flow |
| Component | `MonthlyReportPanel.tsx` |
| Layout type | **Document + workflow** |
| Density | High |
| Main patterns | `SectionPanel`, `MetricCard`, `.table-wrap` tables, forms, status actions, PDF/metrics import |
| Key actions | Create/update report; FINAL status; PDF; metrics import/approve; MI context |
| Modals/panels | Embedded in AI Delivery modal (not separate route) |
| Access | Admin-only |
| UI pain | Very dense; admin notes vs client FINAL content mixed in one panel |
| Recommended layout | **SPLIT** admin operator panel vs client document view |

---

## Client Portal

| Field | Value |
|-------|-------|
| Route | `#/client-portal` |
| Component | `ClientPortalPage.tsx` |
| Layout type | **Split pane document** |
| Density | Medium–high |
| Main patterns | `PageHeader`, 4× `MetricCard`, split archive sidebar + detail, many compact `SectionPanel`s, `.dense-list`, download primaries, catalog inquiry form |
| Key actions | Refresh; select project; download deliverable/report; submit catalog inquiry |
| Modals/panels | None (inline sections); deferred-features SectionPanel at bottom |
| Access | Client-safe (read-only intent) |
| UI pain | Same admin shell/nav; 4 metrics on load; dense-record looks admin; DRAFT badge risk on content plan status |
| Recommended layout | **Document** / portal-specific shell (SPLIT) |

---

## Company Profile

| Field | Value |
|-------|-------|
| Route | `#/company-profile` |
| Component | `CompanyProfilePage.tsx` |
| Layout type | **Form document** |
| Density | Medium |
| Main patterns | `PageHeader`, `MetricCard`, `SectionPanel`, `.field-grid`, optional WordPress panel |
| Key actions | Save company profile |
| Modals/panels | WordPressConfigPanel (deprecated path) |
| Access | Admin-only |
| UI pain | Metrics for simple form page |
| Recommended layout | Form document (KEEP); SHRINK metrics |

---

## Settings

| Field | Value |
|-------|-------|
| Route | `#/settings` |
| Component | `SettingsView` in `App.tsx` |
| Layout type | **Shell / placeholder** |
| Density | Low |
| Main patterns | `PageHeader`, 3× `MetricCard`, `SectionPanel`, `EmptyState`, `StatusNotice` |
| Key actions | None (read-only) |
| Modals/panels | None |
| Access | Admin-only |
| UI pain | Metrics without actions — empty chrome |
| Recommended layout | Document placeholder (KEEP until backend); SHRINK metrics |

---

## Team

| Field | Value |
|-------|-------|
| Route | `#/team` |
| Component | `TeamView` in `App.tsx` |
| Layout type | **Table** |
| Density | Medium |
| Main patterns | `PageHeader`, 3× `MetricCard`, `.table-wrap` + `<table>` |
| Key actions | None (read-only directory) |
| Modals/panels | None |
| Access | Admin-only |
| UI pain | Only screen besides monthly metrics using real table — good reference |
| Recommended layout | **Table** (KEEP as reference pattern) |

---

## Deferred review placeholders

| Field | Value |
|-------|-------|
| Route | `#/content-plan-review`, `#/content-draft-review` |
| Component | `ClientContentPlanReviewView`, `ClientContentDraftReviewView` in `App.tsx` |
| Layout type | **Placeholder document** |
| Density | Low |
| Main patterns | `PageHeader`, `SectionPanel`, `StatusNotice`, `EmptyState` |
| Key actions | None |
| Modals/panels | None |
| Access | Deferred (not client approval) |
| UI pain | Must not be redesigned as active approval UI |
| Recommended layout | DEFER — keep placeholder or remove from nav |

---

## Screen summary matrix

| Screen | Access | Density | Layout | Table candidate? |
|--------|--------|---------|--------|------------------|
| Login | Public | Low | Form | No |
| Dashboard | Admin | Medium | Document | No |
| Modules | Admin | Medium | Cards | No |
| Tenants | Admin | Low–Med | List | Optional |
| Clients | Admin | High | Dense list | **Yes** |
| Client Hub | Admin | High | Workflow | No |
| Projects | Admin | Med–High | Dense list | **Yes** |
| Tasks | Admin | High | Dense list | **Yes** |
| Invoices | Admin | High | Card list | **Yes** |
| Credit Notes | Admin | Med–High | Dense list | **Yes** |
| Services | Admin | Medium | Mixed | At scale |
| Bills | Admin | High | Dense list | **Yes** |
| AI Delivery | Admin | High | Workflow | List KEEP |
| Market Intelligence | Admin | High | Split workflow | Partial |
| Monthly Report | Admin | High | Document/workflow | Tables KEEP |
| Client Portal | Client | Med–High | Split document | No |
| Company Profile | Admin | Medium | Form | No |
| Settings | Admin | Low | Placeholder | No |
| Team | Admin | Medium | **Table** | Reference |
| Deferred reviews | Deferred | Low | Placeholder | No |

---

*Register for evidence and rule extraction only.*
