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
