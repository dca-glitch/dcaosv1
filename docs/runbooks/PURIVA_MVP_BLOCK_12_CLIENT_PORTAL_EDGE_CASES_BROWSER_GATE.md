# Puriva MVP Block 12 — Client Portal Edge Cases Browser Gate

**Status:** Local browser gate for empty catalog and archived project visibility in Client Portal UI.

**Scope:** Playwright proof that:

1. Projects with no portal-visible catalog products render the empty catalog state (no inquiry submit UI).
2. Admin-archived AI delivery projects disappear from the portal project list after refresh.
3. Archived filter shows a safe empty state because the client-portal API excludes archived records.

Related:

- `scripts/smoke-client-portal-edge-cases-browser-local.mjs`
- `scripts/smoke-client-portal-local.mjs` (API archive exclusion checks)
- `apps/api/src/core/client-portal.runtime.ts` (`isArchived: false` filters)

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
npm.cmd run smoke:client-portal:edge-cases:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Empty catalog section shows `No catalog products yet`
- Inquiry submit button absent when catalog is empty
- After admin archive + portal refresh, fixture project name absent from active list
- Archived filter does not reveal the archived fixture project
- Portal project detail returns HTTP 404 for archived project id
