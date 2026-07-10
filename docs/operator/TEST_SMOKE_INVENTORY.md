# Test and Smoke Inventory

**Status:** G419 refresh (extends G224/G142). Root [`package.json`](../../package.json) smoke scripts re-checked on 2026-07-10 for the G409–G428 security/operator lane. This document is an operator reference only; it does not run tests, smoke scripts, live probes, deploys, or migrations.

**Honesty rule:** Sections 1–2 list **existing** root package scripts. Section 5 lists **expected / lane-added local focused tests and helpers** from G89–G408 work. Listing a focused test here does **not** mean a live smoke passed. Live smokes and target-environment proofs remain deferred until owner-approved execution gates. See also [`NO_LIVE_PROOF_CATALOGUE.md`](./NO_LIVE_PROOF_CATALOGUE.md) and [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md).

**Command convention:** Run from `C:\dcaosv1` in external Windows PowerShell. Prefer `npm.cmd run <script>` on Windows. Validate must pass before smoke. Long runs should log to `$env:TEMP` and open Notepad. Do not track or commit `.cursor/settings.json`.

**Truth sweep:** Staging has historical G46d/G47 PASS evidence; production readiness remains **NO**; G50 is not executed; Puriva Launch remains blocked. This inventory does not authorize live calls, staging/VPS/prod mutation, commit, push, or deploy.

---

## 1. Non-Smoke Root Scripts

| Script | Package command | Operator purpose | Guard notes |
|---|---|---|---|
| `check` | `node scripts/run-sequential.mjs "node scripts/check-workspace.mjs" "npm run --workspaces --if-present check"` | Workspace checks and type checks | Safe before services. |
| `build` | `npm run --workspaces --if-present build` | Build all workspaces | Safe before services. |
| `validate` | `node scripts/run-sequential.mjs "npm run -w @dca-os-v1/data prisma:generate" "npm run check" "npm run build"` | Canonical validation gate | Run before API/web to avoid Prisma EPERM. Stop on failure. |
| `test` | `node scripts/run-sequential.mjs "npm run test:unit" "npm run test:integration"` | Unit + integration sequence | Requires any test prerequisites expected by workspaces. |
| `test:unit` | `node scripts/run-sequential.mjs "npm run -w @dca-os-v1/api test:unit" "npm run -w @dca-os-v1/web test:unit"` | API + web unit tests | No live external calls expected. |
| `test:integration` | `npm run -w @dca-os-v1/api test:integration` | API integration tests | May require local DB/test env. |
| `test:e2e` | `playwright test` | Playwright e2e | Requires explicit operator intent and services. |
| `test:e2e:ui` | `playwright test --ui` | Playwright interactive UI | Manual/debug only. |
| `dev:web` | `npm run -w @dca-os-v1/web dev` | Start local web on `:5173` | Start only when smoke/browser proof needs it. |
| `dev:api` | `npm run -w @dca-os-v1/api dev` | Start local API on `:4000` | Start only after validate passes. |
| `restore:local-admin` | `tsx scripts/restore-local-admin.mjs` | Local admin recovery | Mutation-capable local data operation; requires explicit need. |
| `bootstrap:staging-admin` | `node scripts/bootstrap-staging-admin.mjs` | Staging admin bootstrap | Mutation-capable; owner-approved staging only; must refuse unsafe target. |
| `setup:puriva:local` | `node scripts/setup-puriva-local.mjs` | Local Puriva setup | Local data setup; use only when scoped. |

---

## 2. Smoke Script Categories

### 2.1 Local Orchestrators and Broad Gates

| Script | Runner | Notes |
|---|---|---|
| `smoke:local` | PowerShell | API health/auth basics; local only. |
| `smoke:browser` | PowerShell | Browser login shell; requires web/API. |
| `smoke:mvp:local` | Node | Local MVP auth/tenant/modules/finance baseline. |
| `smoke:staging-readiness:local` | PowerShell | Local Block A minimum orchestrator; no staging mutation. |
| `smoke:production-readiness:local` | PowerShell | Broad deterministic local closeout; does not prove production readiness. |
| `smoke:pre-staging:local` | PowerShell | Full local closeout before staging discussion; no VPS/deploy. |
| `smoke:puriva-readiness:local` | PowerShell | Puriva local readiness chain; no live provider claim. |
| `smoke:ai-post-merge:sanity` | PowerShell | AI post-merge sanity pack. |

### 2.2 Staging / Remote Guarded Scripts

| Script | Runner | Required guard |
|---|---|---|
| `smoke:mvp:staging` | Node | Requires explicit staging API target; owner-approved staging only. |
| `smoke:staging-security-baseline` | Node | Requires `DCA_SMOKE_REMOTE_TARGET=staging`; optional production health probe needs explicit opt-in. |

These scripts are not local default gates. They must not be run as a substitute for explicit staging approval.

### 2.3 API and Local Data Smokes

| Script | Runner | Primary proof |
|---|---|---|
| `smoke:client-portal:local` | Node | Client archive API and client-safe boundaries. |
| `smoke:client-access:local` | Node | Admin grant/revoke and client boundaries. |
| `smoke:finance-ledger:local` | Node | Finance ledger path. |
| `smoke:ai-delivery-reviews` | Node | AI Delivery reviews, drafts, images, deliverables, WP draft prep. |
| `smoke:ai-seo-content-plan-pdf` | Node | Content plan PDF export path. |
| `smoke:ai-market-intelligence` | Node | Market intelligence local flow. |
| `smoke:ai-knowledge-context` | Node | Knowledge/context selection and isolation. |
| `smoke:ai-operations:local` | Node | AI Operations API paths. |
| `smoke:ai-matrix` | Node | AI matrix/local policy surface. |
| `smoke:client-safe-ai-visibility:local` | Node | Client-safe AI visibility boundary. |
| `smoke:monthly-report:local` | Node | Monthly report lifecycle. |
| `smoke:monthly-report:pdf` | Node | Monthly report PDF path. |
| `smoke:monthly-report:mi-context` | Node | MI context and non-exposure. |
| `smoke:monthly-report:metrics` | Node | Metrics snapshot API. |
| `smoke:google-drive-export` | Node | Google export handoff contract; guarded/local. |
| `smoke:email-outbox:local` | Node | Local outbox/no-send evidence. |
| `smoke:credential-encryption:local` | Node | Credential encryption roundtrip. |
| `smoke:r2-byte-roundtrip:local` | Node | R2 disabled-safe and optional configured roundtrip. |
| `smoke:r2-storage-boundary:local` | Node | R2 boundary behavior. |
| `smoke:wordpress-publish:local` | Node | WordPress disabled-safe / publication log behavior. |
| `smoke:legacy-wordpress-sunset:local` | Node | Legacy WordPress config sunset. |
| `smoke:tenant-module:local` | Node with `tsx` import | Tenant module route map. |
| `smoke:tenant-module:dry-run-probe` | Node | Tenant module dry-run probe. |
| `smoke:tenant-module:phase-f-local` | Node | Tenant module Phase F local proof. |
| `smoke:openrouter-guarded:local` | Node | Local deterministic gateway and guarded OpenRouter path. |
| `smoke:openrouter-api-env-preflight:local` | Node | No-live OpenRouter env preflight. |
| `smoke:ai-provider-config:local` | Node | AI provider config shape. |
| `smoke:ai-orchestrator-lite:local` | Node | Orchestrator-lite local proof. |
| `smoke:external-integrations-readiness:local` | Node | Config-shape readiness only; no live calls. |
| `smoke:admin-operations:local` | Node | Admin operations summary and client boundary. |
| `smoke:projects-tasks:local` | Node | Projects and tasks API path. |
| `smoke:client-role-api-boundary:local` | Node | Client-role API boundary. |
| `smoke:puriva-client-setup:local` | Node | Puriva client setup. |
| `smoke:puriva-full-delivery:local` | Node | Puriva full local delivery path. |
| `smoke:puriva-client-portal-boundary:local` | Node | Puriva client-safe portal boundary. |
| `smoke:google-drive-export-live:local` | Node | Guarded live export planning probe; owner-approved only if live. |
| `smoke:credential-master-key-probe:local` | Node | Master key configured probe. |
| `smoke:post-mvp-readonly-apis:local` | Node | Post-MVP read-only APIs. |

### 2.4 Browser Smokes

| Script | Runner | Primary proof |
|---|---|---|
| `smoke:client-domain:browser` | Node | Client domain browser regression. |
| `smoke:ai-operations:browser` | Node | AI Operations console UI. |
| `smoke:client-portal:browser` | Node | Portal archive UI. |
| `smoke:client-portal:signed-out:browser` | Node | Signed-out portal shell. |
| `smoke:client-portal:edge-cases:browser` | Node | Portal edge cases. |
| `smoke:client-portal:sparse-delivery:browser` | Node | Sparse delivery portal. |
| `smoke:client-portal:populated-delivery:browser` | Node | Populated delivery and forbidden HTML. |
| `smoke:client-portal:access-revoke:browser` | Node | Access revoke UX. |
| `smoke:client-portal:empty-archive:browser` | Node | Empty archive UI. |
| `smoke:client-portal:project-filter:browser` | Node | Project filter UI. |
| `smoke:client-portal-monthly-report:browser` | Node | FINAL-only reports in portal. |
| `smoke:client-hub:catalog-inquiry:browser` | Node | Client Hub catalog/inquiry flow. |
| `smoke:client-hub:publication-log:browser` | Node | Client Hub publication log. |
| `smoke:client-hub:edge-cases:browser` | Node | Client Hub edge cases. |
| `smoke:client-access:browser` | Node | Client Access admin UI. |
| `smoke:dashboard:audit-feed:browser` | Node | Dashboard audit feed. |
| `smoke:settings-team:browser` | Node | Settings/team shell. |
| `smoke:content-plan-review:browser` | Node | Deferred content plan review route. |
| `smoke:content-draft-review:browser` | Node | Deferred content draft review route. |
| `smoke:finance-admin:browser` | Node | Finance admin UI sanity. |
| `smoke:admin-daily-cockpit:browser` | Node | Admin daily cockpit UI. |
| `smoke:mi-operator:browser` | Node | MI operator shell. |
| `smoke:ai-delivery-workflow:browser` | Node | AI Delivery workflow UI. |
| `smoke:workflow-brief-publication-handoff:browser` | Node | Workflow brief publication handoff. |
| `smoke:monthly-metrics-import:browser` | Node | Monthly metrics import UI. |
| `smoke:roles-permissions:browser` | Node | Roles/permissions browser proof. |
| `smoke:module-registry:browser` | Node | Module registry UI. |
| `smoke:settings-backend:browser` | Node | Settings backend binding. |
| `smoke:audit-activity:browser` | Node | Audit activity UI. |
| `smoke:dashboard-data-backed:browser` | Node | Data-backed dashboard metrics. |
| `smoke:auth-invite-boundary:browser` | Node | Auth/invite boundary copy. |
| `smoke:monthly-report:browser` | Node | Admin monthly report UI. |

---

## 3. Guard Summary

| Guard | Applies to |
|---|---|
| Validate first | All smoke scripts. Never run smoke after failed validate. |
| Services only when needed | API smokes need local API; browser smokes need API and web. Docs-only work starts neither. |
| `$env:AUTH_SEED_TEST_PASSWORD` | Most authenticated local smokes. Never print the value. |
| Explicit remote target | `smoke:mvp:staging`, `smoke:staging-security-baseline`. |
| Owner approval | Staging/prod remote proof, live integrations, bootstrap write mode, deploy, migrations, commit, push. |
| No live-call default | External integrations readiness, email/outbox, R2, WordPress, AI provider, GA/GSC docs must preserve disabled/config-shape language unless proof is recorded. |

---

## 4. Package Script Completeness Note

This inventory covers root `package.json` scripts visible in the G142/G224 passes. If future scripts are added, update this document and [`LOCAL_SMOKE_MATRIX.md`](../runbooks/LOCAL_SMOKE_MATRIX.md) together, preserving the distinction between local proof, guarded remote proof, mutation-capable setup, and live integration execution.

---

## 5. G419 — Focused local tests / helpers inventory (placeholders + known files)

These are **local unit/integration/helper** surfaces other lanes are adding or have added. They are not live smokes. Status labels:

- **Present** — file observed in repo during G224/G419 inspection
- **Expected** — placeholder for a focused test/helper other lanes may add; treat as inventory slot until confirmed Present
- **Live deferred** — any real provider/bucket/OAuth/HTTP send remains owner-gated

| Area | Focused local surface | Status | Live? |
|---|---|---|---|
| Storage / R2 | `apps/api/src/storage/r2.config.test.ts` | Present | Live deferred |
| Storage / R2 | `apps/api/src/storage/r2-proof-stage.test.ts` | Present | Live deferred |
| Storage / R2 | `apps/api/src/storage/private-storage.service.test.ts` | Present | Live deferred |
| Storage / R2 | `apps/api/src/storage/storage-key-boundary.ts` (+ serializer boundary tests) | Present | Live deferred |
| Storage / R2 | `apps/api/src/storage/storage-error-redaction.test.ts` | Present (G409 lane) | No live |
| Storage / R2 | `apps/api/src/storage/admin-vs-client-storage-field-policy.ts` | Present | No live |
| Storage / R2 | `apps/api/tests/integration/r2-storage-boundary.integration.test.ts` | Present | Live deferred |
| Storage / R2 | `apps/api/tests/integration/sec-h1-storage-key-leak.integration.test.ts` | Present | Live deferred |
| Storage / R2 | Additional signed-URL / image-variant byte helpers | Expected | Live deferred |
| Security / redaction | `apps/api/src/services/wordpress-credentials-redaction.test.ts` | Present | No live |
| Security / redaction | `apps/api/src/core/client-portal-error-safety.test.ts` | Present | No live |
| Notifications | `apps/api/src/notifications/notification-events.test.ts` | Present | Live deferred |
| Notifications | `apps/api/src/notifications/email-no-send-adapter.test.ts` | Present | Live deferred |
| Notifications | `apps/api/src/config/email.config.test.ts` | Present | Live deferred |
| Notifications | `apps/api/tests/integration/email-notification-wiring.integration.test.ts` | Present | Live deferred |
| Notifications | In-system inbox / persistence model tests | Expected | Live deferred (persistence may still be unimplemented) |
| GA / GSC | `apps/api/src/config/ga-gsc.config.test.ts` | Present | Live deferred |
| GA / GSC | Monthly report policy / FINAL visibility helpers (`monthly-report-policy.test.ts`, `client-portal-monthly-report.test.ts`) | Present | Live deferred |
| GA / GSC | OAuth token storage / refresh unit suite | Expected | Live deferred |
| WordPress | `apps/api/src/services/wordpress.service.test.ts` | Present | Live deferred |
| WordPress | Publish-freeze / credential-shape focused coverage | Expected (may already be inside wordpress.service.test) | Live deferred; auto-publish stays deferred |
| Image | `apps/api/src/core/image-compliance-policy.test.ts` | Present | Live deferred |
| Image | `apps/api/src/core/image-generation.execution.test.ts` | Present | Live deferred |
| Image | `apps/api/tests/integration/image-generation.integration.test.ts` | Present | Live deferred |
| Image | Live provider client wiring tests | Expected | Live deferred |
| Client Portal | `apps/api/src/core/client-portal.runtime.test.ts` | Present | Live deferred |
| Client Portal | `apps/api/src/core/client-portal-edit.runtime.test.ts` | Present | Live deferred |
| Client Portal | `apps/api/src/core/client-portal-monthly-report.test.ts` | Present | Live deferred |
| Client Portal | `apps/api/tests/integration/client-portal.integration.test.ts` | Present | Live deferred |
| Client Portal | Staging/production browser proof suite | Expected | Live deferred |
| Packs | `apps/api/src/core/client-operating-packs.test.ts` | Present | No live |
| Future modules | `packages/shared/src/future-module-contracts.proof.ts` | Present | No live (contracts only) |
| Future modules | MI / Revenue Hub / POD live ingestion tests | Expected | Live deferred |
| AI budget | `apps/api/src/core/ai-budget-reporting.contract.test.ts` | Present | No live |
| AI budget | Trusted `actualCostUsd` ingestion tests | Expected | Live deferred (ingestion not implemented) |
| External readiness | `apps/api/src/core/external-integrations-readiness.service.test.ts` | Present | Config-shape only |
| Staging guards | `scripts/smoke-staging-security-baseline.guard.test.mjs` | Present | Remote live deferred |
| Staging guards | `scripts/bootstrap-staging-admin.guard.test.mjs` | Present | Mutation deferred |

### 5.1 Live smoke deferral reminder

| Category | Inventory meaning |
|---|---|
| Local focused tests above | May be run after `npm.cmd run validate` when scoped |
| Existing `smoke:*:local` / browser scripts in §2 | Local/disabled-safe or config-shape unless a recorded proof says otherwise |
| `smoke:mvp:staging`, `smoke:staging-security-baseline` | Guarded remote; owner approval required |
| Real R2 IO, live email, live GA/GSC, live WordPress, live image provider | **Not** inventory-complete; remain deferred |

---

## 6. Related docs

- Security alignment: [`docs/security/SECURITY_CHECKLIST_G409.md`](../security/SECURITY_CHECKLIST_G409.md) (prefer over G223)
- No-live catalogue: [`NO_LIVE_PROOF_CATALOGUE.md`](./NO_LIVE_PROOF_CATALOGUE.md)
- Local-only taxonomy: [`LOCAL_ONLY_PROOF_TAXONOMY.md`](./LOCAL_ONLY_PROOF_TAXONOMY.md)
- Validation guards: [`VALIDATION_COMMAND_GUARDS.md`](./VALIDATION_COMMAND_GUARDS.md)
- Lane roadmap notes: [`G409_NEXT_GATES.md`](./G409_NEXT_GATES.md) (L12 owns final next-50)
- Historical next-30: [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md)
- Proposed main-doc patches (G223 era): [`_g223_g227_proposed_main_doc_updates.md`](./_g223_g227_proposed_main_doc_updates.md); G409 proposals in `$env:TEMP\dca-g409-g428-security-proposed-main-docs.md`
