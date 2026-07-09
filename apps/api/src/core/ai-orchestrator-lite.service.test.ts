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

  it("passes route maxCostUsdPerRun into budget snapshot for orchestrator planning", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva"
    });
    assert.equal(plan.preview.budget.estimatedStepCostUsd, plan.preview.modelRouting.maxCostUsdPerRun);
    assert.equal(plan.preview.modelRouting.maxCostUsdPerRun, 0.3);
    assert.ok(plan.preview.modelRouting.maxCostUsdPerRun < PURIVA_AI_MONTHLY_CAP_USD);
  });

  it("research_pack route metadata appears in orchestrator preview", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva"
    });
    assert.equal(plan.preview.modelRouting.routingTaskType, "research_pack");
    assert.equal(plan.preview.modelRouting.policyVersion, "AI_MODEL_ROUTING_POLICY_V1");
    assert.equal(plan.preview.audit.liveProviderCalled, false);
    assert.equal(plan.plannedLedgerMetadata.taskType, "research_pack");
    assert.equal(plan.plannedLedgerMetadata.gateway, "openrouter");
    assert.equal(plan.plannedLedgerMetadata.model, "anthropic/claude-haiku-4.5");
    assert.equal(plan.plannedLedgerMetadata.clientProfile, "puriva");
    assert.equal(plan.plannedLedgerMetadata.contentChannel, "website");
    assert.equal(plan.plannedLedgerMetadata.ledgerStatus, "PREVIEW");
  });

  it("report_narrative maps to workflow_summary with modelRouting", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "report_narrative",
      agentRole: "report_narrative_agent",
      taskType: "report_narrative",
      operatingPackKey: "puriva"
    });
    assert.equal(plan.preview.modelRouting.routingTaskType, "workflow_summary");
    assert.equal(plan.plannedLedgerMetadata.routingTaskType, "workflow_summary");
    assert.equal(plan.preview.modelRouting.allowLive, true);
  });

  it("medical_compliance_review blocks live with allowLive false", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "compliance_review",
      agentRole: "compliance_review_agent",
      taskType: "compliance_review",
      operatingPackKey: "puriva"
    });
    assert.equal(plan.preview.modelRouting.routingTaskType, "medical_compliance_review");
    assert.equal(plan.preview.modelRouting.allowLive, false);
    assert.equal(plan.preview.modelRouting.complianceProfile, "puriva_medical_strict");
  });

  it("image_generation maps to fallback_stop_admin_review and blocks execution", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "image_generation",
      agentRole: "image_generation_agent",
      taskType: "image_generation",
      operatingPackKey: "puriva"
    });
    assert.equal(plan.preview.modelRouting.routingTaskType, "fallback_stop_admin_review");
    assert.equal(plan.canExecute, false);
    assert.equal(plan.plannedLedgerMetadata.ledgerStatus, "BLOCKED");
    assert.equal(plan.preview.audit.liveProviderCalled, false);
  });

  it("paid_ads content channel is blocked in orchestrator preview", () => {
    const plan = planAiOrchestratorLiteStep({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      contentChannel: "paid_ads"
    });
    assert.equal(plan.canExecute, false);
    assert.match(plan.blockedReason ?? "", /paid ads/i);
    assert.equal(plan.plannedLedgerMetadata.contentChannel, "paid_ads");
    assert.equal(plan.plannedLedgerMetadata.ledgerStatus, "BLOCKED");
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
