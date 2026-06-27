# Phase F Block 72 — Google Drive Export Guarded Contract

**Scope:** `provider_disabled` + export-config contract smoke. No live service account gate.

Related:

- [`POST_MVP_BLOCK_43_GOOGLE_DRIVE_EXPORT_LIVE_LOCAL_GATE.md`](./POST_MVP_BLOCK_43_GOOGLE_DRIVE_EXPORT_LIVE_LOCAL_GATE.md)
- `scripts/smoke-google-drive-export-local.mjs`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:google-drive-export
```

## Pass criteria

- Export planning returns guarded/disabled response without live Google OAuth
- No service account secrets in output

## Deferred

- `smoke:google-drive-export-live:local` with real service account
