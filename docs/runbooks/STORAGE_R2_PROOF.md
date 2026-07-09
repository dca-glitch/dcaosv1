# Storage / R2 Proof Checklist

**Status:** Operator proof gate for Cloudflare R2 private storage in DCA OS Lite.

**Scope:** Deliverable documents, article-image final assets, content-plan PDFs, monthly-report documents/PDFs, finance bill documents, and finance monthly-report PDFs. Does **not** authorize production deploy, VPS changes, or bucket credential commits.

Related:

- [`POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md`](./POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md)
- [`PHASE_F_BLOCK_73_R2_LOCAL_GUARD.md`](./PHASE_F_BLOCK_73_R2_LOCAL_GUARD.md)
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)
- [`../operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) (launch dependency tracker — create/approve separately)
- Code seam: `apps/api/src/storage/private-storage.service.ts`, `apps/api/src/storage/r2.service.ts`, `apps/api/src/storage/r2.config.ts`

---

## 1. Required env var truth table (names only)

| Variable | Required for private R2 | Purpose |
|----------|-------------------------|---------|
| `R2_ACCOUNT_ID` | **Yes** | Cloudflare account id; used to derive default endpoint when `R2_ENDPOINT` absent |
| `R2_ACCESS_KEY_ID` | **Yes** | S3-compatible access key for signed PUT/GET |
| `R2_SECRET_ACCESS_KEY` | **Yes** | S3-compatible secret for request signing |
| `R2_BUCKET_NAME` | **Yes** | Private bucket name; all objects stored under tenant-scoped keys |
| `R2_ENDPOINT` | No | Optional S3 API endpoint override (defaults to `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`) |
| `R2_PUBLIC_BASE_URL` | No | Optional public base URL helper; **must not** be used to expose private deliverables to clients |

**Configured when:** all four required keys are non-empty after trim.

**Disabled mode when:** any required key missing → `getPrivateStorageStatus().mode === "disabled"`; uploads return `503 R2_STORAGE_NOT_CONFIGURED`; no `storageKey` / `documentStorageKey` persistence on guarded write paths.

**Smoke helper (optional):**

| Variable | Purpose |
|----------|---------|
| `SMOKE_EXPECT_R2_ROUNDTRIP` | Set to `true` to require full byte roundtrip in `smoke:r2-byte-roundtrip:local` |

Never commit, print, or log secret values.

---

## 2. Local proof checklist

Run from `C:\dcaosv1`. Stop on first hard failure.

### 2a. Default local (R2 **not** configured — expected safe baseline)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:r2-byte-roundtrip:local
```

Pass when:

- [ ] Deliverable document upload returns `503` with `R2_STORAGE_NOT_CONFIGURED`
- [ ] Deliverable `storageKey` remains `null` after guarded upload attempt
- [ ] Deliverable `download-reference` returns `downloadReference: null`
- [ ] `smoke:ai-delivery-reviews` R2-disabled upload safety still passes (included in broader pre-staging packs)
- [ ] `smoke:ai-seo-content-plan-pdf` proves content-plan PDF guarded behavior and **no `storageKey` in client-visible responses**
- [ ] `smoke:client-portal-local` / `smoke:client-portal-boundary` prove client portal responses contain **no `storageKey`**

### 2b. Optional local byte roundtrip (owner-configured R2 in local `.env`)

Prerequisites:

- [ ] All four required `R2_*` vars set locally (never committed)
- [ ] Local API restarted after env change
- [ ] Dedicated **non-production** bucket used

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_R2_ROUNDTRIP = "true"
npm.cmd run smoke:r2-byte-roundtrip:local
```

Pass when:

- [ ] Deliverable upload persists non-empty `storageKey` and clears `exportUrl`
- [ ] Secure download returns signed URL with `expiresSeconds` (default 300)
- [ ] Downloaded object bytes match uploaded payload (SHA-256 check in smoke)
- [ ] Manual spot-check: article-image final upload + download-reference (admin)
- [ ] Manual spot-check: monthly report document upload + admin download-reference
- [ ] Manual spot-check: bill document upload + admin download

### 2c. Access-control spot checks (local or staging)

- [ ] Admin download routes require `owner`/`admin` + tenant module guard
- [ ] Client portal deliverable download only for `DELIVERED` / `ACCEPTED` statuses
- [ ] Client portal monthly-report download only for `FINAL` + non-archived reports
- [ ] Cross-tenant and cross-project IDs return `404` (not `403` leakage)
- [ ] Client download responses expose only `{ downloadUrl, expiresSeconds }` inside `downloadReference`

---

## 3. Live R2 proof checklist (staging / production bucket — separate owner approval)

**Do not run against production without an explicit owner-approved block naming the target environment and bucket.**

Prerequisites:

- [ ] Staging (or approved pre-prod) bucket provisioned and isolated from production
- [ ] `R2_*` vars set only in target environment secrets store (not repo)
- [ ] CORS / bucket policy reviewed: private objects, no public listing
- [ ] API container restarted after secret injection

Proof steps:

- [ ] Upload deliverable PDF → verify object exists at expected tenant/project key prefix (`tenants/{tenant}/years/{yyyy}/projects/{project}/months/{mm}/documents/...`)
- [ ] Fetch admin `download-reference` → signed URL returns `200` and correct `Content-Type`
- [ ] Re-fetch after `expiresSeconds` → URL expired / denied
- [ ] Client portal download for a `DELIVERED` deliverable returns signed URL only (no `storageKey` in JSON)
- [ ] Client portal download for `DRAFT` deliverable returns `404` or null reference (no bypass)
- [ ] Bill / invoice / credit-note document download works for same tenant only
- [ ] Content-plan PDF stale guard: after plan edit, prior `storageKey` cleared server-side; regenerate required
- [ ] Monthly report: re-upload or regenerate after content edit if operator policy requires fresh document
- [ ] Log review: no raw `storageKey` or secret values in API access logs

Record evidence to `$env:TEMP` and reference in docs-only closeout (separate commit approval).

---

## 4. Client-safe access expectations

| Surface | Allowed | Forbidden |
|---------|---------|-----------|
| Client portal list/detail/summary APIs | `hasDocument`, `exportUrl` (when intentionally client-safe), signed `downloadReference.downloadUrl` | Raw `storageKey`, internal bucket paths, admin-only notes |
| Client portal download endpoints | `{ downloadReference: { downloadUrl, expiresSeconds } \| null }` | `storageKey`, permanent public URLs |
| Admin / operator APIs | `storageKey` in admin summaries and some admin `download-reference` payloads (internal tooling) | Returning `storageKey` on any client-role session |
| Finance admin | `documentStorageKey` internal; download via signed reference | Client access to bill/invoice private docs |

Signed download URLs are **temporary** (300s default). Clients must request a fresh reference per download action.

There is **no local filesystem fallback**. Disabled mode is intentional and safe: guarded writes fail closed without persisting storage references.

---

## 5. STOP criteria

Stop immediately and do **not** claim storage readiness if any of the following are true:

- Required `R2_*` secrets are missing but uploads persist `storageKey` / `documentStorageKey` anyway
- Client portal or client-role API response contains `storageKey` (smoke or manual JSON inspection)
- Cross-tenant download succeeds (wrong `tenantId` / `projectId` pairing returns document bytes)
- Guarded upload returns `200`/`201` without configured R2
- Production bucket credentials are used in local dev or committed to git
- Signed URL does not expire or bucket objects are world-readable
- Live bucket proof was assumed from local disabled-mode smoke alone
- Any doubt about which bucket/environment is active

---

## 6. Puriva launch dependency status

| Dependency | Status | Notes |
|------------|--------|-------|
| Private storage disabled-safe foundation | **Done (local)** | Guarded uploads, signed download helper, 5 MB / pdf+image validation |
| Local R2 byte roundtrip smoke | **Available** | `npm run smoke:r2-byte-roundtrip:local`; strict mode via `SMOKE_EXPECT_R2_ROUNDTRIP` |
| Staging bucket proof | **Deferred** | Requires owner-approved env + live checklist §3 |
| Production bucket proof | **Deferred** | Separate from staging; see `deferred-scope-register.md` |
| Client portal storage boundary smokes | **Done (local)** | `storageKey` hidden from client responses |
| Puriva launch gate | **Blocked** | Live R2 IO remains a launch dependency; track in `PURIVA_LAUNCH_GATE.md` |

**Launch rule:** Puriva cannot claim production-ready private document delivery until live R2 proof (§3) passes on the target environment bucket **and** client-boundary smokes pass with R2 enabled.

---

## 7. Quick command reference

```powershell
cd C:\dcaosv1
npm.cmd run smoke:r2-byte-roundtrip:local
npm.cmd run smoke:ai-delivery-reviews
npm.cmd run smoke:ai-seo-content-plan-pdf
npm.cmd run smoke:client-portal-local
npm.cmd run smoke:puriva-client-portal-boundary:local
```

Included in `npm run smoke:pre-staging:local` (disabled-safe baseline).
