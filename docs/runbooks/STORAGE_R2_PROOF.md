# Storage / R2 Proof Checklist

**Status:** Operator proof gate for Cloudflare R2 private storage in DCA OS Lite.

**Scope:** Deliverable documents, article-image final assets, content-plan PDFs, monthly-report documents/PDFs, finance bill documents, and finance monthly-report PDFs. Does **not** authorize production deploy, VPS changes, or bucket credential commits.

Related:

- [`POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md`](./POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md)
- [`PHASE_F_BLOCK_73_R2_LOCAL_GUARD.md`](./PHASE_F_BLOCK_73_R2_LOCAL_GUARD.md)
- [`../operator/ENV_READINESS_INVENTORY.md`](../operator/ENV_READINESS_INVENTORY.md)
- [`../operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) (launch dependency tracker — create/approve separately)
- Code seam: `apps/api/src/storage/private-storage.service.ts`, `apps/api/src/storage/r2.service.ts`, `apps/api/src/storage/r2.config.ts`, `apps/api/src/storage/r2-proof-stage.ts`, `apps/api/src/storage/private-storage-proof-intent.ts`, `apps/api/src/storage/client-safe-storage-url-policy.ts`, `apps/api/src/storage/r2-cleanup-proof-plan.ts`, `apps/api/src/storage/r2-partial-config-diagnostics.ts`, `apps/api/src/storage/storage-key-boundary.ts`, `apps/api/src/storage/admin-vs-client-storage-field-policy.ts`, `apps/api/src/storage/storage-error-redaction.ts`
- Closeout: [`STORAGE_R2_G229_G248_CLOSEOUT.md`](./STORAGE_R2_G229_G248_CLOSEOUT.md)

---

## 0. Six-area coverage map (proof scope confirmation)

This table maps the six required proof areas for private R2 storage to where each is actually exercised today. **Coverage confirmed by code/doc inspection only — no live bucket calls were made to produce this section.**

| Proof area | Where covered | Status |
|---|---|---|
| Document roundtrip (deliverable/report/bill documents) | §2b (`smoke:r2-byte-roundtrip:local`, `SMOKE_EXPECT_R2_ROUNDTRIP=true`) | **Automated** — upload → signed download → SHA-256 byte match |
| Hero / supporting / social image variants | §8 + `smoke:r2-storage-boundary:local` | **Scaffold verified** — four variant slots in image-generation foundation; live image byte roundtrip still deferred |
| Signed URL (issuance + expiry) | §2b (issuance, `expiresSeconds`), §3 (expiry re-fetch on staging) | **Automated locally for issuance; expiry re-fetch is staging-only manual step** |
| Cross-tenant denial | §2c + `r2-storage-boundary.integration.test.ts` | **Partially automated** — unknown cross-tenant ids return 404/null; full two-tenant live smoke still owner-gated |
| Disabled mode fail-closed | §2a + `smoke:r2-storage-boundary:local` | **Automated** — `503 R2_STORAGE_NOT_CONFIGURED`, `hasDocument` only in list JSON, `downloadReference` null when disabled |
| Cleanup (smoke fixture teardown) | §2d (new) | **Not automated** — see §2d for the exact reason and current mitigation |

Read §2d and §9 before assuming any "Not automated" row above is safe to skip in a future live-proof block.

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

**Disabled storage mode when:** any required key missing → `getPrivateStorageStatus().mode === "disabled"`; uploads return `503 R2_STORAGE_NOT_CONFIGURED`; no `storageKey` / `documentStorageKey` persistence on guarded write paths. Readiness status is `disabled` when all required keys are absent and `missing_config` when only part of the required shape is present.

**Smoke helper (optional):**

| Variable | Purpose |
|----------|---------|
| `SMOKE_EXPECT_R2_ROUNDTRIP` | Set to `true` to require full byte roundtrip in `smoke:r2-byte-roundtrip:local` |

Never commit, print, or log secret values.

### 1a. Current proof-stage constants (no live bucket proof)

`apps/api/src/storage/r2-proof-stage.ts` defines the typed proof stages used by the R2 proof plan:

| Stage | Current meaning | Live R2 IO | Truth label (no IO) |
|---|---|---|---|
| `local_mock` | Local/mock no-IO proof | No | `local_mock_no_io` |
| `config_shape` | Required env shape and serializer checks only | No | `config_shape_only` |
| `future_real_bucket` | Future owner-approved real bucket proof | Yes, future only | `future_real_bucket_not_executed` until IO actually runs |
| `client_safe_download` | Client-safe response boundary: `exportUrl` / signed `downloadUrl`, no raw `storageKey` | No | `client_safe_boundary_only` |
| `cleanup` | Fixture cleanup planning before live proof | No | `cleanup_plan_only` |

**Hardening (G149):** invalid stage keys resolve to `null`; no-IO stages never claim live proof; `claimsLiveBucketProof(stage, ioPerformed)` is true only when the stage allows IO **and** IO actually ran.

**Related pure helpers (still no live bucket IO):**

| Helper | File | Purpose |
|---|---|---|
| Private storage proof intent | `private-storage-proof-intent.ts` | Builds labeled intent objects; `liveIoPerformed` / `claimsLiveBucketProof` always `false`; invalid stages resolve to error (no invented live intent) |
| Client-safe URL policy | `client-safe-storage-url-policy.ts` | Allows `exportUrl` / `downloadUrl`; strips `storageKey`; truth-labels `mocked` / `future_placeholder` / `live_signed`; `liveProven: false` on payloads |
| R2 cleanup proof plan | `r2-cleanup-proof-plan.ts` | Typed create → read/download → delete → verify → rollback/failure-stop plan; `executedInThisModule: false` |
| Redacted config summary | `r2.config.ts` → `getR2ConfigRedactedSummary()` / `toR2ConfigRedactedSummarySnapshot()` | Boolean presence + `disabled` / `missing_config` / `configured_shape_ok`; always `liveProven: false` |
| Partial-config diagnostics | `r2-partial-config-diagnostics.ts` | Missing/present **key names only**; fail-closed when not fully configured |
| Storage key boundary | `storage-key-boundary.ts` | Shared `storageKey` / `documentStorageKey` leak assertions for serializer tests |
| Admin vs client field policy | `admin-vs-client-storage-field-policy.ts` | Client forbids `storageKey` / `documentStorageKey`; admin may include them |
| Storage error redaction | `storage-error-redaction.ts` | Scrubs storageKey paths, R2 secret fragments, and stack traces from messages |

**Hardening (G229–G244):** exhaustive proof-stage edges, redacted summary snapshots, disabled/partial diagnostics, no-IO-only label invariant, cleanup plan invariant, proof-intent invalid input rejection, client-safe URL truth labels, serializer no-leak tests, admin-vs-client field policy, and storage error redaction — all **no live R2 IO**.

**Current truth:** this runbook has not recorded a successful real R2 bucket proof for DCA OS Lite. The current automated coverage is config-shape, disabled/missing-config guards, secret non-serialization, proof-stage labeling, cleanup **plan** constants, and client-safe serializer boundaries only. Full env → `configured_shape_ok` is **not** live-proven.

### 1b. Boolean-only presence check (no secret values ever printed)

Code seam `apps/api/src/storage/r2.config.ts` exposes `getR2EnvPresence()`, which returns **booleans only** — never the raw values — for exactly this purpose. Use this shape (not `console.log(process.env.R2_...)`) whenever presence needs to be confirmed locally, in a smoke script, or in a status report:

```json
{
  "R2_ACCOUNT_ID": false,
  "R2_ACCESS_KEY_ID": false,
  "R2_SECRET_ACCESS_KEY": false,
  "R2_BUCKET_NAME": false,
  "R2_ENDPOINT": false,
  "R2_PUBLIC_BASE_URL": false
}
```

- [ ] All four required keys (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) report `true` before attempting §2b or §3
- [ ] `getR2Config()` returns non-`null` only when all four required booleans above are `true` (see `r2.config.ts` lines 35–56)
- [ ] Any report, log, or status doc referencing R2 readiness uses this boolean shape, never raw values
- [ ] `scripts/smoke-r2-byte-roundtrip-local.mjs` already performs an equivalent boolean-only presence check (`getMissingR2EnvKeys()`) before touching the API — reuse that pattern rather than adding a new one

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

### 2d. Test fixture cleanup

`scripts/smoke-r2-byte-roundtrip-local.mjs` creates a client, an AI Delivery project, and a deliverable via the public API on every run (`createDeliverableFixture`) and **does not delete them afterward**.

- [ ] Confirmed: no `DELETE /clients/:id` or `DELETE /ai-delivery-projects/:id` endpoint exists in the current API surface (checked `apps/api/src` routes) — automated cleanup is not possible without a backend change, which is out of scope for this docs-only pass
- [ ] Local/dev database only: fixtures use the `[SMOKE][R2_BYTE_ROUNDTRIP]` marker prefix in client/project/deliverable names, so they are identifiable and safe to leave in a local/dev database
- [ ] **Never** run `smoke:r2-byte-roundtrip:local` against a staging or production database — there is no cleanup path and fixtures would persist
- [ ] If a staging bucket proof (§3) reuses this script or a variant, add an explicit fixture-teardown step (manual DB delete or a scoped admin cleanup endpoint) to the block plan **before** running it, and get owner approval for both the live call and the cleanup mechanism
- [ ] See §9 for the proposed cleanup enhancement (logged, not implemented in this pass)

---

## 3. Live R2 proof checklist (staging / production bucket — separate owner approval)

**Do not run against production without an explicit owner-approved block naming the target environment and bucket.**

**G246 refresh (2026-07-10):** Local no-IO foundations for G229–G244 are complete (proof-stage edges, redacted snapshots, disabled/partial diagnostics, cleanup plan invariants, client-safe URL/serializer boundaries, admin-vs-client field policy, error redaction). This section remains the **target-environment** checklist only — completing local unit tests does **not** satisfy §3. Owner approval is still required before any live bucket IO.

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

**URL truth labels (G152):** mocked or future placeholder download URLs must be labeled (`mocked` / `future_placeholder`) so they are not mistaken for live signed URLs (`live_signed`). Policy helper: `client-safe-storage-url-policy.ts`.

**Serializer boundary unit coverage under `apps/api/src/storage/` (no live IO):**

| Gate | Test file | What it proves |
|---|---|---|
| G153 / G240 | `deliverable-serializer-storage-key-boundary.test.ts` | Client portal deliverable summary keeps `exportUrl`, never emits `storageKey` |
| G154 / G241 | `image-asset-serializer-storage-key-boundary.test.ts` | Image client-safe variants + article-image boundary mirror: `hasDocument` only, no `storageKey` |
| G155 / G242 | `monthly-report-export-url-storage-key-boundary.test.ts` | Monthly report `exportUrl` allowed; `storageKey` → `hasDocument` only |
| G239 | `storage-key-boundary.test.ts` | Shared leak helper covers `storageKey` + `documentStorageKey` |
| G243 | `admin-vs-client-storage-field-policy.test.ts` | Admin may see storage keys; client must not |

There is **no local filesystem fallback**. Disabled mode is intentional and safe: guarded writes fail closed without persisting storage references.

### 4a. Cleanup / rollback proof plan (constants only — G156)

`r2-cleanup-proof-plan.ts` defines the ordered plan for a **future** live cleanup proof. Building the plan does **not** create, read, or delete bucket objects.

| Step | Key | Live IO when executed later |
|---|---|---|
| 1 | `create_test_object` | Yes (future) |
| 2 | `read_download` | Yes (future) |
| 3 | `delete` | Yes (future) |
| 4 | `verify_delete` | Yes (future) |
| 5 | `rollback_failure_stop` | No — stop and record rollback need |

Any failure in a future live run must stop; do not continue past a failed step.

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
| Automated cross-tenant denial smoke (R2 document routes) | **Gap — proposed** | Not yet automated; see §0 and §9 (#1) |
| Smoke fixture cleanup | **Gap — proposed** | No delete endpoint exists; see §2d and §9 (#2) |
| Hero/supporting/social image variant R2 roundtrip | **Blocked** | No live image provider wired; see §8.3 and §9 (#3) |
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

Focused storage helper unit tests (no live R2 IO) — preferred single command (G247):

```powershell
cd C:\dcaosv1
node --import tsx --test apps/api/src/storage/*.test.ts
```

Equivalent per-file commands (same suite):

```powershell
cd C:\dcaosv1\apps\api
node --import tsx --test src/storage/r2-proof-stage.test.ts
node --import tsx --test src/storage/r2.config.test.ts
node --import tsx --test src/storage/private-storage-proof-intent.test.ts
node --import tsx --test src/storage/client-safe-storage-url-policy.test.ts
node --import tsx --test src/storage/r2-cleanup-proof-plan.test.ts
node --import tsx --test src/storage/deliverable-serializer-storage-key-boundary.test.ts
node --import tsx --test src/storage/image-asset-serializer-storage-key-boundary.test.ts
node --import tsx --test src/storage/monthly-report-export-url-storage-key-boundary.test.ts
node --import tsx --test src/storage/storage-key-boundary.test.ts
node --import tsx --test src/storage/admin-vs-client-storage-field-policy.test.ts
node --import tsx --test src/storage/storage-error-redaction.test.ts
```

Included in `npm run smoke:pre-staging:local` (disabled-safe baseline).

---

## 8. Generated image storage (Puriva dependency)

**Scope extension:** AI-generated article images (hero, supporting, social preview) use the same private R2 path as deliverable documents and article-image final assets.

### 8.1 Expected object layout

```
tenants/{tenantId}/years/{yyyy}/projects/{projectId}/months/{mm}/images/{imageId}/{variant}.png
```

Variants: `hero`, `supporting-1`, `supporting-2`, `social-preview`, `thumb-{variant}`.

### 8.2 Metadata stored server-side (not client-visible)

| Field | Stored | Client API |
|-------|--------|------------|
| `storageKey` | Yes | **Never** |
| `prompt` | Yes (learning) | **Never** |
| `provider` / `model` | Yes | **Never** |
| `altText` / `caption` | Yes | Yes (approved only) |
| `previewImageUrl` | Signed short-lived | Yes |
| Provider original URL | Optional internal | **Never** if public/unsafe |

### 8.3 Image-specific live proof checklist (staging)

**Current local coverage:** none. There is no live provider wired (`IMAGE_GENERATION_PROOF.md` §2), so no hero/supporting/social variant bytes exist to upload or roundtrip yet. `smoke:r2-byte-roundtrip:local` proves the document path only. Do not claim variant-level R2 proof from the document-only smoke. See §9 for the proposed local deterministic variant smoke (mock bytes, no live provider) that could close this gap once Phase B/C of `IMAGE_GENERATION_PROOF.md` starts.

Prerequisites: §3 complete for documents; `IMAGE_GENERATION_PROOF.md` Phase D approved.

- [ ] Mock or live provider returns PNG bytes → upload persists `storageKey` on `AiDeliveryArticleImage`
- [ ] Admin `download-reference` returns signed URL; JSON has no raw `storageKey` on list endpoints (SEC-H1 alignment)
- [ ] Client portal image preview uses signed URL only
- [ ] Thumbnail variant readable via signed URL
- [ ] Social preview variant stored and attachable to WordPress draft meta
- [ ] Cross-tenant image ID returns `404`/`403` without bytes
- [ ] Regenerate-after-reject replaces `storageKey` and clears stale signed URLs
- [ ] Disabled R2: generation queue fails closed; no orphan keys

### 8.4 Code gaps (2026-07-09)

| Gap | Location | Block |
|-----|----------|-------|
| No provider→bytes pipeline | Not implemented | IMG-PROVIDER-1 |
| List endpoint returns `storageKey` | `core.runtime.ts` deliverable + article image summaries | SEC-H1 |
| Social preview generation | Not implemented | IMG-SOCIAL-1 |
| Image readiness category | `external-integrations-readiness.service.ts` | IMG-READY-1 |

See [`IMAGE_GENERATION_PROOF.md`](./IMAGE_GENERATION_PROOF.md) for full product flow.

---

## 9. Proposed scripts (logged for a future block — not implemented in this pass)

This docs-only pass identified three automation gaps against the six required proof areas (§0). None were implemented here because implementation is out of scope for a docs-only block; each is logged with enough detail to be picked up trivially in a future scoped block. Full proposal detail is also written to `$env:TEMP\dca-subagent-d-r2.log`.

| # | Proposed script | Closes gap | Est. effort | Blocker |
|---|---|---|---|---|
| 1 | `scripts/smoke-r2-cross-tenant-denial-local.mjs` | Cross-tenant denial (automated) | Small — reuse `createDeliverableFixture` pattern from `smoke-r2-byte-roundtrip-local.mjs` twice (tenant A, tenant B), then assert tenant B's session gets `404` on tenant A's deliverable `document`/`download`/`download-reference` routes | None — can run today against existing routes |
| 2 | Extend `smoke-r2-byte-roundtrip-local.mjs` with a fixture-teardown step, or add a scoped internal cleanup endpoint | Cleanup (automated) | Small script-side (mark-and-report only) to Medium (real delete requires a new `DELETE` endpoint, which is a backend change requiring separate approval) | Backend change needed for real deletion; script-side marking is trivial and available now |
| 3 | `scripts/smoke-r2-image-variant-roundtrip-local.mjs` (mock bytes, no live provider) | Hero/supporting/social variant roundtrip (local deterministic only) | Medium — needs a deterministic PNG fixture per variant plus whatever local upload endpoint `IMAGE_GENERATION_PROOF.md` Phase B/C introduces | Blocked on `IMAGE_GENERATION_PROOF.md` Phase B (disabled-safe wiring) landing first; cannot be written against code that doesn't exist yet |

**Recommendation for the next owner-approved block:** do #1 first (no blockers, closes a real proof gap today); do #2's script-side half alongside #1; defer #3 until `IMAGE_GENERATION_PROOF.md` Phase B lands.
