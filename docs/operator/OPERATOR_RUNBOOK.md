# Operator Runbook

**Purpose:** current operator entry point for validation order, smoke order, and environment guardrails.

## 1. Authority and posture

- Read current product state in [`../STATUS.md`](../STATUS.md) before running scoped work.
- Production remains **frozen/owner-gated** for new actions unless a current runbook explicitly authorizes them.
- The product is a private Digital Cube Agency system, not a public/self-service SaaS. Do not create public signup, independent tenant/licensee, subscription, marketplace, or provider-live work under Phase 1.
- Historical deploy/proof docs remain evidence only; they are not standing approval.

## 2. Validation order

Run in this exact order and stop on first failure:

1. `git diff --check`
2. `npm.cmd run validate`
3. `npm.cmd run smoke:ai-delivery-reviews` — only if `validate` passed and the scoped task requires it
4. `npm.cmd run smoke:local` — only if `validate` passed and the scoped task requires it
5. `npm.cmd run smoke:browser` — only if `validate` passed and the scoped task requires it

## 2.1 Local tooling and Prisma recovery

- Use Graphify-first navigation when `graphify-out/graph.json` exists; the verified local baseline is Graphify `0.9.17` and Codex/Graphify configuration at commit `5ad4eeb`.
- For a Windows Prisma `EPERM` on `query_engine-windows.dll.node`, identify the process holding the DLL, inspect its command line and parent, and stop only the confirmed DCA OS process tree. The verified incident was the DCA OS API Node process; after one retry, `npm.cmd run validate` passed and `npm.cmd run smoke:local` passed with API/database ready.
- Never stop all Node processes. After an equivalent repeated failure, change the hypothesis and escalate for Critical review rather than retrying unchanged.
- Workspace work uses expand → backfill → reconciliation → switch → cleanup. Package 1 is expand-only: no destructive change, backfill, endpoint switch, or cleanup. See [`../architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](../architecture/TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md).
- OpenClaw `2026.7.1` plus the official Codex plugin may orchestrate local development through OpenAI OAuth; no API key is required. Gateway remains loopback-only with token authentication, `tools.elevated` and heartbeat are disabled, and no Scheduled Task or autonomous recurring monitoring is approved.
- OpenClaw is temporary development/deployment orchestration only, not a DCA OS runtime component. Do not install it in the product runtime or on the production VPS.

## 2.2 Autonomous repository workflow

- Codex auto-review handles routine workspace-write tool approvals. Routine repository reads, edits, local commands, tests, commits, pushes, PR creation, CI monitoring, and routine CI fixes do not require a human approval pause.
- Before each eligible merge of a material code or policy diff, obtain a separate read-only Terra reviewer-agent decision against the exact unchanged diff and record `APPROVE_READ_ONLY` or `REQUEST_CHANGES` with evidence in the PR/report.
- Green CI plus that recorded independent reviewer decision is sufficient when GitHub branch protection does not technically require a native approval. If it does, obtain a genuinely distinct authorized GitHub approval; never simulate or falsely claim one.
- Owner involvement remains required for production/VPS, secrets, costs, destructive migrations, legal/privacy issues, live integrations, actual backfill/reconciliation/switch/cleanup, and unresolved critical/canonical conflicts.

## 2.3 P1.2a mapping validation dry run

- Run only against a sanitized local JSON snapshot; it accepts record IDs, statuses, role keys, and explicit proposed `tenantId` to `workspaceId` mappings. Do not include names, e-mail addresses, client notes, credentials, or connection strings.
- `npm.cmd run -w @dca-os-v1/data workspace:mapping:dry-run -- --snapshot <sanitized-snapshot.json> --format json`
- Output is always labeled `DRY_RUN_ONLY` / `NO DATA MUTATION`. The tool has no database client and rejects `--apply`, `--execute`, and equivalent mutation flags.
- Exit `0` means validation passed; `2` means unresolved mapping blockers; `64` means invalid or execution-like arguments; `65` means invalid snapshot input. A passing report is preparation evidence only—it does not authorize backfill, reconciliation execution, a switch, cleanup, database deployment, or Workspace runtime authority.

## 2.4 P1.3a reconciliation preparation

- `npm.cmd run -w @dca-os-v1/data workspace:reconciliation:prepare -- --snapshot <sanitized-snapshot.json> --format json`
- The comparison is read-only and rejects reconciliation, apply, switch, write, mutation, backfill, cleanup, and unsupported flags. Snapshot input requires uniquely identified, structurally valid expected Workspace state. Both feature flags remain OFF; the output contains only evidence and a future rollback plan.

## 2.5 P1.4a local staging-like rehearsal and execution-gate packet

- `npm.cmd run -w @dca-os-v1/data workspace:staging-rehearsal:prepare -- --snapshot <sanitized-snapshot.json> --format json`
- Input is a local sanitized packet containing the P1.2a/P1.3a snapshot and declared evidence references. Never include names, e-mail addresses, notes, credentials, tokens, connection strings, URLs, real staging/production data, or a caller-supplied commit/diff identity.
- The tool derives P1.2a/P1.3a results, records deterministic SHA-256 input hashes, and derives exact local `HEAD` plus SHA-256 `git diff --binary HEAD` identity itself. It fails closed for missing/failed evidence or execution-like flags including apply, execute, approve, reconcile, switch, backfill, and cleanup.
- Complete preparation evidence is a prerequisite for the owner-authorized local execution package. That approved local package is complete; do not use this preparation command to begin Phase 2 or expand endpoint authority beyond `LOCAL_ONLY`.

## 2.6 P2-A owner-decision boundary

- `PHASE_2=NOT_STARTED`; P2-01 approves only the future P2-A population definition: exactly one existing active Tenant from local source `127.0.0.1:5434` and all of that Tenant's active Clients, active TenantMemberships, and active ClientUserAccess records.
- Any future P2-A package must consume only an anonymized offline snapshot and produce a deterministic population manifest/hash. It must not connect to a database, create a snapshot in this package, mutate data, run backup/backfill/reconciliation, change Workspace authority, alter feature flags or endpoint authority, or touch remote, staging, production, VPS, or Tellanic.
- P2-02 is decided: keep the six no-role memberships excluded and untouched, classify them as `OWNER_REMEDIATION_REQUIRED`, infer no default role, grant no access, and make no data or runtime change. This is documentation-only; Phase 2 remains `NOT_STARTED`, and no backfill, reconciliation, switch, cleanup, or other data operation is authorized.
- P2-A implementation-ready is authorized with seven owner decisions: only an owner-prepared anonymized offline file may be accepted in a later authorized run; exactly one active Tenant is owner-selected and represented only by a pseudonymous label/hash; snapshot/evidence remain outside Git at `C:\dcaosv1-p2-evidence` without cloud sync or automatic deletion; completeness, mapping, and exception validation is fail-closed; the six known no-role records are `OWNER_REMEDIATION_REQUIRED` and new exceptions require a new decision; `ClientUserAccess` count/hash remains unchanged and authoritative; and future P2-B/C preparation is localhost-only (`127.0.0.1:5434` / isolated restore `127.0.0.1:5435`) with owner-controlled resume/rollback. Codex must never create a snapshot or connect to a database. This writeback and its tests use synthetic fixtures only and consume no snapshot. Flags remain OFF, Phase 3 cannot start from reconciliation, and no snapshot processing, mutation, backfill, reconciliation, switch, cleanup, or remote/staging/production/VPS action is authorized by this writeback.

## 3. What validate is expected to prove

- Prisma client generation
- workspace type checks
- workspace builds

Validate does **not** by itself prove runtime behavior, browser flows, or external integrations.

## 4. Local auth and secret guardrails

- Local admin e-mail: `admin@dca.local`
- Use `$env:AUTH_SEED_TEST_PASSWORD` for local smoke only
- Never print or persist passwords, tokens, or `.env` values
- If required credentials are missing, stop and ask for them as temporary process environment variables

## 5. Smoke guardrails

- Never run smoke after a failed `validate`.
- Start local API/web only when the scoped validation actually needs them.
- If backend/API proof passes but UI proof fails, compare payload/form state against the backend contract before changing either side.
- Current UI baseline for smoke expectations is merge commit `998c294` / `PR #55`.

## 6. Current retained operator references

| Topic | Current reference |
|---|---|
| Local smoke catalog | [`../runbooks/LOCAL_SMOKE_MATRIX.md`](../runbooks/LOCAL_SMOKE_MATRIX.md) |
| Admin recovery | [`../runbooks/ADMIN_OPERATIONS_RECOVERY.md`](../runbooks/ADMIN_OPERATIONS_RECOVERY.md) |
| Backup / restore | [`../runbooks/BACKUP_RESTORE_PROCEDURE.md`](../runbooks/BACKUP_RESTORE_PROCEDURE.md) |
| Production deployment | [`../runbooks/PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md) |
| Production rollback | [`../runbooks/PRODUCTION_ROLLBACK.md`](../runbooks/PRODUCTION_ROLLBACK.md) |
| Production safety | [`../runbooks/PRODUCTION_SAFETY_CHECKLIST.md`](../runbooks/PRODUCTION_SAFETY_CHECKLIST.md) |
| Security boundary | [`../security/SECURITY_BOUNDARY_AUDIT.md`](../security/SECURITY_BOUNDARY_AUDIT.md) |
| Deferred scope register | `./deferred-scope-register.md` (archived reference; see Git history) |

## 7. WordPress and integrations boundary

- Current WordPress claim is prepared-draft/local handoff only.
- Live HTTP WordPress draft/publish remains outside current canonical capability.
- GA4/GSC live integration is withdrawn; manual import is not implemented.

## 8. Phase 1 local execution closeout

Status: **PHASE_1_COMPLETE / LOCAL_EXECUTION_EVIDENCE_VERIFIED**. P1.1 and P1.2a–P1.4a are COMPLETE; P1.2b–P1.4b are COMPLETE for the approved local scope. `PR #67` merged at `55baa03d39e85819ea257127b18bc8f9094701a0` and `PR #68` merged at `a8caea74b440e8fa9311e1c09ba24febd7f29a44`; merge and post-merge CI PASS. Restore rehearsal PASS on `127.0.0.1:5435`; source `127.0.0.1:5434` migrations, backfill, reconciliation, idempotent rerun, and endpoint permission/isolation proof PASS. The result is 1 Workspace and 7 memberships (1 ADMIN, 6 CLIENT_USER), with six no-role exceptions excluded and Client/UserAccess hashes unchanged. Endpoint authority and feature flag remain `LOCAL_ONLY`; production/VPS, remote staging/database, cleanup, Tellanic, and Phase 2 remain forbidden.
