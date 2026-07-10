# AI Budget Reporting + Reconciliation Contract (G134-G137 + G389–G408)

**Status:** Implemented locally as an additive reporting contract (hardened for G389–G408).
**Runtime scope:** Pure contract/types/helpers and unit tests only.
**Finance Lite scope:** Boundary documented only; no invoice ingestion, invoice mutation, payment posting, or accounting claim.
**Live provider scope:** No live OpenRouter calls in this contract layer.

## G134 / G389 — AI Budget vs Finance Lite Separation

AI budget reporting and Finance Lite remain separate surfaces:

| Surface | Owns | Does not own |
|---------|------|--------------|
| AI budget reporting | Monthly AI cap visibility, AI provider/model attribution, live AI ledger rows, estimated/trusted-actual split | Client invoices, payment status, vendor bills, Finance Lite ledger mutations |
| Finance Lite | Admin finance records, client invoices, vendor bills, finance ledger summaries | Provider AI cost proof, model attribution, AI monthly cap enforcement |

The contract is exposed in `apps/api/src/core/ai-budget-reporting.contract.ts` and labels its boundary as `separate_admin_finance_records_no_invoice_ingestion`.

## G135 / G390–G392 — Reconciliation + Invoice Variance Design

The reconciliation shape intentionally has four slots:

| Slot | Current behavior |
|------|------------------|
| Estimate | Sum of AI budget ledger estimates for countable rows |
| Actual | Sum of trusted provider actuals only when `actualCostUsd` exists |
| Invoice | `null` / `not_integrated`; no real invoice source is wired |
| Variance | Estimate-vs-actual variance only; invoice-vs-actual remains `null` |

Trusted actual ingestion design (`ai-budget-trusted-actual-ingestion.design.ts`):

- `actualCostUsd` null policy: `leave_null_until_trusted_provider_cost`
- Accepted sources: provider usage API confirmed cost, matched provider invoice line item, owner-attested billing export
- Rejected sources: route caps, estimates, token×list-price guesses, marketing pricing pages, Finance Lite client invoices, manual guesses
- Real invoice overclaim is forbidden; Finance Lite posting is forbidden from this path

## G136 / G393–G397 — Reporting Contract

The reporting contract returns:

- `monthlyCapUsd`, `spentThisPeriodUsd`, `remainingBudgetUsd`, and `projectedOverBudget`.
- `actualCostNullPolicy` constant on every report.
- Countable rows only: `PREVIEW`, `PLANNED`, and `COMPLETED` (`BLOCKED` / `SKIPPED` excluded).
- Live row visibility via `liveProviderCalled` and `liveRowCount`.
- Per-row `estimatedCostUsd`, `actualCostUsd`, `spendBasis`, and `spentUsd`.
- Provider/model breakdown for operator reporting.

Spend follows the G79 rule without modifying G79 code: `actualCostUsd ?? estimatedCostUsd`.

## G398 — Budget threshold / cap notification mapping

`ai-budget-notification-mapping.ts` maps budget signals onto **existing** Lane 2 business events:

| Signal | Business event | Notification event |
|--------|----------------|--------------------|
| threshold_warning | `BUDGET_THRESHOLD_WARNING` | `budget_threshold_warning` |
| cap_blocked | `BUDGET_CAP_BLOCKED` | `budget_cap_blocked` |
| cap_reached / kill_switch | `BUDGET_CAP_REACHED` | `budget_cap_reached` |

No new notification-events keys are proposed. Send default remains no-send until an owner gate.

## G137 / G399–G408 — Closeout

Validation target:

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-reporting.contract.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-trusted-actual-ingestion.design.test.ts
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-notification-mapping.test.ts
```

No backend route, Prisma schema, Finance Lite API, auth, provider runtime, VPS, deploy, or production behavior is changed by this contract.
