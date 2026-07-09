import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_MODEL_ROUTING_POLICY_VERSION } from "@dca-os-v1/shared";
import { buildPeriodKey, buildAiBudgetSnapshot, isAiBudgetBlocked } from "./ai-budget-guard.service";
import { AI_BUDGET_LEDGER_VERSION, buildPlannedLedgerMetadata } from "./ai-budget-ledger.service";
import { resolveModelRoute } from "./ai-model-routing-policy.service";

describe("ai-budget-ledger.service (unit logic)", () => {
  it("exports ledger version constant", () => {
    assert.equal(AI_BUDGET_LEDGER_VERSION, "AI_BUDGET_LEDGER_V1");
  });

  it("buildPlannedLedgerMetadata records routing attribution fields", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    const metadata = buildPlannedLedgerMetadata({
      orchestratorTaskType: "research_pack",
      clientProfile: "puriva",
      contentChannel: "website",
      providerKey: "local_deterministic",
      estimatedCostUsd: routing.route.maxCostUsdPerRun,
      canExecute: true,
      routingAudit: routing.audit
    });
    assert.equal(metadata.ledgerVersion, AI_BUDGET_LEDGER_VERSION);
    assert.equal(metadata.taskType, "research_pack");
    assert.equal(metadata.routingTaskType, "research_pack");
    assert.equal(metadata.gateway, "openrouter");
    assert.equal(metadata.model, "anthropic/claude-haiku-4.5");
    assert.equal(metadata.maxCostUsdPerRun, 0.3);
    assert.equal(metadata.policyVersion, AI_MODEL_ROUTING_POLICY_VERSION);
    assert.equal(metadata.clientProfile, "puriva");
    assert.equal(metadata.contentChannel, "website");
    assert.equal(metadata.requiresBudgetLedger, true);
    assert.equal(metadata.liveProviderCalled, false);
    assert.equal(metadata.ledgerStatus, "PREVIEW");
  });

  it("buildPlannedLedgerMetadata marks blocked routes as BLOCKED ledger status", () => {
    const routing = resolveModelRoute({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva"
    });
    const metadata = buildPlannedLedgerMetadata({
      orchestratorTaskType: "image_generation",
      clientProfile: "puriva",
      providerKey: "local_deterministic",
      estimatedCostUsd: 0,
      canExecute: false,
      routingAudit: routing.audit
    });
    assert.equal(metadata.ledgerStatus, "BLOCKED");
    assert.equal(metadata.routingTaskType, "fallback_stop_admin_review");
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
