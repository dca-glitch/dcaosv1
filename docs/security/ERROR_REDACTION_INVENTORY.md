# Error Redaction Inventory (G642)

**Status:** Read-only inventory refresh for G637–G648. No live execution.

**Context (G469–G708):** Domain error redactors remain local safety helpers. They are **not** staging/production incident-response proof. Concurrent lanes own storage / WordPress / client-portal error helpers — Lane 15 documents only.

---

## 1. Helpers

| Helper | Path | Behavior | Owner note |
|---|---|---|---|
| `toClientPortalSafeErrorMessage` | `client-portal-error-safety.ts` | If unsafe markers present → full fallback (no partial strip); max 240 chars | Lane 9 |
| `containsClientPortalUnsafeErrorContent` | same | Detects stacks, storageKey, tenants/ paths, providerMetadata, workflow/cost markers | Lane 9 |
| `redactStorageErrorMessage` | `storage-error-redaction.ts` | Scrubs storage paths, R2 secret fragments, stacks; `liveProven: false` | Lane 1 |
| `containsUnsafeStorageErrorContent` | same | Detection helper for storage-sensitive content | Lane 1 |
| `redactWordPressErrorMessage` / `buildWordPressRedactedError` | `wordpress-error-redaction.ts` | Scrubs WP app-password / Authorization / token / ciphertext fragments | Lane 7 (WP) |
| Email recipient / template redaction | `email-redaction.ts` | Recipient domain-only + template variable scrub | Notifications lane; may be working-tree only |
| `errorMiddleware` JSON parse + stack harden | `apps/api/src/middleware/errorMiddleware.ts` | Malformed JSON → `400 INVALID_JSON` (no details); API error details never include `stack`/filesystem paths | Local API/auth DAST 2026-07-13 |

---

## 2. Unsafe markers (client portal)

Patterns include (non-exhaustive): stack frames, `storageKey`, `tenants/...` paths, `providerMetadata`, `workflowRunId`, `executionLog`, `adminSummaryNotes`, `actualCostUsd`, `jobQueueStatus`, audit log keys, nested `Error:` + `at` dumps.

---

## 3. Tests

| Test | Path | Owner |
|---|---|---|
| Client portal error safety | `apps/api/src/core/client-portal-error-safety.test.ts` | Lane 9 — do not edit |
| Storage error redaction | `apps/api/src/storage/storage-error-redaction.test.ts` | Lane 1 — do not edit |
| WordPress error redaction | `apps/api/src/services/wordpress-error-redaction.test.ts` | Lane 7 — do not edit |
| Global error middleware JSON safety | `apps/api/src/middleware/errorMiddleware.test.ts` | Local API/auth DAST 2026-07-13 |

---

## 4. Operator rules

1. Prefer short, stable client messages over raw exception text.
2. Never paste `$env:TEMP` validate/smoke logs into chat/PR without scrubbing.
3. If a proof log may contain secrets or storage keys, treat the proof as failed until redacted and consider key rotation with the owner.
4. Error redaction helpers are **local safety**, not staging/production incident response proof.
5. Do not promote G77b / local smoke failures into “production error handling proven.”

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**
