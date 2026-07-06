# Deferred Scope Register

Status: Plain-language list of what is intentionally not active in the current local/admin MVP.

This register prevents confusion. If something is listed here, it is not forgotten. It is intentionally waiting for a later approved block.

## Rule

Deferred means: do not build, enable, deploy, or promise it as active until there is a separate approved task.

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

**Ground-truth notice (added during G28 reconciliation):** `docs/STATUS.md` §2.2 separately claims a G4 staging deploy completed on `5ee8389`, which would contradict the "deferred" items below. That claim is **unresolved and owner-gated** — neither confirmed nor refuted. Treat the items below as also unverified pending owner confirmation, not settled fact. No new staging, VPS, production, deploy, live provider, live WordPress, live R2, GA/GSC, or env action may proceed until the owner confirms ground truth and docs are reconciled.

Deferred:

- VPS production deployment;
- production database activation;
- production R2 switch;
- production email sending;
- live production Client Portal rollout on `system.digitalcubeagency.net` (MVP build in progress locally);
- public production rollout;
- Caddy/container/VPS changes without approval;
- Block G4 controlled VPS staging execution (G1 staging target is documented; G4 not approved);
- DNS for `staging.digitalcubeagency.net` (not created yet — G4 prep only).

Current behavior:

- work remains local-first;
- PR #13 is merged to `main`, but current `main` is 0% deployed to production;
- **production URL:** `system.digitalcubeagency.net`;
- **staging URL (G1 approved):** `staging.digitalcubeagency.net` — same VPS, separate staging stack; DNS not created yet;
- production is frozen unless explicitly approved.

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
| Staging deploy proof | Deferred | G4 only |
| Production deploy proof | Deferred | Frozen |
| Strict R2 real bucket proof | Deferred | Optional local env + smoke flag |
| GA / GSC live sync | Deferred | Snapshot-first metrics; manual/Puriva placeholder proven |
| Live provider proof | Deferred | Local deterministic default; OpenRouter opt-in |
| WorkflowBriefs knowledge picker/override (6C-v2) | Deferred | 6C-v1 admin read-only visibility shipped |
| `AiContextSnapshot` per-brief audit (6D) | Deferred | No `briefId` FK; safety via `smoke:ai-knowledge-context` |
| `ClientMonthlyBrief` deprecation | Deferred | Legacy intake at `#/client-portal/briefs`; separate removal block |
| Large AiDelivery modal refactor | Deferred | WP confirm modal extracted; further splits cosmetic |
| Production deploy | Deferred | G4 staging is separate gate; prod frozen |

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
