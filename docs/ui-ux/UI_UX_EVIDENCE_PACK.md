# DCA OS Lite — UI/UX Evidence Pack

**Status:** Evidence collection (draft rules not approved)
**Branch:** `feature/uiux-evidence-pack`
**Purpose:** Repo-wide inventory of current UI components, CSS, patterns, and pain points so the owner can later derive system-wide design rules for every element.

**Related:** `V0_UI_UX_AUDIT_PACK.md`, `DARK_NEBULA_PRODUCT_UI_DIRECTION.md`, `AGENTS.md`

---

## 1. Purpose

This pack documents **what exists today** in the DCA OS Lite frontend — not what should be built. It supports:

1. Extrapolating global vs module-specific UI rules
2. Prioritizing shrink/replace/split decisions before implementation
3. Preserving Client Portal safety boundaries during redesign
4. Feeding machine-readable data (`UI_UX_RAW_PATTERN_INVENTORY.json`) for later analysis

v0.dev critique themes reflected in evidence:

- Too many giant cards / metric grids above primary work
- Page chrome inconsistent and sometimes loud
- Dense operational lists often rendered as stacked cards instead of tables
- Weak primary vs secondary action hierarchy (filter chips vs CTAs)
- Low-signal summary content consuming premium viewport space
- Client Portal needs polished read-only feel; admin needs compact operator console

---

## 2. Source files inspected

### Routing & shell

| File | Role |
|------|------|
| `apps/web/src/App.tsx` | Hash routing, nav items, LoginScreen, Dashboard/Modules/Tenants/Settings/Team views, StatusNotice, view switch |
| `apps/web/src/components/AppLayout.tsx` | Sidebar, brand, nav sections, tenant panel, user panel |

### Shared components

| File | Role |
|------|------|
| `apps/web/src/components/ui/PageHeader.tsx` | Canonical page header component |
| `apps/web/src/components/ui/SectionPanel.tsx` | Section wrapper (`tone`: default/compact/highlight — **compact CSS undefined**) |
| `apps/web/src/components/ui/MetricCard.tsx` | Metric card with accent variants |
| `apps/web/src/components/ui/StatusBadge.tsx` | Status tone mapping |
| `apps/web/src/components/ui/ModalActions.tsx` | Save/Cancel footer pattern |
| `apps/web/src/components/ui/index.ts` | UI exports |
| `apps/web/src/components/Modal.tsx` | Dialog shell (hardcoded eyebrow "Edit") |
| `apps/web/src/components/EmptyState.tsx` | Empty state panel |
| `apps/web/src/components/ErrorState.tsx` | Error panel |
| `apps/web/src/components/LoadingState.tsx` | Loading panel |
| `apps/web/src/components/DashboardCard.tsx` | Legacy/unused in main flow (exists) |
| `apps/web/src/components/auth/*`, `tenant/*`, `permissions/*` | Placeholder shells |

### Styles

| File | Role |
|------|------|
| `apps/web/src/styles.css` | ~1940 lines; **three layered blocks**: legacy tokens, Dark Nebula phase 1, data-dense phase 1 (overrides buttons/metrics at end) |

### Pages

| File | Module |
|------|--------|
| `pages/clients/ClientsPage.tsx` | Clients list |
| `pages/clients/ClientHubPage.tsx` | Client Hub (in-page) |
| `pages/client-portal/ClientPortalPage.tsx` | Client Portal |
| `pages/projects/ProjectsPage.tsx` | Projects |
| `pages/tasks/TasksPage.tsx` | Tasks |
| `pages/invoices/InvoicesPage.tsx` | Invoices + recurring |
| `pages/credit-notes/CreditNotesPage.tsx` | Credit notes |
| `pages/invoice-items/InvoiceItemsPage.tsx` | Services library |
| `pages/bills/BillsPage.tsx` | Bills + vendors |
| `pages/ai-delivery/AiDeliveryPage.tsx` | AI Delivery (~5800 lines) |
| `pages/ai-delivery/MonthlyReportPanel.tsx` | Monthly report sub-panel |
| `pages/ai-market-intelligence/AiMarketIntelligencePage.tsx` | Market Intelligence |
| `pages/company-profile/CompanyProfilePage.tsx` | Company profile |
| `pages/company-profile/WordPressConfigPanel.tsx` | Deprecated WP panel |
| `pages/DashboardPage.tsx` | Standalone (App uses inline DashboardView) |
| `pages/ModulePage.tsx` | Module shell placeholder |

### Prior audit docs

- `docs/ui-ux/V0_UI_UX_AUDIT_PACK.md`
- `docs/ui-ux/V0_AUDIT_FINDINGS_TEMPLATE.md`
- `docs/ui-ux/V0_SCREENSHOT_CHECKLIST.md` (if present on branch)

---

## 3. Route / page inventory

Hash base: `http://localhost:5173/#/{view}`

| Hash | Nav label | Section | Component | Access |
|------|-----------|---------|-----------|--------|
| `#/login` | — | — | `LoginScreen` (App.tsx) | Public |
| `#/dashboard` | Dashboard | Product | `DashboardView` | Admin |
| `#/modules` | Modules | Product | `ModuleRegistryView` | Admin |
| `#/modules/{key}` | — | Product | Module placeholder panel | Admin |
| `#/tenants` | Tenants | Product | `TenantView` | Admin |
| `#/client-portal` | Client Portal | client | `ClientPortalPage` | Client-safe (same shell) |
| `#/clients` | Clients | core | `ClientsPage` / `ClientHubPage` | Admin |
| `#/projects` | Projects | core | `ProjectsPage` | Admin |
| `#/ai-delivery` | AI Delivery | core | `AiDeliveryPage` | Admin |
| `#/ai-market-intelligence` | Market Intelligence | core | `AiMarketIntelligencePage` | Admin |
| `#/tasks` | Tasks | core | `TasksPage` | Admin |
| `#/invoices` | Invoices | core | `InvoicesPage` | Admin |
| `#/credit-notes` | Credit Notes | core | `CreditNotesPage` | Admin |
| `#/invoice-items` | Services Library | core | `InvoiceItemsPage` | Admin |
| `#/bills` | Bills | core | `BillsPage` | Admin |
| `#/company-profile` | Company Profile | settings | `CompanyProfilePage` | Admin |
| `#/settings` | Settings | settings | `SettingsView` | Admin |
| `#/team` | Team | settings | `TeamView` | Admin |
| `#/content-plan-review` | — | — | Deferred placeholder | Deferred |
| `#/content-draft-review` | — | — | Deferred placeholder | Deferred |

**In-page (no hash):** Client Hub from Clients row; AI Delivery modals; Monthly Report panel inside AI Delivery modal flow.

---

## 4. Shared component inventory

| Component | Export path | CSS classes | Used by |
|-----------|-------------|-------------|---------|
| `AppLayout` | `components/AppLayout.tsx` | `app-shell`, `sidebar`, `nav-list`, `brand`, `user-panel` | All authenticated views |
| `PageHeader` | `components/ui/PageHeader.tsx` | `page-header`, `section-header`, `eyebrow`, `page-description`, `toolbar`, `action-bar` | Dashboard, Modules, Team, Settings, Client Portal, Client Hub, MI, Invoice Items, Company Profile |
| `SectionPanel` | `components/ui/SectionPanel.tsx` | `section-panel`, `section-panel-header`, `section-panel-body`, `section-panel-action` | Dashboard, AI Delivery, MI, Client Portal, Projects, Tasks, Settings |
| `MetricCard` | `components/ui/MetricCard.tsx` | `metric-card`, `metric-card-{accent}`, `metric-card-label/value/helper` | Dashboard, Settings, Team, Client Portal, AI Delivery, MI, Invoice Items, Company Profile |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | `status-badge`, `status-badge-{tone}` | Widespread |
| `Modal` | `components/Modal.tsx` | `modal-backdrop`, `modal-panel`, `modal-header/body/footer` | Invoices, AI Delivery, MI, Clients, etc. |
| `ModalActions` | `components/ui/ModalActions.tsx` | `modal-footer` + button classes | Some forms |
| `EmptyState` | `components/EmptyState.tsx` | `state-panel`, `empty-state-panel`, `state-orb` | Most list pages |
| `ErrorState` | `components/ErrorState.tsx` | `state-panel`, `state-panel-error` | Error boundaries per page |
| `LoadingState` | `components/LoadingState.tsx` | `state-panel`, `loading-state-panel`, `loading-pulse` | Page load |
| `StatusNotice` | inline `App.tsx` | `status-notice`, `status-{info\|error\|success}` | App-level banner |

**Pattern not extracted to component:** manual `section-header` div (title + toolbar) — used by Clients, Projects, Tasks, Invoices, Credit Notes, Bills, AI Delivery.

**Pattern not extracted to component:** `dense-list` + `entity-card dense-record` row — de facto list/table substitute across CRM, finance, AI modules.

**Pattern not extracted to component:** `row-action-menu` (`<details>`) — kebab-style grouped actions.

---

## 5. CSS class / token inventory

### Design tokens (`:root` — final cascade wins)

| Token | Approx value / role |
|-------|---------------------|
| `--bg`, `--bg-deep`, `--bg-purple` | Deep navy backgrounds |
| `--panel`, `--panel-strong`, `--panel-soft` | Glass panel fills |
| `--border`, `--border-strong` | Soft violet/blue borders |
| `--text`, `--text-soft`, `--muted` | Typography colors |
| `--accent`, `--accent-cyan`, `--accent-purple` | Accent palette |
| `--success`, `--warning`, `--danger` | Semantic colors |
| `--radius-sm` (12px), `--radius` (18px), `--radius-lg` (26px) | Border radii |
| `--dense-surface`, `--dense-border` | Dense row surfaces (phase 1 end) |
| `--field-surface` | Form inputs |
| `--shadow`, `--shadow-soft` | Elevation |

**Note:** `:root` is declared **three times** in `styles.css`; later blocks override earlier button/metric styles. Evidence of incomplete consolidation.

### Layout / shell

| Class | Key sizing |
|-------|------------|
| `.app-shell` | `grid-template-columns: 292px 1fr` |
| `.sidebar` | sticky, `100vh`, padding |
| `.main-shell` | gap 16px, padding ~20–28px |
| `.view-section` | gap 14px |

### Typography

| Class / selector | Size behavior |
|------------------|---------------|
| `.eyebrow` | Uppercase small label |
| `.section-header h1`, `.page-header h1` | `clamp(1.9rem, 3.2vw, 3.1rem)` — **large page titles** |
| `.dense-title h2` | `1rem` — compact row titles |
| `.metric-card strong` | `clamp(1.35rem, 2vw, 1.9rem)` |
| `.dense-meta` | `0.78rem` |
| `.dense-field span` | `0.7rem` uppercase labels |
| `th` | `0.84rem` uppercase (tables) |

### Cards / panels

| Class | Padding / min-height |
|-------|----------------------|
| `.metric-card` | `padding: 20px`, `min-height: 148px` (152px on dashboard) |
| `.section-panel` | `padding: 20px`, gap 18px |
| `.entity-card`, `.module-card` | `padding: 20px` |
| `.dense-record` | `padding: 10px 12px`, gap 10px — **compact pattern** |
| `.state-panel` | `padding: 14–20px`, `min-height: 86px` |
| `.modal-panel` | `border-radius: 30px`, max-width 980px |

### Buttons (final dense override)

| Class | min-height | padding | Visual |
|-------|------------|---------|--------|
| `.primary-action` | 32px | 6px 10px | Muted cyan fill, no gradient shadow |
| `.secondary-action` | 32px | 6px 10px | Low-contrast glass |
| `.filter-chip` | 32px | same as secondary | Active = cyan tint |
| `.danger-action` | 32px | red tint | Rare |
| `.ghost-action`, `.subtle-action` | defined | ** rarely used in TSX** |

Earlier CSS block still defines larger buttons (`min-height: 42px`, gradient primary) — superseded by dense block unless specificity conflicts.

### Lists / tables

| Class | Role |
|-------|------|
| `.dense-list` | `grid`, gap 8px |
| `.dense-record-main` | 3-column grid: title / fields / actions |
| `.dense-fields` | 4-column field grid |
| `.table-wrap` | Padding 8px; wraps `<table>` |
| `table` | min-width 680px, zebra rows |

**Usage:** `.table-wrap` only on **Team** members table and **MonthlyReportPanel** metrics tables. All other operational lists use `.dense-list`.

### Badges

| Class | Size (dense) |
|-------|--------------|
| `.status-badge` | `0.68rem`, padding 3×8px |
| `.entity-pill` | Same family as badge |

### Modals

| Class | Notes |
|-------|-------|
| `.modal-backdrop` | blur + dark overlay |
| `.modal-header h2` | `clamp(1.5rem, 3vw, 2.2rem)` |
| `.modal-footer` | flex actions |

### Nav

| Class | Notes |
|-------|-------|
| `.nav-section-label` | Section grouping (Product → "Product", client, core, settings) |
| `.nav-list a[aria-current="page"]` | Active state |

---

## 6. Recurring UI patterns

| Pattern ID | Description | Files | Flag |
|------------|-------------|-------|------|
| P1 | **4-up metric grid** above content | Dashboard, Client Portal, AI Delivery (9 cards), Settings, Team | SHRINK |
| P2 | **Manual section-header** vs `PageHeader` split | Core CRM/finance vs newer modules | REPLACE (standardize) |
| P3 | **dense-list row** as universal list | Clients, Projects, Tasks, Invoices, Bills, AI Delivery, MI, Portal | KEEP (admin); REPLACE with table for finance high-density |
| P4 | **row-action-menu** for secondary actions | Clients, Projects, Tasks, Invoices, AI Delivery, MI | KEEP |
| P5 | **Filter chips** styled as buttons | All filtered lists | SHRINK visual weight |
| P6 | **SectionPanel operator summary** | AI Delivery (9 metrics inside one panel) | SHRINK / collapse |
| P7 | **Modal-heavy workflow** | AI Delivery (10+ modals) | SPLIT (side-sheet candidate) |
| P8 | **Split pane** (sidebar list + detail) | MI, Client Portal | KEEP |
| P9 | **state-panel** for info/errors | Widespread | SHRINK |
| P10 | **Module cards grid** | Modules registry | KEEP (low frequency) |
| P11 | **Tenant row list** | Tenants | KEEP |
| P12 | **compact SectionPanel tone** | Portal, MI, Projects | KEEP intent — **CSS missing for `-compact`** |
| P13 | **Inline muted explainer** under header | AI Delivery admin path paragraph | SHRINK to tooltip/collapsible |
| P14 | **Quick link / quick action grids** | Dashboard | SHRINK |
| P15 | **HTML table** | Team, Monthly metrics only | KEEP — expand pattern |

### Patterns working relatively well (KEEP candidates)

- `.dense-record` row spacing (10–12px padding) — good operator density
- `.dense-field` label/value micro-grid inside rows
- `.row-action-menu` grouping with labels (Planning / Packaging / Reports)
- MI + Portal split-pane layout
- Final dense button sizing (32px) when cascade applies
- Status badge tone mapping in `getStatusTone()`

### Patterns flagged for change (v0 + evidence aligned)

- Giant metric grids before scannable lists
- Invoice/credit note **card stacks** instead of tables
- Multiple `primary-action` in same row (Portal project select uses primary for "Open")
- Modal eyebrow always "Edit" in `Modal.tsx`
- Client Portal sharing full admin sidebar
- `section-panel-compact` prop without CSS differentiation

---

## 7. Current problems by pattern

| Pattern | Observed pain | Evidence |
|---------|---------------|----------|
| Metric grids | Push primary lists below fold; low signal per px | AI Delivery: 9 MetricCards in Operator summary |
| Page chrome | Inconsistent header component; large h1 | `clamp(1.9rem…3.1rem)` page titles |
| Card lists | Hard to scan 20+ invoices/clients vs table columns | `InvoiceCards` → `dense-list` |
| Action hierarchy | Filter chips compete with Add/Save primary | Same `secondary-action` class on filters |
| state-panel / notices | Visual noise; repeated safety copy | Client Portal + AI Delivery |
| Modals | Deep scroll; nested SectionPanels; many primaries | AiDeliveryPage modal footers |
| SectionPanel compact | No visual difference | `tone="compact"` with no CSS rule |
| CSS duplication | Unpredictable which button style applies | Three `:root` + button blocks |
| Client shell | Admin nav visible to portal users | `navigationItems` not role-filtered in AppLayout |
| Settings/Team shells | Metrics without actions | Read-only MVP |

---

## 8. Admin vs client UI differences

| Aspect | Admin UI | Client Portal |
|--------|----------|---------------|
| **Shell** | Same `AppLayout` + full sidebar | Same shell — **boundary risk** |
| **Page header** | `PageHeader` with long admin descriptions | `PageHeader` + read-only copy |
| **Metrics** | 4+ command metrics common | 4 metric cards on load |
| **Lists** | `dense-list` + row actions + modals | `dense-list`, download primaries only |
| **Actions** | Create, edit, archive, workflow modals | Refresh, View/Open, Download, catalog inquiry |
| **Status exposure** | Full workflow statuses, admin notes fields | FINAL deliverables/reports; filtered API |
| **Modals** | Extensive (AI Delivery) | Inline forms only (inquiry) |
| **Deferred features** | Shown as deferred placeholders | Explicit "Not available" SectionPanel |
| **Tone** | Operator / internal | Polished client-facing (intent; not fully differentiated visually) |

### Client Portal boundary evidence (record only — not fixed here)

| Risk | File / location | Notes |
|------|-----------------|-------|
| Admin nav visible | `AppLayout.tsx`, `App.tsx` navigationItems | No role-based nav filter |
| Internal status label | `ClientPortalPage.tsx` ~1005 | `contentPlanStatus ?? "DRAFT"` badge may show "Draft" to client |
| Admin copy in UI | Portal SectionPanel descriptions | Mentions "admin" frequently — acceptable but not polished |
| Same primary button styling | Portal download/select | Looks like admin CTAs |
| API boundary | Backend filters | UI still **looks** like admin app |
| executionLog in MI | Admin only | Not in portal — OK |

---

## 9. Implementation risk notes

| Risk | Level | Reason |
|------|-------|--------|
| Global CSS refactor (`styles.css`) | High | Single 1940-line file; triple token blocks; wide blast radius |
| Standardize PageHeader everywhere | Medium | Many pages use manual headers + toolbars |
| Convert finance lists to tables | Medium | `InvoiceCards` / `RecurringInvoiceCards` structure |
| AI Delivery modal → side sheet | High | 5800-line page; many interconnected states |
| Role-based nav for Client Portal | Medium | Auth/permission wiring — **backend boundary** |
| Metric grid reduction | Low–Medium | Mostly layout/delete/move |
| `section-panel-compact` CSS | Low | Add missing rules |
| Modal component eyebrow | Low | Prop change |
| Client Portal visual fork | Medium | SPLIT shell/theme without behavior change |
| Touch Dark Nebula approval | Medium | Approved doc says "spacious"; evidence pack targets compact hybrid |

---

## 10. Global rule vs screen-specific rule (guidance)

| Should become **global rule** | Should stay **screen-specific** |
|------------------------------|--------------------------------|
| One canonical page header pattern | AI Delivery operator summary collapse default |
| One section header / SectionPanel spec | Monthly Report metrics import table columns |
| Button variant hierarchy (primary/secondary/ghost/filter) | MI insight approval action order |
| Dense row vs data table decision matrix | Invoice payment modal field layout |
| Badge tone mapping (existing `getStatusTone`) | Client Portal download-only actions |
| Modal header/footer contract | WordPress publish confirm (deferred) |
| Empty/error/loading panel size caps | Client Hub credential form |
| Admin vs portal shell differentiation | Catalog inquiry form fields |
| Max metric cards above fold (e.g. 0–2) | Dashboard audit feed filters |
| Spacing scale tokens (single `:root`) | Module registry card grid |

---

## 11. Pattern flags reference

| Flag | Meaning |
|------|---------|
| **KEEP** | Pattern is working; refine only |
| **SHRINK** | Reduce padding, font size, or count |
| **REPLACE** | Wrong pattern (e.g. cards → table) |
| **SPLIT** | Needs admin vs client (or modal vs sheet) variants |
| **DEFER** | Too risky for P0; document only |

---

## 12. Companion artifacts

| File | Contents |
|------|----------|
| `UI_UX_ELEMENT_RULE_MATRIX.md` | Per-element type matrix |
| `UI_UX_SCREEN_EVIDENCE_REGISTER.md` | Per-screen evidence |
| `UI_UX_RAW_PATTERN_INVENTORY.json` | Machine-readable inventory |
| `UI_UX_RULE_EXTRACTION_NOTES.md` | Draft universal rules (not approved) |

---

*Evidence only. No design decisions approved by this document.*
