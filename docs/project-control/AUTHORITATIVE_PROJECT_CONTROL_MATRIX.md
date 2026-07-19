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
| Phase 1 P1.4a staging-like rehearsal and execution-gate packet | IMPLEMENTED_LOCAL_PROVEN | Sanitized rehearsal evidence; the P1.2b–P1.4b approved localhost scope is complete and evidenced |
| Phase 1 P1.2b–P1.4b local execution package | IMPLEMENTED_LOCAL_PROVEN | Backup/restore, source migration/backfill/reconciliation, idempotent rerun, and endpoint permission/isolation PASS; endpoint authority and feature flag remain `LOCAL_ONLY` |
| Phase 2 / P2-A owner decisions | P2-A_IMPLEMENTATION_READY_AUTHORIZED | A later authorized run may consume an owner-provided anonymized offline snapshot; the owner selects exactly one active Tenant, keeps snapshot/evidence only at `C:\dcaosv1-p2-evidence` outside Git with no cloud sync or automatic deletion, requires fail-closed completeness and deterministic manifest/hash, preserves `ClientUserAccess` count/hash as sole per-Client authority, classifies the six known no-role memberships as `OWNER_REMEDIATION_REQUIRED`, and limits future P2-B/C posture to localhost `127.0.0.1:5434` plus isolated restore `127.0.0.1:5435`; this writeback uses synthetic fixtures only, Phase 2 runtime remains NOT_STARTED, flags remain OFF, and Phase 3 does not start |

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

## 7. Phase 1 local execution closeout

P1.1 and P1.2a–P1.4a are COMPLETE; P1.2b–P1.4b are COMPLETE for the approved local scope. `PR #67` merged at `55baa03d39e85819ea257127b18bc8f9094701a0` and `PR #68` merged at `a8caea74b440e8fa9311e1c09ba24febd7f29a44`; merge and post-merge CI PASS. Restore rehearsal PASS on `127.0.0.1:5435`; source `127.0.0.1:5434` migrations, backfill, reconciliation, and idempotent rerun PASS. The result is 1 Workspace and 7 memberships (1 ADMIN, 6 CLIENT_USER), with six no-role exceptions excluded and Client/UserAccess hashes unchanged. Endpoint permission/isolation proof PASS; endpoint authority and feature flag remain `LOCAL_ONLY`. Remote, production, VPS, Tellanic, cleanup, and Phase 2 remain forbidden.
