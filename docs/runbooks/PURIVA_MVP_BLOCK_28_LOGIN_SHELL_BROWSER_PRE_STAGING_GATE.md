# Puriva MVP Block 28 — Login Shell Browser Pre-Staging Gate

**Status:** Local operator gate addition for unauthenticated web shell smoke.

**Scope:** Adds `smoke:browser` to the local pre-staging orchestrator before authenticated browser smokes.

Related:

- `scripts/smoke-browser-local.mjs`
- `docs/runbooks/PURIVA_MVP_BLOCK_23_CLIENT_PORTAL_SIGNED_OUT_BROWSER_GATE.md`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:browser
```

---

## Pass criteria

- API health reports ready database
- Web app loads Sign In shell with email/password fields
- No relevant browser console errors on initial load
