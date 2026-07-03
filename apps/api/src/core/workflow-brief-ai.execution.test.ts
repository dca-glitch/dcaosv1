import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeWorkflowBriefAiContextText,
  executeWorkflowBriefAiRun,
  buildWorkflowBriefKnowledgeContextLogLines,
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

  it("composes approved knowledge section before brief context", () => {
    const composed = composeWorkflowBriefAiContextText(
      buildInput({
        approvedKnowledgeSection: "Approved knowledge context (admin-internal):\n- [CLIENT_FACT — CLIENT — v1] Known brand voice"
      })
    );

    assert.ok(composed.startsWith("Approved knowledge context (admin-internal):"));
    assert.ok(composed.includes("Brief title: Test Workflow Brief"));
  });

  it("records knowledge context inclusion in execution log", async () => {
    const result = await executeWorkflowBriefAiRun(
      buildInput({
        knowledgeContext: {
          used: true,
          selectedCount: 1,
          selectedItemTitles: ["Brand voice guide"],
          skippedReason: null,
          sanitizeFlagCount: 0,
          trimmed: false
        }
      }),
      localConfig
    );

    assert.equal(result.ok, true);
    assert.ok(
      result.executionLog.some((line) => line.includes("Approved knowledge context included: 1 item(s)"))
    );
    assert.ok(result.executionLog.some((line) => line.includes("Brand voice guide")));
  });

  it("records skipped knowledge context in execution log", () => {
    const lines = buildWorkflowBriefKnowledgeContextLogLines({
      used: false,
      selectedCount: 0,
      selectedItemTitles: [],
      skippedReason: "No approved knowledge items matched scope.",
      sanitizeFlagCount: 0,
      trimmed: false
    });

    assert.ok(lines.some((line) => line.includes("Approved knowledge context skipped")));
  });
});
