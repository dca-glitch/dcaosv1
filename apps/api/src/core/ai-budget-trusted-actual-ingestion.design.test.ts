import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_BUDGET_REPORTING_CONTRACT_VERSION } from "./ai-budget-reporting.contract";
import {
  AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION,
  assertActualCostUsdTrustedSourceInvariant,
  buildAiBudgetReconciliationVarianceDesign,
  getAiBudgetInvoiceVarianceDesign,
  getAiBudgetTrustedActualIngestionDesign,
  resolveTrustedActualCostUsd
} from "./ai-budget-trusted-actual-ingestion.design";

describe("ai-budget-trusted-actual-ingestion.design", () => {
  it("G613: actualCostUsd trusted-source invariant rejects estimates and caps", () => {
    assert.equal(
      assertActualCostUsdTrustedSourceInvariant({
        actualCostUsd: null,
        estimatedCostUsd: 0.15
      }).actualCostUsd,
      null
    );
    assert.equal(
      assertActualCostUsdTrustedSourceInvariant({
        actualCostUsd: 0.15,
        estimatedCostUsd: 0.15,
        sourceKind: "estimated_cost_usd"
      }).ok,
      false
    );
    assert.equal(
      assertActualCostUsdTrustedSourceInvariant({
        actualCostUsd: 0.3,
        sourceKind: "route_max_cost_cap"
      }).ok,
      false
    );
    assert.equal(
      assertActualCostUsdTrustedSourceInvariant({
        actualCostUsd: 0.08,
        sourceKind: "provider_usage_api_confirmed_cost"
      }).ok,
      true
    );
    assert.equal(
      assertActualCostUsdTrustedSourceInvariant({
        actualCostUsd: 0.08,
        sourceKind: "finance_lite_client_invoice"
      }).ok,
      false
    );
  });

  it("G619: reconciliation variance keeps invoice slots null", () => {
    const variance = buildAiBudgetReconciliationVarianceDesign({
      estimateTotalUsd: 0.6,
      trustedActualTotalUsd: 0.08
    });
    assert.equal(variance.varianceEstimateVsActualUsd, -0.52);
    assert.equal(variance.varianceInvoiceVsActualUsd, null);
    assert.equal(variance.invoiceTotalUsd, null);
    assert.equal(variance.invoiceStatus, "not_integrated");
    assert.equal(variance.realInvoiceOverclaimForbidden, true);
    assert.equal(variance.estimateIsNotInvoice, true);
  });

  it("documents trusted-source-only actualCostUsd null policy", () => {
    const design = getAiBudgetTrustedActualIngestionDesign();

    assert.equal(design.version, AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION);
    assert.equal(design.reportingContractVersion, AI_BUDGET_REPORTING_CONTRACT_VERSION);
    assert.equal(design.policy, "trusted_source_only");
    assert.equal(design.nullPolicy, "leave_null_until_trusted_provider_cost");
    assert.equal(design.invoiceOverclaimForbidden, true);
    assert.equal(design.financeLitePostingForbidden, true);
    assert.equal(design.liveProviderCallRequiredForIngestion, false);
    assert.ok(design.acceptedSources.includes("provider_usage_api_confirmed_cost"));
    assert.ok(design.rejectedSources.includes("estimated_cost_usd"));
    assert.ok(design.rejectedSources.includes("finance_lite_client_invoice"));
    assert.match(design.notes.join(" "), /actualCostUsd remains null/i);
  });

  it("keeps invoice variance deferred with no real invoice overclaim", () => {
    const variance = getAiBudgetInvoiceVarianceDesign();

    assert.equal(variance.invoiceTotalUsd, null);
    assert.equal(variance.varianceInvoiceVsActualUsd, null);
    assert.equal(variance.invoiceStatus, "not_integrated");
    assert.equal(variance.realInvoiceOverclaimForbidden, true);
    assert.equal(variance.invoiceVsTrustedActual, "deferred_until_trusted_invoice_source");
  });

  it("resolves trusted actual only from accepted sources", () => {
    assert.equal(
      resolveTrustedActualCostUsd({
        trustedActualCostUsd: 0.08,
        sourceKind: "provider_usage_api_confirmed_cost"
      }),
      0.08
    );
    assert.equal(
      resolveTrustedActualCostUsd({
        trustedActualCostUsd: 0.08,
        estimatedCostUsd: 0.15,
        sourceKind: "estimated_cost_usd"
      }),
      null
    );
    assert.equal(
      resolveTrustedActualCostUsd({
        trustedActualCostUsd: null,
        estimatedCostUsd: 0.15
      }),
      null
    );
    assert.equal(
      resolveTrustedActualCostUsd({
        trustedActualCostUsd: -1,
        sourceKind: "provider_usage_api_confirmed_cost"
      }),
      null
    );
  });
});
