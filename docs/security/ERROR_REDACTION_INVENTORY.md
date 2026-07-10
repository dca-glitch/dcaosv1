# Error Redaction Inventory (G414)

**Status:** Read-only inventory for G409–G428. No live execution.

---

## 1. Helpers

| Helper | Path | Behavior |
|---|---|---|
| `toClientPortalSafeErrorMessage` | `client-portal-error-safety.ts` | If unsafe markers present → full fallback (no partial strip); max 240 chars |
| `containsClientPortalUnsafeErrorContent` | same | Detects stacks, storageKey, tenants/ paths, providerMetadata, workflow/cost markers |
| `redactStorageErrorMessage` | `storage-error-redaction.ts` | Scrubs storage paths, R2 secret fragments, stacks; `liveProven: false` |
| `containsUnsafeStorageErrorContent` | same | Detection helper for storage-sensitive content |

---

## 2. Unsafe markers (client portal)

Patterns include (non-exhaustive): stack frames, `storageKey`, `tenants/...` paths, `providerMetadata`, `workflowRunId`, `executionLog`, `adminSummaryNotes`, `actualCostUsd`, `jobQueueStatus`, audit log keys, nested `Error:` + `at` dumps.

---

## 3. Tests

| Test | Path |
|---|---|
| Client portal error safety | `apps/api/src/core/client-portal-error-safety.test.ts` |
| Storage error redaction | `apps/api/src/storage/storage-error-redaction.test.ts` |

---

## 4. Operator rules

1. Prefer short, stable client messages over raw exception text.
2. Never paste `$env:TEMP` validate/smoke logs into chat/PR without scrubbing.
3. If a proof log may contain secrets or storage keys, treat the proof as failed until redacted and consider key rotation with the owner.
4. Error redaction helpers are **local safety**, not staging/production incident response proof.

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
