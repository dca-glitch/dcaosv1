# Post-MVP Block 43 — Google Drive Export Live Local Gate

**Status:** Local smoke gate for read-only Google Drive export planning config and guarded export endpoint contract.

**Scope:** Read-only `GET /integrations/google-drive/export-config` plus smoke proof that default local mode keeps `liveExportConfigured=false` and export POST returns `provider_disabled`. No live Google API calls in baseline pre-staging.

Related:

- `apps/api/src/services/google-drive-export-planning.service.ts`
- `apps/api/src/services/google-drive.service.ts`
- `scripts/smoke-google-drive-export-live-local.mjs`
- `scripts/smoke-google-drive-export-local.mjs` (Puriva MVP Block 15 baseline export contract)
- `docs/runbooks/PURIVA_MVP_BLOCK_15_GOOGLE_DRIVE_EXPORT_PRE_STAGING_GATE.md`

---

## Run (baseline — Google credentials not configured)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:google-drive-export-live:local
```

Included in `npm run smoke:pre-staging:local`.

**Restart local API** after pulling this block so the export-config route is loaded.

---

## Run (strict Google Drive live — owner/manual only)

1. Stop local API.
2. Set in `.env` or process env (never commit secrets):

```env
GOOGLE_DRIVE_EXPORT_ENABLED=true
GOOGLE_DRIVE_ROOT_FOLDER_ID=<owner-provided-folder-id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<owner-provided-email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<owner-provided-pem>
```

3. Restart API: `npm.cmd run dev:api`
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_GOOGLE_DRIVE_LIVE = "true"
npm.cmd run smoke:google-drive-export-live:local
Remove-Item Env:SMOKE_EXPECT_GOOGLE_DRIVE_LIVE -ErrorAction SilentlyContinue
```

5. Restore `.env` to local defaults before other smokes if needed.

---

## Pass criteria

- Admin login succeeds
- `GET /integrations/google-drive/export-config` returns safe planning snapshot (no PEM, no private key values)
- Baseline: `liveExportConfigured=false`, `exportEnabledFlag=false` (or flag set without full config)
- Export POST returns stable `provider_disabled` shape when credentials are absent
- Response excludes forbidden internal fields (`privateKey`, `storageKey`, etc.)
- Strict mode (optional): `liveExportConfigured=true` when all Google env vars are present

---

## Notes

- Google Drive export remains opt-in; partial env falls back to `provider_disabled`.
- Pre-staging orchestrator keeps baseline disabled path; strict live proof is manual/owner-triggered.
- Production service account and folder provisioning remain a separate owner gate.
