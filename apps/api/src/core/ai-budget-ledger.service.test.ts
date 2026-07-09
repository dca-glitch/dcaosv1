import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPeriodKey, buildAiBudgetSnapshot, isAiBudgetBlocked } from "./ai-budget-guard.service";
import { AI_BUDGET_LEDGER_VERSION } from "./ai-budget-ledger.service";

describe("ai-budget-ledger.service (unit logic)", () => {
  it("exports ledger version constant", () => {
    assert.equal(AI_BUDGET_LEDGER_VERSION, "AI_BUDGET_LEDGER_V1");
  });

  it("budget guard respects spentThisPeriodUsd for cap enforcement", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "article_draft",
      spentThisPeriodUsd: 100
    });
    assert.equal(budget.killSwitchActive, true);
    assert.equal(isAiBudgetBlocked(budget).blocked, true);
  });

  it("buildPeriodKey returns YYYY-MM format", () => {
    const key = buildPeriodKey(new Date("2026-07-15T12:00:00.000Z"));
    assert.equal(key, "2026-07");
  });
});
