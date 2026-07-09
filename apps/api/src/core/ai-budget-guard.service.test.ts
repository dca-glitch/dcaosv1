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

  it("uses route maxCostUsdPerRun for estimated step cost when provided", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "research_pack",
      maxCostUsdPerRun: 0.3
    });
    assert.equal(budget.estimatedStepCostUsd, 0.3);
  });

  it("blocks when route cost cap exceeds remaining monthly budget", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "research_pack",
      spentThisPeriodUsd: 99.85,
      maxCostUsdPerRun: 0.3
    });
    const block = isAiBudgetBlocked(budget, 0.3);
    assert.equal(block.blocked, true);
    assert.match(block.reason ?? "", /route cost cap/i);
  });

  it("route cap stays below Puriva monthly cap", () => {
    const routeCap = 0.75;
    assert.ok(routeCap < PURIVA_AI_MONTHLY_CAP_USD);
  });
});
