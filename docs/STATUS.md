# Status

## Current Phase

DCA OS Lite is in local-first admin/operator foundation work. Production is frozen unless explicitly approved.

## Completed Local Foundations

- Repository/workspace, validation, CI, dependency monitoring, and documentation foundations.
- Local auth/session/tenant/module foundations.
- Dark Nebula frontend UI direction and reusable UI foundation.
- Data-dense admin UI foundation phase 1/2: AI Delivery, Clients, Invoices, Projects, Tasks, Services Library, Bills/Vendors, and Credit Notes now use compact operator rows, dimmed routine buttons, small status chips, and quieter secondary action menus while preserving business logic.
- Plain-language operator documentation set added in `docs/operator`: admin operator manual, client delivery SOP, pre-production readiness checklist, deferred scope register, and module completion matrix.
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
- Client Access Admin UI foundation closed for MVP: owner/admin users can grant, list, and revoke tenant-scoped client-level `ClientUserAccess`; Client Portal remains read-only and restricted to final client-safe data.
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

## Current Constraints

- Work is local-first on Windows PowerShell.
- ChatGPT controls/reviews scope; Codex/Copilot/local tooling executes sealed tasks.
- No commit, push, deploy, VPS, or production action unless explicitly approved after review.
- Admin UI direction is data-first/operator-dense: overview screens should prefer compact rows/tables, dimmed non-flashy routine buttons, small status chips, and one main visible action per record over oversized card/button walls.
- Plain-language admin/client documentation should be kept aligned with behavior so non-technical users can understand what is active, what is final, and what remains deferred.
- Client Portal archive is read-only; client review/actions remain intentionally deferred.
- Client access is client-level in the current schema. Project-specific grants require a separately approved schema/API block.
- AI Delivery defaults to local deterministic execution. OpenRouter-capable text execution code exists but is opt-in by env config and is not production-approved by default. Crawling, WordPress publishing, GA/GSC, Resend sending, and production deployment remain inactive unless explicitly approved.
- AI provider runtime/cost guardrail foundation is closed for the current admin MVP as a guarded, local-first foundation; persistent provider cost metadata, deeper provider observability, dedicated provider smoke, and production/live provider proof remain deferred.
- EN2 real provider sending and queues/background jobs remain inactive.
- Production/VPS remains frozen unless explicitly approved.

## AI SEO / Content Plan closure

Latest implementation commit: `031c215 Polish AI SEO admin workflow shell`

AI SEO admin-operated MVP shell is in place.

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

Still deferred:

- live crawling
- Google OAuth / live GSC sync
- client-facing metrics exposure
- automatic PDF generation / R2 stash
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
