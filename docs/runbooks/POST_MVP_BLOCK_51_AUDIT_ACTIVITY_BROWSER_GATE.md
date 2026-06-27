# Post-MVP Block 51 — Audit Activity Browser Gate

**Status:** Local browser gate for Dashboard Recent Activity audit feed panel.

**Scope:** Playwright proof on `#/dashboard` that **Recent Activity** section renders audit feed items or a valid empty state. Complements Block 31 with focused audit-activity smoke naming. No audit write paths added.

Related:

- `apps/web/src/App.tsx` (`DashboardView` audit feed)
- `scripts/smoke-audit-activity-browser-local.mjs`
- `scripts/smoke-dashboard-audit-feed-browser-local.mjs` (Block 31 combined audit + metrics)
- `docs/runbooks/POST_MVP_BLOCK_31_AUDIT_FEED_BROWSER_GATE.md`
- `GET /activity/audit-logs?limit=5` (existing read model)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:audit-activity:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- Dashboard **Recent Activity** panel is visible at `#/dashboard`
- When audit logs exist: one `.audit-feed-item` per API event (up to 5)
- When empty: EmptyState title **No recent activity** renders
- First feed item (when present) shows formatted action label and actor badge (**User** or **System**)
- No audit write endpoints invoked by this smoke

---

## Notes

- Read-only UI only; full Audit/Activity MVP (ROADMAP Block 25) remains deferred.
- Module toggle actions during other smokes may seed audit events for feed proof.
- Block 52 adds data-backed metric card cross-checks on the same dashboard.
