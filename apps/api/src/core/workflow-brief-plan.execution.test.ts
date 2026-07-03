import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AiProviderConfig } from "../config";
import {
  buildProductionPlanBodyFromContent,
  buildProductionPlanTitle,
  composeWorkflowBriefPlanContextText,
  executeWorkflowBriefPlanGeneration,
  WORKFLOW_BRIEF_PLAN_VERSION
} from "./workflow-brief-plan.execution";

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

function buildInput() {
  return {
    briefId: "brief-test",
    title: "Test Workflow Brief",
    goal: "Increase qualified leads",
    businessContext: "B2B SaaS for marketing teams",
    targetAudience: "Marketing directors at mid-market companies",
    offerContext: "Monthly content + SEO retainer",
    locationContext: "United States",
    notes: null,
    mi: {
      summary: "Strong demand for educational content in this niche.",
      audienceInsights: ["Primary audience: marketing directors"],
      competitorInsights: ["Agency A competes on price"],
      marketSignals: ["Keyword interest rising"],
      opportunities: ["Content opportunity around thought leadership"],
      risks: ["Audience definition could be sharper"],
      recommendedActions: ["Confirm audience positioning with client"]
    },
    seo: {
      keywordClusters: ["content marketing strategy", "seo retainer"],
      topicIdeas: ["How to choose a content partner", "SEO planning checklist"],
      contentAngles: ["Authority angle for marketing leaders"],
      internalLinkIdeas: ["Link service pages to educational articles"],
      seoNotes: ["Deterministic SEO draft — validate search intent manually"]
    },
    finishedAtIso: new Date().toISOString()
  };
}

describe("workflow-brief-plan.execution", () => {
  it("generates structured production plan via local deterministic path", async () => {
    const result = await executeWorkflowBriefPlanGeneration(buildInput(), localConfig);

    assert.equal(result.ok, true);
    assert.equal(result.meta.version, WORKFLOW_BRIEF_PLAN_VERSION);
    assert.equal(result.meta.isDeterministic, true);
    assert.ok(result.plan.strategicSummary.length > 0);
    assert.ok(result.plan.priorityTopics.length > 0);
    assert.ok(result.plan.suggestedContentClusters.length > 0);
    assert.ok(result.plan.executionNotes.length > 0);
    assert.ok(result.clientSnapshot.priorityTopics.length > 0);
    assert.equal("executionNotes" in result.clientSnapshot, false);
    assert.ok(result.executionLog.some((line) => line.includes("[OBSERVABILITY]")));
  });

  it("builds readable plan title and body", () => {
    const input = buildInput();
    const title = buildProductionPlanTitle(input.title);
    assert.match(title, /Production Plan — Test Workflow Brief/);

    const body = buildProductionPlanBodyFromContent({
      strategicSummary: "Summary",
      recommendedContentDirection: "Direction",
      priorityTopics: ["Topic A"],
      targetAudienceNotes: "Audience notes",
      positioningNotes: "Positioning notes",
      seoFocusAreas: ["SEO area"],
      suggestedContentClusters: [{ name: "Cluster 1", topics: ["Topic 1"] }],
      executionNotes: ["Internal note"]
    });
    assert.match(body, /Strategic summary/);
    assert.match(body, /Priority topics/);
    assert.match(body, /Cluster 1/);
  });

  it("composes approved knowledge section before plan context", () => {
    const composed = composeWorkflowBriefPlanContextText({
      ...buildInput(),
      approvedKnowledgeSection:
        "Approved knowledge context (admin-internal):\n- [CLIENT_FACT — CLIENT — v1] Known brand fact"
    });

    assert.ok(composed.startsWith("Approved knowledge context (admin-internal):"));
    assert.ok(composed.includes("Brief title: Test Workflow Brief"));
  });

  it("records knowledge context inclusion in execution log without raw body text", async () => {
    const result = await executeWorkflowBriefPlanGeneration(
      {
        ...buildInput(),
        approvedKnowledgeSection: "Approved knowledge context (admin-internal):\n- [CLIENT_FACT — CLIENT — v1] Secret body text",
        knowledgeContext: {
          used: true,
          selectedCount: 1,
          selectedItemTitles: ["Brand voice guide"],
          skippedReason: null,
          sanitizeFlagCount: 0,
          trimmed: false
        }
      },
      localConfig
    );

    assert.equal(result.ok, true);
    assert.ok(
      result.executionLog.some((line) => line.includes("Approved knowledge context included: 1 item(s)"))
    );
    assert.ok(result.executionLog.some((line) => line.includes("Brand voice guide")));
    assert.equal(
      result.executionLog.some((line) => line.includes("Secret body text")),
      false
    );
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("contextSection"), false);
    assert.equal(serialized.includes("selectedSourcesJson"), false);
  });
});
