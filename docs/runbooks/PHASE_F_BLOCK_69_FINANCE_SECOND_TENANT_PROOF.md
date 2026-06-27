# Phase F Block 69 — Finance Second-Tenant Cross-Tenant Proof

**Scope:** Seed fixture adds seed admin membership on `digital-cube-agency` tenant + finance admin browser smoke.

Related:

- `packages/data/scripts/seed-db1.mjs` — `upsertSeedAdminSecondTenantMembership`
- `scripts/lib/finance-second-tenant-fixture.mjs`
- [`POST_MVP_BLOCK_36_FINANCE_ADMIN_BROWSER_GATE.md`](./POST_MVP_BLOCK_36_FINANCE_ADMIN_BROWSER_GATE.md)

## Setup

```powershell
cd C:\dcaosv1
npm.cmd run seed:db1
```

Re-seed after pulling this block so `AUTH_SEED_TEST_EMAIL` has memberships on both `dca-local` and `digital-cube-agency`.

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:finance-admin:browser
```

Optional cross-tenant API proof (uses two-tenant fixture):

```powershell
npm.cmd run smoke:mvp:local
```

Expect finance invoice/bills cross-tenant checks to run (not skip) when login returns ≥2 distinct tenants.

## Pass criteria

- Finance admin Invoices/Bills shells render
- Seed JSON reports `financeIsolationMembership.seedAdminSecondTenant`
- `smoke:mvp:local` cross-tenant checks execute when fixture present
