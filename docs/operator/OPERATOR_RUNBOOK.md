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
