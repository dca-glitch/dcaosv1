# Production Dry-Run Pack (Puriva pre-production)

**Status:** Planning + safe probes only. **Does not mutate production.**  
**Date:** 2026-07-13  
**Related:** [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) · [`PRODUCTION_ROLLBACK.md`](./PRODUCTION_ROLLBACK.md) · [`G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md`](./G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF.md) · [`BACKUP_RESTORE_PROCEDURE.md`](./BACKUP_RESTORE_PROCEDURE.md)

---

## Release target

| Field | Value | Label |
|-------|-------|-------|
| `PRODUCTION_RELEASE_HEAD` | `096c073` (= `origin/main`) | PROVEN |
| `PRODUCTION_RUNTIME_CODE_SHA` | `9921bb3` (app-equivalent; tip is docs-only after RC) | PROVEN |
| Staging RC artifact | `/opt/dca/staging-artifacts/9921bb3` | PROVEN (docs) |
| Schema delta `9921bb3..096c073` | **none** | PROVEN |
| `MIGRATION` for tip vs RC | `SKIP` | PROVEN |
| Production schema vs tip | UNKNOWN without owner SSH `prisma migrate status` | NOT_PROVEN |
| Production | FROZEN | PROVEN |

---

## Phase A — Safe discovery (executed 2026-07-13)

Public probes (no SSH, no secrets):

| URL | Result |
|-----|--------|
| `https://staging.digitalcubeagency.net/api/v1/health` | HTTP 200, DB ready, HSTS |
| `https://system.digitalcubeagency.net/api/v1/health` | HTTP 200, DB ready, HSTS |
| Staging root | HTTP 200; assets `index-DY5z8SCD.js` / `index-i_JTDDN4.css` |
| Production root | HTTP 200 (distinct asset hashes) |

Log: `$env:TEMP\dca-prod-dryrun-A-public-*.log`

SSH read-only discovery (container IDs, compose paths, disk, live flags) = **NOT_PROVEN** in this run — requires owner SSH approval (G49 §6.3).

---

## Phase B–H summary

| Phase | Result |
|-------|--------|
| B Release target | READY — promote `9921bb3` tree (`096c073` docs tip) |
| C Migration dry-run | Tip vs RC = SKIP; prod lag needs owner status probe |
| D Artifact dry-run | Process documented; local build optional; do not switch prod |
| E Backup plan | PROVEN as procedure (container `pg_dump`, dist copy-in, image ID record) — not executed |
| F Rollback plan | PROVEN as procedure; production restore rehearsal NOT_PROVEN |
| G Deploy commands | READY — PowerShell 5.1 UTF-8 no BOM → scp → bash; no `exit`; Notepad log |
| H Go-live proof plan | READY — not executed |

---

## Mutation attestation

```text
PRODUCTION_APP_MUTATION=false
PRODUCTION_API_MUTATION=false
PRODUCTION_DB_MUTATION=false
PRODUCTION_WEB_MUTATION=false
SHARED_PROXY_ACTION=none
```

---

## Owner gate before any deploy

```text
BLOCKED_OWNER_ACTION=APPROVE_PRODUCTION_DEPLOY
```

Required owner sentence must name: gate G50, exact SHA (`9921bb3` or identical tree), backup paths ready, rollback path ready.

---

## Deploy command skeleton (DO NOT RUN without approval)

1. Verify local `git rev-parse HEAD` and `origin/main`
2. Write remote bash (UTF-8 no BOM, LF) to `$env:TEMP`
3. `scp.exe` upload
4. `ssh.exe … bash /tmp/….sh`
5. Capture stdout/stderr separately; open consolidated log in Notepad
6. Identity checks: hostname, container names, health `/api/v1/health`
7. Backup DB + dist + image IDs
8. Deploy only after literal owner approval
9. Health + staging separation proof
10. On failure: deterministic rollback only when previous image/dist known

Never use `exit` in owner PowerShell. Never print secrets. Never restart shared Caddy unless last-resort owner-approved.
