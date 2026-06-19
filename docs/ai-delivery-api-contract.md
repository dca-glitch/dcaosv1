# AI Delivery API Contract

Docs-only checklist for the feature branch.

Backend routes currently expected:

- GET /api/v1/core/ai-delivery-projects
- POST /api/v1/core/ai-delivery-projects
- PUT /api/v1/core/ai-delivery-projects/:id
- POST /api/v1/core/ai-delivery-projects/:id/archive

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
