# Post-MVP Block 32 — Dashboard Metrics Browser Gate

**Status:** Local browser gate for Dashboard command metric cards polish.

**Scope:** Frontend-only polish for the four Dashboard command `MetricCard` tiles (labels, accents, accessibility hooks) plus Playwright proof via the shared dashboard browser smoke. No schema, API, auth, or backend changes.

Related:

- `apps/web/src/components/ui/MetricCard.tsx`
- `apps/web/src/App.tsx` (`DashboardView` command metrics)
- `scripts/smoke-dashboard-audit-feed-browser-local.mjs` (audit feed + metrics checks)
- `docs/runbooks/POST_MVP_BLOCK_31_AUDIT_FEED_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:dashboard:audit-feed:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Dashboard command metric grid renders four cards with `data-metric` keys:
  - `signed-in`
  - `active-tenant`
  - `role-coverage`
  - `workspace-state`
- Signed-in card helper includes the seeded admin email
- Block 31 audit feed checks continue to pass on the same page load
