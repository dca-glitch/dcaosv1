# AI Provider Live Proof

**Status:** Local deterministic default proven; live OpenRouter proof is owner/manual only. Does not authorize production enablement or autonomous AI.

**Gate:** Puriva Launch blocker — live AI provider proof (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)).

Related:

- [`docs/architecture/AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) — **model/provider policy (cost caps, live-call opt-in, retry/timeout, prompt logging, fallback). Provider model IDs are pending owner approval; this runbook proves execution behavior only, it does not select or approve a model.**
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

**Model selection note:** the model IDs below must be owner-approved values per [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §1.1 before use in any shared (staging/production) environment. Local, throwaway smoke runs against a personal key are the only exception, and even those must follow the cost caps in §2.2 of that policy.

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

- Using a model ID that is not recorded as owner-approved in [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §1.1 for any shared environment
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

---

## 9. G70 — Controlled first live AI provider proof checklist (post-G69)

**Status:** Owner-input checklist only. **Does not authorize production deploy**, staging mutation, or autonomous AI.

**Prerequisite:** G57–G68 on `main` (`64bfd06`); local deterministic default proven; orchestrator kill switch and Puriva $100/month cap in place.

### 9.1 Required owner inputs (before any live call)

| # | Owner must provide | Recorded where |
|---|-------------------|----------------|
| 1 | Written approval sentence naming **target environment** (`local` throwaway only, or `staging` after separate staging approval) | Evidence log §8 |
| 2 | Approval of **exact provider path** (default first proof: OpenRouter text via `AI_TEXT_GATEWAY=openrouter`) | Evidence log |
| 3 | Approval of **primary model ID** per [`AI_MODEL_POLICY.md`](../architecture/AI_MODEL_POLICY.md) §1.1 | Evidence log (model name only) |
| 4 | Confirmation **Puriva monthly AI cap = $100 USD** remains in force for proof runs | Evidence log |
| 5 | Confirmation **kill switch** understood: set `AI_TEXT_GATEWAY=local` or unset to disable live immediately | Evidence log |
| 6 | Named **operator** executing the proof (human admin, not background job) | Evidence log |
| 7 | Confirmation proof is **admin-triggered single workflow** only — no batch, no client-visible output | Evidence log |
| 8 | Explicit statement that **production deploy (G50) is not part of this proof** | Evidence log |

### 9.2 Required secrets / env (names only — never log values)

Set on target machine only; restart API after change:

| Env name | Required for first proof | Notes |
|----------|-------------------------|-------|
| `AI_TEXT_GATEWAY` | yes | Must be `openrouter` for live path |
| `OPENROUTER_API_KEY` | yes | Owner-provided; never commit or print |
| `OPENROUTER_TEXT_PRIMARY_MODEL` | yes | Owner-approved model ID |
| `OPENROUTER_BASE_URL` | optional | Default `https://openrouter.ai/api/v1` |
| `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` | optional | Not required for first minimal proof |
| `AUTH_SEED_TEST_PASSWORD` | yes (local smoke) | Local admin login for smokes only |

**Not in scope for first AI text proof:** `IMAGE_GENERATION_*`, `RESEND_*` / email, R2 keys, WordPress credentials, GA/GSC OAuth, payment provider keys.

### 9.3 Budget cap confirmation

| Check | Required value |
|-------|----------------|
| Puriva operating pack monthly cap | **$100 USD** (`PURIVA_AI_MONTHLY_CAP_USD`) |
| Proof session additional spend ceiling | Owner must set **max $1.00 USD** for first controlled proof (single admin-triggered workflow execute) |
| Persistent ledger | Dry-run estimates on main; live proof must not exceed owner session ceiling |
| Over-budget behavior | Workflow must block or fall back to local deterministic — **stop proof** if cap exceeded |

### 9.4 Kill switch confirmation

Before live proof:

1. Confirm `GET /ai-orchestrator-lite/registry` shows `orchestratorLiveSafe` / kill switch snapshot with no enabled live registry providers.
2. Confirm default env has `AI_TEXT_GATEWAY` unset or `local`.

During live proof:

- One operator watches API logs; no parallel AI runs.

Immediate disable (kill switch):

```powershell
# On target machine — remove or set local; restart API
# AI_TEXT_GATEWAY=local  (or unset)
# Remove OPENROUTER_API_KEY from active env
```

Re-verify: `npm.cmd run smoke:openrouter-guarded:local` **without** `SMOKE_EXPECT_OPENROUTER_LIVE=true` → `openRouterLiveExecutionEnabled=false`.

### 9.5 Allowed provider / model (first proof)

| Item | Allowed for G70 first proof | Forbidden |
|------|---------------------------|-----------|
| Provider | OpenRouter text gateway only | Anthropic/Gemini/Perplexity direct, image providers |
| Gateway | `AI_TEXT_GATEWAY=openrouter` when key+model present | Production URL without G9-class approval |
| Model | One owner-approved `OPENROUTER_TEXT_PRIMARY_MODEL` | Unapproved model IDs; long-context slot unless explicitly approved |
| Execution surface | Admin workflow brief MI or SEO local proof path via `smoke:openrouter-guarded:local` strict mode | Client portal routes; orchestrator material-routing preview does **not** call live providers |
| Target env | **Local throwaway** (`127.0.0.1:4000`) strongly preferred | Production `system.digitalcubeagency.net` **forbidden** in G70 |

### 9.6 Allowed test prompt type

| Allowed | Details |
|---------|---------|
| **Single admin-triggered workflow execute** | Existing workflow-brief MI summary or SEO planning deterministic proof path used by `smoke-openrouter-guarded-local.mjs` |
| Input material | Approved test tenant data only; no real client medical data |
| Output | Admin `executionLog` / observability block only; **not** client-visible |

| Forbidden |
|-----------|
| Research agent live crawl; image generation; compliance review live model; batch article drafts; any client portal exposure |

### 9.7 Expected max cost

| Item | Limit |
|------|-------|
| First proof session total | **≤ $1.00 USD** (owner-enforced session ceiling) |
| Single request output tokens | Bounded by `ai-text-budget.policy.ts` caps (summary ≤180, content plan ≤700, article ≤1800) |
| Retries | **0** automatic provider retries per request |
| Timeout | 20s HTTP abort (code default) |

If estimated or actual cost exceeds session ceiling → **STOP** (§9.9).

### 9.8 Exact success criteria

All must pass:

1. Baseline `npm.cmd run smoke:ai-provider-config:local` — **19/19 PASS** (no live env).
2. Baseline `npm.cmd run smoke:openrouter-guarded:local` — PASS with `textGateway=local`, `liveProviderCalled=false`.
3. With owner env set and `SMOKE_EXPECT_OPENROUTER_LIVE=true`: strict smoke PASS.
4. `GET /ai-provider/planning-config` — no API keys in response.
5. Workflow execute shows `Gateway: openrouter` and configured model name in admin-safe `executionLog`.
6. No `sk-or-`, `OPENROUTER_API_KEY`, password hashes, or session tokens in smoke output.
7. Evidence log completed (§8 + §9.10).
8. Env restored to local/disabled defaults; baseline smoke re-run PASS.

**Production deploy is not a success criterion and must not be performed.**

### 9.9 Exact stop conditions

Stop immediately (do not continue proof) if:

| # | Condition |
|---|-----------|
| 1 | Any secret appears in API response, console, or log file |
| 2 | Client-role caller receives AI execution metadata or live output |
| 3 | `liveProviderCalled=true` outside the single approved admin workflow execute |
| 4 | Session cost approaches or exceeds **$1.00 USD** owner ceiling |
| 5 | Puriva monthly cap kill switch activates (`killSwitchActive=true` on budget snapshot) |
| 6 | OpenRouter timeout, 5xx, or parse failure **without** safe local fallback |
| 7 | Operator loses visibility into API process (runaway requests) |
| 8 | Target environment is production without explicit G9/G50 approval |
| 9 | `validate` or baseline smokes fail after env restore attempt |
| 10 | Owner revokes approval verbally or in writing |

On stop: execute rollback (§9.10) before closing the session.

### 9.10 Rollback / disable steps

1. Set `AI_TEXT_GATEWAY=local` or unset; remove `OPENROUTER_API_KEY` from active process env.
2. Restart API (`npm.cmd run dev:api` locally, or approved staging container restart only if staging was approved).
3. Run `npm.cmd run smoke:openrouter-guarded:local` without `SMOKE_EXPECT_OPENROUTER_LIVE`.
4. Confirm `openRouterLiveExecutionEnabled=false` on planning config.
5. Archive evidence log to `$env:TEMP`; redact any accidental secret fragments.
6. Record STOP reason and rollback completion in deferred-scope / gate closeout notes.

### 9.11 Proof log requirements

Save to: `$env:TEMP\g70-ai-provider-live-proof-<yyyyMMdd-HHmmss>.log`

Must include:

- Gate name: **G70 / first controlled live AI provider proof**
- `main` commit SHA (`64bfd06` or newer on approved branch)
- Target environment: `local` | `staging` (never `production` for G70)
- Owner approval sentence (verbatim, no secrets)
- Env names set (boolean presence only for secrets)
- Approved model ID (name only)
- Budget cap confirmations ($100 Puriva / $1 session)
- Kill switch tested: yes/no
- Baseline smoke results
- Strict live smoke result
- `liveProviderCalled` observed: once only / none
- Fallback observed: yes/no
- Stop triggered: yes/no + reason
- Rollback completed: yes/no
- **Production deploy performed: no** (required)

Open log in Notepad for owner review. **Do not commit log file.**

### 9.12 Production deploy exclusion

| Item | G70 scope |
|------|-----------|
| Production deploy (G50) | **Excluded** |
| Staging artifact refresh | **Excluded** unless separate owner gate |
| VPS / SSH / Caddy / DNS | **Excluded** |
| Prisma migration on staging/production | **Excluded** |
| Enabling live providers in production env | **Excluded** |

Next recommended gate after successful G70 proof: **live image generation proof** or **staging migration + staging live proof** per deferred-scope register — each requires separate owner approval.
