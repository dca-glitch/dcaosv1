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

**Block 6C-v1 (implemented):** admin read-only visibility of safe `knowledgeContext` metadata on
Workflow Briefs admin UI (MI/SEO run, production plan generation, content draft
generation/regeneration). Displays `used` / `selectedCount` / `selectedItemTitles` /
`skippedReason` / `sanitizeFlagCount` / `trimmed` only — no raw `contextPreview`,
`contextSection`, `selectedSourcesJson`, or knowledge bodies. `getWorkflowBriefById` projects
safe run metadata for admin without exposing `inputSnapshotJson` internals. Not client-visible.

**Block 6C-v2 (deferred):** UI knowledge picker / override on brief screens.

**Block 6D (deferred):** dedicated `AiContextSnapshot` audit rows per brief run (`briefId` FK
does not exist today).

## What AiDelivery owns

- `AiDeliveryProject` — the canonical project record.
- Content plan, content drafts, article images, deliverables, deliverable reviews.
- Exports (Google Docs), the draft-only WordPress handoff boundary, and monthly reports.
- Final archive surfaces for client-safe delivery after the handoff chain completes.
- The admin production workspace (`AiDeliveryPage.tsx`) for direct manual CRUD across all
  of the above, independent of whether a WorkflowBrief was ever involved.

## Puriva operator path

When WorkflowBriefs feeds a real Puriva delivery, the downstream sequence is:

**Intake → Plan → Compliance Review → Drafts → Packaging → Handoff → Archive**

Verified facts move through the path in this order:

**Puriva intake facts → approved knowledge/context → WorkflowBriefs brief → MI/SEO reports → production plan → AI Delivery seed/handoff**

1. **Intake validation:** Brief must have goal, business context, target audience, and offer context (at minimum). See [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) for Puriva-specific content guardrails.
2. **AI planning:** Run AI to generate MI/SEO reports; generate production plan from reports.
3. **Compliance review checkpoint:** Admin verifies all claims, medical language, contact facts, and service descriptions against [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md). **This is manual and non-optional.** Flag any unverified claims before seeding content.
4. **Seed content:** Create content items from approved production plan.
5. **Generate drafts:** AI creates article drafts from seeded items.
6. **Package deliverables:** Wrap drafts + images into deliverables for client review.
7. **Draft-only WordPress handoff:** Prepare for WordPress staging.
8. **Final archive + monthly report:** After client approval, publish to archive and generate monthly report.

**Key rule:** No AI-generated draft should reach client review until compliance review is **explicitly documented** in brief notes or plan body. Compliance review stays between planning and draft generation.

**Approved-only rule:** unverified claims, contact facts, partner wording, or medical certainty stay in notes or review comments only. They do not become approved knowledge, SEO plan language, or client-visible output until verified.

## Intake validation requirements

For a brief to be eligible for AI planning and production, it must have:

| Field | Requirement | Puriva guidance |
|---|---|---|
| Goal | Required. Clear, specific client outcome | *Example:* "Rank for Wegovy treatment inquiries in Bali"; "Build trust around aesthetic services" |
| Business context | Required. What does the clinic do? | *Verify against [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) section 2 (clinic profile) and section 6 (services).* Do not assume services exist. |
| Target audience | Required. Who is reading? | *Must match section 17 (target audiences).* Example: "Indonesian local clients" or "international medical-tourism visitors" |
| Offer context | Required. What is the specific offer or call-to-action? | *Must be verifiable.* Do not promise outcomes, prescriptions, or partners. Use "consultation-based" language per section 7–9. |
| Location context | Optional but recommended. Where is the clinic? Service area? | *If present, must be factual.* Verify against section 2 and section 4 (languages/service areas). |
| Notes | Optional. Admin can document intake review notes or Puriva compliance findings here. | *Document any verified/unverified claims, required approvals, or compliance flags.* |

**Missing-input behavior:** If any required field is empty, the UI shows a warning banner and blocks progression to AI planning. The banner text reads: *"Complete the intake before generating reports: [list missing fields]."*

## Compliance review requirements

Before any draft reaches client review, an admin must verify:

1. **All claims are supported by [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md)** — use sections 2 (clinic profile), 6 (services), 7–9 (constraint topics) to test each assertion in the production plan.
2. **No prohibited language** — see section 11 (prohibited claims). Flag and remove any "guaranteed," "cure," "instant," "best," "permanent," "no risk," "official partner" without proof.
3. **Medical language is cautious** — use "consultation-based," "educational," "may support," "designed to" instead of outcome promises.
4. **Contact facts are current** — phone, email, address, booking URL must be verified before appearing in drafts.
5. **Partner/affiliate claims have evidence** — do not state "partner," "authorized," "certified," or "exclusive" without documentation.
6. **Service descriptions match approved categories** — only mention services confirmed in section 6 of the compliance doc.

**Documentation pattern:** Add a note to the brief's `notes` field or production plan body documenting the review:

```
COMPLIANCE REVIEW [DATE] [ADMIN]:
✓ Verified clinic profile against PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md section 2
✓ All claims use "consultation-based" language per section 7–9
✓ No prohibited cure/guarantee claims found
✓ Contact facts verified with clinic ops
✗ FLAGGED: Stem cell therapy claim pending medical reviewer approval (section 8)
→ ACTION: await medical reviewer sign-off before draft generation
```

**UI surface:** The production plan section now shows a "Compliance review status" field (optional) where the admin can document findings before seeding content. The field is admin-only and never visible to clients.



## How the two connect (confirmed by code evidence)

- WorkflowBriefs writes directly into AiDelivery's shared production tables:
  `AiDeliveryContentDraft`, `AiDeliveryArticleImage`, and `AiDeliveryDeliverable`.
  `AiDeliveryDeliverable` carries optional `briefId` / `productionPlanId` fields used purely
  for provenance — the row itself is the same shared record type the admin UI manages
  manually.
- WorkflowBriefs reuses AiDelivery's WordPress draft-preparation primitive
  (`prepareAiDeliveryDeliverableWordPressDraft`) for its draft-only handoff instead of
  duplicating that logic.
- `AiDeliveryBrief` is the simpler, older, project-attached brief concept (client priorities,
  products/services focus, target audience, markets/competitors — four free-text fields).
  `Brief` (WorkflowBrief) is the richer, composable intake/context layer. Both currently
  exist; neither has been removed or scheduled for removal.

**Legacy `ClientMonthlyBrief` (XXL 4A — separate intake, not WorkflowBriefs):** `/api/v1/briefs`
and client routes `#/briefs` / `#/client-portal/briefs` (`BriefPage`) remain **active
legacy/compatibility intake** for monthly/additional content-count briefs (`ClientMonthlyBrief`
→ DB table `Brief`). This is **not** the WorkflowBrief `Brief` model and is **not** connected
to WorkflowBriefs production automation or AiDelivery shared production tables. Do not remove
or migrate without a separate approved product deprecation block. Optional future naming/nav
polish only.

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
`workflowRunId`, `executionLog`, or draft internals unless explicitly exposed as review/final
output. **`sourceType` on workflow/deliverable internals remains forbidden.** On FINAL
monthly report detail, `performanceSummary.sourceType` (and related provenance fields such as
`manualSource` / `disclaimer`) may be exposed intentionally as client-safe metric provenance
per [`docs/modules/CLIENT_PORTAL_PLAN.md`](./CLIENT_PORTAL_PLAN.md).

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
