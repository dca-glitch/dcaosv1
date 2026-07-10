# Admin Data-Dense UI

Status: Phase 2 foundation closed for the current local/admin MVP.
**G429–G448 note:** Density rules unchanged. New inventories and badge designs must follow this document — badges are compact chips, not landing cards.

The admin workspace must prioritize scanning, comparison, and repeated operator actions over landing-page presentation. DCA OS Lite is an operator system, so overview pages should help the user answer quickly: what needs attention, what is blocked, what is ready, and which record should be opened next.

## Core Direction

Use Option 1: data-first list/table UI.

Admin overview pages should follow this pattern:

1. Page title and one primary create action.
2. Search, filters, and quick status views.
3. Compact list/table-like rows for records.
4. One main visible action per record, usually `Open`.
5. Secondary actions in compact row menus or quieter secondary areas.
6. Detail work inside an existing modal, drawer, or detail page.

Do not use oversized landing cards or button walls for repeated operational records.

## Design Rules

- Use compact list or table-like rows for operational overviews.
- Keep row text compact but readable; do not make text tiny.
- Keep one visible primary action per record, usually `Open`, `Edit`, or the most common safe workflow action.
- Move routine secondary actions into compact secondary action areas or row menus where this does not break behavior.
- Keep statuses visible as small chips or badges.
- Use muted dark/neutral buttons for routine actions.
- Primary buttons may be visible, but they must remain calm and non-flashy.
- Destructive actions should be visually quiet until needed and clearly separated from safe actions.
- Preserve existing workflows; density must not remove capabilities.
- Preserve API contracts, auth/RBAC, schemas, finance calculations, client visibility, and AI workflow behavior.
- **Proof / integration badges** (when implemented) must use the same chip density as status badges — never hero metrics that imply production readiness. See [`admin-proof-state-badge-design.md`](./admin-proof-state-badge-design.md).

## Button Rules

Routine buttons must be dimmed, not flashy.

Preferred behavior:

- Primary: compact, calm, readable, used sparingly.
- Secondary: muted dark/neutral style.
- Danger/destructive: not giant, not glowing, and preferably inside a More menu or separated action group.
- Repeated row actions: `Open` + `More` instead of many visible buttons.

Avoid:

- bright gradients for routine actions;
- large glowing pill buttons;
- repeated red action blocks;
- showing every available action on every row;
- seven simultaneous `primary-action` lane buttons (AI Delivery AD-2).

## Completed Phase 1 Screens

- AI Delivery project overview.
- Invoices overview.
- Clients overview and Client Access section.

Phase 1 established the shared visual direction: compact rows, dimmed routine buttons, small status chips, calmer primary actions, and More menus for secondary workflows.

## Completed Phase 2 Screens

- Projects overview.
- Tasks overview.
- Services Library overview.
- Bills overview and Vendors list.
- Credit Notes overview.

Phase 2 continued the same presentation-only direction. Business logic, API contracts, auth, RBAC, schemas, finance calculations, package scripts, and AI workflow behavior remain unchanged.

## Human Operator Checklist

A page follows this design direction when an operator can answer these in a few seconds:

- What records exist?
- Which record needs attention?
- What is the status?
- What is the main next action?
- Where are secondary actions?
- Can I scan multiple records without scrolling through oversized cards?
- If an integration chip is shown: is proof-state vocabulary used (local / disabled-safe / owner-gated) rather than “live” or “connected”?

If the page cannot answer these quickly, it needs a data-dense pass.

## Later UI Work

- Market Intelligence has a larger bespoke layout and should be compacted in a separate focused pass.
- Monthly Reports and Client Portal shell can be reviewed separately, with client visibility rules unchanged.
- Settings, Team, Company Profile, and modal internals may receive smaller density polish if operator feedback calls for it.
- Deeper master-detail layouts can be considered later for AI Delivery project execution, but overview screens should stay data-first.
- AI Delivery hotspot split is **planning-only** until an approved Phase A types extract — [`ai-delivery-hotspot-file-review.md`](./ai-delivery-hotspot-file-review.md).
- Launch-blocker board remains design-only — [`launch-blocker-board-ui-design.md`](./launch-blocker-board-ui-design.md).

## Surface inventory pointer

Full admin hash-route inventory: [`admin-surface-inventory.md`](./admin-surface-inventory.md).
