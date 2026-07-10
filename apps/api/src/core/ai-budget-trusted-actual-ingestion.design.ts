/**
 * Trusted actual AI cost ingestion design (G389–G408 + G613–G619).
 * Design-only: no live provider calls, no invoice ingestion, no Finance Lite posting.
 */

import { AI_BUDGET_REPORTING_CONTRACT_VERSION } from "./ai-budget-reporting.contract";

export const AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION =
  "AI_BUDGET_TRUSTED_ACTUAL_INGESTION_V1";

export type AiBudgetActualCostNullPolicy =
  | "leave_null_until_trusted_provider_cost"
  | "never_fabricate_from_estimate_or_pricing_page";

export type AiBudgetTrustedActualSourceKind =
  | "provider_usage_api_confirmed_cost"
  | "provider_invoice_line_item_matched"
  | "owner_attested_billing_export";

export type AiBudgetRejectedActualSourceKind =
  | "route_max_cost_cap"
  | "estimated_cost_usd"
  | "token_estimate_times_list_price"
  | "provider_marketing_pricing_page"
  | "finance_lite_client_invoice"
  | "manual_guess";

export interface AiBudgetTrustedActualIngestionDesign {
  version: typeof AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION;
  reportingContractVersion: typeof AI_BUDGET_REPORTING_CONTRACT_VERSION;
  policy: "trusted_source_only";
  nullPolicy: AiBudgetActualCostNullPolicy;
  acceptedSources: readonly AiBudgetTrustedActualSourceKind[];
  rejectedSources: readonly AiBudgetRejectedActualSourceKind[];
  invoiceOverclaimForbidden: true;
  financeLitePostingForbidden: true;
  liveProviderCallRequiredForIngestion: false;
  notes: readonly string[];
}

export interface AiBudgetInvoiceVarianceDesign {
  version: typeof AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION;
  estimateVsTrustedActual: "computed_when_trusted_actual_exists";
  invoiceVsTrustedActual: "deferred_until_trusted_invoice_source";
  invoiceTotalUsd: null;
  varianceInvoiceVsActualUsd: null;
  invoiceStatus: "not_integrated";
  realInvoiceOverclaimForbidden: true;
  notes: readonly string[];
}

export function getAiBudgetTrustedActualIngestionDesign(): AiBudgetTrustedActualIngestionDesign {
  return {
    version: AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION,
    reportingContractVersion: AI_BUDGET_REPORTING_CONTRACT_VERSION,
    policy: "trusted_source_only",
    nullPolicy: "leave_null_until_trusted_provider_cost",
    acceptedSources: [
      "provider_usage_api_confirmed_cost",
      "provider_invoice_line_item_matched",
      "owner_attested_billing_export"
    ],
    rejectedSources: [
      "route_max_cost_cap",
      "estimated_cost_usd",
      "token_estimate_times_list_price",
      "provider_marketing_pricing_page",
      "finance_lite_client_invoice",
      "manual_guess"
    ],
    invoiceOverclaimForbidden: true,
    financeLitePostingForbidden: true,
    liveProviderCallRequiredForIngestion: false,
    notes: [
      "actualCostUsd remains null until a trusted provider cost source is integrated.",
      "Do not fabricate actualCostUsd from estimates, route caps, or pricing pages.",
      "A live OpenRouter COMPLETED row with actualCostUsd=null is expected and is not invoice proof.",
      "This design does not authorize live provider calls or invoice ingestion."
    ]
  };
}

export function getAiBudgetInvoiceVarianceDesign(): AiBudgetInvoiceVarianceDesign {
  return {
    version: AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION,
    estimateVsTrustedActual: "computed_when_trusted_actual_exists",
    invoiceVsTrustedActual: "deferred_until_trusted_invoice_source",
    invoiceTotalUsd: null,
    varianceInvoiceVsActualUsd: null,
    invoiceStatus: "not_integrated",
    realInvoiceOverclaimForbidden: true,
    notes: [
      "Estimate-vs-actual variance is reporting-only and must not be labeled as an invoice variance.",
      "Invoice-vs-actual remains null until a separately approved trusted invoice source exists.",
      "Finance Lite client invoices must never be treated as provider-cost proof."
    ]
  };
}

/**
 * Returns true only when a numeric actual is present from an explicit trusted handoff.
 * Estimates and missing values stay null — never coerce to 0 as "actual".
 */
export function resolveTrustedActualCostUsd(input: {
  trustedActualCostUsd?: number | null;
  estimatedCostUsd?: number | null;
  sourceKind?: AiBudgetTrustedActualSourceKind | AiBudgetRejectedActualSourceKind | null;
}): number | null {
  const design = getAiBudgetTrustedActualIngestionDesign();
  if (input.sourceKind && (design.rejectedSources as readonly string[]).includes(input.sourceKind)) {
    return null;
  }
  if (input.trustedActualCostUsd == null) {
    return null;
  }
  const value = Number(input.trustedActualCostUsd);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  if (input.sourceKind && !(design.acceptedSources as readonly string[]).includes(input.sourceKind)) {
    return null;
  }
  return value;
}

/**
 * G613 invariant: never promote an estimate (or rejected source) into actualCostUsd.
 * Returns the trusted actual when present; otherwise null — never the estimate.
 */
export function assertActualCostUsdTrustedSourceInvariant(input: {
  actualCostUsd: number | null | undefined;
  estimatedCostUsd?: number | null;
  sourceKind?: AiBudgetTrustedActualSourceKind | AiBudgetRejectedActualSourceKind | null;
}): {
  ok: boolean;
  actualCostUsd: number | null;
  reason: string;
} {
  const resolved = resolveTrustedActualCostUsd({
    trustedActualCostUsd: input.actualCostUsd,
    estimatedCostUsd: input.estimatedCostUsd,
    sourceKind: input.sourceKind
  });

  if (input.actualCostUsd == null) {
    return {
      ok: true,
      actualCostUsd: null,
      reason: "actualCostUsd remains null until a trusted provider cost source is integrated."
    };
  }

  if (resolved == null) {
    return {
      ok: false,
      actualCostUsd: null,
      reason:
        "Rejected or untrusted source must not populate actualCostUsd; leave null (do not fall back to estimate)."
    };
  }

  if (
    input.estimatedCostUsd != null &&
    Number(input.estimatedCostUsd) === resolved &&
    input.sourceKind &&
    (getAiBudgetTrustedActualIngestionDesign().rejectedSources as readonly string[]).includes(
      input.sourceKind
    )
  ) {
    return {
      ok: false,
      actualCostUsd: null,
      reason: "Estimate-equal values from rejected sources are not trusted actuals."
    };
  }

  return {
    ok: true,
    actualCostUsd: resolved,
    reason: "Trusted actual accepted from an approved source kind."
  };
}

/**
 * G619: estimate-vs-actual variance only; invoice variance stays deferred/null.
 */
export function buildAiBudgetReconciliationVarianceDesign(input: {
  estimateTotalUsd: number;
  trustedActualTotalUsd: number;
}): {
  varianceEstimateVsActualUsd: number;
  varianceInvoiceVsActualUsd: null;
  invoiceTotalUsd: null;
  invoiceStatus: "not_integrated";
  realInvoiceOverclaimForbidden: true;
  estimateIsNotInvoice: true;
} {
  const invoice = getAiBudgetInvoiceVarianceDesign();
  return {
    varianceEstimateVsActualUsd: Number(
      (input.trustedActualTotalUsd - input.estimateTotalUsd).toFixed(4)
    ),
    varianceInvoiceVsActualUsd: invoice.varianceInvoiceVsActualUsd,
    invoiceTotalUsd: invoice.invoiceTotalUsd,
    invoiceStatus: invoice.invoiceStatus,
    realInvoiceOverclaimForbidden: invoice.realInvoiceOverclaimForbidden,
    estimateIsNotInvoice: true
  };
}
