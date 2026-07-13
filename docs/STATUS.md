# DCA OS Lite — Status (Source of Truth)

**Last updated:** 2026-07-13 (Production clean-state reset COMPLETE — acceptance fixtures removed; Turnstile temporarily disabled; first-run onboarding ready; external providers still owner-gated; Puriva full launch NOT claimed)
**Production runtime:** `57f9c524118a5bf6c93270626cef7c8bd52d140b` / image `bd61d5deb331` · web `index-DX4AMrb2.js` · tip docs pending closeout commit after `e36758b`
**Production artifact:** `/opt/dca/production-artifacts/57f9c52` (web refreshed in place earlier; no redeploy on resume)
**Production migration catch-up:** 50 finished / 0 unfinished (unchanged by clean reset)
**Production clients:** 0 active (acceptance Puriva + Bali placeholder removed); owner adds first real client via `#/setup`
**Production classification:** `CLEAN_FIRST_RUN_OWNER_SETUP` · `TURNSTILE_ENABLED=false` (temporary) · `PURIVA_FULL_LAUNCH=NOT_YET_CLAIMED` · live provider flags false · `SHARED_PROXY_ACTION=none`
**Interactive browser login:** Turnstile temporarily disabled; password auth + rate limiting active; owner completes company settings + first client on `#/setup`. See [`docs/operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md`](./operator/PRODUCTION_CLEAN_STATE_RESET_2026-07-13.md).
**Authoritative project control:** [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
**AI Policy / provider routing:** [`docs/architecture/AI_POLICY_PROVIDER_ROUTING.md`](./architecture/AI_POLICY_PROVIDER_ROUTING.md)
**PRE-STAGING closure:** 2026-07-10 (local/no-live audit + safe fixes; see [`docs/operator/PRE_STAGING_CLOSURE_VERDICT.md`](./operator/PRE_STAGING_CLOSURE_VERDICT.md))
**G55 pre-live readiness:** [`docs/runbooks/G55_PRELIVE_READINESS.md`](./runbooks/G55_PRELIVE_READINESS.md)
**G56 pre-live readiness:** [`docs/runbooks/G56_PRELIVE_READINESS.md`](./runbooks/G56_PRELIVE_READINESS.md)
**G57–G68 pre-live readiness:** [`docs/runbooks/G57_G68_PRELIVE_READINESS.md`](./runbooks/G57_G68_PRELIVE_READINESS.md)
**G70 live proof checklist:** [`docs/runbooks/AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9
**G72 model routing policy:** [`docs/runbooks/AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md)
**AI policy:** [`docs/ai/AI_MODEL_POLICY.md`](./ai/AI_MODEL_POLICY.md) · [`docs/architecture/AI_MODEL_POLICY.md`](./architecture/AI_MODEL_POLICY.md) · [`docs/architecture/AI_POLICY_PROVIDER_ROUTING.md`](./architecture/AI_POLICY_PROVIDER_ROUTING.md) · [`docs/ai/AI_ORCHESTRATOR_LITE.md`](./ai/AI_ORCHESTRATOR_LITE.md)
**Operator index:** [`docs/operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)
**Architecture map:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) § Current application map
**Smoke matrix:** [`docs/runbooks/LOCAL_SMOKE_MATRIX.md`](./runbooks/LOCAL_SMOKE_MATRIX.md)
**Staging gate:** [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md)
**Production safety plan:** [`docs/runbooks/G53_PRODUCTION_SAFETY_PLAN.md`](./runbooks/G53_PRODUCTION_SAFETY_PLAN.md)
**G49 dry-run proof:** [`docs/runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md)
**Live proof runbooks:** [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) · [`WORDPRESS_DRAFT_PROOF.md`](./runbooks/WORDPRESS_DRAFT_PROOF.md) · [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md)
**Env inventory (names only):** [`docs/operator/ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md)
**Deferred scope:** [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md)
**G78 notifications blocker plan:** [`docs/operator/notifications-blocker-plan.md`](./operator/notifications-blocker-plan.md)
**Client Operating Pack model:** [`docs/architecture/CLIENT_OPERATING_PACKS.md`](./architecture/CLIENT_OPERATING_PACKS.md)
**Production deployment/rollback/checklist (reference):** [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](./runbooks/PRODUCTION_DEPLOYMENT.md) · [`docs/runbooks/PRODUCTION_ROLLBACK.md`](./runbooks/PRODUCTION_ROLLBACK.md) · [`docs/runbooks/PRODUCTION_SAFETY_CHECKLIST.md`](./runbooks/PRODUCTION_SAFETY_CHECKLIST.md)
**Puriva Launch Gate (15-area evaluation):** [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](./runbooks/PURIVA_LAUNCH_GATE.md)
**Image generation proof plan:** [`docs/runbooks/IMAGE_GENERATION_PROOF.md`](./runbooks/IMAGE_GENERATION_PROOF.md)
**Security boundary audit:** [`docs/security/SECURITY_BOUNDARY_AUDIT.md`](./security/SECURITY_BOUNDARY_AUDIT.md)
**Storage/R2 proof plan:** [`docs/runbooks/STORAGE_R2_PROOF.md`](./runbooks/STORAGE_R2_PROOF.md)
**Integrations truth matrix:** [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](./runbooks/INTEGRATIONS_TRUTH_MATRIX.md)
**Admin UI/workflow polish audit:** [`docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md`](./ux/ADMIN_WORKFLOW_POLISH_AUDIT.md) (read-only; UX-P1–P12 queued blocks)
**G468 next 50 gates (historical):** [`docs/operator/G468_NEXT_50_GATES.md`](./operator/G468_NEXT_50_GATES.md)
**G708 next gates:** [`docs/operator/G708_NEXT_GATES.md`](./operator/G708_NEXT_GATES.md)
**PRE-STAGING closure verdict:** [`docs/operator/PRE_STAGING_CLOSURE_VERDICT.md`](./operator/PRE_STAGING_CLOSURE_VERDICT.md)
**PRE-STAGING operator closeout:** [`docs/operator/PRE_STAGING_OPERATOR_CLOSEOUT.md`](./operator/PRE_STAGING_OPERATOR_CLOSEOUT.md)
**PRE-STAGING architecture audit:** [`docs/architecture/PRE_STAGING_ARCHITECTURE_AUDIT.md`](./architecture/PRE_STAGING_ARCHITECTURE_AUDIT.md)

---

## Executive snapshot (G52-B + G53 + G55 + G56 + G57–G68 + G69 + G89-G708 + PRE-STAGING)

| Item | State |
|------|--------|
| Latest baseline | Production controlled deploy of runtime `57f9c52` on `main` (docs closeout follows); staging pack-binding prior tip `0e5ac4d` |
| **PRE-STAGING local closure** | **PASS (local/no-live only)** — see [`PRE_STAGING_CLOSURE_VERDICT.md`](./operator/PRE_STAGING_CLOSURE_VERDICT.md). Historical; superseded by production deploy for env readiness |
| **G69 merge** | **DONE** — G57–G68 fast-forward merged to `main`; final commit `64bfd06` |
| Production readiness | **CONTROLLED LIVE TESTING READY** — runtime `57f9c52` deployed; external providers owner-gated; Puriva full launch NOT claimed |
| Next gate | Owner interactive Turnstile login + separately approved external-provider live proofs (GA/GSC / OpenAI / WP / Resend / R2 write) |
| PRE-STAGING Lanes 14–15 | **Docs closeout** — stale-claim sweep + operator runbook refresh; no live proof; Puriva Launch **BLOCKED** |
| G469-G708 final integration | **KEEP** — 20 lanes reconciled; local/no-IO foundations only; live R2, live email, live GA/GSC, live WordPress, live image, staging/prod live proofs, full notification E2E launch proof, trusted `actualCostUsd` ingestion, commit, push, deploy remain blocked (in-app notification persistence/UI foundation now exists — see notification rows below) |
| G229-G468 final integration | **KEEP** — 12 lanes reconciled; local/no-IO foundations only; superseded as latest baseline by G469-G708 |
| G72 model routing | **Implemented** — backend policy per task type; approved model `anthropic/claude-haiku-4.5`; no live call in G72 |
| G73 routing attribution | **Local PASS** — dry-run/preview `modelRouting` + `plannedLedgerMetadata`; budget guard route cap wired; persistent preview ledger records routing metadata |
| G74 completed ledger attribution | **Implemented (no-live)** — `buildCompletedLedgerMetadata`, `prepareCompletedLedgerAttribution`, `recordCompletedAiLedgerEntry`; mocked provider execution in unit tests |
| G75 live spend attribution proof | **PARTIAL (local only)** — live OpenRouter smoke PASS; completed attribution verifier PASS (G75c); generated metadata only at G75 time — wiring gap since closed in G76 |
| G76 persistent completed ledger wiring | **Implemented (mocked/no-live)** — AI Delivery execute success path persists COMPLETED row; live DB row since proven in G77b |
| G77 persistent COMPLETED ledger live proof | **COMPLETE (local only)** — G77b live smoke + ledger verifier PASS; row `5d8d635c-ced0-4a14-9b33-839e1fdee508` for run `2244413e-d87b-45a1-8a26-6634ec8972d5` |
| G77b closeout | **COMPLETE (local only)** — local controlled live proof recorded; production remains frozen; staging/production live not claimed |
| G78 multi-scope docs | **Docs only — complete (uncommitted)** — runbook truth labels, deferred-scope buckets, notifications plan, integration/monthly-report/WordPress tier labels, pack implementation status |
| G79 monthly cap aggregation | **Implemented (local unit proof)** — `sumSpentUsdForPeriod()` includes live `COMPLETED` rows and uses `actualCostUsd ?? estimatedCostUsd`; `ai-budget-ledger.service.test.ts` 18/18 PASS |
| G80 `actualCostUsd` policy | **Policy documented only** — `actualCostUsd` remains `null` unless a trusted provider cost is exposed; no invoice-cost ingestion implemented |
| G81-G87 live proof planning | **Planning/prep only** — staging live proof, notifications, email no-send proof, approval event map, GA/GSC live metrics, WordPress live draft, and image generation provider proof plans updated; no live calls or sends executed |
| G88 consolidation | **Docs consolidation in shared files** — correct G79-G88 gate map recorded; Puriva Launch remains **BLOCKED** and production remains frozen |
| G89-G148 final integration | **KEEP** — local foundations only; live proofs remain blocked |
| G149-G228 final integration | **KEEP** — 9 lanes reconciled; local/no-IO foundations only; superseded as latest baseline by G469-G708 |
| Notification persistence / inbox | **LOCAL FOUNDATION** — Prisma `InAppNotification`, migration `20260711115000_add_in_app_notifications` (applied on staging with `1b8d00d`), service/controller/API, integration tests, frontend `NotificationPanel`; full E2E/launch proof **not** closed — see [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) |
| Live email / Resend | **STAGING PROVIDER ACCEPTANCE PROVEN** — one owner-controlled adapter-only send on staging `a8a74e6` (`AI_DELIVERY_APPROVED`); EmailLog SENT + provider message id; **not** inbox/webhook delivery; `EMAIL_LIVE_SEND_AUTHORIZED=false` / `sendingEnabled=false` restored |
| Dependency audit (2026-07-13 re-verify) | **Vite high RESOLVED** — `GHSA-fx2h-pf6j-xcff` / Vite `6.4.3` (remediation `95af080`); re-check at `622b1ed`: `npm ls` single copy, `npm audit` high=0 vite-related=0; moderate uuid/googleapis (4) remain **not** claimed closed |
| Trusted `actualCostUsd` ingestion | **DEFERRED** — G80 policy + G389-G408 design helpers; ingestion not wired |
| G134-G137 AI budget reporting contract | **Implemented locally (contract + unit proof)** — additive reporting/reconciliation contract separates AI budget from Finance Lite, reports monthly cap/live rows/estimated-vs-actual/provider/model, and keeps invoice reconciliation `not_integrated`; no real invoice or Finance Lite mutation |
| G76c review | **KEEP** — PowerShell review-only; no code changes |
| G76d closeout | **Docs only** — wiring + limitations recorded; production remains frozen |
| G75c verifier fix | **TEMP only** — verifier/tooling fix (`node --import tsx` + cross-client live evidence scan); repo source unchanged; no new live call |
| G75d closeout | **Docs only** — local proof + limitation recorded; production remains frozen |
| G55 pre-live | **Local PASS** — docs + disabled-safe orchestration foundation; no live providers/deploy |
| G56 pre-live | **Local PASS** — expanded pre-live groundwork; admin orchestrator UI; orchestrator smoke; no live providers/deploy |
| G57–G68 pre-live | **On main** (`64bfd06`) — persistent ledger, dry-run adapter, operator visibility, go/no-go docs; **local live AI + COMPLETED ledger row proven (G77b)**; staging/production live proofs **BLOCKED** |
| G70 closeout | **Docs only** — post-G69 STATUS/deferred/live-proof checklist; no live execution |
| G71b live proof retry | **Procedural STOP** — one safe live OpenRouter call captured; baseline smoke failed because API was already on `openrouter` live; see [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.13 |
| G71c closeout | **Docs only** — partial live proof recorded; local gateway restored; production remains frozen |
| G71e / G71e-retry | **Formal clean local live proof COMPLETE** — Phase 1 baseline PASS; Phase 2 live PASS (`90941e76-260d-4f99-b299-3a5c6b7a8d65`); restore PASS; model `anthropic/claude-haiku-4.5` |
| G71f closeout | **Docs only** — formal clean proof recorded; production remains frozen |
| Staging | **Proven** — controlled staging deploy of `1b8d00d` completed; post-deploy smoke PASS; migrations `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` applied; prior G46d/G47 PASS on `5e1ea5a` is historical context only |
| Production deploy | **Frozen/deferred** — no deploy until G49 dry-run + G50 explicit approval |
| G49 public probes (§6.2) | **PASS** — 2026-07-09; formal gate closure pending owner sentence |
| G50 production deploy | **Not executed** — frozen/deferred |
| Puriva Launch | **Blocked** — live proof gates and product workflow gates required; G89-G707 add local foundations and docs only; no live provider/storage/email/Google/WordPress/image proof, staging/prod proof, or production deploy is claimed |
| Roadmap tracks | Production Safety · Live Integration Proof · Client Operating Pack/Productization |
| Docker non-root runtime | **STAGING NON-ROOT PROVEN** — exact commit `80569c68f94481b33dd0a3c2a5a3ec17b41e31cd`; local candidate image `Config.User=node`; local runtime UID/GID `1000/1000`; staging runtime UID/GID `1000/1000`; no permission or restart regressions; production non-root proof remains unproven and requires separate owner-approved production deploy/proof |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md) · [`G53_PRODUCTION_SAFETY_PLAN.md`](./runbooks/G53_PRODUCTION_SAFETY_PLAN.md) · [`deferred-scope-register.md`](./operator/deferred-scope-register.md) · §2.14 below.

## Production PostgreSQL/API credential rotation Phase A closeout (2026-07-11)

**Result:** `PRODUCTION PHASE A RECOVERED AFTER FAILURE`.

Production PostgreSQL role password and `DATABASE_URL` were rotated, the production env was reconstructed, and the production API was recreated using a temporary API-only compose file. Production and staging health returned to HTTP 200. No tracked source files were modified; no commit or push was performed.

| Item | State |
|------|--------|
| Classification | **PRODUCTION PHASE A RECOVERED AFTER FAILURE** |
| Local repo | `C:\dcaosv1`, `main` @ `c8c711a`, `main` equals `origin/main`, tracked tree clean |
| VPS | `DCA01`, SSH user `deploy` |
| Production local health (`127.0.0.1:4010/api/v1/health`) | **HTTP 200**, database ready |
| Production public health (`https://system.digitalcubeagency.net/api/v1/health`) | **HTTP 200**, database ready |
| Staging local health (`127.0.0.1:4011/api/v1/health`) | **HTTP 200**, database ready |
| Staging public health (`https://staging.digitalcubeagency.net/api/v1/health`) | **HTTP 200**, database ready |
| `dcaosv1-postgres` | Unchanged — `StartedAt` 2026-06-14T10:52:09Z, Restarts=0 |
| `dca-caddy` | Unchanged — `StartedAt` 2026-07-09T00:59:48Z, Restarts=0 |
| `dcaosv1-staging-api` | Unchanged — `StartedAt` 2026-07-11T10:01:34Z, Restarts=0 |
| `dcaosv1-staging-postgres` | Unchanged — `StartedAt` 2026-07-04T00:38:06Z, Restarts=0 |
| New authoritative production files | `/opt/dca/apps/dcaosv1/app/.env` (deploy:deploy, mode 600); `/opt/dca/apps/dcaosv1/app/docker-compose.production-api-only.yml` (deploy:deploy, mode 600) |
| Backups created | Production pg_dump (validated with container `pg_restore --list`); frontend dist backup; env candidate backup |
| Source code / schema / migration change | **None** |
| Commit / push / deploy | **None** |
| Production general deploy approval | **Not granted** — production remains frozen for unrelated deployment |

**Incident status:** The exposed PostgreSQL credential was remediated. Cloudflare Turnstile and R2 credentials remain exposed/unrotated. The owner explicitly deferred their rotation. This is recorded as **OPEN DEFERRED SECURITY WORK** in [`deferred-scope-register.md`](./operator/deferred-scope-register.md); the incident is **not** claimed as fully closed.

**Future gates:**
- **Phase B — Turnstile cutover:** requires new owner-supplied Cloudflare Turnstile secret.
- **Phase C — R2 cutover:** requires new owner-supplied Cloudflare R2 access key pair.
- **Phase D — old external credential revocation:** requires literal token `APPROVE_EXTERNAL_CREDENTIAL_REVOCATION`.

**Execution issue / prevention rule:** The first Phase A attempt failed because `psql` is not installed on the VPS host; `pg_restore --list` must also run inside the PostgreSQL container. Future production runners must use container-native PostgreSQL tools and must not treat normal Docker stderr output as a fatal error.

## Staging deploy `a8a74e6` closeout (2026-07-12)

**Result:** PASS — controlled staging deployment of commit `a8a74e6` completed; health PASS; required staging smokes PASS; no migration performed; production untouched.

| Item | State |
|------|--------|
| Deployed commit | `a8a74e60e05a6e9d21691bfc83bb0123899ba6f6` (`a8a74e6`) |
| Prior staging artifact | `1b8d00d` (retained as rollback target) |
| Local validation before deploy | `validate` PASS; API unit 806 PASS; web unit 288 PASS; integration 56 PASS; `smoke:browser` + `smoke:local` PASS |
| Local mega smoke note | `smoke:staging-readiness:local` hung/skipped — does not invalidate staging PASS |
| Staging artifact path | `/opt/dca/staging-artifacts/a8a74e6` |
| Tar SHA256 | `a23ab3c9c75be6e0d5f921e034df95f2090b96f0652791b8d9ead13f90322662` |
| Schema / migration delta `1b8d00d..a8a74e6` | **none** |
| `prisma migrate deploy` | **not performed** — read-only status: Database schema is up to date (47 migrations) |
| Staging compose API context | `/opt/dca/staging-artifacts/a8a74e6` |
| Staging API image | `staging-dcaosv1-staging-api:a8a74e6` (`sha256:2c80bd51ef7aac7a232ffab5ef1a5ebe2d6dd0d0fa67530a32886649324a308a`) |
| Retained rollback API image | `staging-dcaosv1-staging-api:1b8d00d` |
| Staging API container | `1c768ba94d0e…`; StartedAt `2026-07-12T04:31:06Z`; `127.0.0.1:4011->4000` |
| Web index hash (active) | `9cc804892b186c3e426c866afe0bdb7be78590643a07d3531d310e20e0b74083` |
| Web backup | `/opt/dca/apps/dcaosv1/staging/web/backups/dist-before-a8a74e6-20260712-042923` |
| DB container | `c70f523d…` StartedAt `2026-07-04T00:38:06Z` **unchanged** |
| Health | loopback/public API 200; root 200; asset 200; DB ready |
| Required smokes | `smoke:mvp:staging` PASS; `smoke:staging-security-baseline` 32/32 PASS |
| Caddy | Not restarted or changed |
| Production | **Not modified** — FROZEN; prod API `65b4b9d4…` StartedAt `2026-07-11T10:51:44Z` unchanged |
| Live integrations | Email = **STAGING PROVIDER ACCEPTANCE PROVEN**; AI-A = **CONFIG SHAPE PROVEN**; AI-B AI Delivery OpenRouter = **STAGING LIVE PROVEN**; R2 private-object IO = **STAGING LIVE PROVEN** on `4cd6d58`; OpenAI Images one-image = **STAGING LIVE PROVEN** on `c07df10`; WordPress dedicated one-draft = **STAGING LIVE PROVEN** on `bd649d5`; GA-GSC / MI remain open |
| AI Policy / provider routing | **Docs alignment COMPLETE (2026-07-12)** — [`AI_POLICY_PROVIDER_ROUTING.md`](./architecture/AI_POLICY_PROVIDER_ROUTING.md); OpenRouter = preferred text broker/adapter; direct OpenAI image adapter under same AI Policy; **not** universal routing implemented; BFL successful generation **not** claimed |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/STAGING_DEPLOY_A8A74E6_RESULT_20260712-043322.txt` |
| Next sequence | WordPress one-draft COMPLETE → GA/GSC → MI |

**Production safety:** This staging PASS does **not** authorize production deploy, Caddy changes, DB restore, or further live integration proofs without separate owner gates.

## AI-A Orchestrator staging preflight closeout (2026-07-12)

**Result:** KEEP — Orchestrator Lite **CONFIG SHAPE PROVEN** (not `STAGING LIVE PROVEN`; plan→execute not claimed).

| Item | State |
|------|--------|
| Staging artifact | `a8a74e6` |
| Marker | `DCA-WS7-AI-A-20260712-064227` |
| Entry point | Admin-only `GET /ai-orchestrator-lite/registry`, `POST …/material-routing-preview`, `POST …/workflow-dry-run` |
| Unauth denial | 401 on all three routes |
| Registry | Puriva cap `$100`; `orchestratorLiveSafe=true`; no live providers enabled |
| Routing matrix | research_pack, article_draft→content_draft, report_narrative→workflow_summary, compliance allowLive=false, image_generation blocked, unknown blocked |
| Guards | Model override reject/handle; medical material blocked; saas handled; budget estimates only |
| Workflow dry-run | `executionDeferred=true`; `liveProviderCalled=false`; no provider request id |
| Ledger | PREVIEW/BLOCKED rows only for marker; `liveProviderCalled=false`; `actualCostUsd=null` |
| Live calls / cost | `0` / `$0.00` |
| Unit tests | 81/81 PASS (orchestrator/routing/material/budget/kill-switch/truth/adapter) |
| Health / smokes | PASS; `smoke:mvp:staging` PASS; `smoke:staging-security-baseline` 32/32 PASS |
| DB / Caddy / production | Unchanged |
| Email sendingEnabled | false |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/AI_A_ORCHESTRATOR_PREFLIGHT_20260712-064227.txt` |
| Next gate | AI-B AI Delivery live E2E with one bounded OpenRouter execution (COMPLETE 2026-07-12) |

## AI-B AI Delivery staging live E2E closeout (2026-07-12)

**Result:** KEEP — AI Delivery / OpenRouter path **STAGING LIVE PROVEN** (not production live; not Orchestrator plan→execute; not all AI workflows).

| Item | State |
|------|--------|
| Staging artifact | `a8a74e6` |
| Marker | `DCA-AI-B-20260712T071332Z-5vytpl` |
| Entry point | Admin `POST /api/v1/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId/execute` (summary task) |
| Internal path | AI Delivery workflow → `AI_GATEWAY_V1` → `openrouter-text.service` |
| Project / workflow | `e5da94a9-57fd-4409-9703-035ccd7a78ef` / `a09cc309-9482-4a79-ad69-f2df8211ef6a` |
| Workflow status | `REVIEW` |
| Gateway / live | `gateway=openrouter`; `liveProviderCalled=true` |
| Model | `anthropic/claude-haiku-4.5` |
| Live provider calls | Exactly **1** (no retry; no second call) |
| Deterministic fallback | Not used |
| Ledger | COMPLETED row `a37577de-d55a-4166-8966-bf19eb1829c5`; `provider=openrouter`; `taskType=report_narrative`; `stepReference=ai-delivery-execute:summary`; `estimatedCostUsd=0.15`; `actualCostUsd=null` |
| Cost truth | Route / ledger estimate ceiling `$0.15`; trusted provider invoice actual not ingested; bound below `$1.00` |
| Client / publication | No `ClientUserAccess`; deliverables `0`; no publication |
| Final AI routing | Restored `AI_TEXT_GATEWAY=local`; `openRouterLiveExecutionEnabled=false`; staging key retained |
| Email | `EMAIL_LIVE_SEND_AUTHORIZED=false`; `sendingEnabled=false` |
| Health / smoke | Health PASS; post-restore `smoke-openrouter-guarded-local` 12/12 PASS (local) |
| DB / Caddy / production | Unchanged (staging API recreated only for env load/restore) |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/AI_B_AI_DELIVERY_LIVE_PROOF_20260712-071332.txt` |
| Next gate | R2 private storage live create/read/delete proof (COMPLETE 2026-07-12) |

## R2 staging live private-storage proof closeout (2026-07-12)

**Result:** KEEP — R2 / private storage **STAGING LIVE PROVEN** for one isolated staging object (not production; not image storage; not client deliverable storage; not public delivery).

| Item | State |
|------|--------|
| Staging artifact / compose context | `4cd6d58` (`/opt/dca/staging-artifacts/4cd6d58`) |
| Bucket | `dcastaging` (staging-only; Cloudflare R2) |
| Marker | `DCA-R2-20260712T081648Z-cc7ee7` |
| Path | `uploadR2Object` → `headR2Object` → signed GET → `deleteR2Object` → `headR2Object` absence |
| Object key | `tenants/dca-r2-proof/years/2026/projects/dca-r2-20260712t081648z-cc7ee7/months/07/documents/…pdf` |
| Create / delete attempts | Exactly **1** / **1** |
| Payload | `application/pdf`; 107 bytes; sha256 `39b787ccfa252b3ac067ec3fb6533d5be01ee31a619ebc033216c4a18b7f52a7` |
| Integrity | Byte-for-byte + SHA-256 match on signed read |
| Public URL | `null` (signed URL expiry 120s; full URL not logged) |
| Client boundary | `storageKey` omitted; download URL null until explicit signed issuance |
| Absence | HEAD `not_found` after delete; residual re-check still absent |
| DB / Caddy / production | Unchanged / FROZEN |
| Email / OpenRouter | Disabled / local no-live |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/R2_STAGING_LIVE_PROOF_20260712-081648.txt` |
| Next gate | Image provider / live generation proof (COMPLETE 2026-07-12 — OpenAI one-image) |

## OpenAI Images staging one-image live proof closeout (2026-07-12)

**Result:** KEEP — OpenAI Images staging one-image AI Policy path **STAGING LIVE PROVEN** (one bounded neutral image only; not three-image sets; not regeneration; not client/WordPress/publication; not production).

| Item | State |
|------|--------|
| Staging artifact / compose context | `c07df10` (`/opt/dca/staging-artifacts/c07df10`) |
| Marker | `DCA-IMG-OPENAI-20260712T102457Z-a08x91rb` |
| Path | AI Policy → `image_single` → `ImageProviderAdapter` → `OpenAIImageAdapter` → OpenAI Images API |
| Provider / broker / model | `openai` / `direct` / `gpt-image-1` |
| Quality / size / n | `low` / `1024x1024` / `1` |
| Submit / output / retry / fallback | Exactly **1** / **1** / **0** / **false** |
| BFL requests | **0** (adapter retained but inactive) |
| Output | `image/png`; 1213472 bytes; 1024×1024; sha256 `5892cadcf699d1607e77ae72084780ca8d7f519968715ecdbe630e4c4c0da82f` |
| Ledger | COMPLETED `e46ae5cd-a980-4a8f-a957-5e1f3a2e37b4`; `liveProviderCalled=true`; estimatedCostUsd `0.10`; `actualCostUsd=null` (not fabricated) |
| R2 | Not applicable for this provider proof (`r2Called=false`; no object created) |
| Final live state | `IMAGE_GENERATION_ENABLED=false`; `IMAGE_GENERATION_LIVE_CALLS_ALLOWED=false`; key remains installed |
| OpenRouter text / email | `AI_TEXT_GATEWAY=local`; email live send remains disabled |
| DB / Caddy / production | DB+Caddy IDs unchanged; production FROZEN |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/OPENAI_IMAGE_STAGING_ONE_IMAGE_PROOF_20260712-102457.json` |
| Next gate | GA/GSC live proof (WordPress dedicated staging one-draft COMPLETE) |

## WordPress staging one-draft live proof closeout (2026-07-12)

**Result:** KEEP — WordPress dedicated staging one-draft path **STAGING LIVE PROVEN** (bounded one-draft create-and-trash only; not general publication; not image attach; not production).

| Item | State |
|------|--------|
| Staging artifact | `bd649d5` (`/opt/dca/staging-artifacts/bd649d5`) |
| Marker | `DCA-WP-DRAFT-20260712T130503Z-8ecfacb2` |
| Idempotency key | `wp-draft-proof:DCA-WP-DRAFT-20260712T130503Z-8ecfacb2` |
| Target | `publicationTargetId=05ef12aa-662a-4bf7-b1c5-c17d295e5e0b`; `clientId=7d70768d-13c8-447b-967d-4ef2e494a53d` |
| Site host | `purivastaging.digitalcubeagency.net` |
| Auth identifier | WordPress user e-mail stored in `PublicationTarget.wordpressUsername` (length 17; value not recorded in docs) |
| Application Password | Encrypted; decryptReady; length 29 (value not recorded) |
| Path | staging proof harness → Prisma attempt store → `createWordPressDraft` → one REST create → exact-ID trash |
| Adapter result | `wordpress_draft_created`; WordPress status=`draft`; post ID=`6` |
| Counts | create=1; cleanup=1; retry=0; fallback=false; media=0; `liveProviderCalled=true` |
| Prisma attempt | COMPLETED then **TRASHED** (`88fa15c6-bf16-413a-a232-b6d02dc62515`) |
| Historical AMBIGUOUS | Three prior 401 attempts retained unchanged (markers `…432278b0`, `…ef73ba7e`, `…02ab52be`) |
| Final flags | `WORDPRESS_DRAFT_LIVE_ENABLED=false`; `WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED=false` |
| Generic publish | Remains `WORDPRESS_LIVE_HTTP_FROZEN=true` |
| Image / email / OpenRouter live | false / false / not exercised |
| DB / Caddy / production | DB+Caddy IDs unchanged; production FROZEN |
| Not claimed | General publication; image attachment; product publish path; production WordPress |
| Next gate | GA/GSC live proof |

**Prior local adapter result (retained):** dedicated live-draft adapter **LOCAL IMPLEMENTED / FAKE-TRANSPORT PROVEN** on the same baseline (`createWordPressDraft` / exact-ID trash; dual `WORDPRESS_DRAFT_LIVE_*` flags; fake smoke PASS).

## AI Delivery bounded content-to-draft local closeout (2026-07-12)

**Result:** KEEP — AI Delivery content-to-draft bounded workflow **LOCAL IMPLEMENTED / FAKE-PROVIDER PROVEN**.

| Item | State |
|------|-------|
| Path | approved content draft → one fake OpenAI image → one deterministic private fake storage object → `AiDeliveryArticleImage.PREVIEW_READY` → durable `WAITING_FOR_IMAGE_APPROVAL` → existing image approval status → one fake WordPress draft → one fake owner/admin email → `COMPLETED` |
| Durable contract | Additive `AiDeliveryBoundedWorkflowRun` ledger, unique tenant+draft+workflow key, guarded stage claims, stable stage keys, explicit ambiguous states |
| Prisma durability proof | PASS — full repository migration chain applied to an isolated ephemeral loopback PostgreSQL database; real Prisma store proved restart/reload, linked image/WordPress/EmailLog rows, concurrent claims, duplicate blocking, ambiguity blocking, and tenant/client isolation; database dropped after proof |
| Local proof | `npm.cmd run test:ai-delivery-bounded-prisma:local`; `npm.cmd run smoke:ai-delivery-bounded-content-draft:local` |
| Counts | image=1; private upload=1; WordPress create=1; email=1; retry=0; fallback=false; media=0 |
| Safety | Tenant/client/project/content/image/target guards; owner/admin recipient derived from workflow initiator; generic WordPress publish remains frozen |
| Not claimed | Connected workflow staging proof; real image/R2/WordPress/email calls; WordPress media attachment; three-image sets; regeneration; client approval/email; production |
| Migration | Additive migration applied only to the isolated ephemeral local test database; not applied to staging or production |
| Gate 6 | Owner-controlled staging migration/deploy/live-call proof remains separately gated |

## AI Delivery bounded execution bridge local closeout (2026-07-13)

**Result:** KEEP — AI Delivery content-to-draft execution bridge **LOCAL IMPLEMENTED / FAKE-PROVIDER AND REAL-PRISMA PROVEN**.

| Item | State |
|------|-------|
| Surface | Staging-only operator CLI; separate prepare/start/inspect/continue/cleanup commands; no public HTTP route |
| Provider construction | Existing OpenAI one-image policy, exact-key private R2 upload/delete, draft-only WordPress adapter/exact-post trash, provider-only owner email delivery plus durable EmailLog persistence |
| Guards | Explicit staging marker; non-production runtime; staging database allowlist; exact tenant/client/project/draft/target/user IDs; all image/WordPress/email live flags; exact staging WordPress hostname; generic publish freeze |
| Manual boundary | Start stops at `WAITING_FOR_IMAGE_APPROVAL`; CLI contains no approval mutation; continuation requires existing image status `APPROVED` |
| Proof data | Deterministic correlation labels; IDs-only JSON manifest; exact isolated project/draft creation; shared tenant/client/user/publication target preserved |
| Cleanup | Manifest-driven exact WordPress post trash, exact R2 key delete, exact proof-row deletion, and zero-residual verification; broad or malformed manifests refused |
| Local proof | Isolated ephemeral loopback PostgreSQL; fake OpenAI/R2/WordPress/email; full CLI sequence including duplicate calls and cleanup |
| Not claimed | Staging bridge deployment; connected staging execution; real provider calls; production readiness |
| Staging baseline | Artifact `8a506c5` and additive migration are already deployed/applied; bridge commit remains local/PR-only until a separate owner deployment gate |

## AI Delivery bounded staging live proof + product approval gap (2026-07-13)

**Result:** KEEP — connected staging live proof **COMPLETE / PASS**; product API storageKey-only approve previously **NOT_PROVEN**, now **CLOSED locally** (staging re-proof after deploy).

| Item | State |
|------|--------|
| Bounded staging live proof | **COMPLETE / PASS** — prepare → Stage A (1× OpenAI `gpt-image-1` + 1× private R2) → owner approval of exact image ID → Stage B (1× WP draft + 1× email) → idempotency → exact cleanup |
| Proof correlation | `c0cc2bd5-f6ff-4151-bccc-97b1b3222198` |
| Workflow run / article image | `7648ac50-…` / `10422e0c-…` |
| Proof-only recipient override | Commit `25f846e` — CLI/env override of Stage B `ownerRecipient.email` only; normal app email resolution unchanged |
| Owner approval of exact image ID | **PROVEN** (owner chat) |
| Product API `/approve` during that live proof | **NOT_PROVEN** — Stage A had `storageKey` only; URL-only preview gate blocked product approve; Stage B used a status-only DB update (not product-API proof) |
| Product gap fix (this closeout) | `hasArticleImagePreviewReference` accepts private `storageKey` (aligned with final-ready); admin UI enables Approve when `hasDocument`; R2 stays private; signed URLs remain ephemeral via existing download/download-reference |
| Local regression | Unit + web tests for Stage A shape; optional integration when `AUTH_SEED_TEST_PASSWORD` set |
| Narrow staging product-approve proof | **PROVEN** on staging `57f1881` — correlation `approve-gap-a637cdad-…`; product `POST …/approve` → `APPROVED`; URLs remained null; no direct DB status update; OpenAI/WP/email = 0; exact R2+DB cleanup residual 0 |
| Staging deploy | Artifact `/opt/dca/staging-artifacts/57f1881`; API recreated; DB/PG identity unchanged; migration SKIP; live flags false; production unchanged |
| Production | **Frozen** — unchanged |
| Deferred non-blocking | GA4/GSC credentials; in-system notification E2E; production release — email remains priority notification path |

## Staging email one-send proof closeout (2026-07-12)

**Result:** KEEP — **STAGING PROVIDER ACCEPTANCE PROVEN** (not inbox/webhook `STAGING LIVE PROVEN`).

| Item | State |
|------|--------|
| Staging artifact | `a8a74e6` |
| Provider | Resend |
| Sender domain | `notifications.digitalcubeagency.net` (`notifications@notifications.digitalcubeagency.net`) |
| Selected event/template | Adapter-only `AI_DELIVERY_APPROVED` via `sendEmailNotification` |
| Marker | `DCA-EMAIL-STAGING-PROOF-20260712-062159` |
| Message count | Exactly one `SENT` EmailLog in proof window |
| EmailLog id | `59b511db-646f-4dcb-8c2e-7eb5845bec15` |
| Provider message id | Present (SHA256 prefix hash only in evidence) |
| Recipient | Owner-controlled test inbox only (redacted in docs) |
| In-app | NOT PART OF THIS ADAPTER-ONLY PROOF |
| Client email | None |
| Live auth after proof | `EMAIL_LIVE_SEND_AUTHORIZED=false`; `sendingEnabled=false` |
| Health / smokes | Health PASS; `smoke:mvp:staging` PASS; `smoke:staging-security-baseline` 32/32 PASS |
| DB / Caddy / production | Unchanged |
| VPS evidence | `/opt/dca/apps/dcaosv1/staging/backups/EMAIL_STAGING_PROOF_20260712-062159.txt` |
| Next gate | AI-A Orchestrator staging preflight with no live provider call (COMPLETE 2026-07-12) |

## Staging deploy `1b8d00d` closeout (2026-07-11)

**Result:** PASS — controlled staging deployment of commit `1b8d00d` completed; post-deploy smoke PASS; production untouched. **Superseded as current staging runtime by `a8a74e6` (2026-07-12); retained as rollback target.**

| Item | State |
|------|--------|
| Deployed commit | `1b8d00d` |
| Local validation before deploy | `npm.cmd run validate` PASS |
| Staging artifact path | `/opt/dca/staging-artifacts/1b8d00d` |
| Staging DB backup | `/opt/dca/apps/dcaosv1/staging/backups/staging-db-before-1b8d00d-20260711-200155.dump` |
| Applied migrations | `20260709120000_add_ai_budget_ledger`, `20260711115000_add_in_app_notifications` |
| Staging compose API context | `/opt/dca/staging-artifacts/1b8d00d` |
| Staging API container | `dcaosv1-staging-api` recreated successfully; `127.0.0.1:4011->4000` |
| Public frontend | HTTP 200 |
| Public API health | PASS |
| Loopback API health (`127.0.0.1:4011`) | PASS |
| PostgreSQL container | `dcaosv1-staging-postgres` healthy and accepting connections |
| Web dist | Deployed successfully |
| Caddy | Not restarted or changed |
| Production | **Not modified** — production remains frozen |
| Production health during deploy | HTTP 200 |
| Post-deploy smoke | PASS |
| Source code / schema / migration change in repo | **None** — migrations were already in repo; only applied to staging DB |
| Commit / push / deploy in this docs task | **None** |

**Production safety:** Production `system.digitalcubeagency.net` was not modified. The production PostgreSQL/API credential rotation Phase A result (`PRODUCTION PHASE A RECOVERED AFTER FAILURE`) and the unresolved Turnstile/R2 deferred security work remain recorded in [`deferred-scope-register.md`](./operator/deferred-scope-register.md) and are **not** closed by this staging deploy.

## WORKSTREAM 1 — Points 1–4 closeout (2026-07-12)

**Result:** Workstream 1 Points 1–4 COMPLETE at `main` @ `250e958`. Staging artifact `1b8d00d` remains known-good PASS. Production remains FROZEN. No commit/push/deploy authorized by this status update alone.

| Item | State |
|------|--------|
| Repo baseline | `main` @ `250e95828db7a8313e38401add6e4efc61d2160d` |
| Staging baseline | `1b8d00d` PASS (unchanged) |
| Schema delta `1b8d00d..250e958` | **none** |
| Point 1 — Vite | **COMPLETE** — Vite `6.4.3`; high finding closed; validate PASS; commit `95af080` |
| Point 2 — Canonical component system | **COMPLETE** — public `apps/web/src/components/ui`; private `apps/web/src/design-system` |
| Wave 0 — import guard | **COMPLETE** — commit `250e958`; historical freeze 108; **current baseline 0** after Modal Wave; new = 0 |
| Point 3 — Rollback plan | **COMPLETE** — verdict `ROLLBACK READY WITH CONDITIONS`; rehearsal **not executed** (separately gated); no SHA-tagged retained staging API image yet |
| Point 4 — Orchestrator proof decision | **COMPLETE** — `HYBRID — PREFLIGHT + EMBEDDED LIVE PROOF`; Orchestrator remains `LOCAL FOUNDATION`; not `STAGING LIVE PROVEN` until plan→execute is wired |
| Canonical component doc | [`CANONICAL_COMPONENT_SYSTEM.md`](./project-control/CANONICAL_COMPONENT_SYSTEM.md) |
| Wave 1 — first consolidation slice | **COMPLETE** — ui barrel exports Tabs/compound Table/ActivityItem; unused root state shims deleted |
| Modal Wave | **COMPLETE** — canonical `components/ui/Modal`; 23/23 page consumers migrated; legacy root Modal deleted; import-guard baseline 0; impl `a447b9e`; docs-closeout `67d9aa4`; staging web-only artifact `a447b9e` + Modal browser proof PASS |
| Modal staging Caddy | **SHARED_PROXY_RESTART (historical)** — Modal web-only deploy remounted staging static bind; production app/API/DB unchanged. Prefer future **in-place sync** into `/opt/dca/apps/dcaosv1/staging/web/dist` (preserve mount inode; no Caddy recreate). |
| Remaining UI migration | **PARTIAL** — Card adapter DEFERRED; DS Modal `aria-describedby` DEFERRED (requires DS edit); WP-over-Deliverables Escape stack mitigated by suspending Deliverables `isOpen` while confirm open; state primitives + typography floors advanced in RC convergence |
| Next local Workstreams | **2–5** before staging Workstream 6 |
| Production | FROZEN |
| Canonical doc | [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) |

## Client Operating Pack DB binding closeout (2026-07-13)

**Result:** PASS — explicit `Client.operatingPackKey` binding + fail-closed resolver. Pack content remains code-defined in `@dca-os-v1/shared`. No silent Puriva default for unbound clients. Production migration/deploy remain owner-gated.

| Item | State |
|------|--------|
| Schema | `Client.operatingPackKey String?` + index `(tenantId, operatingPackKey)` |
| Migration | `20260713120000_add_client_operating_pack_key` (additive; no global default; no broad backfill) |
| Canonical binding key | `PURIVA_OPERATING_PACK_V1` → registry packKey `puriva` |
| Resolver | `apps/api/src/core/client-operating-pack.resolver.ts` — `resolverSource=database_binding` |
| Null/unbound | Explicit `PACK_BINDING_MISSING`; no Puriva rules/cap |
| Unknown key | Fail-closed `PACK_KEY_UNKNOWN` / HTTP 400 on write |
| Admin UI | Clients list + create/edit select (registry only; no free-text) |
| Client portal | Pack key/config **not** exposed |
| Local validation | unit + web/api check + `validate` PASS; monthly rehearsal 29/29 |
| Staging | Controlled migrate + API/web deploy **COMPLETE** on `57f9c52`; artifact `/opt/dca/staging-artifacts/57f9c52`; migration applied; binding smoke 11/11; durable Puriva client `3afb9e45-…` bound to `PURIVA_OPERATING_PACK_V1` |
| Production | **FROZEN** — separate migrate/deploy approval |

## Puriva staging redeploy + composition closeout (2026-07-13)

**Result:** PASS — controlled staging redeploy of `632d9a9` (Puriva Operating Pack runtime) + staging composition proven. Migration SKIP. Shared Caddy **not** restarted. Production app/API/DB/web unchanged. Live provider flags remain false. Full Puriva Launch READY is **not** claimed. **Superseded for client DB binding by the closeout above.**

| Item | State |
|------|--------|
| Target / ending staging runtime | `632d9a9b675f1b702aad61907d47dd453d544368` (`632d9a9`) |
| Prior staging runtime | `9921bb3` (retained rollback artifact) |
| Artifact | `/opt/dca/staging-artifacts/632d9a9` |
| Tar SHA256 | `4AA689F26A045740152427C23BC30A76A12682DA5A5C8B1683958FA490284C3D` |
| Migration | **SKIP** (no prisma delta `9921bb3..632d9a9`) |
| Staging API | Recreated — id `ca684230…` StartedAt `2026-07-13T04:08:51Z` |
| Staging DB | Unchanged — id `c70f523d…` StartedAt `2026-07-04T00:38:06Z` |
| Web deploy | In-place sync into `/opt/dca/apps/dcaosv1/staging/web/dist`; assets `index-DY5z8SCD.js` / `index-i_JTDDN4.css` |
| Shared proxy | `SHARED_PROXY_ACTION=none` — Caddy id/StartedAt unchanged (`fe598a24…` / `2026-07-13T02:26:36Z`) |
| Production API/DB | Unchanged (`65b4b9d4…` / `db95bada…`) |
| Live flags | `AI_TEXT_GATEWAY` present (masked); image/WP draft/email live / publish flags absent or false |
| Pack runtime | **PASS** — `getClientOperatingPackConfig("puriva")` in staging API image; `$100` cap; EN primary; staging WP host; review/fallback profiles |
| Client DB binding | **NOT_PROVEN** — convention/shared constants (no product DB pack-binding claim) |
| Compliance staging | **PASS** — runtime assessor blocks/flags guarantee/cure/fake doctor/patient/before-after/BPOM/superiority/authority; allows cautious educational |
| AI budget staging | **PASS** — `PURIVA_AI_MONTHLY_CAP_USD=100` in staging runtime |
| Admin / client roles | **PASS** — composition smoke product APIs |
| Cross-tenant staging | **PASS** — real foreign client/project/report/deliverable; Puriva↔foreign 403/404 fail-closed |
| Monthly report staging | **PASS** — fixture/non-live metrics only; `MONTHLY_REPORT_LIVE_GA_GSC=DEFERRED` |
| Client portal browser | **PASS** — `smoke-puriva-staging-browser.mjs` 29/29; desktop+mobile; expected client 403s on admin routes |
| Composition smoke | `smoke-puriva-staging-composition.mjs` **49/49**; correlation `puriva-staging-composition-5cc345e5-…` |
| Browser correlation | `puriva-staging-browser-3b2a26e5-…` |
| Cleanup | Exact-ID archive of projects/deliverables/reports; retained archived client rows as evidence (no broad delete) |
| Local validation | `npm.cmd run validate` PASS; focused Puriva unit PASS; `smoke:mvp:staging` PASS |
| Go-live readiness | `READY_WITH_PRODUCTION_AND_GOOGLE_GATES` (production deploy + live GA4/GSC remain owner gates) |
| Evidence | `/opt/dca/apps/dcaosv1/staging/backups/STAGING_PURIVA_DEPLOY_632d9a9_20260713-040821.txt` |

**Truth labels (post-proof):** `PURIVA_CONFIGURATION_STAGING_RUNTIME=PASS`; `CROSS_TENANT_ISOLATION_STAGING=PASS`; `CLIENT_PORTAL_STAGING_BROWSER_PROOF=PASS`; `MONTHLY_REPORT_STAGING_COMPOSITION=PASS`.

## Docker non-root staging proof closeout (2026-07-13)

**Result:** PASS — `DOCKER NON-ROOT STAGING PASS`. The application image now uses the existing `node` user, local image/runtime proof passed, controlled staging deployment of the exact authorized commit passed, and no permission or restart regression was observed. Production was not redeployed.

| Item | State |
|------|--------|
| Authorized commit | `80569c68f94481b33dd0a3c2a5a3ec17b41e31cd` |
| GitHub CI | `success` |
| Local candidate image `Config.User` | `node` |
| Local runtime UID/GID | `1000/1000` |
| Local API health | HTTP 200 |
| Local database status | ready |
| Local Prisma import | PASS |
| Local permission errors | none |
| Staging deployment | Exact authorized commit deployed; staging API container recreated only |
| Staging API container | `d64094293ccd7d66c82003d219bce7f558acca062e757251ea7da24e5e5b3893` |
| Staging image/user | `Config.User=node`; runtime UID/GID `1000/1000`; npm/node processes UID 1000 |
| Staging restarts | `0` |
| Staging errors | no `EACCES`, `EPERM`, or `permission denied` |
| Staging PostgreSQL | healthy and unchanged |
| Staging loopback API | HTTP 200 |
| Staging public API | HTTP 200 |
| Staging web | HTTP 200 |
| Static asset | HTTP 200 |
| Staging auth smoke | PASS |
| Production | Not redeployed; production API/DB/Caddy unchanged |
| Production non-root | **Not proven** |
| Closeout classification | `DOCKER NON-ROOT STAGING PASS` |
| Required flags | `DOCKER_ROOT_FINDING_CLOSED_FOR_STAGING=yes`; `PRODUCTION_NONROOT_PROVEN=no`; `PRODUCTION_DEPLOY_AUTHORIZED=no` |

**Limitations:** This closes the Docker root finding for local and staging environments only. Production requires separate explicit owner authorization and production deploy/proof before that environment can be closed. This remaining production proof is not an active incident and does not block current owner onboarding.

## Staging RC deploy `9921bb3` closeout (2026-07-13)

**Result:** PASS — controlled staging deploy of `9921bb3` (storageKey preserve + UI state/readability convergence + docs truth). Migration SKIP. Shared Caddy **not** restarted. Production app/API/DB unchanged. **Superseded as current staging runtime by `632d9a9` Puriva redeploy above.**

| Item | State |
|------|--------|
| Deployed commit | `9921bb3877abc72f3e7a3778f005988d1d17676c` (`9921bb3`) |
| Docs closeout HEAD | `9525fc85f9fdccc226f2da1b64b336de710dcca6` (this section) |
| Artifact | `/opt/dca/staging-artifacts/9921bb3` |
| Tar SHA256 | `C8E02BA5742589AD18A48813C7914E95DEAF38D6D0F5A77F2D8FF1CD0D49E2C4` |
| Migration | **SKIP** (no prisma delta `67d9aa4..9921bb3`) |
| Staging API | Recreated — id `c1a9fc1e…` StartedAt `2026-07-13T03:07:22Z` |
| Staging DB | Unchanged — id `c70f523d…` StartedAt `2026-07-04T00:38:06Z` |
| Web deploy | In-place sync into `/opt/dca/apps/dcaosv1/staging/web/dist` (inode preserved); index sha256 `fb3e4bdd…` |
| Live assets | `index-DY5z8SCD.js` / `index-i_JTDDN4.css` |
| Shared proxy | `SHARED_PROXY_ACTION=none` — Caddy id/StartedAt unchanged |
| Production API/DB | Unchanged (`65b4b9d4…` / `db95bada…`) |
| Health | staging loopback/public API/web 200; production API/web 200 |
| Live flags | `AI_TEXT_GATEWAY=local`; image/WP draft/email live flags false |
| Smokes | `smoke:mvp:staging` PASS; Modal a11y against staging PASS 14/14 |
| Evidence | `/opt/dca/apps/dcaosv1/staging/backups/STAGING_RC_WEB_FIX_9921bb3_20260713-030802.txt` |

**Production safety:** This staging PASS does **not** authorize production deploy. GA/GSC, notification E2E, and DS Modal `aria-describedby` remain deferred.

## Puriva pre-production readiness closeout (2026-07-13)

**Result:** Local Operating Pack assembly + monthly rehearsal PASS; production dry-run SAFE probes PASS; production mutation false.

| Item | State |
|------|--------|
| Repo HEAD at start | `096c073` (= `origin/main`) |
| Staging RC runtime (at preprod closeout; later superseded by `632d9a9`) | `9921bb3` |
| Puriva Operating Pack | Assembled in `@dca-os-v1/shared` — identity, tone, languages, image dimensions, WP targets (incl. staging host), review rules, fallbacks, `$100` cap |
| Staging WP allowlist | `purivastaging.digitalcubeagency.net` (`scripts/lib/puriva-staging-operating-pack.mjs`) |
| Compliance | Expanded text guards (fake doctor, BPOM, superiority); `MANUAL_REVIEW_REQUIRED=true` |
| Budget | `PURIVA_MONTHLY_AI_CAP_USD=100`; `BUDGET_TRACKING=PROVEN`; `BUDGET_HARD_ENFORCEMENT=ESTIMATED_SPEND_ONLY` |
| Local monthly rehearsal | `node scripts/smoke-puriva-monthly-rehearsal-local.mjs` — **29/29 PASS**; correlation `puriva-rehearsal-d7806bec-…` |
| Admin / client role | Local product-API proof PASS (client approve, portal reports, foreign project 404) |
| Email / WP live / OpenAI / R2 | Prefer reuse prior staging island proofs; not re-executed in this closeout |
| Production public probes | staging+prod `/api/v1/health` HTTP 200; HSTS present |
| Production dry-run doc | [`PRODUCTION_DRY_RUN_PURIVA_PREPROD.md`](./runbooks/PRODUCTION_DRY_RUN_PURIVA_PREPROD.md) |
| Monthly ops runbook | [`PURIVA_MONTHLY_OPERATION.md`](./runbooks/PURIVA_MONTHLY_OPERATION.md) |
| GA4/GSC live | **DEFERRED** — fail-closed owner ID envs `PURIVA_GA4_PROPERTY_ID` / `PURIVA_GSC_SITE_PROPERTY` |
| In-system notification E2E | **DEFERRED** |
| Staging redeploy | **COMPLETE** on `632d9a9` — see Puriva staging redeploy + composition closeout above |
| Production | **FROZEN** — `BLOCKED_OWNER_ACTION=APPROVE_PRODUCTION_DEPLOY` |
| Go-live readiness | Advanced to `READY_WITH_PRODUCTION_AND_GOOGLE_GATES` after staging composition proof (not full Puriva Launch READY) |

## WORKSTREAM 1A — project control reconciliation (2026-07-12) — historical

**Result:** Docs-only. Authoritative project-control matrix recorded. Superseded for Points 1–4 by WORKSTREAM 1 closeout above. No app/schema/staging/production mutation in 1A itself.

| Item | State |
|------|--------|
| Repo baseline (at 1A) | `main` @ `fac108be16e779fdbff0a2867b302679c8c4da6f` |
| Staging baseline | `1b8d00d` PASS (unchanged) |
| Relation (at 1A) | `1b8d00d → fac108b` (docs-only descendant) |
| Numbering systems | BLOKI 1–13 · Fazy UI 1–13 · Workstreamy 1–9 · G-gates (separate; do not mix) |
| Capability labels | Owner-approved five-level standard in matrix |
| Notifications | Persistence/UI = LOCAL FOUNDATION; staging migration APPLIED; email = **STAGING PROVIDER ACCEPTANCE PROVEN** on `a8a74e6`; full E2E launch proof open |
| Dependency finding (at 1A) | Vite high was OPEN — later closed by Point 1 / `95af080` |
| Open decisions (at 1A) | Later closed for canonical / Orchestrator proof / rollback **plan**; rehearsal and Waves 1–5 remain open |
| Production | FROZEN |
| Canonical doc | [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) |

**Historical note:** Older G-gate rows below that still say “no notification migration/inbox” are **historical context** from the date of that gate. Current ground truth is the WORKSTREAM 1 closeout section and the authoritative matrix.

## G77b persistent COMPLETED ledger live proof closeout (2026-07-10)

| Item | State |
|------|--------|
| Gate | G77b — controlled local live proof that OpenRouter AI Delivery execute persists COMPLETED `AiBudgetLedgerEntry` |
| Preflight commit | `9ba707f` — `test: add openrouter api env preflight` |
| Operator | Piotr Pakula |
| Target | Local only — `127.0.0.1:4000` |
| No-live API env preflight | **PASS** — `smoke:openrouter-api-env-preflight:local` 18/18 |
| Phase 1 — baseline local guarded smoke | **PASS** — 12/12; `liveProviderCalled=false` |
| Phase 2 — one live OpenRouter guarded smoke | **PASS** — 12/12; exactly one live call |
| Formal live `workflowRunId` | `2244413e-d87b-45a1-8a26-6634ec8972d5` |
| Provider / model | OpenRouter — `anthropic/claude-haiku-4.5` |
| Phase 3 — restore local guarded smoke | **PASS** — 12/12 |
| Ledger verifier | **PASS** — persistent COMPLETED row found |
| Ledger row `id` | `5d8d635c-ced0-4a14-9b33-839e1fdee508` |
| Ledger `createdAt` | `2026-07-10T00:48:46.882Z` |
| Ledger `status` | `COMPLETED` |
| Ledger `stepReference` | `ai-delivery-execute:summary` |
| Ledger `provider` | `openrouter` |
| Ledger `liveProviderCalled` | `true` |
| Ledger `taskType` | `report_narrative` |
| `completedAttribution` present | `true` |
| `completed.model` / `completed.gateway` | `anthropic/claude-haiku-4.5` / `openrouter` |
| `completed.liveProviderCalled` | `true` |
| `completed.runId` | Matches `workflowRunId` |
| `estimatedCostUsd` | `0.15` (route cap for `workflow_summary`) |
| `actualCostUsd` | `null` — **expected current limitation**; does not prove provider invoice cost |
| Forbidden integrations | **None triggered** |
| Secrets | **Not exposed** |
| Staging / VPS / production / deploy | **Not touched** |
| Production readiness | **NO** — production remains frozen; staging/production live proof **not** claimed |
| What G77b proves | Local controlled live OpenRouter execute creates persistent COMPLETED ledger row with completedAttribution metadata |
| What G77b does **not** prove | Staging/production live; exact provider invoice cost via `actualCostUsd`; later G79 closes local monthly aggregation only |
| Next gate | Superseded by G78-G88 closeout sequence; post-G88 recommended next gate is **G89** owner-selected launch-blocker execution |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md) · [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.18 · [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## G78 multi-scope docs alignment (2026-07-10)

| Item | State |
|------|--------|
| Gate | G78 — post-G77b clarity, readiness labels, and future-scope consolidation (docs only) |
| Scope | AI provider/ledger follow-up runbooks; deferred-scope buckets; notifications blocker plan; integration truth matrix; monthly report / WordPress tier labels; Client Operating Pack implementation status |
| Live AI / OpenRouter | **Not executed in G78** — G77b evidence preserved |
| Production / staging / deploy | **Not touched** — production remains frozen |
| Next gates | Superseded by G79-G88: G79 implemented locally; G80 policy documented only; G81-G87 planning/prep only; G88 consolidation records Puriva Launch still blocked |

Detail: [`deferred-scope-register.md`](./operator/deferred-scope-register.md) (future scope buckets) · [`notifications-blocker-plan.md`](./operator/notifications-blocker-plan.md) · [`CLIENT_OPERATING_PACKS.md`](./architecture/CLIENT_OPERATING_PACKS.md) §14 · [`INTEGRATIONS_TRUTH_MATRIX.md`](./runbooks/INTEGRATIONS_TRUTH_MATRIX.md).

## G79-G88 multitask consolidation (2026-07-10)

> **Historical context (superseded for notifications):** G82 row below recorded the 2026-07-10 planning state (“no in-system notification model”). Current ground truth (2026-07-12): in-app notification persistence/UI = LOCAL FOUNDATION; staging migration APPLIED on `1b8d00d`; live email still not STAGING LIVE PROVEN — see WORKSTREAM 1A and [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md).

| Gate | Result | Evidence / limitation |
|------|--------|-----------------------|
| **G79 — Monthly cap aggregation for live COMPLETED rows** | **READY (local implemented)** | `sumSpentUsdForPeriod()` now includes live `COMPLETED` rows and sums `actualCostUsd ?? estimatedCostUsd`; focused unit tests 18/18 PASS on `ai-budget-ledger.service.test.ts` |
| **G80 — `actualCostUsd` policy** | **PARTIAL (policy only)** | Policy documented: `actualCostUsd` stays `null` unless trusted provider cost is exposed; trusted provider-cost ingestion remains deferred |
| **G81 — Staging live proof planning** | **PARTIAL (planning only)** | `AI_PROVIDER_LIVE_PROOF.md` has a staging plan; no staging execution or live call occurred |
| **G82 — Notifications foundation planning** | **BLOCKED (not started in-system)** *(historical as of 2026-07-10)* | No in-system notification model exists *at G82 date*; staged plan updated in `notifications-blocker-plan.md` |
| **G83 — Email notification no-send proof** | **PARTIAL (no-send planning)** | `EMAIL_NOTIFICATIONS_PROOF.md` no-send checklist updated; no live email sent |
| **G84 — Client approval notification loop event map** | **PARTIAL (event map)** | Approval event map documented; image-level approve/reject has no notification intent; monthly report `FINAL` is admin-only and not client delivery |
| **G85 — GA/GSC live metrics planning** | **BLOCKED (live data)** | `MONTHLY_REPORT_LIVE_DATA_PROOF.md` and Puriva monthly gates separate MANUAL snapshot placeholders from live GA/GSC; no OAuth/live sync exists |
| **G86 — WordPress live draft proof planning** | **PARTIAL (planning only)** | `WORDPRESS_DRAFT_PROOF.md` three-tier plan documented; live draft proof not executed; publish remains frozen |
| **G87 — Image generation provider proof planning** | **BLOCKED (provider/live proof)** | `IMAGE_GENERATION_PROOF.md` medical-aesthetic and future proof checklist updated; no provider selected or called |
| **G88 — Puriva launch readiness consolidation** | **BLOCKED (launch unchanged)** | Shared docs consolidated with the correct gate map; Puriva Launch remains blocked and production remains frozen |

G77b evidence remains preserved: workflow run `2244413e-d87b-45a1-8a26-6634ec8972d5`, ledger row `5d8d635c-ced0-4a14-9b33-839e1fdee508`, and `actualCostUsd=null`. G79 changes the local monthly aggregation behavior for completed ledger rows; it does not prove staging/production live AI or provider invoice-cost ingestion.

**Recommended next gate:** **G89** — owner-selected launch-blocker execution gate, preferably the lowest-blast-radius proof that unlocks downstream work (R2 real-bucket proof is the current recommended first candidate). Any live proof, staging/prod action, commit, push, or deploy still requires explicit owner approval.

## G89-G148 final integration closeout (2026-07-10)

**Overall integration verdict:** **KEEP** if validation passes. All lanes are local/no-IO foundations unless explicitly labeled blocked. Puriva Launch remains **BLOCKED**; production remains frozen.

| Gate | Status | Integrated result / limitation |
|------|--------|--------------------------------|
| **G89** | **READY** | R2 no-IO readiness foundation integrated; no real bucket IO performed |
| **G90** | **READY** | R2 proof-stage contract and disabled-safe proof staging added locally |
| **G91** | **READY** | Storage-key guards reviewed for client-safe paths |
| **G92** | **READY** | `STORAGE_R2_PROOF.md` records local proof scope and live-bucket deferral |
| **G93** | **READY** | External integrations readiness check reported 30/30 in lane proof |
| **G94** | **READY** | Notification taxonomy foundation integrated |
| **G95** | **READY** | Notification event mapping foundation integrated |
| **G96** | **READY** | Notification policy foundation integrated |
| **G97** | **READY** | No-send email adapter foundation integrated; no live send |
| **G98** | **READY** | Transactional template foundation integrated locally |
| **G99** | **READY** | Notification focused tests reported 20/20 in lane proof |
| **G100** | **BLOCKED** *(historical as of G89–G148 / 2026-07-10)* | Notification persistence/in-system inbox remained deferred **at that gate**; **superseded 2026-07-12** — persistence/UI LOCAL FOUNDATION; staging migration APPLIED; see WORKSTREAM 1A |
| **G101** | **BLOCKED** | Live email/Resend proof remains deferred (**still current** — not STAGING LIVE PROVEN) |
| **G102** | **BLOCKED** | Puriva transactional notification E2E/launch proof remains blocked until live email + full workflow proof (**still current**; persistence foundation no longer the missing piece alone) |
| **G103** | **READY** | GA/GSC config-helper foundation integrated; no OAuth/live sync |
| **G104** | **READY** | Monthly report helper foundation integrated |
| **G105** | **READY** | Client FINAL visibility/report guards integrated locally |
| **G106** | **READY** | Manual/snapshot metrics handling remains explicit and client-safe |
| **G107** | **READY** | Lane API check reported PASS |
| **G108** | **BLOCKED** | Live GA/GSC OAuth/sync remains deferred |
| **G109** | **PARTIAL** | Monthly report live-data docs updated; live data proof not executed |
| **G110** | **READY** | WordPress draft payload foundation integrated |
| **G111** | **READY** | Publish remains frozen before fetch/live action |
| **G112** | **READY** | WordPress credential-shape checks integrated; no credential disclosure |
| **G113** | **READY** | WordPress focused tests reported 5/5 in lane proof |
| **G114** | **BLOCKED** | Live WordPress draft proof remains deferred; auto-publish remains deferred |
| **G115** | **READY** | Image compliance policy helper foundation integrated |
| **G116** | **READY** | Medical-aesthetic compliance helper behavior integrated locally |
| **G117** | **READY** | Lane unit suite reported 276/276 at time of proof |
| **G118** | **BLOCKED** | Live image provider selection/wiring remains deferred |
| **G119** | **BLOCKED** | Image generation live proof remains blocked |
| **G120** | **READY** | Client Portal leak hardening integrated locally |
| **G121** | **READY** | Client Portal FINAL-only guards integrated |
| **G122** | **READY** | Focused Client Portal tests reported 9 pass |
| **G123** | **BLOCKED** | Staging/production Client Portal proof remains deferred |
| **G124** | **READY** | Shared Client Operating Pack constants integrated |
| **G125** | **READY** | Puriva operating pack constants integrated |
| **G126** | **READY** | Client pack tests reported 4/4 |
| **G127** | **READY** | Shared package check reported PASS |
| **G128** | **READY** | Market Intelligence future-module contract integrated |
| **G129** | **READY** | Revenue Hub future-module contract integrated |
| **G130** | **READY** | POD Toolkit future-module contract integrated |
| **G131** | **READY** | Future-module proof fixtures added |
| **G132** | **READY** | Future-module closeout doc added |
| **G133** | **READY** | Shared package check reported PASS |
| **G134** | **READY** | AI budget vs Finance Lite reporting boundary added; ledger service not modified |
| **G135** | **READY** | Reconciliation design models estimate/trusted actual/invoice/variance slots without invoice integration |
| **G136** | **READY** | AI budget reporting contract and unit proof added |
| **G137** | **READY** | AI budget reporting docs closeout added; focused tests reported 6/6 |
| **G138** | **PARTIAL** | Security checklist/operator inventory docs added; no external audit or production proof |
| **G139** | **READY** | Test/smoke inventory doc added |
| **G140** | **READY** | Validation command guard doc added |
| **G141** | **READY** | Operator runbook updates integrated |
| **G142** | **PARTIAL** | Integrations truth labels updated; staging/prod proofs remain not proven |
| **G143** | **PARTIAL** | Deferred scope register reconciled; live proofs stay deferred |
| **G144** | **PARTIAL** | Security/inventory/operator docs closeout only; no runtime launch claim |
| **G145** | **PARTIAL** | Proposal-only outcome; no runtime implementation applied |
| **G146** | **PARTIAL** | Proposal-only outcome; no runtime implementation applied |
| **G147** | **READY** | `docs/operator/G147_NEXT_20_GATES.md` created as the next-gate roadmap |
| **G148** | **KEEP pending validation** | Main-agent integration/reconciliation, validation, and final report gate |

**Recommended next gate:** **G149** — owner-selected launch-blocker execution gate, with R2 target-environment real-bucket proof still the recommended first low-blast-radius candidate. See [`docs/operator/G147_NEXT_20_GATES.md`](./operator/G147_NEXT_20_GATES.md).

## G149-G228 final integration closeout (2026-07-10)

**Overall integration verdict:** **KEEP** if validation passes. All lanes are local/no-IO foundations unless explicitly labeled blocked. Puriva Launch remains **BLOCKED**; production remains frozen. No commit/push/deploy authorized by G228.

| Gate range | Status | Integrated result / limitation |
|------------|--------|--------------------------------|
| **G149–G158** Storage/R2 | **READY (local)** | Proof-stage hardening, redacted config summary, private-storage proof intent, client-safe URL policy, serializer storageKey boundary tests, cleanup proof-plan constants; **no real bucket IO** |
| **G159–G170** Notifications | **READY (local) / BLOCKED (inbox+live)** *(historical persistence claim)* | Expanded taxonomy V2, recipient/channel/severity/redaction helpers, typed templates, no-send edge tests; persistence/inbox **design only** — no migration **at G149–G228 date**; **superseded 2026-07-12** (persistence implemented; live email still deferred) |
| **G171–G180** GA/GSC/monthly | **READY (local) / BLOCKED (live)** | Credential presence, period policy, source-truth serializer, metric validation, recommendation policy, client/admin output guards, CSV import proof plan; **no live Google** |
| **G181–G188** WordPress | **READY (local) / BLOCKED (live)** | Draft payload hardening, slug policy, status freeze, credential redaction, proof-plan constants, image-inclusion contract; **no live HTTP** |
| **G189–G198** Image | **READY (local) / BLOCKED (live)** | Compliance V2, prompt/alt/reject/approval-loop helpers, WP inclusion readiness, provider proof plan; G228 added four image-loop events to shared taxonomy; **no live provider** |
| **G199–G208** Client Portal | **READY (local) / BLOCKED (staging)** | Serializer/archive/monthly guards, approval serializers, pure approval policy, error-safety helpers, route inventory docs; one-revision-round needs durable schema field |
| **G209–G216** Puriva pack | **READY (local)** | Entitlement matrix, compliance validator, workflow catalog, client-visibility helpers, saas-later truth docs |
| **G217–G222** Future modules | **READY (contracts)** | MI/Revenue Hub/POD contracts hardened; no live scrape/CRM/marketplace |
| **G223–G227** Security/roadmap | **READY (docs)** | Security checklist G223, smoke inventory, validation guards, deferred cleanup proposal, [`G227_NEXT_30_GATES.md`](./operator/G227_NEXT_30_GATES.md) |
| **G228** | **KEEP pending validation** | Main-agent integration, cross-lane image notification taxonomy join, validation, final report |

**Recommended next gate:** **G229** — owner-selected launch-blocker execution gate; R2 target-environment real-bucket proof remains the recommended first low-blast-radius candidate. See [`docs/operator/G227_NEXT_30_GATES.md`](./operator/G227_NEXT_30_GATES.md).

## G229-G468 final integration closeout (2026-07-10)

**Overall integration verdict:** **KEEP** if validation passes. All lanes are local/no-IO foundations unless explicitly labeled blocked. Puriva Launch remains **BLOCKED**; production remains frozen. No commit/push/deploy authorized by G468.

| Gate range | Status | Integrated result / limitation |
|------------|--------|--------------------------------|
| **G229–G248** Storage/R2 | **READY (local)** | Proof-stage edges, partial-config diagnostics, no-IO label invariant, cleanup plan, proof-intent, client-safe URL policy, storageKey boundary, admin-vs-client field policy, error redaction; **no real bucket IO** |
| **G249–G268** Notifications | **READY (local) / BLOCKED (inbox+live)** *(historical persistence claim)* | Taxonomy aliases, payload snapshots, correlation/idempotency design, no-send/template/config tests; persistence/inbox **design only** — no migration **at G229–G468 date**; **superseded 2026-07-12** (persistence implemented; live email still deferred) |
| **G269–G288** GA/GSC/monthly | **READY (local) / BLOCKED (live)** | Config/redaction/period/source-truth, unavailable-state + export-truth helpers, output guards; **no live Google** |
| **G289–G308** WordPress | **READY (local) / BLOCKED (live)** | Slug/draft/freeze/redaction, sanitization, taxonomy placeholders, author-tenant mapping design; **no live HTTP**; publish frozen |
| **G309–G328** Image | **READY (local) / BLOCKED (live)** | Compliance V3, prompt/alt/approval-loop, no-live provider invariant; **no live provider** |
| **G329–G348** Client Portal | **READY (local) / BLOCKED (staging)** | Serializer/error/approval no-leak tests, route inventory, admin-vs-client matrix; revision-round persistence still needs schema |
| **G349–G368** Puriva pack | **READY (local)** | Entitlement/visibility/catalog helpers, workflow templates (`executionEnabled: false`), saas-later truth labels |
| **G369–G388** Future modules | **READY (contracts)** | MI/RH/POD contract hardening; no scrape/CRM/marketplace/image |
| **G389–G408** AI budget/routing | **READY (local)** | Reporting/reconciliation, trusted-actual design, notification mapping to existing `BUDGET_*`, routing truth labels; `actualCostUsd` ingestion deferred |
| **G409–G428** Security/operator | **READY (docs)** | Checklist G409, redaction inventories, freeze/staging sweeps, no-live catalogue, owner/live-proof checklists |
| **G429–G448** UI/testability | **READY (docs + tiny copy)** | Surface inventories, hotspot split plan, proof-state vocabulary/labels; no large UI rewrite |
| **G449–G468** Deferred/roadmap | **KEEP** | Deferred register cleanup, truth matrix/Puriva/STATUS refresh, [`G468_NEXT_50_GATES.md`](./operator/G468_NEXT_50_GATES.md) |

**Recommended next gate:** **G469** — owner-selected launch-blocker execution gate; R2 target-environment real-bucket proof remains the recommended first low-blast-radius candidate. See [`docs/operator/G468_NEXT_50_GATES.md`](./operator/G468_NEXT_50_GATES.md).

## G134-G137 AI budget reporting/reconciliation contract (2026-07-10)

| Gate | Result | Evidence / limitation |
|------|--------|-----------------------|
| **G134 — AI budget vs Finance Lite separation** | **READY (contract/docs/tests)** | `ai-budget-reporting.contract.ts` defines a separate AI budget reporting boundary; Finance Lite remains admin finance records/invoices/bills only |
| **G135 — Reconciliation design** | **READY (design only)** | Estimate, trusted actual, invoice, and variance slots are modeled; invoice fields remain `null` / `not_integrated`; no real invoice source is wired |
| **G136 — Reporting contract** | **READY (local unit proof)** | Contract reports monthly cap, countable/live rows, estimated-vs-actual spend basis, provider/model breakdown, and G79-compatible spend math without changing `sumSpentUsdForPeriod()` |
| **G137 — Docs closeout** | **READY (docs)** | Detail recorded in [`AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md`](./runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md) and [`AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md) |

No backend route, Prisma schema, Finance Lite API, auth, provider runtime, VPS, deploy, production behavior, or real invoice ingestion changed in G134-G137.

## G76 persistent completed ledger wiring closeout (2026-07-10)

| Item | State |
|------|--------|
| Gate | G76b + G76c + G76d — persistent COMPLETED `AiBudgetLedgerEntry` wiring (mocked/no-live proof) |
| Implementation | `ai-delivery-workflow-ledger-attribution.service.ts` bridge + `executeAiDeliveryWorkflowRun()` hook in `core.runtime.ts` |
| Persistence path | Successful OpenRouter AI Delivery workflow execute → `recordCompletedAiLedgerEntry()` via existing G74 helpers |
| Scope | OpenRouter success path only (`gateway=openrouter`, no `safeError`); local deterministic skipped safely |
| `stepReference` | `ai-delivery-execute:summary` / `content_plan_draft` / `article_draft` |
| Idempotency | Existing upsert on `(tenantId, workflowRunId, stepReference)` |
| Failure handling | Ledger persistence failure does not roll back successful workflow execution; audit-safe executionLog note appended |
| Schema | **No change** — existing `AiBudgetLedgerEntry` sufficient |
| Validation | `test:unit` 252/252 PASS; `validate` PASS; `git diff --check` PASS |
| Live proof | **DONE in G77b (local only)** — superseded the G76 “NOT DONE” deferral; see G77b closeout above |
| G75 context | G75 proved generated completed attribution from observability; G76 closes the auto-persist gap for future executes |
| Production readiness | **NO** — production remains frozen; staging/production live proof not claimed |
| Next gate | Superseded by G77b PASS; then **G77c** docs commit/push |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md) · [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.17 · [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## G75 live spend attribution proof closeout (2026-07-10)

| Item | State |
|------|--------|
| Gate | G75 + G75c + G75d — controlled live spend attribution proof (local only) |
| `main` commit (implementation base) | `e5269fc` — `feat: add AI completed ledger attribution` |
| Operator | Piotr Pakula |
| Phase 1 — local deterministic baseline | **PASS** — `smoke:openrouter-guarded:local` 12/12; `liveProviderCalled=false` |
| Phase 2 (G75 v2) — one live OpenRouter proof | **PASS** — strict live smoke 12/12; exactly **one** live OpenRouter call |
| Formal live run ID | `6e538323-8e68-4d41-a4c5-9e30ca0cf8a1` |
| Provider / model | OpenRouter — `anthropic/claude-haiku-4.5` |
| `liveProviderCalled` | `true` (Phase 2) |
| Budget evidence | `AI_TEXT_BUDGET_POLICY_V1`; `approximateSessionCostUsd~0.000239` (below **$1.00 USD** cap) |
| Phase 3 — restore local deterministic gateway | **PASS** — guarded smoke 12/12; `liveProviderCalled=false` after restore |
| G75c completed attribution verifier | **PASS** — `node --import tsx $env:TEMP\verify-g75-completed-attribution-v2.mjs`; completed attribution metadata generated via G74 `finalizeOrchestratorLiteLedgerAttribution` against live observability |
| Persistent COMPLETED ledger row | **NOT FOUND** — smoke path does not auto-persist completed attribution; metadata generated-only at verify time; **deferred to G76** |
| G75c root cause | Verifier/tooling only — plain `node` could not resolve shared barrel `.ts` re-exports; original verifier selected post-restore local client instead of live OpenRouter evidence |
| Forbidden integrations | **None triggered** |
| Secrets | **Not exposed** |
| Production readiness | **NO** — production remains frozen; staging/production live proof not claimed |
| Next gate | **G75e** commit/push docs closeout; then **G76** persistent live completed ledger row wiring |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./runbooks/AI_MODEL_ROUTING_POLICY.md) · [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.16 · [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

---

## 1. Current branch / main status

| Item | State |
|------|--------|
| Branch | `main` synced with `origin/main` |
| Latest implementation commit | `64bfd06` — `prelive: complete post-G56 orchestration readiness` (G57–G68 merged via G69 fast-forward) |
| G69 merge | **DONE** — branch `cursor/g57-g68-prelive-completion` fast-forward to `main`; validation before merge PASS (198 unit tests, orchestrator + provider smokes, validate) |
| Working tree | Clean except untracked `.cursor/settings.json` (must not be committed) |
| Latest docs/local closeout commit | `42f969f` — `docs: mark G54 HSTS blocker closed in G53 plan`; G35 Phase B local smoke proof remains `217c11c`; current staging artifact is `1b8d00d` after 2026-07-11 controlled deploy |
| Pre-staging local closeout (G35 Phase B) | **PASS** — full local pre-staging gate passed on `217c11c`; see §2.7 |
| Latest local pre-staging re-check (G43) | **PASS** — validate plus four focused local smokes passed on current `main`; no repo edits, commit/push/deploy, staging/VPS/prod; see §2.9 |
| Controlled refresh (G35 Phase C) | **PASS** — staging artifact refreshed from `5ee8389` to `5e1ea5a`; local validate PASS before artifact creation; staging API recreated; DB healthy; MVP smoke PASS; production untouched; see §2.8 |
| Production deploy | **Frozen/deferred; production deploy ready: NO** — `system.digitalcubeagency.net` unchanged; G48/G53 planning PASS do not authorize deploy. G49 dry-run and G50 deploy **not executed**. G54 HSTS/proxy: PASS. Next production path remains G49 dry-run before G50. |
| Staging deploy | **Controlled staging deploy of `1b8d00d` completed 2026-07-11 with post-deploy smoke PASS.** Current artifact/API context `/opt/dca/staging-artifacts/1b8d00d`; host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`; staging compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml` with `--env-file .env.staging`; correct API service `dcaosv1-staging-api`. Applied migrations: `20260709120000_add_ai_budget_ledger`, `20260711115000_add_in_app_notifications`. Prior G46d/G47 PASS on `5e1ea5a` is historical. Any further staging refresh/execution/migration requires fresh explicit owner approval. |
| Staging target (G1) | `staging.digitalcubeagency.net` exists and resolves to the same VPS as `system.digitalcubeagency.net`; staging responds with artifact context `/opt/dca/staging-artifacts/1b8d00d`; health 200; web root 200 |
| Default AI execution | Local deterministic (restored after G71e-retry); live OpenRouter opt-in only — **local formal proof complete** |
| Work mode | Local-first on Windows PowerShell from `C:\dcaosv1` |

**Rule:** Merge to `main`, staging PASS, G47 PASS, G48/G53 planning PASS, or G52-B baseline do not authorize staging or production deploy. G49/G50 require separate explicit owner approval. Explicit owner approval required before touching staging or production.

---

## 2. Latest closed blocks (Blocks 1–4)

| Block | Commit | Scope | CI |
|-------|--------|-------|-----|
| **1** — External integrations readiness | `136e93a` | Config-only readiness layer: `GET /api/v1/integrations/readiness`, `check:external-integrations-readiness`, `smoke:external-integrations-readiness:local`. No live calls, publish, sync, or bucket IO. | Green |
| **2** — Admin operations | `5308f19` | Read-only `GET /api/v1/admin/operations/summary`, dashboard Operational readiness panel, recovery runbook, `smoke:admin-operations:local`. | Green |
| **3** — UI density | `cc40160` | Dark-theme UI density consolidation for admin and client surfaces (CSS-only). No backend/schema/API/auth changes. | Green |
| **4** — Docs + operator runbook | `c7af674` | Consolidate STATUS, architecture map, smoke matrix, operator runbooks, env inventory, staging gate, deferred roadmap. Docs-only. | Green |
| **5A–5D-A** — Claude audit remediation | `2437c84` … `e54445f` | Admin tenant-read RBAC, fail-closed client boundary smokes, CI unit-test proof, cross-platform test globs, remote staging opt-in, bootstrap guard hardening. | Green |

Prior closeout baseline (still valid context): client approval happy-path `58db726`, production-readiness closeout pack `179dc04`.

### 2.1 Block 5D-B — pre-staging local closeout (2026-07-05)

**Result:** PASS with manual workaround. **Does not authorize G4 staging action or deploy.**

| Phase | Result | Proof (compact) |
|-------|--------|-----------------|
| 0 Preflight | PASS | `main` = `origin/main`; clean tree; `git diff --check` exit 0 |
| 1 No-service / local tests | PASS | `npm run validate`, `npm run test:unit`, `npm run test:integration`; syntax checks; guard tests |
| 1b Guard refusal proofs | PASS | Staging security baseline and bootstrap check both exit 1 with refusal text; no remote/DB execution |
| 2 Audit / Block 1–2 smokes | PASS | External integrations readiness; admin operations 16/16; client-role API boundary 48/48 |
| 3 Block A core smokes | PASS (manual fallback) | Puriva client portal boundary 153/153; remaining core smokes run individually — all PASS |

**Phase 3 manual core smokes (orchestrator fallback):** `smoke:ai-delivery-reviews`, `smoke:ai-seo-content-plan-pdf`, `smoke:ai-knowledge-context`, `smoke:client-portal-monthly-report:browser`, `smoke:monthly-report:browser`, `smoke:monthly-report:mi-context`. Final status: `PHASE3_MANUAL_CORE_PASS`.

**Audit remediation commits (5A–5D-A, on `main`):**

| Commit | Summary |
|--------|---------|
| `2437c84` | `fix(api): require admin role for internal tenant reads` |
| `8b084a2` | `test(smoke): fail closed on client boundary prerequisites` |
| `c26e241` | `test(ci): add unit test proof and remove integration false greens` |
| `acd8962` | `fix(api): use node test runner globs for cross-platform CI` |
| `5f37243` | `fix(smoke): require explicit opt-in for remote staging baseline` |
| `e54445f` | `fix(scripts): harden staging admin bootstrap guards` |

**Not performed during 5D-B:** staging/prod URLs, remote DB, bootstrap write, SSH/VPS/docker/DNS, deploy, commit, or push.

**Known issue:** `npm run smoke:staging-readiness:local` orchestrator can hang after Puriva smoke completes (local PowerShell/log/process handling). Manual fallback for remaining Block A core smokes succeeded. Before G4, fix orchestrator or explicitly accept the manual workaround — see [`STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md).

**Next gate:** G4 staging action remains **blocked** until explicit owner approval. Local 5D-B PASS alone does not authorize staging infrastructure work or deploy.

---

### 2.2 G35 Phase C — controlled staging refresh proof (2026-07-07)

**Controlled refresh on commit `5e1ea5a`:** staging artifact refreshed from `5ee8389` to `5e1ea5a` (`docs: record staging discovery facts`). Local validation PASS before artifact creation. Staging API recreated; DB healthy (not recreated). Staging MVP smoke PASS. Production containers untouched. Full evidence recorded in §2.8.

**Staging DNS/infrastructure (read-only discovery, 2026-07-07):** `staging.digitalcubeagency.net` and `system.digitalcubeagency.net` both resolve to `167.233.42.59` / `2a01:4f8:1c18:cefe::1`; VPS hostname `DCA01`; Caddy has routes for both; staging and production have separate API/Postgres containers and loopback ports; both `/api/v1/health` endpoints return 200 with DB ready; staging web root 200 serving DCA OS v1 HTML; production web root 200 with different asset hashes. Staging compose context now confirmed at `/opt/dca/staging-artifacts/5e1ea5a`.

**Authoritative current state (2026-07-07 post-refresh):** G35 Phase C controlled refresh complete on commit `5e1ea5a`; staging artifact updated; staging API health 200; staging MVP smoke PASS; production containers untouched. Staging is now proven current with commit `5e1ea5a` (`docs: record staging discovery facts`). Future staging refresh/execution/migration/deploy requires fresh explicit owner approval. This docs reconciliation does not authorize further VPS, staging, production, deploy, DNS, migration, SSH, Docker, or Caddy action without explicit owner instruction.

**Original (pre-refresh, now superseded):** staging artifact `5ee8389` (see historical note below).

| Item | Current state (`5e1ea5a`) |
|------|---------------------------|
| Staging artifact context | `/opt/dca/staging-artifacts/5e1ea5a` |
| Staging API | `dcaosv1-staging-api` recreated; health 200 |
| Staging DB | `dcaosv1-staging-postgres` healthy; no migration run |
| Production API | `dcaosv1-api` untouched |
| Production DB | `dcaosv1-postgres` untouched |
| Staging web root | 200; serves DCA OS v1 assets |
| MVP smoke result | PASS — login/auth/modules/logout/token boundary |

**Historical note (pre-refresh `5ee8389`, 2026-07-05):**

Prior artifact `5ee8389` was deployed on 2026-07-05 with claimed Phase 8 Caddy web-root fix. Backups present at `/opt/dca/backups/docker-compose.yml.20260705-063309.bak`, `/opt/dca/backups/Caddyfile.20260705-063309.bak`, and `/opt/dca/apps/dcaosv1/staging/backups/pg-backup-staging-5ee8389-pre-migrate-20260705-043540.sql`. That state is now superseded by the controlled Phase C refresh to `5e1ea5a`.

### 2.3 G5 Puriva approval UX completion (2026-07-05)

**Result:** PASS — client portal approval UX closeout on `ec4c41c` (`polish(client): clarify Puriva approval UX`).

| Item | Evidence |
|------|----------|
| Changed area | Client portal approval UX |
| Validation | `git diff --check` PASS; `npm.cmd run -w @dca-os-v1/web check` PASS; browser QA PASS |
| CI | Green |
| Production / staging | Untouched |
| Working tree after push | Clean |
| Next block | Owner decision |

### 2.4 G6 Puriva launch cockpit completion (2026-07-05)

**Result:** PASS — G6 Wave 1 complete on `4eeac1e` (`feat(ops): add G6 Puriva launch cockpit and operating pack`).

| Item | Evidence |
|------|----------|
| Main additions | Puriva operational intake/compliance pack; admin daily operations cockpit; client portal wording/request-changes polish; SEO/content/asset/WordPress handoff docs tightening |
| Validation | `git diff --check` PASS; `npm.cmd run -w @dca-os-v1/web check` PASS; `npm.cmd run validate` PASS; browser QA PASS |
| CI | Green |
| Production / staging / VPS | Untouched |
| Working tree after push | Clean |
| Remaining warning-only item | Vite chunk-size warning during build only |
| Next block | Owner decision |

### 2.5 G6 Wave 2 compact delivery handoff lanes completion (2026-07-05)

**Result:** PASS — G6 Wave 2 complete on `95a92c9` (`polish(ops): compact delivery handoff lanes`).

| Item | Evidence |
|------|----------|
| Main additions | Compact AI Delivery lanes; WorkflowBriefs intake/compliance handoff clarity; SEO/content/WordPress draft-only handoff tightening; client-safe archive/report wording |
| Validation | Diff-only review PASS; earlier Wave 2 validation PASS (`git diff --check`, web check, full validate, browser QA) |
| CI | Green |
| Commit-script nuance | Local commit-script `npm.cmd run validate` later hit known Windows Prisma EPERM during `prisma:generate`; the script printed STOP, but the code commit/push still completed and CI green plus post-push verification superseded the local failure |
| Post-push verification | PASS — `main` synced with `origin/main`; remote `origin/main` points to `95a92c9`; working tree clean |
| Production / staging / VPS | Untouched |
| Remaining warning-only item | Vite chunk-size warning during build only; future PowerShell runner should stop commit/push when local validation fails |
| Next block | Owner decision |

### 2.6 G7 Block 2 Puriva operational data path completion (2026-07-05)

**Result:** PASS — Puriva intake now connects to AI Knowledge, WorkflowBriefs, SEO planning, and AI Delivery handoff on `8cb41e2` (`polish(ops): connect Puriva intake to delivery path`).

| Item | Evidence |
|------|----------|
| Main additions | Puriva intake now feeds AI Knowledge / WorkflowBriefs / SEO plan / AI Delivery handoff; WorkflowBriefs readiness cues are clearer; AI Knowledge operating links are clarified; SEO/content/WordPress draft-only handoff is aligned to verified Puriva context |
| Validation | Diff-only review PASS; web check PASS; full validate PASS; browser QA PASS (`smoke:workflow-brief-publication-handoff:browser`, `smoke:ai-delivery-workflow:browser`); additional handoff-align agent also passed `smoke:ai-delivery-reviews` after Prisma EPERM recovery |
| CI | Green |
| Push | PASS — `main` synced with `origin/main` after commit/push |
| Boundaries preserved | Admin-only / client-safe / draft-only boundaries preserved; no backend/schema/auth changes |
| Production / staging / VPS | Untouched |
| Next block | Owner decision |

### 2.7 G35 Phase B — browser smoke stabilization closeout (2026-07-07)

**Result:** PASS — local pre-staging gate closed on `217c11c` (`test: stabilize G35 Phase B browser smokes`).

| Item | Evidence |
|------|----------|
| Scope | Smoke/runner stabilization only in `scripts/smoke-auth-invite-boundary-browser-local.mjs`, `scripts/smoke-browser.ps1`, `scripts/smoke-client-portal-populated-delivery-browser-local.mjs`, `scripts/smoke-dashboard-data-backed-browser-local.mjs`, `scripts/smoke-mi-operator-browser-local.mjs`, `scripts/smoke-monthly-metrics-import-browser-local.mjs`, and `scripts/smoke-roles-permissions-browser-local.mjs` |
| CI | Green on `217c11c` |
| Local gate | `npm.cmd run smoke:pre-staging:local` PASS — local repo gate complete |
| Browser drift blockers | Resolved for the Phase B browser smoke set above |
| Prisma EPERM | Known local Windows lock issue; recover by stopping the locking Node process, removing the generated Prisma client, and rerunning validation/smoke once |
| Deploy state | No VPS, staging, or production deploy performed |
| Boundaries preserved | No app, backend, API, schema, auth, or business-logic changes |

### 2.8 G35 Phase C — controlled staging refresh closeout (2026-07-07)

**Result:** PASS — controlled refresh of staging on `5e1ea5a` (`docs: record staging discovery facts`). **Base:** `217c11c` Phase B proof (`test: stabilize G35 Phase B browser smokes`). **Scope:** docs-only discovery, local validation, artifact creation/upload, controlled VPS artifact refresh, staging API recreation, admin bootstrap verification, and MVP smoke pass.

| Item | Evidence |
|------|----------|
| Artifact source commit | `5e1ea5a` (`docs: record staging discovery facts`) |
| Local pre-artifact validation | PASS — `npm.cmd run validate` clean before artifact creation |
| Artifact creation + upload | Local tar: `dcaosv1-5e1ea5a.tar` → remote temp `/tmp/dcaosv1-5e1ea5a.tar` → extracted to `/opt/dca/staging-artifacts/5e1ea5a` |
| Staging compose context update | `5ee8389` → `5e1ea5a` (verified `docker-compose.yml` points to new artifact) |
| Staging API recreation | Only `dcaosv1-staging-api` recreated with new artifact context; health 200 confirmed |
| Staging DB handling | `dcaosv1-staging-postgres` remained healthy (not recreated); no schema migration needed per `git diff 5ee8389..5e1ea5a` (no Prisma schema delta) |
| Prisma migrate deploy | Not performed — no pending migrations detected for staging DB |
| Admin bootstrap | Explicit DCA_BOOTSTRAP_DATABASE_TARGET=staging + DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN guard passed; secrets not printed |
| Staging MVP smoke | Login 200, auth/me 200, modules/current 200, logout 200, reused token 401 — PASS |
| Final post-proof | Staging health 200 with DB ready, staging web root 200, production health read-only 200, staging compose context confirmed at `5e1ea5a` |
| Production containers | `dcaosv1-api`, `dcaosv1-postgres` untouched; no production changes |
| Caddy / DNS / routing | Not modified during refresh |
| Deploy state | Controlled VPS artifact refresh only — no code push, no staging CI/migration deploy, no production touch |
| Boundaries preserved | Docs-only update + discovery facts recorded in STATUS.md §2.2; no runtime code changes, no schema changes, no secret exposure |

### 2.9 G38–G43 local/docs alignment closeout (2026-07-07)

**Result:** PASS for the latest docs/local alignment baseline on `main` at `a18dcc1`. **Does not authorize staging, VPS, production, deploy, migration, Docker, Caddy, or secrets work.** G35 Phase C remains the latest controlled staging refresh baseline; G43 is the latest local pre-staging re-check baseline.

| Gate | Commit / proof | Scope | Result |
|------|----------------|-------|--------|
| G38 | `564e440` | AI Delivery admin copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G39 | `691435c` | Monthly Report admin copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G41 | `a18dcc1` | Client Portal monthly report copy polish | CI green; no backend/API/auth/schema/VPS/deploy changes |
| G42 | Discovery only | Local closure/docs alignment discovery | No edits; no blockers |
| G43 | Local re-check | Pre-staging readiness re-check after copy polish | PASS; no repo edits; no commit/push/deploy/staging/VPS/prod |

**G43 proof recorded:**

- `npm.cmd run validate`: PASS
- `smoke:client-portal:populated-delivery:browser`: PASS
- `smoke:client-portal:edge-cases:browser`: PASS
- `smoke:client-portal:sparse-delivery:browser`: PASS
- `smoke:monthly-report:local`: PASS
- Final git status: clean/synced on `main`
- No repo edits, no commit, no push, no deploy, no staging/VPS/prod touch

**G43 runtime-order lesson:** for future runtime gates, stop local Node processes first, remove the generated Prisma client folder only if needed, run `npm.cmd run validate` before starting API/Web, then start API/Web only after validate passes and run smokes. This avoids Windows Prisma DLL locks and preserves real process-exit-code capture.

### 2.10 G46d controlled staging deploy/proof closeout (2026-07-09)

**Result:** PASS — controlled staging deploy/proof completed against staging only. Production deploy attempted: **NO**. Production app/API/DB mutation: **NO**.

| Item | Evidence |
|------|----------|
| Local validation | PASS after Prisma DLL lock unlock retry. Initial `validate` failed due to Windows Prisma `query_engine` DLL `EPERM` lock; recovery was stopping `node.exe`, waiting, then rerunning `validate`. |
| API context used | `/opt/dca/staging-artifacts/5e1ea5a` |
| Host-side staging web target used | `/opt/dca/apps/dcaosv1/staging/web/dist` |
| Staging compose used | `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml` |
| Compose env file | `--env-file .env.staging` is required |
| Correct staging API compose service | `dcaosv1-staging-api` — not `api` |
| Staging web backup created | `/opt/dca/apps/dcaosv1/staging/backups/web-dist-before-g46d-20260709-084640` |
| Staging API image built | `staging-dcaosv1-staging-api:latest` |
| Staging API container | `dcaosv1-staging-api`; `127.0.0.1:4011->4000` |
| Staging DB container | `dcaosv1-staging-postgres`; `127.0.0.1:5435->5432` |
| Production API remained running | `dcaosv1-api`; `127.0.0.1:4010->4000` |
| Production DB remained running | `dcaosv1-postgres`; `127.0.0.1:5434->5432` |
| Shared Caddy handling | Shared Caddy recreate was approved and performed only to refresh stale staging web bind mount. Working pattern: `cd /opt/dca && docker compose -f /opt/dca/docker-compose.yml up -d --force-recreate --no-deps caddy`. |
| Caddy mount refresh lesson | Do not replace a mounted `dist` directory with `rm -rf` + `mv` without recreating Caddy afterward. Preferred future pattern: copy contents into the existing mounted `dist`, or force recreate Caddy with `--force-recreate --no-deps` after replacing `dist`. |
| Caddy final view | `/srv/dcaosv1-staging/web/dist/index.html` visible inside Caddy |
| Final HTTP proof | `staging-root-http=200`; `staging-health-http=200`; `prod-health-only-http=200` |
| Final local git status before docs | `## main...origin/main` |

G46d was staging-only. No production deploy was attempted, and production app/API/DB were not mutated.

### 2.11 G47 staging smoke/proof closeout (2026-07-09)

**Result:** PASS — staging smoke/proof completed after G46d. Docs-only G47d records proof facts. No repo/source edits occurred during smoke gates. No deploy was attempted. VPS/staging/production were not mutated. No commit or push occurred during smoke gates.

| Item | Evidence |
|------|----------|
| Baseline commit before G47 docs | `f25158d` (`docs: record G46d staging deploy proof`) |
| G47 minimal staging proof | PASS — `staging-root-http=200`; `staging-health-http=200`; `prod-health-only-http=200`; staging/prod separation confirmed |
| Staging/prod separation | Staging API `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; production API `dcaosv1-api` on `127.0.0.1:4010->4000`; staging/prod Postgres containers remain separate |
| G47b MVP staging smoke | PASS after explicit target env; initial run without explicit target refused/failed by target guard; retry passed with `smoke-mvp-staging-exit=0` |
| G47b required env | `MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1` |
| G47b key PASS items | staging API target; health; login; `auth/me`; `auth/context`; `tenants/current`; `modules/current`; logout; reused token unauthorized |
| G47c staging security baseline smoke | PASS after explicit target env; initial run without explicit target refused by remote target guard; retry passed with `smoke-staging-security-baseline-exit=0` |
| G47c required env | `DCA_SMOKE_REMOTE_TARGET=staging` |
| G47c result | `31/31 passed, 1 warning(s)` |
| G47c warning | HSTS missing — known proxy hardening item; warning only; production health probe inside smoke skipped unless explicitly approved |
| Final git status before docs | `## main...origin/main` |

**Target guard lesson:** staging smoke scripts may intentionally refuse to run without an explicit remote target env. Treat refusal as expected safety behavior, set only the documented staging target env for the approved smoke, and never infer production targets.

**Historical G47c note:** G47c reported HSTS missing as warning only at that time. **G54 HSTS/proxy: PASS** — HSTS is now present on staging and production.

### 2.12 G48 production readiness planning closeout (2026-07-09)

**Result:** PASS — production readiness planning and sealed checklist alignment completed as a docs-only planning gate. **Production deploy ready: NO. Production deploy attempted: NO. Production remains frozen/deferred until separate explicit owner approval.**

| Item | Evidence |
|------|----------|
| Latest baseline commit before G48b docs | `1b4e03c` (`docs: record G47 staging smoke proof`) |
| G48 production readiness planning | **PASS** |
| Production deploy ready | **NO** |
| Production deploy attempted | **NO** |
| VPS/staging/prod mutation during G48 planning | **NO** |
| Repo edits during G48 planning | **NO** |
| Commit/push during G48 planning | **NO** |
| Smoke run during G48 planning | **NO** |
| Runtime proof refreshed | `staging-root-http=200`; `staging-health-http=200`; `production-root-http=200`; `production-health-http=200` |
| Runtime separation confirmed | Shared Caddy `dca-caddy`; staging API `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; staging DB `dcaosv1-staging-postgres` on `127.0.0.1:5435->5432`, healthy; production API `dcaosv1-api` on `127.0.0.1:4010->4000`; production DB `dcaosv1-postgres` on `127.0.0.1:5434->5432`, healthy |
| HSTS status | Known proxy hardening warning from G47c; fix before production promotion or explicitly defer with owner acceptance |

**Production deploy blocker checklist before any production mutation:**

1. Explicit owner approval for a production deploy gate.
2. Confirm exact artifact/commit intended for production promotion.
3. Confirm production backup and rollback evidence before any mutation.
4. Confirm production env separation from staging and no staging credentials in production.
5. Confirm schema/migration safety; stop if migration would drop tables/columns.
6. Decide HSTS: fix before promotion or explicitly defer with owner acceptance.
7. Keep live integrations gated unless separately approved: AI provider, WordPress, R2, GA/GSC, and email sending.
8. Run a production deploy dry-run/read-only proof before any production mutation.

**Proposed next gates:** G49 production deploy dry-run/read-only proof, then G50 production deploy gate only after explicit owner approval. G48 planning PASS does not authorize G49, G50, production deploy, production mutation, VPS changes, staging changes, Caddy changes, Docker changes, migrations, or live integration enablement.

### 2.13 G53 production safety plan closeout (2026-07-09)

**Result:** PASS — G53 production safety plan approved as docs-only planning gate. **Production deploy ready: NO. Production deploy attempted: NO. G53 does not authorize implementation, G54 fix, G49, G50, or production mutation.**

| Item | Evidence |
|------|----------|
| G53 approved | **YES** — planning only |
| Production readiness | **NO** |
| Production v1 principle | Controlled agency ops — admin-controlled, approval-gated; not full automation |
| Staging proven | G46d/G47 PASS from prior gates |
| G49 dry-run | **Not executed** |
| G50 production deploy | **Not executed** |
| Next gate | **G49** — production dry-run/read-only proof (not executed; owner approval required) |
| Puriva Launch | **Blocked** — live proof gates required before launch |
| RBAC stance | Not blocker for limited Production v1 if boundaries safe; blocker before scaling/SaaS |

**G53 blockers recorded:** HSTS/proxy security warning; rollback/restore evidence; env/secrets separation; credential storage; tenant/client boundary re-verification on target; integration truth matrix ([`INTEGRATIONS_TRUTH_MATRIX.md`](./runbooks/INTEGRATIONS_TRUTH_MATRIX.md) — audit baseline 2026-07-09); controlled dry-run (G49); G49 before G50 sequence.

**Next gates (ordered reference):** G49 production dry-run/read-only proof before any production deploy path. Puriva Launch proof gates remain separate: R2 proof → GA/GSC proof ([`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md)) → AI Model Research → AI Model Policy → live AI proof ([`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md)) → image generation proof → transactional notifications proof. WordPress draft handoff: [`WORDPRESS_DRAFT_PROOF.md`](./runbooks/WORDPRESS_DRAFT_PROOF.md) (auto-publish remains deferred).

Full plan: [`docs/runbooks/G53_PRODUCTION_SAFETY_PLAN.md`](./runbooks/G53_PRODUCTION_SAFETY_PLAN.md).

## 3. Module readiness (local admin-operated)

Percentages are **local MVP readiness**, not production-proven. See [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md) for detail.

| Module / area | Local readiness | Safe for admin now | Not production-proven |
|---------------|-----------------|--------------------|------------------------|
| **Core platform** (auth, tenant, modules, RBAC) | **100% local-skeleton + proven-RBAC** | Core app foundation skeleton: auth structure protected by check:auth-skeleton, login/logout routes scaffold (501 Not Implemented where intended), session persistence BLOCKED (SESSION_DB_RUNTIME_BLOCKED), permission/module enforcement skeleton-only and not wired. Operator/admin RBAC proven: tenant switch, module entitlements UI, admin login, ClientUserAccess grant/revoke, client-level isolation, admin settings. Client access boundary proven: client portal projects hidden before grant/visible after (smoke:client-access:local), FINAL-only reporting, unrelated-client blocking | Session persistence deferred; full auth endpoints deferred; permission/module enforcement deferred; invite/reset flows, Turnstile on staging, OAuth/OIDC/MFA remain deferred |
| **AI Delivery** | **100% local/operator-ready** | Full local operator sequence: project/month → brief/context handoff → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report/client-safe archive handoff | Live AI provider, live WP publish, live GA/GSC, live R2 IO, Google Docs live export, staging/environment proof, production readiness |
| **Workflow Briefs / context composition** | **100% local/operator-ready** | Intake → submit → approved KB/context → MI/SEO runs → production plan → drafts → AI Delivery handoff; AI SEO lives inside Workflow Briefs | Knowledge picker (6C-v2) and per-brief audit (6D) remain deferred; live provider, staging proof, and production readiness stay deferred |
| **AI Knowledge / Context layer** | **100% local/operator-safe** | Approved-only context path, tenant/client/project isolation, injection sanitization, missing-context warnings, safe snapshot metadata, and WorkflowBriefs context usage are smoke-proven | Vector search, live provider execution, staging proof, production readiness, live WordPress, live GA/GSC, and live R2 remain deferred |
| **AI SEO planning + content drafts** | **100% local/operator-ready** | WorkflowBriefs MI/SEO outputs → production/content plan → content objectives → draft generation/review → PDF/export handoff status → AI Delivery handoff are locally smoke-proven for admin/operator use | Live crawling, GSC/GA sync, live provider execution, Google Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness |
| **Market Intelligence** | **100% local/operator-ready + client-safe** | Admin MI workflow: projects, sources, research runs, insights, handoffs; AI Delivery integration. Client-facing MI summary: read-only delivery-summary endpoint (approved/READY/APPLIED handoffs only, no internal fields) | Live AI, scraping |
| **Monthly Reports** | **100% local/client-safe handoff** | Admin CRUD, PDF, approved metrics snapshots, MI context, and client FINAL-only archive/report handoff are smoke-proven for the approved local scope | Live GA/GSC sync, client metrics automation, staging/environment proof, production readiness |
| **Client Portal read-only/archive** | **100% local/client-safe** | Read-only archive, FINAL monthly reports, pending approvals happy-path, approval/report polish, and boundary smokes are complete for the approved local/client-safe scope | Magic links, public share links, full comments, staging/environment proof, production readiness |
| **Private storage disabled-safe foundation** | **100% local-safe** | R2-disabled mode is expected and safe locally; upload/download-reference helpers are guarded, return `R2_STORAGE_NOT_CONFIGURED` when config is absent, and do not persist storage references without required R2 config | Live R2 real-bucket proof, staging/env proof, and production storage readiness remain deferred |
| **Deliverable handling** | **100% local/operator-client-safe** | Admin/operator deliverables support upload/download-reference/open, ready/revision/accept/archive/restore, reviews, WordPress draft prep, Google Docs export handoff, monthly report document handoff, generated PDF storage, and client FINAL-only visibility with safe `downloadReference`/`exportUrl` shapes | Live R2 real-bucket proof, live Google export/OAuth, live WordPress publish, staging/env proof, and production readiness remain deferred |
| **WordPress draft-prep handoff** | **100% local/operator-ready** | Draft preparation and operator handoff are complete for the approved local/admin workflow | Live publish, client-triggered publish, staging/environment proof, production readiness |
| **WordPress disabled-safe publish gate** | **100% local-safe** | Publish gate metadata and disabled-safe smokes prove local default safety when publish is not enabled | Live publish, client-triggered publish, staging/environment proof, production readiness |
| **Puriva Operating Pack v1** | **100% local/admin-operational pack** — **Puriva Client-Service Launch: BLOCKED** | Local/admin-operational closeout complete (workflow/docs maturity only, not launch readiness); first Client Operating Pack instance per [`CLIENT_OPERATING_PACKS.md`](./architecture/CLIENT_OPERATING_PACKS.md) §14; G79 local ledger aggregation implemented; G80 policy documented | Puriva Launch blocked until staging/production live proof gates and product workflow gates are clean; local live AI text + COMPLETED ledger row proven (G77b); staging/production re-proof still required; GA/GSC, R2, image gen, in-system + email notifications, production deploy remain deferred |
| **Admin cockpit / daily operations** | **100% local/admin-operational** | Ready now / Needs review / Blocked-waiting queues, discoverable first-client path, complete handoffs into WorkflowBriefs, AI Delivery, Monthly Reports preview, Client Portal archive preview, Market Intelligence, and Finance Lite, explicit deferred/gated labeling | Environment proof, deployment, and live execution remain gated |
| **External integrations readiness** | Block 1 closed | Config-shape checks only | Live provider, WP, R2 IO, GA/GSC sync |
| **Admin operations / recovery** | Block 2 closed | Dashboard panel, operations summary API, recovery hints | Durable closeout store (manual run only) |
| **Finance Lite admin foundation** | **100% local/admin-safe foundation** | Admin finance records are smoke-proven for vendors/services/bills/invoices/credit notes/recurring/ledger boundaries where implemented; finance admin browser and ledger smokes passed for local operator use | Real payment collection, Stripe/payment provider proof, bank feeds, tax/legal/accounting production claims, production invoicing readiness |
| **Audit/activity feed foundation** | **100% local/operator-safe foundation** | `AuditLog`/event feed/dashboard recent activity/operator visibility are smoke-proven locally through audit activity and dashboard audit feed browser gates | SIEM/security audit, compliance-grade audit log, production monitoring, durable incident observability stack |
| **Email/outbox disabled-safe foundation** | **100% local-safe foundation** | Read-only tenant-scoped outbox/local notification records are smoke-proven; local provider remains non-sending and reports `SKIPPED` without provider delivery; real-path wiring exists for Puriva taxonomy (2026-07-09); **in-app notification persistence/UI foundation exists** (`InAppNotification` + `NotificationPanel`; staging migration applied with `1b8d00d`) | Live Resend transactional proof **not** STAGING LIVE PROVEN; full notification E2E/launch proof open; background queues, deliverability, production notification readiness remain blocked — see [`notifications-blocker-plan.md`](./operator/notifications-blocker-plan.md) and [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) |
| **UI / UX polish (Dark Nebula / dense admin)** | **100% local/admin-readable baseline** | Compact Dark Nebula admin/client readability and density baseline is closed for current local surfaces; follow-on operator polish blocks UX-P1–P12 queued in [`ADMIN_WORKFLOW_POLISH_AUDIT.md`](./ux/ADMIN_WORKFLOW_POLISH_AUDIT.md) | Full design-system migration, full redesign, staging/environment proof, production readiness |

---

## 4. Current local readiness state

**Safe to run locally (admin-operated, no deploy):**

- `npm.cmd run validate` — prisma generate + check + build all workspaces
- `npm.cmd run smoke:external-integrations-readiness:local` — config shape only
- `npm.cmd run smoke:admin-operations:local` — admin summary + client boundary
- `node scripts/smoke-client-approval-happy-path-local.mjs` — when `AUTH_SEED_TEST_PASSWORD` set
- `npm.cmd run smoke:staging-readiness:local` — Block A focused subset
- `npm.cmd run smoke:production-readiness:local` — broad closeout (long; restarts API)

**Required local env (names only):** `DATABASE_URL`, `AUTH_SEED_TEST_PASSWORD` for authenticated smokes. See [`ENV_READINESS_INVENTORY.md`](./operator/ENV_READINESS_INVENTORY.md).

**Typical local integration statuses (Block 1):**

| Category | Typical status | Meaning |
|----------|----------------|---------|
| AI provider | `configured_shape_ok` (gateway `local`) | Deterministic default |
| WordPress | `disabled` | Publish not enabled |
| R2 | `disabled` | Bucket env absent |
| GA/GSC | `disabled` | Sync not enabled |

---

## 5. What is safe / admin-operated now

- Local login/logout (auth skeleton-only; real auth endpoints return 501 where intended; session persistence BLOCKED), tenant context/switch, module entitlements UI, owner/admin RBAC (proven locally)
- Client-level access isolation (ClientUserAccess grant/revoke, client portal boundaries, FINAL-only reporting) smoke-proven
- AI Delivery deterministic workflow chain (local gateway default)
- AI Knowledge / Context layer (approved-only context path, tenant/client/project isolation, injection sanitization, safe snapshot metadata, WorkflowBriefs context usage)
- Market Intelligence admin MVP (findings, summaries, handoffs, delivery bridge) + client-facing MI read-only summary (approved handoffs only, delivery-summary endpoint)
- Monthly report admin lifecycle + client FINAL-only portal archive
- Client portal read-only archive, monthly reports, approval happy-path (when seeded)
- Admin daily operations cockpit with separated ready/review/blocked lanes
- AI SEO planning + content draft flow inside WorkflowBriefs and AI Delivery: MI/SEO report → production plan → content objectives → drafts → review/polish → package/export handoff
- Content plan PDF export + private storage handoff status (admin; local R2-disabled behavior is safe and does not expose `storageKey`)
- Private storage disabled-safe foundation: local-safe only. R2 requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`; when absent, guarded paths return `R2_STORAGE_NOT_CONFIGURED` instead of persisting references. Signed download-reference behavior is documented as a safe helper surface, not live bucket proof.
- Deliverable handling: local/operator-client-safe. Admin upload/download-reference handoffs and monthly report document/PDF handoffs keep `storageKey` internal; Client Portal receives only FINAL, non-archived client-safe records with `downloadReference` and intentional admin-provided `exportUrl`, never raw storage keys or internal notes.
- WordPress **draft preparation** with publish gate disabled by default
- External integrations **readiness inspection** (no live calls)
- Admin operations summary and recovery hints on dashboard
- Finance Lite admin foundation: local/admin-safe finance records and ledger visibility (vendors/services/bills/invoices/credit notes/recurring/ledger as implemented and smoke-proven); no payment collection, Stripe, bank feeds, tax/legal/accounting production claim, or production invoicing readiness.
- Audit/activity feed foundation: local/operator-safe `AuditLog` events, dashboard recent activity feed, and admin operations visibility are smoke-proven; no SIEM, compliance-grade audit, production monitoring, or durable observability stack.
- Email/outbox disabled-safe foundation: read-only tenant-scoped outbox and local notification log behavior are smoke-proven; local mode does not send real email and does not prove provider/SMTP, queues, deliverability, or production notification readiness.

**Admin rule:** AI prepares; admin reviews and decides what becomes final. Clients see client-safe final material only.

---

## 6. What is not production-proven

- **Auth/session:** Session persistence (BLOCKED/deferred), real auth endpoints (skeleton-only, return 501), permission/module access enforcement (skeleton-only, not wired), invite/reset flows, Turnstile on staging, OAuth/OIDC, MFA, magic links
- **Production promotion of current `main`** to `system.digitalcubeagency.net` (staging deploy G46d/G47 is proven; production deploy is not)
- Live integrations, AI provider execution, storage, analytics, and notifications (see [`INTEGRATIONS_TRUTH_MATRIX.md`](./runbooks/INTEGRATIONS_TRUTH_MATRIX.md))
- Staging/production OpenRouter / AI provider HTTP execution (local controlled live proof is complete; target-environment proof is not)
- Live WordPress publish to any host
- Live R2 real-bucket proof, staging/env proof, and production storage readiness
- GA4 / GSC OAuth and live metrics sync
- Scraping / crawling ingestion
- Background queues / autonomous agents
- Real email provider sending / SMTP provider proof / background queues / deliverability
- Client-facing curated Market Intelligence view
- Revenue Hub, POD AI Toolkit, Finance payment/provider/bank-feed integrations
- Public / share approval links

---

## 7. Staging / production — G53 production safety plan approved; production deploy frozen

| Target | URL | Status |
|--------|-----|--------|
| Production | `system.digitalcubeagency.net` | Live VPS; untouched; API/DB unchanged during Phase C refresh, G46d controlled staging deploy/proof, G47 staging smoke/proof, and G48 production readiness planning. G48 refreshed proof: `production-root-http=200`; `production-health-http=200`. Production deploy ready: **NO**. |
| Staging (G1) | `staging.digitalcubeagency.net` | G46d controlled staging deploy/proof PASS and G47 staging smoke/proof PASS; artifact/API context `/opt/dca/staging-artifacts/5e1ea5a`; host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`; compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml` with `--env-file .env.staging`; correct API service `dcaosv1-staging-api`; G48 refreshed proof: `staging-root-http=200`; `staging-health-http=200`. |
| Runtime separation | — | Shared Caddy `dca-caddy`; staging API `dcaosv1-staging-api` on `127.0.0.1:4011->4000`; staging DB `dcaosv1-staging-postgres` on `127.0.0.1:5435->5432`, healthy; production API `dcaosv1-api` on `127.0.0.1:4010->4000`; production DB `dcaosv1-postgres` on `127.0.0.1:5434->5432`, healthy. |
| Deploy proof | — | **G48 + G53 planning PASS only** — production deploy attempted NO; G49/G50 not executed; VPS/staging/prod mutation NO during planning. Staging PASS, G47 PASS, G48/G53 planning PASS do not authorize production deploy. |
| Next production gate | — | **G49** production dry-run/read-only proof (not executed; owner approval required) |
| G54 HSTS/proxy | — | **PASS** — HSTS present on staging and production |

Phase C refresh included: local pre-artifact validation, artifact creation/upload, controlled VPS artifact swap, staging API recreation, admin bootstrap verification, and MVP smoke pass. Production containers untouched. No `.env` files read or printed. No further staging or production action is authorized without explicit owner approval in writing. G54 HSTS/proxy is **PASS**. Next production path is G49 read-only proof before any G50 deploy decision.

---

## 8. Pre-staging gates & G35 Phase C refresh completion

**Phase C refresh (commit `5e1ea5a`) is now COMPLETE.** The following gates must pass before **requesting** any **future** staging work:

| # | Gate | Current status |
|---|------|--------|
| 1 | Blocks 1–4 + audit remediation complete; CI green | ✓ PASS — SHA `e54445f` or later; CI green on `main` |
| 2 | **Claude full-code audit remediation** | ✓ PASS — Commits `2437c84`–`e54445f` on `main`; 5D-B local closeout PASS |
| 3 | Validate PASS | ✓ PASS — `npm.cmd run validate` PASS before Phase C artifact creation |
| 4 | Required local smokes PASS | ✓ PASS — Block A core smokes PASS (5D-B manual fallback); Block 1–2 smokes PASS |
| 5 | Working tree clean | ✓ PASS — No uncommitted runtime changes |
| 6 | `main` synced | ✓ PASS — `main` = `origin/main` |
| 7 | No live calls | ✓ PASS — No publish, sync, crawl, or live provider during gate |
| 8 | Phase C refresh proof | ✓ PASS — Controlled refresh complete on `5e1ea5a`; local validation before artifact; staging API recreated; MVP smoke PASS; production untouched (see §2.8) |
| 9 | Latest local re-check | ✓ PASS — G43 validate + four focused local smokes PASS on `main` at `a18dcc1`; no repo edits, no commit/push/deploy/staging/VPS/prod (see §2.9) |
| 10 | Owner approval for future work | **Requires new explicit approval** — Phase C refresh and G43 local re-check are complete; any further staging action requires fresh owner instruction |

Full pack: [`docs/runbooks/STAGING_READINESS.md`](./runbooks/STAGING_READINESS.md). One-command local gate: `npm.cmd run smoke:pre-staging:local`.

---

## 9. Deferred / future roadmap

| Item | Status |
|------|--------|
| Staging deploy proof | **Phase C refresh COMPLETE** — G35 Phase C controlled refresh on `5e1ea5a` PASS; staging artifact, API, web, and MVP smoke verified; production untouched (see §2.2, §2.8); G43 local re-check PASS does not change deferred status; further staging refresh/execution requires fresh explicit owner approval |
| Production deploy proof | Deferred — frozen; G48/G53 planning PASS recorded; production deploy ready **NO**; G49/G50 **not executed**; G54 HSTS/proxy fixed; next production path remains G49 dry-run before G50 |
| Puriva Launch | **Blocked** — staging/production live proof gates (R2, GA/GSC, live AI re-proof, image gen, in-system + email notifications) and product workflow gates required; local live AI + COMPLETED ledger row proven (G77b) and G79 local monthly aggregation do not close launch; see deferred-scope register |
| Live AI provider / OpenRouter execution | **COMPLETE (local only)** — formal clean proof G71e + G71e-retry; G77b persistent COMPLETED ledger row; G79 monthly aggregation includes live `COMPLETED` rows locally; `actualCostUsd=null` remains policy-correct until trusted provider cost ingestion exists; staging/production live proof still pending |
| Live WordPress publish | Deferred — draft prep only |
| Live R2 real-bucket proof | Deferred — explicit env approval required; no bucket IO in local closeout; no staging/prod storage readiness claim |
| GA/GSC live sync | Deferred — snapshot-first metrics |
| Scraping / crawling ingestion | Deferred |
| Autonomous agents / background queues | Deferred |
| Client-facing curated MI view | Deferred |
| Revenue Hub | Deferred — [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](./architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) |
| POD AI Toolkit | Deferred — [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](./architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) |
| Payments / Stripe / bank feeds | Deferred |
| Hard deliverable gates | Deferred |
| Richer client collaboration / comments | Deferred |
| Public / share links | Deferred |
| WorkflowBriefs knowledge picker (6C-v2) | Deferred |
| `AiContextSnapshot` per-brief audit (6D) | Deferred |
| `ClientMonthlyBrief` deprecation | Deferred — legacy intake active |

Full register: [`docs/operator/deferred-scope-register.md`](./operator/deferred-scope-register.md).

---

## 10. Route map (client vs admin)

| Route | Surface | Notes |
|-------|---------|-------|
| `#/client-portal` | Client | Canonical archive + monthly reports |
| `#/monthly-reports` | Client | Alias → same as `#/client-portal` |
| `#/archive` | Client | Archive hub |
| `#/client-portal/pending-approvals` | Client | Pending approvals list |
| `#/client-portal/briefs` | Client | Legacy `ClientMonthlyBrief` intake |
| `#/client-portal/deliverables/:id/approve` | Client | `ArticleApprovalEditor` |
| `#/ai-delivery` | Admin | AI Delivery workspace |
| `#/workflow-briefs` | Admin / client | Admin full; client "Production Plan Review" |
| Dashboard → Operational readiness | Admin | Block 2 summary |

Client-only users: `#/client-portal` and granted routes only; admin routes blocked.

---

## Historical foundations (abbreviated)

The following remain true; detail preserved in linked docs and git history.

- Repository/workspace, validation, CI, Dark Nebula UI direction, data-dense admin UI phase 1/2.
- AI Delivery project/brief/workflow/deliverables/reviews/export/handoff foundation.
- AI Gateway v1 + AI Operations Console v1 (local deterministic default).
- Market Intelligence Mega Blocks 1–3; AI Delivery Revenue Engine Layer 1; Delivery Handoff Layer 2.
- Production Readiness closeout pack; Client Approval happy-path hardening.
- Blocks 1–3 (external integrations readiness, admin operations, UI density) on `main`.
- **Block 5A–5D-A (Claude audit remediation):** closed on `main` — admin tenant RBAC, fail-closed boundary smokes, CI unit tests, cross-platform globs, remote staging opt-in, bootstrap guards (`2437c84`–`e54445f`).
- **Block 5D-B (pre-staging local closeout):** PASS with manual orchestrator workaround; G4 still blocked.
- Client Access Admin UI; EN2 audit writer foundation; security headers + rate limiting.
- AI SEO Blocks 3B–3G, 4A–4G, 5A, 6A–6C-v1; Knowledge **local** integration smoke-proven via `smoke:ai-knowledge-context` (not staging/production or live-provider proof).
- G7 Block 2 Puriva operational data path: verified intake now feeds AI Knowledge, WorkflowBriefs,
  SEO planning, and AI Delivery handoff with admin-only/client-safe boundaries preserved.
- Phase F roadmap: [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](./ROADMAP_LOCAL_COMPLETION_PHASE_F.md).
- Completion matrix: [`docs/STATUS_COMPLETION.md`](./STATUS_COMPLETION.md).

## Current constraints

- Work is local-first on Windows PowerShell.
- No commit, push, deploy, VPS, or production action unless explicitly approved after review.
- ChatGPT controls scope; Codex/Copilot executes sealed tasks.
- Client Portal MVP required for Puriva; advanced portal features phased.
- AI Delivery defaults to local deterministic execution.
- Production/VPS frozen unless explicitly approved.

## AI SEO / Content Plan closure

AI SEO admin-operated MVP shell is in place and locally hardened for verified intake, approved KB/context, content-objective flow, compliance checkpoints, and draft-only handoff. Live crawling, Google OAuth / GSC sync, autonomous SEO agents, and production deploy remain deferred. No environment proof has run. See §9 and [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## AI SEO hardening closeout

AI SEO Module Hardening XL is documented in commit `1a132f9` (`docs: harden Puriva AI SEO operating path`) and pushed to `main`. The SEO operator path is hardened for verified intake, approved KB/context, content-objective flow, compliance checkpoints, WordPress draft-only handoff, AI Delivery bridge, and client-safe archive/report boundaries. Review PASS, `git diff --check` PASS, docs-only, and push successful. No backend/API/schema/auth changes, no scripts changed, no UI touched, no environment/VPS/production touched, no live integrations, no production readiness claim, no environment proof claim, and no medical/legal certainty were introduced.

Owner decision remains required for any future environment proof; Sonnet is required for future environment execution. Safe local/product hardening may continue.

## G7 Block 2 closeout

Puriva intake now flows through AI Knowledge, WorkflowBriefs, SEO planning, and AI Delivery handoff with verified-context / admin-only / draft-only boundaries intact. The closeout landed in commit `8cb41e2` (`polish(ops): connect Puriva intake to delivery path`) and passed diff-only review, web check, full validate, browser QA, and push. Production, staging, VPS, backend/API/schema/auth, and live provider / WordPress / GA/GSC / R2 paths were untouched.

## G8 local Puriva E2E closeout

Local Puriva E2E operator dry-run proof is now documented in commit `a380bb2` (`test(ops): add Puriva local E2E dry-run proof`). The local operator path is proven end to end: Puriva intake/compliance → AI Knowledge/context → WorkflowBriefs → SEO plan → content/compliance → image/asset handoff → WordPress prepared draft → client-safe monthly report/archive → client approval happy path. Browser smoke labels were aligned to the real UI (`Pending Reviews`, `Request Changes`, `Approve for publication`). Production, staging, VPS, backend/API/schema/auth, and live provider / WordPress / GA/GSC / R2 paths were untouched.

## G9 Puriva Operating Pack v1 closeout

Puriva Operating Pack v1 closeout is now documented in commit `b2e0287` (`docs: close Puriva operating pack v1`) and pushed to `main`. The local/admin operating pack is complete for the approved scope: intake/compliance source of truth, owner/client approval checklist, AI Knowledge/context handoff, WorkflowBriefs handoff, SEO/content production gate, WordPress prepared draft-only handoff, client-safe approval/archive/report path, local E2E proof, real client data packet checklist, and go/no-go checklist. It is local/admin-operational only and does **not** authorize production, staging, VPS, live provider, live WordPress publish, GA/GSC, or R2 work. Production/staging/VPS were untouched in this closeout.

## G9 environment proof approval gate

The G9 environment proof approval gate is now documented in commit `3fc779f` (`docs: add G9 environment proof approval gate`) and pushed to `main`. The gate is planning-only / approval-only, records the exact owner approval sentence, requires Sonnet for actual execution, and keeps production limited to health-check only in any future proof. No environment execution happened, no environment proof has run, and no production readiness is claimed. Backup/rollback evidence is required before any mutating action; live provider, live WordPress publish, GA/GSC, and R2 live IO remain deferred.

## G10 Client Portal approval/report polish closeout

Client Portal approval/report polish is documented in commit `b8319f9` (`polish(client): clarify approval and report surfaces`) and pushed to `main`. Client-facing approval wording, monthly report wording, final archive/deliverables wording, empty/error/loading states, and docs/smoke assertions were tightened. Review verdict was KEEP; `git diff --check`, web check, full validate, and browser/local QA all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no production readiness claim, and no medical/legal certainty were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G11 Admin cockpit / daily operations polish closeout

Admin cockpit / daily operations polish is documented in commit `831175980a87736faefbdbdbedafdbbdf9d97419` (`polish(ops): clarify daily operations cockpit`) and pushed to `main`. The cockpit now separates Ready now / Needs review / Blocked-waiting and keeps the Puriva path compact; operator docs were aligned to match that flow. Review verdict was KEEP; `git diff --check`, web check, full validate, and admin/AI operations smokes all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G12 local/product final polish closeout

Combined local/product final polish is documented in commit `5f3701f` (`polish(ops): finalize local product handoffs`) and pushed to `main`. AI Delivery review/package wording, monthly report wording around approved snapshots and FINAL visibility, WorkflowBriefs intake → verified facts → approved KB/context → brief → SEO/content plan wording, and the local/product next-options selector were clarified. Review verdict was KEEP; `git diff --check`, web check, full validate, and browser/local QA all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G13 local business modules polish closeout

Bounded local business modules polish and finance smoke-fix work is documented in commit `cbe9311` (`polish(ops): tighten business module surfaces`) and pushed to `main`. UI density polish was applied to existing local/admin business surfaces; Finance Lite labels/actions were clarified; Market Intelligence labels/actions were clarified; Revenue Hub remained preview-label copy only in `App.tsx`; and the finance-ledger smoke was fixed by aligning token extraction and payloads with the existing login/fixture shape. Review verdict was KEEP; `git diff --check`, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run validate`, finance admin browser, finance ledger local, Market Intelligence, and admin operations smokes all passed; `main` finished clean and synced with `origin/main`. No backend/API/schema/auth changes, no environment/VPS/production touch, no live integrations, no new API/persisted fields, no production readiness claim, and no environment proof claim were introduced. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G14 AI Gateway foundation local hardening closeout

A discovery-first review of the AI Gateway v1 foundation (`apps/api/src/core/ai-gateway-v1.service.ts`, `apps/api/src/config/ai-provider.config.ts`, `apps/api/src/services/openrouter-text.service.ts`, and WorkflowBriefs execution wiring) confirmed the existing local contract already meets the target safety bar: explicit safe results for both the disabled gateway path and the not-configured/opt-in-local path, no live provider call by default, no secret values ever returned or logged (verified by direct code inspection — `openrouter-text.service.ts` only returns generic HTTP-status/timeout messages), and no gateway/model/provider audit fields reachable from the client portal (confirmed by a zero-match grep of `client-portal.runtime.ts` for gateway/audit/execution-log fields). No code changes were required or made. Proof for this closeout: `npm.cmd run validate` PASS (including `check:ai-provider-config` 19/19 and `check:external-integrations-readiness` 25/25, both already part of the standard validate chain), and a fresh run of `npm.cmd run smoke:openrouter-guarded:local` (12/12 PASS) confirming the planning-config endpoint hides secrets, reports safe booleans/enums only, and that WorkflowBriefs/AI Delivery execution stays on the local deterministic gateway by default. This closeout documents AI Gateway **foundation** maturity only — it does not claim live OpenRouter provider readiness, staging readiness, or production readiness. Live provider execution, staging proof, real provider-secret/config proof, and cost/rate-limit proof all remain deferred. No backend contract changed, no schema/auth/RBAC change was made, no environment/VPS/production was touched, and no live provider/WordPress/GA-GSC/R2 call was made. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G15 Admin operations shell 100% local/admin-operational closeout

`AdminDailyOperationsCockpit.tsx` (`#/admin-daily-cockpit`) is now complete as the local operator home. Added: a "Start here — first client" panel that discoverably links into the first-client practice path (cross-referencing `docs/operator/first-client-next-actions.md`); a "Handoffs" panel with direct navigation into all six required surfaces — Workflow Briefs / AI SEO plan, AI Delivery workspace, Monthly Reports (client-safe preview), Client Portal archive (client-safe preview), Market Intelligence, and Finance Lite (Invoices) — plus the existing AI Operations console link; and a "Deferred / gated (not active locally)" panel that explicitly labels staging deploy/environment proof, production deploy/readiness, live AI provider execution, live WordPress publish, GA/GSC live sync, and R2 live bucket IO as out of scope. The existing Ready now / Needs review / Blocked-waiting queues and Daily path sequence were preserved unchanged. A new focused browser smoke, `smoke:admin-daily-cockpit:browser` (`scripts/smoke-admin-daily-cockpit-browser-local.mjs`, wired into `package.json`), proves the shell renders, all handoff buttons are present and three representative ones (Workflow Briefs, Market Intelligence, Finance Lite) navigate to the correct destination heading, all deferred/gated labels are present, and no secret-like values appear in the rendered DOM — 28/28 PASS. `git diff --check`, `npm.cmd run -w @dca-os-v1/web check`, `npm.cmd run validate` (after one documented Prisma EPERM recovery), the existing `smoke:admin-operations:local` (16/16 PASS), and the new cockpit browser smoke all passed. This closeout is scoped to **100% local/admin-operational** shell completeness only — it does not claim staging readiness, production readiness, environment proof, or any live provider/WordPress/GA-GSC/R2 capability, all of which remain explicitly deferred and gated behind separate owner approval. No backend/API/schema/auth/RBAC changes were made; the only non-doc/non-UI change was one additive `package.json` script line wiring the new smoke. Owner approval remains required before any future environment work, and Sonnet remains required for any future environment execution.

## G16 Client Portal read-only surfaces + Monthly Reports local/client-safe closeout

Client Portal read-only surfaces and Monthly Reports final handoff are now documented as complete for the approved local scope. The existing browser smokes `smoke:client-portal-monthly-report:browser` and `smoke:client-portal:browser` already prove the boundary: FINAL-only monthly reports are visible, DRAFT / ADMIN_REVIEW / ARCHIVED reports stay hidden, and forbidden fields such as `storageKey`, `adminSummaryNotes`, `tenantId`, `workflowRunId`, `prompt`, `draftBody`, `reviewNotes`, `provider`, `model`, `gateway`, and `cost` stay out of the rendered portal and API response. This closeout records Monthly Reports as **100% local/client-safe handoff** while keeping live GA/GSC, live provider execution, live WordPress, R2 live IO, staging, and production explicitly deferred. No backend/API/schema/auth changes were made, no environment/VPS/production work was touched, and no code changes were required for this docs-only closeout.

## G17 WorkflowBriefs / context composition 100% local/operator-ready closeout

WorkflowBriefs is now documented as the local/operator-ready context-composition surface for the first-client path. The approved local sequence is explicit in UI/docs: create brief → complete verified facts → submit brief → run AI/local deterministic reports → review MI/SEO outputs → generate production plan → send/approve → handoff into AI Delivery. The page is labeled `Workflow Briefs` for admins and `Production Plan Review` for client-facing review, and the existing smokes (`smoke:workflow-brief-publication-handoff:browser`, `smoke:ai-seo-content-plan-pdf`, `smoke:ai-knowledge-context`) already prove the local deterministic path, submit-before-run-ai prerequisite, and AI Delivery handoff boundary. No live provider, WordPress, GA/GSC, R2, staging, production, backend/API/schema/auth, or environment work was touched.

## G19 AI SEO planning + content drafts 100% local/operator-ready closeout

AI SEO planning + content drafts are complete for the approved local/admin operator scope. AI SEO lives in two operator surfaces: WorkflowBriefs for intake/context composition, MI/SEO outputs, production plan generation, content-objective seeding, draft generation, package/release preparation, and draft-only publication handoff; and AI Delivery for the monthly content plan, content drafts, review/polish records, PDF/export handoff status, deliverables, and monthly report/client-safe archive handoff. The local sequence is explicit: MI/SEO report → production/content plan → content objectives → drafts → review/polish → package/export handoff → AI Delivery handoff.

Existing local smoke proof remains valid for this closeout: `smoke:ai-seo-content-plan-pdf` proves admin-only content plan PDF/export behavior, safe local `R2_STORAGE_NOT_CONFIGURED` handling when R2 is disabled, download-reference shape, auth guards, and no `storageKey` exposure; `smoke:workflow-brief-publication-handoff:browser` proves the WorkflowBriefs plan/draft/package/draft-only handoff path without live publish actions; `smoke:ai-delivery-workflow:browser` proves the AI Delivery workflow/content plan shell and local deterministic gateway context; `smoke:ai-delivery-reviews` covers content plan approval, content draft generation/review state, packaging, R2-disabled upload safety, and generated content draft persistence. This is local/operator-ready only and does **not** claim live crawling, live GSC/GA sync, live provider execution, Google Docs live export, live R2 IO, live WordPress, staging/environment proof, production readiness, medical/legal/license certainty, or before-after claims. No environment, VPS, staging, production, backend/API/schema/auth, provider/runtime, or secret changes were made.

## G20 AI Delivery workflow 100% local/operator-ready closeout

AI Delivery is now documented as the complete local/admin operator execution surface for the approved scope. The full local sequence is explicit: monthly project → brief/context handoff from WorkflowBriefs → workflow run visibility → content plan → content drafts → reviews → package → deliverables → WordPress draft-prep handoff → monthly report → client-safe archive handoff. This closeout records the dependencies already completed — WorkflowBriefs/context composition (100% local/operator-ready), AI Knowledge/Context layer (100% local/operator-safe), AI SEO planning + content drafts (100% local/operator-ready), Monthly Reports + Client Portal read-only (100% local/client-safe), and the admin operations shell (100% local/admin-operational) — and confirms the client-safe boundary: no workflow runs, jobs, prompts, draft bodies, review notes, provider/model/gateway/audit/cost metadata, `storageKey`, or non-final reports reach Client Portal.

Existing local smoke proof remains valid for this closeout: `smoke:ai-delivery-workflow:browser`, `smoke:ai-delivery-reviews`, `smoke:workflow-brief-publication-handoff:browser`, `smoke:client-portal-monthly-report:browser`, `smoke:client-portal:browser`, and `smoke:ai-seo-content-plan-pdf`. This is local/operator-ready only and does **not** claim live AI provider execution, live WordPress publish, live GA/GSC sync, live R2 IO, Google Docs live export, staging/environment proof, or production readiness. No backend/API/schema/auth changes, no environment/VPS/production touch, and no live integrations were introduced; this was a discovery-first, docs-only closeout — no code changes were required because the existing operator UI and API contract already satisfied the target sequence and boundaries.

## G23 Private storage / deliverable handling docs-only closeout

Private storage disabled-safe foundation is now recorded as **100% local-safe**. The documented service surface exposes disabled/private-r2 status, a guarded upload helper, and a 300-second signed download-reference helper. R2 configuration requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`; absent config is expected locally and returns guarded `R2_STORAGE_NOT_CONFIGURED` instead of persisting storage references. Supported private storage rules remain limited to scoped storage keys for pdf/png/jpeg/webp up to 5 MB, private PUT, and signed GET reference behavior when explicitly configured.

Deliverable handling is now recorded as **100% local/operator-client-safe**. AI Delivery deliverables support admin upload/download-reference/open, ready/revision/accept/archive/restore, reviews, WordPress draft prep, Google Docs export handoff, and client FINAL visibility. Monthly report handoff supports admin upload, admin download-reference, generated PDF storage, and client FINAL-only download-reference. Client Portal excludes `storageKey`, internal notes, `contentDraftId`, `articleImageId`, and `tenantId`; client download endpoints return `downloadReference` only. `exportUrl` remains intentionally client-visible only as a safe admin-provided external handoff link.

Existing proof coverage remains local-only: `smoke:r2-byte-roundtrip:local` for disabled-safe/local guarded storage behavior, `smoke:ai-delivery-reviews`, `smoke:monthly-report:local`, `smoke:ai-seo-content-plan-pdf`, and existing client-portal/monthly-report smokes where referenced above. Live R2 real-bucket proof remains **deferred** and requires explicit env approval. This closeout does not run bucket IO, does not claim staging/env proof, does not claim production storage readiness, and does not change storage/security/API/backend behavior.

## G26 Finance Lite + audit/activity + email/outbox local foundation closeout

Finance Lite admin foundation is recorded as **100% local/admin-safe foundation** for the current approved local operator scope. Existing focused smoke proof passed: `smoke:finance-admin:browser` confirmed the Invoices and Bills admin shells/API reachability, and `smoke:finance-ledger:local` confirmed local admin creation and ledger summaries for client/project revenue/cost events, finance integrity, and monthly PDF generation with no-storage local handling. This proves admin finance records and ledger visibility for implemented vendors/services/bills/invoices/credit notes/recurring/ledger boundaries only; it does **not** prove real payment collection, Stripe/payment provider behavior, bank feeds, tax/legal/accounting production correctness, or production invoicing readiness.

Audit/activity feed foundation is recorded as **100% local/operator-safe foundation**. Existing focused smoke proof passed: `smoke:audit-activity:browser` confirmed audit logs API reachability and Dashboard Recent Activity rendering, and `smoke:dashboard:audit-feed:browser` confirmed tenant-scoped events render in the dashboard feed with formatted action and actor context. This proves local operator visibility over existing `AuditLog`/event feed/dashboard activity behavior only; it does **not** claim SIEM/security audit completeness, compliance-grade audit logging, production monitoring, or a durable incident observability stack.

Email/outbox disabled-safe foundation is recorded as **100% local-safe foundation**. Existing focused smoke proof passed: `smoke:email-outbox:local` confirmed the read-only tenant-scoped outbox, secret-safe response shape, local non-sending provider status, no exposed Resend key, and `SKIPPED` non-delivery records for local notification events. Optional `smoke:admin-operations:local` also passed for operator visibility and admin/client boundary proof. This proves local disabled/outbox behavior only; it does **not** claim real sending, SMTP/provider proof, background queues, deliverability, or production notification readiness.

## Next options after local/product polish

- Stop and wait for owner decision.
- If approved later, use the Sonnet-only prompt in `docs/runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`.
- If desired, continue deeper local/product UI polish only.

## Mega-block pre-production/Puriva readiness audit (2026-07-09)

**Result:** Docs/audit-only mega-block completed across 8 workstreams (production gates, RBAC/tenant audit, storage/R2, integrations truth matrix, Puriva Launch Gate 15-area evaluation, AI/WordPress/monthly-report proof plans, smoke/test matrix, admin UI polish audit). No code, schema, or runtime changes. No commit/push/deploy/VPS mutation performed during the audit itself.

| Item | Result |
|------|--------|
| Repo clean at session start | **YES** — `git status --porcelain` empty; HEAD at `f6e545b` |
| G49 public read-only probes | **PASS** — all 4 probes 200, HSTS present, DB ready (see `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md` §1.1) |
| G49 full gate closure | **NOT executed** — owner approval sentence still required |
| Production readiness | Unchanged — **NO** |
| RBAC/tenant boundary audit | No BLOCKER found; 1 HIGH (convention-based client-boundary enforcement — see full findings) |
| Storage/R2 | Disabled-safe local proven; live real-bucket proof still required before Puriva Launch |
| Integrations truth matrix | OpenRouter local live proof recorded (G77b); no staging/production live-proven status; all environment live proofs remain owner-gated |
| Puriva Launch verdict | **BLOCKED** — 8 of 15 evaluated areas fully blocked; see `PURIVA_LAUNCH_GATE.md` |
| New docs created | `PRODUCTION_DEPLOYMENT.md`, `PRODUCTION_ROLLBACK.md`, `PRODUCTION_SAFETY_CHECKLIST.md`, `PURIVA_LAUNCH_GATE.md`, `STORAGE_R2_PROOF.md`, `INTEGRATIONS_TRUTH_MATRIX.md` |
| Docs updated | `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`, `STAGING_READINESS.md` (§12 smoke/gate matrix), `STATUS.md` (this section) |
| Existing docs found already current (no change needed) | `AI_PROVIDER_LIVE_PROOF.md`, `WORDPRESS_DRAFT_PROOF.md`, `MONTHLY_REPORT_LIVE_DATA_PROOF.md`, `docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md` |

Production readiness remains **NO**. G49/G50 remain not fully executed. Puriva Launch remains **blocked**. This session did not commit, push, deploy, or mutate any environment.

## G54 HSTS/proxy fix completion (2026-07-09)

**Result:** PASS — HSTS/proxy fix applied on VPS.

**Scope:** Caddy/proxy only. No app deploy, no API/DB/schema/source changes, no migrations, no production app deployment.

**Changed runtime file:** `/opt/dca/caddy/Caddyfile`

**Backup:** `/opt/dca/backups/Caddyfile.G54-HSTS.20260709-073546.bak`

**Reload scope:** `dca-caddy` only.

**Proof:**

- `https://staging.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `https://system.digitalcubeagency.net` returned HTTP/2 200 with `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- staging `/api/v1/health` returned OK with database ready
- production `/api/v1/health` returned OK with database ready

**Warning:** Caddy emitted a formatting warning only. `caddy validate` passed. No formatting-only change was applied during G54 to keep scope minimal.

**Remaining production status:** Production readiness remains **NO**. G54 clears the HSTS/proxy blocker only. G49 dry-run and G50 production deploy are still **not executed** and require separate owner approval.

## G49 formal closure documentation + fresh public read-only probes (2026-07-09, Subagent B)

**Result:** Fresh public read-only probe evidence re-collected. **G49 formal gate closure remains NOT complete** — the owner-approval sentence required by §10 item 1 of the G49 runbook has still not been separately recorded for this exact execution block. **G50 remains NOT authorized/executed. Production readiness remains NO.**

| Item | Result |
|------|--------|
| Probe method | `Invoke-WebRequest` from local Windows PowerShell, read-only, no mutation |
| `https://staging.digitalcubeagency.net` | HTTP 200; HSTS `max-age=31536000; includeSubDomains` |
| `https://staging.digitalcubeagency.net/api/v1/health` | HTTP 200; `database.status: ready` |
| `https://system.digitalcubeagency.net` | HTTP 200; HSTS `max-age=31536000; includeSubDomains` |
| `https://system.digitalcubeagency.net/api/v1/health` | HTTP 200; `database.status: ready` |
| Verdict | **PASS** (§6.2 public probe evidence only) |
| G49 full gate closure (owner approval sentence recorded) | **STILL PENDING** |
| G50 production deploy | **NOT EXECUTED / NOT AUTHORIZED** |
| Production readiness | **NO** |
| Mutations performed | **NONE** — read-only probes only |
| Log | `$env:TEMP\dca-subagent-b-g49.log` |

Full detail recorded in [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) §1.2. This entry does not change production readiness status and does not authorize G50.

## G56 component completion table (2026-07-09)

| Component | Local / pre-live | Staging | Live / production |
|-----------|------------------|---------|-------------------|
| Core app | PASS | Proven (G47) | Frozen |
| Auth/RBAC | PASS | Proven | Frozen |
| Admin shell | PASS | — | Frozen |
| Client Portal | PASS (final-only) | Proven | Blocked (live proof) |
| WorkflowBriefs | PASS | — | Frozen |
| AI Delivery | PASS (review-ready rules) | — | Local live proof complete (G77b); staging/prod blocked |
| AI Orchestrator Lite | PASS (G56 hardened) | Not proven | Disabled-safe |
| Provider Registry | PASS (disabled-safe) | Not proven | Disabled |
| Budget Guard | PASS (stub estimates) | Not proven | Local COMPLETED ledger row proven (G77b); monthly cap aggregation + staging/prod deferred |
| Material Routing Preview | PASS (API + UI) | Not proven | Preview only |
| Compliance Review Agent | PASS (fixtures) | Not proven | Live model deferred |
| Image foundation | PASS (disabled-safe) | Not proven | Live proof deferred |
| Before/after retention | PASS (contract) | Not proven | Cleanup job deferred |
| Monthly Reports | PASS (snapshot-first) | — | GA/GSC live deferred |
| GA/GSC | Disabled-safe | Not proven | Live OAuth deferred |
| Storage/R2 | Disabled-safe | Not proven | Live bucket deferred |
| WordPress | Draft/handoff safe | Not proven | Live proof deferred |
| Email/Notifications | No-send default | Not proven | Live send deferred |
| Finance Lite | PASS (boundary docs) | — | Payments deferred |
| Revenue Hub | Existing baseline | — | Frozen |
| POD Toolkit | Existing baseline | — | Frozen |
| Staging | Proven (G47) | PASS | N/A |
| Production readiness | **NO** | — | Deploy frozen (G50) |
| Puriva Operating Pack | Pre-live table updated | — | Launch blocked |

Detail: [`G56_PRELIVE_READINESS.md`](./runbooks/G56_PRELIVE_READINESS.md).

## G69 merge closeout (2026-07-09)

| Item | State |
|------|--------|
| Gate | G69 — merge G57–G68 to `main` |
| Method | Fast-forward |
| Final `main` commit | `64bfd06` — `prelive: complete post-G56 orchestration readiness` |
| Pre-merge validation | `test:unit` 198/198 PASS; `smoke:ai-provider-config:local` 19/19 PASS; `smoke:ai-orchestrator-lite:local` PASS; `validate` PASS; `git diff --check` PASS |
| Live integrations | **None** — production frozen |
| Next gate | **G71g** — commit/push G71f docs; then G72 model routing policy or G49 formal closure |

## G71f formal clean OpenRouter live proof closeout (2026-07-09)

| Item | State |
|------|--------|
| Gate | G71f — docs-only closeout (proof executed across G71e + G71e-retry) |
| `main` commit (docs base) | `953b0c0` — docs: record G71 partial OpenRouter proof |
| Operator | Piotr Pakula |
| Formal clean proof | **COMPLETE (local only)** — §9.14 three-phase sequence validated |
| Phase 1 (G71e) | **PASS** — baseline guarded smoke 12/12; `textGateway=local`; `liveProviderCalled=false` |
| Phase 2 (G71e-retry) | **PASS** — strict live smoke 12/12; exactly **one** live OpenRouter call |
| Phase 3 restore (G71e-retry) | **PASS** — baseline guarded smoke 12/12; local gateway restored |
| Formal live run ID | `90941e76-260d-4f99-b299-3a5c6b7a8d65` |
| Provider / model | OpenRouter — `anthropic/claude-haiku-4.5` |
| `liveProviderCalled` | `true` (Phase 2); `false` after restore workflow |
| Budget evidence | `AI_TEXT_BUDGET_POLICY_V1`; ~56 input tokens; max 180 output |
| Session cost | Estimated below **$1.00 USD**; `actualCostUsd` not exposed in API |
| Forbidden integrations | **None triggered** |
| Secrets | **Not exposed** |
| Production readiness | **NO** — production remains frozen; staging/production live proof not claimed |
| Next gate | **G71g** commit/push docs; then **G72** model routing policy |

Detail: [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.15 · [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## G71b / G71c live OpenRouter proof closeout (2026-07-09)

| Item | State |
|------|--------|
| Gate | G71b retry — procedural **STOP**; G71c — docs-only closeout |
| `main` commit | `6a1c569` — docs: record G70 live proof checklist |
| Operator | Piotr Pakula |
| Provider / model | OpenRouter text — `anthropic/claude-haiku-4.5` (approved model observed) |
| Live calls | **One** substantive safe live call during baseline guarded smoke (run `0da6b6a1-2116-478f-ba95-fd674b019d1a`); `liveProviderCalled=true`; `isDeterministic=false`; smoke marker `[SMOKE][OPENROUTER_GUARDED]` |
| Formal `SMOKE_EXPECT_OPENROUTER_LIVE=true` pass | **Not run** — stopped after baseline smoke failure (10/12) |
| Second live call | **Not attempted** |
| Budget evidence | `AI_TEXT_BUDGET_POLICY_V1`; ~56 input tokens; max 180 output; estimated session cost below $1.00; `actualCostUsd` not exposed in API |
| Root cause | Baseline guarded smoke expects local deterministic gateway; API process was started with `AI_TEXT_GATEWAY=openrouter` before baseline |
| Local restore | **DONE** — `AI_TEXT_GATEWAY=local`; OpenRouter env cleared; API restarted local deterministic; health PASS; restore log `$env:TEMP\dca-g71b-restore-local-gateway.log` |
| Forbidden integrations | **None triggered** — no image, email, R2, WordPress, GA/GSC, payment, staging/VPS/production, deploy |
| Secrets | **Not exposed** in proof logs |
| Interpretation | **Partial live proof** — not a clean KEEP (procedure failed); not a provider failure |
| Production readiness | **NO** — production remains frozen |
| Next gate | **G71e** (optional owner gate) — one formal clean live proof using corrected sequence §9.14; or proceed to G49 / other live proof gates |

Detail: [`AI_PROVIDER_LIVE_PROOF.md`](./runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.13–§9.14 · [`deferred-scope-register.md`](./operator/deferred-scope-register.md).

## Mega-block blocks 1–9 coordination closeout (2026-07-09)

**Result:** Coordinated multi-agent mega block completed on `main` (uncommitted). **Production readiness: NO.** **G50: NOT EXECUTED.** **Puriva Launch: BLOCKED.**

| Block | Status | Summary |
|-------|--------|---------|
| 1 SEC-H1 | **CLOSED (local)** | `storageKey` stripped from admin list/detail JSON; `hasDocument` boolean added; regression tests added; download-reference endpoints retain `storageKey` internally only |
| 2 G49 formal | **PARTIAL** | Public probes PASS (re-run 2026-07-09); owner approval sentence still required for full gate closure |
| 3 Image foundation | **IMPLEMENTED (disabled-safe)** | Config + readiness category + execution scaffold; no live provider; no schema change |
| 4 R2 proof prep | **DOCS PASS** | Six-area coverage map, env boolean checklist, gap scripts proposed |
| 5 AI provider policy | **DOCS PASS** | `AI_MODEL_POLICY.md` created; owner model/provider decisions pending |
| 6 WordPress proof prep | **DOCS PASS** | Live draft proof plan §6 added; schema gaps documented |
| 7 GA/GSC monthly proof prep | **DOCS PASS** | OAuth/token ceiling + STOP criteria documented |
| 8 Email notifications proof prep | **DOCS PASS** | `EMAIL_NOTIFICATIONS_PROOF.md` created; event wiring gaps documented |
| 9 Puriva approval UX smoke prep | **DOCS PASS** | Canonical smoke path + coverage matrix; image reject/undo gaps flagged |

**Validation:** `npm.cmd run validate` PASS; API integration tests **45/45** PASS. **No commit/push/deploy/runtime mutation.**

**Next security focus:** SEC-M4 workflow-briefs client-role denial matrix; R2 live bucket proof (owner-gated).

## Email + R2 combined block closeout (2026-07-09)

**Result:** Email event wiring improved; R2/image-variant disabled-safe smokes and tests added. **No live Resend send. No live R2 bucket call.** **Puriva Launch: BLOCKED.**

| Area | Status | Summary |
|------|--------|---------|
| Email event wiring | **IMPROVED** | `notifyDcaTeam`/`notifyClientUsers` centralized; real-path notifications wired for article ready, image set ready, admin review requests, monthly report FINAL, WordPress draft prepared; client approve/reject unchanged |
| R2 storage boundary | **IMPROVED** | Unit tests (`r2.config`, `private-storage`); integration tests; `smoke:r2-storage-boundary:local` added |
| Image variants | **COVERED (scaffold)** | hero/supporting_1/supporting_2/social_preview verified in foundation config + integration test |

**Validation:** `npm.cmd run validate` PASS; API integration tests **52/52** PASS; unit tests **163/163** PASS.
