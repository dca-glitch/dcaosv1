# Tenant Module Enforcement Local Gate (Block 6)

**Status:** Local staging gate ready. Production `enforce` and owner sign-off remain separate gates.

**Scope:** Prove `TENANT_MODULE_ENFORCEMENT` rollout path (`off` → `dry_run` → `enforce`) using local API restart + smoke. Does not change VPS or production env.

Related:

- `docs/security/TENANT_MODULE_ENFORCEMENT.md` — middleware, route map, seed
- `scripts/smoke-tenant-module-local.mjs`

---

## Prerequisites

1. Block 6 middleware merged locally (route map + seed).
2. API running: `npm.cmd run dev:api`
3. `AUTH_SEED_TEST_PASSWORD` available to smoke scripts.
4. Seed current: `npm.cmd run seed:db1`

**Restart the API** after every `TENANT_MODULE_ENFORCEMENT` change. Node reads env at startup only.

---

## Gate 1 — default (`off`)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:tenant-module:local
```

Expect: route map checks pass; disabling `ai-delivery` still allows `/ai-delivery-projects` with HTTP 200 (`off mode allows disabled ai-delivery route`).

---

## Gate 2 — `dry_run`

Stop API, set in `.env` (or process env for the dev session):

```env
TENANT_MODULE_ENFORCEMENT=dry_run
```

Restart API, then:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN = "true"
npm.cmd run smoke:tenant-module:local
```

Expect:

- Smoke PASS with `dry_run mode allows disabled ai-delivery route` (HTTP 200 after disable).
- API console shows `[tenant-module dry_run] would block …` lines during the disable probe (manual log review optional).

Reset expectation env after run:

```powershell
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN -ErrorAction SilentlyContinue
```

---

## Gate 3 — `enforce`

Stop API, set:

```env
TENANT_MODULE_ENFORCEMENT=enforce
```

Restart API, then:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
```

Expect:

- Smoke PASS with `enforce mode blocks disabled ai-delivery route` (HTTP 403 `MODULE_NOT_ENABLED`).
- Second probe: disabling `market-intelligence` blocks `/market-intelligence-projects` with 403.
- Smoke re-enables both modules before exit.

Reset expectation env and return API to default when finished:

```powershell
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE -ErrorAction SilentlyContinue
# In .env: TENANT_MODULE_ENFORCEMENT=off (or remove line), then restart API
```

---

## Staging checklist (after local gates pass)

1. Deploy branch to staging (separate approval).
2. Run seed on staging DB for target tenant entitlements.
3. Staging `dry_run` → review logs → staging `enforce` → rerun smokes + browser QA.
4. Production `enforce` only after owner sign-off.

---

## Safety

- Default `.env.example` keeps `TENANT_MODULE_ENFORCEMENT` commented (`off`).
- Do not enable production `enforce` without seeded entitlements and operator QA.
- See `AGENTS.md` — no VPS/production env changes without explicit approval.
