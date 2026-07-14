# G50 Controlled Production Deploy Ã¢â‚¬â€ `c5e03eb` Result (2026-07-14)

**Gate:** `G50_PRODUCTION_DEPLOY_EXECUTION`
**Mode:** `CONTROLLED_PRODUCTION_PROMOTION_WITH_AUTOMATIC_ROLLBACK`
**Owner approval received:** yes (`proceed` on exact c5e03eb proposal)
**Classification:** `PASS`

```text
PRODUCTION_DEPLOY_AUTHORIZED=yes   # for this completed G50 scope only
COMMIT_DONE=no
PUSH_DONE=no
```

## Identities

| Role | Value |
|------|-------|
| Local/main tip | `e5eb08f96a9ded05f5e091a821b90046160c0650` (docs/closeout; not runtime candidate) |
| Production candidate | `c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5` |
| Starting production | `57f9c524118a5bf6c93270626cef7c8bd52d140b` |
| Final production | `c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5` |
| Source staging artifact | `/opt/dca/staging-artifacts/c5e03eb` |
| Production artifact | `/opt/dca/production-artifacts/c5e03eb` |
| Rollback artifact | `/opt/dca/production-artifacts/57f9c52` |
| Candidate image | `app-dcaosv1-api:c5e03eb` Ã¢â€ â€™ `sha256:5a3515acfc053040f76a5c31d9894e7801253c6b5a71e469c2250a446bb02c54` |
| Rollback image retained | `app-dcaosv1-api:57f9c52` Ã¢â€ â€™ `sha256:bd61d5deb3310b5caa18afb2879c0361b4afe10775260392ae697a91ae6ab44f` |
| Deploy stamp | `20260714T155227Z` |

## Fresh backups (pre-mutation)

| Backup | Path | Result |
|--------|------|--------|
| DB | `/opt/dca/backups/production-db-before-c5e03eb-20260714T155227Z.dump` | 362152 bytes; `pg_restore --list` PASS (805 lines) |
| Web | `/opt/dca/backups/production-web-dist-before-c5e03eb-20260714T155227Z` | 4 files; old assets `index-DX4AMrb2.js` / `index-i_JTDDN4.css` |
| Compose | `/opt/dca/backups/docker-compose.production-api-only.yml.before-c5e03eb-20260714T155227Z` | SHA-256 match |
| Env | `/opt/dca/backups/production-env.before-c5e03eb-20260714T155227Z` | SHA-256 match; mode `600` |
| Baseline | `/opt/dca/backups/PRODUCTION_G50_BASELINE_C5E03EB_20260714T155227Z.txt` | created |

## Migration

```text
SCHEMA_DELTA=none
MIGRATION_FILES_IN_RANGE=none
MIGRATION_DEPLOY_REQUIRED=no
MIGRATION_DECISION=SKIP
MIGRATION_DONE=no
PRODUCTION_MIGRATION_STATUS_REFRESHED=no
```

## Runtime mutation summary

1. Copied staging artifact Ã¢â€ â€™ `/opt/dca/production-artifacts/c5e03eb` (recursive match before marker).
2. Built `app-dcaosv1-api:c5e03eb`; tagged `latest`.
3. Recreated **only** `dcaosv1-api` via `docker-compose.production-api-only.yml` with `--no-deps --force-recreate --no-build`.
4. Synced staging-proven web dist (`/opt/dca/apps/dcaosv1/staging/web/dist`) into production `apps/web/dist` in place (`rsync -a --delete`; inode preserved).
5. PostgreSQL and Caddy untouched.

## Validation

| Check | Result |
|------|--------|
| Production root/health/HSTS | 200 / ready / yes |
| Production loopback | 200 / ready |
| Production assets | `index-WQ-90c5f.js` + `index-BNmstedn.css` HTTP 200 |
| Unauthenticated SPA boot | PASS |
| Login page render (no login) | PASS |
| Fatal console / page exceptions | 0 / 0 |
| Staging root/health/assets | healthy; still `c5e03eb` assets |
| Container/port separation | PASS (4010/5434 vs 4011/5435) |
| Observation window | PASS; unexpected API errors 0; migration attempts 0; no secret leakage |

Success marker: `/opt/dca/backups/PRODUCTION_G50_C5E03EB_SUCCESS_20260714T155227Z.txt`

## Guards preserved

```text
PRODUCTION_FIRST_RUN_STATE=CLEAN_FIRST_RUN_OWNER_SETUP
PRODUCTION_ACTIVE_CLIENTS=0
PRODUCTION_SETUP_MUTATED=no
PRODUCTION_CLIENT_CREATED=no
LIVE_PROVIDER_CALLS=0
EMAIL_SENT=no
R2_IO_DONE=no
WORDPRESS_PUBLISH_DONE=no
IMAGE_GENERATION_DONE=no
GA4_GSC_STATUS=withdrawn
CADDY_TOUCHED=no
DNS_TOUCHED=no
ROLLBACK_TRIGGERED=no
```

## Next gate

```text
NEXT_GATE=G50_POST_DEPLOY_PRODUCTION_PROOF_AND_CLOSEOUT
```

Puriva Launch not claimed. Docs left unstaged; no commit/push.

## Follow-up (2026-07-14 post-deploy proof)

Post-deploy read-only proof classified **PARTIAL** (infrastructure PASS; production owner authenticated browser proof `not_available` via harness). See [`G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md`](./G50_POST_DEPLOY_PRODUCTION_PROOF_C5E03EB_RESULT_2026-07-14.md).

---

## Machine-readable closeout

GATE=G50_PRODUCTION_DEPLOY_EXECUTION
CLASSIFICATION=PASS
FINAL_PRODUCTION_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
FINAL_PRODUCTION_RUNTIME_PROVEN=yes
DEPLOY_DONE=yes

---

## Post-deploy closeout follow-up - 2026-07-15

POST_DEPLOY_RUNTIME_PROOF=PASS
POST_DEPLOY_AUTH_PROOF=PARTIAL_NOT_AVAILABLE
POST_DEPLOY_AUTH_RESIDUAL_ACCEPTED=yes
AUTH_RESIDUAL_BLOCKING=no
POST_DEPLOY_PRODUCTION_PROOF_CLOSED=yes
FINAL_PRODUCTION_RUNTIME=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
ROLLBACK_REQUIRED=no
REDEPLOY_REQUIRED=no
