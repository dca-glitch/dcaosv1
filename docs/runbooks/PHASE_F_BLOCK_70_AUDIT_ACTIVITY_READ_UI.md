# Phase F Block 70 — Audit / Activity Read UI

**Scope:** Dashboard read-only audit feed with client-side type filter chips (all / auth / module / tenant).

Related: `apps/web/src/App.tsx` (`DashboardView`)

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:audit-activity:browser
```

## Pass criteria

- Recent Activity section visible on dashboard
- Feed or empty state renders; no destructive actions
- Type filter chips are read-only UI (filters last-5 fetch client-side)
