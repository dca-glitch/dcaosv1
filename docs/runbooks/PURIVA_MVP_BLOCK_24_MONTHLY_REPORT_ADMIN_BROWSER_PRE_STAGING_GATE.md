# Puriva MVP Block 24 — Monthly Report Admin Browser Pre-Staging Gate

**Status:** Local operator gate addition for monthly report admin UI browser smoke.

**Scope:** Adds `smoke:monthly-report:browser` to the local pre-staging orchestrator after the metrics API gate.

Related:

- `scripts/smoke-browser-monthly-report-admin-ui.mjs`
- `scripts/smoke-pre-staging-local.ps1`
- `docs/runbooks/PURIVA_MVP_BLOCK_22_MONTHLY_REPORT_METRICS_PRE_STAGING_GATE.md`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:monthly-report:browser
```

---

## Pass criteria

- AI Delivery project cards expose the Monthly Report action under the **More → Reports** menu
- Admin can create or reopen a report, edit fields, and walk DRAFT → ADMIN_REVIEW → FINAL → ARCHIVED → restore
- Reopen preserves saved state; secondary project modal does not leak primary project edits
- Modal body omits forbidden internal fields (storage keys, prompts, provider cost, etc.)
