# AI Model Routing Policy (G72 + G73)

**Status:** Implemented on `main` (G72 policy, G73 attribution proof) — backend policy selects models per task type.
**Live execution:** Not part of G72/G73 — dry-run/preview only.
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
- Registry exposes `modelRoutingPolicy` snapshot for admin visibility

## Route metadata propagation (G73)

| Layer | Field | Source |
|-------|-------|--------|
| Policy | `routingTaskType`, `gateway`, `primaryModel`, `maxCostUsdPerRun`, `policyVersion` | `resolveModelRoute()` → `AI_MODEL_ROUTING_TABLE` |
| Orchestrator preview | `preview.modelRouting` | Full routing audit attached to plan preview |
| Orchestrator plan | `plannedLedgerMetadata` | `buildPlannedLedgerMetadata()` — taskType, gateway, model, caps, clientProfile, contentChannel |
| Budget guard | `budget.estimatedStepCostUsd` | Route `maxCostUsdPerRun` when provided; else step estimate table |
| Persistent ledger (preview endpoint) | `metadata.modelRouting` | Written on `POST /material-routing-preview` with PREVIEW/BLOCKED status |
| Workflow dry-run | `adapter.plan` + `adapter.plannedLedgerMetadata` | Adapter exposes plan metadata; no separate ledger write in dry-run path |

**Deferred (G74+):** Live workflow execution spend attribution (`COMPLETED` ledger rows with `actualCostUsd`) after approved live provider calls.

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

- **G74:** live spend ledger attribution after workflow execution, or additional model approval matrix

## Related docs

- [`AI_PROVIDER_LIVE_PROOF.md`](./AI_PROVIDER_LIVE_PROOF.md) — formal OpenRouter proof (G71e-retry)
- [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md)
- [`deferred-scope-register.md`](../operator/deferred-scope-register.md)
