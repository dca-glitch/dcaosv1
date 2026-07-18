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
- Complete preparation evidence is a prerequisite for the owner-authorized local execution package; execution remains pending until backup, restore, rehearsal, drift, and review gates pass.

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

## 8. P1.2b–P1.4b pre-execution gate

Status: **OWNER_EXECUTION_AUTHORIZED_LOCAL_ONLY / EXECUTION_PENDING_EVIDENCE**. Use only source `127.0.0.1:5434` and separate restore/rehearsal `127.0.0.1:5435`. Create and hash the backup, verify restore, and complete rehearsal before source mutation. Validate exact `legacyTenantId` mapping, approved role counts, six excluded no-role memberships, ClientUserAccess hashes, orphan/cross-tenant checks, writer/drift gate, and rollback plan. The sole switch is `GET /api/admin/workspaces/:workspaceId`; active ADMIN and WORKSPACE_MANAGER allow, all other roles and cross-workspace access deny. Keep feature flag OFF until reconciliation passes, and never automatically overwrite source. Production/VPS, remote staging/database, cleanup, global Workspace authority, and Tellanic remain forbidden.
