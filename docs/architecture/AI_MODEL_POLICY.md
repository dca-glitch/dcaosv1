# AI Model Policy (Text + Image)

**Status:** Docs-only policy. **Provider decision(s) below are PENDING OWNER APPROVAL.** This document does not authorize any live provider call, does not enable any provider in code or env, and does not close the "AI Model Research" or "AI Model Policy" Puriva Launch blockers by itself — it defines the policy those gates require. See `docs/operator/deferred-scope-register.md` (archived reference; see Git history) §"Puriva Launch blockers".

**Gate lineage:** [`G52_OWNER_DISPOSITION.md`](./G52_OWNER_DISPOSITION.md) §"AI governance" (AI Model Research Gate; AI Model Policy) · [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md)

Related:

- [`AI_POLICY_PROVIDER_ROUTING.md`](./AI_POLICY_PROVIDER_ROUTING.md) — **authoritative AI Policy / provider routing architecture** (layers, OpenRouter vs direct adapters, FLUX position)
- [`docs/AI_PROVIDER_DATA_COLLECTION_DECISION.md`](../AI_PROVIDER_DATA_COLLECTION_DECISION.md) — approved provider *direction* (docs-only)
- [`docs/operator/AI_PROVIDER_LOCAL_CONFIG.md`](../operator/AI_PROVIDER_LOCAL_CONFIG.md) — current local env/config behavior
- [`docs/runbooks/AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) — text live-proof runbook
- [`docs/runbooks/IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) — image proof plan
- [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md) — AI rows, proof status
- `apps/api/src/config/ai-provider.config.ts`, `apps/api/src/core/ai-gateway-v1.service.ts`, `apps/api/src/core/ai-text-budget.policy.ts`, `apps/api/src/services/openrouter-text.service.ts` (existing code — not modified by this document)

---

## 0. Purpose and scope

This document is the single policy reference for **which AI providers/models DCA OS Lite is permitted to use**, and **under what guardrails**, across:

1. Text generation (AI Delivery content plans, briefs, article drafts, MI summaries)
2. Image generation (article hero/supporting images, social preview images)

It governs policy only. It does not itself change code, env, schema, or provider wiring. Where this policy conflicts with a narrower/older doc, this document is the current source of truth for AI model/provider policy; the referenced runbooks remain the source of truth for proof/execution procedure.

### 0.1 Architecture authority (alignment 2026-07-12)

- **AI Policy** (this document + routing tables + budget guards) is the sole decision layer for capability → provider/model → caps → retry/fallback → live authorization.
- **OpenRouter** is the preferred **broker/adapter** for applicable text tasks — not the universal architecture boundary and not mandatory for image/audio/provider-native APIs.
- **Direct provider adapters** (e.g. BFL FLUX, Firefly, OpenAI Images, ElevenLabs) are valid under AI Policy when modality or commercial/compliance needs require them.
- Workflows request **capabilities**; they must not hardcode vendor APIs. See [`AI_POLICY_PROVIDER_ROUTING.md`](./AI_POLICY_PROVIDER_ROUTING.md).
- Do **not** create a parallel image-only routing/budget system outside AI Policy.
- `AI_GATEWAY_V1` is the **text** execution gateway today; image generation must use an `ImageProviderAdapter`, not the OpenRouter text client.

---

## 1. Text model policy

### 1.1 Provider/model direction (approved direction; final model IDs pending owner approval)

| Slot | Provider/gateway | Model family | Approval status |
|------|-------------------|--------------|------------------|
| Gateway | OpenRouter | N/A (router) | Approved direction — [`AI_PROVIDER_DATA_COLLECTION_DECISION.md`](../AI_PROVIDER_DATA_COLLECTION_DECISION.md) §1 |
| Primary text model | OpenRouter → OpenAI family | **Specific model ID: PENDING OWNER APPROVAL** | Direction approved; exact model ID not selected |
| Long-context / reviewer model | OpenRouter → Gemini family | **Specific model ID: PENDING OWNER APPROVAL** | Direction approved; exact model ID not selected |
| Fallback text execution | Local deterministic | N/A (no external call) | **Approved and default today** |
| Direct OpenAI/Gemini adapter (bypassing OpenRouter) | N/A | N/A | Future escape-hatch only; not approved for implementation now |

**Owner action required before any live text model is enabled beyond current default:** confirm exact `OPENROUTER_TEXT_PRIMARY_MODEL` and (optional) `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` / secondary / reviewer model identifiers. Until that confirmation is recorded, local deterministic execution remains the only production-safe default.

### 1.2 Model selection logic (existing code behavior — reference only)

Selection between primary and long-context model slots is by approximate input token count, as implemented in `selectAiGatewayOpenRouterModel()` and documented in [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §2.1. This policy does not change that logic; it constrains which model IDs may ever be placed in the corresponding env vars.

### 1.3 Cost caps (policy ceiling — code enforcement is source of truth)

| Guardrail | Current code value | Policy rule |
|-----------|--------------------|-------------|
| Output token cap — summary | 180 | Must not be widened without a dedicated cost-review change, never via env |
| Output token cap — content plan draft | 700 | Same as above |
| Output token cap — article draft | 1800 | Same as above |
| Hard input context limit | ~3200 approx. tokens | Exceeding → provider call skipped, local deterministic fallback used |
| Long-context threshold | ~1800 approx. tokens | Switches model slot only if long-context model is configured |
| Per-request HTTP timeout | 20,000 ms | No automatic retry (see §1.5) |

Policy requirement: all cost/token guardrails remain **code-level constants**, never env-widenable, consistent with current implementation in `ai-text-budget.policy.ts`. Any future change to these caps requires an explicit, separate owner-approved change — this document does not itself authorize raising any cap.

### 1.4 Live-call opt-in (hard requirement)

Live text provider calls are permitted **only** when **all** of the following are true, matching current code behavior in `isOpenRouterLiveExecutionReady()`:

- `AI_TEXT_GATEWAY=openrouter` explicitly set
- `OPENROUTER_API_KEY` present in target environment (never committed)
- `OPENROUTER_TEXT_PRIMARY_MODEL` present and equal to an owner-approved model ID (§1.1)
- Execution is admin-triggered (no autonomous/background/scheduled AI runs — see §5)
- A live-proof runbook pass (§ [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md)) has been run against the target environment, with owner approval recorded, before that environment is treated as "live-enabled"

Default/production posture: `AI_TEXT_GATEWAY` unset or `local`. Production must not carry a live provider key unless a separate, explicit owner approval names the production environment.

### 1.5 Retry / timeout policy

- **No automatic retry loop.** One HTTP attempt per admin-triggered execution (current behavior of `executeOpenRouterTextRequest`). Policy affirms this: silent multi-retry against a paid API is a cost/latency risk and is not approved.
- **Timeout:** 20-second hard abort via `AbortController`. A timeout is treated as a provider failure and must fall through to local deterministic fallback (§1.7), never surfaced as a raw error to the client.
- **Manual re-run only:** if an admin wants to retry a failed generation, that is a distinct, admin-initiated action (e.g. "regenerate"), not an automatic retry inside the same request.

### 1.6 Prompt logging policy

- Raw prompts must **never** be returned on any client-safe API surface (client portal, client-facing responses).
- Admin-only observability may retain: gateway used, model slot, `liveProviderCalled`, `isDeterministic`, budget policy applied, approximate input token count, max output tokens, and safe (non-sensitive, non-secret) error text — matching current `[OBSERVABILITY]` block behavior described in [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md) §2.4.
- Full raw prompt/response bodies, if ever persisted for admin debugging or learning-loop purposes (see image lineage in §2.9), must be stored admin-only, never exposed via any client-reachable endpoint, and must pass through existing prompt-injection sanitization (`sanitizeUntrustedContextText`) before storage or reuse.
- Provider API keys, `sk-or-` style tokens, password hashes, and session token hashes must never appear in logs, prompts, responses, or observability payloads. This is a standing smoke requirement and must remain one.

### 1.7 Deterministic fallback policy (must always exist)

Local deterministic text execution must remain available and must be the fallback in every one of these cases:

- `AI_TEXT_GATEWAY` unset, `local`, or unrecognized
- `AI_TEXT_GATEWAY=disabled` (safe block, not a crash)
- OpenRouter misconfigured (key/model missing while gateway=openrouter)
- Input exceeds the hard context token budget
- Provider HTTP failure, timeout, empty content, or unparseable response

No future provider change may remove the deterministic fallback path without a separate, explicit owner-approved change to this policy.

---

## 2. Image model policy

### 2.1 Provider/model direction (approved direction; final selection pending owner approval)

| Candidate | Mode | Role | Approval status |
|-----------|------|------|------------------|
| OpenAI Images (`openai` / `gpt-image-1`) | Direct API via `ImageProviderAdapter` → `OpenAIImageAdapter` | **Active primary** (2026-07-12 pivot) for first live proof | Approved for local adapter; **staging live proof NOT YET** |
| BFL FLUX (`bfl` / `flux-2-pro`) | Direct API via `ImageProviderAdapter` → `BFLFluxAdapter` | Supported alternate; not active default after OpenAI pivot | Local adapter KEEP; staging one-image STOP (HTTP 402) |
| Adobe Firefly | Direct API via `ImageProviderAdapter` | Historical preferred direction / future alternate | Not selected for first adapter |
| Ideogram | Direct API | Candidate (typography-strong) | Listed candidate only |
| Midjourney-like | Manual/external | Admin-only inspiration, not a backend integration target | Explicitly excluded as a coded integration |
| Local deterministic (mock bytes) | Dev/test | Dev/test path only — never a silent live substitute | Approved for fake-transport tests only |

**Architecture rule:** image generation plugs into **AI Policy → `image_single` route → `ImageProviderAdapter` → active `OpenAIImageAdapter` (`gpt-image-1`)**. BFL remains registrable under the same interface. Workflows must not call vendors directly. OpenRouter text gateway is **not** the image path.

**Initial route limits:** outputCount=1; submit/jobs=1; retry=0; fallback=false; maxCostUsd=0.10; ≤1 MP (1024×1024 class); OpenAI quality locked `low` for cost bound.

### 2.2 Generation scope (policy ceiling)

Per article: 1 hero + 2 supporting images, plus 1 social preview image generated after final approval (per [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) §1.1–1.2). Any increase to per-article image count is a cost-policy change and requires separate owner approval.

### 2.3 Cost caps (policy — to be finalized at provider selection)

| Guardrail | Policy rule |
|-----------|-------------|
| Images per article (initial set) | Hard cap: 3 (1 hero + 2 supporting) |
| Images per article (social preview) | Hard cap: 1 additional, only after content approval |
| Regeneration scope | Regenerate **rejected slots only**, never the full set, per reject reason |
| Max regeneration attempts per slot | **PENDING OWNER APPROVAL** — must be a finite, code-enforced cap (not unlimited) before any live wiring |
| Per-request timeout | Must mirror text policy pattern (§1.5): a hard timeout, no automatic retry loop; exact value **PENDING** provider selection |
| Provider spend visibility | Admin-only; never exposed to client portal, matching §1.6 prompt-logging boundary |

This policy requires that whatever provider is finally approved, a **finite per-article and per-regeneration cost cap** must be code-enforced (not env-widenable) before Phase B (disabled-safe wiring) is considered complete, mirroring the text budget policy pattern in `ai-text-budget.policy.ts`.

### 2.4 Live-call opt-in (hard requirement, mirrors text policy)

Live image provider calls are permitted **only** when **all** of the following are true (enforced by `evaluateImageGenerationLiveAuthorization`):

- `IMAGE_GENERATION_ENABLED=true`
- allowlisted provider (`openai` active; `bfl` also allowlisted) and model (`gpt-image-1` active; `flux-2-pro` preserved) present
- `IMAGE_GENERATION_API_KEY` present (never logged)
- `IMAGE_GENERATION_LIVE_CALLS_ALLOWED=true` (explicit live opt-in — key alone is insufficient)
- AI Policy `image_single` route authorizes live (`allowLive`, retry=0, fallback=false, cost ≤ $0.10)
- Execution is admin-triggered only — never autonomous/background/scheduled
- A staging live-proof pass has been run with owner approval before that environment is treated as live-proven

Default posture: no-live. Foundation variant-set path keeps `IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED=false`. This document does **not** authorize staging live proof by itself.

### 2.5 Retry / timeout policy

Same principle as text (§1.5): no silent automatic retry loop against a paid image API. A failed/timed-out generation attempt must be recorded (status + reason) and requires an explicit admin "regenerate" action, not an automatic re-call. Exact timeout value is provider-dependent and must be set when the provider is selected, then documented here and in `IMAGE_GENERATION_PROOF.md`.

### 2.6 Prompt logging policy

Same boundary as text (§1.6), extended for image:

- Prompt, provider, model, `approvalStatus`, `rejectReason`, and `replacementLineageId` may be retained per generation attempt for the admin learning loop (per [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) §1.9), admin-visible only.
- Client-facing responses must never include `storageKey`, raw provider URLs, full prompts, or provider/model metadata — client sees signed preview URLs only.
- Reject reasons entered by admin or client may reference prompt lineage internally but must not leak provider internals back to the client.

### 2.7 Sensitive data policy

- No real client business data, credentials, or client-identifying free text beyond what is already part of the approved content/topic profile should be sent to an image provider prompt.
- No real-person likeness may be requested or used without documented consent (per [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) §1.7–1.8); this is a hard reject criterion, not a style preference.
- Provider-returned image bytes are treated as potentially containing embedded metadata; any such metadata must be stripped or not persisted verbatim into client-reachable storage paths.

### 2.8 Medical / compliance guardrails (hard requirement — aesthetic/medical clients)

Given DCA OS Lite's aesthetic/medical client base (e.g. Puriva), the following are **non-negotiable** guardrails for both text and image generation, not optional style choices:

| Rule | Enforcement point |
|------|--------------------|
| No fake doctors, fabricated credentials, or fabricated patient claims/testimonials | Prompt negative list (text + image) + mandatory admin review gate before client visibility |
| No misleading before/after or transformation imagery | Reject-reason taxonomy + mandatory regenerate; never auto-approved |
| BPOM / medical-advertising caution (claims that require regulatory substantiation) | Prompt template constraints + human review gate; text drafts must avoid unverified medical claims |
| No real-person likeness without documented consent | Prompt constraints + manual review (§2.7) |
| Human review before any client-facing publication | Admin approval required for both content drafts and image sets; this is a product/process gate, not solely a technical one |

These guardrails apply regardless of which provider is ultimately selected (§1.1, §2.1) and must be reflected in prompt templates and admin review checklists before any live provider call, not retrofitted afterward.

### 2.9 Fallback policy

Unlike text, image generation currently has **no deterministic "local" visual fallback** that produces a usable final asset. Policy for the interim (no provider wired):

- If no image provider is enabled/configured: image-generation requests must fail safe (e.g. `503`/skipped state) with **no orphaned `storageKey`** and no client-facing broken reference — per [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md) §3.7.
- Manual admin upload remains the supported fallback path when no live provider is available (existing `AiDeliveryArticleImage` manual upload/mark-ready path).
- A provider failure/timeout during a live-enabled call must return a clear failed-generation state (retriable via explicit admin regenerate action), never a silently substituted or degraded image.

---

## 3. Cross-cutting rules (text + image)

1. **Admin-triggered only.** No autonomous, scheduled, or background AI execution for either text or image generation is approved. See [`AI_PROVIDER_DATA_COLLECTION_DECISION.md`](../AI_PROVIDER_DATA_COLLECTION_DECISION.md) §4.
2. **Client-safe boundary.** Clients receive only transformed, approved outputs — never raw prompts, provider names/models, cost data, credentials, or internal workflow/observability logs.
3. **Local-first default.** Production remains local-deterministic (text) or provider-disabled (image) unless a separate, explicit, environment-named owner approval enables a live path.
4. **No env-based cap widening.** Cost/timeout/token/image-count guardrails live in code, not env, so staging/production env config cannot silently widen spend exposure.
5. **No provider calls from documentation/policy work.** Writing or updating this policy, or the runbooks it references, must never itself trigger a live provider call.
6. **Provider decisions require explicit, recorded owner approval.** Every "PENDING OWNER APPROVAL" marker in §1.1 and §2.1 must be resolved by an explicit owner statement (naming the provider/model and environment) recorded in this document before that provider/model may be used beyond local dev/test.

---

## 4. Approval status summary

| Decision | Status |
|----------|--------|
| Text gateway = OpenRouter | Approved direction (docs) |
| Text primary model family = OpenAI (via OpenRouter) | Approved direction (docs); exact model ID pending |
| Text long-context/reviewer model family = Gemini (via OpenRouter) | Approved direction (docs); exact model ID pending |
| Text local deterministic fallback | **Approved and active default** |
| Image primary provider | **openai / gpt-image-1** active (2026-07-12 pivot); BFL preserved; local adapters implemented; staging live NOT PROVEN |
| Image fallback provider | **Disabled** for initial route (`fallbackAllowed=false`) |
| AI Policy / provider routing architecture | **Aligned** — [`AI_POLICY_PROVIDER_ROUTING.md`](./AI_POLICY_PROVIDER_ROUTING.md); `OpenAIImageAdapter` active + `BFLFluxAdapter` preserved |
| Cost caps (text) | Approved and code-enforced today |
| Cost caps (image) | **Pending — must be defined before Phase B wiring** (§2.3) |
| Medical/compliance guardrails (§2.8) | Approved policy; enforcement mechanism (templates/checklists) not yet built |
| Live provider enablement (any environment) | **Not approved** — requires separate, environment-named owner approval per live-proof runbook |

---

## 5. Explicit exclusions (this document does not)

- Add SDK dependencies, API keys, schema changes, or migrations
- Enable any provider by default or change current code behavior
- Authorize Phase B/C/D of [`IMAGE_GENERATION_PROOF.md`](../runbooks/IMAGE_GENERATION_PROOF.md)
- Authorize §4.3/§4.4 strict live proof in [`AI_PROVIDER_LIVE_PROOF.md`](../runbooks/AI_PROVIDER_LIVE_PROOF.md)
- Close the "AI Model Research" or "AI Model Policy" Puriva Launch blockers in [`docs/STATUS.md`](../STATUS.md) (status updates to that file are out of scope for this change)
- Make any live provider API call
