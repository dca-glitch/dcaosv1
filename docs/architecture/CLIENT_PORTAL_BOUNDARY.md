# Client Portal Admin/Client Boundary

**Status:** Architecture refresh for DCA OS Lite client portal surfaces (G205 / G329–G348 / G577–G588).
**Scope:** Boundary rules only — does not replace smoke gates or module plans.
**Closeout:** [`docs/runbooks/CLIENT_APPROVAL_G577_G588_CLOSEOUT.md`](../runbooks/CLIENT_APPROVAL_G577_G588_CLOSEOUT.md)

Related:

- [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](../CURRENT_SYSTEM_SNAPSHOT.md)
- [`docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)
- [`docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md`](../runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md)
- `docs/architecture/CLIENT_PORTAL_NOTIFICATIONS_PLAN.md` (archived reference; see Git history)

---

## Roles (admin vs client matrix)

| Role | Portal archive (final deliverables / FINAL reports) | Pending approval / edit | Send-for-review (admin) | Admin workflow / storage / cost / audit |
|---|---|---|---|---|
| Client (client-only membership) | Yes, via `ClientUserAccess` | Yes, for own clients | No | No |
| Owner / admin | List pending as owner-only helper; not via client mutation helpers | No (approval/edit helpers exclude owner/admin) | Yes, on admin AI Delivery routes | Yes, on admin routes only |

Client-only users remain blocked from admin-only routes. Owner/admin must not use client-approval mutation helpers as a substitute for admin tooling.

### Capability matrix (G340)

| Capability | Client | Owner/Admin |
|---|---|---|
| `GET` archive deliverables / FINAL monthly reports | Yes (access-scoped) | Prefer admin module routes; portal archive helpers still require `ClientUserAccess` where used |
| Approve / request-changes / image review | Yes (`PENDING_CLIENT_REVIEW` only) | No via portal approval helpers |
| Edit article body/metadata while pending | Yes | No via portal edit helpers |
| View client edit history | Yes (email redacted) | Yes (email visible) on portal edit-history when authorized |
| See `storageKey` / provider / cost / audit | Never | Admin routes only |
| Durable second revision round enforcement | Policy-ready; persistence deferred (see below) | N/A |

---

## Client-visible surfaces

Allowed when access and status guards pass:

- Final deliverables: status `DELIVERED` or `ACCEPTED` only
- Monthly reports: status `FINAL` and not archived
- Client-safe `exportUrl` and download references (`downloadUrl` + `expiresSeconds` only)
- Approval list/detail for `PENDING_CLIENT_REVIEW` deliverables (client-safe fields)
- Delivery summary / release package client snapshots (sanitized display text)
- Monthly report performance provenance: `sourceType`, `manualSource`, `placeholderOnly`, `disclaimer`, normalized GSC/GA4 totals

---

## Forbidden client exposure

Must never appear in client-portal JSON, download envelopes, or UI copy:

- `storageKey` and raw private object paths
- `providerMetadata` / provider run payloads
- `workflowRunId`, workflow run internal status, execution logs
- Job / queue status fields
- Audit log rows or audit feeds
- Raw cost rows (`actualCostUsd`, `estimatedCostUsd`, cost ledgers)
- Admin-only notes (`adminSummaryNotes`, import/approve operator notes)
- Internal source IDs (`miHandoffId`, `releasePackageId`, snapshot `notes` / `itemMetrics`)
- Stack traces or filesystem paths in error messages

Serializers live in `apps/api/src/core/client-portal.runtime.ts` and
`client-portal-approval.runtime.ts`. Forbidden-key helpers live in
`client-portal-error-safety.ts`.

---

## Approval boundary

- Approve deliverable → status `APPROVED_BY_CLIENT`; admin notified (`AI_DELIVERY_APPROVED`)
- Request changes / reject deliverable → status `DRAFT` with reason; admin notified (`AI_DELIVERY_REVIEW_REQUEST`)
- Image reject requires a non-empty reason; image-level approve/reject does not notify admin by default
- Pure policy helper: `evaluateClientPortalApprovalAction` in `client-portal-approval-policy.ts`

### One-revision-round design (G335 / G579)

Product rule: a client may consume **one** request-changes round per deliverable review cycle.

| Layer | Behavior today | Blocker |
|---|---|---|
| Pure policy (`client-portal-approval-policy.ts` + `revision-policy.ts`) | When `revisionRoundUsed: true`, returns `REVISION_ROUND_EXHAUSTED` | None — unit-tested |
| Runtime (`rejectClientPortalDeliverable`) | Passes `revisionRoundUsed: false` until a durable counter exists; can return typed `REVISION_ROUND_EXHAUSTED` when policy exhausts | Needs approved schema field (e.g. `clientRevisionRoundUsed` or equivalent) — **no schema change in G577–G588** |
| Controller | Maps exhaustion / missing reason to stable client-safe codes | Wire UI after persistence lands |
| Notification map | `approval-notification-mapping.ts` maps approve/request-changes/image/monthly-report onto existing taxonomy events | Image-level + monthly-report client delivery still unwired |

Do not invent persistence or weaken RBAC to approximate the counter.

---

## Error safety

Client-facing messages must use short, stable copy. Use `toClientPortalSafeErrorMessage` when adapting unknown errors. Controllers should continue returning fixed codes/messages rather than raw exception text.
