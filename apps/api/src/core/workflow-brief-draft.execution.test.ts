import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDeterministicWorkflowBriefContentDraft,
  buildWorkflowBriefDraftLineageNote,
  executeWorkflowBriefDraftGeneration,
  isWorkflowBriefDraftForBrief,
  WORKFLOW_BRIEF_DRAFT_MARKER
} from "./workflow-brief-draft.execution";

describe("workflow-brief-draft.execution", () => {
  const baseInput = {
    briefId: "brief-1",
    briefTitle: "Q2 Content Workflow",
    goal: "Grow organic leads",
    targetAudience: "Marketing directors",
    businessContext: "B2B agency services",
    projectName: "Q2 SEO Project",
    targetMonth: "2026-07",
    planItem: {
      id: "item-1",
      title: "How to choose a content partner",
      targetKeyword: "content marketing strategy",
      contentType: "article",
      notes: "[workflow-brief-seed:v1 brief=brief-1 plan=plan-1] Cluster hub",
      sortOrder: 0
    },
    mi: {
      summary: "Strong demand for educational authority content.",
      audienceInsights: ["Marketing leaders want ROI proof"],
      competitorInsights: ["Competitors publish shallow guides"],
      marketSignals: ["Search demand rising"],
      opportunities: ["Own the content partner selection topic"],
      risks: ["Crowded SERP"],
      recommendedActions: ["Publish practical selection frameworks"]
    },
    seo: {
      keywordClusters: ["content marketing strategy"],
      topicIdeas: ["Content partner checklist"],
      contentAngles: ["Speak to marketing directors evaluating agencies"],
      internalLinkIdeas: ["Link to service pages"],
      seoNotes: ["Focus on informational intent"]
    },
    recommendedContentDirection: "Educational authority content",
    finishedAtIso: "2026-07-01T12:00:00.000Z"
  };

  it("builds substantial deterministic drafts with SEO context and lineage", () => {
    const draft = buildDeterministicWorkflowBriefContentDraft(baseInput);

    assert.ok(draft.title.length > 0);
    assert.ok(draft.draftBody.includes("content marketing strategy"));
    assert.ok(draft.draftBody.includes("How to choose a content partner"));
    assert.ok(draft.draftBody.length > 400);
    assert.ok((draft.notes ?? "").includes(WORKFLOW_BRIEF_DRAFT_MARKER));
    assert.ok(draft.slug);
  });

  it("tracks draft lineage notes per brief and item", () => {
    const note = buildWorkflowBriefDraftLineageNote("brief-1", "item-1", "Generated draft");
    assert.ok(isWorkflowBriefDraftForBrief(note, "brief-1"));
    assert.equal(isWorkflowBriefDraftForBrief(note, "brief-2"), false);
  });

  it("uses local deterministic path without provider config", async () => {
    const result = await executeWorkflowBriefDraftGeneration(baseInput, {
      textGateway: "local",
      preferredTextGateway: "openrouter",
      hasOpenRouterApiKey: false,
      openRouterBaseUrl: "https://openrouter.ai/api/v1",
      openRouterTextPrimaryModel: null,
      openRouterTextSecondaryModel: null,
      openRouterTextReviewerModel: null,
      openRouterTextLongContextModel: null
    });

    assert.equal(result.ok, true);
    assert.equal(result.meta.isDeterministic, true);
    assert.ok(result.draft.draftBody.length > 200);
    assert.equal(result.errorMessage, null);
  });
});
