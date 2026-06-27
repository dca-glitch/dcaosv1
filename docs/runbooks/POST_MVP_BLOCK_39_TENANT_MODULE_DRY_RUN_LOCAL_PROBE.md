# Post-MVP Block 39 — Tenant Module dry_run Local Probe

**Status:** Local probe for `TENANT_MODULE_ENFORCEMENT=dry_run` compatibility without changing VPS/staging env.

**Scope:** Focused smoke plus runbook pointer to Architecture Block 6 Gate 2. No schema, auth, or middleware logic changes.

Related:

- `docs/security/TENANT_MODULE_ENFORCEMENT_LOCAL_GATE.md` (Gate 2 — `dry_run`)
- `docs/security/TENANT_MODULE_ENFORCEMENT.md`
- `scripts/smoke-tenant-module-dry-run-probe-local.mjs`
- `scripts/smoke-tenant-module-local.mjs` (full matrix)

---

## Run (baseline — API in default `off`)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:tenant-module:dry-run-probe
```

Included in `npm run smoke:pre-staging:local`.

Expect PASS with `baseline off/dry_run compatible allow path` and a deferred note for strict dry_run proof.

---

## Run (strict dry_run Gate 2)

1. Stop local API.
2. Set in `.env` or process env:

```env
TENANT_MODULE_ENFORCEMENT=dry_run
```

3. Restart API: `npm.cmd run dev:api`
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN = "true"
npm.cmd run smoke:tenant-module:dry-run-probe
Remove-Item Env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN -ErrorAction SilentlyContinue
```

Expect:

- Probe PASS with `dry_run probe allows disabled ai-delivery route` (HTTP 200 after disable)
- Optional manual review: API console shows `[tenant-module dry_run] would block …` lines

5. Restore `.env` to `off` (or remove the variable) and restart API before other smokes if needed.

---

## Pass criteria

- Admin can disable and re-enable `ai-delivery` without leaving tenant in a broken state
- With module disabled, `/ai-delivery-projects` is **not** blocked in baseline `off` mode
- With `SMOKE_EXPECT_TENANT_MODULE_DRY_RUN=true`, disabled route stays HTTP 200 while API runs in `dry_run`
- Probe fails fast if API is in `enforce` mode during baseline pre-staging (`403 MODULE_NOT_ENABLED`)

---

## Notes

- Staging `enforce` proof remains a separate owner gate (Gate 3 in Block 6 runbook).
- Pre-staging orchestrator keeps API on `off`; strict dry_run proof is manual/owner-triggered.
