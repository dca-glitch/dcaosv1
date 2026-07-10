# Puriva MVP Block 21 — Monthly Report Local + PDF Pre-Staging Gate

**Status:** Local operator gate addition for monthly report admin smokes.

**Scope:** Adds `smoke:monthly-report:local` and `smoke:monthly-report:pdf` to the local pre-staging orchestrator after the MI context gate. Snapshot-first local admin lifecycle + PDF generation only — **no live GA/GSC OAuth, no Google API calls**. G85 live GA/GSC planning remains documentation-only in [`MONTHLY_REPORT_LIVE_DATA_PROOF.md`](./MONTHLY_REPORT_LIVE_DATA_PROOF.md) §3.1b; G103-G109 helper guardrails are local pure tests only in §3.1c.

Related:

- `scripts/smoke-monthly-report-local.mjs`
- `scripts/smoke-monthly-report-pdf-local.mjs`
- `scripts/smoke-pre-staging-local.ps1`

---

## Run

Included in `npm run smoke:pre-staging:local`.

Standalone:

```powershell
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:monthly-report:pdf
```

---

## Pass criteria

- Monthly report admin lifecycle smoke passes locally
- PDF generation smoke passes locally; without R2 creds it accepts `R2_STORAGE_NOT_CONFIGURED` and skips byte download proof
- Evidence and operator notes keep MANUAL/placeholder local proof separate from any future live GA/GSC labels
- Helper evidence must not be treated as OAuth consent, token storage, or live analytics proof
