# AI Delivery API Contract

Docs-only checklist and current-state contract for the feature branch.

Current state: AI Delivery is local-first and admin/operator-side. Completed foundations on this branch include project/brief records, workflow runs with controlled execution logging, research requests/sources, research summaries, monthly content plan approval, content draft workflow, article image workflow, deliverable packaging, deliverable review admin API/UI, and local AI Delivery regression smoke. Client Access / Client Portal remains intentionally limited until admin/operator modules are stable.

Platform-neutral rule: AI Delivery records, content assets, article images, and deliverables are not modeled as WordPress-only objects. WordPress is only one optional future publishing connector alongside Next.js/custom React, headless CMS, Markdown/MDX, JSON packages, Google Docs, and PDF delivery targets.

Explicitly not active: live AI calls, crawling, real publishing connectors, WordPress-only assumptions, GA/GSC, Resend sending, client portal delivery, public approval links, VPS, or production deployment.

## Current admin workflow order

1. Project + brief
2. Workflow runs
3. Research requests / sources / summaries
4. Content plan approval
5. Content drafts / review foundation
6. Article image workflow
7. Deliverable packaging / reviews
8. Operator summary / project-card workflow navigation
9. Focused smoke coverage

## Locally proven on the current branch

- `npm.cmd run validate` passed for the current admin/operator foundations.
- `npm.cmd run smoke:local` passed as the local API readiness gate for completed implementation slices.
- `npm.cmd run smoke:ai-delivery-reviews` passed twice in focused local regression coverage after browser assertion hardening and fixture isolation.
- Focused smoke now creates dedicated smoke-owned AI Delivery projects instead of selecting an arbitrary existing local AI Delivery project.
- Focused smoke should not mutate real local dev AI Delivery projects when used as intended.

## Focused smoke fixture isolation notes

Purpose: prevent repeated local test data pollution while preserving the existing focused AI Delivery API/browser regression intent.

- Marker: `[SMOKE][AI_DELIVERY_REVIEWS]`
- Cleanup is tenant-scoped.
- Cleanup targets AI Delivery projects only.
- Cleanup is project-level only.
- Cleanup requires the exact marker guard before deletion is allowed.
- Cleanup runs at the start of the focused smoke and again in `finally`.
- The smoke-owned main project and smoke-owned cross-project guard project are both created inside the active local tenant.
- Cleanup must never fuzzy-delete by generic child record names such as `Smoke` alone.

## Current readiness framing

- Admin/operator foundation: mostly ready.
- July-ready internal MVP: partial.
- Full client-facing module: not complete.
- Full AI modules roadmap: early stage.

Backend routes currently expected:

- GET /api/v1/ai-delivery-projects
- POST /api/v1/ai-delivery-projects
- PUT /api/v1/ai-delivery-projects/:id
- POST /api/v1/ai-delivery-projects/:id/archive
- GET /api/v1/ai-delivery-projects/:id/brief
- PUT /api/v1/ai-delivery-projects/:id/brief
- POST /api/v1/ai-delivery-projects/:id/brief/request-client-input
- POST /api/v1/ai-delivery-projects/:id/brief/request-client-revision
- POST /api/v1/ai-delivery-projects/:id/brief/approve-final

Project response summary fields:

- id
- clientId and client { id, name }
- optional projectId and project { id, name }
- name
- targetMonth as `YYYY-MM`
- plannedContentScopeNotes
- isArchived
- brief summary { id, status, createdAt, updatedAt }
- createdAt, updatedAt

Admin brief detail fields:

- status
- clientPriorities
- productsServicesFocus
- targetAudience
- marketsCompetitors
- notes
- revisionCount
- submittedAt
- revisionRequestedAt
- revisedAt
- approvedAt
- createdAt, updatedAt

Admin brief update body:

- clientPriorities optional
- productsServicesFocus optional
- targetAudience optional
- marketsCompetitors optional
- notes optional

Admin form fields:

- Client dropdown required
- Project dropdown optional
- Name required
- Target month required
- Planned content scope notes optional

Frontend checklist:

- Add navigation entry
- Add list view
- Add create modal
- Add edit modal
- Add archive action
- Show client, optional project, target month, brief status, and notes

Validation checklist:

- git --no-pager diff --check
- npm.cmd run validate
- npm.cmd run smoke:local
- set `AUTH_SEED_TEST_EMAIL` and `AUTH_SEED_TEST_PASSWORD`
- npm.cmd run smoke:ai-delivery-reviews
- npm.cmd run smoke:ai-delivery-reviews

Current proof target for the focused smoke:

- stable admin/operator UI structure checks
- dedicated smoke-owned project creation
- pre-run cleanup of prior exact-marker smoke fixtures
- post-run cleanup in `finally`
- no mutation of real local dev AI Delivery projects

Monthly content plan API (backend foundation):

- GET /api/v1/ai-delivery-projects/:id/content-plan
  - Returns latest monthly content plan for the ai delivery project, including items.
  - Response: { contentPlan: { id, aiDeliveryProjectId, status, revisionCount, reviewRequestedAt, approvedAt, items: [{id,title,targetKeyword,contentType,notes,sortOrder,approvalStatus,clientComment,createdAt,updatedAt}], createdAt,updatedAt } }

- POST /api/v1/ai-delivery-projects/:id/content-plan
  - Create a content plan if none exists. Optional body: { items: [ { title, targetKeyword, contentType, notes, sortOrder, approvalStatus, clientComment } ] }
  - Returns created or existing content plan.

- PUT /api/v1/ai-delivery-projects/:id/content-plan
  - Replace/update plan fields and items. Simple deterministic replacement of items.
  - Body: { status?, revisionCount?, items: [...] }

- POST /api/v1/ai-delivery-projects/:id/content-plan/request-client-review
  - Moves status to CLIENT_REVIEW_REQUESTED and sets reviewRequestedAt.

- POST /api/v1/ai-delivery-projects/:id/content-plan/approve
  - Moves status to CLIENT_APPROVED and sets approvedAt.

Notes: Tenant-owned and admin/owner-only endpoints. This is backend-only foundation; no client-facing routes UI in this block.

## Research sources foundation

Research sources are project-scoped manual records used to capture reviewable source inputs for later summaries and content work. They do not fetch remote content and do not trigger crawling.

- `GET /api/v1/ai-delivery/projects/:projectId/research-sources`
  - Lists project-scoped research sources.
  - Optional query param: `researchRequestId`
- `POST /api/v1/ai-delivery/projects/:projectId/research-sources`
  - Body: `{ researchRequestId?, workflowRunId?, sourceUrl, sourceTitle?, sourceType?, status?, reviewNotes? }`
- `PUT /api/v1/ai-delivery/projects/:projectId/research-sources/:researchSourceId`
  - Updates project-scoped source metadata and review notes.

Notes:

- Sources are tenant-owned and optionally linked to a workflow run or research request from the same project.
- Source URLs are validated as HTTP(S) only.
- Records are admin-operated and remain internal until transformed into client-safe summaries.

## Research summaries foundation

Research summaries are project-scoped admin-authored synthesis records. They consolidate approved/manual source findings into a reusable brief/content planning input without exposing raw workflow internals to clients.

- `GET /api/v1/ai-delivery/projects/:projectId/research-summaries`
  - Lists project-scoped research summaries.
- `POST /api/v1/ai-delivery/projects/:projectId/research-summaries`
  - Body: `{ workflowRunId?, title, status, summaryText, keyFindings?, audienceInsights?, competitorInsights?, keywordOpportunities?, contentRecommendations?, briefRevisionNotes?, sourceNotes? }`
- `PUT /api/v1/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId`
  - Updates summary content and status.
- `POST /api/v1/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId/apply-to-brief`
  - Copies the summary into AI Delivery brief notes using the existing admin brief record.

Notes:

- Summaries are tenant-owned and may reference the same-project workflow run that informed the admin synthesis.
- They remain platform-neutral planning inputs for SEO/content work rather than connector-specific publishing records.
- Client-safe review, if resumed later, should expose summary output rather than workflow logs, prompts, or raw source internals.

## Client access foundation for review routes

Client Access / Client Portal must not be treated as current active behavior. Before any AI Delivery client review endpoints or UI are exposed to clients, the system must have an explicitly approved tenant-scoped mapping from an authenticated system user to a client. This prevents relying on email, project ownership assumptions, or implicit tenant membership alone.

Block 7D.0 adds the backend foundation only:

- Data model: `ClientUserAccess`
  - tenant-scoped join between `Tenant`, `Client`, and `User`
  - archives access with `isArchived` rather than deleting historical mapping rows
  - enforces one mapping per `(tenantId, clientId, userId)`
- Admin/owner endpoints:
  - `GET /api/v1/core/clients/:id/users` lists active users linked to a client
  - `POST /api/v1/core/clients/:id/users` with `{ userId }` links an active tenant user to a client
  - `POST /api/v1/core/clients/:id/users/:userId/archive` archives/removes client access
- Internal helper:
  - `userCanAccessClient(authSession, clientId)` verifies active tenant context, client tenant ownership, non-archived user access, and owner/admin override.

AI Delivery client-facing review remains intentionally paused until Client Access / Client Portal is explicitly resumed and approved.

## Monthly content plan client review routes

Current status: paused/future. These routes document a possible authenticated review contract, but Client Access / Client Portal is not active now.

Authenticated tenant users may review monthly content plans only when `userCanAccessClient(authSession, clientId)` passes for the AI Delivery Project client.

- `GET /api/v1/ai-delivery-projects/:id/content-plan/client-review`
  - Returns the monthly content plan for the project when the authenticated user can access the project client.
- `POST /api/v1/ai-delivery-projects/:id/content-plan/client-review/approve`
  - Moves the plan to `CLIENT_APPROVED` and sets `approvedAt`.
- `POST /api/v1/ai-delivery-projects/:id/content-plan/client-review/request-revision`
  - Body: `{ comment }`
  - Moves the plan to `CLIENT_CHANGES_REQUESTED`, increments `revisionCount`, and stores the comment on the first plan item `clientComment` as the existing schema-supported revision note.

No public token routes or magic links are exposed.

## Admin content draft foundation

Admin/owner-only content draft endpoints are scoped to an AI Delivery project and tenant:

- `GET /api/v1/ai-delivery-projects/:id/content-drafts`
  - Lists manual content draft records for the AI Delivery project.
- `POST /api/v1/ai-delivery-projects/:id/content-drafts`
  - Body: `{ contentPlanItemId?, title, slug?, draftBody, status, notes? }`
  - Creates a manual content draft, optionally linked to a monthly content plan item from the same project.
- `PUT /api/v1/ai-delivery-projects/:id/content-drafts/:draftId`
  - Updates title, slug, body, status, notes, and optional content plan item link.
- `POST /api/v1/ai-delivery-projects/:id/content-drafts/:draftId/archive`
  - Archives a draft and sets status to `ARCHIVED`.

Allowed runtime statuses: `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, `CHANGES_REQUESTED`, `ARCHIVED`.

This block is admin-operated only. It does not add AI writing calls, publishing connectors, export/delivery generation, image workflow, or client-facing content review. Content plans must be approved before draft production is treated as ready for downstream packaging.

## Content draft client review routes

Current status: paused/future. Future client review may build on review records later, but client-facing review is not active now.

Content draft review uses normal authenticated sessions only. No public token routes, public approval links, or magic links are exposed. Client access is tenant-scoped and requires `userCanAccessClient(authSession, clientId)` for the AI Delivery Project client. Archived AI Delivery projects and archived content drafts are not exposed to client review routes.

Schema review metadata on `AiDeliveryContentDraft`:

- `reviewRequestedAt DateTime?`
- `approvedAt DateTime?`
- `revisionCount Int @default(0)`
- `clientComment String?`

Admin/owner-only endpoint:

- `POST /api/v1/ai-delivery-projects/:id/content-drafts/:draftId/request-client-review`
  - Sets draft status to `READY_FOR_REVIEW`, sets `reviewRequestedAt`, and clears `approvedAt`.

Authenticated client-safe endpoints:

- `GET /api/v1/ai-delivery-projects/:id/content-drafts/client-review`
  - Lists non-archived content drafts for the AI Delivery project with status `READY_FOR_REVIEW`, `APPROVED`, or `CHANGES_REQUESTED`.
- `POST /api/v1/ai-delivery-projects/:id/content-drafts/:draftId/client-review/approve`
  - Sets draft status to `APPROVED` and sets `approvedAt`.
- `POST /api/v1/ai-delivery-projects/:id/content-drafts/:draftId/client-review/request-revision`
  - Body: `{ comment }`
  - Requires a non-empty comment, sets draft status to `CHANGES_REQUESTED`, increments `revisionCount`, and stores `clientComment`.

If explicitly resumed later, a client UI route such as `#/content-draft-review` must require the user to be signed in before loading reviewable drafts.

## Admin article image foundation

Admin/owner-only article image endpoints are scoped to an AI Delivery project and tenant. Article image requests are manually operated records linked to existing content drafts from the same AI Delivery project.

- `GET /api/v1/ai-delivery-projects/:id/article-images`
  - Lists manual article image request records for the AI Delivery project.
- `POST /api/v1/ai-delivery-projects/:id/article-images`
  - Body: `{ contentDraftId, title, prompt, styleNotes?, status, previewImageUrl?, finalImageUrl?, storageKey?, notes? }`
  - Creates a manual article image request linked to an existing content draft.
- `PUT /api/v1/ai-delivery-projects/:id/article-images/:imageId`
  - Updates the linked content draft, title, prompt, style notes, status, preview URL, final URL, storage key, and notes.
- `POST /api/v1/ai-delivery-projects/:id/article-images/:imageId/archive`
  - Archives an article image request and sets status to `ARCHIVED`.

Allowed runtime statuses: `DRAFT`, `READY_FOR_GENERATION`, `PREVIEW_READY`, `APPROVED`, `FINAL_READY`, `CHANGES_REQUESTED`, `ARCHIVED`.

This block is admin-operated only. It does not add AI image generation, AI calls, upload buttons, R2 write/upload behavior, connector-specific publishing workflow, public/client review, or client approval links.

Article images are platform-neutral deliverable assets. They may later support WordPress, Next.js/custom React, headless CMS, Markdown/MDX, JSON packages, Google Docs, PDF, or other delivery targets through separate adapters, but they are not modeled as WordPress-only media records in this foundation.

## Deliverables foundation

Admin/owner-only deliverable records for packaging approved content drafts and approved/final-ready article image assets. Tenant-scoped and project-scoped; manual records only (no export generation, no uploads, no connector publishing, and no client portal delivery in this block).

- GET /api/v1/ai-delivery-projects/:id/deliverables
  - Lists deliverables for the ai delivery project (tenant-scoped).
  - Response: { deliverables: [{ id, tenantId, aiDeliveryProjectId, contentDraftId?, articleImageId?, title, description?, deliveryType, status, exportUrl?, storageKey?, notes?, isArchived, createdAt, updatedAt }] }

- POST /api/v1/ai-delivery-projects/:id/deliverables
  - Create a deliverable record.
  - Body: { contentDraftId?, articleImageId?, title, description?, deliveryType?, status?, exportUrl?, storageKey?, notes? }
  - Validates linked draft/image belong to same tenant/project when provided.

- PUT /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId
  - Update deliverable fields (title, description, links, deliveryType, status, exportUrl, storageKey, notes).

- POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/mark-ready
  - Moves the deliverable to `READY` when linked assets meet current readiness rules.

- POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/request-revision
  - Moves the deliverable to `REVISION_REQUESTED`.

- POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/accept
  - Moves the deliverable to `ACCEPTED` for internal packaging approval.

- POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/archive
  - Archives the deliverable and sets status to `ARCHIVED`.

- POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/restore
  - Restores an archived deliverable and returns it to `DRAFT`.

Notes: Allowed delivery types: CONTENT_PACKAGE, ARTICLE_DRAFT, ARTICLE_IMAGE, CLIENT_HANDOFF, OTHER. Allowed statuses: DRAFT, READY, DELIVERED, REVISION_REQUESTED, ACCEPTED, ARCHIVED.

Readiness rules:

- Linked `contentDraftId` and `articleImageId` must belong to the same tenant and AI Delivery project.
- A deliverable moving to `READY`, `DELIVERED`, or `ACCEPTED` must have at least one linked approved asset.
- Linked content drafts must be `APPROVED`.
- Linked article images must be `APPROVED` or `FINAL_READY`.
- `exportUrl` is an admin reference only in this block.
- `storageKey` is an internal storage reference only in this block.

This foundation intentionally excludes export generation, publishing connectors, R2 writes/uploads, AI generation calls, signed client downloads, public links, or active client-facing delivery portal behavior. Future client-safe handoff should expose final/reviewable deliverables rather than raw workflow execution internals.

## Deliverable review foundation

Admin/operator-side review records are stored separately from deliverable package records so future client review can be added without changing the current admin data model.

Data model: `AiDeliveryDeliverableReview`

- Tenant-owned through `tenantId`.
- Linked to `AiDeliveryProject` and a required `AiDeliveryDeliverable`.
- Optionally linked to `AiDeliveryWorkflowRun` when a review belongs to a manual workflow run.
- Tracks placeholder review state with `status`, `reviewerName`, and `reviewNotes`.
- Includes `createdAt` and `updatedAt` timestamps.

Allowed review statuses:

- `NOT_STARTED`
- `ADMIN_REVIEW`
- `CHANGES_REQUESTED`
- `APPROVED`
- `ARCHIVED`

Admin/owner-only runtime endpoints:

- `GET /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/reviews`
  - Lists admin/operator deliverable review placeholder records for the deliverable.
  - Enforces tenant ownership and verifies the deliverable belongs to the AI Delivery project.
  - Response: `{ deliverableReviews: [{ id, tenantId, aiDeliveryProjectId, deliverableId, workflowRunId?, status, reviewerName?, reviewNotes?, createdAt, updatedAt }] }`

- `POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/reviews`
  - Creates an admin/operator deliverable review placeholder.
  - Body: `{ status?, reviewerName?, reviewNotes?, workflowRunId? }`
  - Optional `workflowRunId` is accepted only when it belongs to the same tenant and AI Delivery project.

- `PUT /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/reviews/:reviewId`
  - Updates `status`, `reviewerName`, `reviewNotes`, and optional `workflowRunId` for an existing review placeholder.
  - The review must belong to the same tenant, AI Delivery project, and deliverable.
  - Optional `workflowRunId` is accepted only when it belongs to the same tenant and AI Delivery project.

This is a local backend/data/admin foundation only. It intentionally does not add active client login, active client portal routes, public review links, token approvals, real email sending, Resend API key handling, external services, AI calls, crawling, WordPress, GA/GSC, deployment, or VPS behavior. Resend domain verification exists outside this contract; no API key is added and no sending is active.

Admin UX notes:

- The AI Delivery admin UI is intentionally manual and admin-operated. Project cards now include a compact workflow summary (Brief, Content plan, Content drafts, Article images, Deliverables) to help operators quickly review progress without triggering additional background loads.
- Action buttons are ordered to follow the admin flow: Brief -> Content plan -> Content drafts -> Article images -> Deliverables -> Edit -> Archive.
- These are UI-only polish notes; no backend or export behavior is implied.

## Workflow run admin tracking foundation

Workflow run records provide manual admin-run workflow tracking only. They are linked to an AI Delivery Project and use the existing Brief context as the operational baseline for the run.

Tracked fields:

- `status`
- `adminNotes`
- `resultPlaceholder`
- `executionLog`
- `executionError`
- `startedAt`
- `finishedAt`
- `createdAt`, `updatedAt`

Status order:

```text
DRAFT -> READY -> IN_PROGRESS -> REVIEW -> COMPLETED -> ARCHIVED
```

Status gate:

- A workflow run may move only one status step forward at a time.
- Saving the same status is allowed for admin note and result placeholder edits.
- Skipping forward, moving backward, or using an unknown status is outside the accepted workflow-run contract.

Admin/owner-only API endpoints:

- `GET /api/v1/ai-delivery/projects/:projectId/workflow-runs`
  - Lists manual workflow run records for the AI Delivery project.
- `POST /api/v1/ai-delivery/projects/:projectId/workflow-runs`
  - Creates a manual workflow run record linked to the AI Delivery project and existing Brief context.
- `PUT /api/v1/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId`
  - Updates the workflow run status, admin notes, and result placeholder subject to the one-step-forward status gate.
- `POST /api/v1/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId/execute`
  - Runs the current local deterministic execution stub, recording timestamps, log output, success/failure state, and any controlled execution error.

UI location:

- Workflow runs are managed from the Workflow runs action/modal inside AI Delivery project cards.

Explicit exclusions:

- No AI calls.
- No crawling.
- No publishing connector integration.
- No GA/GSC integration.
- No automation or background jobs.
- No deliverable generation.
- No deploy or VPS behavior.
