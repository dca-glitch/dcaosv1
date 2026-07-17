> **Historical extraction notes.** This file records earlier Dark Nebula-era UI analysis and is not current implementation authority.

# DCA OS Lite — UI/UX Rule Extraction Notes (DRAFT ONLY)

**Status:** Draft — not approved for implementation
**Source:** Repo inspection on `feature/uiux-evidence-pack`
**Companion:** `UI_UX_EVIDENCE_PACK.md`, `UI_UX_ELEMENT_RULE_MATRIX.md`, `UI_UX_RAW_PATTERN_INVENTORY.json`

---

## Purpose

These are **candidate universal rules** extrapolated from evidence. They are starting points for an owner-approved design system spec — not production requirements until explicitly signed off.

Each rule is marked **DRAFT** and maps to a flag: KEEP · SHRINK · REPLACE · SPLIT · DEFER.

---

## Top candidate universal rules

### 1. Single page header contract (REPLACE — P0)

**Evidence:** `PageHeader` used on ~9 surfaces; manual `.section-header` on ~7 core modules including AI Delivery and all finance lists.

**Draft rule:** Every authenticated screen uses `PageHeader` with: eyebrow (optional), title, description (≤120 chars), right-aligned primary action, filters on row below.

**Exception (module):** AI Delivery may add collapsible operator strip below header.

---

### 2. Metric card budget (SHRINK — P0)

**Evidence:** Dashboard 4 cards; Client Portal 4; AI Delivery Operator summary 9 inside one SectionPanel; Settings/Team 3 each.

**Draft rule:** Default max **2** metric cards above fold. Additional stats move to inline header meta or collapsible summary. Dashboard may keep 4 only if audit feed remains above fold on 1440px.

---

### 3. Primary action discipline (SHRINK — P0)

**Evidence:** `primary-action` on filter-adjacent controls; Portal project "Open/View"; multiple primaries in modal footers.

**Draft rule:** Exactly **one** `primary-action` per horizontal action group. Selection states use `secondary-action` or new `select-action` variant — not primary.

---

### 4. Filter chip separation (REPLACE — P0)

**Evidence:** `.filter-chip` shares `.secondary-action` styling (32px, same border weight).

**Draft rule:** Introduce `.filter-chip` standalone styles — smaller (28px), no hover lift, distinct from buttons. Never place filter bar adjacent to primary without visual separator.

---

### 5. Table vs dense-list decision (REPLACE — P1)

**Evidence:** Only Team + Monthly Report metrics use `.table-wrap`. Finance renders invoices as card stacks (`InvoiceCards`).

**Draft rule:**

| Condition | Pattern |
|-----------|---------|
| ≥10 homogeneous rows, compare columns | `table-wrap` |
| Workflow row with grouped actions | `dense-list` |
| Client Portal deliverables | `dense-list` or document list (portal variant) |
| Mobile `<640px` | dense-list fallback allowed |

Reference implementation: `TeamView` table in `App.tsx`.

---

### 6. Admin vs portal shell split (SPLIT — P0)

**Evidence:** `ClientPortalPage` renders inside same `AppLayout` with Clients, Invoices, AI Delivery in sidebar.

**Draft rule:** Portal users get reduced nav (Portal + account/logout only) and softer density. Visual-only fork acceptable P0; role-filtered nav may need permission wiring (flag boundary risk).

---

### 7. CSS token consolidation (REPLACE — P1)

**Evidence:** Three `:root` blocks; early gradient primary buttons superseded by dense block at file end.

**Draft rule:** One `:root` source of truth. Remove dead overrides. Document spacing scale: 4 / 8 / 12 / 16 / 20 / 24.

---

### 8. Section panel compact mode (SHRINK — P1)

**Evidence:** `SectionPanel` accepts `tone="compact"` but no `.section-panel-compact` in CSS — used heavily in Client Portal and MI.

**Draft rule:** Implement compact: padding 12px, gap 10px, h2 0.95rem. Default panel padding reduced from 20px → 16px.

---

### 9. Modal standards (SHRINK — P1)

**Evidence:** `Modal.tsx` hardcodes eyebrow "Edit"; max-width 980px; radius 30px.

**Draft rule:** Props: `eyebrow`, `size: sm|md|lg`. Footer: Cancel (secondary) left or right consistent; one primary. Nested SectionPanels discouraged — use tabs or accordion inside modal.

---

### 10. State panel sizing (SHRINK — P1)

**Evidence:** `EmptyState` uses orb + 20px padding + h3; repeats inside already-large SectionPanels.

**Draft rule:** Two tiers: **inline-empty** (text only, inside panels) and **page-empty** (orb allowed). Error banners ≤48px height when inline.

---

### 11. Client-safe status vocabulary (SPLIT — P0)

**Evidence:** Portal shows `contentPlanStatus ?? "DRAFT"` via StatusBadge.

**Draft rule:** Portal uses separate `ClientStatusBadge` or mapping layer — never expose DRAFT, ADMIN_REVIEW, internal workflow enums to clients.

---

### 12. Keep dense-record row (KEEP — P0)

**Evidence:** `.dense-record` at 10–12px padding is best current operator density; used across modules consistently.

**Draft rule:** Preserve dense row as admin default for workflow entities. Reduce duplicate columns (meta vs fields) — show each fact once.

---

## Rules that should stay module-specific

| Module | Draft module rule |
|--------|-------------------|
| AI Delivery | Operator summary collapses by default; modal sequence unchanged until sheet DEFER |
| Market Intelligence | Split pane fixed; detail sections accordion |
| Client Hub | Credential block always masked; never shrink security affordances |
| Invoices | Payment registration stays modal P1; table conversion P1 |
| Monthly Report | Admin panel vs portal FINAL view are separate layouts (SPLIT) |
| Modules registry | Card grid KEEP — low row count |

---

## Deferred (not P0)

| Item | Flag | Reason |
|------|------|--------|
| AI Delivery side-sheet | DEFER | High refactor risk on 5800-line page |
| Global search bar | DEFER | No component exists |
| Loading skeletons | DEFER | LoadingState sufficient for now |
| Toast system | DEFER | StatusNotice banner works; dismiss optional later |
| Client approval routes | DEFER | Placeholders must not become active UI |

---

## Compact patterns already working (KEEP evidence)

1. `.dense-record` row padding and hover (`styles.css` lines ~1718–1733)
2. Dense-phase button sizing (32px, muted primary) when cascade applies
3. `row-action-menu` labeled groups (Planning / Packaging / Reports on AI Delivery)
4. Team member `table-wrap` — finance table reference
5. MI + Portal split-pane grid
6. `getStatusTone()` centralized badge mapping
7. `ModalActions` cancel/save footer pattern (where used)

---

## Next steps (owner, not agent)

1. Review evidence pack + matrix + JSON
2. Approve or edit draft global rules (GR-01 … GR-10)
3. Prioritize P0 implementation block (likely: header standardization, metric budget, portal shell split, filter chips)
4. Cross-check against `BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md` for intentional compact hybrid wording update

---

*DRAFT ONLY — no implementation authorized by this file.*
