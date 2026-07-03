# Client Portal Plan

## Purpose

The Client Portal is an active client-safe surface for final deliverables and read-only archive/report visibility.

## Current state

- `#/client-portal` routes to the portal shell and defaults to **Your archive**
- `#/archive` is the separate archive hub
- `#/client-portal/pending-approvals` shows pending approvals
- `#/client-portal/briefs` shows the legacy `ClientMonthlyBrief` content-brief intake/status page (`BriefPage`)
- `#/client-portal/deliverables/:id/approve` opens the deliverable approval editor
- `#/monthly-reports` exists as a **stub/static page** (`MonthlyReportsPage`) with an empty-state shell only — it does **not** load live report data
- **Canonical live client monthly reports** are inside `#/client-portal` (`ClientPortalPage`): list, detail, performance summary, and PDF download. Wiring or redirecting `#/monthly-reports` to that experience is a future frontend block (not completed in XXL 4A).
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
