# Production clean-state reset — 2026-07-13

## Summary

Production was reset from Puriva acceptance-test fixtures to a clean first-run owner setup state.

**Completed (resume after CI green `e36758b`):** exact-ID test-data deletion + verification. Deploy was **not** repeated. Turnstile was already `TURNSTILE_ENABLED=false` from the earlier authorized pre-CI step and was left unchanged (no API recreate).

## Retained

- Tenant `digital-cube-agency` (`055cecc5-56c2-4d42-a663-05181cd1e332`)
- Owner/admin user `digitalcubeagency360@gmail.com` (`beb65d64-833a-425c-99ec-2cf4c4080b8e`) with `owner` + `admin` roles
- Migration history (50 finished)
- Auth secrets and Turnstile secret key (keys retained; enforcement temporarily off)
- Backups under `/opt/dca/backups/prod-pg-clean-reset-20260713T062726Z.dump` (sha256 `eedf6aacc6540fd3d78bc977ca2ecedb17735c315312aa81d2fa0ceb1c9690af`)

## Removed (exact-ID / acceptance-marked)

- Puriva test client `84878363-344e-4841-a6a4-96e0664d17c5`
- Bali Medika placeholder client `363d0672-82c0-4c21-95d3-150f69ec7de9`
- Acceptance portal users `@dca.invalid` (`181a61fc-…`, `f00f18a7-…`)
- TEST DATA AI Delivery project `44d9fde5-…`, brief `06fdce62-…`, report `9a622e68-…`
- Legacy Bali project `8560a607-…` (Google Ads) under placeholder client
- Acceptance sessions, client-access rows, membership/role for portal test user, related notifications, budget ledger row

## Turnstile

- `TURNSTILE_ENABLED=false` on production API (temporary, controlled testing)
- Turnstile code retained; secret key retained
- Web already serving onboarding bundle without site key (`index-DX4AMrb2.js`)
- Password auth + login rate limiting remain active (wrong-password probe → `AUTH_LOGIN_FAILED` 401 without Turnstile token)

## First-run onboarding

- Frontend route `#/setup`
- After owner/admin login, if company profile missing or zero active clients → redirect to setup
- Company profile count = 0 and clients = 0 after cleanup → clean first-run state

## Providers

- Live provider flags remain disabled / absent
- WordPress publish remains disabled
- `SHARED_PROXY_ACTION=none`

## Classification

`PRODUCTION CLEAN-STATE RESET PASS`

`PRODUCTION_READY_FOR_CLEAN_OWNER_SETUP=true` after owner interactive login completes company + first client steps.
