# Status

## Current Phase

DCA OS Lite is in local-first admin/operator foundation work. Production is frozen unless explicitly approved.

**Block 2C refresh baseline:** PRs #38–#43 are merged on `main` and the current baseline is `f8606f2`. The Dark Nebula UI pass, AI Delivery workspace sectioning, Workflow Briefs cleanup, client-facing polish, dashboard audit feed smoke alignment, and client-only `#/client-portal` access fix are all part of the current source of truth. No deploy was performed.

Historical post-merge record: [`docs/operator/post-merge-completion-status-20260627.md`](./operator/post-merge-completion-status-20260627.md). Current source of truth for post-PR #38–#43 state is this document. PR #13 is merged into `main`, local `main` is validated, and the local pre-staging proof was accepted; current `main` is **not deployed** to production. `system.digitalcubeagency.net` is a live production VPS target, not a confirmed staging target.

**AI operating baseline (merged on `main`):** PR #33 (AI Gateway v1 + AI workflow smoke matrix) at `a0bd879`; PR #34 (AI Operations Console v1) at `f7cb7a0`. Default AI execution is **local/deterministic**; OpenRouter/live provider remains **opt-in and not production-proven**. AI Operations Console is **admin-only** and covers AI Delivery workflow runs (MI runs listing deferred to closeout v1.1).

## Completed Local Foundations

- Repository/workspace, validation, CI, dependency monitoring, and documentation foundations.
- Local auth/session/tenant/module foundations.
- Dark Nebula frontend UI direction and reusable UI foundation.
- Data-dense admin UI foundation phase 1/2: AI Delivery, Clients, Invoices, Projects, Tasks, Services Library, Bills/Vendors, and Credit Notes now use compact operator rows, dimmed routine buttons, small status chips, and quieter secondary action menus while preserving business logic.
- Plain-language operator documentation set added in `docs/operator`: admin operator manual, client delivery SOP, pre-production readiness checklist, deferred scope register, and module completion matrix.
- Project completion overview by area/module: [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md).
- Phase F local completion roadmap (Blocks 58–77): [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md).
- AI Delivery project/brief foundation.
- AI Delivery workflow run foundation.
- AI Delivery deliverables foundation.
- AI Delivery deliverable review data foundation, admin API, admin UI, and local smoke script.
- AI Delivery deliverable export/download admin actions.
- AI Delivery export handoff foundation: exportUrl client-visibility clarified, PDF upload path confirmed, and Google Docs deliverable export admin UI action completed.
- AI Delivery client portal archive proof hardening and contract note.
- AI Delivery client delivery readiness closure checkpoint and smoke index.
- AI Delivery monthly report phase 1 schema-free summary API closure.
- AI Delivery monthly report phase 2 persisted model + admin CRUD API.
- AI Delivery monthly report admin UI + browser smoke closure.
- AI Delivery monthly metrics snapshot foundation (admin-only, snapshot-first, trend summary from approved snapshots).
- AI Delivery monthly report PDF generation foundation (admin-triggered, private-storage-backed, same document slot).
- AI Delivery monthly report PDF admin UI action and focused smoke wiring.
- Client Portal monthly reports archive route + browser proof closure.
- Monthly Report PDF/upload/signed download admin and client portal endpoints implemented and local-smoke-proven.
- Current route map:
  - `#/client-portal` → ClientPortalPage / **Your archive**
  - `#/archive` → ArchiveHubPage / **Archive**
  - `#/monthly-reports` → MonthlyReportsPage
  - `#/client-portal/pending-approvals` → PendingApprovalsPage
  - `#/client-portal/briefs` → BriefPage
  - `#/client-portal/deliverables/:id/approve` → ArticleApprovalEditor
- Client Access Admin UI foundation closed for MVP: owner/admin users can grant, list, and revoke tenant-scoped client-level `ClientUserAccess`; Client Portal remains read-only and restricted to final client-safe data.
- AI Gateway v1 merged on `main` (PR #33): guarded provider config, local deterministic default, AI knowledge context, workflow execution observability metadata.
- AI workflow smoke matrix merged on `main` (PR #33): `npm run smoke:ai-matrix` sequential local AI proof pack.
- AI Operations Console v1 merged on `main` (PR #34): admin-only read-only review of AI Delivery workflow runs, gateway/mode/context/status/error metadata; local + browser smokes.
- AI Delivery operator summary, AI SEO foundation UI, AI SEO admin workflow shell/status summary, and AI Content Production foundation UI.
- AI Content Production completion shell with explicit draft → image planning → deliverable packaging → private export/WordPress handoff clarity.
- Local R2 proof confirmed with `R2_BUCKET_NAME=dca` using admin-only private upload/download flows; the production/VPS R2 switch remains deferred until an explicit deploy block.
- Market Intelligence admin MVP closure note documented.
- Email Notifications EN1 backend foundation only.
- EN2 schema-free platform AuditLog writer foundation for logout, tenant switch, tenant settings update, and module enable/disable.
- API security headers/CSP baseline and in-memory MVP rate limiting.
- Market Intelligence auth token storage aligned to sessionStorage.
- Market Intelligence research input fields (keywords, competitors, niche, productServiceFocus, targetClientName, targetMonth) added to schema/API/UI; audienceSignals added to insight result contract; migration applied and smoke proven (all steps pass).
- Market Intelligence internal handoff bridge implemented: admin can prepare an internal handoff from any APPROVED insight; handoff stores marketSummary, audienceSignals, opportunities, risks, recommendedActions, sourceNote, and client/month context; status lifecycle DRAFT → READY → APPLIED; admin-only, no client portal exposure; schema migration applied and all 14 smoke steps pass.
- AI Delivery Market Intelligence context integration implemented: admin can attach a READY MI handoff to an AI Delivery project as internal context; new API endpoints (list/apply/remove context), compact UI section in AI Delivery page, and aiDeliveryProjectId field added to MarketIntelligenceHandoff; schema migration applied and full smoke proven (Step 14 all passes including DRAFT rejection and remove/revert lifecycle).
- Monthly Report Market Intelligence context implemented: admin-only monthly reports can reference applied MI handoffs through internal context fields and admin UI; focused smoke coverage added in `scripts/smoke-monthly-report-mi-context-local.mjs` for apply/get/update/remove lifecycle and Client Portal non-exposure guard.
- Backup/restore and staging migration runbooks added.
- Finance smoke proves tenantId spoof handling locally and keeps full cross-tenant proof behind a real second-tenant fixture.
- PR #13 merged to `main` at `584e041bd85e8179e795a0e4621a0d9d8908e0b6`; follow-up docs commit on `main`: `07b1f1668d11cdef42b195cfad189c4df645acc6`.
- Local `main` validation passed after Windows Prisma DLL lock cleanup; local pre-staging proof was accepted after isolated Finance admin browser smoke passed following local admin restore and API/Web restart.

## Current Constraints

- Work is local-first on Windows PowerShell.
- ChatGPT controls/reviews scope; Codex/Copilot/local tooling executes sealed tasks.
- No commit, push, deploy, VPS, or production action unless explicitly approved after review.
- Admin UI direction is data-first/operator-dense: overview screens should prefer compact rows/tables, dimmed non-flashy routine buttons, small status chips, and one main visible action per record over oversized card/button walls.
- Plain-language admin/client documentation should be kept aligned with behavior so non-technical users can understand what is active, what is final, and what remains deferred.
- Client Portal MVP is required for Puriva client delivery; portal shows client-safe final data only. Advanced client actions (approve/comments/magic links) remain phased after MVP visibility scope.
- Client access is client-level in the current schema. Project-specific grants require a separately approved schema/API block.
- AI Delivery defaults to local deterministic execution. OpenRouter-capable text execution code exists but is opt-in by env config and is not production-approved by default. Crawling, WordPress publishing, GA/GSC, Resend sending, and production deployment remain inactive unless explicitly approved.
- Client-only users can access `#/client-portal` and remain blocked from admin-only routes.
- AI Gateway v1 and AI Operations Console v1 are on `main` for local/admin operator use only; no VPS deploy or live provider production proof is implied.
- AI provider runtime/cost guardrail foundation is closed for the current admin MVP as a guarded, local-first foundation; token/cost fields in workflow results are **estimates from execution metadata**, not billing records. Persistent provider cost analytics, per-tenant spend caps, full multi-provider router, and production/live provider proof remain deferred.
- EN2 real provider sending and queues/background jobs remain inactive.
- Production/VPS remains frozen unless explicitly approved.
- Merge to `main` does not mean production deployment; current `main` deployed to production is 0%, confirmed staging target is 0%, and production deployment of current `main` is 0%.

## AI SEO / Content Plan closure

Latest implementation commit: `031c215 Polish AI SEO admin workflow shell`

AI SEO admin-operated MVP shell is in place.

Block 3 planning should happen before any broader AI SEO implementation. The current repo state is deterministic/local-first, with live crawling, Google OAuth / live GSC sync, autonomous SEO agents, and production deploy all still deferred.

Completed admin-operated pieces:

- research requests
- manual/admin research sources
- research summaries
- apply summary to brief
- content plan creation
- content plan edit/status actions
- workflow-generated content plan
- draft generation handoff
- admin AI SEO workflow shell/status summary
- focused AI Delivery smoke coverage
- **admin-only content plan PDF export + private storage (Block 3B)**
- **content plan PDF export hardening + App.tsx wiring (Block 3D)**
- **content plan PDF handoff readiness state in admin UI (Block 3E)** — reuses the existing download-reference endpoint to show ready/not-ready state and gates the Download PDF button; no schema or endpoint changes
- **stale PDF invalidation on plan edit (Block 3F)** — item edits and status changes (review/approve/changes-requested, admin and client-facing) now clear the stored PDF reference so admins are never shown a stale document as ready
- **WorkflowBriefs vs AiDelivery architecture clarification (Block 4B/4C)** — WorkflowBriefs is a confirmed active intake/context-composition + production-automation layer, not legacy and not a duplicate production workspace; it writes into AiDelivery's shared production tables. See [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./modules/WORKFLOW_BRIEFS_MODULE_PLAN.md).

Still deferred:

- live crawling
- Google OAuth / live GSC sync
- client-facing metrics exposure
- Google Docs export for the AI SEO content-plan shell
- production deploy
- autonomous SEO agents

## Current Repository Areas

- apps/api
- apps/web
- packages/shared
- packages/data
- docs
- scripts
- tests

## Next Work

- Keep foundational docs/rules aligned with current assumptions.
- Keep security/client-readiness docs aligned with completed baseline work and remaining deferred items.
- Stabilize AI Delivery admin/operator workflows with repeatable validation/smoke scripts.
- Resume broader EN2 notification delivery only after explicit approval.
- Treat future client review as a later design/build block, not current behavior.
- Use this document as the source of truth for the next AI SEO / AI Delivery planning block.
