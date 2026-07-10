# Client Portal Surface Inventory (docs-only)

**Status:** Docs-only review (2026-07-10, G429–G448).  
**Ownership:** Lane 6 owns `apps/web/src/pages/client-portal/**` page edits. This inventory **proposes**; it does not authorize portal code changes.  
**Wording:** [`docs/operator/client-wording-guide.md`](../operator/client-wording-guide.md)

## Shell views (client-facing)

| Hash / path | Label | Primary file | Audience |
|-------------|-------|--------------|----------|
| `#/client-portal` | Your archive / portal shell | `ClientPortalPage.tsx`, `ClientPortalRouter.tsx` | Client + admin preview |
| `#/client-portal/pending-approvals` (routed) | Pending Approvals | `PendingApprovalsPage.tsx`, `ArticleApprovalEditor.tsx` | Client review |
| `#/monthly-reports` | Monthly reports (client nav) | Portal shell / App wiring | Client-safe FINAL only |
| `#/archive` | Archive | Archive hub (separate from portal shell) | Client archive |

Exact sub-routes are owned by `ClientPortalRouter` + App hash normalization (`client-portal` and `client-portal/*` → portal shell).

## File inventory

| File | ~Lines | Role | Edit owner |
|------|--------|------|------------|
| `ClientPortalPage.tsx` | ~1527 | Main archive / deliverables / reports UI | Lane 6 |
| `ArticleApprovalEditor.tsx` | ~634 | Per-article + image approve/reject/undo | Lane 6 |
| `PendingApprovalsPage.tsx` | ~122 | Pending list | Lane 6 |
| `client-portal-api.ts` | ~198 | Client API helpers | Lane 6 |
| `client-portal-api.test.ts` | ~49 | Unit tests | Lane 6 |
| `ClientPortalRouter.tsx` | ~26 | Sub-route switch | Lane 6 |

## Client-safe boundary (must preserve)

Clients must **not** see:

- `storageKey`, `workflowRunId`, `structuredInputJson`
- MI/provider/gateway/execution-log internals
- Admin DRAFT / ADMIN_REVIEW workflow as raw enums (map via `toClientPortalStatusLabel`)
- Live integration proof language (“OpenRouter connected”, “GA synced”, “production ready”)

Preferred client language: final deliverable, monthly summary, completed work, prepared draft, archive — per client wording guide.

## Proposed polish (Lane 6 — do not implement in UI lane)

| ID | Proposal | Priority |
|----|----------|----------|
| CP-1 | Project list empty → `EmptyState variant="inline"` | P2 |
| CP-2 | Repeat 90-day archive rule in empty copy | P2 |
| CP-3 | Performance snapshot empty → manual/placeholder disclaimer | P1 copy |
| CP-4 | Avoid exposing internal status strings that fall through `toClientPortalStatusLabel` default title-case | P1 |

## Testability pointer

[`docs/ux/client-portal-ui-testability.md`](../ux/client-portal-ui-testability.md)
