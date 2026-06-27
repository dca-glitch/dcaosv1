# Post-MVP Block 41 — Market Intelligence Operator Browser Gate

**Status:** Local browser smoke gate for MI operator workflow UX panels.

**Scope:** API fixture + Playwright proof that `#/ai-market-intelligence` renders research queue, metric cards, operator workflow steps, and seeded project panels. No backend/schema changes.

Related:

- `apps/web/src/pages/ai-market-intelligence/AiMarketIntelligencePage.tsx`
- `scripts/smoke-mi-operator-browser-local.mjs`
- `scripts/smoke-ai-market-intelligence-local.mjs` (full API matrix)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:mi-operator:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- MI page header and **Research queue** sidebar render
- Seeded project card is selectable
- Operator panels render: **Operator workflow**, **Research sources**, **Research runs**, **Market insights**, **Internal handoffs**
- Metric cards **Sources**, **Runs**, **Insights**, **Handoffs** are visible
- Seeded source appears in **Research sources**

---

## Notes

- Full MI API lifecycle proof remains in `smoke:ai-market-intelligence`.
- This browser gate focuses on operator UX shell gaps not covered by client-domain browser smoke alone.
