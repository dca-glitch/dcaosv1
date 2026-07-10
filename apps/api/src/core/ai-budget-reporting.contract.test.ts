import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_BUDGET_ACTUAL_COST_NULL_POLICY,
  AI_BUDGET_REPORTING_CONTRACT_VERSION,
  buildAiBudgetReconciliationDesign,
  buildAiBudgetReportingContract,
  getAiBudgetFinanceLiteSeparationContract,
  type AiBudgetReportingLedgerRow
} from "./ai-budget-reporting.contract";

const PERIOD_KEY = "2026-07";

const rows: AiBudgetReportingLedgerRow[] = [
  {
    id: "preview-1",
    periodKey: PERIOD_KEY,
    provider: "openrouter",
    model: "anthropic/claude-haiku-4.5",
    taskType: "research_pack",
    estimatedCostUsd: 0.3,
    actualCostUsd: null,
    status: "PREVIEW",
    liveProviderCalled: false
  },
  {
    id: "live-actual-1",
    periodKey: PERIOD_KEY,
    provider: "openrouter",
    model: "anthropic/claude-haiku-4.5",
    taskType: "report_narrative",
    estimatedCostUsd: 0.15,
    actualCostUsd: 0.08,
    status: "COMPLETED",
    liveProviderCalled: true
  },
  {
    id: "live-estimate-1",
    periodKey: PERIOD_KEY,
    provider: "openrouter",
    model: "anthropic/claude-haiku-4.5",
    taskType: "report_narrative",
    estimatedCostUsd: "0.15",
    actualCostUsd: null,
    status: "COMPLETED",
    liveProviderCalled: true
  },
  {
    id: "local-plan-1",
    periodKey: PERIOD_KEY,
    provider: "local_deterministic",
    model: "local-deterministic-v1",
    taskType: "local_deterministic",
    estimatedCostUsd: 0,
    actualCostUsd: null,
    status: "PLANNED",
    liveProviderCalled: false
  },
  {
    id: "blocked-1",
    periodKey: PERIOD_KEY,
    provider: "openrouter",
    model: "anthropic/claude-haiku-4.5",
    taskType: "image_generation",
    estimatedCostUsd: 0.5,
    actualCostUsd: null,
    status: "BLOCKED",
    liveProviderCalled: false
  },
  {
    id: "skipped-1",
    periodKey: PERIOD_KEY,
    provider: "local_deterministic",
    model: "local-deterministic-v1",
    taskType: "research_pack",
    estimatedCostUsd: 0.3,
    actualCostUsd: null,
    status: "SKIPPED",
    liveProviderCalled: false
  },
  {
    id: "other-period-1",
    periodKey: "2026-08",
    provider: "openrouter",
    model: "anthropic/claude-haiku-4.5",
    taskType: "research_pack",
    estimatedCostUsd: 99,
    actualCostUsd: null,
    status: "COMPLETED",
    liveProviderCalled: true
  }
];

describe("ai-budget-reporting.contract", () => {
  it("builds a monthly cap report from countable AI budget ledger rows", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });

    assert.equal(report.version, AI_BUDGET_REPORTING_CONTRACT_VERSION);
    assert.equal(report.source, "ai_budget_ledger");
    assert.equal(report.financeLiteBoundary, "separate_admin_finance_records_no_invoice_ingestion");
    assert.equal(report.actualCostNullPolicy, AI_BUDGET_ACTUAL_COST_NULL_POLICY);
    assert.equal(report.periodKey, PERIOD_KEY);
    assert.equal(report.monthlyCapUsd, 100);
    assert.equal(report.countableRowCount, 4);
    assert.equal(report.liveRowCount, 2);
    assert.equal(report.spentThisPeriodUsd, 0.53);
    assert.equal(report.remainingBudgetUsd, 99.47);
    assert.equal(report.projectedOverBudget, false);
    assert.equal(
      report.rows.some((row) => row.id === "blocked-1" || row.id === "skipped-1"),
      false
    );
  });

  it("keeps estimated and trusted actual costs separate", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });

    assert.deepEqual(report.totals, {
      estimatedCostUsd: 0.6,
      actualCostUsd: 0.08,
      estimatedFallbackCostUsd: 0.45
    });
    assert.equal(report.rows.find((row) => row.id === "live-actual-1")?.spendBasis, "actual");
    assert.equal(report.rows.find((row) => row.id === "live-estimate-1")?.spendBasis, "estimated");
  });

  it("preserves provider and model reporting for live rows", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });

    const liveRows = report.rows.filter((row) => row.liveProviderCalled);
    assert.equal(liveRows.length, 2);
    assert.ok(liveRows.every((row) => row.provider === "openrouter"));
    assert.ok(liveRows.every((row) => row.model === "anthropic/claude-haiku-4.5"));

    const openRouterBreakdown = report.providerModelBreakdown.find(
      (row) => row.provider === "openrouter" && row.model === "anthropic/claude-haiku-4.5"
    );
    assert.ok(openRouterBreakdown);
    assert.equal(openRouterBreakdown.rowCount, 3);
    assert.equal(openRouterBreakdown.liveRowCount, 2);
    assert.equal(openRouterBreakdown.spentUsd, 0.53);
  });

  it("marks over-cap reports without invoking Finance Lite invoices", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 0.5,
      rows
    });

    assert.equal(report.projectedOverBudget, true);
    assert.equal(report.remainingBudgetUsd, 0);
    assert.equal(report.financeLiteBoundary, "separate_admin_finance_records_no_invoice_ingestion");
  });

  it("builds reconciliation design with estimate, actual, invoice, and variance slots", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const reconciliation = buildAiBudgetReconciliationDesign(report);

    assert.equal(reconciliation.estimateTotalUsd, 0.6);
    assert.equal(reconciliation.trustedActualTotalUsd, 0.08);
    assert.equal(reconciliation.invoiceTotalUsd, null);
    assert.equal(reconciliation.varianceEstimateVsActualUsd, -0.52);
    assert.equal(reconciliation.varianceInvoiceVsActualUsd, null);
    assert.equal(reconciliation.invoiceStatus, "not_integrated");
    assert.equal(reconciliation.financeLitePostingStatus, "not_posted");
    assert.match(reconciliation.notes.join(" "), /not an invoice/i);
  });

  it("documents AI budget versus Finance Lite separation", () => {
    const separation = getAiBudgetFinanceLiteSeparationContract();

    assert.equal(separation.version, AI_BUDGET_REPORTING_CONTRACT_VERSION);
    assert.ok(separation.aiBudgetOwns.some((item) => item.includes("monthly AI cap")));
    assert.ok(separation.financeLiteOwns.some((item) => item.includes("client invoices")));
    assert.ok(
      separation.prohibitedCrossovers.some((item) =>
        item.includes("must not create or mutate Finance Lite invoices")
      )
    );
  });

  it("keeps live COMPLETED rows with null actualCostUsd on estimated spend basis", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const liveEstimate = report.rows.find((row) => row.id === "live-estimate-1");
    assert.ok(liveEstimate);
    assert.equal(liveEstimate.liveProviderCalled, true);
    assert.equal(liveEstimate.actualCostUsd, null);
    assert.equal(liveEstimate.spendBasis, "estimated");
    assert.equal(liveEstimate.spentUsd, 0.15);
    assert.equal(report.actualCostNullPolicy, "leave_null_until_trusted_provider_cost");
  });

  it("does not treat estimated totals as invoice amounts in reconciliation", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const reconciliation = buildAiBudgetReconciliationDesign(report);
    assert.notEqual(reconciliation.estimateTotalUsd, reconciliation.invoiceTotalUsd);
    assert.equal(reconciliation.invoiceTotalUsd, null);
    assert.match(reconciliation.notes.join(" "), /Finance Lite invoice reconciliation/i);
  });

  it("G614: estimated vs actual cost reporting keeps spendBasis honest", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const actualRow = report.rows.find((row) => row.id === "live-actual-1");
    const estimateRow = report.rows.find((row) => row.id === "live-estimate-1");
    assert.ok(actualRow && estimateRow);
    assert.equal(actualRow.spendBasis, "actual");
    assert.equal(actualRow.spentUsd, actualRow.actualCostUsd);
    assert.equal(estimateRow.spendBasis, "estimated");
    assert.equal(estimateRow.actualCostUsd, null);
    assert.equal(estimateRow.spentUsd, estimateRow.estimatedCostUsd);
    assert.equal(report.totals.actualCostUsd, 0.08);
    assert.equal(report.totals.estimatedFallbackCostUsd, 0.45);
    assert.notEqual(report.totals.estimatedCostUsd, report.totals.actualCostUsd);
  });

  it("G615: monthly cap report shape exposes cap, spend, remaining, and over-budget", () => {
    const under = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    assert.equal(under.monthlyCapUsd, 100);
    assert.equal(under.spentThisPeriodUsd, 0.53);
    assert.equal(under.remainingBudgetUsd, 99.47);
    assert.equal(under.projectedOverBudget, false);
    assert.equal(under.countableRowCount, 4);
    assert.ok(Array.isArray(under.rows));
    assert.ok(Array.isArray(under.providerModelBreakdown));

    const over = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 0.4,
      rows
    });
    assert.equal(over.projectedOverBudget, true);
    assert.equal(over.remainingBudgetUsd, 0);
    assert.ok(over.spentThisPeriodUsd > over.monthlyCapUsd);
  });

  it("G616: provider/model breakdown aggregates estimated and actual separately", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const openRouter = report.providerModelBreakdown.find(
      (row) => row.provider === "openrouter" && row.model === "anthropic/claude-haiku-4.5"
    );
    const local = report.providerModelBreakdown.find(
      (row) => row.provider === "local_deterministic"
    );
    assert.ok(openRouter);
    assert.ok(local);
    assert.equal(openRouter.rowCount, 3);
    assert.equal(openRouter.liveRowCount, 2);
    assert.equal(openRouter.actualCostUsd, 0.08);
    assert.equal(openRouter.estimatedFallbackCostUsd, 0.45);
    assert.equal(openRouter.spentUsd, 0.53);
    assert.equal(local.rowCount, 1);
    assert.equal(local.liveRowCount, 0);
    assert.equal(local.spentUsd, 0);
  });

  it("G617: live COMPLETED rows are included in reporting and liveRowCount", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows
    });
    const liveIds = report.rows.filter((row) => row.liveProviderCalled).map((row) => row.id);
    assert.deepEqual(liveIds.sort(), ["live-actual-1", "live-estimate-1"]);
    assert.equal(report.liveRowCount, 2);
    assert.ok(report.spentThisPeriodUsd >= 0.08 + 0.15);
    assert.equal(
      report.rows.some((row) => row.id === "other-period-1"),
      false
    );
  });

  it("treats non-finite or negative actualCostUsd as null (trusted-source)", () => {
    const report = buildAiBudgetReportingContract({
      periodKey: PERIOD_KEY,
      monthlyCapUsd: 100,
      rows: [
        {
          id: "bad-actual-nan",
          periodKey: PERIOD_KEY,
          provider: "openrouter",
          model: "anthropic/claude-haiku-4.5",
          taskType: "report_narrative",
          estimatedCostUsd: 0.15,
          actualCostUsd: Number.NaN,
          status: "COMPLETED",
          liveProviderCalled: true
        },
        {
          id: "bad-actual-neg",
          periodKey: PERIOD_KEY,
          provider: "openrouter",
          model: "anthropic/claude-haiku-4.5",
          taskType: "report_narrative",
          estimatedCostUsd: 0.2,
          actualCostUsd: -1,
          status: "COMPLETED",
          liveProviderCalled: false
        }
      ]
    });
    assert.equal(report.rows.length, 2);
    for (const row of report.rows) {
      assert.equal(row.actualCostUsd, null);
      assert.equal(row.spendBasis, "estimated");
    }
    assert.equal(report.totals.actualCostUsd, 0);
    assert.equal(report.totals.estimatedFallbackCostUsd, 0.35);
    assert.equal(report.spentThisPeriodUsd, 0.35);
  });
});
