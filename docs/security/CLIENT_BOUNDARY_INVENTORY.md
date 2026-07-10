# Client Boundary Inventory (G412)

**Status:** Read-only inventory for G409–G428. Local foundations only. Staging/production Client Portal proof remains deferred.

---

## 1. Forbidden client payload keys

Source: `apps/api/src/core/client-portal-error-safety.ts` → `CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS`.

| Category | Keys (examples) |
|---|---|
| Storage internals | `storageKey` |
| Provider / model | `providerMetadata`, `provider` |
| Workflow / jobs | `workflowRunId`, `workflowRunStatus`, `jobQueueStatus`, `queueStatus` |
| Cost | `actualCostUsd`, `estimatedCostUsd`, `rawCost`, `costRows` |
| Admin / audit | `adminSummaryNotes`, `adminNotes`, `auditLog`, `auditLogs`, `executionLog` |
| Internal IDs / scaffolds | `releasePackageId`, `miHandoffId`, `structuredInputJson`, `promptScaffold`, `itemMetrics`, `verificationRequiredNotes` |

Helpers: `collectClientPortalForbiddenPayloadKeys`, `assertClientPortalPayloadHasNoForbiddenKeys`.

---

## 2. Client-visible surfaces (intended)

| Surface | Allowed content | Gate |
|---|---|---|
| Client Portal archive / deliverables | FINAL/client-safe titles, descriptions, `exportUrl`, `hasDocument`, download via safe reference | Local smokes present |
| Client Portal monthly reports | `status === FINAL`, non-archived; recommendations; no admin notes | Local smokes present |
| Client Hub publication log | Client-safe publication rows (no credentials) | Local browser smokes |
| Market intelligence client summary | Sanitized summary only (`sanitizeMarketIntelligenceClientSafePayload` / Puriva MI helpers) | Local unit tests |

---

## 3. Role / tenant boundaries (related)

| Control | Evidence |
|---|---|
| SEC-B1 briefs tenant IDOR fix | `SECURITY_BOUNDARY_AUDIT.md` + `briefs-tenant-boundary.integration.test.ts` |
| Client-role API boundary smoke | `smoke:client-role-api-boundary:local` |
| Puriva portal boundary smoke | `smoke:puriva-client-portal-boundary:local` |
| Owner-on-portal approvals | By design for operator testing; production client accounts should use `client` role (M3) |

---

## 4. Smokes / tests

| Script or test | Proof type |
|---|---|
| `smoke:client-portal:local` | Local API boundary |
| `smoke:puriva-client-portal-boundary:local` | Local Puriva portal |
| `smoke:client-portal-monthly-report:browser` | FINAL-only UI |
| `smoke:client-safe-ai-visibility:local` | Client-safe AI visibility |
| `client-portal-error-safety.test.ts` | Unit |
| `client-portal.runtime.test.ts` | Unit |
| `sec-h1-storage-key-leak.integration.test.ts` | Integration (client + admin) |

---

## 5. Not proven

| Item | Status |
|---|---|
| Staging Client Portal browser proof | Deferred (needs owner approval) |
| Production Client Portal proof | Deferred; production readiness **NO** |
| Magic links / public share links | Deferred product scope |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

Puriva Launch remains **BLOCKED**. No client-boundary weakening performed.
