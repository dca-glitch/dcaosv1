# Client Portal ↔ Inbox Notifications Plan

**Status:** Design refresh (G207 / G259 / G336 / G249–G268). No persistence, outbox schema, or live send implementation in this block.

Related:

- [`docs/architecture/CLIENT_PORTAL_BOUNDARY.md`](./CLIENT_PORTAL_BOUNDARY.md)
- [`docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md`](../runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md)
- [`docs/operator/notifications-blocker-plan.md`](../operator/notifications-blocker-plan.md)
- [`docs/operator/notification-persistence-design.md`](../operator/notification-persistence-design.md) (G257–G259 persistence/inbox/idempotency design)
- Existing email intents: `notifyDcaTeam` / `notifyClientUsers` (local often `SKIPPED`)
- Safe payload helper: `buildNotificationPayloadSnapshot()` in `packages/shared/src/notification-events.ts`

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
- Fields produced by `buildNotificationPayloadSnapshot()` (G255 allowlist)

Client-visible notification payloads must not include:

- `storageKey`, signed URL secrets beyond short-lived download refs already gated by API
- `providerMetadata`, model names, prompt scaffolds
- `workflowRunId`, job/queue status, audit log bodies
- Raw cost rows or admin-only notes
- Stack traces
- OAuth tokens, API keys, raw provider responses, private audit metadata

Admin inbox items may reference internal entities but should still avoid dumping provider secrets or storage keys into the UI.

### G259 inbox surface refresh (design only)

| Surface | Audience | MVP events | Deep link |
|---------|----------|------------|-----------|
| Client unread / list | `ClientUserAccess` user | `client_approval_needed`, `image_set_ready`, `monthly_report_available` (+ legacy aliases) | `#/client-portal/pending-approvals` / archive |
| Admin unread / list | owner/admin | approve/reject alerts, brief submitted, WordPress draft prepared, budget blocked | existing admin AI Delivery routes |

**Still blocked:** no `InSystemNotification` table, no inbox API, no UI bell. See persistence design for proposed routes. Correlation/idempotency keys are design-only (`buildNotificationCorrelationDesign`).

---

## Current email seams (already wired, local often SKIPPED)

| Portal action | Helper | Kind / subject pattern |
|---|---|---|
| Admin send-for-review | `notifyClientUsers` | Client-facing "ready for your approval" |
| Client approve | `notifyDcaTeam` | `AI_DELIVERY_APPROVED` |
| Client request-changes | `notifyDcaTeam` | `AI_DELIVERY_REVIEW_REQUEST` + reason preview |

These are **not** the in-system inbox. Inbox work remains a future block and must reuse the same client-safe payload rules.

---

## Implementation order (future blocks)

1. Define inbox message DTO with explicit client-safe vs admin-only field sets
2. Emit inbox rows from existing approval/finalize seams (no new public approval links)
3. Wire client portal UI to unread count → pending approvals / archive
4. Keep email/outbox as optional parallel channel; local remains no-send until separately approved
5. Add boundary smoke asserting forbidden keys absent from inbox list/detail for client tokens
6. After durable revision-round persistence, include exhaustion notices without leaking internal counters beyond a client-safe code/message

---

## Non-goals (this plan)

- No schema/migration in G207 / G249–G268 / G336
- No live email/provider proof
- No public unauthenticated approval URLs
- No weakening of `ClientUserAccess` or role checks
- No treating `EmailLog` as the client inbox
- No edits to Lane 2 `notification-events` helpers from the portal lane
