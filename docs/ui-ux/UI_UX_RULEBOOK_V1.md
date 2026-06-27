# DCA OS Lite — UI/UX Rulebook v1

**Version:** 1.0
**Status:** Approved for planning only — does **not** authorize implementation by itself
**Branch basis:** Evidence pack + v0 audit direction + Dark Nebula (practical density hybrid)
**Audience:** Product owner, frontend implementers, AI agents (scoped blocks only)

---

## A. Purpose and status

### What this rulebook is

Rulebook v1 converts repo evidence (`UI_UX_EVIDENCE_PACK.md`, element matrix, screen register, JSON inventory, rule extraction notes) and v0.dev critique themes into **system-wide UI/UX rules** for later scoped frontend work.

### What this rulebook is not

- It does **not** implement UI changes.
- It does **not** change backend, API, auth, schema, or Client Portal data behavior.
- It does **not** override `AGENTS.md` safety boundaries or production deploy rules.
- Individual implementation blocks still require owner approval per `AGENTS.md` gate flow.

### Product boundaries preserved

| Boundary | Rule |
|----------|------|
| Admin vs Client Portal | Admin shows workflow; Portal shows final client-safe material only |
| Deferred features | No UI for client approvals, public links, live integrations, autonomous agents |
| Dark Nebula | Color/atmosphere from approved direction; **density and readability take priority over spacious decoration** |
| Routing | Hash SPA routes unchanged unless explicitly approved |
| MVP client | Puriva dry run — Portal must feel polished and read-only |

### Dark Nebula reconciliation

Approved Dark Nebula doc emphasizes spacious cards. Rulebook v1 defines a **practical hybrid**:

- **Shell level:** deep navy, nebula gradients, glass borders (Dark Nebula)
- **Data surfaces:** compact tables, dense rows, muted buttons (operator-first)

Document this hybrid in implementation PRs referencing both this rulebook and `docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md`.

---

## B. Global UI principles

| # | Principle | Implementation hint |
|---|-----------|---------------------|
| G1 | **Compact operator-first admin** | Primary work visible without scrolling past metric walls |
| G2 | **Readable before decorative** | Typography and contrast beat glow, orbs, and gradient buttons |
| G3 | **Muted button hierarchy** | Primary = one muted accent fill per action group; no flashy gradients |
| G4 | **Fewer giant cards and alert boxes** | Cap metric cards; inline micro-copy over full-width `state-panel` |
| G5 | **Dense tables/lists for operational data** | ≥10 comparable rows → table; workflow entities → dense row |
| G6 | **Clear action tiers** | Primary → secondary → tertiary/ghost; filters are not buttons |
| G7 | **Client Portal = document/archive** | Calm, read-only, final-deliverables oriented |
| G8 | **Consistent chrome** | One page header pattern; one section header scale |
| G9 | **Accessible dark theme** | Status not color-only; focus rings preserved |
| G10 | **Change in small lanes** | P0 → P1 → P2; no mass rewrite |

---

## C. Element rules

Each entry: **Rule** · **Why** · **When to use** · **When not to use** · **Admin variant** · **Client Portal variant** · **Risk** · **First screens**

---

### App shell / sidebar

| | |
|---|---|
| **Rule** | Admin shell: 260–292px sidebar, grouped nav (Product / client / core / settings), sticky. Portal shell: **reduced nav** (Portal + account/logout); same Dark Nebula tokens. |
| **Why** | Portal users must not see finance/AI admin modules; admin needs fast module access |
| **When to use** | All authenticated views |
| **When not to use** | Login (full-page, no shell) |
| **Admin variant** | Full nav per `navigationItems` in `App.tsx` |
| **Portal variant** | Minimal nav; optional `portal-shell` class; softer sidebar contrast |
| **Risk** | Medium — role-filtered nav may need permission wiring |
| **First screens** | Client Portal, then global `AppLayout.tsx` |

---

### Page header

| | |
|---|---|
| **Rule** | Use `PageHeader` everywhere. Structure: optional eyebrow → h1 (max `clamp(1.5rem, 2.5vw, 2.25rem)`) → description ≤120 chars → right-aligned primary action. Filters on **second row**, not mixed with primary. |
| **Why** | Seven modules use manual `section-header`; titles too large; inconsistent actions |
| **When to use** | Every authenticated screen |
| **When not to use** | Inside modals (use modal header) |
| **Admin variant** | Eyebrow = module domain (Finance, CRM, AI Workflow) |
| **Portal variant** | Eyebrow = "Client workspace"; description = read-only archive copy; no create actions |
| **Risk** | Low |
| **First screens** | Clients, Invoices, AI Delivery, Dashboard |

---

### Section header

| | |
|---|---|
| **Rule** | Section title = `h2` one step below page title (~1rem–1.1rem). Optional one-line description. No eyebrow in sections. Max one action aligned right. |
| **Why** | Duplicated hierarchy inside modals and SectionPanels |
| **When to use** | SectionPanel, entity-card headers, modal bodies |
| **When not to use** | Page-level title (use PageHeader) |
| **Admin variant** | Operational labels ("Operator summary", "Lifecycle") |
| **Portal variant** | Client-facing section names ("Deliverables", "Monthly reports") — no "admin" in titles |
| **Risk** | Low |
| **First screens** | AI Delivery SectionPanels, Client Portal detail sections |

---

### Metric card

| | |
|---|---|
| **Rule** | Default **max 2** metric cards above primary content. Min-height ~96px; padding 12–16px. More stats → inline header meta or collapsible summary. Dashboard may use 4 only if audit feed stays above fold at 1440px. |
| **Why** | 4–9 cards push lists below fold; low signal per pixel |
| **When to use** | Dashboard command view; optional 2-up summary on Portal |
| **When not to use** | Settings read-only shell; inside every modal; per-row in lists |
| **Admin variant** | Accent variants allowed (cyan/violet) — subtle inset only |
| **Portal variant** | Max 2–4; no warning accent for archive state unless truly exceptional |
| **Risk** | Low |
| **First screens** | Dashboard, AI Delivery operator summary, Client Portal |

---

### Data table

| | |
|---|---|
| **Rule** | Use `.table-wrap` + semantic `<table>` when ≥10 homogeneous rows or column comparison matters. Zebra rows, uppercase `th` at 0.78–0.84rem. Status in dedicated column. |
| **Why** | Finance uses card stacks; Team table proves pattern works |
| **When to use** | Invoices, credit notes, tasks (due dates), clients at scale, team directory |
| **When not to use** | Workflow rows with 8+ action groups; mobile &lt;640px (dense-list fallback OK) |
| **Admin variant** | Row actions via kebab column or last column |
| **Portal variant** | Read-only columns only; no action column except Download |
| **Risk** | Medium — new table wrapper component may help |
| **First screens** | Invoices (P1), Projects direction (P0-3), Team (reference) |

---

### Dense list row

| | |
|---|---|
| **Rule** | `.dense-list` + `.dense-record`: 10–12px padding, single h2 at 1rem, **one** metadata pass (no duplicate meta + fields for same fact). Max 2 badges per row. |
| **Why** | Best current compact admin pattern |
| **When to use** | AI Delivery projects, MI queue, workflow entities, Portal deliverables |
| **When not to use** | 20+ finance rows (use table); module registry (use cards) |
| **Admin variant** | `row-action-menu` on right |
| **Portal variant** | `.portal-record` — no admin hover glow; select state = border tint not primary button |
| **Risk** | Low |
| **First screens** | Projects, AI Delivery list, Client Portal sidebar |

---

### Card / list item

| | |
|---|---|
| **Rule** | **Module/registry cards:** 16–20px pad, glass border OK. **Queue cards:** prefer dense-record. Limit hover glow on operational queues. |
| **Why** | entity-card at 20px pad oversized for queues |
| **When to use** | Modules grid, MI project queue sidebar |
| **When not to use** | Invoice lists, client lists at scale |
| **Admin variant** | Standard entity-card |
| **Portal variant** | Flatter card; no glass hover on archive list |
| **Risk** | Low |
| **First screens** | Modules (KEEP), Portal project list (SPLIT) |

---

### Section panel

| | |
|---|---|
| **Rule** | Default padding 16px, gap 12px. **`tone="compact"`** must map to `.section-panel-compact` (12px pad, 10px gap). Collapsible for optional summaries. |
| **Why** | 20px pad + 18px gap adds scroll; compact tone has no CSS today |
| **When to use** | Grouping related content below header |
| **When not to use** | Single-line messages (use inline text) |
| **Admin variant** | May include action slot |
| **Portal variant** | Compact default; defer-features panel at bottom only |
| **Risk** | Low |
| **First screens** | Client Portal sections, Dashboard audit panel |

---

### Status badge

| | |
|---|---|
| **Rule** | Use `StatusBadge` + `getStatusTone()`. Max 2 per row. 0.68rem pill, subtle fill. |
| **Why** | Centralized tone mapping works; portal leaks internal enums |
| **When to use** | Row status, invoice lifecycle, deliverable state (admin) |
| **When not to use** | Client Portal internal states (DRAFT, ADMIN_REVIEW) |
| **Admin variant** | Full enum labels |
| **Portal variant** | **Client-safe map only** — e.g. "In progress" → hidden; show "Complete" / "Available" |
| **Risk** | Low–medium |
| **First screens** | Client Portal delivery summary (P0-2), finance rows |

---

### Primary button

| | |
|---|---|
| **Rule** | **One** `.primary-action` per toolbar or modal footer. Muted cyan fill (dense tokens), 32px min-height, no gradient shadow. Never on filters, tabs, or list selection. |
| **Why** | Competes with filter chips; Portal uses primary for "View" |
| **When to use** | Save, Add, Submit, Download (single main CTA per surface) |
| **When not to use** | Filter chips; selecting a list item; secondary navigation |
| **Admin variant** | Standard primary |
| **Portal variant** | Download may be primary; selection = secondary |
| **Risk** | Low |
| **First screens** | All toolbars; Portal project list |

---

### Secondary button

| | |
|---|---|
| **Rule** | Cancel, back, refresh, open non-destructive actions. Glass outline. Not for filter chips. |
| **Why** | Shares class with filters today |
| **When to use** | Cancel, Close, Refresh, View/Select |
| **When not to use** | Filter/toggle UI |
| **Admin variant** | Standard |
| **Portal variant** | Refresh, View project |
| **Risk** | Low |
| **First screens** | Modals, Portal header |

---

### Tertiary / text button

| | |
|---|---|
| **Rule** | Use `.ghost-action` or `.subtle-action` for low-priority links in modals and row menus. |
| **Why** | CSS exists; TSX underuses middle tier |
| **When to use** | "Learn more", optional links, low-priority modal actions |
| **When not to use** | Destructive actions (use danger) |
| **Admin variant** | ghost/subtle |
| **Portal variant** | Rare; prefer text links in copy |
| **Risk** | Low |
| **First screens** | Modal footers (P1) |

---

### Kebab / row action menu

| | |
|---|---|
| **Rule** | `<details class="row-action-menu">` with labeled groups. Trigger = secondary-style summary. Max 5–7 visible actions per group; rest OK in groups. |
| **Why** | Works well for AI Delivery Planning/Packaging/Reports |
| **When to use** | Row-level admin actions on dense lists |
| **When not to use** | Client Portal (no destructive/workflow actions) |
| **Admin variant** | Full grouped menus |
| **Portal variant** | **Do not use** for client actions |
| **Risk** | Low |
| **First screens** | KEEP on Clients, Invoices, AI Delivery |

---

### Modal

| | |
|---|---|
| **Rule** | Sizes: `sm` 480px, `md` 720px, `lg` 960px. Eyebrow prop (not hardcoded "Edit"). Footer: secondary cancel + one primary. Sticky footer on tall modals. Minimize nested SectionPanels. |
| **Why** | 980px radius-30 modals cause scroll fatigue |
| **When to use** | Create/edit forms, payment registration |
| **When not to use** | Long AI workflow (consider sheet P2) |
| **Admin variant** | Full forms + admin notes fields |
| **Portal variant** | Catalog inquiry only — simple sm modal or inline form |
| **Risk** | Medium |
| **First screens** | `Modal.tsx` + invoice modals (P1) |

---

### Side-sheet candidate

| | |
|---|---|
| **Rule** | **DEFER to P2.** When implemented: right sheet 480–600px for AI Delivery step UIs; list remains visible. |
| **Why** | Modals hide project list context |
| **When to use** | Not in P0/P1 |
| **When not to use** | Until AI Delivery refactor approved |
| **Admin variant** | AI Delivery workflow steps |
| **Portal variant** | N/A |
| **Risk** | High |
| **First screens** | None (DEFER) |

---

### Form field

| | |
|---|---|
| **Rule** | Dense forms: 38–40px min-height, 12px radius, label above field with 4–8px gap. No mini-panel around labels in modals. |
| **Why** | 46px fields + label panels add height |
| **When to use** | All forms |
| **When not to use** | Read-only display (use plain text) |
| **Admin variant** | Full fields including admin notes |
| **Portal variant** | Inquiry form only — minimal fields |
| **Risk** | Low |
| **First screens** | Invoice field grid (P0-1), Client forms |

---

### Field grid

| | |
|---|---|
| **Rule** | 2-column grid default; `field-span-2` for wide fields. Plain labels — remove label-as-panel styling in forms. |
| **Why** | `.field-grid label` panel styling noisy in modals |
| **When to use** | Create/edit modals |
| **When not to use** | 1–2 fields (single column) |
| **Admin variant** | Standard grid |
| **Portal variant** | Catalog inquiry — single column preferred |
| **Risk** | Low |
| **First screens** | Invoices (P0-1), Company profile |

---

### Empty state

| | |
|---|---|
| **Rule** | **Page-empty:** orb + title + message (full page). **Inline-empty:** text only inside panels/tables — no orb. |
| **Why** | Double padding when empty inside SectionPanel |
| **When to use** | Zero rows in list/table |
| **When not to use** | Loading (use LoadingState) |
| **Admin variant** | Action button optional |
| **Portal variant** | Reassuring copy — not "system broken" |
| **Risk** | Low |
| **First screens** | Portal empty archive (P0-2) |

---

### Error state

| | |
|---|---|
| **Rule** | **Page-error:** `ErrorState` full replacement. **Inline-error:** ≤48px banner inside panel/modal. |
| **Why** | Modal errors as full state-panel heavy |
| **When to use** | API failure on page load vs action failure |
| **When not to use** | Validation hints (inline field text) |
| **Admin variant** | Technical message OK |
| **Portal variant** | Client-safe message — no stack traces, IDs optional |
| **Risk** | Low |
| **First screens** | Portal error states |

---

### Loading state

| | |
|---|---|
| **Rule** | Page load: `LoadingState`. In-panel: short text "Loading…" without orb when inside panel. |
| **Why** | Acceptable today |
| **When to use** | Initial fetch |
| **When not to use** | Button pending (use disabled + label change) |
| **Admin variant** | Standard |
| **Portal variant** | Standard |
| **Risk** | Low |
| **First screens** | KEEP |

---

### Toast / status notice

| | |
|---|---|
| **Rule** | App-level `StatusNotice` banner: max one line, compact height, optional dismiss (P2). Prefer inline success in modal after save. |
| **Why** | Pushes content; not true toast |
| **When to use** | Cross-page success/error after mutation |
| **When not to use** | Expected validation inside forms |
| **Admin variant** | info/success/error tones |
| **Portal variant** | inquiry notice inline preferred |
| **Risk** | Low |
| **First screens** | SHRINK height P1 |

---

### Tabs / filter chips

| | |
|---|---|
| **Rule** | Dedicated `.filter-chip` — 28px height, no `secondary-action` class, no hover lift. Active = subtle cyan tint. Separate from toolbar with gap or divider. |
| **Why** | Chips compete with Add/Save |
| **When to use** | active/archived/all; invoice/recurring tab |
| **When not to use** | Primary navigation |
| **Admin variant** | Multiple filter groups → collapse to one row + "More filters" P2 |
| **Portal variant** | Project filter only |
| **Risk** | Low |
| **First screens** | Clients, Invoices, all filtered lists (P0 CSS) |

---

### Search / filter bar

| | |
|---|---|
| **Rule** | Max **one** filter group in page header row. Second dimension → popover or tabs. Global search **DEFER P2**. |
| **Why** | Clients has two filter groups + primary |
| **When to use** | List filtering |
| **When not to use** | Without list data |
| **Admin variant** | kind + archive filters → combine or popover |
| **Portal variant** | active/archived/all only |
| **Risk** | Low |
| **First screens** | Clients toolbar |

---

### Client Portal project list

| | |
|---|---|
| **Rule** | Sidebar list: portal variant — flat rows, selected = left border or soft bg, **secondary** "Open" button. No metric wall before list on mobile. |
| **Why** | Feels like admin dense-record + primary select |
| **When to use** | Portal project archive navigation |
| **When not to use** | Admin project lists |
| **Admin variant** | N/A |
| **Portal variant** | `.portal-project-list` rules |
| **Risk** | Medium |
| **First screens** | Client Portal (P0-2) |

---

### Monthly Report final view

| | |
|---|---|
| **Rule** | **Admin:** operator panel — metrics tables, admin notes, FINAL actions, PDF. **Portal:** document view — work summary, approved metrics snapshot, recommendations, download only. No admin notes field visible. |
| **Why** | Same components imply same mental model |
| **When to use** | FINAL reports only in Portal |
| **When not to use** | Draft reports in Portal |
| **Admin variant** | `MonthlyReportPanel.tsx` full |
| **Portal variant** | Read-only sections in `ClientPortalPage` |
| **Risk** | Medium |
| **First screens** | Portal monthly report detail (P0-2) |

---

### AI Delivery workflow row

| | |
|---|---|
| **Rule** | KEEP dense row. Show: name, client, month, brief status badge, kebab menu. Collapse operator summary above table (default collapsed P0). No inline wall of text. |
| **Why** | Row works; summary above doesn't |
| **When to use** | AI Delivery project list |
| **When not to use** | Portal |
| **Admin variant** | Full row-action-menu |
| **Portal variant** | N/A |
| **Risk** | Medium |
| **First screens** | AI Delivery (P0-4) |

---

### AI Delivery modal

| | |
|---|---|
| **Rule** | P0: reduce intro `state-panel` paragraphs; one primary per footer; shrink padding. P2: side-sheet evaluation. Do not add client-facing controls. |
| **Why** | 10+ modals, nested panels |
| **When to use** | Brief, plan, deliverables, etc. |
| **When not to use** | Portal |
| **Admin variant** | Full workflow |
| **Portal variant** | N/A |
| **Risk** | High |
| **First screens** | AI Delivery modals (P0-4 text/hierarchy only) |

---

### Invoice expanded / payment area

| | |
|---|---|
| **Rule** | P1: table row + expand for line items/payment OR payment modal (KEEP modal P0). P0: compact field grid in invoice modal only. |
| **Why** | Card stack not scannable |
| **When to use** | Invoice CRUD, payment registration |
| **When not to use** | Portal |
| **Admin variant** | Full lifecycle actions in row menu |
| **Portal variant** | N/A |
| **Risk** | Medium |
| **First screens** | Invoices field grid (P0-1); table P1 |

---

### Finance status area

| | |
|---|---|
| **Rule** | Single status badge per row in one column. Lifecycle actions in row menu group "Lifecycle" — not duplicated in fields. |
| **Why** | Status in kicker + fields redundant |
| **When to use** | Invoices, credit notes, bills |
| **When not to use** | Portal |
| **Admin variant** | Full status enum |
| **Portal variant** | N/A |
| **Risk** | Low |
| **First screens** | Invoices with table P1 |

---

## D. Layout rules by screen type

### Dashboard / overview

- PageHeader + **≤4** metrics OR 2 metrics + inline stats
- Primary content = actionable feed (audit) or tables — not link grids alone
- Quick actions: secondary style; future modules as muted pills only
- Layout: `dashboard-grid` — main column wider than sidebar panels

### CRUD list screen

- PageHeader with single primary (Add) + filter chips below
- Body = table (≥10 rows) or dense-list (&lt;10 or workflow)
- Row actions via kebab — not 4+ inline buttons
- Empty = inline-empty inside list region

### Finance screen

- Tab chips for sub-views (invoices / recurring)
- **Table-first** for invoice/credit/bill lists (P1)
- Amounts right-aligned; status column; client column
- Payment/modals: md modal, compact field grid

### Workflow screen

- PageHeader + optional collapsible operator summary
- Master list (dense) + modals for steps
- MI/Portal: split pane (queue | detail) — KEEP
- Progress stepper DEFER P2

### Client-safe portal screen

- Portal shell (minimal nav)
- PageHeader — read-only description
- ≤2 metrics or none; split pane archive
- Document-style detail sections (compact SectionPanel)
- No workflow buttons, admin eyebrows, or internal badges

### Settings / read-only shell

- PageHeader; **no metric cards** unless data-backed
- SectionPanel with EmptyState until backend ships
- No fake primary actions

### Modal-heavy workflow

- List remains mounted under modal backdrop
- Modal sm/md default; lg only for wide tables
- Footer contract enforced
- AI Delivery: P0 text reduction only — no structural rewrite

### Report / document view

- Portal monthly report: sequential sections (summary → work → performance → recommendations)
- Download primary once per report
- Admin monthly report: operator controls separated from preview content

---

## E. Admin vs Client Portal boundary

### Admin UI may show

- Workflow status (DRAFT, ADMIN_REVIEW, etc.)
- Admin notes, prompts (in admin modules only)
- MI research, sources, execution logs
- AI costs, provider references (when implemented)
- Credentials configuration (masked inputs)
- Archive, publish-prep, approval actions (admin-operated)
- Full sidebar navigation

### Client Portal may show

- Final deliverables (DELIVERED / ACCEPTED)
- FINAL monthly reports + approved performance snapshots
- Client-safe delivery summaries (sanitized MI summary text when API provides)
- Published export/download links when final
- Product catalog (visible products) + inquiry form (no checkout)
- Refresh and download actions only

### Client Portal must never show

- Internal drafts, DRAFT badges on client-facing labels
- Raw prompts, workflow runs, research sources
- Admin notes, AI costs, provider data
- Credentials, secrets, internal IDs as primary labels (slug/UUID in UI copy)
- Approval, request-changes, comment, publish buttons
- Public magic links UI (deferred)
- Navigation to Invoices, AI Delivery admin, Clients admin, etc.

### Visual differences

| Aspect | Admin | Client Portal |
|--------|-------|---------------|
| Nav | Full sidebar | Portal + account/logout |
| Density | Compact operator | Slightly more whitespace — document feel |
| Buttons | Muted primary for mutations | Download primary; no create |
| Badges | Full enum | Client-safe labels only |
| Cards | dense-record + hover | Flat portal rows |
| Copy tone | Operational, internal | Polished, client-facing, no "admin" |

### Copy / tone

- **Admin:** "Operator summary", "Archive", "Lifecycle", "ADMIN_REVIEW" OK
- **Portal:** "Your deliverables", "Monthly report", "Your team will follow up" — never "admin-only" in client-visible headings unless explaining unavailability in deferred panel

---

## F. Pattern conversion rules

| Flag | When | Example |
|------|------|---------|
| **KEEP** | Pattern meets density + clarity goals | dense-record row, row-action-menu, Team table, split pane |
| **SHRINK** | Right pattern, too much padding/size/count | metric cards, state-panel, page h1, section-panel pad |
| **REPLACE** | Wrong pattern for data density | invoice card-list → table; manual header → PageHeader; filter chips separate from buttons |
| **SPLIT** | Admin and client need different UI | shell/nav, status badges, monthly report view, portal project list |
| **DEFER** | High refactor or backend dependency | side-sheet, global search, role-nav without approval, skeleton loaders |

### Decision tree: table vs dense-list

```
≥10 similar rows needing column scan? → TABLE
Workflow row with grouped actions? → DENSE LIST
Client portal deliverables? → PORTAL LIST (dense variant)
Mobile narrow? → DENSE LIST fallback OK
```

---

## G. P0 / P1 / P2 implementation lanes

### P0 — Before first client dry run (smallest safe UI changes)

| Attribute | Definition |
|-----------|------------|
| **Scope** | CSS tokens/class cleanup, header/metric reduction, Portal visual + status safety, filter chips, field grid compact, AI Delivery copy/hierarchy, no backend |
| **Target families** | `styles.css`, `PageHeader` consumers, `ClientPortalPage`, `DashboardView`, `ProjectsPage`, `AiDeliveryPage` (text/CSS only), invoice modal forms |
| **Validation** | `npm run -w @dca-os-v1/web check` + `build`; manual browser at 1440px; Portal read-only review |
| **Risks** | CSS cascade regressions; Portal status display |
| **Stop if** | Auth/API/schema change needed; build fails unrelated; scope creeps into AI Delivery rewrite |

**Blocks:** See `UI_UX_P0_IMPLEMENTATION_PLAN.md` (P0-1 … P0-5).

---

### P1 — Staging-readiness UI cleanup

| Attribute | Definition |
|-----------|------------|
| **Scope** | Finance tables, SectionPanel compact CSS, Modal props/sizing, PageHeader on all core modules, Clients filter toolbar, empty inline variant |
| **Target families** | `InvoicesPage`, `CreditNotesPage`, `BillsPage`, `ClientsPage`, `TasksPage`, `Modal.tsx`, `SectionPanel.tsx` |
| **Validation** | check + build; finance smoke if approved; browser pass on finance + CRM |
| **Risks** | Invoice table migration touch large file |
| **Stop if** | Payment flow breaks; table responsive failure |

---

### P2 — Broader polish

| Attribute | Definition |
|-----------|------------|
| **Scope** | Side-sheet evaluation, global search, dismissible notices, ghost button adoption, Dark Nebula spacing doc update, skeleton loaders |
| **Target families** | AI Delivery architecture, app-wide search, design doc |
| **Validation** | Full validate + targeted smoke |
| **Risks** | AI Delivery refactor |
| **Stop if** | Requires backend or multi-module rewrite in one block |

---

## H. Non-goals / forbidden changes

### Product features — must not appear as active UI

- Public magic links / passwordless client access
- Public approval links
- Client approval buttons, request-changes, comments
- Client-triggered publishing
- Live Google OAuth, GA/GSC sync, Stripe collection
- Live WordPress auto-publishing
- Broad autonomous scraping
- Autonomous AI / background agents

### Client Portal data — must not display

- Raw prompts, crawl archives, workflow runs
- AI costs, provider internals
- Credentials / secrets
- Internal drafts (except client-safe messaging that content is pending)
- Admin notes fields

### Technical — out of scope for UI rulebook implementation

- Backend / API contract changes
- Schema / migrations
- Auth / Turnstile behavior changes
- Package installs without approval
- VPS / deploy / DNS / Caddy / Docker
- Commit/push without explicit owner approval

---

## Related documents

| Document | Role |
|----------|------|
| `UI_UX_EVIDENCE_PACK.md` | Source evidence |
| `UI_UX_P0_IMPLEMENTATION_PLAN.md` | P0 block breakdown |
| `UI_UX_RULEBOOK_TRACEABILITY.md` | Rule → evidence mapping |
| `V0_UI_UX_AUDIT_PACK.md` | External review prompt |
| `docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md` | Approved visual language |
| `AGENTS.md` | Agent safety and gates |

---

*Rulebook v1 — approved for planning only. Implementation requires scoped blocks and owner gate per `AGENTS.md`.*
