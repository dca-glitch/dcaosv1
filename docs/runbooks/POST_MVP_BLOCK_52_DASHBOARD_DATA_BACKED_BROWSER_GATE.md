# Post-MVP Block 52 — Dashboard Data-Backed Browser Gate

**Status:** Local browser gate for Dashboard command metrics backed by live API session data.

**Scope:** Playwright proof that Dashboard metric cards (`signed-in`, `active-tenant`, `role-coverage`) match values from `GET /auth/me` (or session context) and `GET /tenants/current/authorization-summary`. No schema or backend changes.

Related:

- `apps/web/src/App.tsx` (`DashboardView`)
- `apps/web/src/components/ui/MetricCard.tsx`
- `scripts/smoke-dashboard-data-backed-browser-local.mjs`
- `docs/runbooks/POST_MVP_BLOCK_32_DASHBOARD_METRICS_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:dashboard-data-backed:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- API session returns seeded admin email and active tenant context
- Authorization summary returns role list and effective permission count
- Dashboard **Signed in as** card helper includes admin email
- **Active tenant** card value matches current tenant name from API
- **Role coverage** card value matches roles from authorization summary
- **Workspace state** card reflects tenant-selected vs limited state
- Four command metric cards render with expected `data-metric` keys

---

## Notes

- Frontend polish block; validates data binding not just static shell labels.
- Pairs with Block 51 audit feed on the same dashboard route.
- Block 32 remains the initial MetricCard accessibility/polish gate.
