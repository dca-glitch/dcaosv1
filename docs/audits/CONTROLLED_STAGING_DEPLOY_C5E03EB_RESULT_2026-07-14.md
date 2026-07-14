# Controlled Staging Deploy Result Ã¢â‚¬â€ c5e03eb

**Gate:** `CONTROLLED_STAGING_DEPLOY_EXECUTION`
**Date:** 2026-07-14
**Classification:** `PASS`
**Owner approval:** yes (post self-check PASS)

---

## Target

```text
TARGET_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
TARGET_ARTIFACT=/opt/dca/staging-artifacts/c5e03eb
BRANCH=main
```

## Starting baseline

```text
STARTING_STAGING_COMMIT=80569c68f94481b33dd0a3c2a5a3ec17b41e31cd
STARTING_STAGING_ARTIFACT=/opt/dca/staging-artifacts/80569c6
PRIMARY_ROLLBACK=/opt/dca/staging-artifacts/80569c6
OLDER_ROLLBACK=/opt/dca/staging-artifacts/632d9a9
```

## What was done

1. Local validate PASS; git archive artifact created (SHA-256 `3b1f7b6cÃ¢â‚¬Â¦71a9`, 11Ã¢â‚¬Â¯653Ã¢â‚¬Â¯120 bytes).
2. Artifact uploaded and extracted to `/opt/dca/staging-artifacts/c5e03eb` with `ARTIFACT_MARKER.txt`.
3. Staging DB dump, web/dist content backup, and compose backup created under `/opt/dca/apps/dcaosv1/staging/backups` (stamp `20260714-222321`).
4. Compose API `context` updated `80569c6` Ã¢â€ â€™ `c5e03eb` (single intended line).
5. Built and recreated **only** `dcaosv1-staging-api` (`--no-deps`). Migration SKIP (`SCHEMA_DELTA=none`).
6. Synced local `apps/web/dist` into existing mounted `web/dist` via `rsync -a --delete` (mount inode preserved).
7. Public root now serves `index-WQ-90c5f.js` / `index-BNmstedn.css`.

## Proofs

| Check | Result |
|-------|--------|
| Loopback health `:4011` | 200, database ready |
| Public staging health | 200 |
| Public staging root | 200 (new build) |
| Static assets | 200 |
| Production health-only | 200 |
| Container/port separation | PASS (`4011`/`5435` vs `4010`/`5434`) |
| Caddy | Untouched (still Up from prior) |
| `smoke:mvp:staging` | PASS |
| `smoke:staging-security-baseline` | PASS (32/32) |
| Playwright browser vs staging host | PARTIAL Ã¢â‚¬â€ authenticated admin is redirected to first-run `#/setup` (company profile incomplete on staging tenant). Auth injection and SPA boot work; MI/cockpit route proofs blocked by setup gate, not by auth defect. Harness now fails with explicit setup-gate message. |

## Intentionally not done

- Prisma migrations
- Production mutation
- Caddy restart/reload
- Live provider proofs
- Commit / push

## Backups (rollback safety)

```text
DB=/opt/dca/apps/dcaosv1/staging/backups/staging-db-before-c5e03eb-20260714-222321.dump (388314 bytes)
WEB=/opt/dca/apps/dcaosv1/staging/backups/web-dist-before-c5e03eb-20260714-222321
COMPOSE=/opt/dca/apps/dcaosv1/staging/backups/docker-compose.staging.yml.before-c5e03eb-20260714-222321
EVIDENCE=/opt/dca/apps/dcaosv1/staging/backups/STAGING_CONTROLLED_DEPLOY_C5E03EB_20260714-222321.txt
```

## Final runtime

```text
FINAL_STAGING_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
FINAL_STAGING_ARTIFACT=/opt/dca/staging-artifacts/c5e03eb
COMPOSE_CONTEXT=/opt/dca/staging-artifacts/c5e03eb
MIGRATION_DONE=no
CADDY_TOUCHED=no
PRODUCTION_TOUCHED=no
```

## Docs

- `docs/STATUS.md` tip / next gate updated to `c5e03eb` staging COMPLETE
- `docs/runbooks/STAGING_READINESS.md` current baseline updated
- Historical records not rewritten

## Next gate

```text
NEXT_GATE=POST_DEPLOY_STAGING_PROOF_RECHECK
```

Production remains frozen. GA4/GSC withdrawn. Notification E2E deferred non-blocking.

## Follow-up (2026-07-14 Ã¢â‚¬â€ do not rewrite historical deploy result)

Post-deploy browser recheck diagnosed the `#/setup` company-profile gate; setup completion + authenticated browser proof subsequently closed as **PASS** on the same runtime `c5e03eb` without redeploy/migration. See [`STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF_C5E03EB_RESULT_2026-07-14.md`](./STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF_C5E03EB_RESULT_2026-07-14.md).

---

## Machine-readable closeout

GATE=CONTROLLED_STAGING_DEPLOY_EXECUTION
CLASSIFICATION=PASS
FINAL_STAGING_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
CONTROLLED_STAGING_DEPLOY_COMPLETE=yes
