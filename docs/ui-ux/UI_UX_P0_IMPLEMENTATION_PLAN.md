# DCA OS Lite — UI/UX P0 Implementation Plan

**Status:** Future implementation plan only — **no code in this document**
**Authority:** `UI_UX_RULEBOOK_V1.md` §G P0 lane
**Gate:** Each block requires separate owner approval before coding, validation, commit, and push per `AGENTS.md`

---

## P0 objective

Smallest safe frontend changes before **first client dry run** (Puriva / Client Portal). CSS and presentation only unless noted; no backend, schema, or auth changes.

**Global validation (every block):**

```powershell
cd C:\dcaosv1
npm run -w @dca-os-v1/web check
npm run -w @dca-os-v1/web build
```

**Manual QA:** Browser at `http://localhost:5173` (owner-run API/Web). Post-login QA if local auth works; otherwise report blocker per `AGENTS.md`.

**Commit/push:** Not authorized by this plan. Owner approves commit and push separately after each block passes validation.

---

## P0-1: Compact CSS token / class foundation + invoice field grid

### Scope

- Consolidate or document single authoritative token block in `styles.css` (remove dead duplicate button rules where safe)
- Implement `.filter-chip` standalone styles (28px, distinct from `.secondary-action`)
- Implement `.section-panel-compact` for `SectionPanel` `tone="compact"`
- Shrink default form field height in dense contexts (38–40px)
- Compact `.field-grid` in invoice create/edit modals — plain labels, reduced gap
- Muted `.primary-action` enforcement (ensure dense block wins in cascade)

### Files likely touched

| File | Change type |
|------|-------------|
| `apps/web/src/styles.css` | CSS tokens, filter-chip, section-panel-compact, field grid |
| `apps/web/src/components/ui/SectionPanel.tsx` | Verify compact class applied (no logic change) |
| `apps/web/src/pages/invoices/InvoicesPage.tsx` | Field grid markup/classes in invoice modal only |

### Explicitly excluded

- Invoice list → table conversion (P1)
- `InvoicesPage` card list layout
- Backend, API, payment logic
- Other finance pages (credit notes, bills)
- New npm packages

### Validation required

- `check` + `build` pass
- Manual: open invoice create modal — fields compact, labels readable
- `git diff --check`
- No unrelated module visual regressions (spot-check Clients toolbar)

### Model recommendation

**Haiku / low-cost sufficient** — CSS + invoice modal markup only.

### Stop conditions

- Build fails for unrelated reasons
- CSS cascade breaks login or shell layout
- Scope expands to full invoice table rewrite

---

## P0-2: Client Portal visual cleanup + slug-safe display review

### Scope

- Portal-specific CSS: `.portal-project-list` / flatter rows, secondary select state (not primary for View/Open)
- Reduce metric cards above fold (target ≤2 or move to header meta)
- Client-safe status labels — map or hide `DRAFT` / internal enums in `ClientPortalPage` display layer (**display mapping only**, no API change)
- Review UI copy for internal slugs, raw IDs, "admin" in client-visible headings
- Optional: `portal-shell` class on main content (visual only if nav filter deferred)

### Files likely touched

| File | Change type |
|------|-------------|
| `apps/web/src/pages/client-portal/ClientPortalPage.tsx` | Status display mapping, class names, metric reduction |
| `apps/web/src/styles.css` | Portal list variants |
| `apps/web/src/components/AppLayout.tsx` | **Only if** approved visual nav reduction without auth logic — otherwise CSS-only mask DEFER |

### Explicitly excluded

- API response filtering changes
- Auth / role-based nav (unless owner explicitly approves frontend-only hide)
- New client actions (approval, comments)
- Client Portal data model changes
- AI Delivery, admin modules

### Validation required

- `check` + `build`
- Manual: Portal archive, deliverables, monthly report detail — no DRAFT badge, no admin nav emphasis (document if nav unchanged)
- Compare against Rulebook §E boundary checklist

### Model recommendation

**Haiku sufficient** for CSS + display mapping. **Escalate** if role-based nav requires `App.tsx` auth context changes.

### Stop conditions

- Backend/API change appears necessary for safe status labels
- Auth behavior affected
- Scope expands to full portal shell rewrite

---

## P0-3: Projects compact list / table direction

### Scope

- Migrate `ProjectsPage` to `PageHeader`
- Remove or shrink cross-links `SectionPanel` to header quick links
- Tighten dense-row: dedupe client/status fields (show once)
- **Directional:** optional simple table wrapper if project count supports it — if risky, dense-list shrink only for P0
- Align filter chips with P0-1 filter-chip CSS

### Files likely touched

| File | Change type |
|------|-------------|
| `apps/web/src/pages/projects/ProjectsPage.tsx` | Header, list layout, field dedup |
| `apps/web/src/styles.css` | Shared classes only if not done in P0-1 |

### Explicitly excluded

- Projects API, task linking logic
- Full table component extraction (defer to P1 if complex)
- Tasks page, Clients page

### Validation required

- `check` + `build`
- Manual: Projects list at 1440px — scannable, filters distinct from Add Project

### Model recommendation

**Haiku sufficient** for dense-list shrink + PageHeader. **Medium model** if introducing shared DataTable component.

### Stop conditions

- Shared component scope pulls in Tasks/Clients in same block
- Build/lint failures in unrelated files

---

## P0-4: AI Delivery action hierarchy + workflow text reduction

### Scope

- Replace manual `section-header` with `PageHeader` on `AiDeliveryPage`
- Collapse Operator summary `SectionPanel` default **collapsed** (or reduce to 2–4 metrics max)
- Shorten muted explainer paragraph under header (or move to collapsible help)
- Modal footers: audit for multiple primaries — reduce to one per footer (markup/class only)
- Reduce inline `state-panel` info blocks inside modals where redundant (text edits)

### Files likely touched

| File | Change type |
|------|-------------|
| `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` | Header, summary collapse, copy, button classes |

### Explicitly excluded

- Modal → side-sheet refactor
- Workflow logic, API calls, state machine
- `MonthlyReportPanel.tsx` structural changes (copy OK if in modal path)
- New modals or routes
- File split / 5800-line refactor

### Validation required

- `check` + `build`
- Manual: AI Delivery list visible without excessive scroll; open Brief + Deliverables modal — one primary each

### Model recommendation

**Medium model recommended** — large file, easy to break unrelated modal state. Haiku only for copy-only pass with strict file limits.

### Stop conditions

- Any workflow behavior change detected
- Scope expands to MonthlyReportPanel rewrite
- Test/build failures in AI Delivery handlers

---

## P0-5: Dashboard header / KPI cleanup

### Scope

- `DashboardView` in `App.tsx`: verify PageHeader description length
- Reduce metric grid if audit feed not above fold (target 2–4 per rulebook)
- Quick action grid: secondary styling; demote future module pills
- Audit feed SectionPanel: compact tone once P0-1 CSS exists

### Files likely touched

| File | Change type |
|------|-------------|
| `apps/web/src/App.tsx` | `DashboardView` only |

### Explicitly excluded

- Dashboard API / audit log fetching
- Other views in App.tsx
- New dashboard widgets

### Validation required

- `check` + `build`
- Manual: Dashboard at 1440×900 — audit feed visible without excessive scroll

### Model recommendation

**Haiku sufficient** — isolated DashboardView section.

### Stop conditions

- Changes spill into auth, loading, or tenant logic in App.tsx

---

## Recommended execution order

```
P0-1 (CSS foundation)
  → P0-5 (Dashboard — uses new tokens)
  → P0-3 (Projects — uses PageHeader + chips)
  → P0-2 (Portal — uses portal CSS + chips)
  → P0-4 (AI Delivery — largest file last)
```

One block per agent session. No combined P0 mega-PR without owner approval.

---

## P0 exit criteria (planning)

- [ ] All five blocks completed and validated individually
- [ ] Rulebook §E Portal boundary checklist manually verified
- [ ] No backend/schema/auth commits in P0 branches
- [ ] Owner approves commit per block
- [ ] Screenshots for v0 comparison updated manually (optional, not committed)

---

## After P0

Proceed to **P1** per Rulebook §G: finance tables, PageHeader on remaining core modules, Modal sizing, Clients toolbar.

---

*Plan only. No implementation authorized until owner scopes and approves each block.*
