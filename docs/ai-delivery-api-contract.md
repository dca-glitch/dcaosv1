# AI Delivery API Contract

Docs-only checklist for the feature branch.

Backend routes currently expected:

- GET /api/v1/core/ai-delivery-projects
- POST /api/v1/core/ai-delivery-projects
- PUT /api/v1/core/ai-delivery-projects/:id
- POST /api/v1/core/ai-delivery-projects/:id/archive
- GET /api/v1/core/ai-delivery-projects/:id/brief
- PUT /api/v1/core/ai-delivery-projects/:id/brief
- POST /api/v1/core/ai-delivery-projects/:id/brief/request-client-input
- POST /api/v1/core/ai-delivery-projects/:id/brief/request-client-revision
- POST /api/v1/core/ai-delivery-projects/:id/brief/approve-final

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
- npm.cmd run smoke:browser

Monthly content plan API (backend foundation):

- GET /api/v1/core/ai-delivery-projects/:id/content-plan
  - Returns latest monthly content plan for the ai delivery project, including items.
  - Response: { contentPlan: { id, aiDeliveryProjectId, status, revisionCount, reviewRequestedAt, approvedAt, items: [{id,title,targetKeyword,contentType,notes,sortOrder,approvalStatus,clientComment,createdAt,updatedAt}], createdAt,updatedAt } }

- POST /api/v1/core/ai-delivery-projects/:id/content-plan
  - Create a content plan if none exists. Optional body: { items: [ { title, targetKeyword, contentType, notes, sortOrder, approvalStatus, clientComment } ] }
  - Returns created or existing content plan.

- PUT /api/v1/core/ai-delivery-projects/:id/content-plan
  - Replace/update plan fields and items. Simple deterministic replacement of items.
  - Body: { status?, revisionCount?, items: [...] }

- POST /api/v1/core/ai-delivery-projects/:id/content-plan/request-client-review
  - Moves status to CLIENT_REVIEW_REQUESTED and sets reviewRequestedAt.

- POST /api/v1/core/ai-delivery-projects/:id/content-plan/approve
  - Moves status to CLIENT_APPROVED and sets approvedAt.

Notes: Tenant-owned and admin/owner-only endpoints. This is backend-only foundation; no client-facing routes UI in this block.

## Client access foundation for review routes

Before any AI Delivery client review endpoints or UI are exposed, the system must have an explicit tenant-scoped mapping from an authenticated system user to a client. This prevents relying on email, project ownership assumptions, or implicit tenant membership alone.

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

AI Delivery client review routes remain intentionally out of scope until this helper is used by the review endpoints.

## Monthly content plan client review routes

Authenticated tenant users may review monthly content plans only when `userCanAccessClient(authSession, clientId)` passes for the AI Delivery Project client.

- `GET /api/v1/core/ai-delivery-projects/:id/content-plan/client-review`
  - Returns the monthly content plan for the project when the authenticated user can access the project client.
- `POST /api/v1/core/ai-delivery-projects/:id/content-plan/client-review/approve`
  - Moves the plan to `CLIENT_APPROVED` and sets `approvedAt`.
- `POST /api/v1/core/ai-delivery-projects/:id/content-plan/client-review/request-revision`
  - Body: `{ comment }`
  - Moves the plan to `CLIENT_CHANGES_REQUESTED`, increments `revisionCount`, and stores the comment on the first plan item `clientComment` as the existing schema-supported revision note.

No public token routes or magic links are exposed.

## Admin content draft foundation

Admin/owner-only content draft endpoints are scoped to an AI Delivery project and tenant:

- `GET /api/v1/core/ai-delivery-projects/:id/content-drafts`
  - Lists manual content draft records for the AI Delivery project.
- `POST /api/v1/core/ai-delivery-projects/:id/content-drafts`
  - Body: `{ contentPlanItemId?, title, slug?, draftBody, status, notes? }`
  - Creates a manual content draft, optionally linked to a monthly content plan item from the same project.
- `PUT /api/v1/core/ai-delivery-projects/:id/content-drafts/:draftId`
  - Updates title, slug, body, status, notes, and optional content plan item link.
- `POST /api/v1/core/ai-delivery-projects/:id/content-drafts/:draftId/archive`
  - Archives a draft and sets status to `ARCHIVED`.

Allowed runtime statuses: `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, `CHANGES_REQUESTED`, `ARCHIVED`.

This block is admin-operated only. It does not add AI writing calls, WordPress publishing, export/delivery workflow, image workflow, or client-facing content review.

## Content draft client review routes

Content draft review uses normal authenticated sessions only. No public token routes, public approval links, or magic links are exposed. Client access is tenant-scoped and requires `userCanAccessClient(authSession, clientId)` for the AI Delivery Project client. Archived AI Delivery projects and archived content drafts are not exposed to client review routes.

Schema review metadata on `AiDeliveryContentDraft`:

- `reviewRequestedAt DateTime?`
- `approvedAt DateTime?`
- `revisionCount Int @default(0)`
- `clientComment String?`

Admin/owner-only endpoint:

- `POST /api/v1/core/ai-delivery-projects/:id/content-drafts/:draftId/request-client-review`
  - Sets draft status to `READY_FOR_REVIEW`, sets `reviewRequestedAt`, and clears `approvedAt`.

Authenticated client-safe endpoints:

- `GET /api/v1/core/ai-delivery-projects/:id/content-drafts/client-review`
  - Lists non-archived content drafts for the AI Delivery project with status `READY_FOR_REVIEW`, `APPROVED`, or `CHANGES_REQUESTED`.
- `POST /api/v1/core/ai-delivery-projects/:id/content-drafts/:draftId/client-review/approve`
  - Sets draft status to `APPROVED` and sets `approvedAt`.
- `POST /api/v1/core/ai-delivery-projects/:id/content-drafts/:draftId/client-review/request-revision`
  - Body: `{ comment }`
  - Requires a non-empty comment, sets draft status to `CHANGES_REQUESTED`, increments `revisionCount`, and stores `clientComment`.

The client UI route is `#/content-draft-review` and requires the user to be signed in before loading reviewable drafts.

## Admin article image foundation

Admin/owner-only article image endpoints are scoped to an AI Delivery project and tenant. Article image requests are manually operated records linked to existing content drafts from the same AI Delivery project.

- `GET /api/v1/core/ai-delivery-projects/:id/article-images`
  - Lists manual article image request records for the AI Delivery project.
- `POST /api/v1/core/ai-delivery-projects/:id/article-images`
  - Body: `{ contentDraftId, title, prompt, styleNotes?, status, previewImageUrl?, finalImageUrl?, storageKey?, notes? }`
  - Creates a manual article image request linked to an existing content draft.
- `PUT /api/v1/core/ai-delivery-projects/:id/article-images/:imageId`
  - Updates the linked content draft, title, prompt, style notes, status, preview URL, final URL, storage key, and notes.
- `POST /api/v1/core/ai-delivery-projects/:id/article-images/:imageId/archive`
  - Archives an article image request and sets status to `ARCHIVED`.

Allowed runtime statuses: `DRAFT`, `READY_FOR_GENERATION`, `PREVIEW_READY`, `APPROVED`, `FINAL_READY`, `CHANGES_REQUESTED`, `ARCHIVED`.

This block is admin-operated only. It does not add AI image generation, AI calls, upload buttons, R2 write/upload behavior, WordPress/export workflow, public/client review, or client approval links.

## Deliverables foundation

Admin/owner-only deliverable records for packaging approved content or image requests. Tenant-scoped and project-scoped; manual records only (no export generation, no uploads, no WordPress/R2/client portal).

- GET /api/v1/core/ai-delivery-projects/:id/deliverables
  - Lists deliverables for the ai delivery project (tenant-scoped).
  - Response: { deliverables: [{ id, tenantId, aiDeliveryProjectId, contentDraftId?, articleImageId?, title, description?, deliveryType, status, exportUrl?, storageKey?, notes?, isArchived, createdAt, updatedAt }] }

- POST /api/v1/core/ai-delivery-projects/:id/deliverables
  - Create a deliverable record.
  - Body: { contentDraftId?, articleImageId?, title, description?, deliveryType?, status?, exportUrl?, storageKey?, notes? }
  - Validates linked draft/image belong to same tenant/project when provided.

- PUT /api/v1/core/ai-delivery-projects/:id/deliverables/:deliverableId
  - Update deliverable fields (title, description, links, deliveryType, status, exportUrl, storageKey, notes).

- POST /api/v1/core/ai-delivery-projects/:id/deliverables/:deliverableId/archive
  - Archives the deliverable and sets status to `ARCHIVED`.

Notes: Allowed delivery types: CONTENT_PACKAGE, ARTICLE_DRAFT, ARTICLE_IMAGE, CLIENT_HANDOFF, OTHER. Allowed statuses: DRAFT, READY, DELIVERED, REVISION_REQUESTED, ACCEPTED, ARCHIVED.

This foundation intentionally excludes any export generation, WordPress publishing, R2 writes/uploads, AI generation calls, or client-facing delivery portal - those are out of scope for Block 7I.

Admin UX notes:

- The AI Delivery admin UI is intentionally manual and admin-operated. Project cards now include a compact workflow summary (Brief, Content plan, Content drafts, Article images, Deliverables) to help operators quickly review progress without triggering additional background loads.
- Action buttons are ordered to follow the admin flow: Brief -> Content plan -> Content drafts -> Article images -> Deliverables -> Edit -> Archive.
- These are UI-only polish notes; no backend or export behavior is implied.
