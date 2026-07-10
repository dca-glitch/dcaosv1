# StorageKey Redaction Inventory (G639)

**Status:** Read-only inventory refresh for G637–G648. No R2 live IO. SEC-H1 remains the primary regression; this lane does not rewrite that integration test.

**Context (G469–G708):** Local storage/no-IO foundations continue to expand (proof stages, download-boundary helpers, export-url matrices). Real R2 bucket IO, target-env signed-URL proof, and staging/production storageKey re-verification remain **deferred**. Recommended first launch-blocker candidate remains R2 target-bucket proof (owner-selected; see G468 next-50). Production remains frozen.

**Honesty rule:** Local serializer/boundary tests ≠ staging/production non-exposure proof.

---

## 1. Policy summary

| Audience | `storageKey` / `documentStorageKey` | Allowed signals |
|---|---|---|
| Client Portal / client role | **Forbidden** | `hasDocument`, safe `exportUrl` / download reference shapes |
| Admin list/summary JSON (AI Delivery) | **Forbidden** after SEC-H1 | `hasDocument` |
| Admin download-reference handlers | **Allowed** (audited exception) | `storageKey` + signed `downloadUrl` together |
| Internal Prisma selects | Allowed in memory | Must not serialize to client JSON |

Policy constants: `apps/api/src/storage/admin-vs-client-storage-field-policy.ts`.

---

## 2. Runtime shaping (primary)

| Surface | Path / symbol | Behavior |
|---|---|---|
| Client Portal deliverables | `client-portal.runtime.ts` | Narrow select; `storageKey` used only for download/hasDocument |
| Client Portal monthly reports | same | FINAL-only; `hasDocument: !!storageKey`; key not returned |
| Admin AI Delivery summaries | `core.runtime.ts` mappers | SEC-H1: `hasDocument` only on list/detail |
| R2 proof stages | `r2-proof-stage.ts` | `clientSafe` flags per stage; `liveProven` false unless real IO claimed |
| Private storage proof intent | `private-storage-proof-intent.ts` | Labels client-safe download vs config-shape |

---

## 3. Shared helpers (HEAD + observed)

| Helper | Path | Role | In HEAD `66dcb74`? |
|---|---|---|---|
| `assertNoStorageKeyLeak` | `storage-key-boundary.ts` | Throws if field or raw key value present | Yes |
| `collectForbiddenStorageKeyFields` / paths | same | Walks object tree | Yes |
| `toStorageKeyBoundarySnapshot` | same | Boolean leak flags; `liveProven: false` | Yes |
| `redactStorageErrorMessage` | `storage-error-redaction.ts` | Scrubs key paths from error text | Yes (Lane 1 owns) |
| `payloadRespectsClientStorageFieldPolicy` | `admin-vs-client-storage-field-policy.ts` | Client field allow/deny | Yes |
| Private delivery download boundary | `private-delivery-download-boundary.ts` | Admin-only field inventory + client-safe URL labels | Tracked (storage lane) |
| Export URL storage-key matrix | `export-url-storage-key-matrix.ts` | Matrix of exportUrl vs storageKey exposure | Tracked when present (storage lane) |

---

## 4. Focused tests (do not weaken)

| Test | Path | Owner note |
|---|---|---|
| SEC-H1 integration | `tests/integration/sec-h1-storage-key-leak.integration.test.ts` | Primary L1-owned regression — extend carefully only |
| Deliverable serializer boundary | `deliverable-serializer-storage-key-boundary.test.ts` | Present |
| Image asset serializer boundary | `image-asset-serializer-storage-key-boundary.test.ts` | Present |
| Monthly report exportUrl boundary | `monthly-report-export-url-storage-key-boundary.test.ts` | Present |
| Storage-key boundary unit | `storage-key-boundary.test.ts` | Present |
| Briefs tenant boundary (no storageKey) | `briefs-tenant-boundary.integration.test.ts` | Present |
| Monthly report metrics output guard | `monthly-report-metrics-output-guard.test.ts` | Present |
| Client portal runtime | `client-portal.runtime.test.ts` | Present |

---

## 5. Remaining blockers / deferred

| Item | Status |
|---|---|
| Target-env re-verification of non-exposure (G473-class) | Deferred — owner-approved staging/prod session |
| Real R2 bucket signed-URL proof (G471-class) | Deferred |
| Frontend admin UI still reading `.storageKey` in places | Functional follow-up (see `SECURITY_BOUNDARY_AUDIT.md`); not a re-leak of API field if API stays clean |
| Promoting local `liveProven: false` snapshots to live proof | Forbidden without recorded IO evidence |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Live R2: **not claimed**. Production readiness: **NO**. Puriva Launch: **BLOCKED**.
