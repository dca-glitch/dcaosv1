# DCA OS Lite — Project Completion Overview

**Status:** Planning and operator reference
**Last updated:** 2026-07-02 (docs source-of-truth refresh after PR #38–#43)
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

## Post-PR-#43 addendum (Blocks 3B–5A)

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
  confirmed safe end-to-end (admin-only, route-hard-gated, no client-reachable path); documented gap
  that WorkflowBriefs' own AI-run pipeline does not yet query this layer (see
  [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)).

See [`docs/STATUS.md`](./STATUS.md) "AI SEO / Content Plan closure" section for full detail on each
block. WorkflowBriefs is a confirmed third module alongside AI Delivery and Market Intelligence; see
[`docs/AI_MODULES.md`](./AI_MODULES.md) "Current module split".

---

## Overall summary

| Perspective | % | Meaning |
|-------------|---|---------|
| **Local admin MVP** (DCA operator, local dev) | **~100%** | Done | Post-MVP Phases A–E (Blocks 31–57) + Phase F local closeout (Blocks 58–77) |
| **Client/domain roadmap (blocks 1–6)** | **~92%** | Local gates done; prod env keys = separate owner gates |
| **Production readiness** (real clients, VPS) | **~38%** | Runbooks exist; deploy/migration deferred by owner |
| **UI / route stabilization** | **100%** | Dark Nebula pass, AI Delivery sectioning, Workflow Briefs cleanup, client-only portal access |
| **PR #13 merge to main** | **100%** | Merged; local `main` synced to `origin/main` |
| **Local main validation** | **100%** | Prior accepted baseline after Windows Prisma DLL lock cleanup |
| **Local pre-staging proof** | **95%** | Accepted; isolated Finance admin browser smoke passed after local admin restore and API/Web restart |
| **Confirmed staging target** | **100%** | G1 closed — `staging.digitalcubeagency.net`; production remains `system.digitalcubeagency.net`; same VPS, separate staging stack; DNS not created yet; G4 not approved |
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
| **Platform core** (auth, tenant, modules, CI, validate) | **92%** | Done | Roles/permissions summary + module registry browser gates (Blocks 48–49) |
| **Dark Nebula UI + data-dense admin** | **100%** | Done | Full-system Dark Nebula UI pass and client-facing polish complete |
| **Clients (CRM)** | **88%** | Done | CRUD, filters, `clientKind`, website |
| **Client Hub + domain model (block 1)** | **97%** | Done | Hub UI + client-domain browser covers catalog, inquiries shell, publication log |
| **PublicationTarget (block 2)** | **95%** | Done | CRUD per client; legacy tenant POST sunset (410); GET read-only |
| **MI → clientId (block 3)** | **88%** | Done | FK, client picker UI, handoff; `clientId` parser fix applied |
| **Encrypted credentials (block 4)** | **88%** | Done (local) | Master key local probe runbook (Post-MVP Block 44); staging/prod master key = owner gate |
| **WordPress publish + PublicationLog (block 5)** | **90%** | Done (local) | Local gate smoke + Client Hub publication log browser proof |
| **Module middleware (block 6)** | **96%** | Done (local) | dry_run + enforce probe runbooks (Blocks 39, 46); staging enforce pending |
| **Projects & Tasks** | **88%** | Done | Admin MVP closed |
| **AI Delivery** | **95%** | Done | Workspace sectioning complete; admin workflow matrix, gateway, operations console, and client-safe archive path in place |
| **Market Intelligence** | **86%** | Done (local) | Admin MVP + operator browser gate; MI runs in AI Ops console deferred to closeout |
| **Monthly Reports** | **93%** | In progress | Metrics snapshot foundation and client portal FINAL-only archive path in place; live GA/GSC deferred |
| **Client Portal MVP** (Puriva — visibility + review) | **100%** | Done (local) — UX polish and route access fixed | Blocks 7–30 incl. sparse + populated delivery overview browser gates; `#/client-portal` now defaults to the archive shell |
| **Client Portal advanced actions** (magic links, full comment threads) | **0%** | Deferred (Phase 2) | See deferred scope register |
| **Finance** | **82%** | Done (local) | Finance admin browser sanity gate (Post-MVP Block 36) |
| **AI SEO + Content Production** | **72%** | In progress | Google Drive live planning gate (Block 43); live Google integrations deferred |
| **Private storage (R2)** | **65%** | In progress | Block 37 byte roundtrip smoke (disabled guard + optional full roundtrip); prod bucket deferred |
| **Email / notifications** | **35%** | In progress | Read-only outbox API + local smoke (Post-MVP Block 38); no real sending |
| **Audit / activity** | **78%** | In progress | Dashboard feed + dedicated browser gate (Blocks 31, 51); full audit UI deferred |
| **AI provider (OpenRouter)** | **62%** | In progress | AI Gateway v1 on main; local deterministic default; live provider opt-in only |
| **AI Operations Console** | **75%** | In progress | v1 on main (AI Delivery runs); MI listing + filters/export in baseline closeout |
| **Operator docs & runbooks** | **100%** | Done (local) | Puriva Blocks 7–30 + Post-MVP Phases A–E + Phase F Blocks 58–77 runbooks and closeout index |
| **Tests / smoke** | **100%** | Done (local) | Puriva MVP + Post-MVP Phases A–D browser layers in pre-staging |
| **PR #13 merge → main** | **100%** | Done | Merged at `584e041bd85e8179e795a0e4621a0d9d8908e0b6`; follow-up docs commit `07b1f1668d11cdef42b195cfad189c4df645acc6` |
| **Local main validation** | **100%** | Done | Passed after Windows Prisma DLL lock cleanup |
| **Local pre-staging proof** | **95%** | Accepted | Full pre-staging reached Finance admin browser smoke; isolated Finance smoke passed after local admin restore and API/Web restart |
| **Confirmed staging target** | **100%** | Done (G1) | `staging.digitalcubeagency.net` approved; production `system.digitalcubeagency.net`; separate staging stack on same VPS; DNS deferred until G4 prep; G4 VPS execution not approved |
| **Current main deployed to production** | **0%** | Deferred | Not deployed; no VPS migration, restart, or release performed |
| **Production deployment of current main** | **0%** | Deferred | Frozen unless explicitly approved |
| **Licensee tenant migration** (`OWN_DOMAIN` → separate tenant) | **0%** | Deferred | Future block |
| **Revenue Hub AI** | **0%** | Deferred (RH0 docs) | Future module — see [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) |
| **POD AI Toolkit** | **0%** | Deferred (POD0 docs) | Future module — see [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) |
| **Scraping / broad data collection** | **0%** | Deferred | Future module |
| **Live GA/GSC, Google OAuth** | **0%** | Deferred | Snapshot-first only today |
| **Live WordPress auto-publish (prod)** | **0%** | Deferred | Draft handoff yes; auto-publish no |
| **Stripe / payments / accounting integrations** | **0%** | Deferred | Finance = admin records |
| **Invite / password reset / role editing UI** | **0%** | Deferred | Security improvements deferred |

---

## Client/domain roadmap — blocks 1–6

| Block | Name | % | Status |
|-------|------|---|--------|
| 1 | Client foundation + `clientKind` | **92%** | Done |
| 2 | PublicationTarget | **95%** | Done |
| 3 | MI → `clientId` | **88%** | Done |
| 4 | Encrypted credentials | **88%** | Done (local); staging/prod key pending |
| 5 | Real WP publish + PublicationLog | **90%** | Done (local); live Puriva pending |
| 6 | Module middleware | **96%** | Done (local); staging enforce pending |
| *Future* | Licensee tenant migration | **0%** | Deferred |

**Average of blocks 1–6 (local): ~92%**

---

## Ready today vs waiting

### Ready for local operator work (~88% of operational product)

- CRM (Clients, Projects, Tasks)
- AI Delivery admin workflow
- Market Intelligence admin workflow
- Finance admin records
- Monthly Reports (admin + client-safe archive path)
- Client Portal MVP visibility path (Puriva smoke gate PASS locally)
- Client Hub (profile, publication targets, credentials shell, analytics shell)
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
