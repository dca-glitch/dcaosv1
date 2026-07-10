# Client Portal Plan

## Purpose

The Client Portal is an active client-safe surface for final deliverables and read-only archive/report visibility.

## Current state

- `#/client-portal` routes to the portal shell and defaults to **Your archive**
- `#/archive` is the separate archive hub
- `#/client-portal/pending-approvals` shows pending approvals
- `#/client-portal/briefs` shows the legacy `ClientMonthlyBrief` content-brief intake/status page (`BriefPage`)
- `#/client-portal/deliverables/:id/approve` opens the deliverable approval editor
- `#/monthly-reports` routes to the client portal archive shell (`MonthlyReportsPage` → `ClientPortalRouter` → `ClientPortalPage`) — same live monthly report list/detail/download as `#/client-portal`; no separate stub UI
- **Canonical client monthly reports** live in `ClientPortalPage` inside the archive shell: list, detail, performance summary, and PDF download
- client-only users can access portal routes and remain blocked from admin-only views

## Client-safe boundary

Do not expose internal workflow, provider, storage, or admin metadata in portal surfaces.

Forbidden visible fields include:

- `storageKey`
- `releasePackageId`
- `ADMIN_REVIEW`
- `workflowRunId`
- `executionLog`
- provider/run metadata
- raw metric snapshot objects, import notes, and other admin-only metrics internals (see monthly report provenance below)

**Monthly report metrics provenance (intentional client-safe exception):** on FINAL report
detail, `performanceSummary` may expose client-safe provenance fields derived from an
**approved** metrics snapshot — for example `sourceType`, `manualSource`, `placeholderOnly`,
`disclaimer`, `itemCount`, and normalized GSC/GA4 totals. These tell the client whether
metrics are manual/placeholder vs reviewed totals; they are **not** raw provider payloads.
Admin-only metric snapshot fields (`notes`, import/approve metadata, raw snapshot records,
`itemMetrics`, seed markers) must not appear on client portal responses.

**Known gap confirmed in Block 4G, fixed in Block 4G-FIX:** `releasePackageId` was present
in the release-package JSON payload returned by `getClientPortalReleasePackage` (sourced
from `ClientSafeReleasePackage`, built in `workflow-brief-final-release.execution.ts`). It
was not rendered as visible UI text in `ClientPortalPage.tsx` (declared in the type but
unused), but was present in the response body. Removed entirely from
`ClientSafeReleasePackage` and its builder/sanitizer functions, plus
`client-portal.runtime.ts`'s `sanitizeClientPortalReleasePackage`. See
[`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md) for detail.

**Reusable AI knowledge/context confirmed never client-visible (Block 5A):** the admin-only
knowledge base and context builder layer (`AiKnowledgeItem`, `AiContextSnapshot`, see
[`docs/modules/KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md)) is hard-gated at the route level
(`requireRole("owner","admin")`) on every endpoint, and no client-portal or client-reachable
function queries these tables anywhere in the codebase — confirmed by full-codebase search.
Clients only ever see the safe final outputs this layer helps admins produce (approved
content plans, final deliverables, final reports), never raw context, prompt assembly, or
knowledge item content itself.

## Current scope

- archive / final delivery history
- pending approvals
- brief review
- deliverable approval
- FINAL-only monthly reports

## Client approval surface map (G122/G123)

Client approval and archive responses are intentionally field-mapped in API runtime code, not
passed through as raw Prisma records.

| Surface | Runtime | Client-visible payload | Guard |
| --- | --- | --- | --- |
| Pending approvals | `client-portal-approval.runtime.ts` | deliverable id/title/status, project/client names, created time | pending-review status only; narrow select excludes storage/provider/workflow/audit fields |
| Approval editor | `client-portal-approval.runtime.ts` | article metadata/body and image preview/final URLs | client access plus `PENDING_CLIENT_REVIEW`; narrow select excludes storage/provider/workflow/audit fields |
| Edit history | `client-portal-edit.runtime.ts` | allowlisted client-edit fields and user display identity | filters persisted rows to title/body/description/tags/category/scheduledPublishAt; client users do not receive editor email |
| Archive deliverables | `client-portal.runtime.ts` | final deliverable summaries and Google Docs export links | `DELIVERED`/`ACCEPTED` only; `storageKey` never serialized |
| Monthly reports | `client-portal.runtime.ts` | FINAL report summary/detail, work summary, client-safe metrics summary | `FINAL` only; `storageKey` used only to compute `hasDocument` or a private download reference |
| Release package | `client-portal.runtime.ts` | finalized client snapshot only | requires finalized package version/kind and strips internal markers |

Leakage scan coverage for G120 focuses on workflow run status/ids, `storageKey`,
provider/model/cost metadata, and audit/admin fields. These remain forbidden on client-visible
portal responses except for explicit private download references returned by download endpoints.

## Briefs vs Production Plan Review (stage distinction, corrected in Block 4F)

**Correction to the Block 4D/4C finding:** `#/client-portal/briefs` renders `BriefPage`,
which is the **legacy `ClientMonthlyBrief`** submission/status page (hub/geo/lifestyle
content-count brief intake) — not the finalized release package as previously documented.
The read-only, already-finalized release package view is part of the default `#/client-portal`
("Your archive") experience (`getClientPortalReleasePackage`, sourced from
`ProductionPlan.planJson.releasePackage.clientSnapshot`), not a separately-labeled "Briefs"
surface.

The two client-visible surfaces that actually competed for the word "Brief" were:

- **"Briefs"** nav item → `BriefPage` → legacy `ClientMonthlyBrief` content-brief intake.
- **"Content Briefs"** nav item → `WorkflowBriefsPage` → `ProductionPlan` approve/reject,
  an earlier pipeline stage before production/drafting begins.

**Block 4F fix:** the WorkflowBriefsPage client nav label and its in-page heading (client
view only; admin view unchanged) were renamed from "Content Briefs"/"Workflow Briefs" to
**"Production Plan Review"**, so the nav label and the page title now match and no longer
share the word "Brief" with the legacy `BriefPage` nav item. No routing, approval semantics,
or admin-facing wording changed. See
[`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md).

**Legacy `ClientMonthlyBrief` status (XXL 4A):** `/api/v1/briefs` and `#/briefs` /
`#/client-portal/briefs` remain **active legacy/compatibility intake** for monthly and
additional content-count briefs. This surface is **distinct** from WorkflowBriefs /
Production Plan Review and is **not** wired into the WorkflowBriefs or AiDelivery production
pipeline. Do not remove, migrate, or deprecate it without a separate approved product block.
Optional future naming or nav polish only.

## Deferred

- autonomous or background agents
- live provider defaults
- broad refactors
- public approval links
- non-final client self-service flows
- durable one-revision-round persistence (policy helper ready; schema field required — see `CLIENT_PORTAL_BOUNDARY.md`)
- in-system inbox ↔ portal deep links (design in `CLIENT_PORTAL_NOTIFICATIONS_PLAN.md`)
