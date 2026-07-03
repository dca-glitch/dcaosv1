# Workflow Briefs Module Plan

## Purpose

WorkflowBriefs is an active intake / context-composition / production-automation layer.
It is **not legacy** and **not a duplicate production workspace**. AiDelivery remains the
operational production workspace and the canonical production data surface.

This doc records the source-of-truth relationship between WorkflowBriefs and AiDelivery,
established by the Block 4B strategic architecture review.

## What WorkflowBriefs owns

- Composable brief intake: a brief is a freely assembled operating-context resource, not a
  fixed monthly artifact. Captured via the `Brief` model (`structuredInputJson`, business
  context, goal, target audience, offer/location context) — richer than `AiDeliveryBrief`.
- AI run tracking (`AiBriefRun`: queued/started/completed/error, input snapshot).
- Market Intelligence and SEO report generation per brief/run (`AiMiReport`, `AiSeoReport`).
- Brief approval trail (`BriefApproval`: actor role, decision, target).
- `ProductionPlan` assembly, including a client-visible snapshot, sent for client sign-off
  (`sendWorkflowBriefProductionPlanToClient`, `clientApproveWorkflowBriefProductionPlan`,
  `clientRejectWorkflowBriefProductionPlan`).
- Optional linkage to an `AiDeliveryProject` (create-or-reuse via `sourceBriefId`).
- Batch/deterministic generation and packaging automation that writes into AiDelivery's
  shared production tables (see below), plus release-package finalization and batched
  publication handoff.

## What AiDelivery owns

- `AiDeliveryProject` — the canonical project record.
- Content plan, content drafts, article images, deliverables, deliverable reviews.
- Exports (Google Docs) and the WordPress draft-preparation boundary.
- Monthly reports.
- The admin production workspace (`AiDeliveryPage.tsx`) for direct manual CRUD across all
  of the above, independent of whether a WorkflowBrief was ever involved.

## How the two connect (confirmed by code evidence)

- WorkflowBriefs writes directly into AiDelivery's shared production tables:
  `AiDeliveryContentDraft`, `AiDeliveryArticleImage`, and `AiDeliveryDeliverable`.
  `AiDeliveryDeliverable` carries optional `briefId` / `productionPlanId` fields used purely
  for provenance — the row itself is the same shared record type the admin UI manages
  manually.
- WorkflowBriefs reuses AiDelivery's WordPress draft-preparation primitive
  (`prepareAiDeliveryDeliverableWordPressDraft`) for its batched publication handoff instead
  of duplicating that logic.
- `AiDeliveryBrief` is the simpler, older, project-attached brief concept (client priorities,
  products/services focus, target audience, markets/competitors — four free-text fields).
  `Brief` (WorkflowBrief) is the richer, composable intake/context layer. Both currently
  exist; neither has been removed or scheduled for removal.

## Known product/UX risk — confirmed as stage distinction, not duplication (Block 4D)

Two client-facing "Brief"-labeled nav items are shown to the same client-only user
simultaneously, but they gate different pipeline stages, not the same decision:

- `#/client-portal/briefs` — **read-only**, already-finalized release package view
  (`getClientPortalReleasePackage`), populated only after release-package finalization.
- WorkflowBriefsPage "Content Briefs" client nav — the **earlier-stage** `ProductionPlan`
  approve/reject action, before production/drafting begins.

The remaining risk is UX clarity (two similarly-named nav entries), not a functional
duplicate. Not scoped for consolidation in this docs block.

This dual surface is a known risk flagged for future product/UX review. It is **not**
being refactored or consolidated as part of this documentation update.

## Client-safe boundary (unchanged)

Regardless of which pipeline originates a record, clients must never see internal
metadata, provider/run logs, workflow execution logs, `storageKey`, `releasePackageId`,
`sourceType`, `workflowRunId`, `executionLog`, or draft internals unless explicitly
exposed as review/final output.

**reportJson sanitization rule (Block 4E):** `AiMiReport.reportJson` and
`AiSeoReport.reportJson` embed provider/run metadata (`gateway`, `model`, `version`,
`isDeterministic`, `generatedAt`) alongside safe content fields. For non-admin/client
callers, `sanitizeBriefDetailForRole`, `getWorkflowBriefMiReport`, and
`getWorkflowBriefSeoReport` all reduce `reportJson` to safe content fields only
(`summary`/`audienceInsights`/etc. for MI, `keywordClusters`/`topicIdeas`/etc. for SEO)
via the existing `readMiReportContent`/`readSeoReportContent` helpers. Admin/owner
callers continue to receive the full raw record.

## Related docs

- [`docs/ai-delivery-projects-mvp-prd.md`](../ai-delivery-projects-mvp-prd.md)
- [`docs/modules/CLIENT_PORTAL_PLAN.md`](./CLIENT_PORTAL_PLAN.md)
- [`docs/AI_MODULES.md`](../AI_MODULES.md)
