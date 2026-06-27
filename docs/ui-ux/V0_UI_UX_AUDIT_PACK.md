# DCA OS Lite — v0.dev UI/UX Audit Pack

**Status:** Draft for external review (v0.dev)
**Branch basis:** `main` @ `8bd3b6a` (post PR #16)
**Purpose:** Prepare owner-operated screenshots and a copy-paste prompt for v0.dev as **design reviewer / prototyper only** — not production code merge source.

---

## 1. Product summary

**DCA OS Lite** is a dark-themed SaaS operations platform for Digital Cube Agency (DCA). Operators use it daily to run client delivery, finance, and AI-assisted content workflows. Production URL (untouched by this pack): `https://system.digitalcubeagency.net`.

### What the product does today

| Area | Role |
|------|------|
| **Admin / operator UI** | Tenant workspace for DCA staff (`owner`, `admin`): clients, projects, tasks, finance, AI Delivery, Market Intelligence, module registry, team, settings. |
| **Client Portal** | Read-only client-safe archive: final deliverables, finalized monthly reports, delivery summaries, optional product catalog inquiry. Same login shell; different mental model. |
| **Client Hub** | Per-client admin operating screen (publication targets, analytics profile, catalog admin, publication log) — opened from Clients list, not a separate hash route. |
| **AI Delivery** | Admin-operated pipeline: MI handoff → brief → content plan → drafts/images → deliverables → monthly report (FINAL). Heavy modal-based workflow on one page. |
| **Market Intelligence** | Admin-only manual research queue; insights → handoffs → AI Delivery. |
| **Finance Lite** | Invoices, recurring invoices, credit notes, services library, bills/vendors. |

### Architecture notes for reviewers

- **Routing:** Hash-based SPA (`#/dashboard`, `#/clients`, etc.) in `apps/web/src/App.tsx` — not React Router file routes.
- **Styling:** Single global `apps/web/src/styles.css` + shared components under `apps/web/src/components/ui/`.
- **Approved long-term direction:** Dark Nebula product UI (`docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md`).
- **This audit's near-term direction:** Dark Nebula-compatible, but **compact, calm, operator-first** — readability and density over decorative spaciousness.

### MVP client context

First live client delivery target: **Puriva** (`puriva.id`). Client Portal must feel polished and safe, not like an unfinished admin panel.

---

## 2. Current UI problem statement

Review lens: a human operator using this **every day** for hours.

| Problem | Evidence / symptom |
|---------|-------------------|
| **Inconsistent page chrome** | Dashboard, Market Intelligence, Client Portal use `PageHeader`; AI Delivery uses manual `section-header`. Eyebrow/title/action placement varies module to module. |
| **Oversized visual blocks** | `MetricCard`, `state-panel`, and glass panels use generous padding and glow; four metric cards on many pages push primary work below the fold. |
| **High vertical scroll** | AI Delivery (`AiDeliveryPage.tsx`, ~5.8k lines) stacks summary metrics, project table, and opens **many full modals** (Brief, Content Plan, Research, Workflow Runs, Deliverables, Images, Monthly Report). Operator path is deep. |
| **Primary vs secondary action noise** | `primary-action` buttons use strong purple gradient; multiple primaries can appear per modal footer. `secondary-action` filter chips compete visually with real CTAs. |
| **Admin vs client boundary blur** | Client Portal renders inside the same `AppLayout` sidebar with full admin nav visible (Clients, Invoices, AI Delivery, etc.). Client users may see admin module labels unless nav is role-filtered later. |
| **Information hierarchy in dense tables** | Finance and ops lists use row action menus (`details.row-action-menu`) but scannability varies; status badges and muted text compete. |
| **Warning / info box fatigue** | `state-panel`, `StatusNotice`, and inline alert blocks repeat on AI Delivery and Client Portal — helpful for safety, visually heavy. |
| **Modal inconsistency** | Mix of shared `Modal`, inline modal footers, and nested `SectionPanel` inside modals; footer button order not always consistent. |
| **Deferred routes still in codebase** | `#/content-plan-review`, `#/content-draft-review` show deferred placeholders — must not be redesigned as active client approval flows. |
| **Settings / Team shells** | Read-only MVP shells with metric cards but limited actionable settings — can feel like empty admin chrome. |

**Not in scope for v0 to fix in production code.** v0 should propose **layout, hierarchy, density, and component patterns** the owner can evaluate before any implementation sprint.

---

## 3. Design principles (target direction for v0)

Use these when proposing mockups:

1. **Compact SaaS admin** — tighter vertical rhythm; smaller cards; more table/list for dense data.
2. **Calm professional UI** — muted button fills; reserve strong accent for one primary action per surface.
3. **Clear typography scale** — page title > section title > label > meta; reduce duplicate eyebrows.
4. **Consistent page header pattern** — title, short description, right-aligned primary action, optional filters below.
5. **Consistent section header pattern** — section title + one-line description + optional inline actions.
6. **Dense but calm panels** — grouped controls; sticky page-level actions where useful (save, publish, finalize).
7. **Subtle status badges** — small, low-saturation; status scannable in tables.
8. **Dark Nebula compatible** — deep navy backgrounds, soft borders, restrained nebula accents — **readable first**.
9. **Client Portal = finished product** — simple, read-only, deliverables-oriented; no admin affordances.
10. **Admin = structured operator console** — workflow/status/admin notes allowed; compact and scannable.

### Tension note (document for v0)

Approved Dark Nebula doc mentions "spacious cards." This audit intentionally prioritizes **operator density and reduced scroll** while keeping Dark Nebula color language. Propose a **practical hybrid**: nebula atmosphere at shell level, compact data surfaces inside.

---

## 4. Page inventory

All routes are hash-based: `http://localhost:5173/#/{view}`.

### 4.1 Authentication

| Hash | Screen | Component | Notes |
|------|--------|-----------|-------|
| `#/login` | Sign In | `LoginScreen` in `App.tsx` | Shown when unauthenticated; Turnstile if `VITE_TURNSTILE_SITE_KEY` set. |

### 4.2 Product / workspace (sidebar section: Product)

| Hash | Label | Component | Access |
|------|-------|-----------|--------|
| `#/dashboard` | Dashboard | `DashboardView` in `App.tsx` | Admin metrics, audit feed, quick links |
| `#/modules` | Modules | `ModuleRegistryView` | Enable/disable tenant modules |
| `#/modules/{key}` | Module detail shell | `ModuleRegistryView` + placeholder panel | Registry sub-view |
| `#/tenants` | Tenants | `TenantView` | Switch tenant membership |

### 4.3 Client (sidebar section: client)

| Hash | Label | Component | Access |
|------|-------|-----------|--------|
| `#/client-portal` | Client Portal | `ClientPortalPage` | **Client-safe read-only** archive |

### 4.4 Core operations (sidebar section: core)

| Hash | Label | Component | Access |
|------|-------|-----------|--------|
| `#/clients` | Clients | `ClientsPage` | Client list + CRUD |
| *(in-page)* | Client Hub | `ClientHubPage` | Opened from Clients; publication, analytics, catalog |
| `#/projects` | Projects | `ProjectsPage` | General projects |
| `#/ai-delivery` | AI Delivery | `AiDeliveryPage` | Full operator workflow |
| `#/ai-market-intelligence` | Market Intelligence | `AiMarketIntelligencePage` | Research projects |
| `#/tasks` | Tasks | `TasksPage` | Task list |
| `#/invoices` | Invoices | `InvoicesPage` | Invoices + recurring |
| `#/credit-notes` | Credit Notes | `CreditNotesPage` | Credit notes |
| `#/invoice-items` | Services Library | `InvoiceItemsPage` | Billable services |
| `#/bills` | Bills | `BillsPage` | Bills + vendors |

### 4.5 Settings (sidebar section: settings)

| Hash | Label | Component | Access |
|------|-------|-----------|--------|
| `#/company-profile` | Company Profile | `CompanyProfilePage` | DCA company identity |
| `#/settings` | Settings | `SettingsView` in `App.tsx` | Read-only shell |
| `#/team` | Team | `TeamView` in `App.tsx` | Member directory |

### 4.6 Deferred / hidden from nav (do not activate in designs)

| Hash | Screen | Status |
|------|--------|--------|
| `#/content-plan-review` | Monthly Content Plan Review | Deferred placeholder |
| `#/content-draft-review` | Content Draft Review | Deferred placeholder |

### 4.7 AI Delivery in-page modals (same hash `#/ai-delivery`)

Capture separately when a project row is expanded:

| Modal title | Purpose |
|-------------|---------|
| Add / Edit AI Delivery | Project create/edit |
| AI Delivery Brief | Brief workflow |
| AI SEO / Content Plan | Content plan + topics |
| Research / Sources | Manual research |
| Market Intelligence Context | MI handoffs |
| Workflow Runs | Workflow run records |
| AI Content Production Foundation | Content drafts |
| Image Production Planning | Article images |
| Deliverables | Packages + reviews |
| Confirm WordPress publish | Publish guard (deferred live publish) |
| Monthly Report panel | `MonthlyReportPanel.tsx` — metrics, PDF, FINAL status |

### 4.8 Shared layout

| Element | File |
|---------|------|
| App shell + sidebar | `apps/web/src/components/AppLayout.tsx` |
| UI primitives | `PageHeader`, `MetricCard`, `SectionPanel`, `StatusBadge`, `ModalActions` |
| States | `EmptyState`, `ErrorState`, `LoadingState`, `Modal` |

---

## 5. Screen-by-screen audit checklist

Use while reviewing screenshots. Score: ✅ good · ⚠️ needs work · ❌ blocker · N/A not shown.

### Global / shell

| # | Check | Admin | Client Portal |
|---|-------|-------|---------------|
| G1 | Sidebar grouping labels are clear (Product / client / core / settings) | | N/A |
| G2 | Active nav state obvious at a glance | | |
| G3 | Tenant + user panel readable without dominating | | |
| G4 | App-wide success/error notices (`StatusNotice`) not oversized | | |
| G5 | Logout easy to find | | |
| G6 | Client users do not see dangerous admin nav items | N/A | |

### Login

| # | Check |
|---|-------|
| L1 | Form fields labeled; focus order logical |
| L2 | Primary sign-in button hierarchy clear |
| L3 | Turnstile block (if present) does not break layout |
| L4 | Error state readable, not alarming |

### Dashboard

| # | Check |
|---|-------|
| D1 | Command metrics useful vs decorative |
| D2 | Audit feed scannable (action, actor, time) |
| D3 | Filter chips distinguishable from actions |
| D4 | Quick actions vs future module pills visually distinct |
| D5 | Page fits above-fold summary without excessive scroll |

### Modules & Tenants

| # | Check |
|---|-------|
| M1 | Module cards dense enough for 10+ modules |
| M2 | Enable/disable vs open module link hierarchy |
| M3 | Read-only notice not louder than content |
| M4 | Tenant switch rows scannable |

### Clients & Client Hub

| # | Check |
|---|-------|
| C1 | Client list table scannable (name, kind, status) |
| C2 | Row actions discoverable but not cluttered |
| C3 | Create/edit client modal form consistent |
| C4 | Client access linking UI clear |
| C5 | Client Hub sections grouped (publication, analytics, catalog, log) |
| C6 | Credential forms feel secure, not exposed |

### Projects & Tasks

| # | Check |
|---|-------|
| P1 | Project ↔ client relationship visible |
| P2 | Archive/filter pattern consistent with other modules |
| T1 | Task due dates and project link visible in list |
| T2 | Empty state actionable |

### Finance (Invoices, Credit Notes, Services, Bills)

| # | Check |
|---|-------|
| F1 | Invoice status badges subtle |
| F2 | Invoice create modal: line items dense but readable |
| F3 | Recurring invoices section distinguishable |
| F4 | Payment registration flow clear |
| F5 | Credit note linkage to invoice obvious |
| F6 | Services library active vs archived clear |
| F7 | Bills: vendor vs bill actions separated |
| F8 | Document upload affordances clear |

### AI Delivery

| # | Check |
|---|-------|
| A1 | Operator summary explains path without wall of text |
| A2 | Project table is primary surface (not buried under metrics) |
| A3 | Row action menu groups logical (Planning / Packaging / Reports) |
| A4 | Each modal: one primary action, muted secondaries |
| A5 | Brief → plan → draft → deliverable progression understandable |
| A6 | Monthly report FINAL workflow obvious |
| A7 | MI handoff context not confused with client-visible data |
| A8 | Workflow runs / research labeled as internal |
| A9 | Error states in modals don't destroy layout |
| A10 | Vertical scroll acceptable per modal |

### Market Intelligence

| # | Check |
|---|-------|
| MI1 | Project queue + detail split pane balanced |
| MI2 | Insight status → handoff → AI Delivery path clear |
| MI3 | No implication of live autonomous crawling |
| MI4 | Source/manual research UI compact |

### Client Portal

| # | Check |
|---|-------|
| CP1 | Feels read-only — no edit/publish/approve buttons |
| CP2 | No drafts, prompts, costs, credentials visible |
| CP3 | Project archive sidebar + detail pane clear |
| CP4 | Deliverables list: final statuses only |
| CP5 | Monthly reports: FINAL only; download obvious |
| CP6 | Catalog inquiry form simple; no checkout |
| CP7 | Empty archive state reassuring, not broken |
| CP8 | Distinct from admin AI Delivery visually |

### Settings / Team / Company Profile

| # | Check |
|---|-------|
| S1 | Read-only boundaries obvious |
| S2 | Team member table scannable |
| S3 | Company profile form fields grouped logically |

### Cross-cutting

| # | Check |
|---|-------|
| X1 | Modal header/footer pattern consistent |
| X2 | Empty states helpful, compact |
| X3 | Loading states not full-page unless necessary |
| X4 | Disabled buttons visually distinct |
| X5 | Tables readable at 1440px and 1280px width |
| X6 | Color not used as sole status indicator |

---

## 6. Screenshot list

Full capture checklist: **`docs/ui-ux/V0_SCREENSHOT_CHECKLIST.md`**.

Recommended output folder (owner-created, not committed):

```text
docs/ui-ux/screenshots/v0-audit/
```

Naming: `{module}-{screen}-{state}.png` (e.g. `ai-delivery-project-list-active.png`).

---

## 7. Screenshot capture plan

**Manual capture only** on this branch — no screenshot scripts, token injection, or automated authenticated capture.

### 1. Start local stack (owner-run, external terminals)

```powershell
# Terminal 1 — API
cd C:\dcaosv1
npm.cmd run dev:api

# Terminal 2 — Web
cd C:\dcaosv1
npm.cmd run dev:web
```

### 2. Open localhost and sign in normally

- URL: `http://localhost:5173`
- Admin: `admin@dca.local`
- Password: `$env:AUTH_SEED_TEST_PASSWORD` (set locally only; never commit)
- If Turnstile blocks local login, capture the login screen only and note the blocker in findings.

### 3. Capture with Win+Shift+S

1. Resize the browser to **1440×900** (primary) or **1280×800** (secondary density check).
2. Navigate to each route or modal listed in `V0_SCREENSHOT_CHECKLIST.md`.
3. Press **Win+Shift+S**, select the window or region, and save the image.
4. Save files under `docs/ui-ux/screenshots/v0-audit/` using `{module}-{screen}-{state}.png`.
5. **Do not commit screenshots** unless explicitly approved.

### Capture tips

- Capture **empty**, **populated**, and **error** states where seed data allows.
- For AI Delivery modals: select one seeded project → open each modal from the row menu → screenshot.
- For Client Portal: use a client-linked user if available; otherwise admin view still shows layout (note in findings).
- Modals and in-page overlays (Client Hub, Monthly Report panel) always require manual navigation before capture.

---

## 8. v0.dev prompt (copy-paste)

Use the block below as the **initial message** in v0.dev. Attach screenshots from the checklist.

```text
You are a senior SaaS product designer reviewing DCA OS Lite — an internal operations platform for a digital agency. You are NOT writing production code for merge. Produce design critique, wireframe-level layout recommendations, and optional high-fidelity mockup directions only.

## Product
DCA OS Lite helps agency operators manage:
- Clients (one client per domain), projects, tasks
- Finance Lite: invoices, recurring invoices, credit notes, services library, bills/vendors
- AI Delivery: admin-operated content pipeline (Market Intelligence handoff → brief → content plan → drafts/images → deliverables → FINAL monthly report)
- Market Intelligence: manual admin research queue
- Client Portal: read-only client-safe archive of final deliverables and finalized monthly reports

Stack context: React + Vite SPA, hash routing (#/dashboard, #/clients, etc.), single dark global CSS, shared components (PageHeader, MetricCard, SectionPanel, StatusBadge).

## Your task
Review the attached screenshots and recommend UI/UX improvements for:
1. Daily operator efficiency (less scroll, clearer hierarchy, faster scanning)
2. Compact calm SaaS admin — muted buttons, smaller cards, tighter spacing
3. Clear separation: admin operator UI vs client read-only portal
4. AI Delivery workflow clarity (dense operator console, not consumer app)
5. Finance list/modal consistency
6. Client Portal that feels polished, simple, final-deliverables oriented

## Design direction
- Compact readable SaaS admin dashboard
- Calm professional UI; muted/dimmed primary buttons (not flashy purple CTAs everywhere)
- Clear typography scale; consistent page header and section header patterns
- Tables/lists for dense data instead of oversized cards where appropriate
- Subtle status badges
- Dark Nebula compatible (deep navy, soft borders, restrained accents) but READABLE FIRST
- Sticky page-level actions where useful
- Fewer giant warning/info panels — use inline micro-copy where possible

## Hard constraints — DO NOT propose as active UI
These features are DEFERRED and must NOT appear as working UI:
- Public magic links
- Public approval links
- Client approval buttons
- Client request-changes actions
- Client comments
- Client-triggered publishing
- Live Google OAuth
- Live GA/GSC sync
- Live Stripe/payment collection
- Live WordPress auto-publishing
- Broad autonomous scraping
- Autonomous AI/background agents
- Raw prompts visible to client
- Raw crawl/source archives visible to client
- AI costs visible to client
- Credentials/secrets visible anywhere

## Client Portal rules (read-only, client-safe)
Show ONLY:
- Final deliverables
- Final monthly reports
- Published/export references when final
- Client-safe delivery summaries
- Optional product catalog inquiry (no checkout)

NEVER show clients:
- Internal drafts, prompts, workflow runs, raw research internals
- Admin notes, cost/provider data, approval actions

## Admin UI rules
May show workflow status, admin notes, internal QA — but must be compact, structured, scannable.

## Deliverables I want from you
1. Executive summary: top 5 UX issues hurting daily operations
2. Screen-by-screen critique mapped to my screenshots (reference filename)
3. Proposed design system adjustments (spacing scale, button variants, table density, badge style)
4. Recommended page header / section header pattern (one canonical pattern)
5. Client Portal vs Admin shell differentiation proposal (nav, density, tone)
6. AI Delivery operator flow diagram (simplified) with suggested layout per step
7. Priority ranked redesign backlog: P0 (before first client dry run), P1, P2
8. Optional: 1–2 high-fidelity mock screens for Dashboard and Client Portal only

Do not generate React/Next.js production code unless I explicitly ask. Focus on design review and layout recommendations.
```

---

## 9. Constraints / forbidden changes

v0 and any follow-up implementation must **not** assume or design for:

| Category | Rule |
|----------|------|
| Backend / API | No contract changes |
| Database | No schema changes |
| Auth / Turnstile | No behavior changes |
| Client Portal data | Read-only boundary preserved |
| Deferred features | Listed in §8 — not active UI |
| Production deploy | Out of scope |
| Secrets | Never displayed in UI mockups |

Implementation agents must read `AGENTS.md` and `docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md` before any frontend sprint.

---

## 10. Expected v0 deliverables

| # | Deliverable | Format |
|---|-------------|--------|
| 1 | Executive UX summary | Short prose |
| 2 | Screen-by-screen critique | References screenshot filenames |
| 3 | Design system tuning | Spacing, type, buttons, badges, tables |
| 4 | Canonical header patterns | Admin + portal variants |
| 5 | Admin vs portal differentiation | Nav / layout / tone |
| 6 | AI Delivery flow layout map | Step-by-step operator path |
| 7 | Prioritized backlog | P0 / P1 / P2 |
| 8 | Optional mockups | Dashboard + Client Portal |

Paste v0 responses into `docs/ui-ux/V0_AUDIT_FINDINGS_TEMPLATE.md` for tracking.

---

## 11. Related repo docs

| Doc | Relevance |
|-----|-----------|
| `docs/ui/DARK_NEBULA_PRODUCT_UI_DIRECTION.md` | Approved visual language |
| `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md` | Client / portal / domain model |
| `AGENTS.md` | Agent safety and validation rules |
| `docs/ui-ux/V0_SCREENSHOT_CHECKLIST.md` | Capture checklist |
| `docs/ui-ux/V0_AUDIT_FINDINGS_TEMPLATE.md` | Findings paste template |

---

*This pack is documentation only. No production UI changes are implied.*
