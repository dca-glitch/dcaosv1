# Environment Readiness Inventory

**Status:** Local/staging planning reference. Names only — never commit, print, or infer secret values.

**Purpose:** Single checklist of documented environment variables for API, Web, local smoke, and future staging execution (G4). Values belong in shell or server-side env files only.

**Block 4 note:** Consolidated with [`docs/STATUS.md`](../STATUS.md) §4 and [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md) §10. This file remains the detailed category inventory.

Related:

- [`.env.example`](../../.env.example) — local placeholders (no secrets)
- [`docs/deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md`](../deployment/VPS_STAGING_EXECUTION_APPROVAL_PACK.md) — G4 staging secrets handling
- [`docs/runbooks/LOCAL_SMOKE_MATRIX.md`](../runbooks/LOCAL_SMOKE_MATRIX.md) — which smokes need which env

---

## Legend

| Column | Meaning |
|--------|---------|
| **Required** | Must be set for the named context to work |
| **Optional** | Enables extra proof or behavior; safe to omit locally |
| **Staging** | Required on staging host at G4; not for local-only work |
| **Never commit** | Value must never appear in repo, logs, or reports |

---

## Core runtime

| Variable | Local dev | Local smoke | Staging (G4) | Notes |
|----------|-----------|-------------|--------------|-------|
| `PORT` | Optional (default 4000) | — | Required | API listen port |
| `DATABASE_URL` | Required | Required (via running API) | Required (staging DB only) | Never commit; staging must not use production DB |
| `VITE_API_BASE_URL` | Optional (default `/api/v1`) | — | Build-time on staging | Same-origin proxy expected on staging |

---

## Auth and local admin

| Variable | Local dev | Local smoke | Staging (G4) | Notes |
|----------|-----------|-------------|--------------|-------|
| `AUTH_SEED_TEST_PASSWORD` | Optional | **Required** for smokes | Staging smoke only | Never commit; use seed password from local shell |
| `AUTH_SEED_TEST_EMAIL` | Optional | Optional | Optional | Defaults to `admin@dca.local` in smoke scripts |
| `AUTH_SEED_TESTER_EMAIL` | Optional | Optional | Optional | Second-tenant cross-tenant client portal proof |
| `AUTH_SEED_TESTER_PASSWORD` | Optional | Optional | Optional | Pairs with tester email |
| `AUTH_SESSION_TTL_MINUTES` | Optional | — | Staging | Session policy |
| `AUTH_LOGIN_MAX_FAILED_ATTEMPTS` | Optional | — | Staging | Login lockout |
| `AUTH_LOGIN_LOCKOUT_MINUTES` | Optional | — | Staging | Login lockout |

Local admin email convention: `admin@dca.local`. Password from `$env:AUTH_SEED_TEST_PASSWORD` only.

---

## Turnstile

| Variable | Local dev | Staging (G4) | Notes |
|----------|-----------|--------------|-------|
| `TURNSTILE_ENABLED` | Optional (typically off locally) | Owner decision | Default local: disabled or unset |
| `TURNSTILE_SECRET_KEY` | Never commit | Staging server only | Server-side |
| `VITE_TURNSTILE_SITE_KEY` | Never commit | Staging build | Client-side site key |

Local smoke does not require Turnstile. Staging Turnstile behavior is an owner gate at G4.

---

## Smoke URL overrides

| Variable | When needed | Notes |
|----------|-------------|-------|
| `MVP_SMOKE_API_BASE_URL` | Staging smoke (`smoke:mvp:staging`) | Must be explicit HTTPS `/api/v1` on **approved staging host only** (`staging.digitalcubeagency.net`) |
| `DCA_SMOKE_REMOTE_TARGET` | Remote staging security baseline (`smoke:staging-security-baseline`) | Must equal `staging`; unset = refuse (no HTTP). Owner-approved / G4 remote only — never CI or local default gate |
| `DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE` | Optional production health probe in staging security baseline | Must equal `1`; unset = skip production health GET. Owner-approved only — never default |
| `AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL` | Optional AI Delivery reviews override | Default `http://127.0.0.1:4000/api/v1` |
| `AI_DELIVERY_REVIEW_SMOKE_WEB_URL` | Optional browser override | Default `http://localhost:5173/#/ai-delivery` |
| `MVP_SMOKE_WEB_BASE_URL` | Optional workflow browser override | Default local Vite |

---

## R2 / private storage

| Variable | Local | Staging (G4) | Notes |
|----------|-------|--------------|-------|
| `R2_ACCOUNT_ID` | Optional | Staging bucket | Unset = `R2_STORAGE_NOT_CONFIGURED` guard |
| `R2_ACCESS_KEY_ID` | Optional | Staging | Never commit |
| `R2_SECRET_ACCESS_KEY` | Optional | Staging | Never commit |
| `R2_BUCKET_NAME` | Optional | Staging private bucket | No public bucket exposure |
| `R2_ENDPOINT` | Optional | Optional override | |
| `R2_PUBLIC_BASE_URL` | Optional | Avoid on private assets | Client must never see raw `storageKey` |

Smoke: `smoke:r2-byte-roundtrip:local` — baseline passes with R2 disabled; optional `$env:SMOKE_EXPECT_R2_ROUNDTRIP = "true"` when locally configured.

Unified config-only readiness (no bucket IO): `smoke:external-integrations-readiness:local` — see [`docs/runbooks/EXTERNAL_INTEGRATIONS_READINESS.md`](../runbooks/EXTERNAL_INTEGRATIONS_READINESS.md).

---

## WordPress provider

| Variable | Local | Staging (G4) | Notes |
|----------|-------|--------------|-------|
| `WORDPRESS_PUBLISH_ENABLED` | Optional (default false) | Owner gate | Draft prep only locally; no auto-publish |
| `CREDENTIAL_ENCRYPTION_MASTER_KEY` | Optional | Staging Block 4 gate | Required before encrypted publication targets / publish open probe |

Smoke: `smoke:wordpress-publish:local` — baseline expects publish disabled. Open-gate probe: `$env:SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED = "true"`.

---

## OpenRouter / AI text provider

| Variable | Local | Staging (G4) | Notes |
|----------|-------|--------------|-------|
| `AI_TEXT_GATEWAY` | Optional (default local) | Owner gate | `openrouter` is opt-in only |
| `OPENROUTER_API_KEY` | Never commit | Staging server only | |
| `OPENROUTER_BASE_URL` | Optional | Optional | Defaults to `https://openrouter.ai/api/v1` |
| `OPENROUTER_TEXT_PRIMARY_MODEL` | Optional | Optional | Required for live OpenRouter execution |
| `OPENROUTER_TEXT_SECONDARY_MODEL` | Optional | Optional | |
| `OPENROUTER_TEXT_REVIEWER_MODEL` | Optional | Optional | |
| `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` | Optional | Optional | |

Guardrails: admin-triggered only, bounded cost (`AI_TEXT_BUDGET_POLICY_V1`), deterministic local fallback, OpenRouter HTTP timeout `20000ms` (code constants), no client exposure of prompts/raw output.

Local config guide: `docs/operator/AI_PROVIDER_LOCAL_CONFIG.md`

Smokes:

- `smoke:ai-provider-config:local` — config-only; no API/key required
- `smoke:openrouter-guarded:local` — API workflow proof; baseline local deterministic

---

## GA4 / Google Search Console (deferred live sync)

| Variable | Local | Staging (G4) | Notes |
|----------|-------|--------------|-------|
| `GA4_GSC_SYNC_ENABLED` | Optional (default off) | Owner gate | When not `true`, sync/OAuth remain disabled |
| `GOOGLE_OAUTH_CLIENT_ID` | Never commit | Staging server only | Presence checked only in readiness layer |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Never commit | Staging server only | Presence checked only; never logged |

Live GA4/GSC OAuth and provider sync are deferred. Manual/imported metrics snapshots remain the active path.

Smoke: `smoke:external-integrations-readiness:local` — config shape only; no OAuth or sync.

---

## Tenant module enforcement

| Variable | Local | Staging (G4) | Notes |
|----------|-------|--------------|-------|
| `TENANT_MODULE_ENFORCEMENT` | `off` for pre-staging orchestrator | Owner gate (`dry_run` / `enforce`) | Restart API after change |

Pre-staging orchestrator sets `off` when restarting API. Restore `off` before full local gate.

---

## Smoke expectation flags (local probes only)

| Variable | Smoke | Purpose |
|----------|-------|---------|
| `SMOKE_EXPECT_R2_ROUNDTRIP` | `smoke:r2-byte-roundtrip:local` | Strict byte roundtrip when R2 configured |
| `SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED` | `smoke:wordpress-publish:local` | Open-gate publish probe |
| `SMOKE_EXPECT_TENANT_MODULE_ENFORCE` | `smoke:tenant-module:local` | Enforce-mode probe |
| `SMOKE_EXPECT_OPENROUTER_LIVE` | `smoke:openrouter-guarded:local`, `smoke:ai-provider-config:local` | Live OpenRouter probe (owner/manual) |
| `SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API` | `smoke:external-integrations-readiness:local` | Optional `GET /integrations/readiness` API probe |
| `SMOKE_EXPECT_GOOGLE_DRIVE_LIVE` | `smoke:google-drive-export-live:local` | Live Google export planning probe |
| `SMOKE_EXPECT_CREDENTIAL_MASTER_KEY` | `smoke:credential-master-key-probe:local` | Master key configured probe |

---

## Docker Compose (staging reference names only)

Documented in `.env.example` for staging service DNS inside `dca_net`. Real values live server-side only at G4.

---

## Safety rules

- Do not write secret values into repo files.
- Do not print passwords, tokens, session hashes, or full `DATABASE_URL` in reports.
- Local, staging, and production env files must remain separate.
- Staging must not contain production DB credentials.
