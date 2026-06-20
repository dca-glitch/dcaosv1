# DCA OS Lite — AI Delivery Projects MVP PRD

## 1. Product name

DCA OS Lite — AI Delivery Projects MVP.

## 2. Roles

- **DCA Admin** operates monthly SEO/content delivery, manages setup, reviews client input, approves briefs, prepares plans, produces content, and controls publishing/release steps.
- **Client** is a future reviewed role for authenticated review/approval flows. Client Access / Client Portal is not active now and is intentionally postponed until admin/operator modules are stable.

## Current state note

AI Delivery is currently admin/operator-side. Completed local foundations include project/brief records, workflow runs, deliverables, deliverable review data, deliverable review admin API, deliverable review admin UI, local deliverable review smoke, and Email Notifications EN1. No AI calls, crawling, WordPress, GA/GSC, Resend sending, client portal, or production deployment has been added.

## 3. Core user outcomes

- DCA manages recurring monthly AI-supported SEO/content delivery inside DCA OS Lite.
- Future clients may use authenticated review flows after Client Access / Client Portal is explicitly resumed and approved.
- Delivery work is structured by client, month, project, brief, content plan, article/image approvals, and later reporting.
- The MVP stays admin-operated and cost-controlled instead of autonomous.

## 4. Ratified monthly AI Delivery workflow

1. Admin creates monthly AI Delivery Project, for example `Client Name — SEO July 2026`.
2. Admin defines planned content scope for the month.
3. Admin collects client priorities, products, and services.
4. Admin may later run research/crawl after explicit approval.
5. Future client review may show research summary / market intelligence.
6. Future client review may allow brief input/revision.
7. Admin approves final brief.
8. Admin may later prepare a monthly content plan with explicitly approved AI assistance.
9. Future client review may allow monthly content plan comments per item.
10. Future client review may allow suggested new topics.
11. Monthly content plan can have multiple revision cycles.
12. After approval, admin produces content.
13. Each article has 1 header image and 2 illustrative images.
14. Future client review may approve each article and image set before publication.
15. Future client review may allow one change request round per article/image set.
16. Future final approval policy needs confirmation before client-facing implementation.
17. Admin may later create real WordPress drafts through API after explicit approval.
18. Admin publishes/releases.
19. System later generates monthly report.
20. Admin approves report.
21. Future client review may show reports and a read-only archive.

## 5. Ratified build sequence

1. AI Delivery Project + Brief Foundation
2. Research Requests + Sources
3. Controlled Crawl / Discovery
4. Research Summary + Brief Revision
5. Monthly Content Plan Approval
6. Content Item Production + Approval
7. WordPress Draft API
8. Monthly Report Foundation
9. GA/GSC Metrics Integration
10. Google Docs Export / Import

## 6. Local implementation order for Build Block 1

1. Docs guardrails
2. Schema/migration only
3. Backend only
4. Frontend only

Each implementation layer is reviewed and validated before the next layer begins.

## 7. Build Block 1 scope

- Monthly AI Delivery Project foundation.
- Required relation to Client.
- Optional relation to existing Project.
- Tenant ownership.
- Admin create/edit/list/archive foundation.
- Client active/archived project visibility foundation.
- Brief form foundation.
- Brief statuses.
- One client brief revision rule.
- Client archive read-only behavior.

Current state clarification: Client Access / Client Portal is not active; client-facing behavior in this PRD is future intent unless separately marked completed.

## 8. Out of scope for Build Block 1

- AI calls.
- Research requests.
- Crawl/discovery.
- Sources.
- Monthly content plan approval.
- Content item production.
- Article/image approval.
- WordPress draft API.
- Monthly reports.
- GA/GSC.
- Google Docs.
- Autonomous agents.
- Finance repair, credit notes, finance reports, billing, or invoicing changes.
- Deployment.

## 9. Draft data model

### `AiDeliveryProject`

- Tenant-owned monthly delivery container.
- Requires Client relation.
- Optional Project relation.
- Stores project name, target month, planned content scope notes, archive state, and timestamps.
- Archived projects are read-only for clients.

### `AiDeliveryBrief`

- Tenant-owned brief attached to one `AiDeliveryProject`.
- Stores client priorities, products/services focus, target audience, markets/competitors, and notes.
- Uses exact status lifecycle:
  - `DRAFT`
  - `CLIENT_INPUT_REQUESTED`
  - `CLIENT_SUBMITTED`
  - `REVISION_REQUESTED`
  - `CLIENT_REVISED`
  - `ADMIN_APPROVED`
- Uses `revisionCount` to support backend enforcement of the one client brief revision rule.

### Relationship and behavior requirements

- Client relation is required for ownership and portal access.
- Project relation is optional.
- Tenant ownership is mandatory on AI Delivery Project and AI Delivery Brief records.
- Client archive behavior is read-only.
- Approval and archive behavior stay authenticated inside DCA OS Lite.

## 10. Tech stack

- React + Vite + TypeScript.
- Node/Express API.
- Prisma/PostgreSQL.
- Local-first development.

## 11. Acceptance criteria for Build Block 1

- AI Delivery Project and AI Delivery Brief foundation exists.
- Tenant ownership is represented.
- Required Client relation is represented.
- Optional Project relation is represented.
- Archive/read-only behavior is represented.
- Brief status lifecycle matches the approved enum.
- `revisionCount` supports the one client brief revision rule.
- Build Block 1 remains local-first and admin-operated.
- Future client access must remain authenticated inside DCA OS Lite when explicitly resumed and approved.

## 12. Cost-control and implementation rules

- New modules start with read-only inspection before edits.
- Work one block and one layer at a time.
- Prompts include a GATE with mode, scope, max commands, max file reads, allowed files, forbidden files, validation rule, commit rule, deploy rule, and stop condition.
- Schema, API, and UI work stay in separate prompts.
- Generated mass rewrite scripts are excluded.
- Commits and deploys require explicit user approval.
- Use the term “monthly content plan,” not “package.”
- Client archive is read-only.
- Public approval links are outside MVP.

## 13. Build Block 1 closure note

Build Block 1 — AI Delivery Project + Brief Foundation is closed for the local foundation layer.

Completed project foundation:

- Admin create, edit, list, and archive behavior.
- Client/project link filtering.
- `targetMonth` persistence.
- Empty-state create action.

Completed brief foundation:

- Open, edit, save, and refresh behavior.
- Brief routes documented.
- Manual brief round-trip passed.

Evidence:

- `npm.cmd run validate` passed.
- `npm.cmd run smoke:local` passed.
- Manual brief round-trip passed.

Explicitly out of scope for this block:

- AI calls.
- Crawling.
- WordPress.
- GA/GSC.
- Deployment.
- Deliverable generation.
- Automation or background agents.

Next intended block: AI Delivery Workflow Foundation / admin-run workflow. AI calls remain out of scope unless separately approved.

## 14. Build Block 2 contract — Workflow run admin tracking

Build Block 2 adds a manual Workflow Run tracking layer for AI Delivery Projects.

Workflow run records exist for manual admin-run workflow tracking only. Each record is linked to an AI Delivery Project and uses the existing Brief context as the operational baseline for tracking the run. The record is not an automation trigger and does not imply AI, crawl, publishing, analytics, or delivery execution.

Tracked fields:

- `status`
- `adminNotes`
- `resultPlaceholder`
- `createdAt`, `updatedAt`

Approved status order:

```text
DRAFT -> READY -> IN_PROGRESS -> REVIEW -> COMPLETED -> ARCHIVED
```

Approved status gate:

- One-step forward transitions only.
- Same-status saves are allowed for admin notes and result placeholder edits.
- Backward transitions and skipped forward transitions are excluded.

API endpoints:

- `GET /api/v1/ai-delivery/projects/:projectId/workflow-runs`
- `POST /api/v1/ai-delivery/projects/:projectId/workflow-runs`
- `PUT /api/v1/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId`

UI location:

- Workflow runs action/modal inside AI Delivery project cards.

Explicitly out of scope for Build Block 2:

- AI calls.
- Crawling.
- WordPress.
- GA/GSC.
- Automation.
- Background jobs.
- Deliverable generation.
- Deploy/VPS.

## 15. Build Block 2 closure note

Build Block 2 — AI Delivery Workflow Run Foundation is closed for the local manual admin-run workflow layer.

Completed BB2 slices:

- 2A workflow run backend/schema/API foundation.
- 2B workflow run minimal UI.
- 2C workflow run status gate.
- Result placeholder exists and is editable.
- Validation passed.
- Manual UI QA passed.
- No deploy or VPS actions were performed.

Closure evidence:

- Current synced head: `f118c0f Gate AI Delivery workflow run statuses`.
- `npm.cmd run validate` passed for the completed block before closure documentation.
- Manual UI QA passed for the workflow runs action/modal inside AI Delivery project cards.

Explicit exclusions confirmed at closure:

- No AI calls.
- No crawling.
- No WordPress.
- No GA/GSC.
- No automation.
- No background jobs.
- No deliverable generation.
- No deploy/VPS.

## 16. Current foundation alignment note

The current approved AI Delivery foundation is local-first and admin/operator-side:

- Project/brief foundation is complete.
- Workflow run foundation is complete.
- Deliverables foundation is complete.
- Deliverable review data foundation is complete.
- Deliverable review admin API is complete.
- Deliverable review admin UI is complete.
- Local deliverable review smoke script exists.
- Email notification backend foundation EN1 exists only.

Still not implemented or active:

- AI calls.
- Crawling.
- WordPress publishing/draft creation.
- GA/GSC integration.
- Resend sending or API key handling.
- Client Portal / active Client Access workflows.
- Public approval links.
- Production deployment or VPS behavior.

EN2 email event wiring remains paused until modules are stable.
