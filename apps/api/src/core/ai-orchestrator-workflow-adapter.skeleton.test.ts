import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planWorkflowStepWithOrchestrator } from "./ai-orchestrator-workflow-adapter.skeleton";
import { resolveDryRunContractForTaskType } from "./ai-workflow-dry-run-contracts.service";

describe("ai-orchestrator-workflow-adapter", () => {
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
});

describe("ai-workflow-dry-run-contracts.service", () => {
  it("resolves seo plan contract for seo_plan task type", () => {
    const resolved = resolveDryRunContractForTaskType("seo_plan");
    assert.ok(resolved.output);
    assert.ok(resolved.output && "planId" in resolved.output);
  });
});
