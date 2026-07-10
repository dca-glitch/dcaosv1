# Figma Source Record

## Source of Truth Statement

**Figma Make is the visual source of truth for all DCA OS Lite redesign decisions.**  
**This repository (`dca-glitch/dcaosv1`) is the functional source of truth.**

These two sources govern different concerns and must not conflict. Visual decisions flow from Figma Make into this documentation directory. Functional decisions flow from the codebase. Neither overrides the other in its own domain.

---

## Figma Make Session

| Field | Value |
|-------|-------|
| Platform | Figma Make |
| Project | DCA OS Lite Redesign |
| Session started | July 2026 |
| Documentation committed | July 10, 2026 |
| AI model | Claude Sonnet 4.6 |
| Status | Active — Phase 3 approved, rollout planned |

> **Note on Figma Make URLs:** Figma Make preview URLs are session-scoped and may expire. The canonical record of all design decisions is this `docs/design/` directory, not the preview URL. If the preview link is unavailable, this documentation is the authoritative source.

---

## Approved References

The following screens and components have been reviewed, iterated, and approved as visual references for the full product redesign. They must not be redesigned.

### Dashboards

| Screen | Surface | Approval Date | Notes |
|--------|---------|---------------|-------|
| Agency Operations Dashboard | Admin | July 2026 | Source of truth for admin density, ring meter KPI tiles, workflow tab pattern |
| AI Delivery Dashboard | Admin | July 2026 | Source of truth for numeric KPI tiles, pipeline bar, action queue, 10-column deliverables table |
| Client Portal Dashboard | Client | July 2026 | Source of truth for client density, simplified delivery stages, plain language, calmer layout |

### Modal Patterns

| Modal | Surface | Approval Date | Notes |
|-------|---------|---------------|-------|
| AI Run Review Modal | Admin only | July 2026 | Tabbed: Overview / Context & Logs / Raw Output. 5 states documented. |
| Deliverable Approval Modal | Admin + Client | July 2026 | Checklist-gated approval. Simpler than AI Run Review. 5 states documented. |

### Supporting Reference Pages

| Page | Purpose | Status |
|------|---------|--------|
| Design System Reference | Living spec for all tokens, components, states, status system | Approved |
| Redesign Rollout Plan | 13-phase implementation sequence | Approved |

---

## Visual Iteration History

The following summarises the major visual decisions made during the Figma Make session, in chronological order.

| Decision | Outcome |
|----------|---------|
| Font selection | Plus Jakarta Sans (body) + JetBrains Mono (data/code). Space Grotesk rejected — overused. Satoshi rejected — not available. |
| Background | `#06070D` (space black). Cards `#0C0F1A`. Subtle black → dark purple radial gradients at page corners. |
| Glassmorphism | Rejected. Solid gradient panels only (`panelCSS()` helper). No blur, no frosted surfaces. |
| Neon / glow | Rejected. Muted, tinted badge colors. No glow filters. |
| Card treatment | Dark-to-purple linear gradient (`135deg, #06070D → #0D0818`) with 1px semi-transparent border. |
| Active nav | Indigo 10% bg + `#A5B4FC` text. No left border accent bar. |
| KPI tiles (admin) | RingMeter SVG arc (Agency Ops) or numeric only (AI Delivery, Client Portal). |
| MetricTile structure | Label → helper text → ring (stacked vertical). No icons in ring tiles. |
| Status system | 13 canonical statuses. Single STATUS map. All derived from it. |
| Density split | Admin: `px-4 py-2.5` tables, `space-y-4` sections. Client: `px-6 py-3.5`, `space-y-6`. |
| Continue button | Black titanium treatment: dark gradient, subtle inset highlight, muted text. |
| Small label contrast | Upgraded from `T.faint` (`#3A4060`) to `T.muted` (`#5C6380`) across all 9px uppercase labels. |

---

## Generated Code Policy

Figma Make generates React/TypeScript code alongside visual prototypes. This code:

- Lives at `src/app/App.tsx` in the Figma Make sandbox
- **Must not be copied into `apps/` without an implementation review**
- Serves as visual specification — it demonstrates the intended markup structure, component hierarchy, and styling
- Any implementation PR touching a redesigned screen must confirm functional parity with the existing screen

---

## Revision Notes

| Date | Change |
|------|--------|
| July 2026 | Initial design system established. Agency Ops Dashboard approved. |
| July 2026 | AI Delivery Dashboard approved. STATUS map extended with delivery-specific statuses. |
| July 2026 | Client Portal Dashboard approved. Client-safe stage vocabulary defined. |
| July 2026 | Design System reference page created. All tokens, components and states documented. |
| July 2026 | AI Run Review and Deliverable Approval modals approved. 5 states each. |
| July 2026 | Redesign rollout plan approved. 13 phases defined. |
| July 2026 | Small uppercase label contrast upgraded globally (`T.faint` → `T.muted`). |
| July 10, 2026 | Full design handoff committed to `docs/design/` in repository. |
