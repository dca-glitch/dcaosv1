# DCA OS v2 — Current Status

**Last updated:** 2026-07-18
**Canonical baseline:** merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55` — “Complete responsive modal-to-page migration”)

This file replaces the old running gate ledger. Historical deploy logs, staging proofs, and prior gate closeouts remain under retained evidence paths and are no longer duplicated here.

## 1. Current baseline

| Item | Current status |
|---|---|
| Product stance | **Private Agency Operations System for one Digital Cube Agency organization; not a public/self-service SaaS** |
| First External Client Workspace / pilot | **Puriva** (approved Client Operating Pack direction; no Workspace runtime authority) |
| Production readiness | **NO** for new work unless a current runbook explicitly authorizes it |
| UI baseline | **Botanical Light** with routed page flows from `PR #55` |
| Client session restoration | Fixed in the `PR #55` baseline for local rate-limited client sessions |
| Client Portal MVP | Client-safe visibility, approvals, archive, and FINAL monthly reports only |
| WordPress | Local prepared-draft/admin foundation only; live HTTP draft/publish is not current canonical capability |
| GA4/GSC | **WITHDRAWN**; manual import not implemented |

## 2. Current proof baseline (`PR #55` / `998c294`)

| Proof | Result | Evidence |
|---|---|---|
| Web unit tests | **362/362 PASS** | `PR #55` validation summary |
| AI Delivery routed workflow deep links | **85/85 PASS** | `PR #55`; `scripts/smoke-ai-delivery-workflow-pages-deep-link-local.mjs` |
| System-wide responsive route proof | **124/124 PASS** | `PR #55`; `scripts/smoke-system-wide-routes-viewports-local.mjs` |
| Genuine Client-role Botanical proof | **98/98 PASS** | `PR #55`; `scripts/smoke-client-role-botanical-proof-local.mjs` |
| Genuine Client-role rerun | **98/98 PASS** | `PR #55` validation summary |

## 3. Capability status matrix

| Capability | Current label | Scope of claim |
|---|---|---|
| Auth/session/RBAC | IMPLEMENTED_LOCAL_PROVEN | Local runtime and client/admin boundary baseline |
| Client/domain/publication model | IMPLEMENTED | Current architecture and data model direction |
| Client Portal MVP | IMPLEMENTED_LOCAL_PROVEN | FINAL-only client-safe surfaces |
| AI Delivery routed workflow pages | IMPLEMENTED_LOCAL_PROVEN | Current modal-to-page baseline |
| Monthly reports | IMPLEMENTED_LOCAL_PROVEN | FINAL-only client visibility; no live GA4/GSC claim |
| AI Operations / Orchestrator Lite | CONFIG_SHAPE_PROVEN | Planning/read-only posture only |
| Market Intelligence | LOCAL_FOUNDATION | Admin-only MVP; no live ingestion/autonomous claim |
| Finance Lite | LOCAL_FOUNDATION | Present in app map; not a production finance-readiness claim |
| R2 private storage | RECORDED_STAGING_PROOF | Historical proof provenance retained; not standing authorization |
| WordPress prepared draft handoff | IMPLEMENTED_LOCAL_PROVEN | Local payload/admin handoff boundary only |
| Direct-to-Draft live HTTP | APPROVED_DIRECTION_NOT_IMPLEMENTED | Do not claim from current canonical docs |
| Live GA4/GSC integration | WITHDRAWN | No live OAuth/sync/manual import claim |
| Production execution | FROZEN | Requires separate current gate and approval |
| Phase 0 canonical prerequisite package | IMPLEMENTED | Current authority reconciled to the private-agency charter; implementation remains separate |
| Phase 1 Workspace foundation | IN_PROGRESS (P1.1–P1.4a complete; future P1.2b–P1.4b owner-critical execution gate only) | P1.4a provides deterministic local sanitized rehearsal and a fail-closed packet. It remains `EXECUTION_NOT_AUTHORIZED` / `OWNER_ACCEPTANCE_REQUIRED`; Tenant/Client remains authoritative and no reconciliation, switch, or data mutation was executed |

## 4. Current boundaries that must not be overclaimed

- Clients must not see prompts, provider internals, raw workflow runs, AI cost details, credentials, `storageKey`, or admin-only notes.
- WordPress remains an optional connector. Current canonical docs only permit local prepared-draft/admin foundations.
- Historical staging or production proof documents are retained for provenance, rollback, security, and recovery only.
- Older next-gate instructions and running ledgers are historical and must not be reused as current execution authority.

## 5. Current references

- System snapshot: [`CURRENT_SYSTEM_SNAPSHOT.md`](./CURRENT_SYSTEM_SNAPSHOT.md)
- Architecture map: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Client/domain model: [`architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./architecture/CLIENT_DOMAIN_OPERATING_MODEL.md)
- Status vocabulary: [`project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](./project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- Operator guardrails: [`operator/OPERATOR_RUNBOOK.md`](./operator/OPERATOR_RUNBOOK.md)
- UI authority: [`ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md`](./ui/BOTANICAL_LIGHT_PRODUCT_UI_DIRECTION.md)

## 6. Historical evidence location

Use retained evidence under `docs/audits/`, `docs/audit/`, `docs/releases/`, selected `docs/runbooks/`, and selected `docs/security/` files when you need proof provenance, deployment history, rollback context, or compliance/security history.

## 7. Verified local engineering-operation state (2026-07-17)

| Item | Verified current state |
|---|---|
| Repository navigation | Graphify `0.9.17` is operational and Graphify-first access passed; Codex/Graphify configuration is committed locally as `5ad4eeb` |
| Prisma recovery | A confirmed DCA OS API Node process held `query_engine-windows.dll.node`, causing Windows Prisma `EPERM`; only that confirmed DCA OS process tree was stopped |
| Local proof | `npm.cmd run validate` passed; `npm.cmd run smoke:local` passed with API/database ready |
| Local orchestrator | OpenClaw `2026.7.1` and the official Codex plugin are installed locally; OpenAI OAuth is used and no API key is required |
| Orchestrator security | Gateway is loopback-only with token authentication; `tools.elevated` and heartbeat are disabled; no Scheduled Task or autonomous recurring monitoring is approved |
| Runtime boundary | OpenClaw is temporary development/deployment orchestration only until live-VPS launch and is not part of the DCA OS runtime |
| Delegated authority | Durable `AUTONOMY-HIGH`: Codex auto-review permits routine repository reads, edits, local commands, tests, commits, task-branch pushes, PR creation, CI monitoring/repair, and eligible merges |
| Review gate | Each material code or policy diff requires a distinct read-only Terra reviewer decision on the exact unchanged diff plus green CI; native GitHub approval is needed only when branch protection technically requires it |
| Owner gates | Production/VPS, secrets, costs, destructive migrations, legal/privacy issues, live integrations, actual backfill/reconciliation/switch/cleanup, and unresolved critical/canonical conflicts remain owner-gated |
| Review evidence | Review decisions must be recorded as `APPROVE_READ_ONLY` or `REQUEST_CHANGES` in the PR/report; native GitHub approvals are never simulated |

DCA OS and Tellanic OS remain separate scopes; no orchestration work changes that boundary.

## 8. Owner execution gate (pre-execution)

**OWNER_EXECUTION_AUTHORIZED_LOCAL_ONLY / EXECUTION_PENDING_EVIDENCE**. P1.2b–P1.4b are authorized only for source `127.0.0.1:5434` and isolated restore/rehearsal `127.0.0.1:5435`. Backup and verified restore are mandatory before source mutation. The approved mapping uses unique `Workspace.legacyTenantId`; `owner` maps to `ADMIN`, six approved `client` memberships map to `CLIENT_USER`, and five active memberships without roles are excluded. `ClientUserAccess` remains the required per-Client authority. The first bounded endpoint is `GET /api/admin/workspaces/:workspaceId`: active `ADMIN` and `WORKSPACE_MANAGER` allow; all other roles, inactive/revoked memberships, missing membership, and cross-workspace access deny. Its feature flag is default OFF and may activate only locally after reconciliation. No execution, backfill, reconciliation, switch, or Phase 1 completion is claimed here.
