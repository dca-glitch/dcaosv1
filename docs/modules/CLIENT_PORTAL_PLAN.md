# Client Portal Plan

## Purpose

The Client Portal is an active client-safe surface for final deliverables and read-only archive/report visibility.

## Current state

- `#/client-portal` routes to the portal shell and defaults to **Your archive**
- `#/archive` is the separate archive hub
- `#/client-portal/pending-approvals` shows pending approvals
- `#/client-portal/briefs` shows the legacy `ClientMonthlyBrief` content-brief intake/status page (`BriefPage`)
- `#/client-portal/deliverables/:id/approve` opens the deliverable approval editor
- client-only users can access portal routes and remain blocked from admin-only views

## Client-safe boundary

Do not expose internal workflow, provider, storage, or admin metadata in portal surfaces.

Forbidden visible fields include:

- `storageKey`
- `releasePackageId`
- `ADMIN_REVIEW`
- `sourceType`
- `workflowRunId`
- `executionLog`
- provider/run metadata

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

## Deferred

- autonomous or background agents
- live provider defaults
- broad refactors
- public approval links
- non-final client self-service flows
