# Provider Metadata Redaction Inventory (G413)

**Status:** Read-only inventory for G409–G428. No live provider calls.

---

## 1. What must not reach clients

| Metadata class | Examples | Client exposure |
|---|---|---|
| Provider identity | `provider`, `providerMetadata`, gateway name | Forbidden on client portal payloads |
| Model / routing | model id, secondary/reviewer model | Admin/operator only unless explicitly client-safe |
| Cost | `actualCostUsd`, estimated cost rows | Forbidden on client |
| Prompts / scaffolds | raw prompt, `promptScaffold` | Forbidden on client |
| Workflow / job internals | `workflowRunId`, queue status, execution logs | Forbidden on client |
| WordPress credentials | application password, tokens, ciphertext | Never serialize; host + presence only |

---

## 2. Code locations

| Area | Path | Mechanism |
|---|---|---|
| Client portal forbidden keys | `client-portal-error-safety.ts` | Key denylist walk |
| Image generation client-safe set | `image-generation.execution.ts` (`isFreeOfInternalOnlyFields`, `toImageGenerationClientSafeVariantSet`) | Pattern forbid `storageKey\|prompt\|provider\|model\|apiKey` |
| Workflow brief role sanitize | `workflow-brief.runtime.ts` (`sanitizeBriefDetailForRole`, MI/SEO client sanitizers) | Strip/reduce reportJson provider/run metadata for client |
| WordPress credentials | `wordpress-credentials-redaction.ts` | Shape/metadata/deep redact |
| Email no-send adapter | `email-no-send-adapter.ts` | Safe metadata only; no provider call |
| Notification events | `notification-events.test.ts` | Asserts no secrets/provider raw responses |
| Market intelligence | `packages/shared` + Puriva MI helpers | Client-safe payload sanitizers |
| R2 proof stages | `r2-proof-stage.ts` | `clientSafe` boolean per stage |

---

## 3. Admin vs client

| Audience | Provider metadata |
|---|---|
| Admin / owner | May see gateway/model/cost/audit for operations |
| Client role / Client Portal | Must not see provider, model, cost, prompts, workflow run IDs, storage keys |

---

## 4. Gaps

| Gap | Notes |
|---|---|
| Not every admin audit serializer uses one shared redactor | Domain-specific helpers; review before sharing logs |
| Live provider responses | Must never be pasted into client-facing copy or public docs |
| Staging/prod re-proof of non-exposure | Deferred |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

No live provider proof claimed.
