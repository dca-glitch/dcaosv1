# Admin Data-Dense UI

Status: Phase 2 foundation

The admin workspace should prioritize scanning, comparison, and repeated operator actions over landing-page presentation.

## Pattern

- Use compact list or table-like rows for operational overviews.
- Keep one visible primary action per record, usually `Open`.
- Move routine secondary actions into compact secondary action areas or row menus.
- Keep statuses visible as small chips or badges.
- Use muted dark/neutral buttons for routine actions.
- Keep destructive actions quiet until needed.
- Preserve existing workflows; density must not remove capabilities.

## Phase 1 Screens

- AI Delivery project overview.
- Invoices overview.
- Clients overview and Client Access section.

## Phase 2 Screens

- Projects overview.
- Tasks overview.
- Services Library overview.
- Bills overview and Vendors list.
- Credit Notes overview.

Phase 2 continues the same presentation-only direction: compact rows, muted buttons, small status chips, and quieter secondary actions. Business logic, API contracts, auth, RBAC, schemas, finance calculations, and AI workflow behavior remain unchanged.

## Later UI Work

- Market Intelligence has a larger bespoke layout and should be compacted in a separate focused pass.
- Monthly Reports and Client Portal shell can be reviewed separately, with client visibility rules unchanged.
- Settings, Team, Company Profile, and modal internals may receive smaller density polish if operator feedback calls for it.
