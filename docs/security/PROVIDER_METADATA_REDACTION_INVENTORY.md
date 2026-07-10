# Provider Metadata Redaction Inventory (G641)

**Status:** Read-only inventory refresh for G637–G648. No live provider calls.

**Context (G469–G708):** Local controlled OpenRouter proof (G77b) and expanded no-live readiness helpers do **not** authorize staging/production provider metadata exposure claims. Client-facing payloads must still omit provider/model/cost/prompt/workflow internals.

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
| Email / Resend raw responses | `rawProviderResponse`, API keys | Never serialize to client; admin logs must redact |

---

## 2. Code locations

| Area | Path | Mechanism |
|---|---|---|
| Client portal forbidden keys | `client-portal-error-safety.ts` | Key denylist walk |
| Image generation client-safe set | `image-generation.execution.ts` (`isFreeOfInternalOnlyFields`, `toImageGenerationClientSafeVariantSet`) | Pattern forbid `storageKey\|prompt\|provider\|model\|apiKey` |
| Workflow brief role sanitize | `workflow-brief.runtime.ts` (`sanitizeBriefDetailForRole`, MI/SEO client sanitizers) | Strip/reduce reportJson provider/run metadata for client |
| WordPress credentials | `wordpress-credentials-redaction.ts` | Shape/metadata/deep redact |
| WordPress errors | `wordpress-error-redaction.ts` | Secret fragments in error text |
| Email no-send adapter | `email-no-send-adapter.ts` | Safe metadata only; no provider call |
| Email template/recipient redaction | `email-redaction.ts` (other lane; may be working-tree) | Template variable + recipient scrub |
| Notification events | `notification-events.test.ts` | Asserts no secrets/provider raw responses |
| Market intelligence | `packages/shared` + Puriva MI helpers | Client-safe payload sanitizers |
| R2 proof stages | `r2-proof-stage.ts` | `clientSafe` boolean per stage |
| Monthly report export truth | `monthly-report-metrics-export-truth.ts` | `clientSafe` labels on export shapes |

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
| G77b local live AI | Proves local controlled call only — **not** staging/prod metadata safety |

---

## GATE

**GATE: KEEP | agent: yes | budget: low | mistakes: 0**

No live provider proof claimed for this lane. Puriva Launch remains **BLOCKED**.
