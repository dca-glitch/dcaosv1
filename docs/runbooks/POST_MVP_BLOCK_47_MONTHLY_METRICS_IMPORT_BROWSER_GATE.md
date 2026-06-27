# Post-MVP Block 47 — Monthly Metrics Import Browser Gate

**Status:** Local browser gate for AI Delivery monthly report snapshot metrics import UI.

**Scope:** API fixture (client, project, monthly report, metrics import) plus Playwright proof that `#/ai-delivery` Monthly Report modal renders **Snapshot metrics** section and **Import snapshot metrics** control. No live Google sync. No schema or auth changes.

Related:

- `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx`
- `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx`
- `scripts/smoke-monthly-metrics-import-browser-local.mjs`
- `scripts/smoke-monthly-report-metrics-local.mjs` (API metrics matrix)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:monthly-metrics-import:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- API fixture creates client, AI Delivery project, monthly report shell, and imports snapshot metrics
- `#/ai-delivery` renders seeded project card
- Monthly Report modal opens for the fixture project
- **Snapshot metrics** section panel is visible
- **Import snapshot metrics** button is visible (admin-only, snapshot-first)
- No secrets or internal storage keys appear in browser or API responses

---

## Notes

- Snapshot metrics are admin-only and do not sync live with Google (deferred).
- Complements Puriva MVP monthly report smokes without replacing full PDF/portal matrix.
- Client-visible metrics remain gated on FINAL report + Client Portal rules.
