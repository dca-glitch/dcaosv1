# External Integrations Readiness (Block 1)

> **LIVE GA4/GSC WITHDRAWN (2026-07-13):** GA4/GSC is no longer an active readiness category. Google Drive remains a separate capability.

**Status:** Local-only config-shape validation. No live provider calls, publish, sync, crawl, or bucket mutation.

Related:

- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)
- [`LOCAL_SMOKE_MATRIX.md`](./LOCAL_SMOKE_MATRIX.md)
- [`STAGING_READINESS.md`](./STAGING_READINESS.md)

---

## Command

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:external-integrations-readiness:local
```

Optional API probe (requires local API on `:4000` and `AUTH_SEED_TEST_PASSWORD`):

```powershell
$env:SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API = "true"
npm.cmd run smoke:external-integrations-readiness:local
Remove-Item Env:SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API -ErrorAction SilentlyContinue
```

Admin API (when API is running): `GET /api/v1/integrations/readiness` — owner/admin, tenant-scoped, read-only.

Validate also runs `apps/api` check `check:external-integrations-readiness` (config runner only, no API).

---

## What is checked

| Category | Checks | Safe statuses |
|----------|--------|---------------|
| **AI provider** | `AI_TEXT_GATEWAY`, OpenRouter key/model presence (boolean only), runtime validation warnings, live execution blocked when misconfigured | `disabled`, `missing_config`, `configured_shape_ok` |
| **WordPress** | `WORDPRESS_PUBLISH_ENABLED`, `CREDENTIAL_ENCRYPTION_MASTER_KEY` presence (never value) | `disabled`, `missing_config`, `configured_shape_ok` |
| **Private storage (R2)** | Required R2 env key presence via `getPrivateStorageStatus()` / `getR2EnvPresence()` | `disabled`, `configured_shape_ok` |

**Withdrawn (not checked):** GA4/GSC — live scope withdrawn 2026-07-13; `GA4_GSC_*` / `GOOGLE_OAUTH_*` env vars not required.

Negative cases in the runner: empty env, partial OpenRouter, partial R2, publish-on without encryption key.

Positive shape cases: full OpenRouter model/key names (values not echoed), full R2 env set (no upload), WordPress publish + encryption key present (no publish call).

---

## What is intentionally not checked

- Live OpenRouter / AI provider HTTP execution
- WordPress draft creation or publish against any host
- R2 upload, download, delete, or signed URL generation
- GA4 / GSC OAuth consent or metrics API sync — **WITHDRAWN** (not in scope)
- Google Drive export live planning
- Staging or production hosts
- Credential values, session tokens, or database contents

Deferred to later blocks / owner gates: staging deploy, production deploy, live integration proof, strict R2 byte roundtrip (`smoke:r2-byte-roundtrip:local`), WordPress publish gate probe (`smoke:wordpress-publish:local`), OpenRouter workflow proof (`smoke:openrouter-guarded:local`).

---

## Expected safe statuses (typical local dev)

| Category | Typical local status | Meaning |
|----------|---------------------|---------|
| AI provider | `configured_shape_ok` (gateway `local`) | Deterministic local gateway; live provider deferred |
| WordPress | `disabled` | `WORDPRESS_PUBLISH_ENABLED` not true |
| Private storage | `disabled` | R2 env absent; guarded responses |

GA4/GSC row **removed** — live scope **WITHDRAWN** 2026-07-13.

Partial env is safe: statuses may be `missing_config` without failing the smoke unless validation/check runner assertions fail.

---

## Proof no live calls

- Readiness service reads env presence/shape only.
- Runner installs a `fetch` guard that fails on any network call.
- OpenRouter helper is invoked only in misconfigured mode to prove early return without provider HTTP.
- No WordPress, R2 SDK, or Google OAuth clients are invoked in this layer.

---

## Log convention

Orchestrated packs write logs to `$env:TEMP` and open Notepad. For a single smoke:

```powershell
$log = Join-Path $env:TEMP "dca-external-integrations-readiness-smoke.log"
npm.cmd run smoke:external-integrations-readiness:local *>&1 | Tee-Object -FilePath $log
notepad $log
```

Do not print secret values in logs or reports.
