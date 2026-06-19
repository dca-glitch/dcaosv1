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
