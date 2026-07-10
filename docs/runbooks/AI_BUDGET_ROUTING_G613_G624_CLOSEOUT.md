# AI Budget / Routing — G613–G624 Closeout

**Status:** Local foundations deepened (implementation + focused unit tests).  
**Lane:** 13 (AI budget / cost / routing)  
**Baseline:** `main` @ `66dcb74`  
**Live provider:** **not** invoked.  
**Invoice / cost overclaim:** **not** claimed.  
**Commit / push / deploy:** **not** authorized by this closeout.

## Gate results

| Gate | Result | Evidence |
|------|--------|----------|
| **G613** — `actualCostUsd` trusted-source invariant tests | **READY (local)** | `assertActualCostUsdTrustedSourceInvariant` + tests in `ai-budget-trusted-actual-ingestion.design.test.ts`; guard snapshot keeps `actualCostUsd` null unless supplied |
| **G614** — estimated vs actual cost reporting tests | **READY (local)** | `ai-budget-reporting.contract.test.ts` G614 case — `spendBasis`, totals split |
| **G615** — monthly cap report shape tests | **READY (local)** | Cap / spend / remaining / `projectedOverBudget` shape assertions |
| **G616** — provider/model breakdown tests | **READY (local)** | OpenRouter + local_deterministic breakdown aggregation |
| **G617** — live rows included in reporting tests | **READY (local)** | `liveRowCount` + live COMPLETED ids included; other-period excluded |
| **G618** — Finance Lite separation docs/tests | **READY (local)** | `finance-lite-ai-budget-separation.ts` + tests; reporting separation contract unchanged |
| **G619** — reconciliation variance design tests | **READY (local)** | `buildAiBudgetReconciliationVarianceDesign` — estimate-vs-actual only; invoice slots null |
| **G620** — budget threshold notification mapping | **READY (local)** | Maps to existing `BUDGET_THRESHOLD_WARNING` / `budget_threshold_warning`; no-send default |
| **G621** — budget cap blocked notification mapping | **READY (local)** | Maps to existing `BUDGET_CAP_BLOCKED` / `budget_cap_blocked`; no new Lane 2 keys |
| **G622** — routing truth labels tests | **READY (local)** | `live_completed` null actual + trusted actual label toggles |
| **G623** — budget/routing docs closeout | **READY (docs)** | This file + updates to reporting/reconciliation + routing policy docs |
| **G624** — Lane validation | **READY (focused)** | Focused `test:unit` on owned files only — **no** full `validate` |

## Files touched (Lane 13 ownership)

### Implementation / helpers

- `apps/api/src/core/ai-budget-trusted-actual-ingestion.design.ts` — G613 invariant + G619 variance helper
- `apps/api/src/core/finance-lite-ai-budget-separation.ts` — **new** G618 separation helper
- Existing contracts unchanged in behavior: reporting, notification mapping, routing truth labels, guard, ledger

### Tests

- `apps/api/src/core/ai-budget-trusted-actual-ingestion.design.test.ts`
- `apps/api/src/core/ai-budget-reporting.contract.test.ts`
- `apps/api/src/core/ai-budget-notification-mapping.test.ts`
- `apps/api/src/core/ai-model-routing-truth-labels.test.ts`
- `apps/api/src/core/ai-budget-guard.service.test.ts`
- `apps/api/src/core/finance-lite-ai-budget-separation.test.ts` — **new**

### Docs

- `docs/runbooks/AI_BUDGET_ROUTING_G613_G624_CLOSEOUT.md` (this file)
- `docs/runbooks/AI_BUDGET_REPORTING_RECONCILIATION_CONTRACT.md` (G613–G624 pointer)
- `docs/runbooks/AI_MODEL_ROUTING_POLICY.md` (G613–G624 pointer)

**Not edited:** `ai-orchestrator-lite*` (Lane 14), main-owned STATUS/deferred/matrix/Puriva docs, `.cursor/settings.json`, Prisma, routes, Finance Lite runtime services.

## Hard truths preserved

1. **`actualCostUsd` is trusted-source only.** Estimates, route caps, pricing pages, Finance Lite client invoices, and manual guesses must not populate it.
2. **Live COMPLETED rows with `actualCostUsd=null` are expected** until a separately approved trusted ingestion path exists.
3. **AI budget ≠ Finance Lite.** No report creates, mutates, or reconciles a Finance Lite invoice. Estimated AI spend is not an invoice amount.
4. **Notification mapping** uses existing Lane 2 keys only; send default remains no-send until an owner gate.
5. **No live OpenRouter / provider call** in this lane. No invoice ingestion. No cost overclaim.

## Focused validation (G624)

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-trusted-actual-ingestion.design.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-reporting.contract.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-notification-mapping.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-model-routing-truth-labels.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-guard.service.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/finance-lite-ai-budget-separation.test.ts
```

**Note:** `test:unit` always expands `src/**/*.test.ts`; the suite completed **770 pass / 0 fail** (exit 0). Lane 13 G613–G622 cases all green within that run. Full `npm.cmd run validate` was **not** run (lane instruction).

## Deferred proposals (for main / owner)

| Item | Why deferred |
|------|----------------|
| Trusted `actualCostUsd` ingestion implementation | Design + invariant only; needs G482/G483-style owner approval + trusted provider cost source |
| Real provider invoice line-item matching | Invoice slots remain `not_integrated` |
| Finance Lite invoice reconciliation / posting from AI budget | Explicitly prohibited crossover |
| Staging/production AI live re-proof | Separate high-risk execution gate; local G77b only |
| Live email send for `BUDGET_*` events | Mapping is no-send until owner gate |
| Lane 2 notification-events key changes | Not required; existing keys sufficient |

## GATE

**GATE: KEEP | agent: yes | budget: medium | mistakes: 0**

Backend routes / Prisma / auth / VPS / deploy / live provider / Finance Lite mutation: **not touched**.
