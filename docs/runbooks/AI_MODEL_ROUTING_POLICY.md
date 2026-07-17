# AI Model Routing Policy (G72 + G73 + G74 + G75 + G76 + G77b + G79 + G80 + G134-G137)

**Status:** Implemented on `main` through G80 (G72 policy, G73 attribution proof, G74 completed ledger readiness, G75 local live spend attribution proof, G76 persistent completed ledger wiring, G77b local live COMPLETED ledger row proof, G79 monthly cap aggregation for live rows, G80 actual-cost policy). G134-G137 add a local reporting/reconciliation contract on the current working branch.
**Live execution:** G72–G74 are no-live — dry-run/preview and mocked completed attribution only. **G75 (local only):** one controlled OpenRouter live smoke PASS; completed attribution verifier PASS; at G75 time persistent row was generated-only. **G76 (mocked/no-live):** execute-path COMPLETED persistence wired. **G77b (local only):** live OpenRouter execute created persistent COMPLETED `AiBudgetLedgerEntry` row — staging/production still BLOCKED. **G79/G80:** no live provider calls; local unit/policy changes only.
**Approved live text model (local + staging AI Delivery proof):** `anthropic/claude-haiku-4.5` via OpenRouter.
**Architecture:** This runbook is the **text-centric** routing/ledger procedure under AI Policy. OpenRouter is the preferred text broker/adapter — not a parallel policy owner. Image/audio routes must extend the same AI Policy system via modality adapters — see [`../architecture/AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md). Do not invent a separate image routing/budget system.

## Principle

All AI task model selection **must** come from backend routing policy (`ai-model-routing-policy.service.ts`) under AI Policy. Arbitrary model IDs from user prompts, UI inputs, agent suggestions, or free-form request payloads are **forbidden** and rejected.

Do **not** use `openrouter/auto` for Puriva or medical/compliance content.

**Scope note (2026-07-12):** The table below is **text routing**. Orchestrator tasks `image_generation` / `image_prompt` / `vision_technical_qa` currently map to `fallback_stop_admin_review` until an owner-approved image route + `ImageProviderAdapter` exists. That future route remains under AI Policy — not a workflow-hardcoded vendor call.
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
| Completed (`completedLedgerMetadata`) | G74 READY; G75 generated-only; G76 wired; **G77b live DB row PROVEN (local only)** | explicit per execution | Via `recordCompletedAiLedgerEntry()` on AI Delivery OpenRouter execute success; upsert `ai-delivery-execute:{outputType}` |

### Completed attribution fields (G74)

- `ledgerStatus`: `COMPLETED` | `BLOCKED` | `SKIPPED`
- `taskType`, `routingTaskType`, `gateway`, `provider`, `model`, `policyVersion`
- `clientProfile`, `contentChannel`, `maxCostUsdPerRun`
- `estimatedCostUsd`, `actualCostUsd` (populated only when gateway exposes confirmed cost within route cap; otherwise `null`)
- `approximateInputTokens`, `approximateOutputTokens`
- `liveProviderCalled` (explicit; `true` observed in G75 run `6e538323-8e68-4d41-a4c5-9e30ca0cf8a1` and G77b run `2244413e-d87b-45a1-8a26-6634ec8972d5`)
- `safeError`, `overCap`, `overCapReason`
- `workflowRunId`, `runId`

### actualCostUsd limitations

- Populated only when the gateway exposes a confirmed provider cost **and** it is within `maxCostUsdPerRun`; otherwise `null` (G77b: COMPLETED success still stored `actualCostUsd=null` — **not** provider invoice proof).
- Do **not** fabricate `actualCostUsd` from route caps, token estimates, local budgets, provider model pricing pages, or `estimatedCostUsd`.
- Keep `estimatedCostUsd` separate as the budget-control estimate. Monthly cap aggregation uses `actualCostUsd` when a trusted provider cost exists, otherwise `estimatedCostUsd`.
- Provider-cost reconciliation remains a later owner-gated workflow once a trusted provider billing/cost source is integrated.
- If exposed cost exceeds `maxCostUsdPerRun`, attribution is `BLOCKED` with `overCap=true` and `actualCostUsd` is not recorded.
- If `safeError` is present, status is `BLOCKED` and `actualCostUsd` is not recorded.
- Skipped local execution (`ok=false`, no `safeError`) records `SKIPPED` with `liveProviderCalled=false`.
- **G77b observation:** live COMPLETED row stored `actualCostUsd=null` — expected current limitation; does **not** prove provider invoice cost.

### Monthly cap aggregation (G79)

- `sumSpentUsdForPeriod()` includes countable ledger statuses: `PREVIEW`, `PLANNED`, and `COMPLETED`.
- Live provider rows are not excluded from monthly spend. A `COMPLETED` row with `liveProviderCalled=true` counts toward the monthly cap.
- Spend is summed per row as `actualCostUsd ?? estimatedCostUsd`; current OpenRouter live rows may have `actualCostUsd=null`, so they count by their route estimate until trusted provider cost exists.
- `BLOCKED` and `SKIPPED` rows remain non-countable for monthly spend.

### Reporting/reconciliation contract (G134-G137 + G389–G408 + G613–G624)

- `ai-budget-reporting.contract.ts` is an additive pure contract layer; it does **not** modify `sumSpentUsdForPeriod()`.
- Reporting rows keep monthly cap totals, live rows, estimated/actual split, provider, and model visible for operator reporting.
- `actualCostNullPolicy` = `leave_null_until_trusted_provider_cost` — never fabricate actuals from estimates or pricing pages.
- Trusted actual ingestion design + invoice variance design live in `ai-budget-trusted-actual-ingestion.design.ts` (design-only; no live calls). G613 adds `assertActualCostUsdTrustedSourceInvariant`.
- Budget threshold/cap signals map to existing Lane 2 events via `ai-budget-notification-mapping.ts` (no Lane 2 edits). G620–G621 deepen threshold + cap-blocked mapping tests.
- Routing truth labels: `ai-model-routing-truth-labels.ts` + shared `AI_MODEL_ROUTING_TRUTH_LABELS` (G622 live_completed cases).
- Finance Lite remains separate: no AI budget report creates, mutates, or reconciles a Finance Lite invoice. G618 helper: `finance-lite-ai-budget-separation.ts`.
- Reconciliation design exposes estimate, trusted actual, invoice, and variance slots, but invoice fields remain `null` / `not_integrated` until a separately approved provider-invoice workflow exists.
- Historical implementation detail: [`AI_BUDGET_ROUTING_G613_G624_CLOSEOUT.md`](./AI_BUDGET_ROUTING_G613_G624_CLOSEOUT.md).

**G75 (local live spend attribution proof — PARTIAL):** After one controlled OpenRouter live smoke (`workflowRunId=6e538323-8e68-4d41-a4c5-9e30ca0cf8a1`), completed attribution metadata could be **generated** from live workflow observability via G74 `finalizeOrchestratorLiteLedgerAttribution` (verifier PASS in G75c). At G75 time the execute path did not auto-persist a COMPLETED row.

**G76 (persistent completed ledger wiring — mocked/no-live):** `ai-delivery-workflow-ledger-attribution.service.ts` bridges AI Delivery workflow results to G74 `recordCompletedAiLedgerEntry()` on successful OpenRouter execute. Local deterministic path skipped; ledger failure is non-blocking. Validated by 252/252 unit tests. Live DB row proof closed in G77b.

**G77b (persistent COMPLETED ledger live proof — COMPLETE local only):** Controlled live OpenRouter guarded smoke PASS (`workflowRunId=2244413e-d87b-45a1-8a26-6634ec8972d5`); ledger verifier PASS — row `5d8d635c-ced0-4a14-9b33-839e1fdee508` with `status=COMPLETED`, `stepReference=ai-delivery-execute:summary`, `provider=openrouter`, `liveProviderCalled=true`, `taskType=report_narrative`, `completedAttribution` present (`model=anthropic/claude-haiku-4.5`, `gateway=openrouter`, `runId` matches), `estimatedCostUsd=0.15`, `actualCostUsd=null`. Baseline + restore PASS. Staging/production live **not** claimed.

**Deferred (post-G408):** Trusted provider-cost ingestion/reconciliation for `actualCostUsd` (next cost-proof gate); real provider invoice ingestion; Finance Lite invoice reconciliation/posting; `operatingPackKey` resolution; local SKIPPED/BLOCKED persistence optional gate; staging/production live proof remains blocked.

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

Unit tests: `ai-model-routing-policy.service.test.ts`, `ai-budget-guard.service.test.ts`, `ai-budget-ledger.service.test.ts`, `ai-budget-reporting.contract.test.ts`, `ai-orchestrator-lite.service.test.ts`, `ai-orchestrator-workflow-adapter.skeleton.test.ts`.

## Next gate

- **G78:** guarded commit/push of G77b + G78 runbook truth-label alignment (docs only; separate owner approval)
- **G79:** monthly cap aggregation for `liveProviderCalled=true` COMPLETED ledger rows — implemented with no-live unit coverage; live provider proof remains local-only from G77b row shape.
- **G80:** `actualCostUsd` policy documented: leave null until trusted provider cost is available; no fabricated actual costs.
- **G389–G408 (this lane):** reporting/reconciliation/routing truth hardened locally — no live OpenRouter; no invoice overclaim.
- **Next cost-proof gate (proposed):** trusted provider-cost ingestion for `actualCostUsd` from an owner-approved usage/billing source — still no Finance Lite invoice mutation; still no staging/production live without separate approval.
- Additional model approval matrix (optional parallel track); staging/production live proof remains **BLOCKED**

## Related docs

- [`AI_PROVIDER_LIVE_PROOF.md`](./AI_PROVIDER_LIVE_PROOF.md) — formal OpenRouter proof (G71e-retry)
- [`docs/ai/AI_MODEL_POLICY.md`](../ai/AI_MODEL_POLICY.md)
- [`docs/STATUS.md`](../STATUS.md)
