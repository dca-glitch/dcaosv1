# Deferred Scope Register

Status: Plain-language list of what is intentionally not active in the current local/admin MVP, plus **Puriva Launch blockers** that are required before launch but not yet proven.

This register prevents confusion. If something is listed under **Still deferred**, it is not forgotten — it is intentionally waiting for a later approved block. If something is listed under **Puriva Launch blockers**, it is required for Puriva Launch but not yet live-proven.

**Authoritative project control:** [`docs/project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](../project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)

**AI POLICY / PROVIDER ROUTING ALIGNMENT (2026-07-12):** Docs-only architecture KEEP. Canonical layers + terminology in [`AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md). OpenRouter remains preferred text broker/adapter (AI Delivery path STAGING LIVE PROVEN — AI-B only). Direct image/audio adapters are valid under AI Policy; parallel modality routing systems are prohibited. OpenAI Images staging one-image path = **STAGING LIVE PROVEN** (`c07df10`; marker `DCA-IMG-OPENAI-20260712T102457Z-a08x91rb`). BFL successful generation remains NOT PROVEN. Orchestrator Lite remains CONFIG SHAPE PROVEN. Production FROZEN.

**Vite high-severity re-verification (2026-07-13):** `GHSA-fx2h-pf6j-xcff` remains **RESOLVED** at Vite `6.4.3` (exact pin; single lockfile copy). Staging/prod static serve path remains **NOT_AFFECTED** (no Vite server). Staging redeploy **NOT_REQUIRED** for this triage. Remaining `npm audit` findings are **4 moderate** (`uuid`/googleapis tree) — deferred/non-blocking unless separately opened. Production remains frozen.

**AI Delivery bounded staging live proof (2026-07-13):** Connected staging workflow **COMPLETE / PASS** (`c0cc2bd5-…`) with proof-only recipient override `25f846e`. Product API approval of storageKey-only Stage A images was **NOT_PROVEN** on that run (URL-only gate); follow-on fix treats private `storageKey` as a valid preview reference without publicizing R2 or persisting signed URLs. Narrow product `/approve` staging re-proof follows controlled deploy. **GA4/GSC remain deferred and non-blocking. In-system notification E2E remains deferred and non-blocking. Email remains the priority notification path. Production remains frozen.**

**Modal Wave (2026-07-13):** Canonical Modal = `apps/web/src/components/ui/Modal` (design-system adapter + portal). All **23** former `components/Modal` page consumers migrated to `components/ui`. Legacy root `components/Modal.tsx` **deleted**. Import-guard baseline **0**. `aria-describedby` / nested-dialog stack / `alertdialog` remain documented exceptions (no DS edit). Staging web-only deploy + narrow Modal browser proof required for runtime ship. Production remains frozen.

**Canonical component system (2026-07-13):** Authoritative decision + Wave 1 first consolidation slice recorded in [`CANONICAL_COMPONENT_SYSTEM.md`](../project-control/CANONICAL_COMPONENT_SYSTEM.md). Public API = `apps/web/src/components/ui`; private foundation = `apps/web/src/design-system`. Production remains frozen.

**WORKSTREAM 1 closeout (2026-07-12):** Points 1–4 COMPLETE at `main` @ `250e958`. Vite `6.4.3` high finding closed (`95af080`). Canonical public system = `apps/web/src/components/ui`; private foundation = `apps/web/src/design-system`; Wave 0 import guard historically froze 108 violations (`250e958`; later shrunk — see canonical doc); remaining migration / Modal Wave remain open. Rollback verdict = `ROLLBACK READY WITH CONDITIONS` (target `1b8d00d`; schema delta none); **rehearsal not executed**. Orchestrator proof decision = `HYBRID — PREFLIGHT + EMBEDDED LIVE PROOF`; Orchestrator staging AI-A = **CONFIG SHAPE PROVEN** on `a8a74e6` (2026-07-12; not `STAGING LIVE PROVEN`). Staging `1b8d00d` PASS preserved. Production remains frozen. Numbering systems (BLOKI / Fazy UI / Workstreamy / G-gates) must not be mixed. In-app notification **persistence and UI foundation are implemented** (LOCAL FOUNDATION); staging migration `20260711115000_add_in_app_notifications` is **APPLIED** on `1b8d00d`. Live email/Resend send is **STAGING PROVIDER ACCEPTANCE PROVEN** on `a8a74e6` (2026-07-12; not inbox delivery / not `STAGING LIVE PROVEN`). Full notification E2E/launch proof remains open. Google Docs frontend BLOK 9 remains deferred. Production Turnstile/R2 rotation remains open. Older G-gate paragraphs below that still say “notification persistence/inbox does not exist” are **historical context** only.

**G148 update:** G89-G147 moved several local foundations out of "not started" status, but did **not** move any live proof out of deferred. R2 readiness/proof stages, notification taxonomy/no-send adapter, GA/GSC helpers, WordPress draft payload/publish-freeze tests, image compliance policy helpers, Client Portal FINAL guards, Client Operating Pack constants, future-module contracts, AI budget reporting contracts, and operator/security inventories are local foundations only.

**G228 update (G149-G227):** *(historical)* Expanded local/no-IO foundations across storage, notifications, GA/GSC/monthly reports, WordPress, image compliance/approval-loop, Client Portal boundaries, Puriva pack entitlements, future-module contracts, and operator/security docs. At that date still deferred: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/in-system inbox, or trusted `actualCostUsd` ingestion. **Superseded for notification persistence (2026-07-12):** persistence/UI foundation now exists; live email and full E2E launch proof remain deferred. Puriva Launch remains blocked.

**G468 update (G229–G448 + G449–G468):** *(historical)* Deepened local/no-IO foundations and contracts across all 12 lanes. At that date still deferred: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/in-system inbox, or trusted `actualCostUsd` ingestion. **Superseded for notification persistence (2026-07-12)** as above. Puriva Launch remains **BLOCKED**. Production remains frozen.

**G708 update (G469–G707 + G708 integration):** *(historical)* Ultra-block consolidated local/no-IO foundations across 20 lanes. At that date still deferred: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/in-system inbox, or trusted `actualCostUsd` ingestion. **Superseded for notification persistence (2026-07-12)** as above. Puriva Launch remains **BLOCKED**. Production remains frozen.

**PRE-STAGING CLOSURE (2026-07-10):** *(historical for inbox wording)* Local/no-live bug scan + safe fixes + UI/UX truth-label polish + operator/security docs closeout. At that date still deferred: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/inbox, runtime taxonomy consumption for email send, or trusted `actualCostUsd` ingestion. **Superseded for notification persistence (2026-07-12)** as above; live email and full E2E launch proof remain deferred. Puriva Launch remains **BLOCKED**. Production remains frozen. Next stage = owner-approved staging/live proof only. See [`PRE_STAGING_CLOSURE_VERDICT.md`](./PRE_STAGING_CLOSURE_VERDICT.md).

**PRODUCTION PHASE A PG/API ROTATION (2026-07-11):** Production PostgreSQL/API credential rotation Phase A completed with emergency recovery. PostgreSQL password and `DATABASE_URL` are synchronized; production and staging health are HTTP 200. Cloudflare Turnstile and R2 credentials remain exposed/unrotated and are recorded below as **OPEN DEFERRED SECURITY WORK**. The incident is **not** claimed as fully closed. Production remains frozen for unrelated deployment. See [`docs/STATUS.md`](../STATUS.md) §Production PostgreSQL/API credential rotation Phase A closeout.

**WORDPRESS DEDICATED STAGING ONE-DRAFT LIVE PROOF (2026-07-12):** Staging KEEP on artifact `bd649d5` — marker `DCA-WP-DRAFT-20260712T130503Z-8ecfacb2`; dedicated Author account via WordPress user e-mail auth identifier in `PublicationTarget.wordpressUsername` (length 17); valid Application Password encrypted (length 29); exactly one create → `wordpress_draft_created` / status `draft` / post ID `6`; exact-ID trash (`force=false`); retry=0; fallback=false; media=0; attempt TRASHED; dedicated flags restored false; generic publish remains `WORDPRESS_LIVE_HTTP_FROZEN`; historical AMBIGUOUS 401 attempts retained unchanged. General publication NOT PROVEN. Image attachment NOT PROVEN. Production FROZEN. Next WS7: GA/GSC.

**STAGING OPENAI IMAGES ONE-IMAGE LIVE PROOF (2026-07-12):** On staging artifact `c07df10` (`/opt/dca/staging-artifacts/c07df10`), marker `DCA-IMG-OPENAI-20260712T102457Z-a08x91rb` achieved **STAGING LIVE PROVEN** for exactly one OpenAI Images generation via AI Policy → `ImageProviderAdapter` → `OpenAIImageAdapter` (provider=`openai`, broker=`direct`, model=`gpt-image-1`, quality=`low`, size=`1024x1024`, submit=1, output=1, retry=0, fallback=false, BFL=0). PNG 1213472 bytes; sha256 `5892cadc…a82f`; COMPLETED ledger `e46ae5cd-…`; estimatedCostUsd `0.10`; `actualCostUsd=null`; R2 persistence not applicable; live flags restored disabled. Not three-image sets. Not regeneration. Not client/WordPress/publication. Not production. BFL successful generation remains NOT PROVEN. Production FROZEN. Next gate after Image was WordPress adapter (COMPLETE locally). VPS evidence: `/opt/dca/apps/dcaosv1/staging/backups/OPENAI_IMAGE_STAGING_ONE_IMAGE_PROOF_20260712-102457.json`.

**STAGING R2 LIVE PRIVATE-STORAGE PROOF (2026-07-12):** On staging artifact `4cd6d58` (`/opt/dca/staging-artifacts/4cd6d58`), bucket `dcastaging`, marker `DCA-R2-20260712T081648Z-cc7ee7` achieved **STAGING LIVE PROVEN** for exact-key create → HEAD → signed read → DELETE → HEAD absence (107-byte PDF; sha256 `39b787cc…52a7`; `publicUrl=null`). Not production. Not image storage. Not client deliverable storage. Not public delivery. Production FROZEN. Next gate after R2 was Image (COMPLETE). VPS evidence: `/opt/dca/apps/dcaosv1/staging/backups/R2_STAGING_LIVE_PROOF_20260712-081648.txt`.

**STAGING AI-B AI DELIVERY LIVE E2E (2026-07-12):** On staging artifact `a8a74e6`, exactly one bounded OpenRouter call via AI Delivery execute (`DCA-AI-B-20260712T071332Z-5vytpl`) achieved **STAGING LIVE PROVEN** for the AI Delivery OpenRouter path. Workflow ended `REVIEW`; COMPLETED ledger `a37577de-…` (`estimatedCostUsd=0.15`, `actualCostUsd=null`); gateway restored to local/no-live. Not production live. Not Orchestrator plan→execute. Production FROZEN. Next gate after AI-B was R2 (COMPLETE). VPS evidence: `/opt/dca/apps/dcaosv1/staging/backups/AI_B_AI_DELIVERY_LIVE_PROOF_20260712-071332.txt`.

**STAGING AI-A ORCHESTRATOR PREFLIGHT (2026-07-12):** On staging artifact `a8a74e6`, admin-only Orchestrator Lite registry/preview/dry-run proved **CONFIG SHAPE PROVEN** (marker `DCA-WS7-AI-A-20260712-064227`). `executionDeferred=true`; `liveProviderCalled=false`; live calls `0`; cost `$0`. PREVIEW/BLOCKED ledger only. Not `STAGING LIVE PROVEN`. Production FROZEN. Next gate after AI-A was AI-B (COMPLETE). VPS evidence: `/opt/dca/apps/dcaosv1/staging/backups/AI_A_ORCHESTRATOR_PREFLIGHT_20260712-064227.txt`.

**STAGING EMAIL ONE-SEND (2026-07-12):** On staging artifact `a8a74e6`, exactly one owner-controlled adapter-only Resend send (`AI_DELIVERY_APPROVED` via `sendEmailNotification`) achieved **STAGING PROVIDER ACCEPTANCE PROVEN**. Sender domain `notifications.digitalcubeagency.net`. No client email. Live authorization restored to false (`sendingEnabled=false`). Inbox/webhook delivery not claimed. Production remained FROZEN. Next gate after AI-B/R2: Image. VPS evidence: `/opt/dca/apps/dcaosv1/staging/backups/EMAIL_STAGING_PROOF_20260712-062159.txt`.

**STAGING DEPLOY `a8a74e6` (2026-07-12):** Controlled staging deployment of commit `a8a74e6` completed with health PASS and required staging smokes PASS. Later API runtime advanced to artifact `4cd6d58` for R2 cleanup support, then to `c07df10` for OpenAI Images one-image proof (web/Caddy/DB unchanged). Rollback tags retained. Production was not modified / remains FROZEN. Live integrations: email provider acceptance; AI-A CONFIG SHAPE PROVEN; AI-B OpenRouter STAGING LIVE PROVEN; R2 private-object STAGING LIVE PROVEN; OpenAI Images one-image STAGING LIVE PROVEN; remaining WS7 = WordPress → GA/GSC → MI. See [`docs/STATUS.md`](../STATUS.md).

**STAGING DEPLOY `1b8d00d` (2026-07-11):** Controlled staging deployment of commit `1b8d00d` completed with post-deploy smoke PASS. **Superseded as current staging runtime by `a8a74e6`; retained as rollback target.** Migrations `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` applied on staging during that deploy. Production was not modified. See [`docs/STATUS.md`](../STATUS.md) §Staging deploy `1b8d00d` closeout and [`docs/runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md).

## Rule

Deferred means: do not build, enable, deploy, or promise it as active until there is a separate approved task.

Puriva Launch blocker means: required before Puriva Launch on production; must pass a live proof or product gate — not satisfied by local-only or staging config-shape proof alone.

---

## Puriva Launch blockers (required before launch — staging/production proof pending)

**Canonical list and workflows:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md). Per-integration proof status: [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md). Launch gate entry: [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md). Notifications staged plan: [`notifications-blocker-plan.md`](./notifications-blocker-plan.md). Summary below; do not duplicate step-level workflow detail here.

These are **not** "still deferred" long-term roadmap items. They are active blockers for Puriva Launch. Local-only proofs (e.g. G77b live AI + COMPLETED ledger row) **do not** satisfy staging/production launch requirements. WordPress **draft/handoff** is required; WordPress **auto-publish** remains in still-deferred below.

| Blocker | Scope | Notes |
|---------|-------|-------|
| GA/GSC live sync proof | Live integration | Snapshot-first locally; live OAuth/sync proof required — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md). Config-shape / env presence is **not** “Google ready”. |
| R2 real-bucket proof | Live integration | **Staging private-object IO COMPLETE (2026-07-12)** on `4cd6d58` / `dcastaging` (`DCA-R2-20260712T081648Z-cc7ee7`). Local no-IO foundations remain. **Production R2 + image/client-deliverable/public delivery still required for launch.** |
| Live AI provider proof | Live integration | **Local COMPLETE (G77b + G79)**; **staging AI Delivery OpenRouter path COMPLETE (AI-B 2026-07-12)** — marker `DCA-AI-B-20260712T071332Z-5vytpl`; COMPLETED ledger `a37577de-…`; `estimatedCostUsd=0.15`; `actualCostUsd=null`; gateway restored local. **Production live proof still required for launch** — runbook: [`docs/runbooks/AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.20 |
| AI Model Research | Policy gate | Separate approved research gate |
| AI Model Policy | Policy gate | **Docs + skeleton closed (G55/G56)** — local live provider proof complete (G71f); staging/production proof still required — [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md) |
| Image generation proof | Live integration | G115-G119 compliance policy/helper foundation complete; architecture requires `ImageProviderAdapter` under AI Policy ([`AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md)); provider selection/wiring/live proof for Article+Image path still required |
| Transactional notifications proof | Live integration | G94-G99 taxonomy/mapping/policy/no-send/templates foundation complete; **in-app persistence/UI foundation exists** (LOCAL FOUNDATION; staging migration APPLIED on `1b8d00d`); **email/Resend = STAGING PROVIDER ACCEPTANCE PROVEN** on `a8a74e6` (2026-07-12; not inbox delivery); full E2E notification launch proof open — **not** marketing campaigns; staged plan: [`notifications-blocker-plan.md`](./notifications-blocker-plan.md) |
| Client Portal approval UX | Product gate | Client-safe approval path must be production-proven |
| Task-oriented admin UX | Product gate | Operator task flows for daily delivery |
| Article+Image workflow | Product gate | End-to-end article and image handoff |
| Monthly Report flow | Product gate | FINAL-only client report path on target environment — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| Feedback learning | Product gate | Client feedback loop for delivery iteration |

**Puriva Launch status:** **Blocked** until the blockers above are closed with evidence. See [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).

## Open deferred security work (2026-07-11)

This section records credentials that were exposed in operational artifacts and are **not yet rotated**. It is **not** a roadmap item — it is active security debt that must be closed before the incident can be considered fully contained.

| Item | Status | Scope | Owner gate |
|------|--------|-------|------------|
| PostgreSQL production credential | **REMEDIATED** | Production DB role password and `DATABASE_URL` rotated; API recreated and healthy | Phase A complete — `PRODUCTION PHASE A RECOVERED AFTER FAILURE` |
| Cloudflare Turnstile secret | **OPEN — DEFERRED** | Exposed credential remains in production env history; owner explicitly deferred rotation | Phase B — new owner-supplied Turnstile secret required |
| Cloudflare R2 access key pair | **OPEN — DEFERRED** | Exposed credential remains in production env history; owner explicitly deferred rotation | Phase C — new owner-supplied R2 access key pair required |
| Old external credential revocation | **OPEN — DEFERRED** | Revocation of superseded Turnstile/R2 credentials blocked until new credentials are proven | Phase D — literal token `APPROVE_EXTERNAL_CREDENTIAL_REVOCATION` required |

**Incident closure status:** **NOT CLOSED**. PostgreSQL exposure is remediated, but Turnstile and R2 exposures remain open. Do not treat this register entry as a closure statement.

**Prevention rule for future runners:** VPS host `psql` is not available; use `docker exec` into the PostgreSQL container for `psql` and `pg_restore --list`. Do not fail merely because Docker writes routine messages to stderr.

**Roadmap reference:** G147 created [`G147_NEXT_20_GATES.md`](./G147_NEXT_20_GATES.md) for G89-G108 planning. G227 created [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) for G229+ after G228 closeout. G468 created [`G468_NEXT_50_GATES.md`](./G468_NEXT_50_GATES.md) for G469+ after G229–G467 closeout. G708 created [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md) for G709+ after G469–G707 closeout. None of these roadmaps authorize live proof or launch.

**G708 affirmation (historical inbox wording; superseded 2026-07-12 for persistence):** At G708 closeout, in-system user notification inbox remained deferred as a product claim. **Current (2026-07-12):** in-app notification persistence + UI foundation = LOCAL FOUNDATION; staging migration APPLIED; live provider sending remains deferred; full E2E/launch proof open. `EmailLog` / outbox remains outbound attempt log only. Local/no-IO foundations do not satisfy staging/production launch requirements.

**Email clarification:** transactional workflow notifications (approval, handoff, delivery status) are in scope for proof; marketing email campaigns remain still-deferred. Do **not** label email “ready” — no-send/outbox foundation and local `SKIPPED` behavior are not live Resend proof; in-app persistence/UI foundation exists but does **not** equal STAGING LIVE PROVEN email or full launch proof.

**BLOK 9:** Google Docs UI frontend remains **DEFERRED** (owner decision 2026-07-11). BLOKI 10–13 are **ABSORBED INTO SNAPSHOT WORKSTREAMS**, not cancelled.

---

## Post-G69 remaining gates (G70 — owner input before live proofs)

These remain **blocked or complete (local only)** after G57–G68 merged to `main` (`64bfd06`). G70 documents the checklist; G71e + G71e-retry completed formal clean local live proof; G71f docs closeout recorded.

| Gate | Scope | Status | Runbook / note |
|------|-------|--------|----------------|
| G49 formal owner closure sentence | Production safety | **PENDING** | [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](../runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) |
| Live AI provider proof | First controlled OpenRouter/text proof | **COMPLETE (local G71e/G77b + staging AI-B)** | Staging AI Delivery OpenRouter path KEEP 2026-07-12; production live proof still **BLOCKED** — [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.20 |
| Live image generation proof | Article+Image path | **PARTIAL** — OpenAI one-image staging path **STAGING LIVE PROVEN**; three-image/article/client/WordPress/production still **BLOCKED** | [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) |
| GA/GSC OAuth + live sync | Monthly report live data | **BLOCKED** | [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| WordPress live draft proof | Draft/handoff on target env | **PARTIAL** — dedicated staging one-draft create-and-trash **STAGING LIVE PROVEN**; image attach / general publish / production still **BLOCKED** | [`WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) |
| R2 real-bucket IO proof | Private storage | **COMPLETE (staging bounded)** / production still **BLOCKED** | [`STORAGE_R2_PROOF.md`](../runbooks/STORAGE_R2_PROOF.md) |
| Transactional email live proof | Resend/workflow notifications | **BLOCKED** | [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) (if present) or integrations matrix |
| Staging migration application | `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` on staging DB | **APPLIED** — during controlled staging deploy of `1b8d00d`; staging DB backed up before migration; see [`STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) |
| Explicit production deploy approval | G50 | **BLOCKED** | [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md) |

**Production deploy is not authorized** by completing G69, G70 documentation, G71c partial proof closeout, G71f local live proof, or G77b local COMPLETED ledger proof.

---

## Future scope buckets (G78 — actionable, owner-gated)

Grouped for planning clarity. Items remain deferred until a separate approved block with proof requirement.

| Bucket | Scope | Owner gate / proof | Status |
|--------|-------|-------------------|--------|
| **Live AI cost / accounting** | Monthly cap aggregation for `liveProviderCalled=true` COMPLETED rows; `actualCostUsd` trusted provider-cost ingestion; provider cost dashboards | **G79** implemented + local unit proof; **G80** policy documented only | G79 DONE locally; trusted `actualCostUsd` ingestion and dashboards deferred |
| **Staging / production live proof** | Re-run bounded live OpenRouter, R2, GA/GSC, WordPress draft, email on target env | **G81** staging live proof planning (not execution); separate execution gates per integration | BLOCKED |
| **Notifications** | In-app persistence/UI foundation → email MVP → client approval events → admin alerts → audit alignment | **G82-G84** planning/event-map outcomes; **N1-N3** per [`notifications-blocker-plan.md`](./notifications-blocker-plan.md); **current:** persistence/UI LOCAL FOUNDATION; staging migration APPLIED; live email **BLOCKED** (not STAGING LIVE PROVEN); full E2E launch proof open | Live email BLOCKED; full launch proof open — see [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](../project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md) |
| **GA / GSC live metrics** | OAuth/token storage, live sync, non-placeholder monthly report metrics | **G85** planning in [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) | BLOCKED — MANUAL snapshots are separate from live GA/GSC |
| **WordPress live draft proof** | Live draft proof session; publish remains frozen | **G86** three-tier plan in [`WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) | Draft prep local-proven; live proof BLOCKED; publish frozen |
| **Image generation provider proof** | Provider research, disabled-safe wiring, medical-aesthetic proof checklist, live proof | **G87** planning + OpenAI one-image staging KEEP in [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) | PARTIAL — broader surfaces BLOCKED |
| **Market Intelligence** | Live AI, scraping, client-facing curated MI view | Module MVP local-proven; live ingestion deferred | Deferred |
| **Revenue Hub** | RH0 operating model module | [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](../architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md) | Deferred |
| **POD AI Toolkit** | POD0 operating model module | [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](../architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md) | Deferred |
| **SaaS conversion / multi-tenant productization** | Second-client modularity, onboarding, pack registry DB | G52-B productization track | Deferred |

**Post-G88 recommended gate sequence (docs reference):**

| Gate | Scope |
|------|-------|
| **G79** | Monthly cap aggregation for live `COMPLETED` rows — **implemented locally** |
| **G80** | `actualCostUsd` trusted-provider-cost policy — **documented only**; ingestion remains deferred |
| **G81** | Staging live proof planning only (not execution) — owner-approved checklist per integration |
| **G82-G84** | Notifications foundation/no-send/email/approval event-map planning — no live send; *(historical)* “no in-system inbox yet” at G88 date — **superseded 2026-07-12** for persistence/UI foundation |
| **G85-G87** | GA/GSC, WordPress live draft, and image generation proof planning — no live calls |
| **G88** | Shared-doc consolidation with correct G79-G88 gate map; Puriva Launch remains blocked |
| **G149 recommended after G148** | Owner-selected launch-blocker execution gate; recommended first candidate: R2 target-environment real-bucket proof or another explicitly approved low-blast-radius proof |
| **G228 closeout** | Main-agent integration of G149–G227; local foundations only; does not authorize live proof |
| **G229+** | See [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) — historical plan; superseded as next-gate pointer by G468 |
| **G468 closeout** | Main-agent integration of G229–G467 local foundations + deferred/roadmap docs; does not authorize live proof or launch |
| **G469–G707** | Ultra-block local/no-IO foundations across 20 lanes — see lane closeouts; does not authorize live proof |
| **G708 closeout** | Main-agent integration of G469–G707 + deferred/truth/STATUS/roadmap; does not authorize live proof or launch |
| **G709+** | See [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md) — owner-gated; R2 target-bucket proof remains recommended first candidate |

## G89-G148 deferred-scope reconciliation (2026-07-10)

| Area | Moved out of "not started" | Still deferred / blocked |
|------|-----------------------------|--------------------------|
| R2/private storage | No-IO readiness, proof-stage helpers, storage-key guard docs/tests | Real bucket IO, signed URL proof against target bucket, staging/prod proof |
| Notifications/email | Taxonomy, event mapping, policy, no-send adapter, local templates | *(historical row)* In-system inbox/persistence, live email send, client notification proof — **persistence/UI since implemented (2026-07-12)**; live email + full E2E launch proof still deferred |
| GA/GSC/monthly reports | Config helpers, manual/snapshot report helpers, FINAL-only visibility | OAuth consent, token storage/refresh, live GA/GSC sync, target-env report proof |
| WordPress | Draft payload, credential-shape checks, publish freeze before fetch | Live draft proof session, approved-image attach proof, auto-publish |
| Image generation | Compliance policy/helper foundation | Provider selection, live generation, R2 image-byte proof |
| Client Portal | Leak hardening and FINAL guards | Staging/prod browser proof and broader collaboration workflows |
| Client/future modules | Client Operating Pack constants and MI/RH/POD typed contracts | Live ingestion, marketplace/CRM/write connectors, client-facing future modules |
| AI budget reporting | Reporting/reconciliation contract only | Finance Lite mutation, invoice ingestion, trusted provider-cost ingestion |
| Operator/security docs | Checklists, inventories, next-gate roadmap | External audit, production proof, deploy approval |

G148 recommendation: keep local foundations, keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate.

## G149-G228 deferred-scope reconciliation (2026-07-10)

| Area | Local/docs complete (G149-G227) | Still deferred / blocked |
|------|----------------------------------|--------------------------|
| R2/private storage | Proof-stage hardening, redacted config, proof intent, client-safe URL policy, serializer leak tests, cleanup plan constants | Real bucket IO, signed URL against target bucket, staging/prod proof |
| Notifications/email | Taxonomy V2, recipient/channel/severity/redaction, typed templates, no-send edges, persistence/inbox **design** | *(historical)* In-system inbox/persistence (migration), live email send, client notification proof — **persistence/migration since implemented & APPLIED on staging (2026-07-12)**; live email still deferred |
| GA/GSC/monthly reports | Credential presence, period/source-truth/metric/recommendation/output guards, CSV import proof plan | OAuth consent, token storage/refresh, live GA/GSC sync, target-env report proof |
| WordPress | Draft payload, slug, status freeze, credential redaction, image-inclusion contract, proof-plan constants | Live draft proof session, auto-publish |
| Image generation | Compliance V2, prompt/alt/reject/approval-loop, WP inclusion readiness, provider proof plan | Provider selection, live generation, R2 image-byte proof |
| Client Portal | Serializer/archive/monthly guards, approval policy helper, error-safety, route inventory | Staging/prod browser proof; durable revision-round schema field |
| Client/future modules | Pack entitlement matrix, compliance validator, MI/RH/POD contract hardening | Live ingestion, marketplace/CRM/write connectors |
| Operator/security docs | G223 checklist, smoke inventory, validation guards, G227 next-30 roadmap | External audit, production proof, deploy approval |

G228 recommendation: keep local foundations, keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate (G229+).

## G229-G448 deferred-scope reconciliation (2026-07-10)

| Area | Local/docs complete (G229–G448) | Still live-deferred / blocked |
|------|----------------------------------|-------------------------------|
| R2/private storage | No-IO hardening, diagnostics, redaction, URL policy, serializer boundary tests | Real bucket IO, target-env signed URL, staging/prod proof |
| Notifications/email | Taxonomy aliases, payload snapshots, correlation/idempotency design, no-send/config tests | *(historical)* In-system inbox/persistence (migration), live email send — **persistence/migration since implemented & APPLIED on staging (2026-07-12)**; live email still deferred |
| GA/GSC/monthly reports | Config/period/source-truth/guards, unavailable/export truth helpers | OAuth/token storage/refresh, live GA/GSC sync |
| WordPress | Draft helpers, sanitization/redaction, taxonomy placeholders, author mapping design | Live draft HTTP session; auto-publish still deferred |
| Image generation | Compliance V3, prompt/alt/approval-loop, no-live provider invariant | Provider selection, live generation, R2 image-byte proof |
| Client Portal | Serializer/error/approval no-leak tests; route inventory | Staging/prod browser proof; durable revision-round schema |
| Client/future modules | Pack catalog + MI/RH/POD contract hardening | Live ingestion, marketplace/CRM/write connectors |
| AI budget / cost | Reporting/reconciliation, trusted-actual design, routing truth labels | Trusted `actualCostUsd` ingestion; staging/prod AI re-proof |
| Operator/security/UI | Inventories, freeze/staging sweeps, proof catalogues, UI testability | External audit, production proof, deploy approval (G49/G50) |

**Classification:** Local PASS does not promote staging/production PASS. Puriva Launch remains **BLOCKED**.

G468 recommendation: keep local foundations; keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate (G469+). See [`G468_NEXT_50_GATES.md`](./G468_NEXT_50_GATES.md).

## G469-G708 deferred-scope reconciliation (2026-07-10)

| Area | Local/docs complete (G469–G707) | Still live-deferred / blocked |
|------|----------------------------------|-------------------------------|
| R2/private storage | Target-env plan freeze, proof contracts, no-IO invariants, diagnostics/redaction, field/URL policy, exportUrl vs storageKey matrix, download boundary design | Real bucket IO, target-env signed URL, staging/prod proof |
| Notifications/email | Taxonomy families + correlation/redaction/audit metadata; no-send adapter + template catalogue + recipient/variable redaction | *(historical)* In-system inbox/persistence (migration), live email send — **persistence/migration since implemented & APPLIED on staging (2026-07-12)**; live email still deferred |
| GA/GSC/monthly reports | OAuth token storage **design**, property/site mapping, period/source-truth, monthly FINAL/admin redaction/unavailable/approval wording | OAuth/token storage **implementation**, live GA/GSC sync |
| WordPress | Draft payload/slug/freeze/sanitization/redaction/taxonomy/author/image-inclusion hardening | Live draft HTTP session; auto-publish still deferred |
| Image generation | Compliance/alt/prompt/approval-loop/notification/WP-inclusion/provider-proof-plan expansion | Provider selection, live generation, R2 image-byte proof |
| Client Portal / approval | Serializer no-leak, error safety, route inventory, approval/revision/notification-map helpers | Staging/prod browser proof; durable revision-round schema |
| Client/future modules | Pack entitlement/visibility/compliance/scope invariants; MI/RH/POD contract hardening | Live ingestion, marketplace/CRM/write connectors |
| AI budget / orchestrator | Reporting/reconciliation, finance-lite separation, routing truth, local orchestrator guards | Trusted `actualCostUsd` ingestion; staging/prod AI re-proof |
| Operator/security/UI | Inventories, freeze/staging sweeps, proof catalogues, UI testability, stale-claim sweep | External audit, production proof, deploy approval (G49/G50) |

**Classification:** Local PASS does not promote staging/production PASS. Puriva Launch remains **BLOCKED**.

G708 recommendation: keep local foundations; keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate (G709+). See [`G708_NEXT_GATES.md`](./G708_NEXT_GATES.md).

## G71b / G71c / G71e / G71f live OpenRouter proof (2026-07-09)

| Item | Status |
|------|--------|
| G71b retry | **Procedural STOP** — baseline guarded smoke failed; one unplanned safe live call captured |
| G71c closeout | **Docs only** — partial proof recorded; local gateway restored |
| G71e Phase 1 | **PASS** — baseline 12/12 local deterministic |
| G71e-retry Phase 2 | **PASS** — strict live smoke 12/12; one live call (`90941e76-260d-4f99-b299-3a5c6b7a8d65`) |
| G71e-retry restore | **PASS** — baseline 12/12; `liveProviderCalled=false` after restore |
| G71f closeout | **Docs only** — formal clean local proof recorded |
| Formal clean proof | **COMPLETE (local only)** |
| Staging/production live proof | **BLOCKED** — not claimed |
| Production readiness | **NO** |

---

## Still deferred (intentionally not active)

These remain out of scope for current MVP and Puriva Launch v1 unless a separate approved block explicitly activates them.

| Item | Notes |
|------|-------|
| Autonomous agents | Admin-triggered AI only |
| WordPress auto-publish | Draft prep/handoff required for Puriva — runbook: [`docs/runbooks/WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md); auto-publish deferred |
| Marketing emails | Transactional workflow email is separate proof gate |
| Puriva paid ads AI content | Website and social media only for MVP; `paid_ads` channel blocked in backend model routing (G72) — manual/future gate |
| SMS / WhatsApp | No messaging channel proof |
| Full SaaS onboarding | Single-client/agency ops for Production v1 |
| Second-client proof | First-client (Puriva) path first |
| Big refactors | Cosmetic splits only where already scoped |
| Advanced learning dashboard | Feedback learning is blocker; full dashboard deferred |
| Multi-provider image optimization | Single proof path first |
| A/B testing | Not in MVP scope |
| Full DB-backed custom roles UI | RBAC not blocker for limited Production v1; custom roles UI deferred |

---

## Client Portal And Client Actions

**Client Portal MVP (required — Puriva):** client-safe delivery visibility for MI summary, SEO status, Google Docs deliverables, website publishing handoff/status, final deliverables, and monthly reports. See `docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`.

Phased after the current local/client-safe visibility and approval polish scope (still deferred):

- full client comment threads inside the portal;
- public/share approval links;
- magic links;
- broader interactive approval workflows beyond the current local happy-path/polish scope;
- project-specific client access;
- client-side workflow status tracking;
- client access to internal drafts;
- client access to raw research or AI prompts.

Current behavior:

- the Client Portal shows client-safe final material only;
- admin remains responsible for internal review; human/client review before publication is required for Puriva;
- no raw prompts, workflow runs, MI internals, AI costs, credentials, or technical logs;
- legacy client-review API routes (`/content-plan/client-review`, `/content-drafts/client-review`) remain registered but return `CLIENT_REVIEW_DEFERRED` (HTTP 403) and do not expose plan/draft internals;
- `#/content-plan-review` and `#/content-draft-review` frontend routes show a deferred message if accessed manually; they are hidden from sidebar navigation.

## Production And Deployment

**Ground-truth notice (updated 2026-07-11 post-`1b8d00d` deploy):** Controlled staging deploy of `1b8d00d` is PASS with post-deploy smoke PASS. Migrations `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` applied on staging. Prior G46d/G47/G47b/G47c PASS on `5e1ea5a`, G48 production readiness planning PASS, **G53 production safety plan approved (planning only)**, and **G54 HSTS/proxy PASS** remain in historical context. Production deploy ready: **NO**. G49 dry-run and G50 deploy: **not executed**. Next production path remains G49 dry-run before G50, only after owner approval. Puriva Launch: **blocked** pending live proof gates. Current staging artifact/API context is `/opt/dca/staging-artifacts/1b8d00d`, host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`, staging compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml`, `--env-file .env.staging`, and service `dcaosv1-staging-api`. Production deploy attempted: NO. Production remains frozen. Any further staging/VPS/production execution requires fresh explicit owner approval.

**G43 note:** the later local pre-staging re-check PASS on current `main` at `a18dcc1` does not move any deferred staging, VPS, production, deploy, migration, Docker, Caddy, live provider, or live storage item out of deferred status.

Deferred:

- VPS production deployment;
- production database activation;
- production R2 switch;
- production email sending;
- live production Client Portal rollout on `system.digitalcubeagency.net` (MVP build in progress locally);
- public production rollout;
- Caddy/container/VPS changes without approval;
- **Controlled staging deploy of `1b8d00d` (2026-07-11):** PASS. Artifact context `/opt/dca/staging-artifacts/1b8d00d`; migrations `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` applied; public frontend HTTP 200; public and loopback API health PASS; production untouched. Prior G35 Phase C refresh on `5e1ea5a` and G46d/G47 PASS are historical; further staging/VPS work deferred pending fresh owner approval;
- **future staging refresh / updates:** deferred pending fresh explicit owner approval with bounded execution block.

Current behavior:

- work remains local-first;
- PR #13 is merged to `main`, but current `main` is 0% deployed to production;
- **production URL:** `system.digitalcubeagency.net`;
- **staging URL (G1 approved):** `staging.digitalcubeagency.net` — same VPS, separate staging stack; controlled staging deploy of `1b8d00d` COMPLETE (see STATUS §Staging deploy `1b8d00d` closeout); current artifact/API context `/opt/dca/staging-artifacts/1b8d00d`; host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`; compose requires `--env-file .env.staging`; correct API service `dcaosv1-staging-api`; API health 200; public frontend 200; post-deploy smoke PASS; G54 HSTS/proxy PASS; production untouched;
- production is frozen unless explicitly approved; G48/G53 planning PASS do not authorize production deploy; G54 HSTS/proxy is PASS; G49/G50 not executed; next production path remains G49 dry-run before G50.

## Live Analytics And External Accounts

Deferred:

- Google OAuth;
- live Google Search Console sync;
- live Google Analytics sync;
- automatic client-facing metrics exposure;
- CSV upload flow for metrics;
- automatic trend interpretation from live data.

Current behavior:

- monthly metrics use an admin-controlled snapshot-first foundation;
- report metrics should be reviewed before client-facing use.

## AI Provider And Automation

**G73 (routing attribution dry-run proof):** `modelRouting` and `plannedLedgerMetadata` propagate through orchestrator preview/dry-run without live AI calls. Preview endpoint persists routing metadata to ledger; workflow dry-run exposes planned metadata only.

**G74 (completed ledger attribution readiness, no-live):** `prepareCompletedLedgerAttribution`, `buildCompletedLedgerMetadata`, and `recordCompletedAiLedgerEntry` implement COMPLETED/BLOCKED/SKIPPED attribution with mocked provider results in unit tests. Persistent completed rows can be recorded when execution path is wired.

**G75 (live spend attribution proof — PARTIAL, local only):** Phase 1 baseline PASS; v2 Phase 2 live OpenRouter smoke PASS (`6e538323-8e68-4d41-a4c5-9e30ca0cf8a1`); Phase 3 restore PASS; G75c completed attribution verifier PASS using G74 helper against live observability. At G75 time persistent COMPLETED row was not auto-written — generated-only at verify time. **G76** closed the wiring gap (mocked/no-live); **G77b** closed the live DB row proof (local only).

**G76 (persistent completed ledger wiring — mocked/no-live):** AI Delivery workflow execute success path wired to `recordCompletedAiLedgerEntry()` via `ai-delivery-workflow-ledger-attribution.service.ts`. OpenRouter success only; local deterministic skipped; stable `stepReference=ai-delivery-execute:{outputType}`; upsert idempotency; ledger failure non-blocking. Unit tests 252/252 PASS. Live persistent COMPLETED row since proven in **G77b** (local only). Staging/production remain **BLOCKED**.

**G77b (persistent COMPLETED ledger live proof — COMPLETE, local only):** No-live API env preflight PASS 18/18; baseline/live/restore guarded smokes PASS; live `workflowRunId=2244413e-d87b-45a1-8a26-6634ec8972d5`; ledger row `5d8d635c-ced0-4a14-9b33-839e1fdee508` (`status=COMPLETED`, `stepReference=ai-delivery-execute:summary`, `provider=openrouter`, `liveProviderCalled=true`, `completedAttribution` present, `estimatedCostUsd=0.15`, `actualCostUsd=null`). Proves local controlled live OpenRouter execute persists COMPLETED ledger row. Does **not** prove staging/production live or provider invoice cost. Production remains frozen.

Deferred:

- live provider staging proof per role (first proof: controlled session per `AI_PROVIDER_LIVE_PROOF.md` §9);
- image generation live proof;
- vision QA live proof;
- trusted `actualCostUsd` population when a provider exposes exact cost;
- `operatingPackKey` resolution beyond conservative `puriva` default in AI Delivery bridge;
- local deterministic SKIPPED/BLOCKED ledger persistence (separate future gate);
- admin editable provider settings UI (read-only panel on main);
- autonomous AI agents;
- background high-cost AI runs;
- production live provider proof;
- persistent provider cost dashboards;
- deep provider observability;
- automatic AI execution without admin control;

Current behavior:

- AI execution is admin-triggered;
- local deterministic behavior remains the safe default;
- live provider use requires explicit configuration and approval.

## Crawling And Research Automation

Deferred:

- broad autonomous crawling;
- continuous background scraping;
- client-visible raw source archives;
- unbounded competitor discovery;
- automatic use of unreviewed sources.

Current behavior:

- research should stay bounded and admin-reviewed;
- summaries can inform briefs and plans after admin review.

## Publishing

Deferred:

- automatic publishing to WordPress;
- client-triggered publishing;
- publishing without admin review;
- automatic social publishing;
- automatic post-publication optimization.

Current behavior:

- WordPress draft preparation can support admin handoff;
- admin remains responsible for final release/publishing decision.

## Email And Notifications

**G78 notifications blocker plan:** [`notifications-blocker-plan.md`](./notifications-blocker-plan.md) — canonical staged sequence. Phone/manual-only communication is explicitly insufficient for launch claims.

**Current (2026-07-12):**

| Layer | Status |
|-------|--------|
| In-app notification persistence (`InAppNotification`) | LOCAL FOUNDATION / IMPLEMENTED |
| Staging migration `20260711115000_add_in_app_notifications` | APPLIED (`1b8d00d`) |
| In-app notification UI foundation (`NotificationPanel`) | LOCAL FOUNDATION |
| Live email / Resend send proof | NOT STAGING LIVE PROVEN — deferred/blocked |
| Full E2E notification launch proof | OPEN |

Deferred:

- real provider sending by default;
- automatic client notifications as launch-proven E2E;
- background notification queues;
- invite emails;
- password reset emails;
- client reminder automation.

Current behavior:

- email foundation exists as controlled groundwork;
- in-app persistence/UI foundation exists locally and migration is on staging;
- sending must be separately approved and tested;
- do not claim notification capability is fully launch-proven.

## Finance Integrations

Deferred:

- payment collection;
- Stripe live payment flows;
- bank feeds;
- accounting exports;
- tax filing automation;
- legacy finance migration.

Current behavior:

- finance records are admin-managed;
- calculations and document handling must remain stable and reviewed.

## Future Modules

Deferred until separate module blocks:

- POD AI Toolkit / POD management — see [`POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md`](../architecture/POD_AI_TOOLKIT_POD0_OPERATING_MODEL.md);
- Revenue Hub AI — see [`REVENUE_HUB_AI_RH0_OPERATING_MODEL.md`](../architecture/REVENUE_HUB_AI_RH0_OPERATING_MODEL.md);
- Finance Lite completion (payment collection, Stripe, bank feeds);
- hard deliverable gates;
- richer client collaboration / comments;
- public / share approval links;
- client-facing curated Market Intelligence view;
- full AI Market Intelligence expansion beyond current admin MVP;
- advanced scraping/data collection module;
- commerce connector workflows;
- marketplace-style module system.

## Security And Access Improvements

Deferred:

- password reset;
- invite flow;
- role editing UI;
- project-specific client grants;
- destructive tenant/user actions;
- expanded audit dashboard;
- external audit completion.

Current behavior:

- owner/admin controlled access remains the safe path;
- client access is client-level only.

## Pre-Staging Non-Blockers (Block A / Block 4)

These items are deferred but **must not block** local staging readiness planning or G4 request prep. Full pack: [`docs/runbooks/STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md). Source of truth: [`docs/STATUS.md`](../STATUS.md).

| Item | Status | Notes |
|------|--------|-------|
| Claude full-code audit | Required pre-staging gate | Separate approved block; not a substitute for validate/smoke |
| Staging deploy and smoke proof | **`1b8d00d` deploy PASS** | Controlled staging deploy of `1b8d00d` completed 2026-07-11 with post-deploy smoke PASS; artifact context `/opt/dca/staging-artifacts/1b8d00d`; migrations `20260709120000_add_ai_budget_ledger` and `20260711115000_add_in_app_notifications` applied; public frontend HTTP 200; public and loopback API health PASS; production untouched; prior G46d/G47 PASS on `5e1ea5a` is historical; further staging work deferred pending fresh owner approval |
| HSTS proxy hardening | **Fixed in G54 — PASS** | G47c reported HSTS missing as warning only; fixed in G54 with backup and public proof |
| Production deploy proof | Deferred | Frozen; G48/G53 planning PASS; production deploy ready NO; G49/G50 not executed |
| Strict R2 real bucket proof | Deferred | Optional local env + smoke flag |
| GA / GSC live sync | Deferred | Snapshot-first metrics; manual/Puriva placeholder proven |
| Live provider proof | **COMPLETE (local only)** | Formal clean G71e + G71e-retry; G75 live spend attribution PARTIAL; G76 COMPLETED ledger wiring mocked/no-live PASS; **G77b persistent COMPLETED live ledger row PASS (local only)**; **G79 monthly aggregation includes live COMPLETED rows locally**; staging/production still pending |
| WorkflowBriefs knowledge picker/override (6C-v2) | Deferred | 6C-v1 admin read-only visibility shipped |
| `AiContextSnapshot` per-brief audit (6D) | Deferred | No `briefId` FK; safety via `smoke:ai-knowledge-context` |
| `ClientMonthlyBrief` deprecation | Deferred | Legacy intake at `#/client-portal/briefs`; separate removal block |
| Large AiDelivery modal refactor | Deferred | WP confirm modal extracted; further splits cosmetic |
| Production deploy | Deferred | G4 staging is separate gate; prod frozen |
| Admin workflow UX polish blocks UX-P1–P12 | Queued (not active) | Read-only audit 2026-07-09: small frontend-only operator polish — see [`docs/ux/ADMIN_WORKFLOW_POLISH_AUDIT.md`](../ux/ADMIN_WORKFLOW_POLISH_AUDIT.md). Activate one block at a time via DCA MODE gate. No broad UI implementation. |
| Finance attribution admin visibility | Deferred | Backend DRAFT scaffold only; UI panel needs separate approved block |

---

## How To Move Something Out Of Deferred

To activate a deferred item:

1. define the exact scope;
2. confirm why it is needed now;
3. identify risk to client data, cost, finance, or production;
4. build a small approved block;
5. validate locally;
6. smoke the relevant path;
7. document the new behavior;
8. commit and push only after approval;
9. deploy only after a separate production approval.

## Current Recommendation

Keep the MVP admin-controlled and local-first until the first client delivery path is stable, documented, and reviewed end to end.

## G57–G68 macro gate outcomes (2026-07-09)

**Result:** Local implementation PASS on branch `cursor/g57-g68-prelive-completion` — pre-live groundwork only.

| Gate | Outcome |
|------|---------|
| G57 docs closeout | DONE — `G57_G68_PRELIVE_READINESS.md`, STATUS, this register |
| G58 persistent AI budget ledger | DONE locally — `AiBudgetLedgerEntry`; preview records routing metadata; G74 helpers; G76 execute-path COMPLETED wiring; **G77b live COMPLETED row proven (local only)**; **G79 monthly cap aggregation for live COMPLETED rows implemented locally** |
| G59 workflow adapter dry-run | DONE — contract placeholders; no live execution |
| G60 admin operator wiring | DONE — kill switch, ledger, events, boundaries in admin panel |
| G61 notification contracts | DONE — extended types; no-send internal recorder; live email deferred |
| G62 Puriva pack wiring | PARTIAL — step→task map; full orchestrator template automation deferred |
| G63–G65 integration boundaries | PARTIAL — config-shape + docs; live proof BLOCKED |
| G66 E2E dry run | PARTIAL — orchestrator smoke extended; unified cross-module E2E deferred |
| G67 live AI proof prep | **COMPLETE (local only)** — formal clean proof G71e + G71e-retry; staging/production live proof still pending |
| G68 go/no-go | DONE — documented NO-GO for production; live proof checklist |

**Still deferred after G57–G68:** staging/production live AI; image generation; email send; R2; WordPress live; GA/GSC OAuth; production deploy (G50); G49 formal owner sentence.

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

## G49 formal closure documentation + fresh public probes (2026-07-09, Subagent B)

Fresh public read-only probe re-run (Windows PowerShell, no SSH, no mutation) confirms staging and production root + `/api/v1/health` all return HTTP 200, HSTS present, database ready. See [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](../runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) §1.2/§17. This does not close the G49 gate formally (owner-approval sentence still pending per that runbook's §10 item 1), does not authorize G50, and does not move any item in this register out of deferred status. Production deploy remains deferred; production readiness remains **NO**.
