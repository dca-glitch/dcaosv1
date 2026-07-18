# Current System Snapshot — DCA OS v2

**Purpose:** concise current-system truth for maintainers and external agents.

## 1. Product identity

DCA OS v2 is the private Agency Operations System for one organization: Digital Cube Agency.

- It is not a public, self-service, subscription, marketplace, or independently licensed SaaS product.
- Puriva is the first External Client Workspace and only initial production pilot; it remains a shared-platform operating pack, never a fork.
- Current canonical baseline is merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`).
- Production exists, but readiness for new production work remains **NO** unless a current runbook explicitly authorizes it.

## 2. Architecture and operating model

- Monorepo with `apps/web`, `apps/api`, `packages/data`, and `packages/shared`
- React + Vite frontend
- Node.js + Express API
- Prisma + PostgreSQL data layer
- Shared TypeScript contracts between frontend and backend
- One internet domain = one `Client`
- `Tenant`, `TenantMembership`, `Role`, `Permission`, `Client`, and `ClientUserAccess` are current legacy compatibility foundations and remain authoritative at runtime.
- `Workspace` is the approved future primary boundary for data, authorization, reporting, costs, integrations, materials, and search. Phase 1 P1.1's expand-only schema foundation is complete through `PR #60` / `14b52f8b`; it has not switched runtime scope, authorization, or client-visible behavior.
- Phase 1 P1.2a is complete: deterministic validation and dry-run planning consume only a sanitized local snapshot plus explicit proposed mappings. It cannot connect to or mutate data, execute a backfill or reconciliation, or activate Workspace runtime authority.
- Phase 1 P1.3a is complete: a snapshot-only comparison and isolation preparation report keeps both Workspace flags OFF and records a future rollback plan.
- Phase 1 is COMPLETE: P1.1 and P1.2a–P1.4a are complete, and P1.2b–P1.4b are complete for the approved local scope. The bounded endpoint authority and feature flag remain `LOCAL_ONLY`; Tenant/Client remains authoritative for per-Client scope.
- Phase 2 remains `NOT_STARTED`. Owner decision P2-01 approves only the future P2-A population definition: exactly one existing active Tenant from local source `127.0.0.1:5434`, with all of its active Clients, active TenantMemberships, and active ClientUserAccess records. P2-A remains offline/sanitized-snapshot-only with a deterministic population manifest/hash; it cannot connect to a database or mutate data. The six no-role membership dispositions remain pending.

## 3. Roles and access boundaries

| Role | Current scope |
|---|---|
| `owner` / `admin` | Full operator surfaces |
| client-only users | Client-safe portal surfaces only |

Clients must not see prompts, raw workflow runs, provider metadata, AI cost internals, credentials, `storageKey`, or admin-only notes.

## 4. Current capability truth

| Area | State now | Notes |
|---|---|---|
| Auth/session/RBAC | IMPLEMENTED_LOCAL_PROVEN | `PR #55` is the current baseline for client session restoration under local rate limiting |
| Clients / projects / tasks | IMPLEMENTED | Core admin surfaces are part of the current app map |
| Client Portal MVP | IMPLEMENTED_LOCAL_PROVEN | Client-safe visibility, approvals, archive, and FINAL monthly reports only |
| AI Delivery | IMPLEMENTED_LOCAL_PROVEN | Operator-primary routed workflow pages are the current baseline |
| AI Operations / Orchestrator Lite | CONFIG_SHAPE_PROVEN | Read-only/planning-oriented; not a blanket live-execution claim |
| Market Intelligence | LOCAL_FOUNDATION | Admin-only MVP; no live scraping/autonomous agent claim |
| Monthly reports | IMPLEMENTED_LOCAL_PROVEN | FINAL-only client visibility; live GA4/GSC is withdrawn |
| R2 private storage | RECORDED_STAGING_PROOF | Retained as historical proof provenance, not blanket live authorization |
| WordPress draft handoff | IMPLEMENTED_LOCAL_PROVEN | Local prepared-draft/admin foundations only; live HTTP draft/publish is not current capability |
| Live GA4/GSC integration | WITHDRAWN | Not deferred for automatic resumption |

## 5. Current proof baseline

| Proof | Result |
|---|---|
| Web unit tests | **362/362 PASS** |
| AI Delivery deep-link proof | **85/85 PASS** |
| System-wide responsive proof | **124/124 PASS** |
| Genuine Client-role Botanical proof | **98/98 PASS** |

These results come from `PR #55` and remain the canonical UI proof baseline for merge commit `998c294`.

## 6. Integrations and publishing boundary

- AI routing authority lives in [`architecture/AI_POLICY_PROVIDER_ROUTING.md`](./architecture/AI_POLICY_PROVIDER_ROUTING.md).
- Local deterministic AI execution remains the default-safe path unless a separate gate authorizes live provider use.
- WordPress is an optional publishing connector, not the core content model.
- Current WordPress claim boundary is **draft preparation / local handoff only** unless a retained proof document records a narrower historical proof.
- GA4/GSC live integration is withdrawn. Manual import is not implemented.

## 7. UI truth

- **Current UI authority:** [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)
- Frontend terminology stays English-only.
- Current proof references use desktop **1440**, tablet **768**, and mobile **390** viewports.
- Current UX direction favors routed pages for complex workflows, with only short confirmation and single-purpose overlays retained as modals.
- Older Dark Nebula design docs are historical only.

## 8. Approved direction not implemented

Treat the following as `APPROVED_DIRECTION_NOT_IMPLEMENTED` unless a higher-authority current doc says otherwise (the bounded local P1.2b–P1.4b gate is the explicit exception):

- Phase 1 Workspace runtime authority beyond the completed P1.1–P1.4a preparation: memberships enforcement, five-role authorization, scoped API/query/search, feature flags, audit context, and execution-gate authorization
- advanced public/client collaboration features
- default live AI/provider execution across workflows
- live WordPress HTTP draft or publish from the current local prepared-draft baseline
- GA4/GSC automation or manual import flow
- broad autonomous background agents that can spend money

The previous broader licensed-SaaS direction is superseded; it must not be revived as future product direction.

## 9. Historical evidence boundary

Historical staging/production proofs, UI audits, deployment closeouts, and release notes remain evidence only. Use them for provenance, recovery, security, or deployment history — not for current readiness claims.

## 10. Local development orchestration boundary

- Graphify `0.9.17` is operational; Graphify-first repository access passed. Codex/Graphify configuration is recorded locally in commit `5ad4eeb`.
- OpenClaw `2026.7.1` and the official Codex plugin are installed for temporary local development/deployment orchestration. OpenAI OAuth is used; no API key is required.
- OpenClaw is not part of the DCA OS runtime and must not be installed into it or onto the production VPS. This boundary lasts until the approved live-VPS launch gate closes, when retention/removal needs a separate owner decision.
- Gateway access is loopback-only with token authentication; `tools.elevated` and heartbeat are disabled. No OpenClaw Scheduled Task or autonomous recurring monitoring is approved.
- The durable `AUTONOMY-HIGH` model permits routine repository reads, edits, local commands, tests, commits, task-branch pushes, PR creation, CI monitoring/repair, and eligible merges through Codex auto-review. Every material code or policy diff still needs a separate read-only Terra reviewer decision on the exact unchanged diff plus green CI. Native GitHub approval is needed only when branch protection technically requires it; it must never be simulated. Production/VPS actions, secrets, costs, destructive migrations, legal/privacy issues, live integrations, actual backfill/reconciliation/switch/cleanup, and unresolved critical/canonical conflicts remain owner-gated.

## 11. Phase 1 local execution closeout (authoritative)

P1.1 and P1.2a–P1.4a are COMPLETE; P1.2b–P1.4b are COMPLETE for the approved local scope. `PR #67` merged at `55baa03d39e85819ea257127b18bc8f9094701a0` and `PR #68` merged at `a8caea74b440e8fa9311e1c09ba24febd7f29a44`; merge and post-merge main CI PASS. Backup SHA-256 is `6ddadb4d579fe119ef027250d87b2e1815f888c350820ba396710758ba589755`; restore rehearsal PASS on `127.0.0.1:5435`; source `127.0.0.1:5434` migrations, backfill, reconciliation, and idempotent rerun PASS. Endpoint permission/isolation proof PASS. The result is 1 Workspace and 7 memberships (1 ADMIN, 6 CLIENT_USER), with six no-role exceptions excluded and Client/UserAccess hashes unchanged. Endpoint authority and feature flag remain `LOCAL_ONLY`; production, VPS, remote environments, Tellanic, and Phase 2 are untouched.
