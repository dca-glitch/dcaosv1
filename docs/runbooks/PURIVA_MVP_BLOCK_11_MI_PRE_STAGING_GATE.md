# Puriva MVP Block 11 — Market Intelligence Pre-Staging Gate

**Status:** Local operator gate addition for Market Intelligence admin smoke.

**Scope:** Adds `smoke:ai-market-intelligence` to the local pre-staging orchestrator after Client Portal browser smokes.

Related:

- `scripts/smoke-ai-market-intelligence-local.mjs`
- `scripts/smoke-pre-staging-local.ps1`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:ai-market-intelligence
```

---

## Pass criteria

- MI admin lifecycle smoke passes locally
- Client linkage and handoff paths remain available for Puriva delivery summary fixtures
