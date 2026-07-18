# Authoritative Project Control Matrix

**Purpose:** current status vocabulary and capability labels for the post-`998c294` baseline.

This file is no longer a running next-gate ledger. Use it to understand what each label means and which capabilities are current, historical, withdrawn, or approved-but-not-implemented.

## 1. Baseline

- **Canonical baseline:** merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`)
- **Current product posture:** private Agency Operations System for one Digital Cube Agency organization; never public/self-service SaaS or independent-licensee product
- **Current production posture:** frozen/owner-gated; readiness remains **NO** for new work unless a current runbook authorizes it

## 2. Status labels

| Label | Meaning |
|---|---|
| IMPLEMENTED | Present in the current app/runtime model |
| IMPLEMENTED_LOCAL_PROVEN | Current local implementation with recorded local proof baseline |
| LOCAL_FOUNDATION | Present locally, but not a broader proof or live-readiness claim |
| CONFIG_SHAPE_PROVEN | Configuration/contract shape proven without blanket live execution claim |
| RECORDED_STAGING_PROOF | Retained historical staging proof provenance only; not standing authorization |
| APPROVED_DIRECTION_NOT_IMPLEMENTED | Approved future direction, not current implementation |
| WITHDRAWN | Explicitly removed from current/planned scope |
| FROZEN | Owner-gated and unavailable for new action without a new current gate |

## 3. Current capability matrix

| Capability | Label | Scope of current claim |
|---|---|---|
| Client/domain/publication model | IMPLEMENTED | Domain = `Client`; publication targets belong to client |
| Auth/session/RBAC | IMPLEMENTED_LOCAL_PROVEN | Local runtime boundary and current client/admin session baseline |
| Client Portal MVP | IMPLEMENTED_LOCAL_PROVEN | Client-safe archive/approvals/FINAL monthly reports |
| AI Delivery routed workflow pages | IMPLEMENTED_LOCAL_PROVEN | Current responsive page-first workflow baseline |
| Monthly reports | IMPLEMENTED_LOCAL_PROVEN | FINAL-only client visibility; no live GA4/GSC claim |
| AI Operations / Orchestrator Lite | CONFIG_SHAPE_PROVEN | Planning/read-only posture only |
| Market Intelligence | LOCAL_FOUNDATION | Admin-only MVP |
| Finance Lite | LOCAL_FOUNDATION | Current module foundation only |
| R2 private storage | RECORDED_STAGING_PROOF | Retained proof provenance, not blanket live authorization |
| WordPress prepared draft handoff | IMPLEMENTED_LOCAL_PROVEN | Local prepared-draft/admin handoff only |
| Direct-to-Draft live HTTP capability | APPROVED_DIRECTION_NOT_IMPLEMENTED | Do not claim as current |
| Live GA4/GSC integration | WITHDRAWN | Removed from current/planned scope |
| Production execution | FROZEN | Requires separate current gate and approval |
| Phase 0 charter/authority package | IMPLEMENTED | Private-agency direction and Phase 1 governing contracts are canonical |
| Phase 1 P1.1 Workspace foundation | IMPLEMENTED | Additive schema foundation completed in `PR #60` / `14b52f8b`; Tenant/Client remains authoritative at runtime, with no client-visible Workspace authority |
| Phase 1 P1.2a mapping validation and dry-run planning | IMPLEMENTED_LOCAL_PROVEN | Deterministic sanitized-snapshot validation and plan output only; data mutation, backfill, reconciliation execution, and Workspace authority activation are disabled |
| Phase 1 P1.3a reconciliation preparation | IMPLEMENTED_LOCAL_PROVEN | Deterministic snapshot-only comparison and isolation preparation; flags remain OFF and rollback is a future plan only |
| Phase 1 P1.4a staging-like rehearsal and execution-gate packet | IMPLEMENTED_LOCAL_PROVEN | Sanitized rehearsal evidence; owner-authorized P1.2b–P1.4b execution is restricted to localhost and remains evidence-pending |

## 4. Current proof baseline

| Proof | Result |
|---|---|
| Web unit tests | **362/362 PASS** |
| AI Delivery deep-link proof | **85/85 PASS** |
| System-wide responsive proof | **124/124 PASS** |
| Genuine Client-role Botanical proof | **98/98 PASS** |

These are the current UI proof references for the `998c294` baseline.

## 5. Overclaim guardrails

- Historical staging/production proofs remain evidence only.
- Old closeouts, next-gate docs, and lane ledgers are not current operating authority.
- WordPress must stay platform-neutral and optional; current canonical docs do not authorize live HTTP draft/publish claims.
- GA4/GSC must stay labeled withdrawn unless a future canonical refresh says otherwise.

## 6. Local engineering-orchestration control state

- `AUTONOMY-HIGH` was owner-approved on 2026-07-17. After the applicable task, validation, independent-review, unchanged-diff, and exact-staging gates pass, routine local commits, task-scoped feature-branch pushes, draft PRs, CI repair, and review loops may be autonomous.
- This does not authorize production or VPS actions, destructive migrations, secret handling, spending, legal/privacy decisions, or unresolved Critical issues; those remain owner-gated.
- The verified local tool boundary is Graphify `0.9.17`, Codex/Graphify configuration at local commit `5ad4eeb`, and OpenClaw `2026.7.1` with the official Codex plugin using OpenAI OAuth (no API key required).
- OpenClaw remains temporary development/deployment orchestration only until the live-VPS launch gate closes. It is not a DCA OS runtime dependency. Gateway is loopback-only with token authentication; `tools.elevated`, heartbeat, Scheduled Tasks, and autonomous recurring monitoring are disabled or unapproved.

## 7. Owner execution gate (pre-execution)

**OWNER_EXECUTION_AUTHORIZED_LOCAL_ONLY / EXECUTION_PENDING_EVIDENCE**. P1.2b–P1.4b are bounded to `127.0.0.1:5434` with restore/rehearsal on `127.0.0.1:5435`, mandatory backup/verified restore, unique `legacyTenantId` mapping, approved owner/client role translation, six excluded no-role memberships, and unchanged ClientUserAccess authority. The first endpoint is `GET /api/admin/workspaces/:workspaceId`; active ADMIN and WORKSPACE_MANAGER allow and every other role/cross-workspace request denies. Feature flag remains OFF until local reconciliation passes. No execution or Phase 1 completion is claimed yet; remote/prod/VPS/Tellanic/cleanup/source overwrite remain forbidden.
