import type { AiBudgetLedgerSpendRow } from "./ai-budget-ledger.service";

export const AI_BUDGET_REPORTING_CONTRACT_VERSION = "AI_BUDGET_REPORTING_CONTRACT_V1";

export type AiBudgetReportingLedgerStatus =
  | "PREVIEW"
  | "PLANNED"
  | "COMPLETED"
  | "BLOCKED"
  | "SKIPPED";

export type AiBudgetSpendBasis = "estimated" | "actual";

export interface AiBudgetReportingLedgerRow extends AiBudgetLedgerSpendRow {
  id?: string | null;
  periodKey: string;
  provider: string;
  model?: string | null;
  taskType?: string | null;
  status: AiBudgetReportingLedgerStatus;
  liveProviderCalled: boolean;
}

export interface AiBudgetReportRow {
  id: string | null;
  periodKey: string;
  provider: string;
  model: string | null;
  taskType: string | null;
  status: Extract<AiBudgetReportingLedgerStatus, "PREVIEW" | "PLANNED" | "COMPLETED">;
  liveProviderCalled: boolean;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  spendBasis: AiBudgetSpendBasis;
  spentUsd: number;
}

export interface AiBudgetProviderModelBreakdown {
  provider: string;
  model: string | null;
  rowCount: number;
  liveRowCount: number;
  estimatedCostUsd: number;
  actualCostUsd: number;
  estimatedFallbackCostUsd: number;
  spentUsd: number;
}

export interface AiBudgetReportingContract {
  version: typeof AI_BUDGET_REPORTING_CONTRACT_VERSION;
  source: "ai_budget_ledger";
  financeLiteBoundary: "separate_admin_finance_records_no_invoice_ingestion";
  periodKey: string;
  monthlyCapUsd: number;
  spentThisPeriodUsd: number;
  remainingBudgetUsd: number;
  projectedOverBudget: boolean;
  countableRowCount: number;
  liveRowCount: number;
  totals: {
    estimatedCostUsd: number;
    actualCostUsd: number;
    estimatedFallbackCostUsd: number;
  };
  rows: AiBudgetReportRow[];
  providerModelBreakdown: AiBudgetProviderModelBreakdown[];
}

export interface AiBudgetReconciliationDesign {
  version: typeof AI_BUDGET_REPORTING_CONTRACT_VERSION;
  periodKey: string;
  estimateTotalUsd: number;
  trustedActualTotalUsd: number;
  invoiceTotalUsd: null;
  varianceEstimateVsActualUsd: number;
  varianceInvoiceVsActualUsd: null;
  invoiceStatus: "not_integrated";
  financeLitePostingStatus: "not_posted";
  notes: string[];
}

export interface AiBudgetFinanceLiteSeparationContract {
  version: typeof AI_BUDGET_REPORTING_CONTRACT_VERSION;
  aiBudgetOwns: readonly string[];
  financeLiteOwns: readonly string[];
  prohibitedCrossovers: readonly string[];
}

const COUNTABLE_STATUSES = new Set<AiBudgetReportingLedgerStatus>([
  "PREVIEW",
  "PLANNED",
  "COMPLETED"
]);

function moneyToNumber(value: AiBudgetLedgerSpendRow["estimatedCostUsd"]): number {
  return Number(value.toString());
}

function roundUsd(value: number): number {
  return Number(value.toFixed(4));
}

function buildBreakdownKey(row: Pick<AiBudgetReportRow, "provider" | "model">): string {
  return `${row.provider}\u0000${row.model ?? ""}`;
}

export function getAiBudgetFinanceLiteSeparationContract(): AiBudgetFinanceLiteSeparationContract {
  return {
    version: AI_BUDGET_REPORTING_CONTRACT_VERSION,
    aiBudgetOwns: [
      "monthly AI cap enforcement",
      "AI provider/model attribution",
      "estimated versus trusted actual AI cost reporting",
      "live provider ledger row visibility"
    ],
    financeLiteOwns: [
      "admin finance records",
      "client invoices and invoice status",
      "vendor bills and payment records",
      "finance ledger summaries"
    ],
    prohibitedCrossovers: [
      "AI budget reporting must not create or mutate Finance Lite invoices.",
      "Finance Lite invoice state must not be treated as provider-cost proof.",
      "Estimated AI cost must not be presented as a real invoice amount."
    ]
  };
}

export function buildAiBudgetReportingContract(input: {
  periodKey: string;
  monthlyCapUsd: number;
  rows: readonly AiBudgetReportingLedgerRow[];
}): AiBudgetReportingContract {
  const rows = input.rows
    .filter((row) => row.periodKey === input.periodKey && COUNTABLE_STATUSES.has(row.status))
    .map((row): AiBudgetReportRow => {
      const estimatedCostUsd = moneyToNumber(row.estimatedCostUsd);
      const actualCostUsd = row.actualCostUsd == null ? null : moneyToNumber(row.actualCostUsd);
      const spendBasis: AiBudgetSpendBasis = actualCostUsd == null ? "estimated" : "actual";
      return {
        id: row.id ?? null,
        periodKey: row.periodKey,
        provider: row.provider,
        model: row.model ?? null,
        taskType: row.taskType ?? null,
        status: row.status as AiBudgetReportRow["status"],
        liveProviderCalled: row.liveProviderCalled,
        estimatedCostUsd: roundUsd(estimatedCostUsd),
        actualCostUsd: actualCostUsd == null ? null : roundUsd(actualCostUsd),
        spendBasis,
        spentUsd: roundUsd(actualCostUsd ?? estimatedCostUsd)
      };
    });

  const totals = rows.reduce(
    (result, row) => {
      result.estimatedCostUsd += row.estimatedCostUsd;
      if (row.actualCostUsd == null) {
        result.estimatedFallbackCostUsd += row.estimatedCostUsd;
      } else {
        result.actualCostUsd += row.actualCostUsd;
      }
      return result;
    },
    {
      estimatedCostUsd: 0,
      actualCostUsd: 0,
      estimatedFallbackCostUsd: 0
    }
  );

  const providerModelBreakdown = Array.from(
    rows
      .reduce((result, row) => {
        const key = buildBreakdownKey(row);
        const existing =
          result.get(key) ??
          {
            provider: row.provider,
            model: row.model,
            rowCount: 0,
            liveRowCount: 0,
            estimatedCostUsd: 0,
            actualCostUsd: 0,
            estimatedFallbackCostUsd: 0,
            spentUsd: 0
          };
        existing.rowCount += 1;
        existing.liveRowCount += row.liveProviderCalled ? 1 : 0;
        existing.estimatedCostUsd += row.estimatedCostUsd;
        existing.actualCostUsd += row.actualCostUsd ?? 0;
        existing.estimatedFallbackCostUsd += row.actualCostUsd == null ? row.estimatedCostUsd : 0;
        existing.spentUsd += row.spentUsd;
        result.set(key, existing);
        return result;
      }, new Map<string, AiBudgetProviderModelBreakdown>())
      .values()
  ).map((row) => ({
    ...row,
    estimatedCostUsd: roundUsd(row.estimatedCostUsd),
    actualCostUsd: roundUsd(row.actualCostUsd),
    estimatedFallbackCostUsd: roundUsd(row.estimatedFallbackCostUsd),
    spentUsd: roundUsd(row.spentUsd)
  }));

  const spentThisPeriodUsd = roundUsd(totals.actualCostUsd + totals.estimatedFallbackCostUsd);

  return {
    version: AI_BUDGET_REPORTING_CONTRACT_VERSION,
    source: "ai_budget_ledger",
    financeLiteBoundary: "separate_admin_finance_records_no_invoice_ingestion",
    periodKey: input.periodKey,
    monthlyCapUsd: input.monthlyCapUsd,
    spentThisPeriodUsd,
    remainingBudgetUsd: roundUsd(Math.max(0, input.monthlyCapUsd - spentThisPeriodUsd)),
    projectedOverBudget: spentThisPeriodUsd > input.monthlyCapUsd,
    countableRowCount: rows.length,
    liveRowCount: rows.filter((row) => row.liveProviderCalled).length,
    totals: {
      estimatedCostUsd: roundUsd(totals.estimatedCostUsd),
      actualCostUsd: roundUsd(totals.actualCostUsd),
      estimatedFallbackCostUsd: roundUsd(totals.estimatedFallbackCostUsd)
    },
    rows,
    providerModelBreakdown
  };
}

export function buildAiBudgetReconciliationDesign(
  report: AiBudgetReportingContract
): AiBudgetReconciliationDesign {
  return {
    version: AI_BUDGET_REPORTING_CONTRACT_VERSION,
    periodKey: report.periodKey,
    estimateTotalUsd: report.totals.estimatedCostUsd,
    trustedActualTotalUsd: report.totals.actualCostUsd,
    invoiceTotalUsd: null,
    varianceEstimateVsActualUsd: roundUsd(
      report.totals.actualCostUsd - report.totals.estimatedCostUsd
    ),
    varianceInvoiceVsActualUsd: null,
    invoiceStatus: "not_integrated",
    financeLitePostingStatus: "not_posted",
    notes: [
      "Estimated AI cost is budget-control data, not an invoice.",
      "Trusted actual AI cost is reported only when provider cost is exposed.",
      "Finance Lite invoice reconciliation is intentionally not integrated in this contract."
    ]
  };
}
