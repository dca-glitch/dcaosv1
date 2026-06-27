# Phase F Block 59 — Module Middleware Local Enforce / dry_run

**Status:** Operator runbook for Architecture Block 6 (`off` → `dry_run` → `enforce`).

**Scope:** Documentation + focused smoke orchestrator. No middleware logic changes.

Related:

- [`docs/security/TENANT_MODULE_ENFORCEMENT_LOCAL_GATE.md`](../security/TENANT_MODULE_ENFORCEMENT_LOCAL_GATE.md) — full three-gate matrix
- [`POST_MVP_BLOCK_39_TENANT_MODULE_DRY_RUN_LOCAL_PROBE.md`](./POST_MVP_BLOCK_39_TENANT_MODULE_DRY_RUN_LOCAL_PROBE.md)
- [`POST_MVP_BLOCK_46_TENANT_MODULE_ENFORCE_LOCAL_PROBE.md`](./POST_MVP_BLOCK_46_TENANT_MODULE_ENFORCE_LOCAL_PROBE.md)
- `scripts/smoke-tenant-module-phase-f-local.mjs`

---

## When to restart the API

Node reads `TENANT_MODULE_ENFORCEMENT` at **API startup only**. Restart after every mode change:

```powershell
# Stop dev:api (Ctrl+C), change .env, then:
cd C:\dcaosv1
npm.cmd run dev:api
```

| Mode | `.env` value | Route behavior when module disabled |
|------|--------------|-------------------------------------|
| `off` (default) | commented or `off` | Routes still return HTTP 200 |
| `dry_run` | `TENANT_MODULE_ENFORCEMENT=dry_run` | Routes return HTTP 200; API logs `[tenant-module dry_run] would block …` |
| `enforce` | `TENANT_MODULE_ENFORCEMENT=enforce` | Routes return HTTP 403 `MODULE_NOT_ENABLED` |

**Always restore `off` and restart API** before `smoke:pre-staging:local`.

---

## Prerequisites

1. Local PostgreSQL running; seed current:

```powershell
cd C:\dcaosv1
npm.cmd run seed:db1
```

2. API on port 4000: `npm.cmd run dev:api`
3. `AUTH_SEED_TEST_PASSWORD` set (never print its value).

---

## Run (Phase F baseline — API in `off`)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:tenant-module:phase-f-local
```

Runs in sequence:

1. `smoke:tenant-module:dry-run-probe` — off/dry_run compatible allow path
2. `smoke:tenant-module:local` — route map + module enable/disable matrix

Included checks are also in `npm run smoke:pre-staging:local`.

---

## Run (strict Gate 2 — `dry_run`)

1. Stop API.
2. Set `TENANT_MODULE_ENFORCEMENT=dry_run` in `.env`.
3. Restart API.
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN = "true"
npm.cmd run smoke:tenant-module:dry-run-probe
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN -ErrorAction SilentlyContinue
```

Expect: disabled `ai-delivery` still returns HTTP 200; optional console log review.

---

## Run (strict Gate 3 — `enforce` with seed)

1. Confirm seed: `npm.cmd run seed:db1`
2. Stop API.
3. Set `TENANT_MODULE_ENFORCEMENT=enforce` in `.env`.
4. Restart API.
5. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE -ErrorAction SilentlyContinue
```

Expect:

- Disabled `ai-delivery` → HTTP 403 `MODULE_NOT_ENABLED`
- Disabled `market-intelligence` → HTTP 403
- Smoke re-enables modules before exit

6. Restore `.env` to `off` and restart API.

---

## Pass criteria

- Phase F baseline orchestrator PASS with API in `off`
- Seed entitlements include `core`, `ai-delivery`, `market-intelligence`, `finance-lite`, `user-settings`
- Strict `dry_run` and `enforce` proofs documented and runnable by operator when env is configured
- No secrets printed in smoke output

---

## Deferred (owner gates)

- Staging/production `enforce` rollout
- Production entitlements without seeded modules
