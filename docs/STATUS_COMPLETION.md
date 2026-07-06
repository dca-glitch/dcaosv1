# DCA OS Lite — Project Completion Overview

**Status:** Planning and operator reference
**Last updated:** 2026-07-06 (G26 finance/audit/email local foundation closeout)
**Reference branch:** `main` after PR #43 merge (`f8606f2`)
**Reference commits:** PR #38 merge `a152cbd`; PR #39 merge `971ac41`; PR #40 merge `9a6eddc`; PR #41 merge `6a03cc1`; PR #42 merge `b341b5d`; PR #43 merge `f8606f2`
**Scope:** Approved local admin MVP + client/domain operating model (blocks 1–6) + **MVP 1 Puriva client delivery** + **Post-MVP local closeout (Blocks 31–57)** + **Phase F local completion (Blocks 58–77)**. Local `main` is synced and validated. VPS/production intentionally excluded until separate owner approval.

Current source of truth for the post-PR #38–#43 state: [`docs/STATUS.md`](./STATUS.md). [`docs/operator/post-merge-completion-status-20260627.md`](./operator/post-merge-completion-status-20260627.md) remains the historical record. Merge to `main` does **not** mean production deployment.

Percentages measure completion **within each area's approved scope**, not the full long-term PRD vision.

Related documents:

- [`docs/operator/module-completion-matrix.md`](./operator/module-completion-matrix.md)
- [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)
- [`docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`](./runbooks/PRE_STAGING_VALIDATION_GATE.md)
- [`docs/STATUS.md`](./STATUS.md)
- [`docs/ROADMAP.md`](./ROADMAP.md)
- [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md)
- [`docs/runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md`](./runbooks/PHASE_F_LOCAL_CLOSEOUT_INDEX.md)
- [`docs/ROADMAP_POST_DEFERRED_PHASE_G.md`](./ROADMAP_POST_DEFERRED_PHASE_G.md)
- [`docs/runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md`](./runbooks/PHASE_G_POST_DEFERRED_CLOSEOUT_INDEX.md)
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./modules/WORKFLOW_BRIEFS_MODULE_PLAN.md)

## Post-PR-#43 addendum (Blocks 3B–6B)

The percentages/notes below are still baselined on the PR #38–#43 merge. Since that baseline, the
following additive, already-validated-and-committed blocks closed on `main` (no schema/deploy
changes, no percentage re-audit performed as part of this addendum):

- **Blocks 3B–3G** — AI SEO Content Plan PDF export/private storage, handoff readiness state, and
  stale-PDF invalidation on plan edit.
- **Blocks 4A–4C** — confirmed WorkflowBriefs is an active intake/context-composition/production-
  automation layer (not legacy, not a duplicate of AiDelivery); documented in
  [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./modules/WORKFLOW_BRIEFS_MODULE_PLAN.md).
- **Blocks 4D–4G (+4G-FIX)** — WorkflowBriefs client-safe boundary hardening: MI/SEO `reportJson`
  provider-metadata sanitization, client nav label correction ("Production Plan Review"), a fixed
  raw `releasePackage` leak, and removal of `releasePackageId` from the client-safe release-package
  payload.
- **Block 5A** — reusable AI Knowledge/Context layer (`AiKnowledgeItem`/`AiContextSnapshot`)
  confirmed safe end-to-end (admin-only, route-hard-gated, no client-reachable path). At 5A close,
  WorkflowBriefs' own AI-run pipeline was documented as disconnected from this layer; that gap was
  closed in Blocks 6A/6B below.
- **Blocks 6A/6B** — WorkflowBriefs MI/SEO AI run, production plan generation, and content draft
  generation/regeneration now reuse `buildAiWorkflowKnowledgeContext`; safe `knowledgeContext`
  metadata only is persisted on admin-only surfaces. See
  [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./modules/WORKFLOW_BRIEFS_MODULE_PLAN.md) and
  [`docs/modules/KNOWLEDGE_BASE.md`](./modules/KNOWLEDGE_BASE.md).
- **G5 Puriva approval UX** — client portal approval workflow clarity/density pass closed on
  `main` in commit `ec4c41c`; browser QA passed; no backend/schema/auth changes.
- **G6 Puriva launch cockpit** — operational intake/compliance pack, admin daily cockpit, client
  portal wording/request-changes polish, and SEO/content/asset/WordPress handoff docs tightened on
  `main` in commit `4eeac1e`; browser QA passed; no backend/schema/auth changes.
- **G6 Wave 2 compact delivery handoff lanes** — compact AI Delivery lanes, WorkflowBriefs
  intake/compliance clarity, SEO/content/WordPress draft-only handoff tightening, and client-safe
  archive/report wording closed on `main` in commit `95a92c9`; diff-only review and browser QA
  passed; CI green; post-push verification passed; commit-script local validate later hit known
  Windows Prisma EPERM during `prisma:generate`, but that local failure was superseded by the green
  CI and post-push verification. No backend/schema/auth changes.
- **G7 Block 2 Puriva operational data path** — Puriva intake now connects to AI Knowledge /
  WorkflowBriefs / SEO plan / AI Delivery handoff; WorkflowBriefs readiness cues are clearer; AI
  Knowledge operating links are clarified; SEO/content/WordPress draft-only handoff is aligned to
  verified Puriva context; admin-only / client-safe / draft-only boundaries are preserved; closed
  on `main` in commit `8cb41e2`; diff-only review, web check, full validate, browser QA, and push
  passed; no backend/schema/auth changes.
- **G8 Local Puriva E2E operator dry run** — local Puriva E2E operator dry-run proof added;
  intake/compliance → AI Knowledge/context → WorkflowBriefs → SEO plan → content/compliance →
  image/asset handoff → WordPress prepared draft → client-safe monthly report/archive → client
  approval happy path proven locally; approval smoke labels aligned to real UI; closed on `main` in
  commit `a380bb2`; diff review, `git diff --check`, web check, full validate, browser QA, and push
  passed; no backend/schema/auth changes.
- **G9 Puriva Operating Pack v1** — local/admin-operational closeout recorded on `main` in commit
  `b2e0287` and pushed; owner/client approval checklist, AI Knowledge/context handoff, WorkflowBriefs
  handoff, SEO/content production gate, WordPress prepared draft-only handoff, client-safe
  approval/archive/report path, local E2E proof, real client data packet checklist, and go/no-go
  checklist are all documented; production/staging/VPS/live integrations remain deferred.
- **G9 environment proof approval gate** — planning-only / approval-only gate recorded on `main`
  in commit `3fc779f`; exact owner approval sentence, Sonnet-required execution prompt, health-only
  production boundary, backup/rollback-before-mutation rule, and deferred live integration
  boundaries are documented; no environment execution happened and no environment proof has run.
- **AI SEO Module Hardening XL** — docs-only hardening recorded on `main` in commit `1a132f9`;
  SEO operator path, compliance checkpoints, WordPress draft-only handoff, AI Delivery bridge,
  and client-safe archive/report wording are tightened; review PASS, `git diff --check` PASS, and
  push successful; no environment proof or production readiness claim.
- **G10 Client Portal approval/report polish** — client-facing approval/report wording, final
  archive/deliverables labels, and smoke assertions tightened on `main` in commit `b8319f9`;
  diff-only review, web check, full validate, browser/local QA, and push passed; no
  backend/schema/auth changes.
- **G11 Admin cockpit / daily operations polish** — cockpit now separates Ready now / Needs review
  / Blocked-waiting and keeps the Puriva path compact; operator docs aligned on `main` in commit
  `831175980a87736faefbdbdbedafdbbdf9d97419`; diff-only review, web check, full validate,
  admin/AI operations smokes, and push passed; no backend/schema/auth changes.
- **G12 local/product final polish** — combined local/product final polish recorded on `main` in
  commit `5f3701f`; AI Delivery review/package wording, monthly report approved-snapshot / FINAL
  wording, WorkflowBriefs intake → verified facts → approved KB/context → brief → SEO/content
  plan wording, and the local/product next-options selector are documented; KEEP, diff check, web
  check, full validate, browser/local QA, and push passed; no backend/schema/auth changes.
- **G13 local business modules polish** — bounded local business-module UI density polish, finance
  smoke auth/payload alignment, and Revenue Hub preview-label-only wording were recorded on `main`
  in commit `cbe9311`; Finance Lite and Market Intelligence labels/actions were clarified, the
  finance-ledger smoke token path was aligned to `data.session.token`, review passed, and
  `git diff --check`, web check, full validate, browser QA, and push all passed; no
  backend/API/schema/auth changes.
- **G14 AI Gateway foundation local hardening** — a discovery-first review confirmed the existing
  AI Gateway v1 foundation (`ai-gateway-v1.service.ts`, `ai-provider.config.ts`,
  `openrouter-text.service.ts`, WorkflowBriefs execution wiring) already provides safe disabled/
  not-configured results, no secret leakage, no live provider call by default, and no client-portal
  exposure of gateway/model/audit fields; no code changes were required. Proven by `npm.cmd run
  validate` PASS (`check:ai-provider-config` 19/19, `check:external-integrations-readiness` 25/25)
  and a fresh `npm.cmd run smoke:openrouter-guarded:local` run (12/12 PASS); no backend/schema/auth
  changes, no environment/VPS/production touch, no live provider/WordPress/GA-GSC/R2 call.
- **G15 Admin operations shell 100% local/admin-operational** — `AdminDailyOperationsCockpit.tsx`
  gained a discoverable "Start here — first client" panel, a "Handoffs" panel linking directly into
  Workflow Briefs, AI Delivery, Monthly Reports preview, Client Portal archive preview, Market
  Intelligence, Finance Lite, and AI Operations, and an explicit "Deferred / gated" panel labeling
  staging/environment proof, production readiness, live AI provider, live WordPress, GA/GSC, and R2
  live IO as out of scope; Ready now / Needs review / Blocked-waiting queues were preserved. A new
  `smoke:admin-daily-cockpit:browser` proof (28/28 PASS) plus the existing
  `smoke:admin-operations:local` (16/16 PASS) validate the shell; `git diff --check`, web check, and
  full validate all passed. No backend/API/schema/auth changes beyond one additive `package.json`
  script line for the new smoke.
- **G19 AI SEO planning + content drafts 100% local/operator-ready** — WorkflowBriefs and AI
  Delivery now carry the complete local/admin content production surface: MI/SEO report →
  production/content plan → content objectives → drafts → review/polish → package/export handoff →
  AI Delivery handoff. Existing smokes prove the local deterministic path, PDF/export handoff status,
  R2-disabled safe behavior, no `storageKey` client leak, content draft generation/review state, and
  draft-only publication handoff. Live crawling, live GSC/GA sync, live provider execution, Google
  Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness, and
  unverified medical/legal/license/before-after claims remain explicitly outside scope.

- **G20 AI Delivery workflow 100% local/operator-ready** — AI Delivery is documented as the
  complete local/admin operator execution surface: monthly project → brief/context handoff →
  workflow run visibility → content plan → content drafts → reviews → package → deliverables →
  WordPress draft-prep handoff → monthly report → client-safe archive handoff. Existing smokes
  (`smoke:ai-delivery-workflow:browser`, `smoke:ai-delivery-reviews`,
  `smoke:workflow-brief-publication-handoff:browser`, `smoke:client-portal-monthly-report:browser`,
  `smoke:client-portal:browser`, `smoke:ai-seo-content-plan-pdf`) remain the proof. Live AI
  provider execution, live WordPress publish, live GA/GSC, live R2 IO, Google Docs live export,
  staging/environment proof, and production readiness remain explicitly deferred; no code changes
  were required.

- **G23 Private storage / deliverable handling docs-only closeout** — Private storage disabled-safe
  foundation is recorded as **100% local-safe**: R2-disabled mode is expected and safe locally,
  missing `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` returns
  guarded `R2_STORAGE_NOT_CONFIGURED`, and no storage reference is persisted without config.
  Deliverable handling is recorded as **100% local/operator-client-safe**: admin deliverable and
  monthly report upload/download-reference handoffs are documented, generated monthly report PDF
  storage is covered, Client Portal receives only FINAL/non-archived safe shapes, client download
  endpoints return `downloadReference`, and raw `storageKey`/internal fields remain excluded. Live
  R2 real-bucket proof remains deferred; no live bucket IO, staging/env proof, production storage
  readiness claim, or storage/API/security behavior change is included.

**Knowledge arc — next / deferred (not in percentage baseline above):**

- **Block 6C-v1 (next)** — admin read-only visibility UI for safe `knowledgeContext` metadata on
  Workflow Briefs screens (not client-visible).
- **Block 6C-v2 (deferred)** — knowledge picker / override on brief screens.
- **Block 6D (deferred)** — dedicated `AiContextSnapshot` audit rows per brief run (`briefId` FK
  does not exist today).

See [`docs/STATUS.md`](./STATUS.md) "AI SEO / Content Plan closure" section for full detail on each
block. WorkflowBriefs is a confirmed third module alongside AI Delivery and Market Intelligence; see
[`docs/AI_MODULES.md`](./AI_MODULES.md) "Current module split".

Decision selector: stop and wait for owner decision; if approved later, use the Sonnet-only G9 environment proof prompt; otherwise continue deeper local/product UI polish only if desired.

---

## Overall summary

| Perspective | % | Meaning |
|-------------|---|---------|
| **Local admin MVP** (DCA operator, local dev) | **~100%** | Done | Post-MVP Phases A–E (Blocks 31–57) + Phase F local closeout (Blocks 58–77) |
| **Client/domain roadmap (blocks 1–6)** | **100% local/admin-client-domain foundation** | Local gates done; prod env keys remain separate owner gates |
| **Local/admin operational readiness** | **~84%** | Done (local) | Puriva pack, AI SEO, client portal, and admin cockpit hardened locally; live integrations and env proof still deferred |
| **Production readiness** (real clients, VPS) | **~62%** | Blocked | Runbooks exist; local hardening improved; deploy/migration deferred by owner |
| **UI / route stabilization** | **100% local/admin-readable baseline** | Dark Nebula / data-dense admin readable baseline, AI Delivery sectioning, Workflow Briefs cleanup, client-only portal access; not a full design-system migration or full redesign claim |
| **PR #13 merge to main** | **100%** | Merged; local `main` synced to `origin/main` |
| **Local main validation** | **100%** | Prior accepted baseline after Windows Prisma DLL lock cleanup |
| **Local pre-staging proof** | **100% local evidence pack (manual fallback accepted)** | Block 5D-B (`docs/STATUS.md` §2.1) recorded full local closeout PASS via the orchestrator plus a documented manual fallback for the known `smoke:staging-readiness:local` orchestrator hang; superseded the earlier 95%-accepted Finance-browser-smoke baseline. This is a **local repo-side** evidence pack only — it says nothing about the separately unresolved staging/G4 deploy question (see `docs/STATUS.md` §2.2 and the Confirmed staging target row below). |
| **Confirmed staging target** | **100%** (target only) | G1 closed — `staging.digitalcubeagency.net`; production remains `system.digitalcubeagency.net`; same VPS, separate staging stack; DNS not created yet; G4 not approved. **Note:** `docs/STATUS.md` §2.2 separately claims G4 staging deploy completed on `5ee8389` — that claim is **unresolved/unverified**, pending owner confirmation. Do not treat G4 as either approved or executed until reconciled. |
| **Current main deployed to production** | **0%** | Not deployed; production frozen |
| **Full PRD vision** (future modules + automation) | **~28%** | Large portion intentionally deferred |

---

## Status legend

| Label | Meaning |
|-------|---------|
| **Done** | Usable for current approved local/admin MVP scope |
| **Done (local)** | Local smoke gates pass; live/staging env may still be deferred |
| **In progress** | Foundation exists; important pieces remain |
| **Deferred** | Intentionally not active; waiting for a separate approved block |

---

## Module and area matrix

| Area / module | % in scope | Status | Notes |
|---------------|------------|--------|-------|
| **Core app foundation (auth skeleton)** | **100% local-skeleton-foundation** | Done (local) | Auth structure protected by check:auth-skeleton; login/logout/tenant-switch routes scaffold locally (501 Not Implemented where intended); session persistence BLOCKED (SESSION_DB_RUNTIME_BLOCKED); permission/module enforcement skeleton-only and not wired; no real auth endpoints, no session DB, no invite/reset/Turnstile/OAuth/OIDC/MFA |
| **Operator/admin RBAC boundary** | **100% local-proven** | Done (local) | Admin login, tenant switch, module entitlements UI, settings read, ClientUserAccess CRUD (grant/revoke/archive), authorization summary API, admin owner/admin separation, roles/permissions summary (Blocks 48–49 browser gates); smoke-proven by smoke:roles-permissions:browser |
| **Client access isolation boundary** | **100% local/client-safe-proven** | Done (local) | Client-level access (ClientUserAccess), client portal projects hidden before grant/visible after grant, FINAL-only monthly report filtering, unrelated-client blocking, client-safe field exposure checks; smoke-proven by smoke:client-access:local, smoke:client-access:browser, smoke:client-role-api-boundary:local |
| **Dark Nebula UI + data-dense admin** | **100% local/admin-readable baseline** | Done (local) | Dense admin readability and Dark Nebula baseline are complete for current local surfaces; full design-system migration/full redesign remains outside this claim |
| **Clients (CRM)** | **100% local/admin CRM foundation** | Done (local) | G30 restored `smoke:client-domain:browser` end-to-end proof after stale selector fixes (`f9de4e7`). Local proof covers Clients page load, Add Client modal, client creation via UI, created client card visibility, agency kind filter, Client Hub open from created client, and admin API resolution. Local/admin foundation only; no production CRM or client self-service claim. |
| **Client Hub + domain model (block 1)** | **100% local/admin-client-domain foundation** | Done (local) | G30 restored broader client-domain browser regression proof. Related smokes now PASS: `smoke:client-domain:browser`, `smoke:client-hub:catalog-inquiry:browser`, `smoke:client-hub:edge-cases:browser`, and `smoke:client-hub:publication-log:browser` (2026-07-06). Coverage includes Client Hub catalog, inquiries, publication targets/logs, archived/read-only edge cases, legacy WP sunset, and secret hiding. Live WordPress publish remains deferred. |
| **PublicationTarget (block 2)** | **100% local/admin-safe foundation** | Done (local) | CRUD per client; legacy tenant POST sunset (410); GET read-only. Re-proven in this closeout: `smoke:client-hub:publication-log:browser` (PASS) and `smoke:legacy-wordpress-sunset:local` (6/6 PASS, 2026-07-06). Live WordPress publish stays deferred (see WordPress disabled-safe publish gate row). |
| **MI → clientId (block 3)** | **100% local/admin-safe foundation** | Done (local) | FK, client picker UI, handoff; `clientId` parser fix applied. Re-proven in this closeout: `smoke:ai-market-intelligence` (full pass, 2026-07-06) — creates a smoke client, links an MI project to it, and carries client context through insight → handoff → AI Delivery apply. |
| **Encrypted credentials (block 4)** | **100% local-safe foundation** | Done (local) | Master key local probe runbook (Post-MVP Block 44). Re-proven in this closeout: `smoke:credential-encryption:local` (roundtrip PASS) and `smoke:credential-master-key-probe:local` (15/15 PASS, 2026-07-06) — both confirm secret-safe API responses. Staging/prod master key remains an owner/env gate, unchanged. |
| **WordPress draft-prep handoff** | **100% local/operator-ready** | Done (local) | Draft preparation and operator handoff are complete for the approved local/admin workflow; live WordPress publish is deferred |
| **WordPress disabled-safe publish gate** | **100% local-safe** | Done (local) | Publish gate metadata, disabled default behavior, local gate smoke, and Client Hub publication log browser proof confirm local-safe gating |
| **Live WordPress publish** | **0%** | Deferred | No live publish, no client-triggered publish, no staging/environment proof, and no production publish claim |
| **Module middleware (block 6)** | **100% local-safe foundation (baseline/off)** | Done (local) | dry_run + enforce probe runbooks (Blocks 39, 46). Re-proven in this closeout: `smoke:tenant-module:local` (37/37 PASS), `smoke:tenant-module:dry-run-probe` (9/9 PASS), and `smoke:tenant-module:phase-f-local` (PASS) all confirm the off/baseline module-routing and enable/disable behavior, 2026-07-06. **Not fully closed:** the strict `dry_run`/`enforce` probes require setting `TENANT_MODULE_ENFORCEMENT` and restarting the API — an env-flag change out of scope for this docs/smoke-only closeout — so strict dry_run/enforce proof and staging enforce both remain deferred. |
| **Projects & Tasks** | **100% local/admin MVP foundation** | Done (local) | G34 dedicated local proof: `smoke:projects-tasks:local` PASS (39 checks passed). API-level admin MVP proof covers projects list/create/get/list-verify/update/archive/restore and tasks list/create linked to project/get/list-verify/update status/priority/done/archive/restore. No browser UI proof; no staging/live/production claim. |
| **AI Delivery** | **100% local/operator-ready** | Done (local) | Full local operator sequence complete: project/month → brief/context handoff → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report → client-safe archive handoff; live AI provider execution, live WordPress publish, live GA/GSC, live R2 IO, Google Docs live export, staging/environment proof, and production readiness remain deferred |
| **Market Intelligence** | **100% local/operator-ready** | Done (local) | Admin MVP + operator browser gate + client-facing read-only summary (delivery-summary approved-handoff-only endpoint, smoke-proven isolated boundary); MI runs in AI Ops console deferred to further closeout |
| **Client-facing MI summary** | **100% local/client-safe read-only** | Done (local) | GET /client-portal/projects/:projectId/delivery-summary returns marketIntelligence sub-object (title, summary, opportunities, actions) for READY/APPLIED handoffs only; DRAFT/internal/raw findings hidden; forbidden fields excluded (storageKey, tenantId, projectId, provider, prompt, review notes); tenant/client isolated; smoke-proven |
| **Workflow Briefs / context composition** | **100% local/operator-ready** | Done (local) | Intake → submit → approved KB/context → MI/SEO runs, production plan, drafts, and AI Delivery handoff are in place; submit-before-run-ai is documented and smoke-proven locally |
| **AI Knowledge / Context layer** | **100% local/operator-safe** | Done (local) | Approved-only context path, tenant/client/project isolation, injection sanitization, missing-context warnings, safe snapshot metadata, and WorkflowBriefs context usage are smoke-proven; raw context and provider metadata stay out of client-visible surfaces |
| **Monthly Reports** | **100% local/client-safe handoff** | Done (local/client-safe) | Metrics snapshot foundation, client portal FINAL-only archive path, and read-only monthly report handoff are in place; live GA/GSC, staging/environment proof, and production readiness remain deferred |
| **Client Portal read-only/archive** | **100% local/client-safe** | Done (local/client-safe) | Blocks 7–30 incl. sparse + populated delivery overview browser gates; `#/client-portal` defaults to the archive shell; FINAL-only reports/archive and approval/report polish complete for local scope |
| **Client Portal advanced actions** (magic links, full comment threads) | **0%** | Deferred (Phase 2) | See deferred scope register |
| **Finance Lite admin foundation** | **100% local/admin-safe foundation** | Done (local) | Admin finance records and ledger visibility are smoke-proven for vendors/services/bills/invoices/credit notes/recurring/ledger boundaries where implemented; `smoke:finance-admin:browser` and `smoke:finance-ledger:local` passed; payments, Stripe/payment provider proof, bank feeds, tax/legal/accounting production claims, and production invoicing readiness remain excluded |
| **AI SEO planning + content drafts** | **100% local/operator-ready** | Done (local) | WorkflowBriefs + AI Delivery local operator path is complete: MI/SEO report → production/content plan → content objectives → drafts → review/polish → package/export handoff; local deterministic/provider-deferred behavior, R2-disabled PDF/export safety, no `storageKey` leak, and draft-only handoff are smoke-proven. Live crawling, live GSC/GA sync, live provider execution, Google Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness, and unverified medical/legal/license/before-after claims remain deferred/out of scope |
| **Private storage disabled-safe foundation** | **100% local-safe** | Done (local) | Disabled/private-r2 status, guarded upload helper, and 300-second signed download-reference helper are documented; local R2-disabled mode is expected and safe; absent R2 config returns `R2_STORAGE_NOT_CONFIGURED` and prevents storage-reference persistence. Live R2 real-bucket proof, staging/env proof, and production storage readiness remain deferred |
| **Deliverable handling** | **100% local/operator-client-safe** | Done (local) | Admin deliverable upload/download-reference/open, ready/revision/accept/archive/restore, reviews, WordPress draft prep, Google Docs export handoff, monthly report document/PDF handoff, client FINAL/non-archived visibility, safe `downloadReference`, and safe admin-provided `exportUrl` are documented; Client Portal excludes `storageKey`, internal notes, `contentDraftId`, `articleImageId`, and `tenantId` |
| **Live R2 real-bucket proof** | **Deferred** | Deferred | Requires explicit env approval; no bucket IO in local closeout; no staging/prod storage readiness claim |
| **Email/outbox disabled-safe foundation** | **100% local-safe foundation** | Done (local) | Read-only tenant-scoped outbox/local notification records are smoke-proven by `smoke:email-outbox:local`; local mode remains non-sending with `SKIPPED` records; real sending, SMTP/provider proof, queues, deliverability, and production notification readiness remain excluded |
| **Audit/activity feed foundation** | **100% local/operator-safe foundation** | Done (local) | `AuditLog`/event feed/dashboard Recent Activity/operator visibility are smoke-proven by `smoke:audit-activity:browser`, `smoke:dashboard:audit-feed:browser`, and optional admin operations proof; SIEM/security audit, compliance-grade audit, production monitoring, and durable observability remain excluded |
| **AI Gateway foundation** | **100% local-safe foundation** | Done (local) | AI Gateway v1 foundation locally hardened (disabled/not-configured safe results, no secret leakage, client-portal-safe, verified via `check:ai-provider-config` 19/19 and `smoke:openrouter-guarded:local` 12/12); local deterministic default only |
| **Live AI provider execution** | **0%** | Deferred | Live OpenRouter/provider execution, staging/environment proof, real provider-secret/config proof, cost proof, and rate-limit proof remain deferred |
| **AI Operations Console** | **100% local/operator-safe foundation** | Done (local) | v1 on main (AI Delivery + MI runs). The previously-open "MI listing + filters/export" gap is now smoke-proven in this closeout: `smoke:ai-operations:local` (12/12 PASS — gateway filter, MI project/run create+execute, list+detail include the MI run) and `smoke:ai-operations:browser` (0 failures — list/empty state, MI source filter control, CSV export button, detail modal, admin-only nav), both 2026-07-06. Live AI provider execution remains deferred (see Live AI provider execution row). |
| **Puriva Operating Pack v1** | **100% local/admin-operational pack** | Done (local/admin) | Local/admin-operational closeout complete (G9, commit `b2e0287`) — intake/compliance, KB/context handoff, WorkflowBriefs handoff, SEO/content gate, WordPress draft-only handoff, client-safe approval/archive/report path, and local E2E proof are all in place. **Kept separate, not blended into this number:** production readiness for the pack is its own deferred track (~60–65% baseline, unchanged by this closeout); live provider, live WordPress publish, GA/GSC, R2 live IO, production deploy, and incident/rollback execution all stay deferred. |
| **Admin cockpit / daily operations** | **100% local/admin-operational** | Done (local) | Ready now / Needs review / Blocked-waiting queues, discoverable first-client path, complete handoffs into WorkflowBriefs, AI Delivery, Monthly Reports preview, Client Portal archive preview, Market Intelligence, and Finance Lite, explicit deferred/gated labeling; environment proof, deployment, and live execution remain gated |
| **Operator docs & runbooks** | **100%** | Done (local) | Puriva Blocks 7–30 + Post-MVP Phases A–E + Phase F Blocks 58–77 runbooks and closeout index |
| **Tests / smoke** | **100%** | Done (local) | Puriva MVP + Post-MVP Phases A–D browser layers in pre-staging |
| **PR #13 merge → main** | **100%** | Done | Merged at `584e041bd85e8179e795a0e4621a0d9d8908e0b6`; follow-up docs commit `07b1f1668d11cdef42b195cfad189c4df645acc6` |
| **Local main validation** | **100%** | Done | Passed after Windows Prisma DLL lock cleanup |
| **Local pre-staging proof** | **100% local evidence pack (manual fallback accepted)** | Accepted | Block 5D-B (`docs/STATUS.md` §2.1): full local closeout PASS via orchestrator + documented manual fallback for the known orchestrator hang after the Puriva boundary smoke. Local repo-side evidence only — does not resolve the separately unresolved staging/G4 deploy question. |
| **Confirmed staging target** | **100%** (target only) | Done (G1) | `staging.digitalcubeagency.net` approved; production `system.digitalcubeagency.net`; separate staging stack on same VPS; DNS deferred until G4 prep; G4 VPS execution not approved. **Note:** `docs/STATUS.md` §2.2 separately claims G4 staging deploy completed on `5ee8389` — **unresolved/unverified**, pending owner confirmation. |
| **Current main deployed to production** | **0%** | Deferred | Not deployed; no VPS migration, restart, or release performed |
| **Production deployment of current main** | **0%** | Deferred | Frozen unless explicitly approved |
| **Licensee tenant migration** (`OWN_DOMAIN` → separate tenant) | **0%** | Deferred | Future block |
| **Revenue Hub AI** | **0%** | Deferred (RH0 docs) | Future module — see [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) |
| **POD AI Toolkit** | **0%** | Deferred (POD0 docs) | Future module — see [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) |
| **Scraping / broad data collection** | **0%** | Deferred | Future module |
| **Live GA/GSC, Google OAuth** | **0%** | Deferred | Snapshot-first only today |
| **Live WordPress auto-publish (prod)** | **0%** | Deferred | Draft handoff yes; auto-publish no |
| **Payments / Stripe / bank feeds** | **0%** | Deferred | Finance Lite remains admin records and ledger visibility only; no payment collection, provider proof, bank feeds, or accounting/tax production claim |
| **Invite / password reset / role editing UI** | **0%** | Deferred | Security improvements deferred |

---

## Client/domain roadmap — blocks 1–6

| Block | Name | % | Status |
|-------|------|---|--------|
| 1 | Client foundation + `clientKind` | **100% local/admin-client-domain foundation** | Done (local) — re-proven 2026-07-06 via `smoke:client-domain:browser`; see Clients (CRM) and Client Hub area rows above |
| 2 | PublicationTarget | **100% local/admin-safe foundation** | Done (local) — re-proven 2026-07-06, see area row above |
| 3 | MI → `clientId` | **100% local/admin-safe foundation** | Done (local) — re-proven 2026-07-06, see area row above |
| 4 | Encrypted credentials | **100% local-safe foundation** | Done (local); staging/prod key pending — re-proven 2026-07-06, see area row above |
| 5 | WordPress draft-prep + disabled-safe PublicationLog gate | **100% local-safe gate** | Done (local); live WordPress publish deferred |
| 6 | Module middleware | **100% local-safe foundation (baseline/off)** | Done (local); strict dry_run/enforce probe and staging enforce pending — re-proven 2026-07-06, see area row above |
| *Future* | Licensee tenant migration | **0%** | Deferred |

Blocks 1, 2, 3, 4, and 6 now carry honest local-only labels backed by fresh 2026-07-06 smoke proof (see area rows above for exact PASS counts). Block 1 moved to a local/admin-client-domain foundation label after G30 restored `smoke:client-domain:browser`; Block 5 was already 100% local-safe. The blocks 1–6 roadmap is now summarized as local/admin-client-domain foundation; a single blended "average" is no longer meaningful across mixed percentage/label rows and has been removed.

---

## Ready today vs waiting

### Ready for local operator work (~84% of operational product)

- CRM (Clients, Projects, Tasks)
- AI Delivery admin workflow
- Market Intelligence admin workflow
- Finance admin records
- Monthly Reports (admin + client-safe archive path)
- Client Portal MVP visibility path (Puriva smoke gate PASS locally)
- Client Hub (profile, publication targets, credentials shell, analytics shell)
- Admin daily operations cockpit with separated ready/review/blocked lanes
- Architecture blocks 1–6 **local gates** (credential encrypt, WP publish smoke, tenant module enforce/dry_run, legacy WP sunset)
- One-command local closeout: `npm run smoke:pre-staging:local`

### Phase F local work (Blocks 58–77)

- Client Portal UX polish (Block 68), compact MI/Reports passes, guarded integration runbooks
- See [docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md)

### Waiting — owner / environment gates (not local repo work)

- G1 staging target confirmed: `staging.digitalcubeagency.net` (production remains `system.digitalcubeagency.net`; same VPS, separate staging stack)
- DNS for `staging` subdomain not created yet — required before G4 controlled VPS staging execution
- Block G4 VPS/staging execution **not approved** — no deploy, Caddy, Docker, or env changes until separate owner approval
- Staging env: Block 4 master key, Block 5 publish, Block 6 `TENANT_MODULE_ENFORCEMENT`
- Staging smoke (`smoke:mvp:staging`) + browser QA on confirmed HTTPS staging host
- Production deployment of current `main` remains **0%** and frozen until separate approval

### Intentionally deferred (not counted as missing bugs)

- VPS and production deploy
- Live external integrations (Google, WordPress auto-publish prod, email sending)
- Advanced Client Portal actions (magic links, full comment threads)
- Future modules (Spa Finance, BaliShop, GayService, GotoBeauty, Bali24, Revenue Hub, Commerce Core, POD, scraping)
- Licensee tenant migration

---

## How to refresh this document

Update after:

1. A major block closes (schema + API + UI + smoke).
2. Staging or production promotion (separate approval).
3. A module moves from deferred → active in the deferred scope register.

Suggested validation before updating percentages:

```powershell
cd C:\dcaosv1
npm run smoke:pre-staging:local
```

Do not treat local smoke alone as production readiness.

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-28 | AI baseline on main: PR #33 AI Gateway v1 + smoke matrix; PR #34 AI Operations Console v1 |
| 2026-07-02 | Docs source-of-truth refresh after PRs #38–#43; UI/route stabilization complete; next block is AI SEO / AI Delivery planning |
| 2026-07-05 | G6 Wave 2 closeout: compact delivery handoff lanes, WorkflowBriefs intake/compliance clarity, draft-only WordPress handoff tightening, and client-safe archive/report wording |
| 2026-07-05 | G7 Block 2 closeout: Puriva intake connected to AI Knowledge, WorkflowBriefs, SEO plan, and AI Delivery handoff; admin-only/client-safe/draft-only boundaries preserved |
| 2026-07-06 | Puriva Operating Pack v1 closeout: local/admin-operational pack recorded/pushed, baseline updated, and production/staging/VPS remain untouched |
| 2026-07-06 | Client Portal approval/report polish: client-facing approval/report wording clarified, final archive/deliverables wording improved, docs/smoke assertions aligned, and push successful |
| 2026-07-06 | G9 environment proof approval gate: planning-only gate recorded/pushed, Sonnet execution prompt indexed, and environment work remains owner-approved only |
| 2026-07-06 | AI SEO Module Hardening XL: docs-only hardening recorded/pushed, operator path/compliance/handoff wording tightened, and environment proof remains unrun |
| 2026-07-06 | G8 local Puriva E2E closeout: local operator proof added, approval smoke labels aligned to real UI, validation/browser QA passed, push complete |
| 2026-07-06 | G13 local business modules polish: Finance Lite and Market Intelligence wording clarified, Revenue Hub stayed preview-label only, finance-ledger smoke aligned to login token shape, and push successful |
| 2026-07-06 | G14 AI Gateway foundation local hardening: discovery confirmed existing gateway contract already safe (disabled/not-configured results, no secret leakage, no client-portal exposure); no code changes made; `npm run validate` and `smoke:openrouter-guarded:local` (12/12) reconfirmed |
| 2026-07-06 | G15 Admin operations shell 100% local/admin-operational: cockpit gained first-client discoverability, complete handoffs (WorkflowBriefs/AI Delivery/Monthly Reports preview/Client Portal archive preview/Market Intelligence/Finance Lite), and explicit deferred/gated labeling; new `smoke:admin-daily-cockpit:browser` (28/28) plus existing `smoke:admin-operations:local` (16/16) passed |
| 2026-07-06 | G16 Client Portal read-only surfaces + Monthly Reports local/client-safe closeout: existing `smoke:client-portal-monthly-report:browser` and `smoke:client-portal:browser` proved FINAL-only monthly reports, hidden DRAFT/ADMIN_REVIEW/ARCHIVED reports, and absent forbidden fields; Monthly Reports marked 100% local/client-safe handoff |
| 2026-07-06 | G17 WorkflowBriefs / context composition 100% local/operator-ready: the first-client sequence is explicit, AI SEO is labeled inside WorkflowBriefs, submit-before-run-ai is documented, and the existing WorkflowBrief/AI SEO/knowledge-context smokes already prove the local deterministic handoff path |
| 2026-07-06 | G18 AI Knowledge / Context layer 100% local/operator-safe: approved-only context path, tenant/client/project isolation, injection sanitization, missing-context warnings, safe snapshot metadata, and WorkflowBriefs context usage are smoke-proven; no code changes were needed |
| 2026-07-06 | G19 AI SEO planning + content drafts 100% local/operator-ready: WorkflowBriefs + AI Delivery content production path documented as complete for local/admin use; existing AI SEO PDF/export, WorkflowBrief publication handoff, AI Delivery workflow, and content draft/review smokes remain the proof; live crawling/GSC/GA/provider/Google Docs/R2/WordPress/staging/production remain deferred |
| 2026-07-06 | G20 AI Delivery workflow 100% local/operator-ready: full local operator sequence (project → brief/context handoff → workflow run → content plan → drafts → reviews → package → deliverables → WordPress draft-prep → monthly report → client-safe archive) documented as complete; existing AI Delivery/WorkflowBriefs/Monthly Report/Client Portal smokes remain the proof; live provider/WordPress/GA-GSC/R2/Google Docs/staging/production remain deferred |
| 2026-07-06 | G23 Private storage / deliverable handling docs-only closeout: private storage disabled-safe foundation marked 100% local-safe; deliverable handling marked 100% local/operator-client-safe; live R2 real-bucket proof remains deferred with no bucket IO, staging/env proof, production storage readiness claim, or behavior change |
| 2026-07-06 | G26 Finance Lite + audit/activity + email/outbox local foundation closeout: focused smokes passed for finance admin/browser + ledger, audit activity + dashboard audit feed, email/outbox non-sending local records, and optional admin operations; docs now mark these as 100% local-safe foundations while payment/Stripe/bank feeds, SIEM/compliance monitoring, and real email/provider/queues remain deferred |
| 2026-06-27 | G1 closed: staging host `staging.digitalcubeagency.net`; production `system.digitalcubeagency.net`; G4 not approved; DNS not created |
| 2026-06-27 | Phase F Block 77: local closeout complete — Blocks 58–77 validated on `feature/local-closeout-blocks-58-77` |
| 2026-06-27 | Phase F Block 58: docs consistency — aligned Portal/WP/MI/R2 labels and blocks 4–6 percentages |
| 2026-06-27 | Puriva MVP local closeout complete (Blocks 7–30 index, populated delivery browser, login shell pre-staging) |
| 2026-06-27 | MVP Block 26: Client Access admin browser gate (link user from Clients edit modal) |
| 2026-06-27 | MVP Block 25: client-domain browser extended for Client Hub catalog + publication log sections |
| 2026-06-27 | MVP Block 24: monthly report admin browser smoke in pre-staging |
| 2026-06-27 | MVP Block 23: Client Portal signed-out browser gate (login shell blocks archive UI without session) |
| 2026-06-27 | MVP Block 22: monthly report metrics snapshot smoke in pre-staging |
| 2026-06-27 | MVP Blocks 19–21: portal project filter browser gate, Client Hub publication log browser gate, monthly report local/PDF in pre-staging |
| 2026-06-27 | MVP Blocks 16–18: empty archive browser gate, Client Hub catalog inquiry browser gate, monthly report MI context in pre-staging |
| 2026-06-27 | MVP Blocks 13–15: sparse delivery overview browser gate, access revoke browser gate, Google Drive export in pre-staging |
| 2026-06-27 | MVP Block 12: Client Portal empty catalog + archived project browser edge-case gate; API archive exclusion in portal local smoke |
| 2026-06-27 | MVP Block 10: Client Portal catalog inquiry browser gate; Block 11: MI smoke in pre-staging gate |
| 2026-06-27 | MVP Block 9: Client Portal browser gate for populated delivery overview; inquiry form prefill; shared Puriva fixture lib |
| 2026-06-27 | MVP Block 7: Puriva delivery summary local gate in client portal smoke; client-access added to pre-staging gate |
| 2026-06-27 | Post-MVP Phase E: master index, deferred owner gates, Block 57 final closeout + read-only API probe |
| 2026-06-27 | Puriva MVP smoke gate PASS; blocks 4–6 + legacy WordPress sunset reflected; Client Portal MVP raised to ~78% |
| 2026-06-26 | Initial completion overview after client/domain operating model implementation and Playwright browser smoke |
