# Puriva MVP Block 8 — Client Access Pre-Staging Gate

**Status:** Local operator gate addition for ClientUserAccess admin API smoke.

**Scope:** Adds `smoke:client-access:local` to the local pre-staging orchestrator before browser portal smokes.

Related:

- `scripts/smoke-client-access-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_26_CLIENT_ACCESS_ADMIN_BROWSER_GATE.md`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:client-access:local
```

---

## Pass criteria

- Admin can grant, list, and revoke ClientUserAccess without exposing secrets
- Client Portal project visibility is bounded by client-level grants
- Monthly reports remain FINAL-only and hidden after revoke
