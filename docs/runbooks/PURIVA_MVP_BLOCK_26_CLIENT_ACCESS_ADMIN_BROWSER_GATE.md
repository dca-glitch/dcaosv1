# Puriva MVP Block 26 — Client Access Admin Browser Gate

**Status:** Local browser gate for granting ClientUserAccess from the Clients edit modal.

**Scope:** Playwright proof that an admin can link a tenant user to a client in the UI and that the grant unlocks Client Portal project visibility. Complements `smoke:client-access:local` API checks and `smoke:client-portal:access-revoke:browser` revoke UX.

Related:

- `scripts/smoke-client-access-browser-local.mjs`
- `scripts/smoke-client-access-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_14_CLIENT_PORTAL_ACCESS_REVOKE_BROWSER_GATE.md`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-access:browser
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

- Fixture client/project exists with no ClientUserAccess grant
- Client Portal projects API hides the fixture project before grant
- **Edit Client** modal shows **Client access** with empty linked users
- **Link user** adds the admin user to the modal access list
- Admin access API persists the grant
- Client Portal projects API includes the fixture project after grant
