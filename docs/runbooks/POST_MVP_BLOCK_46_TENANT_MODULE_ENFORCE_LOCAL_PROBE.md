# Post-MVP Block 46 — Tenant Module Enforce Local Probe

**Status:** Local probe for Architecture Block 6 Gate 3 (`TENANT_MODULE_ENFORCEMENT=enforce`).

**Scope:** Focused enforce-mode proof using the full tenant module smoke matrix. Complements Block 39 dry_run probe. No schema, auth, or middleware logic changes.

Related:

- `docs/security/TENANT_MODULE_ENFORCEMENT_LOCAL_GATE.md` (Gate 3 — `enforce`)
- `docs/security/TENANT_MODULE_ENFORCEMENT.md`
- `docs/runbooks/POST_MVP_BLOCK_39_TENANT_MODULE_DRY_RUN_LOCAL_PROBE.md`
- `scripts/smoke-tenant-module-local.mjs`

---

## Run (baseline — API in default `off`)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:tenant-module:local
```

Included in `npm run smoke:pre-staging:local`.

Expect route map checks pass; disabling `ai-delivery` still allows `/ai-delivery-projects` with HTTP 200.

---

## Run (strict enforce Gate 3 — owner/manual)

1. Stop local API.
2. Set in `.env` or process env:

```env
TENANT_MODULE_ENFORCEMENT=enforce
```

3. Restart API: `npm.cmd run dev:api`
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE -ErrorAction SilentlyContinue
```

Expect:

- Smoke PASS with `enforce mode blocks disabled ai-delivery route` (HTTP 403 `MODULE_NOT_ENABLED`)
- Second probe: disabling `market-intelligence` blocks `/market-intelligence-projects` with 403
- Smoke re-enables both modules before exit

5. Restore `.env` to `off` (or remove the variable) and restart API before other smokes.

---

## Pass criteria

- Admin login succeeds; route map module keys resolve correctly
- Baseline (`off`): disabled modules do not block routes
- Strict enforce: disabled modules return HTTP 403 `MODULE_NOT_ENABLED`
- Smoke cleans up module enablement state on exit
- Probe fails fast if strict flag is set but API is not in `enforce` mode

---

## Notes

- Staging/production `enforce` rollout remains a separate owner gate after seeded entitlements and operator QA.
- Pre-staging orchestrator keeps API on `off`; strict enforce proof is manual/owner-triggered.
- Pair with Block 39 for full `off` → `dry_run` → `enforce` local matrix.
