# Post-MVP Block 31 — Audit Feed Browser Gate

**Status:** Local browser gate for the Dashboard read-only audit feed.

**Scope:** Frontend polish for the Dashboard **Recent Activity** panel plus Playwright proof that tenant-scoped audit events render with formatted labels and actor badges. No schema, API contract, auth, or backend changes.

Related:

- `apps/web/src/App.tsx` (`DashboardView` audit feed)
- `scripts/smoke-dashboard-audit-feed-browser-local.mjs`
- `GET /activity/audit-logs?limit=5` (existing read model)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:dashboard:audit-feed:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds and audit logs API returns tenant-scoped events (module toggle seeds events when empty)
- Dashboard **Recent Activity** panel is visible at `#/dashboard`
- UI renders one `.audit-feed-item` per API event (up to 5)
- First item shows a formatted action label (for example `module.enabled` → `Module Enabled`)
- Actor badge displays **User** or **System**

---

## Notes

- Read-only UI only; no audit write paths added in this block.
- Complements future Audit/Activity MVP (ROADMAP Block 25) without replacing it.
