import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyAiMaterialPolicy } from "./ai-material-policy.guard";
import { buildAiBudgetSnapshot, isAiBudgetBlocked, PURIVA_AI_MONTHLY_CAP_USD } from "./ai-budget-guard.service";
import { planAiOrchestratorLiteStep } from "./ai-orchestrator-lite.service";
import { resolveProviderForRole } from "./ai-provider-registry.service";
import { getPurivaAiPolicyProfile } from "./puriva-ai-policy-profile";

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
  });

  it("exposes Puriva policy profile with $100 cap", () => {
    const profile = getPurivaAiPolicyProfile();
    assert.equal(profile.monthlyAiCapUsd, 100);
    assert.equal(profile.scope.paidAds, false);
    assert.equal(profile.beforeAfter.finalExportRetentionDays, 60);
  });
});
