# Puriva MVP Block 14 — Client Portal Access Revoke Browser Gate

**Status:** Local browser gate for ClientUserAccess revoke behavior in Client Portal UI.

**Scope:** Playwright proof that a linked project is visible while ClientUserAccess is active, then disappears from the portal after admin revoke + refresh. Complements `smoke:client-access:local` API checks with browser UX proof.

Related:

- `scripts/smoke-client-portal-access-revoke-browser-local.mjs`
- `scripts/smoke-client-access-local.mjs`

---

## Prerequisites

1. API on `http://127.0.0.1:4000`
2. Web on `http://localhost:5173`
3. `AUTH_SEED_TEST_PASSWORD` set

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:access-revoke:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Fixture project visible in portal before revoke
- `POST /clients/:clientId/users/:userId/archive` succeeds
- Portal projects API excludes revoked client's project
- Project detail returns HTTP 404 after revoke
- Browser refresh removes fixture project card from portal list
