import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAiBudgetSnapshot,
  isAiBudgetBlocked,
  PURIVA_AI_MONTHLY_CAP_USD,
  resolveMonthlyCapUsd
} from "./ai-budget-guard.service";

describe("ai-budget-guard.service", () => {
  it("applies Puriva $100 monthly cap", () => {
    assert.equal(resolveMonthlyCapUsd("puriva"), PURIVA_AI_MONTHLY_CAP_USD);
    assert.equal(PURIVA_AI_MONTHLY_CAP_USD, 100);
  });

  it("shows remaining budget under cap", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "article_draft",
      spentThisPeriodUsd: 10
    });
    assert.ok(budget.remainingBudgetUsd > 0);
    assert.equal(budget.killSwitchActive, false);
    assert.equal(isAiBudgetBlocked(budget).blocked, false);
  });

  it("blocks near-budget projected workflow", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "article_draft",
      spentThisPeriodUsd: 99.5,
      workflowStepCount: 8
    });
    assert.equal(isAiBudgetBlocked(budget).blocked, true);
    assert.equal(budget.projectedOverBudget, true);
  });

  it("activates kill switch when cap exceeded", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "local_deterministic",
      spentThisPeriodUsd: 100
    });
    assert.equal(budget.killSwitchActive, true);
    assert.equal(isAiBudgetBlocked(budget).blocked, true);
  });
});
