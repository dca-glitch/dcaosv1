/**
 * Finance Lite ↔ AI budget separation helpers (G613–G624 / G618).
 * Pure contract: no Finance Lite mutation, no invoice ingestion, no live provider.
 */

import {
  AI_BUDGET_REPORTING_CONTRACT_VERSION,
  getAiBudgetFinanceLiteSeparationContract,
  type AiBudgetFinanceLiteSeparationContract
} from "./ai-budget-reporting.contract";

export const FINANCE_LITE_AI_BUDGET_SEPARATION_VERSION =
  "FINANCE_LITE_AI_BUDGET_SEPARATION_V1";

export type FinanceLiteAiBudgetSurface =
  | "ai_budget_reporting"
  | "finance_lite_admin_records";

export interface FinanceLiteAiBudgetSeparationCheck {
  version: typeof FINANCE_LITE_AI_BUDGET_SEPARATION_VERSION;
  reportingContractVersion: typeof AI_BUDGET_REPORTING_CONTRACT_VERSION;
  surface: FinanceLiteAiBudgetSurface;
  mayMutateFinanceLiteInvoices: false;
  mayTreatEstimateAsInvoiceAmount: false;
  mayTreatFinanceLiteInvoiceAsProviderCostProof: false;
  invoiceReconciliationStatus: "not_integrated";
  separation: AiBudgetFinanceLiteSeparationContract;
  notes: readonly string[];
}

/**
 * Returns the hard separation contract for operator/docs/tests.
 * AI budget never posts to Finance Lite; Finance Lite never proves provider cost.
 */
export function getFinanceLiteAiBudgetSeparationCheck(
  surface: FinanceLiteAiBudgetSurface = "ai_budget_reporting"
): FinanceLiteAiBudgetSeparationCheck {
  return {
    version: FINANCE_LITE_AI_BUDGET_SEPARATION_VERSION,
    reportingContractVersion: AI_BUDGET_REPORTING_CONTRACT_VERSION,
    surface,
    mayMutateFinanceLiteInvoices: false,
    mayTreatEstimateAsInvoiceAmount: false,
    mayTreatFinanceLiteInvoiceAsProviderCostProof: false,
    invoiceReconciliationStatus: "not_integrated",
    separation: getAiBudgetFinanceLiteSeparationContract(),
    notes: [
      "AI budget reporting is a cost-control surface, not an invoicing surface.",
      "Finance Lite client invoices must not be used as trusted AI provider-cost proof.",
      "Estimated AI spend must never be labeled as a billed invoice amount."
    ]
  };
}

/**
 * True only when a proposed crossover is explicitly prohibited by the separation contract.
 */
export function isFinanceLiteAiBudgetCrossoverProhibited(action: string): boolean {
  const separation = getAiBudgetFinanceLiteSeparationContract();
  const normalized = action.trim().toLowerCase();
  return separation.prohibitedCrossovers.some((rule) => {
    const ruleLower = rule.toLowerCase();
    if (normalized.includes("invoice") && ruleLower.includes("invoice")) {
      return true;
    }
    if (normalized.includes("estimate") && ruleLower.includes("estimated")) {
      return true;
    }
    if (
      normalized.includes("provider-cost") &&
      ruleLower.includes("provider-cost")
    ) {
      return true;
    }
    return ruleLower.includes(normalized);
  });
}
