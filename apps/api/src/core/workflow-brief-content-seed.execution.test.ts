import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorkflowBriefSeedContentPlanItems,
  buildWorkflowBriefSeedLineageNote,
  isWorkflowBriefSeedItemForBrief,
  WORKFLOW_BRIEF_SEED_MARKER
} from "./workflow-brief-content-seed.execution";

describe("workflow-brief-content-seed.execution", () => {
  it("builds usable content plan items from production plan clusters and SEO topics", () => {
    const items = buildWorkflowBriefSeedContentPlanItems({
      briefId: "brief-1",
      productionPlanId: "plan-1",
      planJson: {
        recommendedContentDirection: "Educational authority content",
        priorityTopics: ["How to choose a content partner"],
        seoFocusAreas: ["content marketing strategy"],
        suggestedContentClusters: [
          { name: "content marketing strategy", topics: ["Strategy guide", "ROI checklist"] }
        ]
      },
      clientVisibleSnapshotJson: null,
      seoReportJson: {
        keywordClusters: ["content marketing strategy", "seo retainer"],
        topicIdeas: ["Monthly SEO planning guide"],
        contentAngles: ["Speak to marketing directors"]
      }
    });

    assert.ok(items.length >= 2);
    assert.ok(items.every((item) => item.title.length > 0));
    assert.ok(items.every((item) => (item.notes ?? "").includes(WORKFLOW_BRIEF_SEED_MARKER)));
    assert.ok(items.some((item) => item.targetKeyword?.includes("content marketing")));
  });

  it("tracks lineage notes per brief and plan", () => {
    const note = buildWorkflowBriefSeedLineageNote("brief-1", "plan-1", "Cluster: SEO hub");
    assert.ok(isWorkflowBriefSeedItemForBrief(note, "brief-1"));
    assert.equal(isWorkflowBriefSeedItemForBrief(note, "brief-2"), false);
  });
});
