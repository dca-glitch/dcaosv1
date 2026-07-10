# Private delivery / download boundary (G481–G491)

Lane 2 ownership for DCA OS Lite private delivery, export URL, and download boundaries.

**Scope:** design + unit proof only. No live R2 IO. No secrets. No commit/push/deploy from this lane.

Related (do not overwrite): [`STORAGE_R2_PROOF.md`](./STORAGE_R2_PROOF.md), [`CLIENT_PORTAL_STORAGE_BOUNDARY.md`](../security/CLIENT_PORTAL_STORAGE_BOUNDARY.md).

---

## 1. ExportUrl allowed vs storageKey forbidden (G481)

| Audience | `exportUrl` | `downloadUrl` / `downloadReference` | `hasDocument` | `storageKey` / `documentStorageKey` |
|----------|-------------|--------------------------------------|---------------|-------------------------------------|
| Client portal summaries / download | Allowed | Allowed (when issued; truth-labeled) | Allowed | **Forbidden** |
| Admin / operator | Allowed | Allowed | Allowed | Allowed (internal tooling) |

Implementation: `apps/api/src/storage/export-url-storage-key-matrix.ts`.

---

## 2. Client-safe serializer seams (G482–G484)

| Entity | Client-safe output | Forbidden |
|--------|--------------------|-----------|
| Monthly report | `exportUrl`, `hasDocument` (from internal key presence) | `storageKey` |
| Deliverable | `exportUrl` (no key echo even if polluted input) | `storageKey`, notes, draft/image IDs |
| Image asset | `previewImageUrl` / `finalImageUrl`, `hasDocument` | `storageKey` |

Tests live under `apps/api/src/storage/*-storage-key-boundary.test.ts` and import client serializers read-only.

---

## 3. Admin-only private fields inventory (G485)

| Field | Audience | Client |
|-------|----------|--------|
| `storageKey` | Admin | Forbidden |
| `documentStorageKey` | Admin (finance) | Forbidden |

Inventory helper: `private-delivery-download-boundary.ts` → `ADMIN_PRIVATE_FIELD_INVENTORY` (names/purposes only; never raw values).

---

## 4. Client-safe download future proof stages (G486)

| Stage | Truth label | Live IO |
|-------|-------------|---------|
| `local_mock_download` | `mocked` | No |
| `export_url_only` | `export_url` | No |
| `disabled_safe_null_reference` | `mocked` | No |
| `future_signed_url_issuance` | `future_placeholder` | No (deferred) |
| `future_live_bucket_proof` | `future_placeholder` | No (deferred) |

Building a stage plan never claims `liveProven` or live bucket proof.

---

## 5. Local mock download truth labels (G487)

- Mock download URLs must use truth label `mocked`.
- They must never be reported as `live_signed` or `liveProven: true`.
- Helpers: `buildLocalMockDownloadTruth`, `getPrivateStorageLocalMockDownloadReference`.

---

## 6. Download failure redaction (G488)

Client download failure payloads:

- Code: `DOWNLOAD_FAILED`
- Message: redacted via `redactStorageErrorMessage` / `buildDownloadFailureClientError`
- Must not include `storageKey`, tenant object paths, or R2 credential fragments
- `storageKeyExposed: false`, `liveProven: false`

---

## 7. Audit-safe download metadata (G489)

Allowed audit fields (design):

- `event`, `audience`, `entityType`, `entityId`
- `tenantIdHash` (opaque hash — not a secret)
- `hasDocument`, `truthLabel`, `expiresSeconds`, `outcome`
- `storageKeyPresent` (boolean only)
- `liveProven: false`

Forbidden in audit payloads: raw `storageKey`, signed URL query secrets, access keys.

---

## 8. Deferred proposal — real signed URL proof (G491)

**Do not edit** `docs/operator/deferred-scope-register.md` from this lane. Main should register the following proposal text:

### Proposal title

`Private delivery — real signed URL / live R2 download proof`

### Why deferred

Lane G481–G492 proves **boundaries and labels only**. Issuing real Cloudflare R2 signed GET URLs requires owner-approved credentials, a disposable fixture object, cleanup/rollback, and evidence capture outside this no-live lane.

### Preconditions (owner gate)

1. R2 env fully configured in a non-production proof environment
2. Cleanup plan from `r2-cleanup-proof-plan` executed after proof
3. Explicit approval for live bucket IO (not this lane)
4. Client portal download path returns `{ downloadUrl, expiresSeconds }` only — never `storageKey`
5. Log review confirms no key/secret leakage

### Out of scope until registered + approved

- Live `getSignedR2ReadUrl` proof against a real bucket
- Promoting `mocked` / `future_placeholder` labels to `live_signed`
- Any production or VPS R2 action

### Suggested register fields for main

| Field | Value |
|-------|--------|
| ID | (assign next deferred ID) |
| Title | Private delivery real signed URL proof |
| Source gates | G486, G491, STORAGE_R2_PROOF § live checklist |
| Risk | High (live credentials / bucket IO) |
| Blocked by | Owner approval + cleanup plan + non-prod env |
| Lane docs | This file + `CLIENT_PORTAL_STORAGE_BOUNDARY.md` |

---

## 9. Validation (G492)

Focused tests only (no full `validate`):

```powershell
cd C:\dcaosv1
node --import tsx --test apps/api/src/storage/export-url-storage-key-matrix.test.ts apps/api/src/storage/private-delivery-download-boundary.test.ts apps/api/src/storage/private-storage.service.test.ts apps/api/src/storage/monthly-report-export-url-storage-key-boundary.test.ts apps/api/src/storage/deliverable-serializer-storage-key-boundary.test.ts apps/api/src/storage/image-asset-serializer-storage-key-boundary.test.ts
```
