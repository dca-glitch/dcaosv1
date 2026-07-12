# AI Orchestrator Lite — DCA OS Lite

**Status:** Approved skeleton (G55/G56) + **staging AI-A preflight KEEP (2026-07-12) on artifact `a8a74e6`** — capability **CONFIG SHAPE PROVEN**. Marker `DCA-WS7-AI-A-20260712-064227`. Admin-only registry/preview/dry-run proven with `executionDeferred=true`, `liveProviderCalled=false`, live calls `0`, cost `$0`. **Not** `STAGING LIVE PROVEN` (plan→execute not wired). **Note:** AI-B (2026-07-12) proves the AI Delivery/gateway OpenRouter path only — it does **not** promote Orchestrator Lite to staging-live. Version: `AI_ORCHESTRATOR_LITE_V1`. Scope: Planning, policy, routing preview — not live execution.

**Architecture:** Orchestrator Lite plans under **AI Policy**. It does not own a second routing system. OpenRouter is one text broker/adapter; image/audio use future modality adapters under the same policy — see [`../architecture/AI_POLICY_PROVIDER_ROUTING.md`](../architecture/AI_POLICY_PROVIDER_ROUTING.md).

---

## 1. Purpose

AI Orchestrator Lite sits **above** modality execution adapters (today: text via AI Gateway v1). It coordinates:

1. Workflow request intake
2. Task type resolution
3. Material classification
4. Policy check
5. Provider registry lookup
6. Cost estimate
7. Prompt template selection (version label)
8. Execution **or** disabled-safe fallback **when plan→execute is wired** (not wired today)
9. Audit metadata
10. Approval state

It does **not** replace AI Policy or modality adapters. It does **not** call providers directly. It must not embed vendor-specific APIs (OpenRouter, FLUX, Firefly, ElevenLabs) in workflow code.

---

## 2. Architecture

```text
Admin workflow step
  → AI Orchestrator Lite (plan/preview under AI Policy)
       → Material policy guard
       → Budget guard
       → Provider registry (role → provider label)
       → Model route resolution (resolveModelRoute)
       → Audit metadata builder
  → Modality adapter (when owner-gated execute is authorized)
       → Text: AI Gateway v1 → local deterministic | OpenRouter text adapter
       → Image (future): ImageProviderAdapter → Firefly / BFL FLUX / …
       → Audio/research (future): matching adapters
```

**Clarifications (2026-07-12):**

- `AI_GATEWAY_V1` is the **text** execution path; not a universal multi-modality gateway.
- OpenRouter is the preferred **text broker/adapter**, not the owner of routing policy.
- Image generation must not route through the OpenRouter text client.
- Orchestrator remains **CONFIG SHAPE PROVEN** only until plan→execute is separately owner-gated.
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
- Workflow dry-run adapter always returns `executionDeferred: true` (no live plan→execute wiring without owner gate)
- Kill switch (`ai-kill-switch.service.ts`) keeps orchestrator preview-safe when any live provider is enabled
- Preview audit redaction (`ai-local-guard-orchestrator.ts`) strips secret-like material from operator-safe previews; planned ledger carries provider/model metadata
- Puriva monthly cap: **$100 USD**

---

## 6. G56 additions

- `ai-kill-switch.service.ts` — live flag invariant checks
- `ai-prompt-template-registry.service.ts` — prompt template versioning
- `ai-orchestrator-workflow-adapter.skeleton.ts` — planning bridge (no live execution; `executionDeferred: true`)
- `AiOrchestratorLitePanel` — admin dashboard read-only registry + preview UI
- `smoke:ai-orchestrator-lite:local` — registry + preview smoke

## 7. Future work (deferred)

- Wire trusted provider-cost ingestion for `actualCostUsd` (owner-gated; no fabricated actuals)
- Wire orchestrator plan into workflow execution adapter **live path** (separate live proof gate — **STOP: ORCHESTRATOR LIVE WIRING REQUIRES OWNER GATE**)
- Admin editable provider settings UI
- Live provider enablement per role (owner gate)
- Finance Lite invoice reconciliation remains **out of scope** for AI Orchestrator Lite

## 8. Budget / routing truth (G389–G408)

- Preview/plan keeps `liveProviderCalled=false` and `actualCostUsd=null`
- Monthly cap enforcement uses budget guard + ledger estimates until trusted actuals exist
- Routing truth labels document backend policy selection, override rejection, and null-actual policy
- See [`../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md`](../runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md) and [`../runbooks/AI_MODEL_ROUTING_POLICY.md`](../runbooks/AI_MODEL_ROUTING_POLICY.md)
