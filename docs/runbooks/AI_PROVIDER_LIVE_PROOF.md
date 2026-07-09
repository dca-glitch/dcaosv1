# AI Provider Live Proof

**Status:** Local deterministic default proven; live OpenRouter proof is owner/manual only. Does not authorize production enablement or autonomous AI.

**Gate:** Puriva Launch blocker — live AI provider proof (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)).

Related:

- [`docs/operator/AI_PROVIDER_LOCAL_CONFIG.md`](../operator/AI_PROVIDER_LOCAL_CONFIG.md)
- [`POST_MVP_BLOCK_40_OPENROUTER_GUARDED_LOCAL_GATE.md`](./POST_MVP_BLOCK_40_OPENROUTER_GUARDED_LOCAL_GATE.md)
- [`EXTERNAL_INTEGRATIONS_READINESS.md`](./EXTERNAL_INTEGRATIONS_READINESS.md)
- `apps/api/src/config/ai-provider.config.ts`
- `apps/api/src/core/ai-gateway-v1.service.ts`
- `apps/api/src/core/ai-text-budget.policy.ts`
- `apps/api/src/services/openrouter-text.service.ts`
- `scripts/smoke-ai-provider-config-local.mjs`
- `scripts/smoke-openrouter-guarded-local.mjs`

---

## 1. Purpose

Prove that DCA OS Lite AI text execution:

1. Defaults to **local deterministic** execution when provider env is missing or misconfigured.
2. Can execute a **guarded live OpenRouter path** only when explicitly configured and owner-triggered.
3. Enforces **cost guardrails**, **timeouts**, **admin-only prompt/execution logging**, and **deterministic fallback** on provider failure.

This runbook does **not** authorize background AI, cost dashboards, or production env changes without a separate owner gate.

---

## 2. Architecture summary

| Layer | Location | Role |
|-------|----------|------|
| **Adapter / gateway** | `ai-gateway-v1.service.ts` (`AI_GATEWAY_V1`) | Routes `disabled` → block, `local` → skip provider, `openrouter` → live call when ready |
| **Provider config** | `ai-provider.config.ts` | Reads `AI_TEXT_GATEWAY`, OpenRouter key/model env (presence only at planning endpoints) |
| **OpenRouter HTTP** | `openrouter-text.service.ts` | Single-request chat completion; **20s hard timeout** via `AbortController` |
| **Budget policy** | `ai-text-budget.policy.ts` (`AI_TEXT_BUDGET_POLICY_V1`) | Output caps + context limits (code policy, not env-widenable) |
| **Workflow execution** | `workflow-brief-*.execution.ts`, `ai-delivery-workflow-execution.adapter.ts` | Admin-triggered runs; local fallback on skip/failure |
| **Planning snapshot** | `GET /ai-provider/planning-config` | Safe config shape for admin UI; **never returns API keys** |

### 2.1 Model selection

OpenRouter model slot is chosen in `selectAiGatewayOpenRouterModel()`:

| Condition | Model slot | Env key |
|-----------|------------|---------|
| Approximate input tokens ≤ 1800 | `primary` | `OPENROUTER_TEXT_PRIMARY_MODEL` |
| Approximate input tokens > 1800 and long-context model set | `long_context` | `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` |

Secondary/reviewer model env keys exist for planning/future slots; current workflow paths use primary or long-context selection only.

`isOpenRouterLiveExecutionReady()` requires **all** of:

- `AI_TEXT_GATEWAY=openrouter`
- `OPENROUTER_API_KEY` present
- `OPENROUTER_TEXT_PRIMARY_MODEL` present

### 2.2 Cost guardrails (code policy)

| Guardrail | Value | Notes |
|-----------|-------|-------|
| Output token cap — summary | 180 | `AI_TEXT_OUTPUT_TOKEN_CAPS.summary` |
| Output token cap — content plan draft | 700 | `AI_TEXT_OUTPUT_TOKEN_CAPS.content_plan_draft` |
| Output token cap — article draft | 1800 | `AI_TEXT_OUTPUT_TOKEN_CAPS.article_draft` |
| Long-context preference threshold | 1800 approximate input tokens | Switches model slot when long-context model configured |
| Hard context limit | 3200 approximate input tokens | Exceeding → provider skipped; **deterministic local fallback** |
| OpenRouter HTTP timeout | 20000 ms | No automatic in-request retry |

Token estimation: `Math.ceil(trimmed.length / 4)` — approximate only; policy is conservative.

### 2.3 Retry / timeout behavior

- **No automatic provider retry loop** in `executeOpenRouterTextRequest` — one HTTP attempt per admin-triggered execution.
- **Timeout:** 20s abort; safe error returned without leaking response bodies or keys.
- **Fallback:** Workflow layers catch provider skip/failure/parse errors and return **local deterministic** output with `executionLog` noting the fallback reason.
- **Misconfiguration:** `AI_TEXT_GATEWAY=openrouter` without key/model → runtime warning + local deterministic path (fail-safe, not fail-open to live).

### 2.4 Prompt logging (admin-only)

- Raw prompts are **not** returned on client-safe API surfaces.
- Admin workflow runs store `executionLog` lines plus an `[OBSERVABILITY]` JSON block containing: gateway, model, `liveProviderCalled`, `isDeterministic`, budget policy, approximate input tokens, max output tokens, and **safe** error text only.
- Prompt injection sanitization runs on context and prompt text (`sanitizeUntrustedContextText`); flags are recorded in audit metadata.
- Smokes forbid `OPENROUTER_API_KEY`, `sk-or-`, password hashes, and session token hashes in responses.

### 2.5 Deterministic fallback

Always available when:

- `AI_TEXT_GATEWAY` unset or `local`
- `AI_TEXT_GATEWAY=disabled` (blocked with safe failure for some paths; workflow brief MI/SEO still succeeds locally)
- OpenRouter misconfigured
- Context exceeds hard token budget
- OpenRouter HTTP failure, timeout, empty content, or unparseable JSON

Fallback reports `Gateway: local`, `Model: local-deterministic`, `liveProviderCalled: false`.

---

## 3. Environment (live proof only)

Set on the **target machine only** — never commit secrets:

```env
AI_TEXT_GATEWAY=openrouter
OPENROUTER_API_KEY=<owner-provided-key>
OPENROUTER_TEXT_PRIMARY_MODEL=<owner-provided-model>
# Optional:
OPENROUTER_TEXT_LONG_CONTEXT_MODEL=<owner-provided-model>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Restart API after env change:

```powershell
cd C:\dcaosv1
npm.cmd run dev:api
```

---

## 4. Proof paths

### 4.1 Baseline — config shape (no API)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-provider-config:local
```

Pass: gateway defaults to `local`; misconfigured OpenRouter shapes produce warnings; no network calls.

### 4.2 Baseline — guarded local deterministic (API required)

Requires local API on **4000** and `AUTH_SEED_TEST_PASSWORD`.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:openrouter-guarded:local
```

Pass:

- Admin login succeeds
- `GET /ai-provider/planning-config` returns safe snapshot (no keys)
- `textGateway=local`, `openRouterLiveExecutionEnabled=false`
- Workflow execute reports `Gateway: local`, `Model: local-deterministic`

Included in `npm run smoke:pre-staging:local`.

### 4.3 Strict — live OpenRouter (owner/manual only)

1. Stop API.
2. Set live env (§3).
3. Restart API.
4. Run:

```powershell
cd C:\dcaosv1
$env:SMOKE_EXPECT_OPENROUTER_LIVE = "true"
npm.cmd run smoke:openrouter-guarded:local
Remove-Item Env:SMOKE_EXPECT_OPENROUTER_LIVE -ErrorAction SilentlyContinue
```

Pass:

- `openRouterLiveExecutionEnabled=true`
- Workflow execute reports `Gateway: openrouter` with configured model
- No API keys or `sk-or-` tokens in responses or console output

5. Restore local defaults (`AI_TEXT_GATEWAY` unset or `local`; remove provider key) before other smokes.

### 4.4 Target-environment live proof (staging/production)

Follow [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](./G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) pattern:

- Explicit owner approval sentence naming target environment
- Readiness probe first: `GET /integrations/readiness` → AI category must not claim live until env configured
- Run strict smoke against target API base URL only after approval
- Capture evidence log to `$env:TEMP`; never print secret values

---

## 5. Pass criteria (live proof closure)

| # | Criterion |
|---|-----------|
| 1 | Baseline deterministic smokes PASS on default env |
| 2 | Strict live smoke PASS with owner-provided key/model on approved target |
| 3 | `executionLog` / observability show correct gateway, model, budget metadata |
| 4 | Provider failure or timeout falls back to deterministic output without client exposure |
| 5 | No secrets in API responses, smokes, or operator logs |
| 6 | Owner records approval + evidence path in gate closeout (docs or decision log) |

---

## 6. Forbidden

- Enabling live provider in production without separate G9/G50-class owner approval
- Widening token caps or timeouts via env (policy is code-only)
- Autonomous/background AI execution
- Returning raw prompts, provider costs, or API keys to client portal
- Committing `.env`, keys, or smoke output containing secrets

---

## 7. Rollback / recovery

If live proof causes unexpected cost or bad output:

1. Set `AI_TEXT_GATEWAY=local` (or unset) and remove `OPENROUTER_API_KEY` from target env.
2. Restart API container/process.
3. Re-run baseline smoke (`smoke:openrouter-guarded:local` without `SMOKE_EXPECT_OPENROUTER_LIVE`).
4. Confirm `openRouterLiveExecutionEnabled=false` on planning config.
5. Archive evidence log; do not revert code unless a defect is confirmed.

---

## 8. Evidence template

Save to `$env:TEMP\ai-provider-live-proof-<date>.log`:

```
Date:
Target env: local | staging | production
Commit SHA:
AI_TEXT_GATEWAY:
Primary model: (name only)
Strict smoke result: PASS | FAIL
Fallback observed: yes | no
Secrets leaked: no (required)
Owner approval reference:
```
