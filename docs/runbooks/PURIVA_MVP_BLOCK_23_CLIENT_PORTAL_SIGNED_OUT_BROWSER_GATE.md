# Puriva MVP Block 23 — Client Portal Signed-Out Browser Gate

**Status:** Local browser gate for unauthenticated Client Portal access boundaries.

**Scope:** Playwright proof that `#/client-portal` shows the sign-in shell without a valid session, loads the portal only after auth, and returns to sign-in after logout or invalid token. Complements `smoke:client-portal:local` API 401 checks with browser UX proof.

Related:

- `scripts/smoke-client-portal-signed-out-browser-local.mjs`
- `scripts/smoke-client-portal-local.mjs`

---

## Prerequisites

1. API on `http://127.0.0.1:4000`
2. Web on `http://localhost:5173`
3. `AUTH_SEED_TEST_PASSWORD` set

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:signed-out:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- `/client-portal/projects` without token returns HTTP 401 `AUTH_UNAUTHORIZED`
- `#/client-portal` without session token shows **Sign In**, not **Client Portal**
- Valid admin session loads Client Portal heading
- Logout clears session token and hides portal UI
- Invalid session token is rejected and shows sign-in again
