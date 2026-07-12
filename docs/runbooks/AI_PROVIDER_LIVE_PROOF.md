# AI Provider Live Proof

**Status:** Local deterministic default proven; **formal clean local OpenRouter live proof complete (G71e + G71e-retry)**; **G77b persistent COMPLETED ledger row proven (local only)**; **AI-A Orchestrator staging preflight KEEP (2026-07-12) = CONFIG SHAPE PROVEN** (no live OpenRouter call; marker `DCA-WS7-AI-A-20260712-064227`). Does not authorize production enablement, staging AI Delivery live E2E (AI-B), or autonomous AI.

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

0. Optional no-live preflight (dummy key; no execute; no OpenRouter network):

```powershell
cd C:\dcaosv1
npm.cmd run smoke:openrouter-api-env-preflight:local
```

Pass: planning-config shows `textGateway=openrouter`, `hasOpenRouterApiKey=true`, model `anthropic/claude-haiku-4.5`, `openRouterLiveExecutionEnabled=true`, then restores local.

1. Stop **all** listeners on port 4000 (confirm with health after stop).
2. Set live env on the **API process** (§3) — not only the smoke shell. Prefer starting API with an explicit process env object.
3. Restart API; wait for health; confirm planning-config live shape **before** strict smoke.
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

5. Restore local defaults (`AI_TEXT_GATEWAY` unset or `local`; remove provider key from API process) before other smokes.

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

### 9.13 G71b retry — partial live proof result (2026-07-09)

**Status:** Procedural **STOP** with one substantive safe live OpenRouter call captured. **Not** a clean KEEP. **Not** a provider failure.

| Item | Result |
|------|--------|
| Gate | G71b retry |
| `main` commit | `6a1c569` |
| Operator | Piotr Pakula |
| Target | Local only — `127.0.0.1:4000` |
| Config smoke | **PASS** — `smoke:ai-provider-config:local` 19/19 |
| Baseline guarded smoke | **FAIL** — 10/12; API already had `textGateway=openrouter` and `openRouterLiveExecutionEnabled=true` |
| Formal live smoke (`SMOKE_EXPECT_OPENROUTER_LIVE=true`) | **Not run** — stopped per §9.9 after baseline failure; second live call not attempted |
| Live call observed | **One** — during baseline workflow execute |
| Run ID | `0da6b6a1-2116-478f-ba95-fd674b019d1a` |
| Provider | OpenRouter |
| Model | `anthropic/claude-haiku-4.5` (approved) |
| `liveProviderCalled` | `true` |
| `isDeterministic` | `false` |
| Smoke marker | `[SMOKE][OPENROUTER_GUARDED]` |
| Budget policy | `AI_TEXT_BUDGET_POLICY_V1` |
| Tokens | ~56 input; max 180 output |
| Session cost | Estimated below **$1.00 USD**; `actualCostUsd` not exposed in API response |
| Forbidden integrations | None triggered |
| Secrets exposed | No |
| Production deploy | No |

**Root cause of procedural stop:** `smoke-openrouter-guarded-local.mjs` baseline mode expects `textGateway=local` and `openRouterLiveExecutionEnabled=false`. The running API process was started with OpenRouter live env **before** baseline smoke, so baseline assertions failed and workflow execute invoked live OpenRouter during the baseline run.

**Interpretation:**

- G71b is **partial live proof** — one safe admin workflow live call with the approved model.
- G71b is **not** formal gate closure — strict live-mode smoke pass and full §9.8 checklist were not completed.

Evidence logs: `$env:TEMP\g71b-ai-provider-live-proof-retry.log`

### 9.14 G71c closeout — corrected live proof sequence (2026-07-09)

**Status:** Docs-only closeout. No live AI. Local gateway restored after G71b.

**Local restore evidence (G71b restore):**

- API process on port 4000 with live OpenRouter env was stopped.
- Shell live AI env vars cleared (`OPENROUTER_API_KEY`, `OPENROUTER_TEXT_PRIMARY_MODEL`, `SMOKE_EXPECT_OPENROUTER_LIVE` removed).
- `AI_TEXT_GATEWAY` reset to `local`.
- API restarted in local deterministic mode; health PASS.
- Restore log: `$env:TEMP\dca-g71b-restore-local-gateway.log`

**Corrected future procedure (mandatory for formal clean proof):**

| Phase | API env | Smoke |
|-------|---------|-------|
| 1 — Baseline | `AI_TEXT_GATEWAY=local` (or unset); **no** OpenRouter key in active API process | `npm.cmd run smoke:ai-provider-config:local` then `npm.cmd run smoke:openrouter-guarded:local` **without** `SMOKE_EXPECT_OPENROUTER_LIVE` — expect 12/12 PASS, `liveProviderCalled=false` |
| 2 — Live proof | Stop API; set `AI_TEXT_GATEWAY=openrouter` + owner key + approved model; restart API | `$env:SMOKE_EXPECT_OPENROUTER_LIVE = "true"`; `npm.cmd run smoke:openrouter-guarded:local` **once**; remove live expectation env immediately |
| 3 — Restore | Set `AI_TEXT_GATEWAY=local`; remove OpenRouter key from active process; restart API | Re-run baseline guarded smoke without live expectation — expect 12/12 PASS |

**API process env injection (G77b failure lesson):**

- `GET /ai-provider/planning-config` and workflow execute read OpenRouter env from the **API process** at request time via `getAiProviderConfig()` / `process.env`.
- Setting `$env:AI_TEXT_GATEWAY` / `$env:OPENROUTER_*` only in the **smoke shell** does **not** change an already-running API.
- Smoke `loadRepoEnv()` affects the smoke Node process only; it cannot inject env into a separate API process.
- `.env` load at API startup (`loadStartupEnvironment`) fills keys only when they are **undefined** in the process env — shell/process env wins and is never overridden by `.env`.
- Live Phase 2 must **stop listeners on port 4000**, start `npm.cmd run dev:api` with OpenRouter vars in that API process env (explicit `Start-Process`/`spawn` env object preferred), wait for health, then confirm planning-config shows `textGateway=openrouter`, `hasOpenRouterApiKey=true`, `openRouterLiveExecutionEnabled=true` **before** running strict live smoke.
- No-live preflight (dummy key, no execute, no OpenRouter network): `npm.cmd run smoke:openrouter-api-env-preflight:local`.

**Rules:**

1. **Do not** run baseline guarded smoke against an API already configured for live OpenRouter — baseline will fail and may invoke an unplanned live call.
2. **Do not** run an additional live call without separate owner approval.
3. Formal clean proof requires phase 2 strict smoke **PASS** in addition to substantive live evidence.
4. Production deploy remains **excluded**.
5. **Do not** treat a live-phase PID as proof the OpenRouter env landed — verify planning-config on the listening API first. If live start hits `EADDRINUSE`, the old local API is still answering.

**Deferred-scope status after G71c:** Live AI provider proof = **PARTIAL** — substantive local call captured once; formal clean proof pending (optional G71e).

**Recommended next gate:** G71e (optional) — formal clean live proof using §9.14 sequence; or G49 formal closure / other live proof gates per deferred-scope register. Production deploy is **not** included.

### 9.15 G71e / G71e-retry / G71f — formal clean local live proof complete (2026-07-09)

**Status:** **COMPLETE (local only)** — formal clean proof across G71e Phase 1 + G71e-retry Phase 2 + restore. G71f docs closeout. **Does not** authorize production deploy or staging live proof.

| Item | Result |
|------|--------|
| Operator | Piotr Pakula |
| Target | Local only — `127.0.0.1:4000` |
| Corrected procedure | §9.14 three-phase sequence — **validated** |

**Phase 1 (G71e) — local deterministic baseline**

| Check | Result |
|-------|--------|
| API env | `AI_TEXT_GATEWAY=local`; no OpenRouter key in API process |
| Guarded smoke | **PASS** 12/12 |
| Gateway | `local` / `liveProviderCalled=false` |

**Phase 2 (G71e-retry) — one live OpenRouter proof**

| Check | Result |
|-------|--------|
| API env | `AI_TEXT_GATEWAY=openrouter`; key via secure prompt (not logged/persisted) |
| Planning config | `textGateway=openrouter`; `openRouterLiveExecutionEnabled=true`; `hasOpenRouterApiKey=true`; model `anthropic/claude-haiku-4.5` |
| Strict live smoke (`SMOKE_EXPECT_OPENROUTER_LIVE=true`) | **PASS** 12/12 — run once |
| Live calls this session | **Exactly one** |
| Run ID | `90941e76-260d-4f99-b299-3a5c6b7a8d65` |
| Provider | OpenRouter |
| Model | `anthropic/claude-haiku-4.5` |
| `liveProviderCalled` | `true` |
| `isDeterministic` | `false` |
| Budget policy | `AI_TEXT_BUDGET_POLICY_V1` |
| Tokens | ~56 input; max 180 output |
| Session cost | Estimated below **$1.00 USD**; `actualCostUsd` not exposed in API |
| Forbidden integrations | None triggered |
| Secrets exposed | No |

**Phase 3 (G71e-retry) — restore local deterministic gateway**

| Check | Result |
|-------|--------|
| API env restored | `AI_TEXT_GATEWAY=local`; OpenRouter key cleared from active process |
| Kill switch after restore | `textGatewayLive=false`; `orchestratorLiveSafe=true` |
| Guarded smoke | **PASS** 12/12 |
| Post-restore workflow | `liveProviderCalled=false`; `gateway=local` |

**G71e note (prior session):** Phase 2 blocked when `OPENROUTER_API_KEY` unavailable; Phase 1 and Phase 3 restore both PASS in that session.

**G71b context (historical):** Procedural STOP with unplanned live call during mis-ordered baseline — superseded by formal clean proof above.

Evidence logs:

- `$env:TEMP\g71e-formal-clean-openrouter-proof.log`
- `$env:TEMP\g71e-retry-phase2-openrouter-proof.log`

**Deferred-scope status after G71f:** Live AI provider proof = **COMPLETE (local only)**. Staging/production live proof remains **BLOCKED**.

**Recommended next gate (historical):** G71g — commit/push G71f docs closeout; then G72 model routing policy. Superseded by G72–G77b. Current next gates: **G78** docs commit/push; **G79** monthly cap aggregation (local proof); **G80** `actualCostUsd` when gateway exposes cost. Production deploy is **not** included.

### 9.16 G75 — live spend attribution cross-reference (2026-07-10)

**Status:** **PARTIAL (local only)** — live OpenRouter smoke PASS; completed attribution verifier PASS (G75c); at G75 time persistent COMPLETED row was generated-only (wiring closed in G76).

| Item | Result |
|------|--------|
| Live run ID | `6e538323-8e68-4d41-a4c5-9e30ca0cf8a1` |
| Provider / model | OpenRouter — `anthropic/claude-haiku-4.5` |
| `liveProviderCalled` | `true` |
| Completed attribution | Generated via G74 helper against live observability — verifier PASS |
| Persistent COMPLETED row at G75 | **Not auto-written** — G76 wiring added subsequently |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./AI_MODEL_ROUTING_POLICY.md) (G75 section) · [`STATUS.md`](../STATUS.md) (G75 closeout).

### 9.17 G76 — persistent completed ledger wiring cross-reference (2026-07-10)

**Status:** **WIRED (mocked/no-live proof at G76)** — execute path persists COMPLETED rows for OpenRouter success; live DB row later proven in **§9.18 G77b (local only)**.

| Item | Result |
|------|--------|
| Bridge | `ai-delivery-workflow-ledger-attribution.service.ts` |
| Hook | `executeAiDeliveryWorkflowRun()` success path |
| Persistence | `recordCompletedAiLedgerEntry()` via G74 helpers |
| Scope | OpenRouter success only; local deterministic skipped |
| `stepReference` | `ai-delivery-execute:{outputType}` |
| Idempotency | Upsert on `(tenantId, workflowRunId, stepReference)` |
| Live DB proof | **DONE in G77b (local only)** — see §9.18 |

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./AI_MODEL_ROUTING_POLICY.md) (G76 section) · [`STATUS.md`](../STATUS.md) (G76 closeout).

### 9.18 G77b — persistent COMPLETED ledger live proof (2026-07-10)

**Status:** **COMPLETE (local only)** — controlled live OpenRouter AI Delivery execute created a persistent COMPLETED `AiBudgetLedgerEntry` row. **Does not** authorize staging/production live proof or production deploy.

| Item | Result |
|------|--------|
| Operator | Piotr Pakula |
| Target | Local only — `127.0.0.1:4000` |
| Preflight commit | `9ba707f` — OpenRouter API env preflight |
| No-live API env preflight | **PASS** 18/18 |
| Phase 1 — baseline local guarded smoke | **PASS** 12/12 |
| Phase 2 — one live OpenRouter guarded smoke | **PASS** 12/12 |
| Formal live `workflowRunId` | `2244413e-d87b-45a1-8a26-6634ec8972d5` |
| Provider / model | OpenRouter — `anthropic/claude-haiku-4.5` |
| Phase 3 — restore local guarded smoke | **PASS** 12/12 |
| Ledger verifier | **PASS** |
| Ledger row `id` | `5d8d635c-ced0-4a14-9b33-839e1fdee508` |
| Ledger `createdAt` | `2026-07-10T00:48:46.882Z` |
| Ledger `status` | `COMPLETED` |
| Ledger `stepReference` | `ai-delivery-execute:summary` |
| Ledger `provider` | `openrouter` |
| Ledger `liveProviderCalled` | `true` |
| Ledger `taskType` | `report_narrative` |
| `completedAttribution` | Present — `model=anthropic/claude-haiku-4.5`, `gateway=openrouter`, `liveProviderCalled=true`, `runId` matches `workflowRunId` |
| `estimatedCostUsd` | `0.15` |
| `actualCostUsd` | `null` — expected current limitation; **not** provider invoice proof |
| Forbidden integrations | None triggered |
| Secrets exposed | No |
| Staging / VPS / production / deploy | Untouched |

**What this proves:** Local controlled live OpenRouter execute persists a COMPLETED ledger row with completedAttribution metadata (G76 wiring live-proven).

**What this does not prove:** Staging/production live; monthly cap aggregation for `liveProviderCalled=true` rows; exact provider invoice cost via `actualCostUsd`.

**Deferred-scope status after G77b:** Persistent COMPLETED live ledger row proof = **COMPLETE (local only)**. Staging/production live proof remains **BLOCKED**. Production remains frozen.

Detail: [`AI_MODEL_ROUTING_POLICY.md`](./AI_MODEL_ROUTING_POLICY.md) (G77b section) · [`STATUS.md`](../STATUS.md) (G77b closeout).

**Recommended next gates (post-G77b / post-G408 budget lane):**

- **G78:** guarded commit/push of G77b + G78 runbook truth-label alignment (docs only)
- **G79:** monthly cap aggregation for `liveProviderCalled=true` COMPLETED rows — local unit coverage present; live aggregation proof remains local-only from G77b row shape
- **G80 / G389–G408:** `actualCostUsd` null-until-trusted policy + reporting/reconciliation/routing truth hardened (no live OpenRouter in this lane)
- **G625–G636 (orchestrator local guards):** local-only safety, blocked routing, disabled-gateway truth labels, deterministic fallback, sanitization, knowledge inclusion (no raw body), metadata redaction — unit-tested; **no live OpenRouter**; see [`AI_ORCHESTRATOR_G625_G636_CLOSEOUT.md`](./AI_ORCHESTRATOR_G625_G636_CLOSEOUT.md)
- **Next cost-proof gate (proposed):** trusted provider-cost ingestion for `actualCostUsd` from owner-approved usage/billing source — **not** proven; no Finance Lite invoice mutation; no staging/production live without separate approval
- Staging/production live proof remains **BLOCKED**; no exact invoice/provider cost proof

### 9.18a G625–G636 — orchestrator / model-policy local guards (truth labels; no live)

**Status:** **LOCAL ONLY** — helpers + focused unit tests. Does **not** authorize, execute, or claim live OpenRouter, staging, or production AI proof.

| Label / invariant | Meaning | Live claim? |
|-------------------|---------|-------------|
| `disabled_gateway_no_live` | Gateway/execution disabled path | No |
| `local_deterministic_fallback` | Local deterministic / disabled-safe provider path | No |
| `preview_only_orchestrator` | Orchestrator plan/preview; execution deferred | No |
| `live_provider_called_false` | Plan/preview audit must keep `liveProviderCalled=false` | No |
| `actual_cost_null_until_trusted` | `actualCostUsd` null until trusted ingestion | No |

Code: `apps/api/src/core/ai-local-guard-orchestrator.ts`.
Closeout: [`AI_ORCHESTRATOR_G625_G636_CLOSEOUT.md`](./AI_ORCHESTRATOR_G625_G636_CLOSEOUT.md).

### 9.19 G81 — staging live proof planning only (no execution authorization)

**Status:** **PLANNING ONLY** — prepares the checklist for a future staging live OpenRouter proof. This section does **not** authorize SSH, staging commands, production commands, live OpenRouter calls, deploy, VPS access, env mutation, or any runtime execution.

**Staging assumption guard:**

- Treat staging as untrusted until a fresh bounded owner gate confirms exact target, commit SHA, staging API base URL, staging container/process identity, staging DB separation, and rollback owner.
- Do **not** infer staging readiness from local G71e/G77b proof. G77b proves only local controlled live execution and local persistent COMPLETED ledger row persistence.
- Do **not** overwrite or relabel G77b local evidence as staging evidence. Staging evidence must be captured in a separate future proof log.
- Production remains frozen. `system.digitalcubeagency.net`, production API, production DB, production env, Caddy/proxy, DNS, and deploy flow are out of scope for G81 and any future staging-only live proof unless separately approved.

**Required staging env checklist (names only):**

| Env name | Required for staging proof planning | Notes |
|----------|--------------------------------------|-------|
| `AI_TEXT_GATEWAY` | yes | Future staging live phase would require `openrouter`; restore must return to `local` or unset |
| `OPENROUTER_API_KEY` | yes | Owner-provided staging-safe key; never print, persist, or commit |
| `OPENROUTER_TEXT_PRIMARY_MODEL` | yes | Owner-approved model ID; record model name only |
| `OPENROUTER_TEXT_LONG_CONTEXT_MODEL` | optional | Not required for minimal one-call staging proof unless separately approved |
| `OPENROUTER_BASE_URL` | optional | Default provider URL unless owner approves an override |
| `AUTH_SEED_TEST_PASSWORD` | yes if authenticated smoke path is used | Shell/process only; never log value |
| Staging API base URL env used by the future smoke | yes | Name must be confirmed by the future implementation; value must target staging only |

**Safe key handling:**

- Use owner-provided staging-safe OpenRouter credentials only for the approved window.
- Secret values must be injected into the target API process environment by the operator, not written into repo files, docs, shell transcripts, committed artifacts, or chat.
- Evidence may record boolean presence (`hasOpenRouterApiKey=true`) and approved model name only; never record `OPENROUTER_API_KEY` value or token prefixes such as `sk-or-`.
- If any secret appears in response, console output, log, screenshot, or diff, stop immediately and treat the proof as failed until the artifact is removed/redacted and key rotation is considered by the owner.

**Process/env injection checks (G77b lesson):**

- `GET /ai-provider/planning-config` and workflow execute read provider env from the **API process** via `process.env`; setting env in a separate smoke shell is not proof the staging API process received it.
- Future staging proof must identify the active staging API process/container first, then verify that the listening API reports `textGateway=openrouter`, `hasOpenRouterApiKey=true`, and `openRouterLiveExecutionEnabled=true` before any live execute.
- A successful process/container start is not enough. If the intended staging process fails to bind or an old process keeps serving traffic, the planning-config check must fail the gate before any live call.
- No-live checks must happen before the live phase so env injection mistakes do not repeat the G71b/G77b class of procedural risk.

**No-live preflight before live:**

- Before any future staging live proof, add or run an approved staging equivalent of `smoke:openrouter-api-env-preflight:local` that uses dummy provider values, verifies the staging API planning-config shape, performs **no workflow execute**, and makes **no OpenRouter network call**.
- The staging preflight must prove: target guard points to staging, production target is refused, keys are never returned, dummy-key presence is represented only as a boolean, and restore returns planning-config to local/disabled.
- A failed no-live preflight is a STOP. Do not proceed to live proof by manual workaround.

**One-live-call gate:**

- Future staging live proof must require a fresh owner approval sentence naming staging, approved model, operator, spend ceiling, and exact smoke/proof command.
- Allow exactly one admin-triggered workflow execute against staging. No retries, batches, background jobs, client-visible execution, research crawls, image generation, WordPress publish, R2 real-bucket IO, or production probes.
- Before the one live call, confirm baseline staging planning-config is local/disabled, no-live preflight passed, live env landed in the API process, and the target URL cannot resolve to production.
- After the one live call, remove live expectation/env from the operator shell and begin restore immediately.

**Restore / rollback:**

1. Set the staging API gateway back to `AI_TEXT_GATEWAY=local` or unset.
2. Remove `OPENROUTER_API_KEY` from the active staging API process environment.
3. Restart only the approved staging API process/container if the future gate explicitly authorizes that runtime action.
4. Re-check planning-config and baseline guarded smoke in non-live mode.
5. Confirm `openRouterLiveExecutionEnabled=false`, `liveProviderCalled=false` on the restore proof, and production remains untouched.
6. Archive logs to `$env:TEMP`; do not commit runtime logs.

**Proof artifacts (`$env:TEMP` only):**

- Future staging evidence must be saved under a distinct path such as `$env:TEMP\g81-staging-openrouter-live-proof-<yyyyMMdd-HHmmss>.log`.
- Required contents: gate name, date, operator, staging target URL (no secrets), commit SHA, owner approval reference, env names present (boolean only), approved model name, no-live preflight result, one-live-call result, `workflowRunId`, `liveProviderCalled`, ledger/verifier outcome if in scope, restore result, stop status, and `Production touched: no`.
- Do not commit proof logs. Do not store proof artifacts outside `$env:TEMP` unless a future owner gate specifies an approved evidence location.

**Failure stop rules:**

Stop immediately if any of the following occur:

| # | STOP condition |
|---|----------------|
| 1 | Target guard cannot prove staging-only target or any request points at production |
| 2 | No-live staging preflight fails or would require a live OpenRouter network call |
| 3 | Planning-config does not reflect the intended API process env before live execute |
| 4 | Any secret value, token prefix, password, cookie, or credential appears in output or evidence |
| 5 | More than one live provider call would be needed to prove success |
| 6 | Provider timeout/failure does not fall back safely or creates client-visible output |
| 7 | Ledger/proof artifact would overwrite G77b local evidence or claim local proof as staging proof |
| 8 | Restore cannot prove `openRouterLiveExecutionEnabled=false` |
| 9 | Any SSH, VPS, deploy, production, Caddy, DNS, schema, migration, or container action is needed outside a future explicit owner gate |

**G81 decision:** This is a planning section only. It records how a future staging live proof should be guarded; it does **not** execute, authorize, or imply approval for staging live OpenRouter, production live OpenRouter, deploy, SSH, VPS, env mutation, or any live provider call.
