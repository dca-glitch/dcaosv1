# Client Portal ↔ Inbox Notifications Plan

**Status:** Future plan only (G207). No persistence, outbox schema, or live send implementation in this block.

Related:

- [`docs/architecture/CLIENT_PORTAL_BOUNDARY.md`](./CLIENT_PORTAL_BOUNDARY.md)
- [`docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md`](../runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md)
- [`docs/operator/notifications-blocker-plan.md`](../operator/notifications-blocker-plan.md)
- Existing email intents: `notifyDcaTeam` / `notifyClientUsers` (local often `SKIPPED`)

---

## Goal

Connect the in-system admin/client inbox to client portal events so operators and clients see actionable notices — without exposing internal workflow, storage, provider, cost, or audit details.

---

## Event → surface map (proposed)

| Event | Actor | Inbox audience | Client portal deep link (hash) | Must not include |
|---|---|---|---|---|
| Article ready for client review | Admin send-for-review | Client users on that client | `#/client-portal/pending-approvals` or `#/client-portal/deliverables/:id/approve` | workflow run id, provider, storageKey |
| Client approved article | Client | DCA team (owner/admin) | Admin deliverable/review surface (existing admin routes) | cost rows, execution log |
| Client requested changes | Client | DCA team | Admin revision queue | raw stack / internal notes dump |
| Image rejected with reason | Client | Optional future admin notice | Admin image review | provider metadata |
| FINAL monthly report published | Admin finalize | Client users | `#/client-portal` archive / report detail | `adminSummaryNotes`, snapshot import ids |
| Final deliverable available | Admin mark delivered/accepted | Client users | `#/client-portal` archive | storageKey (use download API only) |

---

## Payload rules for future inbox items

Client-visible notification payloads may include:

- Stable public codes (`AI_DELIVERY_REVIEW_REQUEST`, `AI_DELIVERY_APPROVED`, etc.)
- Client-safe titles and short reason previews
- Entity ids that the client portal already authorizes (`deliverableId`, `projectId`, `reportId`)
- Deep-link hash paths from the route inventory

Client-visible notification payloads must not include:

- `storageKey`, signed URL secrets beyond short-lived download refs already gated by API
- `providerMetadata`, model names, prompt scaffolds
- `workflowRunId`, job/queue status, audit log bodies
- Raw cost rows or admin-only notes
- Stack traces

Admin inbox items may reference internal entities but should still avoid dumping provider secrets or storage keys into the UI.

---

## Implementation order (future blocks)

1. Define inbox message DTO with explicit client-safe vs admin-only field sets
2. Emit inbox rows from existing approval/finalize seams (no new public approval links)
3. Wire client portal UI to unread count → pending approvals / archive
4. Keep email/outbox as optional parallel channel; local remains no-send until separately approved
5. Add boundary smoke asserting forbidden keys absent from inbox list/detail for client tokens

---

## Non-goals (this plan)

- No schema/migration in G207
- No live email/provider proof
- No public unauthenticated approval URLs
- No weakening of `ClientUserAccess` or role checks
