# Staging Local Execution Pack

**Status:** Local-side readiness pack. Does **not** authorize VPS execution, DNS, Caddy, Docker apply, or migrations.

**Purpose:** Checklists and decision templates to complete locally before owner approves Block G4 VPS staging execution.

Related:

- [`STAGING_READINESS.md`](./STAGING_READINESS.md) — Block A GO / NO-GO pack (env, smoke subset, manual QA, deferred non-blockers)
- [`docs/deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) — G4 VPS approval artifact (separate gate)
- [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — local repo closeout
- [`PRE_STAGING_CLIENT_DELIVERY_READINESS.md`](./PRE_STAGING_CLIENT_DELIVERY_READINESS.md) — client delivery proof
- [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md) — smoke order and requirements
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md) — env names
- [`STAGING_MIGRATION_PROCEDURE.md`](./STAGING_MIGRATION_PROCEDURE.md) — migration procedure (execute at G4 only)

**G1 context:** Staging host `staging.digitalcubeagency.net`; production `system.digitalcubeagency.net`; same VPS, separate stack; DNS **not created**; G4 **not approved**.

---

## 1. Pre-staging local checklist (repo-side)

Complete before requesting G4 approval.

| # | Item | Evidence | Owner gate |
|---|------|----------|------------|
| 1 | `main` synced; PR #30 merged at `3089c32` | `git log -1` on `main` | — |
| 2 | `npm.cmd run check` PASS | Command output | — |
| 3 | `npm.cmd run validate` PASS (no EPERM) | Command output | Stop dev node if EPERM |
| 4 | `npm.cmd run smoke:pre-staging:local` PASS | Orchestrator green | External PowerShell |
| 5 | Client delivery subset PASS | [`PRE_STAGING_CLIENT_DELIVERY_READINESS.md`](./PRE_STAGING_CLIENT_DELIVERY_READINESS.md) | Optional focused rerun |
| 6 | E2E admin chain PASS | [`E2E_CLIENT_DELIVERY_SMOKE.md`](./E2E_CLIENT_DELIVERY_SMOKE.md) | Optional focused rerun |
| 7 | No secrets in diff or logs | Review | — |
| 8 | Env inventory reviewed | [`ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md) | Staging values prepared server-side |
| 9 | Deferred scope acknowledged | [`deferred-scope-register.md`](../operator/deferred-scope-register.md) | — |
| 10 | Staging smoke production-host guard | Negative test below | PASS-by-blocking (nonzero exit) |

**Pre-G4 production-host guard rehearsal (local only, no VPS):**

```powershell
cd C:\dcaosv1
$env:MVP_SMOKE_API_BASE_URL = "https://system.digitalcubeagency.net/api/v1"
node scripts/smoke-mvp-local.mjs --staging
Remove-Item Env:MVP_SMOKE_API_BASE_URL
```

Expected: `FAIL staging API target` with exit code `1`. Production URL must not be accepted in `--staging` mode. A nonzero exit here is **PASS-by-blocking**, not a smoke failure.

---

## 2. Deploy readiness checklist (G4 — docs only until approved)

Do not execute VPS steps until owner approves G4.

| # | Item | Notes |
|---|------|-------|
| 1 | Exact commit SHA pinned | Must match green CI on that commit |
| 2 | Staging DNS A record plan | `staging.digitalcubeagency.net` — create at G4 prep only |
| 3 | Separate staging PostgreSQL | No production/client data |
| 4 | Staging env file prepared on server | Names in ENV inventory; values masked |
| 5 | Block 4 `CREDENTIAL_ENCRYPTION_MASTER_KEY` | Staging-only key |
| 6 | Block 5 WordPress publish policy | Draft-only / disabled until owner opens |
| 7 | Block 6 `TENANT_MODULE_ENFORCEMENT` | Start `dry_run` or `off`; enforce = separate gate |
| 8 | Docker Compose review | Per VPS pack — owner approves before apply |
| 9 | Caddy staging route review | Draft in VPS pack — apply at G4 only |
| 10 | Migration list reviewed | [`STAGING_MIGRATION_PROCEDURE.md`](./STAGING_MIGRATION_PROCEDURE.md) |
| 11 | Staging backup plan | Before any migration |
| 12 | Rollback plan documented | See §3 below |
| 13 | Client access remains blocked | No client users on staging until separate approval |

---

## 3. Rollback checklist (G4 execution — reference only)

| Step | Action |
|------|--------|
| 1 | Stop staging containers if unhealthy |
| 2 | Revert to previous recorded image/git revision |
| 3 | Restore staging DB from pre-migration backup if migration ran |
| 4 | Confirm production stack untouched |
| 5 | Re-run health on staging API |
| 6 | Record failure evidence; do not promote |

Stop conditions (from VPS pack): build fail, migration destructive prompt, health fail, smoke fail, secrets in logs, any production target hit.

---

## 4. Smoke order after deploy (G4 only)

Execute only after staging stack is up and migrations approved.

| Order | Command | Target |
|-------|---------|--------|
| 1 | API health | `GET https://staging.digitalcubeagency.net/api/v1/health` |
| 2 | Staging MVP smoke | `npm.cmd run smoke:mvp:staging` with explicit `MVP_SMOKE_API_BASE_URL` |
| 3 | Browser QA | HTTPS shell, login/logout, `/auth/me`, Team, Settings — manual checklist in VPS pack |
| 4 | Optional focused smokes | Owner-selected; do not run full local orchestrator against staging without approval |

Local smoke orchestrator (`smoke:pre-staging:local`) is for **local** repo closeout only.

---

## 5. Go / no-go decision template

Record after local pack complete (before G4 request):

```text
Date:
Commit SHA:
Branch: main

LOCAL STAGING READINESS (repo-side)
[ ] check PASS
[ ] validate PASS
[ ] smoke:pre-staging:local PASS
[ ] client delivery readiness PASS (or N/A with reason)
[ ] no secrets in evidence

DECISION: READY FOR G4 REQUEST / NOT READY / BLOCKED

Blockers:
Evidence links (commands only, no secrets):

Owner: ___________________   Date: ___________
```

G4 execution approval uses the separate template in [`VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md).

---

## 6. Owner gates (summary)

| Gate | Status | Unlocks |
|------|--------|---------|
| G1 staging target | **Closed** | Host name `staging.digitalcubeagency.net` |
| G4 VPS execution | **Not approved** | Deploy, DNS, Caddy, staging migrations |
| Block 4 staging master key | Pending | Encrypted publication credentials on staging |
| Block 5 live WordPress | Pending | Real publish (draft-only policy first) |
| Block 6 staging enforce | Pending | `TENANT_MODULE_ENFORCEMENT=enforce` on staging |
| Client access on staging | Blocked | Real client login on staging host |
| Production deploy | Frozen | `system.digitalcubeagency.net` unchanged |

---

## Explicitly out of scope for this pack

- VPS login, pull, compose apply, Caddy reload
- DNS record creation (except documenting requirement)
- Staging migration execution
- Production changes
- Live provider cost unless owner-approved staging probe
- Real WordPress publish unless owner-approved staging block
