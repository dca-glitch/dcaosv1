# Deferred Scope Register

Status: Plain-language list of what is intentionally not active in the current local/admin MVP, plus **Puriva Launch blockers** that are required before launch but not yet proven.

This register prevents confusion. If something is listed under **Still deferred**, it is not forgotten — it is intentionally waiting for a later approved block. If something is listed under **Puriva Launch blockers**, it is required for Puriva Launch but not yet live-proven.

**G148 update:** G89-G147 moved several local foundations out of "not started" status, but did **not** move any live proof out of deferred. R2 readiness/proof stages, notification taxonomy/no-send adapter, GA/GSC helpers, WordPress draft payload/publish-freeze tests, image compliance policy helpers, Client Portal FINAL guards, Client Operating Pack constants, future-module contracts, AI budget reporting contracts, and operator/security inventories are local foundations only.

**G228 update (G149-G227):** Expanded local/no-IO foundations across storage, notifications, GA/GSC/monthly reports, WordPress, image compliance/approval-loop, Client Portal boundaries, Puriva pack entitlements, future-module contracts, and operator/security docs. Still **do not** move: real R2 IO, live email, live GA/GSC, live WordPress, live image provider, staging/prod live proofs, notification persistence/in-system inbox, or trusted `actualCostUsd` ingestion. Puriva Launch remains blocked.

## Rule

Deferred means: do not build, enable, deploy, or promise it as active until there is a separate approved task.

Puriva Launch blocker means: required before Puriva Launch on production; must pass a live proof or product gate — not satisfied by local-only or staging config-shape proof alone.

---

## Puriva Launch blockers (required before launch — staging/production proof pending)

**Canonical list and workflows:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md). Per-integration proof status: [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md). Launch gate entry: [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md). Notifications staged plan: [`notifications-blocker-plan.md`](./notifications-blocker-plan.md). Summary below; do not duplicate step-level workflow detail here.

These are **not** "still deferred" long-term roadmap items. They are active blockers for Puriva Launch. Local-only proofs (e.g. G77b live AI + COMPLETED ledger row) **do not** satisfy staging/production launch requirements. WordPress **draft/handoff** is required; WordPress **auto-publish** remains in still-deferred below.

| Blocker | Scope | Notes |
|---------|-------|-------|
| GA/GSC live sync proof | Live integration | Snapshot-first locally; live OAuth/sync proof required — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| R2 real-bucket proof | Live integration | G89-G93 local no-IO readiness/proof-stage/storage-key guard foundation complete; real bucket IO proof still required |
| Live AI provider proof | Live integration | **Local COMPLETE (G77b + G79)** — controlled OpenRouter execute + COMPLETED ledger row `5d8d635c-ced0-4a14-9b33-839e1fdee508`; monthly cap aggregation now includes live `COMPLETED` rows locally; `actualCostUsd=null`; **staging/production live proof still required for launch** — runbook: [`docs/runbooks/AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.18 |
| AI Model Research | Policy gate | Separate approved research gate |
| AI Model Policy | Policy gate | **Docs + skeleton closed (G55/G56)** — local live provider proof complete (G71f); staging/production proof still required — [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md) |
| Image generation proof | Live integration | G115-G119 compliance policy/helper foundation complete; provider selection/wiring/live proof for Article+Image path still required |
| Transactional notifications proof | Live integration | G94-G99 taxonomy/mapping/policy/no-send/templates foundation complete; in-system user inbox + live email still required — **not** marketing campaigns; staged plan: [`notifications-blocker-plan.md`](./notifications-blocker-plan.md) |
| Client Portal approval UX | Product gate | Client-safe approval path must be production-proven |
| Task-oriented admin UX | Product gate | Operator task flows for daily delivery |
| Article+Image workflow | Product gate | End-to-end article and image handoff |
| Monthly Report flow | Product gate | FINAL-only client report path on target environment — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| Feedback learning | Product gate | Client feedback loop for delivery iteration |

**Puriva Launch status:** **Blocked** until the blockers above are closed with evidence. See [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).

**Roadmap reference:** G147 created [`G147_NEXT_20_GATES.md`](./G147_NEXT_20_GATES.md) for G89-G108 planning. G227 created [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) for G229+ after G228 closeout. Neither roadmap authorizes live proof or launch.

**Email clarification:** transactional workflow notifications (approval, handoff, delivery status) are in scope for proof; marketing email campaigns remain still-deferred.

---

## Post-G69 remaining gates (G70 — owner input before live proofs)

These remain **blocked or complete (local only)** after G57–G68 merged to `main` (`64bfd06`). G70 documents the checklist; G71e + G71e-retry completed formal clean local live proof; G71f docs closeout recorded.

| Gate | Scope | Status | Runbook / note |
|------|-------|--------|----------------|
| G49 formal owner closure sentence | Production safety | **PENDING** | [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](../runbooks/G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) |
| Live AI provider proof | First controlled OpenRouter/text proof | **COMPLETE (local only)** | G71e Phase 1 + G71e-retry Phase 2/restore; run `90941e76-260d-4f99-b299-3a5c6b7a8d65`; staging/production live proof still **BLOCKED** — [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §9.15 |
| Live image generation proof | Article+Image path | **BLOCKED** | [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) |
| GA/GSC OAuth + live sync | Monthly report live data | **BLOCKED** | [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| WordPress live draft proof | Draft/handoff on target env | **BLOCKED** | [`WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) |
| R2 real-bucket IO proof | Private storage | **BLOCKED** | [`STORAGE_R2_PROOF.md`](../runbooks/STORAGE_R2_PROOF.md) |
| Transactional email live proof | Resend/workflow notifications | **BLOCKED** | [`EMAIL_NOTIFICATIONS_PROOF.md`](../runbooks/EMAIL_NOTIFICATIONS_PROOF.md) (if present) or integrations matrix |
| Staging migration application | `20260709120000_add_ai_budget_ledger` on staging DB | **BLOCKED** | Fresh owner approval; see [`STAGING_READINESS.md`](../runbooks/STAGING_READINESS.md) |
| Explicit production deploy approval | G50 | **BLOCKED** | [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md) |

**Production deploy is not authorized** by completing G69, G70 documentation, G71c partial proof closeout, G71f local live proof, or G77b local COMPLETED ledger proof.

---

## Future scope buckets (G78 — actionable, owner-gated)

Grouped for planning clarity. Items remain deferred until a separate approved block with proof requirement.

| Bucket | Scope | Owner gate / proof | Status |
|--------|-------|-------------------|--------|
| **Live AI cost / accounting** | Monthly cap aggregation for `liveProviderCalled=true` COMPLETED rows; `actualCostUsd` trusted provider-cost ingestion; provider cost dashboards | **G79** implemented + local unit proof; **G80** policy documented only | G79 DONE locally; trusted `actualCostUsd` ingestion and dashboards deferred |
| **Staging / production live proof** | Re-run bounded live OpenRouter, R2, GA/GSC, WordPress draft, email on target env | **G81** staging live proof planning (not execution); separate execution gates per integration | BLOCKED |
| **Notifications** | In-system MVP → email MVP → client approval events → admin alerts → audit alignment | **G82-G84** planning/event-map outcomes; **N1-N3** per [`notifications-blocker-plan.md`](./notifications-blocker-plan.md) | BLOCKED — no in-system notification model |
| **GA / GSC live metrics** | OAuth/token storage, live sync, non-placeholder monthly report metrics | **G85** planning in [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) | BLOCKED — MANUAL snapshots are separate from live GA/GSC |
| **WordPress live draft proof** | Live draft proof session; publish remains frozen | **G86** three-tier plan in [`WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md) | Draft prep local-proven; live proof BLOCKED; publish frozen |
| **Image generation provider proof** | Provider research, disabled-safe wiring, medical-aesthetic proof checklist, live proof | **G87** planning in [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) | BLOCKED |
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
| **G82-G84** | Notifications foundation/no-send/email/approval event-map planning — no live send and no in-system inbox yet |
| **G85-G87** | GA/GSC, WordPress live draft, and image generation proof planning — no live calls |
| **G88** | Shared-doc consolidation with correct G79-G88 gate map; Puriva Launch remains blocked |
| **G149 recommended after G148** | Owner-selected launch-blocker execution gate; recommended first candidate: R2 target-environment real-bucket proof or another explicitly approved low-blast-radius proof |
| **G228 closeout** | Main-agent integration of G149–G227; local foundations only; does not authorize live proof |
| **G229+** | See [`G227_NEXT_30_GATES.md`](./G227_NEXT_30_GATES.md) — owner-gated; R2 target-bucket proof remains recommended first candidate |

## G89-G148 deferred-scope reconciliation (2026-07-10)

| Area | Moved out of "not started" | Still deferred / blocked |
|------|-----------------------------|--------------------------|
| R2/private storage | No-IO readiness, proof-stage helpers, storage-key guard docs/tests | Real bucket IO, signed URL proof against target bucket, staging/prod proof |
| Notifications/email | Taxonomy, event mapping, policy, no-send adapter, local templates | In-system inbox/persistence, live email send, client notification proof |
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
| Notifications/email | Taxonomy V2, recipient/channel/severity/redaction, typed templates, no-send edges, persistence/inbox **design** | In-system inbox/persistence (migration), live email send, client notification proof |
| GA/GSC/monthly reports | Credential presence, period/source-truth/metric/recommendation/output guards, CSV import proof plan | OAuth consent, token storage/refresh, live GA/GSC sync, target-env report proof |
| WordPress | Draft payload, slug, status freeze, credential redaction, image-inclusion contract, proof-plan constants | Live draft proof session, auto-publish |
| Image generation | Compliance V2, prompt/alt/reject/approval-loop, WP inclusion readiness, provider proof plan | Provider selection, live generation, R2 image-byte proof |
| Client Portal | Serializer/archive/monthly guards, approval policy helper, error-safety, route inventory | Staging/prod browser proof; durable revision-round schema field |
| Client/future modules | Pack entitlement matrix, compliance validator, MI/RH/POD contract hardening | Live ingestion, marketplace/CRM/write connectors |
| Operator/security docs | G223 checklist, smoke inventory, validation guards, G227 next-30 roadmap | External audit, production proof, deploy approval |

G228 recommendation: keep local foundations, keep all live-provider/storage/email/Google/WordPress/image and staging/production proofs deferred until a separate owner-approved gate (G229+).

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

**Ground-truth notice (updated 2026-07-09 post-G54):** G46d controlled staging deploy/proof is PASS, followed by G47/G47b/G47c staging smoke/proof PASS, G48 production readiness planning PASS, **G53 production safety plan approved (planning only)**, and **G54 HSTS/proxy PASS**. Production deploy ready: **NO**. G49 dry-run and G50 deploy: **not executed**. Next production path remains G49 dry-run before G50, only after owner approval. Puriva Launch: **blocked** pending live proof gates. Staging proof used API context `/opt/dca/staging-artifacts/5e1ea5a`, host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`, staging compose `/opt/dca/apps/dcaosv1/staging/docker-compose.staging.yml`, `--env-file .env.staging`, and service `dcaosv1-staging-api`. G47c staging security baseline: `31/31 passed` (HSTS warning at G47 time; closed in G54). Production deploy attempted: NO. Any further staging/VPS/production execution requires fresh explicit owner approval.

**G43 note:** the later local pre-staging re-check PASS on current `main` at `a18dcc1` does not move any deferred staging, VPS, production, deploy, migration, Docker, Caddy, live provider, or live storage item out of deferred status.

Deferred:

- VPS production deployment;
- production database activation;
- production R2 switch;
- production email sending;
- live production Client Portal rollout on `system.digitalcubeagency.net` (MVP build in progress locally);
- public production rollout;
- Caddy/container/VPS changes without approval;
- **Block G4/G46d/G47 controlled staging execution and smoke proof:** Phase C controlled refresh COMPLETE on commit `5e1ea5a`; G46d controlled staging deploy/proof PASS; G47 staging smoke/proof PASS with explicit target env guards; further staging/VPS work deferred pending fresh owner approval;
- **future staging refresh / updates:** deferred pending fresh explicit owner approval with bounded execution block.

Current behavior:

- work remains local-first;
- PR #13 is merged to `main`, but current `main` is 0% deployed to production;
- **production URL:** `system.digitalcubeagency.net`;
- **staging URL (G1 approved):** `staging.digitalcubeagency.net` — same VPS, separate staging stack; G35 Phase C refresh COMPLETE on `5e1ea5a` (see STATUS §2.2/§2.8); G46d controlled staging deploy/proof PASS; G47 staging smoke/proof PASS; artifact/API context `/opt/dca/staging-artifacts/5e1ea5a`; host-side web target `/opt/dca/apps/dcaosv1/staging/web/dist`; compose requires `--env-file .env.staging`; correct API service `dcaosv1-staging-api`; API health 200; MVP smoke PASS; G54 HSTS/proxy PASS; production untouched;
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

Deferred:

- real provider sending by default;
- automatic client notifications;
- **in-system user notification inbox (Client Portal + admin)** — not started; `EmailLog` is outbound attempt log only;
- background notification queues;
- invite emails;
- password reset emails;
- client reminder automation.

Current behavior:

- email foundation exists as controlled groundwork;
- sending must be separately approved and tested.

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
| Staging deploy and smoke proof | **G46d/G47 PASS** | G35 Phase C refresh on `5e1ea5a` PASS; G46d controlled staging deploy/proof PASS; G47 minimal proof PASS with staging root 200, staging health 200, prod health-only 200; G47b MVP staging smoke PASS with explicit target env; G47c staging security baseline 31/31 PASS with one HSTS warning; production deploy attempted NO; production app/API/DB mutation NO; further staging work deferred pending fresh owner approval |
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
