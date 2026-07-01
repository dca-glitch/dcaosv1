# Launch Readiness Audit — BLOK 8–13 Actual State

**Audit date:** 2026-07-01  
**Target launch:** 2026-07-15 (14 days)  
**Method:** Read-only inspection of repository files and live HTTP probes to `staging.digitalcubeagency.net`. No commit messages, status docs, or prior summaries were treated as evidence unless verified in code or runtime.

---

## Executive summary

Puriva-facing UI and API scaffolding for briefs, approvals, archive, and delivery handoff are largely implemented in the frontend and backend. However, several launch-critical paths are **not proven end-to-end**: the Puriva `Brief` table appears in Prisma schema **without a committed migration**, brief-submit email is **not wired**, WordPress publish has code but **no in-repo proof against a real site**, Google Docs is **link-out only** (no embedded viewer), and **no automated test** covers brief → content → approval → publish. Staging **is live** (API health + web shell respond 200), which contradicts older runbooks that say DNS/G4 are pending.

**Bottom line:** July 15 is **tight but possible** only if work focuses on schema/deploy blockers, operator configuration (email, Google Drive, WordPress), and one full Puriva dry-run on staging — not on building net-new UI from scratch.

---

## PHASE 1 — BLOK 8–13 ACTUAL STATE

### BLOK 8 — Brief UI

**Overall status: BUILT BUT UNVERIFIED** (schema migration gap may block persistence in deployed DBs)

| Question | Finding | Evidence |
|----------|---------|----------|
| Does `BriefPage.tsx` exist and render a brief form? | **Yes.** Full monthly + additional brief editors with planning fields, save draft, submit, status badges, read-only states. | `apps/web/src/pages/BriefPage.tsx` (870+ lines; `MonthlyBriefEditor`, `AdditionalBriefEditor`, `Create Brief` empty state at ~1506–1520) |
| Backend endpoint for create/submit? | **Yes.** CRUD + submit on `/api/v1/briefs`. | `apps/api/src/routes/briefs.ts`: `GET /`, `POST /`, `PATCH /:id`, `POST /:id/submit`; mounted in `apps/api/src/routes/v1.ts` line 14 |
| Accessible to CLIENT-role (Puriva)? | **Yes.** Client-only nav includes `briefs`; page loads client via `/my-client` for non-admin; API allows `client` role with `clientUserAccess` checks. | `apps/web/src/lib/navigation-filter.ts` lines 25–31; `BriefPage.tsx` lines 973–991, 897–904; `briefs.ts` lines 22–24, 139–151, 444–448 |
| Does Create/Submit persist to DB? | **Code path exists; migration missing; not proven at runtime.** `prisma.brief.create` / `update` on save and submit. **No `Brief` table migration** in `packages/data/prisma/migrations/` — only `AiDeliveryBrief` exists (`20260618165800_add_ai_delivery_project_brief_foundation`). Schema defines `model Brief` at `packages/data/prisma/schema.prisma` lines 706–730. | `briefs.ts` lines 316–333, 418–421, 479–486; migration grep across `packages/data/prisma/migrations/` finds no `CREATE TABLE "Brief"` |

**Additional notes**

- Admin operator view: `apps/web/src/pages/BriefPanelPage.tsx` + route `briefs-panel` in `App.tsx`.
- Client portal hash route also renders `BriefPage`: `apps/web/src/pages/client-portal/ClientPortalRouter.tsx` lines 23–24.
- Dashboard loads briefs: `apps/web/src/pages/ClientDashboardPage.tsx` lines 166–170.
- **No smoke or integration test** hits `POST /briefs` or `POST /briefs/:id/submit` (grep of `scripts/` finds no `/briefs` usage).
- Puriva E2E (`tests/e2e/client-dashboard.spec.ts` TEST 4) navigates to Briefs and checks UI text only — **does not create or submit**.

---

### BLOK 9 — Google Docs frontend

**Overall status: PARTIAL**

| Question | Finding | Evidence |
|----------|---------|----------|
| Google Drive/Docs backend service? | **Yes.** Service-account export with real `googleapis` when env configured; returns `provider_disabled` / `provider_not_configured` when not. | `apps/api/src/services/google-drive.service.ts` (full implementation from ~130); route `POST .../export-google-doc` in `apps/api/src/routes/core.ts` line 344; runtime wrapper `exportAiDeliveryDeliverableToGoogleDoc` in `apps/api/src/core/core.runtime.ts` ~9044+ |
| Frontend displays Google Docs content? | **Partial — links only, no embed.** Client portal shows `exportUrl` as external “Open document” links. Admin AI Delivery page has export action + result display. **No iframe, embed, or in-app Google Docs viewer** (grep `apps/web` for `iframe`, `docs.google`, `embed` → no matches). | `apps/web/src/pages/client-portal/ClientPortalPage.tsx` lines 1160–1178, 1321–1323; `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` `exportDeliverableToGoogleDoc` ~1934–1957 |
| Smoke coverage | Local smoke expects `provider_disabled` without creds; separate live script exists. | `scripts/smoke-google-drive-export-local.mjs`; `scripts/smoke-google-drive-export-live-local.mjs`; fixture URL in `scripts/lib/puriva-delivery-summary-fixture.mjs` |

---

### BLOK 10 — Email notifications

**Overall status: PARTIAL** (one delivery trigger wired; brief-submit not wired; default provider does not send)

| Trigger | Status | Evidence |
|---------|--------|----------|
| **Brief submitted** (Puriva `Brief` model) | **NOT wired** | `apps/api/src/routes/briefs.ts` submit handler (~429–491) only updates `prisma.brief` status — **no** `sendEmailNotification` call. Repo-wide grep: `sendEmailNotification` appears only in `client-portal-approval.runtime.ts` and `email-notifications.service.ts`. |
| **Content ready for review** | **Wired in code; dormant unless `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`** | `sendAiDeliveryDeliverableForClientReview` in `apps/api/src/core/client-portal-approval.runtime.ts` lines 622–628 calls `notifyClientUsers` with template `AI_DELIVERY_REVIEW_REQUEST`. `sendEmailNotification` in `email-notifications.service.ts`: `EMAIL_PROVIDER=local` → status `SKIPPED` (lines 109–114). |
| AI Delivery system events | **Internal log only, not outbound email** | `apps/api/src/services/system-events.service.ts` `recordAiDeliverySystemEvent` writes `EmailLog` with `status: SKIPPED` and message “no email delivery attempted” (lines 80–92). |
| Contract doc vs code | Docs say “no module events wired to send”; code partially contradicts for review-request path. | `docs/email-notifications-contract.md` lines 11, 66–72 vs `client-portal-approval.runtime.ts` |

Template keys in schema: `CLIENT_INVITE`, `PASSWORD_RESET`, `AI_DELIVERY_BRIEF_REQUEST`, `AI_DELIVERY_REVIEW_REQUEST`, `AI_DELIVERY_APPROVED`, `INVOICE_ISSUED` — `packages/data/prisma/schema.prisma` enum `EmailTemplateKey`; migration `20260620165200_add_email_notifications_foundation`.

---

### BLOK 11 — WordPress publish

**Overall status: BUILT BUT UNVERIFIED** (real HTTP path when gated; no in-repo proof on a live WordPress site)

| Question | Finding | Evidence |
|----------|---------|----------|
| Backend integration exists? | **Yes.** Publication targets + encrypted credentials; `publishAiDeliveryDeliverableToWordPress` calls WordPress REST `POST /wp-json/wp/v2/posts` when `WORDPRESS_PUBLISH_ENABLED=true` and application password present. | `apps/api/src/services/wordpress.service.ts` lines 199–272; `apps/api/src/core/core.runtime.ts` ~8884–9041; `apps/api/src/core/client-publication.runtime.ts`; route in `apps/api/src/routes/core.ts` line 343 |
| Exercised against real WordPress? | **No evidence in repo.** Smoke uses fake target `https://smoke-wp-publish-target.example.local` and expects `provider_disabled` unless `SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED=true`. | `scripts/smoke-wordpress-publish-local.mjs` lines 142, 222–248 |
| Legacy mock note | `getAiDeliveryWordPressConfigForTenant` still returns “not configured” mock — **not used** by main publish path, which uses client publication targets instead. | `wordpress.service.ts` lines 284–311 vs `core.runtime.ts` `resolvePublicationTargetForClient` |

---

### BLOK 12 — Staging deployment

**Overall status: WORKING END-TO-END** (infrastructure reachable; full Puriva business flow on staging not verified)

| Check | Result | Evidence |
|-------|--------|----------|
| `staging.digitalcubeagency.net` API | **HTTP 200** — `GET /api/v1/health` returns `ok: true`, `database.status: ready`, `service: dca-os-v1-api` | Live probe 2026-07-01 |
| Staging web | **HTTP 200** — HTML title `DCA OS v1` | Live probe 2026-07-01 |
| Repo docs | **Stale** — multiple docs state DNS not created / G4 not approved | e.g. `docs/runbooks/STAGING_MIGRATION_PROCEDURE.md` line 7, `docs/deployment/VPS_STAGING_DEPLOYMENT_PLAN.md` line 27 |
| Staging smoke script | Exists: `npm run smoke:mvp:staging` → `scripts/smoke-mvp-local.mjs --staging` | `package.json` line 40 |

**Caveat:** Staging health and static web prove deployment exists; this audit did **not** run authenticated Puriva flows against staging (read-only constraint on mutating/auth probes).

---

### BLOK 13 — Full Puriva E2E test

**Overall status: NOT STARTED** (for full business flow); **PARTIAL** (navigation-only browser tests exist)

| Coverage | What exists | Gap |
|----------|-------------|-----|
| Puriva client login + nav | `tests/e2e/client-dashboard.spec.ts` — 8 tests: login, sidebar, dashboard widgets, navigate Briefs/Pending Approvals/Monthly Reports/Archive, logout | No brief create/submit, no approval action, no publish |
| Client portal security | `tests/e2e/client-portal.spec.ts` — archive shell, no `storageKey` leak | No business flow |
| API integration | `apps/api/tests/integration/client-portal.integration.test.ts` — auth boundaries only | No brief/approval/publish chain |
| Smoke scripts | Client portal smokes prove delivery **summary UI** with fixtures (Google Doc link, publishing status) | Fragmented; not one sequential brief→publish test |

**No test file** implements: brief submit → DCA content production → send for review → client approval → WordPress publish.

---

## PHASE 2 — REAL REMAINING GAP (ranked by what blocks Puriva)

Ranked by **client-blocking impact**, not BLOK number.

### 1. Puriva brief persistence may be broken in deployed environments (BLOCKER)

- **Gap:** `Brief` model in schema with API/UI complete, but **no migration** creates the `Brief` table.
- **Impact:** Create Brief / Submit may 500 on staging/production after `prisma migrate deploy`.
- **Evidence:** `packages/data/prisma/schema.prisma` `model Brief`; zero `CREATE TABLE "Brief"` in migrations.
- **Effort:** Small migration + deploy — **must happen before launch**.

### 2. No proven end-to-end Puriva journey (BLOCKER for confidence)

- **Gap:** No automated or documented proof of brief → content → approval → publish on staging with Puriva credentials.
- **Impact:** Launch risk is unknown; regressions undetected.
- **Effort:** 1–3 days for scripted dry-run + Playwright or smoke extension.

### 3. WordPress publish to Puriva’s real site (BLOCKER for “publish” step)

- **Gap:** Code exists; smoke uses fake URL; `WORDPRESS_PUBLISH_ENABLED` and encrypted publication-target credentials required.
- **Impact:** Client cannot see content on their website via system until configured and tested once on real WP.
- **Effort:** 1–2 days operator work (credentials, target setup, one live publish test) — **not large new code**.

### 4. Email notifications not production-ready (HIGH — operational, not UI)

- **Gap:** Brief submit sends **no email** to DCA; review-request emails **skip** under default `EMAIL_PROVIDER=local`; Resend key not in repo.
- **Impact:** Puriva/DCA rely on manual checking inside the app unless email is configured and brief-submit trigger added.
- **Effort:** ~0.5 day to wire brief submit notification + staging Resend config + verification.

### 5. Google Docs — export env + client handoff (MEDIUM)

- **Gap:** Backend export needs `GOOGLE_DRIVE_*` env vars; client UI only opens external links (`exportUrl`), not embedded docs.
- **Impact:** Acceptable for MVP if “Open document” links work after admin export; **not** acceptable if product expectation is in-app Google Docs rendering.
- **Effort:** Env setup + one export test; embed would be **new scope**.

### 6. Two parallel “brief” systems (MEDIUM — process confusion)

- **Puriva `Brief`** (`/briefs`, `BriefPage`) — monthly client briefs.
- **AI Delivery `AiDeliveryBrief`** (`/ai-delivery-projects/:id/brief`, `AiDeliveryPage`) — internal project brief.
- **Gap:** No code links Puriva brief submit to AI Delivery project creation/workflow.
- **Impact:** DCA team must manually bridge brief → production; Puriva may think submit triggers content pipeline automatically.
- **Effort:** Clarify process for launch; automation is **post-MVP** unless explicitly scoped.

### 7. Staging vs documentation drift (LOW for code, HIGH for process)

- Staging is **up**; docs still say not deployed. Operators may skip staging validation believing it unavailable.
- **Fix:** Update runbooks and run `smoke:mvp:staging` as gate.

---

## July 15 realism assessment

| Area | Ready? | Notes |
|------|--------|-------|
| Brief UI (Puriva) | ~90% code | Migration + E2E proof missing |
| Client portal (approvals, archive, dashboard) | ~85% code | Smokes cover fragments; not full chain |
| Admin AI Delivery production | Substantial | Separate from Puriva `Brief` table |
| Email | ~40% | Infrastructure yes; brief trigger no; sending inactive locally |
| Google Docs | ~60% | Backend yes; client sees links; env-dependent |
| WordPress | ~70% code | Config + real-site test missing |
| Staging | Deployed | Puriva flow unverified there |
| Full E2E test | ~10% | Nav tests only |

**Verdict:** **14 days is realistic for a controlled Puriva launch** if scope is:

1. Add and deploy `Brief` migration (non-negotiable).
2. Configure staging/production: email (Resend), Google Drive export (if used), Puriva WordPress publication target.
3. Wire brief-submit email to DCA (small backend change).
4. Execute one full manual + automated dry-run on staging; fix blockers found.
5. Accept **manual DCA handoff** from submitted brief to AI Delivery content (document in operator runbook).

**14 days is not realistic** if the launch definition requires:

- In-app embedded Google Docs viewer.
- Automatic brief → AI content pipeline without DCA intervention.
- Proven WordPress publish on production Puriva site **without** operator credential/setup work.
- Full email parity for every workflow step on day one.

---

## Evidence index (primary files)

| Area | Paths |
|------|-------|
| Brief UI | `apps/web/src/pages/BriefPage.tsx`, `BriefPanelPage.tsx`, `ClientDashboardPage.tsx` |
| Brief API | `apps/api/src/routes/briefs.ts`, `apps/api/src/routes/v1.ts` |
| Brief schema | `packages/data/prisma/schema.prisma` (`model Brief`) |
| Client nav/RBAC | `apps/web/src/lib/navigation-filter.ts`, `apps/web/src/App.tsx` |
| Google export | `apps/api/src/services/google-drive.service.ts`, `apps/web/src/pages/client-portal/ClientPortalPage.tsx` |
| Email | `apps/api/src/services/email-notifications.service.ts`, `apps/api/src/core/client-portal-approval.runtime.ts` |
| WordPress | `apps/api/src/services/wordpress.service.ts`, `apps/api/src/core/core.runtime.ts`, `apps/api/src/core/client-publication.runtime.ts` |
| E2E tests | `tests/e2e/client-dashboard.spec.ts`, `tests/e2e/client-portal.spec.ts` |
| Staging smoke | `scripts/smoke-mvp-local.mjs`, `package.json` `smoke:mvp:staging` |

---

## Audit constraints

- Read-only: no source edits, commits, server starts, or authenticated mutating probes against staging.
- Findings reflect repository state and public staging HTTP endpoints only.

**GATE: KEEP | agent: yes | budget: medium | mistakes: 0**
