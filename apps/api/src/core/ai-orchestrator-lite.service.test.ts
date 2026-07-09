import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyAiMaterialPolicy } from "./ai-material-policy.guard";
import { buildAiBudgetSnapshot, isAiBudgetBlocked, PURIVA_AI_MONTHLY_CAP_USD } from "./ai-budget-guard.service";
import { planAiOrchestratorLiteStep } from "./ai-orchestrator-lite.service";
import { resolveProviderForRole } from "./ai-provider-registry.service";
import { getPurivaAiPolicyProfile } from "./puriva-ai-policy-profile";
import { runAllComplianceFixturesLocally } from "./ai-compliance-review.fixtures";
import { planWorkflowStepWithOrchestrator } from "./ai-orchestrator-workflow-adapter.skeleton";
import { assertOrchestratorDisabledSafeInvariant } from "./ai-kill-switch.service";

describe("ai-orchestrator-lite foundation", () => {
  it("excludes forbidden medical data for all roles", () => {
    const result = applyAiMaterialPolicy("content_drafting_agent", [
      {
        materialClass: "forbidden_medical_data",
        referenceId: "x",
        label: "Patient record",
        included: true,
        exclusionReason: null
      }
    ]);

    assert.equal(result.policyDecision.allowed, false);
    assert.equal(result.excludedMaterials.length, 1);
  });

  it("restricts before/after assets to vision QA role", () => {
    const blocked = applyAiMaterialPolicy("content_drafting_agent", [
      {
        materialClass: "before_after_asset",
        referenceId: null,
        label: "Before/after",
        included: true,
        exclusionReason: null
      }
    ]);
    assert.equal(blocked.excludedMaterials.length, 1);

    const allowed = applyAiMaterialPolicy("vision_technical_qa_agent", [
      {
        materialClass: "before_after_asset",
        referenceId: null,
        label: "Before/after",
        included: true,
        exclusionReason: null
      }
    ]);
    assert.equal(allowed.inputMaterials.length, 1);
  });

  it("applies Puriva monthly AI cap", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: "puriva",
      taskType: "article_draft",
      spentThisPeriodUsd: 99.5
    });
    assert.equal(budget.monthlyCapUsd, PURIVA_AI_MONTHLY_CAP_USD);
    const block = isAiBudgetBlocked(budget);
    assert.equal(block.blocked, true);
  });

  it("resolves disabled-safe provider for research role", () => {
    const resolution = resolveProviderForRole("research_agent");
    assert.equal(resolution.effective.providerKey, "local_deterministic");
    assert.equal(resolution.effective.executionMode, "local");
  });

  it("plans preview without live provider call", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "content_drafting_agent",
      taskType: "article_draft",
      operatingPackKey: "puriva"
    });

    assert.equal(plan.preview.executionMode, "local");
    assert.equal(plan.preview.audit.liveProviderCalled, false);
    assert.equal(plan.preview.approvalRequired, true);
    assert.ok(plan.preview.inputMaterials.length > 0);
    assert.equal(plan.preview.modelRouting.routingTaskType, "content_draft");
    assert.equal(plan.preview.modelRouting.primaryModel, "anthropic/claude-haiku-4.5");
    assert.equal(plan.preview.modelRouting.gateway, "openrouter");
    assert.equal(plan.preview.modelRouting.requiresBudgetLedger, true);
    assert.ok(plan.preview.modelRouting.maxCostUsdPerRun > 0);
  });

  it("rejects unapproved model override in preview routing audit", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      requestedModelOverride: "openrouter/auto"
    });
    assert.equal(plan.preview.modelRouting.modelOverrideRejected, true);
    assert.equal(plan.preview.modelRouting.primaryModel, "anthropic/claude-haiku-4.5");
  });

  it("exposes Puriva policy profile with $100 cap", () => {
    const profile = getPurivaAiPolicyProfile();
    assert.equal(profile.monthlyAiCapUsd, 100);
    assert.equal(profile.scope.paidAds, false);
    assert.equal(profile.beforeAfter.finalExportRetentionDays, 60);
  });

  it("blocks unapproved brief in workflow adapter", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "content_drafting_agent",
      taskType: "article_draft",
      operatingPackKey: "puriva",
      briefApproved: false
    });
    assert.equal(result.canProceedToExecution, false);
    assert.match(result.blockedReason ?? "", /not approved/i);
  });

  it("passes kill switch disabled-safe invariant", () => {
    const invariant = assertOrchestratorDisabledSafeInvariant();
    assert.equal(invariant.ok, true);
  });

  it("runs compliance fixtures deterministically", () => {
    const results = runAllComplianceFixturesLocally();
    assert.equal(results.length, 6);
    assert.ok(results.every((entry) => entry.fixtureId.length > 0));
  });
});
