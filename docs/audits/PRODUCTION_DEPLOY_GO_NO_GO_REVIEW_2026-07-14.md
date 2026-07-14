# Production Deploy GO / NO-GO Review â€” 2026-07-14

**Gate:** `PRODUCTION_DEPLOY_GO_NO_GO_REVIEW`
**Formal gate:** `G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF`
**Mode:** `READ_ONLY_PRODUCTION_DISCOVERY_AND_DECISION`
**Owner approval received:** yes (this read-only review only)
**Classification:** `CONDITIONAL_GO`

```text
PRODUCTION_DEPLOY_AUTHORIZED=no
```

## Decision summary

Promote the **exact staging-proven runtime** `c5e03eb` only â€” not `01b7e04`.
`01b7e04` is docs + browser-harness closeout on `main`; runtime/product delta from `c5e03eb` is **none**.

Recommendation: **CONDITIONAL_GO** toward a separately owner-approved **G50** that must complete fresh production backups and explicit migration **SKIP** before the first production mutation.

## Local Git preflight

| Check | Result |
|------|--------|
| Branch | `main` |
| Local HEAD | `01b7e04ef7701acd7e6bfe72e00721f2c8c771b1` |
| `origin/main` | same |
| Ahead/behind | `0 0` |
| Tracked tree | clean |
| Staged files | 0 |
| Git ops (merge/rebase/cherry/revert) | none |
| Owner untracked (11) | preserved |
| `git diff --check` | PASS |

Latest five commits:

```text
01b7e04 test: close staging deploy browser proof
c5e03eb fix: complete final local quality verification
e0ddcee feat(ui): complete Wave 4 state and table consolidation
284915a feat(ui): complete Wave 3 visual-system convergence
1194026 docs: reconcile post-Wave 2 residual backlog
```

## Candidate identity

```text
STAGING_PROVEN_RUNTIME=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
LOCAL_CLOSEOUT_HEAD=01b7e04ef7701acd7e6bfe72e00721f2c8c771b1
PRODUCTION_CANDIDATE_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
CANDIDATE_SELECTION_REASON=promote_exact_staging_proven_runtime
C5E03EB_TO_01B7E04_RUNTIME_DELTA=none
```

Name-status delta `c5e03eb..01b7e04` (exact expected set):

- `docs/STATUS.md`
- `docs/runbooks/STAGING_READINESS.md`
- `docs/audits/CONTROLLED_STAGING_DEPLOY_C5E03EB_RESULT_2026-07-14.md`
- `docs/audits/POST_DEPLOY_STAGING_PROOF_RECHECK_C5E03EB_RESULT_2026-07-14.md`
- `docs/audits/STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF_C5E03EB_RESULT_2026-07-14.md`
- `scripts/smoke-admin-daily-cockpit-browser-local.mjs`
- `scripts/smoke-mi-operator-browser-local.mjs`

No delta in `apps/`, `packages/`, `package.json`, `package-lock.json`, `Dockerfile*`, `docker-compose*`.

## CI

| Commit | Workflow | Run | Conclusion |
|--------|----------|-----|------------|
| `01b7e04` | CI | `29345118723` | success â†’ `MAIN_HEAD_CI_STATUS=PASS` |
| `c5e03eb` | CI | `29338750262` | success â†’ `CANDIDATE_CI_STATUS=PASS` |

## Public probes (this gate)

| Target | HTTP | HSTS | DB |
|--------|------|------|----|
| Staging root | 200 | yes | n/a |
| Staging health | 200 | yes | ready |
| Production root | 200 | yes | n/a |
| Production health | 200 | yes | ready |

Loopback (SSH host): production `4010` = 200; staging `4011` = 200.

## SSH identity / containers

```text
REMOTE_USER=deploy
REMOTE_HOSTNAME=DCA01
REMOTE_UTC=2026-07-14T15:31:55Z
SSH_IDENTITY_PASS=yes
```

| Container | Image | Status | Ports |
|-----------|-------|--------|-------|
| `dcaosv1-api` | `app-dcaosv1-api:latest` (= `57f9c52` / `bd61d5deb331`) | Up | `127.0.0.1:4010->4000` |
| `dcaosv1-postgres` | `postgres:16-bookworm` | healthy | `127.0.0.1:5434->5432` |
| `dcaosv1-staging-api` | `staging-dcaosv1-staging-api:latest` | Up | `127.0.0.1:4011->4000` |
| `dcaosv1-staging-postgres` | `postgres:16-bookworm` | healthy | `127.0.0.1:5435->5432` |
| `dca-caddy` | `caddy:2-alpine` | Up | 80/443 |

```text
CONTAINER_SEPARATION_PASS=yes
PORT_SEPARATION_PASS=yes
```

## Production runtime proof (live structure)

```text
CURRENT_PRODUCTION_COMMIT=57f9c524118a5bf6c93270626cef7c8bd52d140b
CURRENT_PRODUCTION_ARTIFACT=/opt/dca/production-artifacts/57f9c52
CURRENT_PRODUCTION_API_IMAGE=app-dcaosv1-api:latest (= app-dcaosv1-api:57f9c52 / bd61d5deb331)
PRODUCTION_COMPOSE_PATH=/opt/dca/apps/dcaosv1/app/docker-compose.production-api-only.yml
PRODUCTION_WEB_DIST=/opt/dca/apps/dcaosv1/app/apps/web/dist
PRODUCTION_BACKUP_DIRECTORY=/opt/dca/backups
```

Markers (sanitized):

- `ARTIFACT_MARKER.txt` / `PRODUCTION_ARTIFACT_MARKER.txt` â†’ `SOURCE_SHA=57f9c52â€¦`, promoted from staging `57f9c52`, purpose `production`.
- Retained image tags: `app-dcaosv1-api:57f9c52`, `app-dcaosv1-api:pre-57f9c52-20260713T050725Z`.

Compose structural lines only: `container_name: dcaosv1-api`, `image: app-dcaosv1-api:latest`, `env_file â†’ .env`, ports `127.0.0.1:4010:4000`. No `staging-artifacts` reference.

## Candidate artifacts

```text
STAGING_CANDIDATE_ARTIFACT_EXISTS=yes   # /opt/dca/staging-artifacts/c5e03eb (MIGRATION=SKIP)
PRODUCTION_CANDIDATE_ARTIFACT_EXISTS=no # /opt/dca/production-artifacts/c5e03eb absent (expected)
CANDIDATE_ARTIFACT_COLLISION=not_applicable
```

No `.env` / `.env.staging` / `.env.production` inside staging `c5e03eb` or production `57f9c52` artifacts.

## Schema / migration

Git range `57f9c52..c5e03eb` for Prisma schema + migrations: **empty**.

```text
SCHEMA_DELTA=none
MIGRATION_FILES_IN_RANGE=none
MIGRATION_DEPLOY_REQUIRED=no
PRODUCTION_MIGRATION_STATUS_PROOF=PARTIAL
PRODUCTION_FINISHED_MIGRATIONS=50   # historical STATUS claim â€” not live-refreshed this gate
PRODUCTION_UNFINISHED_MIGRATIONS=0  # historical STATUS claim â€” not live-refreshed this gate
```

G50 must **explicitly SKIP** migration. A fresh read-only migration-status refresh is a recommended G50 pre-mutation condition (no credential printing).

## Rollback / backups

```text
CURRENT_PRODUCTION_BASELINE_IDENTIFIED=yes
PREVIOUS_PRODUCTION_ROLLBACK_BASELINE_IDENTIFIED=yes
PRODUCTION_DB_BACKUP_HISTORY_PRESENT=yes
PRODUCTION_WEB_BACKUP_HISTORY_PRESENT=yes
PRODUCTION_CONFIG_BACKUP_HISTORY_PRESENT=yes
G50_FRESH_BACKUP_REQUIRED=yes
DISK_CAPACITY_STATUS=PASS   # /opt/dca ~56% used, ~32G avail
```

Historical evidence under `/opt/dca/backups` includes prod DB dumps, web-dist backups, compose/env name-only backups from `57f9c52` deploy and clean-reset windows. **Not** a substitute for fresh pre-G50 backups. Restore drill remains procedure-level (`PRODUCTION_ROLLBACK.md`), not newly executed.

## Env / secret separation

```text
ENV_FILE_SEPARATION_PASS=yes
COMPOSE_PATH_SEPARATION_PASS=yes
DATABASE_TARGET_SEPARATION_PASS=yes
ARTIFACT_PATH_SEPARATION_PASS=yes
TRACKED_SECRET_SCAN_PASS=yes
```

- Production: `/opt/dca/apps/dcaosv1/app/.env` via production-api-only compose.
- Staging: `/opt/dca/apps/dcaosv1/staging/.env.staging` via staging compose; build context `/opt/dca/staging-artifacts/c5e03eb`.
- Prod compose does not reference staging artifacts; staging compose does not reference production artifacts.
- Repo tracked secrets: no real `.env`; `.env.example` only.

Values were **not** read or printed.

## Production tenant boundary

```text
PRODUCTION_FIRST_RUN_STATE=CLEAN_FIRST_RUN_OWNER_SETUP
PRODUCTION_ACTIVE_CLIENTS=0
PRODUCTION_AUTHENTICATED_BOUNDARY_PROOF=NOT_RUN_READ_ONLY_GATE
```

Docs + prior clean-state reset; no production setup mutation; no production authenticated browser test in this gate. Staging tenant proofs remain supporting evidence only. Not a blocker for infrastructure promotion while clean first-run with zero active clients.

## Integration truth (production posture)

| Integration | Status |
|-------------|--------|
| AI provider | `disabled` / `configured_but_gated` (not production_proven) |
| Image generation | `disabled` / gated (staging_proven only) |
| R2 storage | `disabled` / gated (staging_proven only) |
| WordPress publish | `disabled` |
| Transactional email | `disabled` / gated (staging provider acceptance only) |
| In-app notifications | `deferred_non_blocking` |
| GA4/GSC | `withdrawn` |

No live provider calls performed. No uncontrolled live integration confirmed.

## G53 blocker matrix (current)

| # | Blocker | STATUS | EVIDENCE | G50_REQUIREMENT |
|---|---------|--------|----------|-----------------|
| 1 | HSTS / proxy | PASS | Public roots HSTS yes; Caddy running; G54 historical | none |
| 2 | Rollback / restore readiness | PASS_WITH_G50_CONDITION | Exact `57f9c52` artifact + tagged images + historical backups; restore drill not re-run | Fresh DB/web/compose backups; retain `57f9c52` as rollback |
| 3 | Env / secret separation | PASS | Separate compose paths, env filenames, DB ports, artifacts | Keep separation; no secret print |
| 4 | Credential storage | PASS | Separation + no secrets in artifacts; historical rotation recovered | Do not rotate in G50 unless separate approval |
| 5 | Tenant / client boundary | PASS | Clean first-run; 0 active clients; auth not re-tested on prod | No client/setup during deploy |
| 6 | Integration truth matrix | PASS | Disabled/gated/withdrawn/deferred | No live provider proofs in G50 |
| 7 | Controlled G49 dry-run | PASS | This gate | none |
| 8 | Gate sequence | PASS | G49 before G50 | Separate G50 owner sentence naming `c5e03eb` |

## Docs reconciliation notes

**Current facts (this gate):** main `@01b7e04`; staging proven `@c5e03eb`; production `@57f9c52`; G49 formal dry-run PASS with CONDITIONAL_GO; production unchanged.

**Historical:** older â€œG49 not executed / formal closure pendingâ€ prose in G49/G53/checklist STATUS snapshots through mid-July â€” superseded by this gate for **active** truth, left intact as history.

**Stale active risk:** STATUS header still emphasized post-staging closeout as next; this review updates active next gate to G50 owner approval.

**Scope rules unchanged:** GA4/GSC withdrawn; notifications deferred non-blocking; paid ads out of scope; Puriva Launch separate.

## Proposed G50 plan (output only â€” NOT EXECUTED)

```text
PRODUCTION_CANDIDATE_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
SOURCE_STAGING_ARTIFACT=/opt/dca/staging-artifacts/c5e03eb
PRODUCTION_TARGET_ARTIFACT=/opt/dca/production-artifacts/c5e03eb
CURRENT_PRODUCTION_ROLLBACK_ARTIFACT=/opt/dca/production-artifacts/57f9c52
```

Required steps (future gate only):

1. New explicit owner sentence authorizing **G50** and naming **`c5e03eb`**.
2. Reconfirm candidate CI PASS and all public health endpoints.
3. Fresh production DB backup.
4. Fresh production web-dist backup.
5. Fresh production compose/config backup (no secret values in logs).
6. Record exact rollback refs: artifact `57f9c52`, image `app-dcaosv1-api:57f9c52` / `bd61d5deb331`.
7. Migration decision: **SKIP** (`SCHEMA_DELTA=none`); optionally refresh read-only migrate status without printing credentials.
8. Create SHA-pinned `/opt/dca/production-artifacts/c5e03eb` without overwrite.
9. Recreate **only** `dcaosv1-api`.
10. Keep `dcaosv1-postgres` running (no migration).
11. Sync web assets into mounted `/opt/dca/apps/dcaosv1/app/apps/web/dist`.
12. Do not touch Caddy by default.
13. Immediate production health proof.
14. Staging health + separation proof.
15. Automatic rollback on health/asset/separation failure.
16. No provider live proofs.
17. No production client / `#/setup` completion during deploy.
18. Separate post-deploy proof + docs closeout.

No executable mutation script was generated in this gate.

## Mutations

```text
REMOTE_MUTATION_DONE=no
DATABASE_MUTATION_DONE=no
ARTIFACT_CREATED=no
ARTIFACT_UPLOADED=no
DEPLOY_DONE=no
MIGRATION_DONE=no
CADDY_TOUCHED=no
STAGING_TOUCHED=no
PRODUCTION_TOUCHED=no
COMMIT_DONE=no
PUSH_DONE=no
```

## Next gate

```text
NEXT_GATE=G50_PRODUCTION_DEPLOY_EXECUTION_OWNER_APPROVAL
```

---

## Machine-readable closeout

GATE=PRODUCTION_DEPLOY_GO_NO_GO_REVIEW
FORMAL_GATE=G49_PRODUCTION_DRY_RUN_READ_ONLY_PROOF
CLASSIFICATION=CONDITIONAL_GO
PRODUCTION_CANDIDATE_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
CANDIDATE_CI_STATUS=PASS
G49_FORMAL_GATE_PASS=yes
PRODUCTION_DEPLOY_GO_RECOMMENDATION=conditional
PRODUCTION_DEPLOY_AUTHORIZED=no
NEXT_GATE=G50_PRODUCTION_DEPLOY_EXECUTION_OWNER_APPROVAL
