import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  executeWorkflowBriefAiRun,
  WORKFLOW_BRIEF_AI_RUN_VERSION
} from "./workflow-brief-ai.execution";
import type { AiProviderConfig } from "../config";

const localConfig: AiProviderConfig = {
  textGateway: "local",
  preferredTextGateway: "openrouter",
  hasOpenRouterApiKey: false,
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  openRouterTextPrimaryModel: null,
  openRouterTextSecondaryModel: null,
  openRouterTextReviewerModel: null,
  openRouterTextLongContextModel: null
};

const disabledConfig: AiProviderConfig = {
  ...localConfig,
  textGateway: "disabled"
};

function buildInput(overrides: Partial<Parameters<typeof executeWorkflowBriefAiRun>[0]> = {}) {
  return {
    briefId: "brief-test",
    title: "Test Workflow Brief",
    goal: "Increase qualified leads",
    businessContext: "B2B SaaS for marketing teams",
    targetAudience: "Marketing directors at mid-market companies",
    offerContext: "Monthly content + SEO retainer",
    locationContext: "United States",
    notes: null,
    structuredInputJson: {
      keywords: ["content marketing", "seo strategy"],
      competitors: ["Agency A", "Agency B"]
    },
    finishedAtIso: new Date().toISOString(),
    ...overrides
  };
}

describe("workflow-brief-ai.execution", () => {
  it("generates structured MI + SEO via local deterministic path", async () => {
    const result = await executeWorkflowBriefAiRun(buildInput(), localConfig);

    assert.equal(result.ok, true);
    assert.equal(result.meta.version, WORKFLOW_BRIEF_AI_RUN_VERSION);
    assert.equal(result.meta.gateway, "local");
    assert.equal(result.meta.isDeterministic, true);
    assert.ok(result.mi.summary.length > 0);
    assert.ok(result.mi.opportunities.length > 0);
    assert.ok(result.seo.keywordClusters.length > 0);
    assert.ok(result.seo.topicIdeas.length > 0);
    assert.ok(result.executionLog.some((line) => line.includes("[OBSERVABILITY]")));
  });

  it("still succeeds when AI gateway is disabled", async () => {
    const result = await executeWorkflowBriefAiRun(buildInput(), disabledConfig);

    assert.equal(result.ok, true);
    assert.equal(result.meta.gateway, "local");
    assert.equal(result.meta.isDeterministic, true);
  });

  it("fails safely when notes include [stub-fail]", async () => {
    const result = await executeWorkflowBriefAiRun(
      buildInput({ notes: "Please fail [stub-fail] for test" }),
      localConfig
    );

    assert.equal(result.ok, false);
    assert.ok(result.errorMessage?.includes("[stub-fail]"));
  });
});
