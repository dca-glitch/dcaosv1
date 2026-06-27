# Puriva MVP Block 15 — Google Drive Export Pre-Staging Gate

**Status:** Local operator gate addition for Google Docs export foundation smoke.

**Scope:** Adds `smoke:google-drive-export` to the local pre-staging orchestrator so the admin export endpoint contract is validated alongside other Puriva MVP local gates.

Related:

- `scripts/smoke-google-drive-export-local.mjs`
- `scripts/smoke-pre-staging-local.ps1`
- `docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`

---

## Run

Included automatically in:

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

Standalone:

```powershell
npm.cmd run smoke:google-drive-export
```

---

## Pass criteria

- Admin auth required (401 without token)
- Export endpoint returns stable `provider_disabled` shape when Google credentials are not configured
- Response excludes forbidden internal fields
