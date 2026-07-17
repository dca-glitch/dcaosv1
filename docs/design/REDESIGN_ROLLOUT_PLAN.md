> **Superseded historical rollout plan.** This plan describes an earlier redesign track. Current UI authority is [`docs/ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](../ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md).

# DCA OS Lite — Redesign Rollout Plan

Version 1.0 · July 2026  
13 phases · Sequential dependency order

---

## Overview

This plan defines the exact redesign sequence for all existing DCA OS Lite product areas. The goal is to apply the approved premium dark SaaS design system (documented in [DESIGN_SYSTEM_SPEC.md](./DESIGN_SYSTEM_SPEC.md)) across the entire product while preserving all current functionality, routes, data, permissions, and business logic.

**Three approved reference standards govern all implementation:**
- Agency Operations Dashboard (admin density)
- AI Delivery Dashboard (delivery workflow)
- Client Portal Dashboard (client surface)

**Two approved modal patterns:**
- AI Run Review Modal
- Deliverable Approval Modal

Do not redesign these references during rollout. Use them as fixed visual targets.

---

## Phase Sequence

```
Phase 1   Design System Foundation            [Reference — locked]
Phase 2   Global Application Shell            [Design Ready]
Phase 3   Agency Operations Dashboard         [Reference — locked]
Phase 4   AI Delivery Workflow                [Reference — locked]
Phase 5   Shared Operational Patterns         [Design Ready]
Phase 6   Client Portal                       [Reference — locked]
Phase 7   Monthly Reports                     [Queued]
Phase 8   Client & Project Management         [Queued]
Phase 9   AI Operations Console               [Queued]
Phase 10  Finance Lite                        [Queued]
Phase 11  Admin & Settings                    [Queued]
Phase 12  Secondary Modules                   [Queued]
Phase 13  Responsive & Accessibility Pass     [Queued]
```

---

## Phase 1 — Design System Foundation

**Surface:** Admin + Client  
**Effort:** M  
**Status:** Reference — locked

### Screens and Components
- Design System reference page (approved)
- Token manifest (CSS custom properties)
- All component primitives: StatusBadge, StatusDot, buttons, inputs, KPI tiles, tables, timeline items, activity items, modal shells, side sheet shells, toasts, skeletons, empty states, error states

### Dependencies
- None — this is the foundation for all subsequent phases.

### What Must Be Preserved
- Tailwind v4 config and CSS custom property contract
- Google Fonts imports
- No routes or business logic at this phase

### UX Goals
- One source of truth for every visual decision
- All 13 status keys derive color from a single STATUS map
- All interactive states documented before any screen is built
- Admin and client density variants defined before Phase 2

### Design System Elements
- All tokens (A, L, T constants)
- panelCSS() helper
- All component patterns

### Risks
- **Low:** CSS custom property naming conflict — read `theme.css` before writing
- **Med:** Component drift if screens are built before tokens are locked — freeze token names first

### Acceptance Criteria
- All 13 status keys render correct color/bg/border from STATUS map
- Focus ring visible at 3:1 contrast minimum
- Skeleton, empty, error states defined for every major component
- Admin vs client density rules agreed and documented

### Recommended Order
1. Lock color tokens and status system
2. Typography scale and font loading
3. Surface elevation and border system
4. Button and input primitives
5. Badge, dot, tag variants
6. Card and panel shells
7. Table, timeline, activity patterns
8. Modal and side sheet shells
9. State definitions (loading, empty, error, success)
10. Design System reference page — final spec

---

## Phase 2 — Global Application Shell

**Surface:** Admin + Client  
**Effort:** M  
**Status:** Design Ready

### Screens and Components
- Admin shell layout (sidebar + topbar + page container)
- Client portal shell (simplified sidebar + topbar)
- Global search overlay
- Notification center panel
- Client / workspace switcher
- Page header component (title + breadcrumbs + actions)
- 404 and access-denied screens

### Dependencies
- Phase 1 complete and tokens locked

### What Must Be Preserved
- All existing hash-based routes (`#/view-name`)
- Current nav section groupings (Operations, Content, Client)
- Authentication and session state
- Permission-based nav visibility

### UX Goals
- Sidebar: 220px fixed, never collapses on desktop admin
- Active nav: indigo 10% bg, `#A5B4FC` text, no left border accent
- Topbar: 52px fixed, `backdrop-blur(10px)`, 92% opacity background
- Client shell: same primitives, reduced nav depth

### Risks
- **Med:** Responsive sidebar collapse — define breakpoint behavior early
- **Low:** Route changes during nav refactor — preserve all hashes exactly

### Acceptance Criteria
- All existing routes accessible after shell replacement
- Active nav state correct on every route
- Client portal shell shows only client-safe nav items
- No permission regressions

### Recommended Order
1. Admin sidebar (static)
2. Topbar (static)
3. Page layout shell
4. Wire active nav state to routes
5. Client portal shell variant
6. Notification panel
7. Client/workspace switcher
8. Global search overlay (UI only)
9. 404 and access-denied screens

---

## Phase 3 — Agency Operations Dashboard

**Surface:** Admin only  
**Effort:** M  
**Status:** Reference — locked (approved screen)

### What to Wire
- MetricTile with RingMeter (label → helper → ring)
- Workflow tab strip (Ready Now / In Review / Blocked)
- Deliverable cards with status badge, priority dot, due date
- Agency health summary
- Activity feed (admin variant — full stage names)
- Continue button (titanium treatment)

### Dependencies
- Phase 1, Phase 2
- Existing `AdminDailyOperationsCockpit.tsx` data and API contracts

### What Must Be Preserved
- All data fetching and API endpoints (unchanged)
- Tab routing logic
- Deliverable status update actions
- Client and project associations

### Risks
- **Low:** Visual regression — use approved screen as direct reference
- **Med:** API contract changes — preserve all data shapes exactly

### Acceptance Criteria
- All three tab states render correct deliverables
- RingMeter values match live data
- Status badges match STATUS map in all cases
- No visual difference from approved reference at 1440px

---

## Phase 4 — AI Delivery Workflow

**Surface:** Admin only  
**Effort:** XL  
**Status:** Reference — locked (approved screen + modal)

### Screens
AI Delivery Dashboard, Projects list, Project detail, Brief form, Research view, Content Plan view, Content Draft view, Internal review, Image approval, Deliverable detail, Workflow history, AI Run Review modal

### Dependencies
- Phase 1, 2, 3
- Existing workflow engine API contracts
- Existing AI provider integrations (read-only in UI)

### What Must Be Preserved
- All workflow stage transitions and business rules
- AI run trigger and polling logic
- Content draft versioning
- Image approval flow
- All API endpoints and data shapes

### Critical Risk
- **High:** UI must not alter stage transition logic — pure view layer replacement only
- **Med:** AI run polling and real-time log streaming — preserve existing mechanism
- **Med:** Image approval state — ensure it persists after modal close

### Acceptance Criteria
- All 10 pipeline stages reflect live data
- AI Run Review modal loads run data without refetch on tab switch
- Log output streams in real-time (polling interval preserved)
- No regressions in workflow stage transitions

### Recommended Order
1. AI Delivery Dashboard (wire to existing data)
2. Deliverable detail view
3. AI Run Review modal (reuse approved — wire to run data)
4. Projects list and detail
5. Brief form and view
6. Content plan and draft views
7. Internal review screen
8. Image approval screen
9. Workflow history and run log
10. Research view

---

## Phase 5 — Shared Operational Patterns

**Surface:** Admin only  
**Effort:** M  
**Status:** Design Ready

### Components
Global action queue, bulk action toolbar, filter side sheet, active filter pills, sort controls, multi-page pagination, approval multi-step flow, activity feed (standalone), status summary bar, export button

### Dependencies
- Phase 1, 2, 4 (action queue pattern established)

### What Must Be Preserved
- Filter parameter names and API query contracts
- Pagination page size and offset logic
- Bulk action permission checks
- Export file generation logic

### Risks
- **Med:** Filter side sheet z-index conflicts with modal stack
- **Low:** Bulk action confirmation — use inline toast, not modal

### Acceptance Criteria
- Filter state reflected in URL params without page reload
- Bulk selection persists across sort changes
- Export triggers correct backend endpoint
- Filter side sheet closes on Escape

---

## Phase 6 — Client Portal

**Surface:** Client only  
**Effort:** L  
**Status:** Reference — locked (approved screen + modal)

### Screens
Client Portal Dashboard, Approvals list, Deliverable detail (client), Final assets library, Monthly reports archive, Notification centre (client), 404 and access-denied

### Dependencies
- Phase 1, 2, 4, 5
- Client authentication and permission layer

### What Must Be Preserved
- Client authentication and session isolation
- **Permission boundary: clients must never see admin metadata, job IDs, token counts, internal notes, or raw AI output**
- Deliverable file URLs and download logic
- Approval submission endpoint
- Report PDF delivery

### Critical Risk
- **High:** Data leakage — enforce at data layer, not just UI layer
- **Med:** Approval checklist state — must reset per deliverable

### Acceptance Criteria
- Client cannot access any admin route or view any admin-only field
- Required Attention shows only client-safe stage labels
- Approval checklist gates Approve button
- Notification panel shows no internal events
- No visual difference from approved Client Portal reference at 1440px

---

## Phase 7 — Monthly Reports

**Surface:** Admin + Client  
**Effort:** L  
**Status:** Queued

### Screens
Report generation (admin), Report draft preview and editor (admin), Internal review (admin), Approval submission, Report client view, PDF export, Reports archive (admin and client)

### Dependencies
- Phase 1, 2, 4, 6
- Metrics data source (GA4, Search Console, or internal aggregation)

### What Must Be Preserved
- Report generation and data aggregation logic
- Report versioning (draft → v1.0 → approved)
- PDF generation service
- Historical report archive

### Critical Risk
- **High:** Metrics data freshness — always show data period and last-updated timestamp
- **Med:** PDF fidelity — web preview and PDF must be visually consistent

### Acceptance Criteria
- Report generation produces draft with correct period and client
- Admin can edit sections without altering metrics data
- Report approval triggers client notification
- PDF export completes within 30 seconds

---

## Phase 8 — Client & Project Management

**Surface:** Admin only  
**Effort:** L  
**Status:** Queued

### Screens
Clients list, Client detail, Projects list, Project detail, Project brief, New client form, New project form, Archive and restore flows, Access management

### Dependencies
- Phase 1, 2, 4
- Existing client and project schema — do not alter

### What Must Be Preserved
- Client and project database schema and all foreign keys
- Owner and access permission model
- Project brief field structure
- Archive and soft-delete logic
- Restore eligibility rules

### Critical Risk
- **Med:** Archive flow — if deliverables are active, must block or warn clearly

### Acceptance Criteria
- Client list health indicators reflect live project and deliverable status
- Archive confirms impact and requires explicit confirmation
- Restore shows what will be re-activated before confirming
- Access changes take effect immediately

---

## Phase 9 — AI Operations Console

**Surface:** Admin only  
**Effort:** L  
**Status:** Queued

### Screens
AI runs table, Run detail, AI Run Review modal (reuse from Phase 4), Error log, Context usage analytics, Export

### Dependencies
- Phase 1, 2, 4 (modal), 5 (filter/table patterns)
- AI provider run log API

### What Must Be Preserved
- Run log data structure and all fields
- AI provider API keys (server-side only — never in UI)
- Run retry and cancellation logic
- Token usage aggregation

### Critical Risk
- **High:** API key security — no key may be rendered or logged in any UI component
- **Med:** Large datasets — implement server-side pagination

### Acceptance Criteria
- Runs table paginates server-side
- AI Run Review modal opens without page navigation
- No API keys visible at any point
- Export produces correct CSV

---

## Phase 10 — Finance Lite

**Surface:** Admin only  
**Effort:** XL  
**Status:** Queued

### Screens
Finance dashboard, Vendors, Services, Bills, Invoices, Invoice creation, Recurring invoices, Credit notes, Financial summary

### Dependencies
- Phase 1, 2, 5, 8
- Existing finance data model — do not alter schema

### What Must Be Preserved
- All financial data schema and calculation logic
- Invoice numbering and sequence logic
- Recurring invoice trigger and generation
- Credit note application rules
- PDF generation for invoices
- Tax calculation rules

### Critical Risk
- **High:** Financial data accuracy — no UI change may affect calculation, rounding, or tax logic
- **Med:** PDF invoice generation must remain pixel-accurate

### Acceptance Criteria
- All financial totals match existing system calculations exactly
- Overdue invoices show coral due date, not coral row background
- Invoice PDF matches web preview layout
- Credit note correctly reduces outstanding balance

---

## Phase 11 — Admin & Settings

**Surface:** Admin only  
**Effort:** M  
**Status:** Queued

### Screens
Settings shell (sub-nav), Users and roles, Permissions matrix, Integrations, Notification preferences, AI policies, Storage settings, Audit log

### Dependencies
- Phase 1, 2, all prior phases (settings affect all areas)
- Authentication provider integration

### What Must Be Preserved
- Authentication and session management
- Role-based access control rules and enforcement
- AI provider API key storage (server-side only)
- Integration OAuth flows
- Audit log write logic

### Critical Risk
- **High:** API key handling — integration config must pass keys to server only
- **Med:** Permissions matrix — changes must require explicit save, not auto-save

### Acceptance Criteria
- API keys never rendered in any settings field
- Permissions matrix changes require explicit save confirmation
- Integration OAuth flow completes and reflects connected status
- Audit log filters correctly by actor and action type

---

## Phase 12 — Secondary Modules

**Surface:** Admin only  
**Effort:** XL  
**Status:** Queued

### Screens
Market Intelligence dashboard, Keyword and topic research, Competitor tracking, Revenue Hub dashboard, Revenue reporting, POD AI Toolkit console, Prompt library, Module index

### Dependencies
- Phase 1, 2, 9, 10
- External data sources (keyword APIs, analytics, revenue data)

### What Must Be Preserved
- All external API integrations and data contracts
- Existing prompt library content and versioning
- POD toolkit run logic and output handling

### Risk
- **Med:** External API rate limits — each module needs a clear last-updated indicator
- **Med:** Module scope creep — defer any new visual pattern to Phase 13

### Acceptance Criteria
- No new color tokens or component patterns introduced in this phase
- All modules render correctly within Phase 2 shell
- External data sources show last-updated timestamp
- POD toolkit output review reuses AI Run Review modal without modification

---

## Phase 13 — Responsive & Accessibility Pass

**Surface:** Admin + Client  
**Effort:** M  
**Status:** Queued

### Scope
All screens at 1280px, 1440px, 1920px. Full keyboard navigation. Screen reader audit. Focus trap verification. Legacy cleanup.

### Dependencies
- All prior phases complete

### What Must Be Preserved
- All functionality — this phase is UI and accessibility only
- No data, API, or business logic changes

### Acceptance Criteria
- All screens pass WCAG AA color contrast
- All interactive elements keyboard-accessible with visible focus ring
- All modals and side sheets trap focus and restore on close
- No unused CSS tokens remain in `theme.css`
- Screen reader announces all status badges and KPI values correctly
- No JavaScript errors in console on any route

### Recommended Order
1. Focus ring audit across all components
2. ARIA label pass (icons, buttons, inputs)
3. Modal and side sheet focus trap verification
4. Color contrast audit and fixes
5. Responsive layout at 1280px
6. Responsive table horizontal scroll
7. Keyboard shortcut documentation
8. Legacy CSS and token cleanup
9. Skip-to-content link
10. Final cross-browser smoke test
