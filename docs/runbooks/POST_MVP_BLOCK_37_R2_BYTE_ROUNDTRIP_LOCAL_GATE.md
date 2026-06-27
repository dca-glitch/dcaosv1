# Post-MVP Block 37 — R2 Local Byte Roundtrip Gate

**Status:** Local smoke gate for private R2 storage (disabled guard + optional full byte roundtrip).

**Scope:** Dedicated smoke for AI Delivery deliverable private document upload/download. No schema, API contract, auth, or backend changes.

Related:

- `apps/api/src/storage/private-storage.service.ts`
- `apps/api/src/storage/r2.service.ts`
- `scripts/smoke-r2-byte-roundtrip-local.mjs`

---

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:r2-byte-roundtrip:local
```

Included in `npm run smoke:pre-staging:local`.

---

## Pass criteria

### Default local (R2 not configured on running API)

- Deliverable document upload returns `503` with `R2_STORAGE_NOT_CONFIGURED`
- Deliverable `storageKey` remains `null`
- Download reference remains `null`

### Optional full roundtrip (owner-configured local R2)

1. Set in repo `.env` (never commit secrets):

   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - optional: `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`

2. Restart local API so env is loaded.

3. Run with strict expectation:

```powershell
$env:SMOKE_EXPECT_R2_ROUNDTRIP = "true"
npm.cmd run smoke:r2-byte-roundtrip:local
```

Pass when:

- Upload persists non-empty `storageKey` and clears `exportUrl`
- Secure download returns signed URL
- Downloaded object bytes match uploaded payload (SHA-256 check)

---

## Notes

- Prod bucket / VPS R2 switch remains deferred (separate owner gate).
- This block complements existing guarded paths in `smoke:ai-delivery-reviews` and monthly report smokes.
