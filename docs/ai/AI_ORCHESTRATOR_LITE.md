# AI Orchestrator Lite — DCA OS Lite

**Status:** Approved skeleton (G55/G56, 2026-07-09)
**Version:** `AI_ORCHESTRATOR_LITE_V1`
**Scope:** Planning, policy, routing preview — not live execution

---

## 1. Purpose

AI Orchestrator Lite sits **above AI Gateway v1**. It coordinates:

1. Workflow request intake
2. Task type resolution
3. Material classification
4. Policy check
5. Provider registry lookup
6. Cost estimate
7. Prompt template selection (version label)
8. AI Gateway execution **or** disabled-safe fallback
9. Audit metadata
10. Approval state

It does **not** replace AI Gateway. It does **not** call providers directly except through existing gateway abstractions.

---

## 2. Architecture

```text
Admin workflow step
  → AI Orchestrator Lite (plan/preview)
       → Material policy guard
       → Budget guard
       → Provider registry (role → provider)
       → Audit metadata builder
  → AI Gateway v1 (execution only when approved + enabled)
       → Local deterministic (default)
       → OpenRouter (opt-in live)
```

---

## 3. Code locations

| Component | Path |
|-----------|------|
| Shared contracts | `packages/shared/src/ai-orchestrator-lite.ts` |
| Orchestrator service | `apps/api/src/core/ai-orchestrator-lite.service.ts` |
| Agent role registry | `apps/api/src/core/ai-agent-role-registry.ts` |
| Provider registry | `apps/api/src/core/ai-provider-registry.service.ts` |
| Material policy guard | `apps/api/src/core/ai-material-policy.guard.ts` |
| Budget guard | `apps/api/src/core/ai-budget-guard.service.ts` |
| Puriva policy profile | `apps/api/src/core/puriva-ai-policy-profile.ts` |

---

## 4. Admin API (preview only)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ai-orchestrator-lite/registry` | GET | Agent roles, provider registry, Puriva profile |
| `/api/v1/ai-orchestrator-lite/material-routing-preview` | POST | Material routing preview for a workflow step |

Preview fields: workflow, client, step, agent role, provider/model, input materials, excluded materials, policy checks, estimated cost, remaining budget, approval required, output visibility.

**No live execution** from preview endpoints.

---

## 5. Default behavior

- All provider placeholders are **disabled**
- `local_deterministic` is the **enabled** default
- `liveProviderCalled` is always `false` in preview/plan mode
- Puriva monthly cap: **$100 USD**

---

## 6. G56 additions

- `ai-kill-switch.service.ts` — live flag invariant checks
- `ai-prompt-template-registry.service.ts` — prompt template versioning
- `ai-orchestrator-workflow-adapter.skeleton.ts` — planning bridge (no live execution)
- `AiOrchestratorLitePanel` — admin dashboard read-only registry + preview UI
- `smoke:ai-orchestrator-lite:local` — registry + preview smoke

## 7. Future work (deferred)

- Wire trusted provider-cost ingestion for `actualCostUsd` (owner-gated; no fabricated actuals)
- Wire orchestrator plan into workflow execution adapter **live path** (separate live proof gate)
- Admin editable provider settings UI
- Live provider enablement per role (owner gate)
- Finance Lite invoice reconciliation remains **out of scope** for AI Orchestrator Lite

## 8. Budget / routing truth (G389–G408)

- Preview/plan keeps `liveProviderCalled=false` and `actualCostUsd=null`
- Monthly cap enforcement uses budget guard + ledger estimates until trusted actuals exist
- Routing truth labels document backend policy selection, override rejection, and null-actual policy
- See [`../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md`](../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md) and [`../runbooks/AI_MODEL_ROUTING_POLICY.md`](../runbooks/AI_MODEL_ROUTING_POLICY.md)
