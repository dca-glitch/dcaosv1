# Post-MVP Block 42 — AI Delivery Workflow Browser Gate

**Status:** Local browser smoke gate for AI Delivery operator workflow navigation matrix.

**Scope:** API fixture (project + executed workflow run) + Playwright proof on `#/ai-delivery` for operator summary, workflow runs modal, content plan modal, and grouped navigation. No backend/schema changes.

Related:

- `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx`
- `scripts/smoke-ai-delivery-workflow-browser-local.mjs`
- `scripts/smoke-ai-delivery-reviews-local.mjs` (full API + extended browser regression)

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-delivery-workflow:browser
```

Requires local web on port **5173** and API on port **4000**.

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Admin login succeeds
- API fixture executes a workflow run with local deterministic gateway metadata
- **AI Delivery Projects** page and **Operator summary** render
- Seeded project card opens **Workflow Runs** modal with execution log details
- **AI SEO / Content Plan** modal renders **Current content plan status**
- **More** menu shows grouped workflow navigation labels

---

## Notes

- Full AI Delivery review/deliverable matrix remains in `smoke:ai-delivery-reviews`.
- This browser gate is a focused operator navigation proof for pre-staging closeout.
