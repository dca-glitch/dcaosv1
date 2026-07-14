# G50 Post-Deploy Production Proof Ã¢â‚¬â€ `c5e03eb` (2026-07-14)

**Gate:** `G50_POST_DEPLOY_PRODUCTION_PROOF_AND_CLOSEOUT`
**Mode:** `READ_ONLY_RUNTIME_PROOF_AND_LOCAL_DOCS_CLOSEOUT`
**Classification:** `PARTIAL`

Reason for PARTIAL (non-blocking for infrastructure): production owner credentials are not available through the established harness (`AUTH_SEED_*` is staging/local). Production login endpoint rejected the seed credentials with HTTP 401 (auth endpoint live). Unauthenticated SPA/login render, runtime identity, health, backups, rollback retention, and staging separation all PASS. No setup mutation. No commit/push.

## Runtime identity

```text
FINAL_PRODUCTION_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
FINAL_PRODUCTION_ARTIFACT=/opt/dca/production-artifacts/c5e03eb
FINAL_PRODUCTION_IMAGE_TAG=app-dcaosv1-api:c5e03eb / latest
FINAL_PRODUCTION_IMAGE_ID=sha256:5a3515acfc053040f76a5c31d9894e7801253c6b5a71e469c2250a446bb02c54
PRODUCTION_RUNTIME_IDENTITY_PASS=yes
PRODUCTION_LATEST_TAG_MATCH=yes
```

Marker: `SOURCE_SHA=c5e03ebÃ¢â‚¬Â¦`, `MIGRATION=SKIP`, `GATE=G50`, `PURPOSE=production`.

## Health and assets

| Check | Result |
|------|--------|
| Production root / health / HSTS | 200 / ready / yes |
| Production loopback | 200 / ready |
| Production assets | `index-WQ-90c5f.js` + `index-BNmstedn.css` Ã¢â€ â€™ 200 |
| Staging root / health / assets | healthy; same `c5e03eb` assets |
| Staging still on `c5e03eb` compose context | yes |

## Rollback and backups

| Item | Result |
|------|--------|
| Rollback artifact `57f9c52` | retained |
| Rollback image `app-dcaosv1-api:57f9c52` (`bd61d5deb331Ã¢â‚¬Â¦`) | retained |
| DB backup 362152 bytes + `pg_restore --list` 805 lines | PASS |
| Web backup index + prior assets | retained |
| Compose backup SHA match current compose | yes |
| Env backup mode 600 | yes |
| Success + baseline evidence files | retained |

## Containers / separation

All required containers running; both Postgres healthy; ports 4010/5434 vs 4011/5435; Caddy up. Separation PASS.

## Migration

```text
SCHEMA_DELTA=none
MIGRATION_DECISION=SKIP
MIGRATION_DONE=no
PRODUCTION_MIGRATION_STATUS_REFRESHED=no
PRODUCTION_FINISHED_MIGRATIONS=50   # historical STATUS
PRODUCTION_UNFINISHED_MIGRATIONS=0  # historical STATUS
```

## Browser

Unauthenticated: SPA boot PASS; login page PASS; console errors 0; page exceptions 0; initial 5xx 0.

Authenticated owner: **not_available** Ã¢â‚¬â€ harness seed credentials are not production owner credentials (401 on `/auth/login`). Setup form not submitted. Setup not mutated.

## Logs

Recent API logs show clean start (`listening on port 4000`). No crash loop, migration attempt, provider call, or secret leakage observed.

## Guards

```text
PRODUCTION_FIRST_RUN_STATE=CLEAN_FIRST_RUN_OWNER_SETUP
PRODUCTION_ACTIVE_CLIENTS=0
PRODUCTION_SETUP_MUTATED=no
PRODUCTION_CLIENT_CREATED=no
PURIVA_LAUNCH_CLAIMED=no
GA4_GSC_STATUS=withdrawn
IN_APP_NOTIFICATIONS_STATUS=deferred_non_blocking
LIVE_PROVIDER_CALLS=0
CADDY_TOUCHED=no
```

## Mutations this gate

```text
REMOTE_MUTATION_DONE=no
DEPLOY_DONE=no
COMMIT_DONE=no
PUSH_DONE=no
```

## Next gate

```text
NEXT_GATE=OWNER_REVIEW_PARTIAL_PRODUCTION_AUTH_PROOF
```

---

## Machine-readable closeout

GATE=G50_POST_DEPLOY_PRODUCTION_PROOF_AND_CLOSEOUT
CLASSIFICATION=PARTIAL
PRODUCTION_RUNTIME_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
PRODUCTION_AUTH_LOGIN_PASS=not_available

---

## Owner review closeout - 2026-07-15

GATE=OWNER_REVIEW_PARTIAL_PRODUCTION_AUTH_PROOF
CLASSIFICATION=ACCEPTED_NON_BLOCKING
OWNER_ACCEPTED_PARTIAL_AUTH_PROOF=yes
AUTH_RESIDUAL_CLASSIFICATION=NON_BLOCKING
AUTH_RESIDUAL_REASON=production_owner_credentials_not_available_to_harness
CREDENTIAL_RETRY_AUTHORIZED=no
PASSWORD_RESET_AUTHORIZED=no
PRODUCTION_SETUP_MUTATION_AUTHORIZED=no
REDEPLOY_AUTHORIZED=no
ROLLBACK_AUTHORIZED=no
POST_DEPLOY_PRODUCTION_PROOF_CLOSED=yes
AUTHENTICATED_OWNER_LOGIN_AND_FIRST_RUN_SETUP=OWNER_OPERATED_SEPARATE_STEP
NEXT_GATE=G50_PRODUCTION_CLOSEOUT_COMMIT_PUSH
