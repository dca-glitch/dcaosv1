# AI Model Routing Policy (G72 + G73 + G74 + G75)

**Status:** Implemented on `main` (G72 policy, G73 attribution proof, G74 completed ledger readiness, G75 local live spend attribution proof).
**Live execution:** G72–G74 are no-live — dry-run/preview and mocked completed attribution only. **G75 (local only):** one controlled OpenRouter live smoke PASS; completed attribution verifier PASS; persistent COMPLETED row **not** auto-written by smoke path.
**Approved live text model (local proof):** `anthropic/claude-haiku-4.5` via OpenRouter.

## Principle

All AI task model selection **must** come from backend routing policy (`ai-model-routing-policy.service.ts`). Arbitrary model IDs from user prompts, UI inputs, agent suggestions, or free-form request payloads are **forbidden** and rejected.

Do **not** use `openrouter/auto` for Puriva or medical/compliance content.

## Approved models

| Model ID | Status |
|----------|--------|
| `anthropic/claude-haiku-4.5` | **Approved** — sole live-proofed text model (G71e-retry) |
| All others | **Not approved** — deferred until explicit owner gate |

## Task type routing table

| Task type | Gateway | Primary model | allowLive | maxCostUsdPerRun | Compliance profile | Risk |
|-----------|---------|---------------|-----------|------------------|-------------------|------|
| `research_pack` | openrouter | anthropic/claude-haiku-4.5 | yes | $0.30 | puriva_medical_safe | medium |
| `seo_plan` | openrouter | anthropic/claude-haiku-4.5 | yes | $0.25 | puriva_medical_safe | medium |
| `content_draft` | openrouter | anthropic/claude-haiku-4.5 | yes | $0.60 | puriva_medical_safe | medium |
| `medical_compliance_review` | openrouter | anthropic/claude-haiku-4.5 | **no** | $0.50 | puriva_medical_strict | high |
| `final_client_polish` | openrouter | anthropic/claude-haiku-4.5 | yes | $0.35 | puriva_medical_safe | medium |
| `long_context_review` | openrouter | anthropic/claude-haiku-4.5 | **no** | $0.75 | puriva_medical_safe | high |
| `workflow_summary` | openrouter | anthropic/claude-haiku-4.5 | yes | $0.15 | internal_summary_safe | low |
| `fallback_stop_admin_review` | local | null | **no** | $0 | stop_admin_review | high |

**Fallback behavior (all routes):** `STOP_AND_ADMIN_REVIEW` — no automatic downgrade to weaker or unapproved models.

## Client profiles and channels

- **Supported client profile:** `puriva` (normalized from `puriva` or `puriva_operating_pack_v1`)
- **Supported content channels:** `website`, `social_media`
- **Blocked/deferred:** `paid_ads` — requires manual/admin review; not MVP

## Puriva policy

- Monthly AI cap: **$100 USD** (budget guard + ledger)
- Every live-eligible route requires budget ledger and exposes `maxCostUsdPerRun` below monthly cap
- Medical/compliance tasks use conservative profiles; `medical_compliance_review` has `allowLive: false` until explicitly approved

## Orchestrator integration

- `planAiOrchestratorLiteStep` resolves route via `resolveModelRoute()`
- Preview/dry-run responses include `modelRouting` audit metadata (no secrets)
- Preview/dry-run responses include `plannedLedgerMetadata` for budget attribution (G73)
- `liveProviderCalled` remains `false` in G72/G73 dry-run/preview paths
- G74 adds completed attribution helpers for post-execution ledger rows (mocked in tests only)
- Registry exposes `modelRoutingPolicy` snapshot for admin visibility

## Route metadata propagation (G73 + G74)

| Layer | Field | Source |
|-------|-------|--------|
| Policy | `routingTaskType`, `gateway`, `primaryModel`, `maxCostUsdPerRun`, `policyVersion` | `resolveModelRoute()` → `AI_MODEL_ROUTING_TABLE` |
| Orchestrator preview | `preview.modelRouting` | Full routing audit attached to plan preview |
| Orchestrator plan | `plannedLedgerMetadata` | `buildPlannedLedgerMetadata()` — taskType, gateway, model, caps, clientProfile, contentChannel |
| Budget guard | `budget.estimatedStepCostUsd` | Route `maxCostUsdPerRun` when provided; else step estimate table |
| Persistent ledger (preview endpoint) | `metadata.modelRouting` | Written on `POST /material-routing-preview` with PREVIEW/BLOCKED status |
| Workflow dry-run | `adapter.plan` + `adapter.plannedLedgerMetadata` | Adapter exposes plan metadata; no separate ledger write in dry-run path |
| Completed attribution (G74) | `completedLedgerMetadata` | `prepareCompletedLedgerAttribution()` + `recordCompletedAiLedgerEntry()` — COMPLETED/BLOCKED/SKIPPED |

### Metadata layers

| Layer | Status | `liveProviderCalled` | Persisted |
|-------|--------|----------------------|-----------|
| Preview (`modelRouting`) | G73 COMPLETE | `false` | Yes — preview endpoint |
| Planned (`plannedLedgerMetadata`) | G73 COMPLETE | `false` | No — response only |
| Completed (`completedLedgerMetadata`) | G74 READY; G75 local proof PASS (generated-only) | explicit per execution | Via `recordCompletedAiLedgerEntry()` when wired; **not** auto-persisted by current smoke path |

### Completed attribution fields (G74)

- `ledgerStatus`: `COMPLETED` | `BLOCKED` | `SKIPPED`
- `taskType`, `routingTaskType`, `gateway`, `provider`, `model`, `policyVersion`
- `clientProfile`, `contentChannel`, `maxCostUsdPerRun`
- `estimatedCostUsd`, `actualCostUsd` (when confirmed and within route cap)
- `approximateInputTokens`, `approximateOutputTokens`
- `liveProviderCalled` (explicit; `true` observed in G75 local live proof run `6e538323-8e68-4d41-a4c5-9e30ca0cf8a1`)
- `safeError`, `overCap`, `overCapReason`
- `workflowRunId`, `runId`

### actualCostUsd limitations

- Recorded only when provider execution reports success and cost is within `maxCostUsdPerRun`.
- If `actualCostUsd > maxCostUsdPerRun`, attribution is `BLOCKED` with `overCap=true` and `actualCostUsd` is not recorded.
- If `safeError` is present, status is `BLOCKED` and `actualCostUsd` is not recorded.
- Skipped local execution (`ok=false`, no `safeError`) records `SKIPPED` with `liveProviderCalled=false`.

**G75 (local live spend attribution proof — PARTIAL):** After one controlled OpenRouter live smoke (`workflowRunId=6e538323-8e68-4d41-a4c5-9e30ca0cf8a1`), completed attribution metadata can be **generated** from live workflow observability via G74 `finalizeOrchestratorLiteLedgerAttribution` (verifier PASS in G75c). The current smoke/execution path does **not** automatically write a persistent COMPLETED ledger row — metadata is generated-only at verify time. Verifier requires `node --import tsx` when importing TypeScript source directly.

**Deferred (G76):** Wire live execution endpoint to persist COMPLETED ledger rows via `recordCompletedAiLedgerEntry()` after approved provider execution; staging/production live proof remains blocked.

## Orchestrator task → routing task mapping

| Orchestrator `AiTaskType` | Routing task |
|---------------------------|--------------|
| `research_pack` | `research_pack` |
| `seo_plan`, `article_outline` | `seo_plan` |
| `article_draft` | `content_draft` |
| `compliance_review` | `medical_compliance_review` |
| `rewrite_polish` | `final_client_polish` |
| `report_narrative` | `workflow_summary` |
| `local_deterministic`, `image_*`, `vision_*` | `fallback_stop_admin_review` |

Unknown orchestrator task types map to blocked `fallback_stop_admin_review`.

## Validation (local)

```powershell
cd C:\dcaosv1
npm.cmd run test:unit --workspace=@dca-os-v1/api
npm.cmd run smoke:ai-orchestrator-lite:local
```

Unit tests: `ai-model-routing-policy.service.test.ts`, `ai-budget-guard.service.test.ts`, `ai-budget-ledger.service.test.ts`, `ai-orchestrator-lite.service.test.ts`, `ai-orchestrator-workflow-adapter.skeleton.test.ts`.

## Next gate

- **G76:** persistent live completed ledger row wiring after approved provider execution, or additional model approval matrix
- **G75e:** commit/push G75d docs closeout (separate owner approval)

## Related docs

- [`AI_PROVIDER_LIVE_PROOF.md`](./AI_PROVIDER_LIVE_PROOF.md) — formal OpenRouter proof (G71e-retry)
- [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md)
- [`deferred-scope-register.md`](../operator/deferred-scope-register.md)
