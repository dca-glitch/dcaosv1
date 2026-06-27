# DCA OS Lite — UI/UX Element Rule Matrix

**Status:** Draft evidence → rules (not approved for implementation)
**Use with:** `UI_UX_EVIDENCE_PACK.md`, `UI_UX_RAW_PATTERN_INVENTORY.json`

Legend: **KEEP** · **SHRINK** · **REPLACE** · **SPLIT** · **DEFER**
Scope: **G** global · **M** module-specific · **G+M** global base + module override
Risk: **L** low · **M** medium · **H** high

---

| Element | Current implementation | Visual behavior | Observed pain | Proposed rule direction | Scope | Risk | Affected screens | Notes |
|---------|------------------------|-----------------|----------------|-------------------------|-------|------|------------------|-------|
| **App shell / sidebar** | `AppLayout.tsx`, `.app-shell`, `.sidebar`, `.nav-list`, `.nav-section` | 292px sticky sidebar; sections Product/client/core/settings; brand + tenant + user footer | Client users see admin module links; sidebar heavy vs content | **SPLIT:** admin shell vs portal shell; compact nav labels; role-filtered items | G+M | M | All authenticated | Portal may hide core/finance/settings sections |
| **Page header** | `PageHeader.tsx` OR manual `.section-header` | Eyebrow + large h1 (`clamp(1.9–3.1rem)`) + optional description + toolbar | Two patterns; titles too loud; descriptions long | **REPLACE:** mandate `PageHeader`; cap h1 size; description max 2 lines; actions right | G | L | All modules | AI Delivery still uses manual header |
| **Section header** | `.section-panel-header`, `.entity-card-header h2` | h2 ~1.28rem in cards; SectionPanel title + description | Duplicates page header hierarchy inside modals | **G** rule: section title one step below page title; no eyebrow in sections | G | L | Modals, SectionPanels, entity cards | |
| **Metric card** | `MetricCard.tsx`, `.metric-card`, `.metric-grid` | 148–152px min-height, 20px pad, accent glow, large value text | 4–9 cards consume viewport; low signal | **SHRINK:** max 2–4 per view; smaller min-height (~96px); optional inline stat row | G | L | Dashboard, Portal, AI Delivery, Settings, Team, MI | Prefer inline stats in page header for single values |
| **Data table** | `.table-wrap`, `table`, `th`/`td` | Zebra rows, 680px min-width, uppercase headers | Barely used; finance uses cards | **REPLACE:** finance + high-density admin lists → table; keep dense-row for mobile fallback | G+M | M | Team, Monthly metrics, Invoices, Clients, Tasks | Table wrapper component missing |
| **Dense list row** | `.dense-list`, `.dense-record`, `.dense-record-main` | 10–12px pad; 3-col grid; compact h2 1rem | Good density but duplicates columns (meta + fields); still card chrome per row | **KEEP** admin default; reduce double metadata; optional table mode | G | L | Clients, Projects, Tasks, Finance, AI Delivery, MI, Portal | Best current compact pattern |
| **Card/list item** | `.entity-card`, `.module-card` | 20px pad, glass border, hover glow | Module/entity cards oversized for queue UIs | **SHRINK** padding for queue cards; **KEEP** for module registry | G+M | L | Modules, MI queue, Portal sidebar | |
| **Section panel** | `SectionPanel.tsx`, `.section-panel` | 20px pad, 18px gap, optional action slot | Large wrappers around small content; `tone=compact` has no CSS | **SHRINK** default padding; implement `.section-panel-compact`; collapse optional | G | L | Dashboard, AI Delivery, Portal, MI | Add compact CSS |
| **Status badge** | `StatusBadge.tsx`, `.status-badge-{tone}` | 0.68rem pill, bold, color-coded | Sometimes multiple badges per row; DRAFT visible in portal | **KEEP** mapping; **SPLIT** portal-safe label set; max 2 badges/row | G+M | L | All | Portal: hide internal statuses |
| **Primary button** | `.primary-action` | Dense: 32px cyan-muted; legacy block had gradient | Still used for low-priority selects (Portal View); competes with filters | **G** rule: one primary per toolbar/modal; muted fill; never on filter/select | G | L | All | |
| **Secondary button** | `.secondary-action` | Glass outline, 32px | Overused — same as filters | **G** rule: secondary for cancel/back; not for filters | G | L | All | Extract filter chip variant |
| **Tertiary/text button** | `.ghost-action`, `.subtle-action` | Defined in CSS, rarely in TSX | Missing middle hierarchy | **REPLACE:** use ghost for tertiary links; document usage | G | L | Modals, row menus | CSS exists, TSX adoption needed |
| **Kebab / row action menu** | `.row-action-menu`, `<details>` | Summary button + dropdown panel with labeled groups | Discoverability OK; panel min-width 240px | **KEEP**; ensure single secondary-style trigger; group labels stay | G | L | Clients, Projects, Tasks, Invoices, AI Delivery, MI | |
| **Modal** | `Modal.tsx`, `.modal-backdrop`, `.modal-panel` | max 980px, radius 30px, eyebrow hardcoded "Edit" | Too large for dense ops; deep scroll; wrong eyebrow | **SHRINK** max-width tiers; eyebrow prop; sticky footer | G | M | CRM, Finance, AI Delivery, MI | |
| **Side-sheet candidate** | *Not implemented* — modals used | Full center modal for AI workflow steps | Operator loses list context | **DEFER** P1: AI Delivery Brief/Plan/Deliverables as right sheet | M | H | AI Delivery | Evidence-only recommendation |
| **Form field** | `input`, `select`, `textarea`, `.field-grid label` | min-height 46px, `--field-surface`, radius 12px | Fields tall; grid gaps 16px | **SHRINK** to 38–40px in dense forms; 8px label gap | G | L | All modals | |
| **Field grid** | `.field-grid`, `.entity-field-grid` | 2-col grid; labels as mini-panels (12px pad) | Label panels add noise in modals | **SHRINK** label styling in forms; plain label + field | G | L | Clients, Invoices, Hub, Portal inquiry | |
| **Empty state** | `EmptyState.tsx`, `.empty-state-panel` | state-panel + orb + h3 + paragraph | Orb + padding large for inline empty | **SHRINK** inline variant (no orb) inside panels/tables | G | L | All list pages | |
| **Error state** | `ErrorState.tsx`, `.state-panel-error` | Full panel with orb | Replaces entire page — OK; inline errors heavy in modals | **SPLIT:** page-level vs inline banner | G | L | All | |
| **Loading state** | `LoadingState.tsx`, `.loading-state-panel` | Pulsing orb + label | Acceptable | **KEEP** page-level; inline skeleton **DEFER** | G | L | All | |
| **Toast/status notice** | `StatusNotice` in App.tsx, `.status-notice` | Full-width banner below shell; tone colors | Pushes content; no dismiss | **SHRINK** height; optional dismiss; prefer inline for modal errors | G | L | App-wide | Not true toast — banner |
| **Tabs/filter chips** | `.filter-bar`, `.filter-chip`, `.secondary-action` | Chips use secondary-action class; active cyan tint | Visually compete with Add/Save | **REPLACE:** dedicated chip class; smaller; no button weight | G | L | All filtered lists | |
| **Search/filter bar** | `.toolbar`, `.filter-bar` | Multiple filter groups in toolbar; no search input pattern | Clutter when 2 filter groups + primary | **G** rule: max one filter group in header; overflow to popover | G+M | L | Clients (2 groups), Invoices tab | No global search component |
| **Client Portal project card/list** | `ClientPortalPage` sidebar `.entity-card` + `.dense-record` | Same dense row as admin; primary "Open" button | Feels admin; not polished client UX | **SPLIT:** portal list variant — no entity-card hover glow; softer select state | M | M | Client Portal | |
| **Monthly Report final view** | `MonthlyReportPanel.tsx`, Portal report detail | Admin: metrics tables + admin notes; Portal: FINAL read-only sections | Admin panel very dense; many actions | **SPLIT:** admin operator panel vs client document view | G+M | M | AI Delivery, Client Portal | Portal: document layout |
| **AI Delivery workflow row** | `AiDeliveryPage` `.dense-record` + badges + row menu | Row shows client, month, brief status; 10+ menu actions | Overwhelming menu; row tall when notes open | **KEEP** row; **SHRINK** menu group count visible; progress stepper **DEFER** | M | M | AI Delivery | |
| **AI Delivery modal** | Inline `Modal` + nested SectionPanels | Large modals for Brief, Plan, Research, Deliverables, etc. | Scroll fatigue; nested panels | **SHRINK** modal padding; **DEFER** sheet; one primary per footer | M | H | AI Delivery | |
| **Invoice expanded/payment area** | `InvoicesPage` modals + dense invoice rows | Card row per invoice; payment modal separate | Cannot scan 30 invoices; totals buried in row | **REPLACE** with table + expandable row or side detail | M | M | Invoices | |
| **Finance status area** | StatusBadge on invoice rows; row menu lifecycle group | Status in kicker + fields duplicate | Status not column-aligned | **G** table column for status; badge only once | G+M | L | Invoices, Credit notes, Bills | |

---

## Cross-element priority matrix

| Priority | Elements | Flag mix |
|----------|----------|----------|
| P0 | Page header, Metric card, Filter chips, Primary button hierarchy, Client shell SPLIT | SHRINK + REPLACE + SPLIT |
| P1 | Data table (finance), Section panel compact, Modal sizing, Portal list SPLIT | REPLACE + SHRINK |
| P2 | Side-sheet, Ghost buttons, Empty inline variant, Search bar | DEFER / KEEP |

---

*Draft matrix for rule extraction. Owner approval required before implementation.*
