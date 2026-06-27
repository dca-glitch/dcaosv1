# Tenant Module Enforcement

**Status:** Implemented locally (Architecture Block 6). Production `enforce` mode and owner sign-off remain separate gates.

**Scope:** Optional API middleware that blocks tenant-scoped routes when the active tenant has not enabled the required module. Supports future licensee module packaging without changing route handlers.

---

## Enforcement modes

| `TENANT_MODULE_ENFORCEMENT` | Behavior |
|---------------------------|----------|
| `off` (default) | Middleware is a no-op. All guarded routes behave as today. |
| `dry_run` | Logs `[tenant-module dry_run] would block …` when a route would be denied, but still allows the request. |
| `enforce` | Returns `403 MODULE_NOT_ENABLED` when the mapped module is not `ACTIVE` for the active tenant. |

Implementation:

- Middleware: `apps/api/src/middlewares/tenant-module.middleware.ts`
- Route map: `apps/api/src/modules/tenant-module-route-map.ts`

**Restart the API** after changing `TENANT_MODULE_ENFORCEMENT`. The running Node process reads env at startup only.

---

## Route map (prefix → module key)

| Prefix | Module key |
|--------|------------|
| `/company-profile`, `/activity`, `/clients`, `/projects` | `core` |
| `/tenant/wordpress-config`, `/ai-delivery`, `/ai-delivery-projects` | `ai-delivery` |
| `/market-intelligence`, `/market-intelligence-projects` | `market-intelligence` |
| `/invoices`, `/bills`, `/vendors`, `/credit-notes`, `/invoice-items`, `/recurring-invoices` | `finance-lite` |

Routes without a mapped prefix pass through even in `enforce` mode.

Module enablement API (unchanged):

- `GET /api/v1/modules/current`
- `POST /api/v1/modules/current/:moduleKey/enable`
- `POST /api/v1/modules/current/:moduleKey/disable`

---

## Local seed expectations

DB-1 seed (`packages/data/scripts/seed-db1.mjs`) upserts module definitions and **ACTIVE** tenant entitlements for:

- `core`
- `ai-delivery`
- `market-intelligence`
- `finance-lite` (catalog status remains `PLANNED`; tenant entitlement is `ACTIVE` for local operator work)
- `user-settings`

Both local dev tenants receive entitlements:

- `dca-local` — primary `AUTH_SEED_TEST_EMAIL` tenant
- `digital-cube-agency` — DCA foundation tenant

Re-run seed after pulling Block 6 changes:

```powershell
cd C:\dcaosv1
npm.cmd run seed:db1
```

---

## Local verification

See **`docs/security/TENANT_MODULE_ENFORCEMENT_LOCAL_GATE.md`** for the full `off` → `dry_run` → `enforce` gate sequence.

Quick smoke (default `off`):

```powershell
cd C:\dcaosv1
npm.cmd run smoke:tenant-module:local
```

Enforce gate (restart API with `TENANT_MODULE_ENFORCEMENT=enforce` first):

```powershell
$env:SMOKE_EXPECT_TENANT_MODULE_ENFORCE = "true"
npm.cmd run smoke:tenant-module:local
```

Dry-run gate (restart API with `TENANT_MODULE_ENFORCEMENT=dry_run` first):

```powershell
$env:SMOKE_EXPECT_TENANT_MODULE_DRY_RUN = "true"
npm.cmd run smoke:tenant-module:local
```

---

## Rollout guidance

1. **Local / staging:** keep `off` until seed and route map smoke pass.
2. **Staging dry run:** set `dry_run`, exercise operator flows, review API logs for would-block lines.
3. **Staging enforce:** set `enforce`, rerun smokes and browser QA.
4. **Production:** separate owner approval. Default remains `off` in `.env.example` until staging gate passes.

Do not enable production `enforce` until:

- Tenant module entitlements are seeded on the target tenant(s)
- Licensee packaging rules are documented for that tenant class
- Staging smoke and operator QA pass with `enforce`

---

## Related docs

- `docs/frontend/AUTH_TENANT_MODULE_INTEGRATION.md` — frontend module catalog and enablement UI
- `docs/MVP_READINESS.md` — module registry endpoints
- `AGENTS.md` — safety boundaries (no production env changes without approval)
