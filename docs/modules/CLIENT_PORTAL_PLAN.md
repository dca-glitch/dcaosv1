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

## Known dual client-approval surface (risk note, not scoped for refactor)

A second, separate client-facing approval surface exists outside this portal shell:
`WorkflowBriefsPage` renders a client-role nav item ("Content Briefs") in the main app
for `ProductionPlan` approve/reject, independent of `#/client-portal/briefs`. Both
surfaces gate a similar "approve the plan" business function through different code
paths. This is a known product/UX risk flagged for future review — see
[`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md). It is
not being consolidated here.

## Deferred

- autonomous or background agents
- live provider defaults
- broad refactors
- public approval links
- non-final client self-service flows
