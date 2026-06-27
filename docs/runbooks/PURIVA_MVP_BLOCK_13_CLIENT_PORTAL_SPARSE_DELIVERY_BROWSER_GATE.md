# Puriva MVP Block 13 — Client Portal Sparse Delivery Overview Browser Gate

**Status:** Local browser gate for pre-handoff delivery overview placeholders in Client Portal UI.

**Scope:** Playwright proof that a linked project without MI handoff, content plan, export URLs, or publication logs renders client-safe sparse placeholders instead of populated Puriva delivery data.

Related:

- `scripts/smoke-client-portal-sparse-delivery-browser-local.mjs`
- `scripts/smoke-client-portal-local.mjs` (sparse delivery summary API checks before Puriva fixture seed)

---

## Prerequisites

1. API on `http://127.0.0.1:4000`
2. Web on `http://localhost:5173`
3. `AUTH_SEED_TEST_PASSWORD` set

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:sparse-delivery:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Delivery overview section renders with AI SEO / MI / publishing cards
- Placeholders visible for missing MI summary, content plan, Google Docs exports, publishing activity
- No `Open Google Doc` link when exports are absent
- Forbidden internal workflow fields absent from rendered overview HTML
