# Deferred Scope Register

Status: Plain-language list of what is intentionally not active in the current local/admin MVP, plus **Puriva Launch blockers** that are required before launch but not yet proven.

This register prevents confusion. If something is listed under **Still deferred**, it is not forgotten — it is intentionally waiting for a later approved block. If something is listed under **Puriva Launch blockers**, it is required for Puriva Launch but not yet live-proven.

## Rule

Deferred means: do not build, enable, deploy, or promise it as active until there is a separate approved task.

Puriva Launch blocker means: required before Puriva Launch on production; must pass a live proof or product gate — not satisfied by local-only or staging config-shape proof alone.

---

## Puriva Launch blockers (required before launch — not yet proven)

**Canonical list and workflows:** [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md). Per-integration proof status: [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md). Launch gate entry: [`docs/runbooks/PURIVA_LAUNCH_GATE.md`](../runbooks/PURIVA_LAUNCH_GATE.md). Summary below; do not duplicate step-level workflow detail here.

These are **not** "still deferred" long-term roadmap items. They are active blockers for Puriva Launch. WordPress **draft/handoff** is required; WordPress **auto-publish** remains in still-deferred below.

| Blocker | Scope | Notes |
|---------|-------|-------|
| GA/GSC live sync proof | Live integration | Snapshot-first locally; live OAuth/sync proof required — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| R2 real-bucket proof | Live integration | Disabled-safe locally; real bucket IO proof required |
| Live AI provider proof | Live integration | Local deterministic default; OpenRouter opt-in proof required — runbook: [`docs/runbooks/AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) |
| AI Model Research | Policy gate | Separate approved research gate |
| AI Model Policy | Policy gate | **Docs + skeleton closed (G55)** — live provider proof still required — [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md) |
| Image generation proof | Live integration | Provider/workflow proof for Article+Image path |
| Transactional notifications proof | Live integration | Workflow email delivery — **not** marketing campaigns |
| Client Portal approval UX | Product gate | Client-safe approval path must be production-proven |
| Task-oriented admin UX | Product gate | Operator task flows for daily delivery |
| Article+Image workflow | Product gate | End-to-end article and image handoff |
| Monthly Report flow | Product gate | FINAL-only client report path on target environment — runbook: [`docs/runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md`](../runbooks/MONTHLY_REPORT_LIVE_DATA_PROOF.md) |
| Feedback learning | Product gate | Client feedback loop for delivery iteration |

**Puriva Launch status:** **Blocked** until the blockers above are closed with evidence. See [`G53_PRODUCTION_SAFETY_PLAN.md`](../runbooks/G53_PRODUCTION_SAFETY_PLAN.md).

**Email clarification:** transactional workflow notifications (approval, handoff, delivery status) are in scope for proof; marketing email campaigns remain still-deferred.

---

## Still deferred (intentionally not active)

These remain out of scope for current MVP and Puriva Launch v1 unless a separate approved block explicitly activates them.

| Item | Notes |
|------|-------|
| Autonomous agents | Admin-triggered AI only |
| WordPress auto-publish | Draft prep/handoff required for Puriva — runbook: [`docs/runbooks/WORDPRESS_DRAFT_PROOF.md`](../runbooks/WORDPRESS_DRAFT_PROOF.md); auto-publish deferred |
| Marketing emails | Transactional workflow email is separate proof gate |
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

Deferred:

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

Deferred:

- real provider sending by default;
- automatic client notifications;
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
| Live provider proof | Deferred | Local deterministic default; OpenRouter opt-in |
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
