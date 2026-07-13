# Production clean-state reset — 2026-07-13

## Summary

Production was reset from Puriva acceptance-test fixtures to a clean first-run owner setup state.

## Retained

- Tenant `digital-cube-agency` (`055cecc5-…`)
- Owner/admin user `digitalcubeagency360@gmail.com` (`beb65d64-…`) with `owner` + `admin` roles
- Migration history (50 finished)
- Auth secrets and Turnstile secret key (keys retained; enforcement temporarily off)
- Backups under `/opt/dca/backups/prod-clean-reset-20260713T062726Z*`

## Removed (exact-ID / acceptance-marked)

- Puriva test client `84878363-…`
- Bali Medika placeholder client `363d0672-…`
- Acceptance portal users `@dca.invalid` (`181a61fc-…`, `f00f18a7-…`)
- TEST DATA AI Delivery project `44d9fde5-…` and related report/access rows
- Acceptance sessions / client-access rows for those users

## Turnstile

- `TURNSTILE_ENABLED=false` on production API (temporary, controlled testing)
- Turnstile code retained; secret key retained
- Web rebuilt without site key so login widget is hidden
- Password auth + login rate limiting remain active

## First-run onboarding

- Frontend route `#/setup`
- After owner/admin login, if company profile missing or zero active clients → redirect to setup
- Step 1: company profile via existing `PUT /company-profile`
- Step 2: first client via existing `POST /clients` (no auto Puriva, no default pack)
- Completion is derived from API state (profile + active clients), not localStorage

## Providers

- Live provider flags remain disabled
- WordPress publish remains disabled
- `SHARED_PROXY_ACTION=none`

## Classification

`PRODUCTION_READY_FOR_CLEAN_OWNER_SETUP=true` after owner interactive login completes company + first client steps.
