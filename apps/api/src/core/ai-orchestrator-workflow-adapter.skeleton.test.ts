import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planWorkflowStepWithOrchestrator, completeWorkflowStepLedgerAttribution } from "./ai-orchestrator-workflow-adapter.skeleton";
import { resolveDryRunContractForTaskType } from "./ai-workflow-dry-run-contracts.service";
import {
  assertOrchestratorLocalOnlySafety,
  buildOrchestratorDeterministicFallbackSnapshot
} from "./ai-local-guard-orchestrator";

describe("ai-orchestrator-workflow-adapter", () => {
  it("returns dry-run research pack contract with routing metadata", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      briefApproved: true
    });
    assert.equal(result.executionDeferred, true);
    assert.ok(result.dryRunOutput.researchPack);
    assert.equal(result.plan.preview.audit.liveProviderCalled, false);
    assert.equal(result.plan.preview.modelRouting.routingTaskType, "research_pack");
    assert.equal(result.plannedLedgerMetadata.routingTaskType, "research_pack");
    assert.equal(result.plannedLedgerMetadata.gateway, "openrouter");
    assert.equal(result.plannedLedgerMetadata.liveProviderCalled, false);
  });

  it("workflow dry-run exposes workflow_summary routing for report_narrative", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "report_narrative",
      agentRole: "report_narrative_agent",
      taskType: "report_narrative",
      operatingPackKey: "puriva",
      briefApproved: true
    });
    assert.equal(result.plan.preview.modelRouting.routingTaskType, "workflow_summary");
    assert.equal(result.plannedLedgerMetadata.maxCostUsdPerRun, 0.15);
  });

  it("blocks image_generation in workflow adapter dry-run", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "image_generation",
      agentRole: "image_generation_agent",
      taskType: "image_generation",
      operatingPackKey: "puriva",
      briefApproved: true
    });
    assert.equal(result.canProceedToExecution, false);
    assert.equal(result.plan.preview.modelRouting.routingTaskType, "fallback_stop_admin_review");
    assert.equal(result.plannedLedgerMetadata.ledgerStatus, "BLOCKED");
  });

  it("returns dry-run research pack contract for research_pack task", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      briefApproved: true
    });
    assert.equal(result.executionDeferred, true);
    assert.ok(result.dryRunOutput.researchPack);
    assert.equal(result.plan.preview.audit.liveProviderCalled, false);
  });

  it("completeWorkflowStepLedgerAttribution uses mocked provider result without live call", () => {
    const result = completeWorkflowStepLedgerAttribution({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      briefApproved: true,
      workflowRunId: "wf-adapter-mock",
      providerExecution: {
        ok: true,
        providerKey: "openrouter",
        model: "anthropic/claude-haiku-4.5",
        actualCostUsd: 0.08,
        approximateInputTokens: 500,
        approximateOutputTokens: 200,
        liveProviderCalled: true,
        runId: "adapter-mock-run"
      }
    });
    assert.equal(result.adapter.executionDeferred, true);
    assert.equal(result.adapter.plan.preview.audit.liveProviderCalled, false);
    assert.equal(result.completedLedgerAttribution.ledgerStatus, "COMPLETED");
    assert.equal(result.completedLedgerAttribution.metadata?.taskType, "research_pack");
    assert.equal(result.completedLedgerAttribution.metadata?.maxCostUsdPerRun, 0.3);
  });

  it("blocks when brief is not approved", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "content_drafting_agent",
      taskType: "article_draft",
      briefApproved: false
    });
    assert.equal(result.canProceedToExecution, false);
    assert.match(result.blockedReason ?? "", /not approved/i);
  });

  it("G625/G628: adapter dry-run local-only safety and deterministic fallback", () => {
    const result = planWorkflowStepWithOrchestrator({
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      briefApproved: true
    });
    const safety = assertOrchestratorLocalOnlySafety(result.plan);
    assert.equal(safety.ok, true);
    const fallback = buildOrchestratorDeterministicFallbackSnapshot(result.plan);
    assert.equal(fallback.liveProviderCalled, false);
    assert.equal(fallback.isLocalDeterministic, true);
  });
});

describe("ai-workflow-dry-run-contracts.service", () => {
  it("resolves seo plan contract for seo_plan task type", () => {
    const resolved = resolveDryRunContractForTaskType("seo_plan");
    assert.ok(resolved.output);
    assert.ok(resolved.output && "planId" in resolved.output);
  });
});
