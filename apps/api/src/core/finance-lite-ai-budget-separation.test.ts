import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_BUDGET_REPORTING_CONTRACT_VERSION } from "./ai-budget-reporting.contract";
import {
  FINANCE_LITE_AI_BUDGET_SEPARATION_VERSION,
  getFinanceLiteAiBudgetSeparationCheck,
  isFinanceLiteAiBudgetCrossoverProhibited
} from "./finance-lite-ai-budget-separation";

describe("finance-lite-ai-budget-separation (G618)", () => {
  it("documents hard separation with no invoice mutation rights", () => {
    const check = getFinanceLiteAiBudgetSeparationCheck("ai_budget_reporting");

    assert.equal(check.version, FINANCE_LITE_AI_BUDGET_SEPARATION_VERSION);
    assert.equal(check.reportingContractVersion, AI_BUDGET_REPORTING_CONTRACT_VERSION);
    assert.equal(check.mayMutateFinanceLiteInvoices, false);
    assert.equal(check.mayTreatEstimateAsInvoiceAmount, false);
    assert.equal(check.mayTreatFinanceLiteInvoiceAsProviderCostProof, false);
    assert.equal(check.invoiceReconciliationStatus, "not_integrated");
    assert.equal(check.separation.version, AI_BUDGET_REPORTING_CONTRACT_VERSION);
    assert.ok(check.separation.aiBudgetOwns.length >= 3);
    assert.ok(check.separation.financeLiteOwns.some((item) => /invoice/i.test(item)));
    assert.ok(
      check.separation.prohibitedCrossovers.some((item) =>
        /must not create or mutate Finance Lite invoices/i.test(item)
      )
    );
  });

  it("flags prohibited invoice and estimate-as-invoice crossovers", () => {
    assert.equal(
      isFinanceLiteAiBudgetCrossoverProhibited("create Finance Lite invoice from AI budget"),
      true
    );
    assert.equal(
      isFinanceLiteAiBudgetCrossoverProhibited("present estimated AI cost as invoice amount"),
      true
    );
    assert.equal(
      isFinanceLiteAiBudgetCrossoverProhibited("treat Finance Lite invoice as provider-cost proof"),
      true
    );
  });
});
