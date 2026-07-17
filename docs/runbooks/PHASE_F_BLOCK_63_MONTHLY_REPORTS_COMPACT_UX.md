# Phase F Block 63 — Monthly Reports Compact UX

**Status:** Earlier compact monthly-report modal pass (92% local scope); current UI direction is Botanical Light.

**Scope:** Frontend polish + operator review checklist. No API contract changes.

Related:

- `apps/web/src/pages/ai-delivery/MonthlyReportPanel.tsx`
- [`PURIVA_MVP_BLOCK_24_MONTHLY_REPORT_ADMIN_BROWSER_PRE_STAGING_GATE.md`](./PURIVA_MVP_BLOCK_24_MONTHLY_REPORT_ADMIN_BROWSER_PRE_STAGING_GATE.md)
- `scripts/smoke-browser-monthly-report-admin-ui.mjs`

---

## Run (focused browser gate)

Requires local API on **4000** and web on **5173**.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:monthly-report:browser
```

---

## Manual review checklist (before archive)

1. Open **AI Delivery** → project **More** → **Monthly Report**.
2. Confirm **Computed Monthly Summary** metric strip shows project, month, deliverable totals.
3. Confirm GA/GSC and 12-month trends show **Deferred** badges (live sync out of scope).
4. Create or load persisted report; save title, admin notes, recommendations, handoff URL.
5. Walk status path: Draft → Admin review → Final → Archive → Restore.
6. Reopen same project — saved fields persist; second project shows no stale leak.
7. Archive only after handoff URL or document attachment is intentional.

---

## Pass criteria

- Monthly report modal opens from AI Delivery project card
- Computed summary section visible with deferred GA/GSC labels
- Full status workflow and form persistence pass browser smoke
- Forbidden internal fields absent from modal DOM

---

## Deferred

- Live GA4 / GSC sync
- Automated PDF generation to production storage
