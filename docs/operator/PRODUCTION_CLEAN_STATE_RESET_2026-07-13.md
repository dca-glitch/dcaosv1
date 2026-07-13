# Production clean-state reset — 2026-07-13

## Authorization and scope

- Authorized clean-state reset after production had already been deployed and verified healthy.
- Scope: remove approved acceptance-test fixtures and test records, preserve the real owner/admin and tenant, keep the production deploy intact, and verify the resulting first-run owner setup state.
- No production redeploy was repeated during the resumed cleanup.

## Interruption and resume checkpoint

- The original reset work was interrupted while CI was red.
- Resume occurred after green CI at commit `e36758b06594f35c252ccf1cfed69bcccfd78b79`.
- Green CI run evidence: `29229779236` (`success`).

## Backup proof

- Production backup was created before cleanup.
- Backup path: `/opt/dca/backups/prod-pg-clean-reset-20260713T062726Z.dump`.
- Backup checksum: `eedf6aacc6540fd3d78bc977ca2ecedb17735c315312aa81d2fa0ceb1c9690af`.

## Turnstile state

- `TURNSTILE_ENABLED=false` during the cleanup window.
- Turnstile had already been disabled before the CI interruption and was not repeated during the resume.
- Password auth remained active, with rate limiting preserved.

## Exact-ID deletion methodology

- Deletion used exact identifiers and approved fixture selectors only.
- No broad tenant purge, pattern-based delete, or blind cleanup sweep was used.
- Fail-closed behavior preserved the real owner/admin and tenant while targeting only approved test data.

## Deleted records

Removed categories included:

- Puriva acceptance client and placeholder client records
- Acceptance portal users and portal access rows
- Test AI Delivery project / brief / report records
- Legacy placeholder project rows tied to the acceptance client
- Acceptance sessions and related notifications
- Budget / ledger rows tied to test fixtures

## Retained records

Preserved records included:

- Real tenant `digital-cube-agency`
- Real owner/admin account and roles
- Migration history
- Auth secrets and the Turnstile secret key material already present in production
- Production runtime artifact and deploy identity

## Verification results

- Exact-ID test-data deletion completed successfully.
- Real owner/admin and tenant data were retained.
- Production API, web, loopback API, staging, and production JS asset checks returned HTTP 200.
- Production remained healthy after the cleanup.
- Interactive production admin login succeeded.
- Password authentication worked as expected.

## Container and deploy preservation proof

- Production API, DB, and Caddy identities remained unchanged during the resumed cleanup.
- The production deploy was not repeated.
- No production recreate, rollback, or redeploy was required to finish the reset.

## Temporary credential cleanup

- Temporary credential files used during the cleanup were overwritten and deleted.
- No password, token, or secret values are recorded here.

## Remaining owner onboarding actions

These are normal product-onboarding steps, not cleanup blockers:

- Configure company settings
- Complete first-client setup in the production UI

## Final classification

`PRODUCTION CLEAN-STATE RESET PASS`

No further reset action is required.
