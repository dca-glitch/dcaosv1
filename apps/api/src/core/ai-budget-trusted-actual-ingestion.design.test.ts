import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_BUDGET_REPORTING_CONTRACT_VERSION } from "./ai-budget-reporting.contract";
import {
  AI_BUDGET_TRUSTED_ACTUAL_INGESTION_VERSION,
  getAiBudgetInvoiceVarianceDesign,
  getAiBudgetTrustedActualIngestionDesign,
  resolveTrustedActualCostUsd
} from "./ai-budget-trusted-actual-ingestion.design";

describe("ai-budget-trusted-actual-ingestion.design", () => {
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
