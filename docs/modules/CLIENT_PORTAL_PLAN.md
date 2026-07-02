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

## Deferred

- autonomous or background agents
- live provider defaults
- broad refactors
- public approval links
- non-final client self-service flows
