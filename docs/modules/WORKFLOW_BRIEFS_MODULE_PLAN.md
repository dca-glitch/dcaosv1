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

## Reusable knowledge layer — WorkflowBriefs MI/SEO integration foundation (Block 6A)

DCA OS Lite has a separate, admin-only reusable memory layer (`AiKnowledgeItem`,
`AiContextSnapshot`, `ai-knowledge.runtime.ts`, `ai-context-builder.service.ts` — see
[`docs/modules/KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md)) that composes approved,
prompt-eligible knowledge into workflow execution context via
`buildAiWorkflowKnowledgeContext`.

**Block 5A finding:** WorkflowBriefs' own AI-run pipeline was disconnected from this layer.

**Block 6A foundation (implemented):** `triggerWorkflowBriefAiRun` now calls
`buildAiWorkflowKnowledgeContext` before `executeWorkflowBriefAiRun`, passing the sanitized
`contextSection` into prompt assembly and persisting **safe metadata only**
(`knowledgeContext`: used/selectedCount/selectedItemTitles/skippedReason/sanitizeFlagCount/trimmed)
in `AiBriefRun.inputSnapshotJson`. Raw knowledge bodies and `contextSection` are **not**
persisted in the run snapshot or exposed on client-safe surfaces. Execution logs record
include/skip lines matching the AiDelivery workflow-run pattern.

**Block 6B (implemented):** `generateWorkflowBriefProductionPlan`,
`generateWorkflowBriefContentDrafts`, and `regenerateWorkflowBriefContentDraft` now reuse
the same `buildAiWorkflowKnowledgeContext` helper (`content_plan_draft` and `article_draft`
workflow types). Sanitized `approvedKnowledgeSection` is prepended to prompt assembly only;
safe `knowledgeContext` metadata is persisted on admin-only `ProductionPlan.planJson`
(`knowledgeContext` for plan generation; `contentDrafts.knowledgeContext` for draft
generation). Raw knowledge bodies and `contextSection` are never stored on
`clientVisibleSnapshotJson` or other client-reachable surfaces.

**Still deferred:** UI knowledge picker on brief screens; dedicated `AiContextSnapshot` audit
rows per brief run (`briefId` FK does not exist today).

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

## Known product/UX risk — resolved via label clarification (Block 4F)

**Correction to the Block 4D finding:** `#/client-portal/briefs` renders `BriefPage`, the
**legacy `ClientMonthlyBrief`** content-brief intake/status page — not the finalized
release package as previously documented here. The read-only, already-finalized release
package view is part of the default `#/client-portal` ("Your archive") experience, not a
separately-labeled "Briefs" surface.

The two client nav items that actually shared the word "Brief" were:

- **"Briefs"** → `BriefPage` → legacy `ClientMonthlyBrief` content-brief intake.
- **"Content Briefs"** → `WorkflowBriefsPage` → `ProductionPlan` approve/reject, an
  earlier pipeline stage before production/drafting begins.

**Fix applied (Block 4F):** renamed the WorkflowBriefsPage client-facing nav label and
in-page heading (client view only — admin nav label "Workflow Briefs" and admin in-page
title are unchanged) to **"Production Plan Review"**. No routing, approval semantics, or
data model changed.

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

## Production Plan Review — client-safe contract (Block 4G closure)

**Client entry point:** nav label "Production Plan Review" → `WorkflowBriefsPage`
(`canManageAi=false`) → page title/description also read "Production Plan Review" for
clients (Block 4F). Admin nav label "Workflow Briefs" and admin page title are unchanged.

**Client-reachable read endpoints and their sanitization:**

| Endpoint | Client-safe handling |
|---|---|
| `GET /workflow-briefs/:id` | `sanitizeBriefDetailForRole` strips `productionPlans` to safe fields, sanitizes `miReports`/`seoReports` `reportJson`, empties `sourceProjects` |
| `GET /workflow-briefs/:id/mi-report` | `reportJson` reduced via `readMiReportContent` for non-admin |
| `GET /workflow-briefs/:id/seo-report` | `reportJson` reduced via `readSeoReportContent` for non-admin |
| `GET /workflow-briefs/:id/production-plan` | `sanitizeProductionPlanForClient` strips `planJson`/`aiDeliveryProjectId`; `DRAFT`-status plans return `forbidden` for non-admin |
| `POST /workflow-briefs/:id/production-plan/approve` \| `/reject` | requires `SENT_TO_CLIENT` status; response sanitized via `sanitizeProductionPlanForClient` + `sanitizeBriefDetailForRole` |
| `GET /workflow-briefs/:id/release-package` | **fixed in Block 4G** — see below |

**Bug found and fixed (Block 4G):** `buildWorkflowBriefReleasePackageStatus` returned the
raw `releasePackage: data.finalReleasePackageMeta` (internal packaging/automation
metadata) **unconditionally**, alongside the already-sanitized `clientReleasePackage`,
because `getWorkflowBriefReleasePackageStatus` only requires `canAccessClient` (not
`isOwnerRole`) and is therefore reachable by clients. Fixed to `releasePackage: isAdmin ?
data.finalReleasePackageMeta : null`. The frontend never read the raw field (only
`clientReleasePackage`), so admin behavior is unaffected. The existing boundary smoke
assertion passed before the fix only because this brief's release package happened to be
unfinalized (`null`) at test time — strengthened in Block 4G to also assert the absence of
the internal-only marker `packageFingerprint`, which is meaningful regardless of test data
state.

**Admin-only automation controls confirmed hidden from clients** (verified via code
reading of every JSX gate and every underlying mutation function): AI run trigger, seed
content production, generate/regenerate content drafts, package/repackage deliverables,
prepare/refresh image sets, prepare release, finalize release package, execute publication
handoff. Each is either explicitly gated by `canManageAi &&` in the JSX, or the
server-computed status flag (`canSeed`, `canGenerateDrafts`, `canPackageAll`, etc.) is
hard-coded `false` for non-admin — and every underlying mutation function independently
enforces `isOwnerRole` server-side regardless of what the frontend renders.

**Client actions allowed:** view own workflow brief detail (sanitized), view MI/SEO
report content (sanitized), view/approve/reject a `ProductionPlan` once it is
`SENT_TO_CLIENT` (not while `DRAFT`).

**Deferred / requires escalation (not fixed in Block 4G):** ~~`ClientSafeReleasePackage`
(built in `workflow-brief-final-release.execution.ts`, consumed by
`client-portal.runtime.ts`'s `getClientPortalReleasePackage`) includes a
`releasePackageId` field in its client-facing shape.~~ **Fixed in Block 4G-FIX.**

**Bug found and fixed (Block 4G-FIX):** `ClientSafeReleasePackage` (the type shared by
both the `/workflow-briefs/:id/release-package` and
`/client-portal/projects/:id/release-package` endpoints) included a `releasePackageId`
field — explicitly forbidden client-visible content per this project's client-safe
boundary policy, present in the JSON payload (though never rendered as visible UI text).
Removed `releasePackageId` entirely from `ClientSafeReleasePackage`,
`buildClientSafeReleasePackage`, `sanitizeClientSafeReleasePackage` (all in
`workflow-brief-final-release.execution.ts`), and `sanitizeClientPortalReleasePackage`
(in `client-portal.runtime.ts` — required scope expansion, approved by the human operator,
since removing the field from the shared type would otherwise break that file's
compilation). The internal/admin-only `WorkflowBriefFinalReleasePackageRecord.releasePackageId`
(top-level, not part of the client-safe subset) is unchanged and still used for admin
release-package tracking. `toClientSafeReleasePackageFromRecord`'s validity check was
switched from `clientSnapshot.releasePackageId` to `clientSnapshot.finalizedAt` (both are
reliable non-empty markers once a package is genuinely finalized). Boundary smoke
strengthened with data-independent assertions on both endpoints proving `releasePackageId`
never appears in the response text.

## Related docs

- [`docs/ai-delivery-projects-mvp-prd.md`](../ai-delivery-projects-mvp-prd.md)
- [`docs/modules/CLIENT_PORTAL_PLAN.md`](./CLIENT_PORTAL_PLAN.md)
- [`docs/AI_MODULES.md`](../AI_MODULES.md)
