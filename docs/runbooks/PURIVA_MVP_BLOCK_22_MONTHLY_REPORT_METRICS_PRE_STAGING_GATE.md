# Puriva MVP Block 22 — Monthly Report Metrics Pre-Staging Gate

**Status:** Local operator gate addition for monthly report metrics API smoke.

**Scope:** Adds `smoke:monthly-report:metrics` to the local pre-staging orchestrator after the PDF gate.

Related:

- `scripts/smoke-monthly-report-metrics-local.mjs`
- `scripts/smoke-pre-staging-local.ps1`
- `docs/runbooks/PURIVA_MVP_BLOCK_21_MONTHLY_REPORT_PRE_STAGING_GATE.md`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:monthly-report:metrics
```

---

## Pass criteria

- Admin can import, approve, read, and archive a monthly metrics snapshot
- Metrics GET returns report context, one snapshot, and `computedTrendSummary.dataStatus = PARTIAL`
- Responses omit forbidden internal fields (storage keys, tenant IDs, draft bodies, etc.)
