# Client Portal Admin/Client Boundary

**Status:** Architecture refresh for DCA OS Lite client portal surfaces (G205).  
**Scope:** Boundary rules only — does not replace smoke gates or module plans.

Related:

- [`docs/modules/CLIENT_PORTAL_PLAN.md`](../modules/CLIENT_PORTAL_PLAN.md)
- [`docs/runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md`](../runbooks/PURIVA_CLIENT_PORTAL_BOUNDARY_GATE.md)
- [`docs/runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md`](../runbooks/CLIENT_PORTAL_ROUTE_INVENTORY.md)
- [`docs/architecture/CLIENT_PORTAL_NOTIFICATIONS_PLAN.md`](./CLIENT_PORTAL_NOTIFICATIONS_PLAN.md)

---

## Roles

| Role | Portal archive (final deliverables / FINAL reports) | Pending approval / edit | Admin workflow / storage / cost / audit |
|---|---|---|---|
| Client (client-only membership) | Yes, via `ClientUserAccess` | Yes, for own clients | No |
| Owner / admin | Not via client-approval-only helpers | No (approval helpers exclude owner/admin) | Yes, on admin routes only |

Client-only users remain blocked from admin-only routes. Owner/admin must not use client-approval mutation helpers as a substitute for admin tooling.

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
- One revision round is encoded in the policy helper; durable round counting may require a future schema field (do not invent persistence here)

---

## Error safety

Client-facing messages must use short, stable copy. Use `toClientPortalSafeErrorMessage` when adapting unknown errors. Controllers should continue returning fixed codes/messages rather than raw exception text.
