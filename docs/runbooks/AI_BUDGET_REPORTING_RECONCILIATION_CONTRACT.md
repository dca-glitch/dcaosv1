# AI Budget Reporting + Reconciliation Contract (G134-G137)

**Status:** Implemented locally as an additive reporting contract.
**Runtime scope:** Pure contract/types/helpers and unit tests only.
**Finance Lite scope:** Boundary documented only; no invoice ingestion, invoice mutation, payment posting, or accounting claim.

## G134 — AI Budget vs Finance Lite Separation

AI budget reporting and Finance Lite remain separate surfaces:

| Surface | Owns | Does not own |
|---------|------|--------------|
| AI budget reporting | Monthly AI cap visibility, AI provider/model attribution, live AI ledger rows, estimated/trusted-actual split | Client invoices, payment status, vendor bills, Finance Lite ledger mutations |
| Finance Lite | Admin finance records, client invoices, vendor bills, finance ledger summaries | Provider AI cost proof, model attribution, AI monthly cap enforcement |

The contract is exposed in `apps/api/src/core/ai-budget-reporting.contract.ts` and labels its boundary as `separate_admin_finance_records_no_invoice_ingestion`.

## G135 — Reconciliation Design

The reconciliation shape intentionally has four slots:

| Slot | Current behavior |
|------|------------------|
| Estimate | Sum of AI budget ledger estimates for countable rows |
| Actual | Sum of trusted provider actuals only when `actualCostUsd` exists |
| Invoice | `null` / `not_integrated`; no real invoice source is wired |
| Variance | Estimate-vs-actual variance only; invoice-vs-actual remains `null` |

This keeps future reconciliation design visible without pretending Finance Lite invoices or provider invoices exist in the AI cost path.

## G136 — Reporting Contract

The reporting contract returns:

- `monthlyCapUsd`, `spentThisPeriodUsd`, `remainingBudgetUsd`, and `projectedOverBudget`.
- Countable rows only: `PREVIEW`, `PLANNED`, and `COMPLETED`.
- Live row visibility via `liveProviderCalled`.
- Per-row `estimatedCostUsd`, `actualCostUsd`, `spendBasis`, and `spentUsd`.
- Provider/model breakdown for operator reporting.

Spend follows the G79 rule without modifying G79 code: `actualCostUsd ?? estimatedCostUsd`.

## G137 — Closeout

Validation target:

```powershell
cd C:\dcaosv1
npm.cmd run -w @dca-os-v1/api test:unit -- src/core/ai-budget-reporting.contract.test.ts
```

No backend route, Prisma schema, Finance Lite API, auth, provider runtime, VPS, deploy, or production behavior is changed by this contract.
