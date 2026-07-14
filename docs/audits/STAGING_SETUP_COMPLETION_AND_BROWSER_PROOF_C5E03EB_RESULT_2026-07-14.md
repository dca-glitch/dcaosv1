# Staging Setup Completion and Browser Proof ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â `c5e03eb` (2026-07-14)

**Gate:** `STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF`
**Mode:** `BOUNDED_STAGING_DATA_MUTATION_AND_BROWSER_VERIFICATION`
**Owner approval received:** yes
**Classification:** `PASS`

## Target

```text
TARGET_BRANCH=main
TARGET_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
STAGING_URL=https://staging.digitalcubeagency.net
STAGING_API_URL=https://staging.digitalcubeagency.net/api/v1
```

## Local preflight

```text
LOCAL_HEAD=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
ORIGIN_MAIN=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
AHEAD_BEHIND=0 0
STAGED_FILES=0
OWNER_UNTRACKED_PRESERVED=yes
PRODUCT_CODE_CHANGED=no
```

## Runtime preflight / post-proof

| Probe | Result |
|------|--------|
| Staging root HTTP | 200 |
| Staging public health | 200, `database.status=ready` |
| Staging loopback `127.0.0.1:4011` health | 200, ready |
| Production public health only | 200 |
| Compose artifact context | `/opt/dca/staging-artifacts/c5e03eb` |
| `dcaosv1-staging-api` | running (`4011`) |
| `dcaosv1-staging-postgres` | healthy (`5435`) |
| Production `dcaosv1-api` / `dcaosv1-postgres` | running (`4010` / `5434`) |
| Caddy | running; untouched |

## Setup discovery

```text
SETUP_REDIRECT_CONDITION=manager first-run: needsCompanyProfile=true ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ deriveFirstRunSetupState forces #/setup
SETUP_REQUIRED_FIELDS=companyName
SETUP_MUTATION_PATH=normal UI
```

Pre-mutation API inspection (sanitized): company profile absent; active clients already present (smoke fixtures), so **no client creation** was required or performed.

Required UI path: `#/setup` / `FirstRunSetupPage` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ save company profile via documented `/company-profile` mutation.

## Setup completion (staging data mutation only)

Neutral staging-only values populated on the real form:

| Field | Populated |
|------|-----------|
| Company name | yes (`DCA OS Staging Test`) |
| Website | yes (staging host URL) |
| Country | yes (`Indonesia`) |
| Phone / tax / legal registration / providers | left blank |

```text
SETUP_FORM_VISIBLE=yes
SETUP_SUBMIT_ATTEMPTED=yes
SETUP_SUBMIT_HTTP=200
SETUP_COMPLETION_PERSISTED=yes
POST_SETUP_REDIRECT=#/dashboard
STAGING_PROFILE_DATA_MUTATED=yes
CLIENT_ACCOUNT_CREATED=no
```

Reload confirmed setup gate cleared permanently for the staging admin tenant.

## Authenticated browser proofs

```text
STAGING_AUTH_BROWSER_PROOF=PASS
STAGING_ADMIN_SHELL_PROOF=PASS
STAGING_CLIENT_SHELL_PROOF=NOT_AVAILABLE
STAGING_ROUTE_PROOF=PASS
```

Client shell skipped: no existing staging client-test credentials exposed through harness env (`CLIENT_ACCOUNT_CREATED=no`).

| Route | Result |
|------|--------|
| Dashboard | PASS |
| Client access / Clients | PASS |
| Projects | PASS |
| Tasks | PASS |
| Finance (Invoices) | PASS |
| AI Delivery | PASS |
| AI Operations | PASS |
| Monthly-report surface (via AI Delivery) | PASS |
| Market Intelligence | PASS |
| Admin daily cockpit | PASS |

No fatal console/page errors; no unexpected return to `#/setup`; no business records created during route proof.

## Market Intelligence runtime

Rendered staging UI (not bundle-string-only):

```text
MI_PAGE_RUNTIME_PASS=yes
MI_DONE_VISIBLE=yes
MI_PENDING_VISIBLE=yes
MI_DONE_PENDING_RUNTIME_PROOF=PASS
```

## Browser smokes (staging env)

Env names only: `MVP_SMOKE_API_BASE_URL`, `MVP_SMOKE_WEB_BASE_URL`, `AUTH_SEED_TEST_EMAIL`, `AUTH_SEED_TEST_PASSWORD`.

| Command | Exit | Result |
|--------|------|--------|
| `npm.cmd run smoke:mi-operator:browser` | 0 | PASS (15/15) |
| `npm.cmd run smoke:admin-daily-cockpit:browser` | 0 | PASS (28/28) |

```text
MI_OPERATOR_BROWSER_SMOKE=PASS
ADMIN_DAILY_COCKPIT_BROWSER_SMOKE=PASS
```

## Harness review

Unstaged diagnostic improvements remain in:

- `scripts/smoke-mi-operator-browser-local.mjs`
- `scripts/smoke-admin-daily-cockpit-browser-local.mjs`

```text
HARNESS_CHANGES_VALID=yes
HARNESS_ASSERTIONS_WEAKENED=no
CREDENTIALS_EMBEDDED=no
```

`git diff --check` clean; `node --check` clean on both harness files. No product source changes.

## Defects

```text
CONFIRMED_STAGING_PRODUCT_DEFECTS=0
CONFIRMED_STAGING_AUTH_DEFECTS=0
CONFIRMED_STAGING_TENANT_DEFECTS=0
```

## Explicit non-actions

```text
DEPLOY_DONE=no
ARTIFACT_CREATED=no
ARTIFACT_UPLOADED=no
MIGRATION_DONE=no
CADDY_TOUCHED=no
STAGING_INFRASTRUCTURE_MUTATED=no
PRODUCTION_TOUCHED=no
PRODUCT_CODE_CHANGED=no
COMMIT_DONE=no
PUSH_DONE=no
LIVE_PROVIDER_PROOFS=no
GA4_GSC=WITHDRAWN
NOTIFICATION_E2E=DEFERRED_NON_BLOCKING
```

## Next gate

```text
NEXT_GATE=POST_DEPLOY_STAGING_CLOSEOUT_COMMIT_PUSH
```

---

## Machine-readable closeout

GATE=STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF
CLASSIFICATION=PASS
SETUP_COMPLETION_PERSISTED=yes
STAGING_ROUTE_PROOF=PASS
MI_DONE_PENDING_RUNTIME_PROOF=PASS
POST_DEPLOY_STAGING_PROOF_CLOSED=yes
NEXT_GATE=POST_DEPLOY_STAGING_CLOSEOUT_COMMIT_PUSH
