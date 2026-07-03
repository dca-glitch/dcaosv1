# Client Portal Plan

## Purpose

The Client Portal is an active client-safe surface for final deliverables and read-only archive/report visibility.

## Current state

- `#/client-portal` routes to the portal shell and defaults to **Your archive**
- `#/archive` is the separate archive hub
- `#/client-portal/pending-approvals` shows pending approvals
- `#/client-portal/briefs` shows brief review
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

## Briefs vs Content Briefs (stage distinction, confirmed by Block 4D review)

`#/client-portal/briefs` and the separate `WorkflowBriefsPage` client nav item ("Content
Briefs") are **different pipeline stages, not duplicate surfaces**:

- `#/client-portal/briefs` renders a **read-only, already-finalized** release package
  (`getClientPortalReleasePackage`, sourced from `ProductionPlan.planJson.releasePackage.clientSnapshot`),
  only populated after release-package finalization.
- `WorkflowBriefsPage` "Content Briefs" is the **earlier-stage** production-plan
  approve/reject action, before production/drafting begins.

Both nav items are shown to the same client-only user today, which remains a known
product/UX clarity risk (two "Brief"-labeled nav entries), but they do not gate the same
decision. See [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md).
No UX behavior change is made here.

## Deferred

- autonomous or background agents
- live provider defaults
- broad refactors
- public approval links
- non-final client self-service flows
