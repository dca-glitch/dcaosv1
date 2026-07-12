# AI Policy / Provider Routing Architecture

**Status:** Authoritative architecture alignment (docs-only, 2026-07-12).
**Does not claim:** universal multi-provider routing implemented, BFL successful generation, three-image sets, research live, production readiness.
**Preserved proofs:** AI Delivery OpenRouter text = STAGING LIVE PROVEN (AI-B only); R2 private storage = STAGING LIVE PROVEN; Orchestrator Lite = CONFIG SHAPE PROVEN; OpenAI Images one-image staging path = STAGING LIVE PROVEN; Production = FROZEN.

**Authority:** Linked from [`AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](../project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md). Provider/model selection details remain in [`AI_MODEL_POLICY.md`](./AI_MODEL_POLICY.md). Proof procedures remain in runbooks.

---

## 1. Canonical architecture

```text
Workflow / module (provider-agnostic)
  → AI Policy (authorization, capability, route, caps, fallback)
  → Capability route resolution (task type → provider + model + guardrails)
  → Provider adapter (OpenRouter text, BFL FLUX, Firefly, ElevenLabs, …)
  → Execution guard (live enable, request count, retry=0 default, cost bound)
  → Provider call (exactly as policy allows)
  → Normalized result envelope
  → Cost ledger / attribution
  → Artifact persistence (optional; e.g. private R2)
  → Workflow consumer
```

**Rule:** DCA OS AI Policy is the single authoritative decision layer. There must not be a separate image-only (or modality-only) routing/budget/fallback system that bypasses AI Policy.

---

## 2. Terminology

| Term | Meaning |
|------|---------|
| **AI Policy** | Authoritative layer: allow/deny, capability, primary provider, model, max cost, request count, retry, fallback permission, staging/live authorization, compliance profile, output constraints |
| **Task type / capability** | What the workflow needs (`article_draft`, `workflow_summary`, `image_generation`, `research_pack`, …) — not a vendor API name |
| **Provider** | Concrete vendor or service that executes the capability (OpenRouter, BFL, Adobe Firefly, OpenAI Images, ElevenLabs, …) |
| **Broker** | A provider that itself routes to many models (today: OpenRouter for applicable text/multimodal model tasks) |
| **Model** | Exact model identifier selected by AI Policy for a route |
| **Adapter** | Code that implements one provider’s contract and returns a normalized result |
| **Route** | Policy-resolved binding of capability → provider (+ optional broker) → model → guardrails |
| **Execution authorization** | Live/staging gates (env + code invariants) that must all pass before a provider call |
| **Budget / cost cap** | Code-enforced ceilings (`maxCostUsdPerRun`, monthly cap, modality unit caps) — not env-widenable |
| **Retry / fallback policy** | Policy-owned. Adapters report failure; they must not silently switch provider or regenerate |
| **Ledger attribution** | Normalized spend/evidence row (`AiBudgetLedgerEntry` + metadata contracts) |
| **Normalized result** | Shared execution envelope returned to workflows (see §7) |

---

## 3. OpenRouter role

OpenRouter is:

- the **preferred broker/adapter** for applicable **text** (and future multimodal-via-OpenRouter) model tasks;
- **one adapter** in the provider ecosystem (`openrouter-text.service` behind `AI_GATEWAY_V1` text path today);
- **not** the owner of DCA OS routing policy;
- **not** mandatory for image, audio, or provider-native media APIs.

DCA OS still decides when OpenRouter is used, which task uses it, which model is allowed, cost limits, and whether fallback/direct providers are allowed.

**Clarification:** `AI_GATEWAY_V1` is the **text execution gateway** today (OpenRouter or local deterministic). It is **not** a universal multi-modality gateway. Naming should be read as text-scoped until a future multi-modality facade is explicitly designed.

---

## 4. Direct provider adapters

Direct adapters are valid when OpenRouter does not expose the model, provider-native jobs/bytes are required, pricing/compliance requires direct access, or richer cost metadata is available.

Examples (not all implemented):

| Capability category | Example adapters |
|--------------------|------------------|
| Text provider/broker | OpenRouter text adapter (implemented path) |
| Research provider | OpenRouter or future dedicated research adapter |
| Image provider | OpenAI Images adapter (**STAGING LIVE PROVEN** one-image path); BFL FLUX adapter retained inactive (**successful generation NOT PROVEN**); Firefly future |
| Audio provider | ElevenLabs adapter (future) |
| Embedding provider | Future |
| Media / OCR / video | Future |

---

## 5. Layer responsibilities

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **1. Workflow / module** | Request a capability/task context (`generateText`, `generateImage`, …) | Call OpenRouter/FLUX/Firefly/ElevenLabs APIs directly |
| **2. AI Policy** | Authorize, select capability route, caps, retry/fallback, compliance | Be bypassed by module-local vendor switches |
| **3. Capability route resolution** | Map task → provider + model + guardrails | Accept free-form model IDs from UI/prompts |
| **4. Provider adapter** | Provider-specific HTTP/SDK + redaction | Own budget/fallback policy or call a second provider |
| **5. Execution guard** | Enforce live flags, request count, timeout, cost bound | Auto-retry paid calls or silent regenerate |
| **6. Provider call** | Exactly the allowed request(s) | Duplicate generation / variation / upscale unless policy allows |
| **7. Normalized result** | Common metadata + modality output reference | Leak secrets, raw keys, full signed URLs to clients |
| **8. Cost ledger** | Persist estimates/actuals (actual only when trusted) | Fabricate `actualCostUsd` |
| **9. Artifact persistence** | Optional private storage (e.g. R2) when canonical | Create public permanent URLs by default |
| **10. Workflow result** | Consume safe outputs for admin/client gates | Treat provider failure as success via hidden substitute |

---

## 6. Workflow boundary

Preferred shape (conceptual — not all exported APIs exist):

- `generateText(taskContext)`
- `generateImage(taskContext)`
- `runResearch(taskContext)`
- `generateAudio(taskContext)`

Forbidden at workflow layer:

- Direct OpenRouter / FLUX / OpenAI Images / Firefly / ElevenLabs calls
- Embedding vendor selection in UI buttons
- Parallel “image routing policy” that ignores AI Policy / ledger

---

## 7. Normalized result model

Common execution metadata (target contract):

- `taskType`, `capability`, `correlationId`
- `provider`, `broker` (optional), `model`
- `requestCount`, `retryCount`, `fallbackUsed`
- `liveProviderCalled`
- `estimatedCostUsd`, `actualCostUsd` (null until trusted)
- `providerRequestId`, `status`, `safeError`
- `result` / artifact reference, `ledgerId`

Capability-specific adapters:

- `TextProviderAdapter`
- `ImageProviderAdapter`
- `ResearchProviderAdapter`
- `AudioProviderAdapter`

Do **not** force one giant universal `execute()` if modality I/O differs; share the envelope, specialize adapters.

---

## 8. Retry / fallback

- Default live proofs and sensitive workflows: **retryCount = 0**, **fallbackUsed = false** unless AI Policy explicitly allows.
- Adapters report failure; **AI Policy** decides whether another route is allowed.
- Text local-deterministic fallback remains a **policy-approved** text path (not a second paid provider).
- Image: no silent placeholder bytes; manual admin upload remains the product fallback until a live image adapter exists.

---

## 9. Ledger compatibility (current vs target)

**Current:** `AiBudgetLedgerEntry` stores generic `provider` + JSON `metadata`; completed contracts are **text-token oriented**. Image estimate in budget guard is `$0` (placeholder). Async job IDs and storage artifact fields are **not** first-class.

**Target without inventing live capability:**

- Early image proofs may extend **shared metadata contracts** + JSON (modality, unit cost, `providerRequestId`, admin-only artifact ref) **without** requiring a Prisma migration for the first staging one-image proof.
- Production-scale image job lineage / artifact columns remain a **later owner-gated schema** decision (`IMAGE_GENERATION_PROOF.md`).
- Ledger must attribute **all** paid modalities through the same budget/ledger path — do not invent a second spend system for images.

---

## 10. Current code map (retain; clarify)

| Concern | Location | Note |
|---------|----------|------|
| Text routing table | `ai-model-routing-policy.service.ts` | Authoritative for orchestrator preview + ledger re-resolution; text-centric today |
| Text execute path | AI Delivery → `AI_GATEWAY_V1` → `openrouter-text.service` | Staging live proven (AI-B); env model slots at execute |
| Orchestrator Lite | `ai-orchestrator-lite.service.ts` | Plans only; `executionDeferred=true`; CONFIG SHAPE PROVEN |
| Provider registry | `ai-provider-registry.service.ts` | Planning placeholders; not the live OpenRouter HTTP path |
| Budget / ledger | `ai-budget-guard.service.ts`, `ai-budget-ledger.service.ts` | Monthly cap + attribution |
| Image foundation | `image-generation.config.ts`, `image-generation.execution.ts` | Disabled-safe silo; `LIVE_PROVIDER_CALLS_ALLOWED=false` |
| Kill switch | `ai-kill-switch.service.ts` | Aggregates live-shape flags |

**Known drift (documented, not fixed in this gate):** dual model selection (routing table vs gateway env) at text execute; registry `retryLimit` vs HTTP `retryCount: 0`; `AI_GATEWAY_V1` name vs text-only scope; image tasks mapped to `fallback_stop_admin_review` while image foundation is a parallel readiness silo. Next implementation blocks must converge these under AI Policy — not widen drift.

---

## 11. FLUX integration position

```text
AI Policy image route (image_single)
  → ImageProviderAdapter
  → BFLFluxAdapter
  → one-image execution guard
  → BFL submit / bounded poll / one download
  → normalized image result
  → optional private R2 persistence (orchestration layer; not in adapter)
  → ledger attribution
```

**Local adapter status (2026-07-12):** implemented under AI Policy; fake-transport proven; **staging live NOT PROVEN**. Do not call FLUX from AI Delivery workflow code. Do not route images through `AI_GATEWAY_V1`.

---

## 12. Minimum adapter contract before FLUX (or any image provider)

1. Owner-recorded primary image provider + model + cost caps in AI Model Policy.
2. AI Policy image route (capability → provider/model/caps) — not workflow hardcoding.
3. `ImageProviderAdapter` interface + one concrete adapter module.
4. Hard one-request live guard (`requestCount=1`, no retry, no fallback, no set generation).
5. Normalized result + ledger metadata shape (JSON-first OK).
6. Optional exact-key private R2 create/read/delete if canonical.
7. Staging live proof gate only after the above ships.

---

## 13. Bounded next implementation sequence

1. **Docs/policy already aligned by this note** (this gate).
2. Owner selects image provider/model + cost caps.
3. Shared normalized envelope + image route under AI Policy (code block).
4. One `ImageProviderAdapter` + concrete adapter (e.g. BFL FLUX) + one-image guard.
5. Ledger metadata for image (no schema unless required).
6. Staging one-image live proof (separate gate).
7. Later: converge text execute onto routing-policy model IDs; Orchestrator plan→execute (separate owner gate).

Do **not** start WordPress, client approval, three-image sets, social preview, GA/GSC, or MI in the FLUX/image adapter block.
