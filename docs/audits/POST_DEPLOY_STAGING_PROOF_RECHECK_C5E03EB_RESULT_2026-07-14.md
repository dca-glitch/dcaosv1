# Post-Deploy Staging Proof Recheck Ã¢â‚¬â€ c5e03eb

**Gate:** `POST_DEPLOY_STAGING_PROOF_RECHECK`
**Date:** 2026-07-14
**Classification:** `PARTIAL`

---

## Target

```text
TARGET_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
STAGING_ARTIFACT=/opt/dca/staging-artifacts/c5e03eb
STAGING_URL=https://staging.digitalcubeagency.net
```

## Runtime recheck

| Check | Result |
|-------|--------|
| SSH `deploy` @ `DCA01` | PASS |
| Compose context | `/opt/dca/staging-artifacts/c5e03eb` |
| Staging API / Postgres | running; Postgres healthy; ports `4011` / `5435` |
| Production separation | PASS |
| Caddy | running; untouched by this gate |
| Staging root / public health / loopback | 200 / ready |
| Production health-only | 200 |

## Prior failure

```text
FAILED_BROWSER_COMMAND=npm.cmd run smoke:mi-operator:browser (and smoke:admin-daily-cockpit:browser) with MVP_SMOKE_* staging URLs
FAILED_BROWSER_PHASE=route assertion (waited for #market-intelligence-title / Daily Operations Cockpit after auth injection)
FAILED_BROWSER_TIMEOUT=20000ms / 15000ms
```

Earlier characterization as Ã¢â‚¬Å“auth injection timeoutÃ¢â‚¬Â was incomplete.

## Reproduction findings

### Phase A Ã¢â‚¬â€ unauthenticated SPA

- Root HTTP 200; redirects to `#/login`
- JS/CSS assets `index-WQ-90c5f` / `index-BNmstedn` present
- No fatal console/page exceptions

### Phase B Ã¢â‚¬â€ form login

- Login interactive; Turnstile not blocking staging form login
- Login succeeds; authenticated shell loads (sidebar, admin@dca.local, Logout)
- App lands on `#/setup` (first-run)

### Phase C Ã¢â‚¬â€ API token + sessionStorage injection

- API login 200; `/auth/me` 200; token stored
- Navigation to `#/ai-market-intelligence` or `#/dashboard` is rewritten to `#/setup`
- Authenticated shell is present; MI page title never appears because setup gate forces `#/setup`

### Root cause

```text
BROWSER_FAILURE_CLASS=STAGING_TEST_ACCOUNT_OR_ENV_UNAVAILABLE
```

Product first-run rule (`deriveFirstRunSetupState`): managers with missing company profile (and/or no active clients) are forced to `#/setup`. Staging admin tenant currently lacks a company profile, so authenticated browser route proofs cannot reach MI/cockpit until setup is completed.

This is **not**:

- an auth injection defect;
- an authentication runtime defect;
- a staging product crash;
- a tenant-isolation failure.

No product-code change was made. Completing staging first-run would require company-profile (and possibly client) writes, which this gate does not authorize.

## Harness fix

Diagnosic-only updates (unstaged):

- `scripts/smoke-mi-operator-browser-local.mjs`
- `scripts/smoke-admin-daily-cockpit-browser-local.mjs`

After goto, detect `#/setup` / `#first-run-setup-title` and fail with an explicit first-run message instead of timing out on the wrong selector.

Re-run against staging confirmed the explicit setup-gate error.

## Proof matrix

| Proof | Result |
|-------|--------|
| SPA boot | PASS |
| Static assets | PASS |
| Fatal console errors | 0 |
| Page exceptions | 0 |
| Auth browser (form + API) | PASS |
| Admin authenticated shell | PASS (sidebar + user chip) |
| Client shell | NOT_AVAILABLE (no staging client-user browser path exercised) |
| Authenticated route navigation (MI/cockpit/dashboard content) | PARTIAL Ã¢â‚¬â€ blocked by `#/setup` |
| MI Done/Pending runtime | PARTIAL Ã¢â‚¬â€ authenticated route not reachable; strings present in prior bundle verification |

## Defects

```text
CONFIRMED_STAGING_PRODUCT_DEFECTS=0
CONFIRMED_STAGING_AUTH_DEFECTS=0
CONFIRMED_STAGING_TENANT_DEFECTS=0
PRODUCT_CODE_CHANGED=no
```

## Safety

No redeploy, artifact, migration, Caddy, or production mutation. No commit/push.

## Next gate

```text
NEXT_GATE=OWNER_REVIEW_PARTIAL_STAGING_BROWSER_PROOF
```

Owner options: complete staging `#/setup` (company profile / first client) then re-run authenticated browser smokes, or accept residual PARTIAL with MVP+security already PASS.

## Follow-up (2026-07-14 Ã¢â‚¬â€ do not rewrite historical PARTIAL)

Owner-approved gate `STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF` completed company profile via normal `#/setup` UI, cleared the redirect blocker, and re-ran authenticated route + MI runtime + browser smokes with classification **PASS**. See [`STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF_C5E03EB_RESULT_2026-07-14.md`](./STAGING_SETUP_COMPLETION_AND_BROWSER_PROOF_C5E03EB_RESULT_2026-07-14.md). Superseding next gate: `POST_DEPLOY_STAGING_CLOSEOUT_COMMIT_PUSH`.

---

## Machine-readable closeout

GATE=POST_DEPLOY_STAGING_PROOF_RECHECK
CLASSIFICATION=PARTIAL
FINAL_STAGING_COMMIT=c5e03eb52f882a5d6f9e8f92fc1794a91f3289c5
