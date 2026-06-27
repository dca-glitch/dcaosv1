# Puriva MVP Block 18 — Monthly Report MI Context Pre-Staging Gate

**Status:** Local operator gate addition for monthly report Market Intelligence context smoke.

**Scope:** Adds `smoke:monthly-report:mi-context` to the local pre-staging orchestrator to validate admin MI context lifecycle and Client Portal non-exposure guards.

Related:

- `scripts/smoke-monthly-report-mi-context-local.mjs`
- `scripts/smoke-pre-staging-local.ps1`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:monthly-report:mi-context
```

---

## Pass criteria

- Admin can apply MI handoff context to monthly report
- Client Portal monthly report responses omit internal MI context fields
- Context remove clears internal fields

**Note:** Requires local API with Market Intelligence routes available. `smoke:pre-staging:local` restarts API with `TENANT_MODULE_ENFORCEMENT=off` before this step.
