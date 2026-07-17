# Client Portal Surface Inventory (G662)

**Status:** Docs-only inventory refreshed 2026-07-10 (Lane 17 / G661–G672).  
**Ownership:** Lane 9 owns `client-portal-api*`; portal page edits remain out of Lane 17. This inventory **proposes**; it does not authorize portal code changes.  
**Wording:** [`docs/operator/client-wording-guide.md`](../operator/client-wording-guide.md)  
**Prior kebab inventory:** historical kebab-case duplicate removed during documentation refresh

## Shell views (client-facing)

From `App.tsx` `clientNavigationItems` + `CLIENT_PORTAL_SHELL_VIEWS`:

| Hash / view | Client nav label | Primary file | Audience |
|-------------|------------------|--------------|----------|
| `#/dashboard` | Dashboard | App dashboard (client-filtered) | Client |
| `#/client-portal` | Your archive | `ClientPortalPage.tsx`, `ClientPortalRouter.tsx` | Client + admin preview |
| `#/briefs` | Briefs | Brief page | Client |
| `#/workflow-briefs` | Production Plan Review | `WorkflowBriefsPage.tsx` | Client (label differs from admin) |
| `#/pending-approvals` | Pending Approvals | `PendingApprovalsPage.tsx`, `ArticleApprovalEditor.tsx` | Client review |
| `#/monthly-reports` | Monthly Reports | Portal / monthly reports page | Client-safe FINAL only |
| `#/archive` | Archive | `ArchiveHubPage` | Client archive |

Hash normalization: `client-portal` and `client-portal/*` → portal shell (`normalizeHash`).

## File inventory (portal module)

| File | ~Lines (2026-07-10) | Role | Edit owner |
|------|---------------------|------|------------|
| `ClientPortalPage.tsx` | 1527 | Main archive / deliverables / reports UI | Portal page owner (not Lane 17) |
| `ArticleApprovalEditor.tsx` | 634 | Per-article + image approve/reject/undo | Portal page owner |
| `PendingApprovalsPage.tsx` | 122 | Pending list | Portal page owner |
| `client-portal-api.ts` | 198 | Client API helpers | **Lane 9 — do not edit in Lane 17** |
| `client-portal-api.test.ts` | 106 | Unit tests | **Lane 9** |
| `ClientPortalRouter.tsx` | 26 | Sub-route switch | Portal page owner |

## Client-safe boundary (must preserve)

Clients must **not** see:

- `storageKey`, `workflowRunId`, `structuredInputJson`
- MI/provider/gateway/execution-log internals
- Admin DRAFT / ADMIN_REVIEW workflow as raw enums (map via client status labels)
- Live integration proof language (“OpenRouter connected”, “GA synced”, “production ready”)
- Proof-state / integration-truth admin badges

Preferred client language: final deliverable, monthly summary, completed work, prepared draft, archive.

## Proposed polish (do not implement in Lane 17)

| ID | Proposal | Priority |
|----|----------|----------|
| CP-1 | Project list empty → `EmptyState variant="inline"` | P2 |
| CP-2 | Repeat 90-day archive rule in empty copy | P2 |
| CP-3 | Performance snapshot empty → manual/placeholder disclaimer | P1 copy |
| CP-4 | Avoid exposing internal status strings that fall through status-label default | P1 |

## Testability pointer

[`CLIENT_PORTAL_UI_TESTABILITY.md`](./CLIENT_PORTAL_UI_TESTABILITY.md) · prior [`docs/ux/client-portal-ui-testability.md`](../ux/client-portal-ui-testability.md)
