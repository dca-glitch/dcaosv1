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
  - `#/client-portal` → ClientPortalPage / **Your archive** (canonical live client monthly reports: list, detail, download)
  - `#/archive` → ArchiveHubPage / **Archive**
  - `#/monthly-reports` → MonthlyReportsPage → `ClientPortalRouter` / **Your archive** (same live monthly reports UI as `#/client-portal`)
  - `#/client-portal/pending-approvals` → PendingApprovalsPage
  - `#/client-portal/briefs` → BriefPage (legacy `ClientMonthlyBrief` intake — active, not WorkflowBriefs)
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
- **Market Intelligence Mega Block 1 (core execution foundation):** admin findings (`MarketIntelligenceFinding`) and deterministic summaries (`MarketIntelligenceSummary` + `MI_SUMMARY_V1` integration context); CRUD/generate/finalize APIs; admin UI panels for findings and MI summary; focused `scripts/smoke-mi-core-execution-local.mjs` + updated operator browser smoke.
- **Market Intelligence Mega Block 2 (delivery integration):** finalized `MI_SUMMARY_V1` summaries can be applied to AI Delivery context/brief, SEO planning notes (`plannedContentScopeNotes`), and monthly report recommendations/internal context; admin-only APIs + MI/AI Delivery/Monthly Report UI; `scripts/smoke-mi-summary-delivery-integration-local.mjs`.
- **Market Intelligence Mega Block 3 (operator hardening):** finding edit/archive UI; finalized summary picker + UUID fallback; summary linkage dashboard (delivery/report labels, appliedAt); MI context source-type polish (handoff vs summary); `GET /market-intelligence/finalized-summaries`; `scripts/smoke-mi-operator-hardening-local.mjs`. MI admin MVP ~80% complete — live AI provider, scraping, autonomous agents, and client portal MI exposure remain deferred.
- **AI Delivery Revenue Engine Mega Layer 1 (deterministic delivery chain):** finalized `MI_SUMMARY_V1` summaries flow into workflow execution context, deterministic content plan/draft generation, item-level MI planning notes, revenue-chain readiness checklist API + admin UI, strengthened monthly report recommendations from MI + deliverables + plan/drafts; focused `scripts/smoke-ai-delivery-revenue-engine-local.mjs`. AI Delivery / AI SEO / Monthly Reports readiness ~84–88% for admin-operated deterministic delivery — live AI provider, WordPress live publishing, scraping, autonomous agents, and production/staging deploy proof remain deferred.
- **Delivery Handoff Mega Layer 2 (safe publishing + private asset gates):** WordPress draft prep hardened (slug/title/target validation, publish gate metadata, missing-credential safe messaging); revenue-chain readiness extended with `private_assets`, `wordpress_handoff`, and `client_portal_visibility` checks; admin UI shows publish gate on prepared drafts; focused `scripts/smoke-delivery-handoff-readiness-local.mjs` and `scripts/smoke-client-final-visibility-local.mjs`. WordPress publishing ~50–60%, private storage/deliverable handling ~76–84%, client portal read-only surfaces ~84–90%, production readiness ~80–86% for local admin-operated handoff — live WordPress publish, strict R2 roundtrip without env, and staging/production deploy proof remain deferred.
- **Production Readiness Mega Block 1 (local closeout pack):** `scripts/smoke-production-readiness-local.ps1` + `npm run smoke:production-readiness:local` orchestrates validate, git diff check, AI Delivery revenue chain, MI operator smokes, delivery handoff gates, client portal boundary, and monthly report admin/client proof in stable order with API restart between browser batches, rate-limit retry, and explicit PASS/FAIL/SKIP summary log in `$env:TEMP`. Local production readiness for deterministic admin-operated delivery ~86–90% — staging deploy proof, production deploy proof, live AI provider, live WordPress publish, strict R2 with real bucket remain deferred.
- **Client Approval Mega Block 2 (happy-path hardening):** `scripts/smoke-client-approval-happy-path-local.mjs` proves pending approvals list, `#/client-portal/deliverables/:id/approve` → `ArticleApprovalEditor`, client-session Save & Continue / Approve / Reject, admin 403 on `for-approval`, `CLIENT_REVIEW_DEFERRED` on phased content plan/draft review routes, and client-safe responses (no `storageKey`, MI/workflow/admin/provider internals). Requires `AUTH_SEED_TEST_PASSWORD`; prefers `AUTH_SEED_TESTER_EMAIL` with `roleKey: client`, falls back to `puriva@puriva.id` via `ensurePurivaClientPortalAuth`. Self-SKIP (exit 0) when portal user cannot be ensured. Wired into production-readiness closeout pack. Client portal approval happy-path ~88–92%; staging/production deploy proof and live WordPress publish remain deferred.
- **External Integrations Readiness Block 1 (config-only):** `apps/api/src/core/external-integrations-readiness.service.ts`, `GET /api/v1/integrations/readiness`, `check:external-integrations-readiness`, and `npm run smoke:external-integrations-readiness:local` validate AI provider, WordPress, R2, and GA/GSC env/config shape without live calls, publish, sync, or bucket mutation. Runbook: [`docs/runbooks/EXTERNAL_INTEGRATIONS_READINESS.md`](./runbooks/EXTERNAL_INTEGRATIONS_READINESS.md). Staging/production live integration proof remains deferred.
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
- **WorkflowBriefs reportJson client-safe sanitization (Block 4E)** — MI/SEO report provider/run metadata (gateway, model, version) is now stripped for non-admin/client callers; admin responses unchanged.
- **Client brief-surface label clarification (Block 4F)** — corrected an earlier documentation error (`#/client-portal/briefs` is the legacy `ClientMonthlyBrief` page, not the release package view) and renamed the WorkflowBriefsPage client-facing nav label/heading from "Content Briefs"/"Workflow Briefs" to "Production Plan Review" to reduce naming collision; no routing or behavior changed.
- **WorkflowBriefs Production Plan Review client-safe operational closure (Block 4G)** — full client-facing surface mapped and proven safe end-to-end (API payloads, UI strings, admin-only controls, approve/reject gating). Fixed a real bug: `getWorkflowBriefReleasePackageStatus` returned raw internal release-package metadata unconditionally to any caller with client access, not just admins; now gated to admins only, matching the already-sanitized `clientReleasePackage`. Boundary smoke strengthened accordingly.
- **`releasePackageId` removed from client-safe release-package payload (Block 4G-FIX)** — `ClientSafeReleasePackage` and its builder/sanitizer functions (`workflow-brief-final-release.execution.ts`, `client-portal.runtime.ts`) no longer include `releasePackageId`; the internal/admin-only raw record field is unaffected. Boundary smoke strengthened with data-independent assertions on both release-package endpoints.
- **Client portal reporting boundary docs alignment (XXL 4A)** — clarified `performanceSummary.sourceType` as allowed client-safe provenance, `#/monthly-reports` stub vs canonical `#/client-portal` reports, and active legacy `ClientMonthlyBrief` intake status.
- **Client portal boundary smoke hardening (XXL 4B)** — `smoke:puriva-client-portal-boundary:local` now explicitly checks monthly report list/detail/download boundaries, allows documented provenance fields, forbids raw metric/admin internals, and adds a light legacy `/briefs` compatibility scan (no removal).
- **Client portal monthly reports route + type cleanup (XXL 4D/4E)** — `#/monthly-reports` now renders `ClientPortalRouter`/`ClientPortalPage` (no stub dead-end); removed stale `releasePackageId` from `ClientPortalReleasePackage` frontend type. No API/runtime changes.
- **Reusable client context/knowledge layer operational review (Block 5A)** — mapped the full `AiKnowledgeItem`/`AiContextSnapshot` knowledge base and context builder (`docs/modules/KNOWLEDGE_BASE.md`, `docs/ai-delivery/ai-operating-layer-architecture.md`); confirmed already safe end-to-end (route-hard-gated admin-only, approved+allowedForPrompt-only selection, prompt-injection sanitization, tenant/client/project isolation, no client-reachable code path touches these tables anywhere) via existing `smoke:ai-knowledge-context` (12/12 passing). No code fix needed — no-change close on safety. At 5A close, WorkflowBriefs' own AI-run pipeline was documented as disconnected from this layer; **that gap was closed in Blocks 6A/6B** (see below).
- **WorkflowBriefs ↔ AI Knowledge integration foundation (Block 6A)** — `triggerWorkflowBriefAiRun` now reuses `buildAiWorkflowKnowledgeContext` and passes sanitized approved knowledge into `executeWorkflowBriefAiRun` prompt assembly; persists safe `knowledgeContext` metadata on `AiBriefRun` only (no raw context bodies on snapshots or client surfaces). `smoke:ai-knowledge-context` extended with WorkflowBriefs MI/SEO run proof.
- **WorkflowBriefs ↔ AI Knowledge plan/draft integration (Block 6B)** — `generateWorkflowBriefProductionPlan`, `generateWorkflowBriefContentDrafts`, and `regenerateWorkflowBriefContentDraft` now reuse `buildAiWorkflowKnowledgeContext` (`content_plan_draft` and `article_draft` workflow types); sanitized approved knowledge is prepended to prompt assembly only. Safe `knowledgeContext` metadata is persisted on admin-only `ProductionPlan.planJson` (plan generation) and `planJson.contentDrafts` (draft generation/regeneration). Raw context bodies, `contextSection`, `selectedSourcesJson`, and `contextPreview` are not stored on `clientVisibleSnapshotJson` or other client-reachable surfaces. `smoke:ai-knowledge-context` extended to 15/15 with plan/draft boundary proof. No schema, migrations, routes, frontend, client portal, or deploy changes.
- **WorkflowBriefs admin knowledge visibility (Block 6C-v1)** — admin Workflow Briefs UI shows read-only safe `knowledgeContext` metadata for MI/SEO runs, production plan generation, and content draft generation/regeneration; `getWorkflowBriefById` projects safe metadata from `AiBriefRun.inputSnapshotJson` for admin only without exposing snapshot internals. Not client-visible. Picker/override (6C-v2) and `AiContextSnapshot` per-brief audit (6D) remain deferred.
- **AI SEO module Knowledge integration review (XXL 3)** — docs clarified: no new Knowledge wiring required for AI SEO manual content-plan CRUD or PDF export (render-only); workflow-generated content plans already compose approved Knowledge via AiDelivery `content_plan_draft` / `article_draft` at `executeAiDeliveryWorkflowRun`. Optional future AiDelivery admin knowledge-usage visibility for workflow-generated plans remains deferred.

**Knowledge arc — planned / deferred:**

- **Block 6C-v2 (deferred)** — knowledge picker / override on Workflow Briefs screens.
- **Block 6D (deferred)** — dedicated `AiContextSnapshot` audit rows per brief run (`briefId` FK does not exist today).

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

## Pre-Staging Block B (2026-07-03)

- **Wrapper:** `npm.cmd run smoke:staging-readiness:local` → [`scripts/staging-readiness-local.ps1`](../scripts/staging-readiness-local.ps1) — Block A smoke subset, `$env:TEMP` logging, `-List` dry mode, Prisma EPERM retry (Program Files `node.exe` only).
- **Docs-only in Block B** aside from wrapper + `package.json` script; no API/runtime changes.

## Pre-Staging Block A (2026-07-03)

- **Pack:** [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md) — consolidated GO / NO-GO readiness, env/migration/smoke/manual QA checklists, and deferred non-blockers.
- **Baseline:** `3dc1de6` (`feat(web): extract AiDelivery WordPress publish confirm modal`); CI green; docs-only; no deploy/staging touch.
- **UI:** No admin staging checklist panel — docs-only (no safe route without `App.tsx` change).

## Next Work

- Keep foundational docs/rules aligned with current assumptions.
- Keep security/client-readiness docs aligned with completed baseline work and remaining deferred items.
- Stabilize AI Delivery admin/operator workflows with repeatable validation/smoke scripts.
- XXL 5 AiDelivery UI stabilization closeout (local): presentational shell components + WordPress publish confirm modal extracted; further large modal splits deferred.
- Resume broader EN2 notification delivery only after explicit approval.
- Treat future client review as a later design/build block, not current behavior.
- Use this document as the source of truth for the next AI SEO / AI Delivery planning block.
