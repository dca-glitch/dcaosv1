# StorageKey Redaction Inventory (G411)

**Status:** Read-only inventory for G409–G428. No R2 live IO. SEC-H1 remains the primary regression; this lane does not rewrite that integration test.

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
| R2 proof stages | `r2-proof-stage.ts` | `clientSafe` flags per stage |
| Private storage proof intent | `private-storage-proof-intent.ts` | Labels client-safe download vs config-shape |

---

## 3. Shared helpers

| Helper | Path | Role |
|---|---|---|
| `assertNoStorageKeyLeak` | `storage-key-boundary.ts` | Throws if field or raw key value present |
| `collectForbiddenStorageKeyFields` | same | Walks object tree |
| `toStorageKeyBoundarySnapshot` | same | Boolean leak flags; `liveProven: false` |
| `redactStorageErrorMessage` | `storage-error-redaction.ts` | Scrubs key paths from error text |
| `payloadRespectsClientStorageFieldPolicy` | `admin-vs-client-storage-field-policy.ts` | Client field allow/deny |

---

## 4. Focused tests (do not weaken)

| Test | Path | Owner note |
|---|---|---|
| SEC-H1 integration | `tests/integration/sec-h1-storage-key-leak.integration.test.ts` | Primary L1-owned regression — extend carefully only |
| Deliverable serializer boundary | `deliverable-serializer-storage-key-boundary.test.ts` | Present |
| Image asset serializer boundary | `image-asset-serializer-storage-key-boundary.test.ts` | Present |
| Monthly report exportUrl boundary | `monthly-report-export-url-storage-key-boundary.test.ts` | Present |
| Briefs tenant boundary (no storageKey) | `briefs-tenant-boundary.integration.test.ts` | Present |
| Monthly report metrics output guard | `monthly-report-metrics-output-guard.test.ts` | Present |
| Client portal runtime | `client-portal.runtime.test.ts` | Present |

---

## 5. Remaining blockers

| Item | Status |
|---|---|
| Target-env re-verification of non-exposure | Deferred — owner-approved staging/prod session |
| Real R2 bucket signed-URL proof | Deferred |
| Frontend admin UI still reading `.storageKey` in places | Functional follow-up (see `SECURITY_BOUNDARY_AUDIT.md`); not a re-leak of API field if API stays clean |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Live R2: **not claimed**. Production readiness: **NO**.
