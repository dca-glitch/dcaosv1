# Puriva MVP Block 10 — Client Portal Catalog Inquiry Browser Gate

**Status:** Local browser gate for inquiry-only product catalog flow in Client Portal UI.

**Scope:** Playwright proof that a portal-visible catalog product renders and the client can submit an inquiry form (no cart/checkout). Submission persists for admin review via Client Hub.

Related:

- `scripts/smoke-client-portal-browser-local.mjs` (catalog inquiry assertions appended to Block 9 browser gate)
- `scripts/smoke-client-portal-local.mjs` (API-level catalog inquiry proof)
- `docs/runbooks/PURIVA_MVP_BLOCK_9_CLIENT_PORTAL_BROWSER_GATE.md`

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

- Product catalog inquiry section visible after opening a project
- Portal-visible catalog product name rendered
- Inquiry-only disclaimer visible (no cart/checkout/payment)
- Form submission returns HTTP 201
- Success notice shown in portal UI
- Admin `GET /clients/:clientId/catalog-inquiries` includes the browser submission
