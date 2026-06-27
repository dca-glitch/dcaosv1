# Puriva MVP Block 9 — Client Portal Delivery Overview Browser Gate

**Status:** Local browser gate for populated Puriva delivery overview in Client Portal UI.

**Scope:** Playwright proof that the Client Portal renders client-safe MI summary, Google Docs export link, and website publishing status after the Puriva delivery fixture is seeded.

Related:

- `scripts/smoke-client-portal-browser-local.mjs`
- `scripts/lib/puriva-delivery-summary-fixture.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_7_DELIVERY_SUMMARY_LOCAL_GATE.md`

---

## Prerequisites

1. API on `http://127.0.0.1:4000`
2. Web on `http://localhost:5173` (`npm run dev:web`)
3. `AUTH_SEED_TEST_PASSWORD` set

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run dev:web
npm.cmd run smoke:client-portal:browser
```

Included in `npm run smoke:pre-staging:local` (starts web if port 5173 is free).

---

## Pass criteria

- Delivery overview section visible
- Market Intelligence summary text rendered (not empty-state only)
- Recommended actions visible
- `Open Google Doc` link visible
- Website publishing handoff shows status/host
- Forbidden internal tokens absent from page HTML
