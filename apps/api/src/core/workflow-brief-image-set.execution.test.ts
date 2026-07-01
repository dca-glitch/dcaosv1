import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorkflowBriefImageCandidate,
  buildWorkflowBriefImageNotes,
  canPrepareWorkflowBriefImageSetFromDraft,
  classifyImageSetItemState,
  computeImageSetStage,
  computePackageItemCompleteness,
  computeReleasePrepStage,
  isArticleImageLockedForRefresh,
  isWorkflowBriefArticleImage,
  summarizeImageSetBatchResult,
  WORKFLOW_BRIEF_IMAGE_MARKER
} from "./workflow-brief-image-set.execution";
import { WORKFLOW_BRIEF_DRAFT_MARKER } from "./workflow-brief-draft.execution";

describe("workflow-brief-image-set.execution", () => {
  const briefId = "brief-1";
  const itemId = "item-1";
  const draftId = "draft-1";

  it("builds workflow brief image candidate with lineage notes", () => {
    const notes = buildWorkflowBriefImageNotes(briefId, itemId, draftId);
    assert.ok(isWorkflowBriefArticleImage(notes, briefId));

    const candidate = buildWorkflowBriefImageCandidate({
      briefId,
      contentPlanItemId: itemId,
      contentDraftId: draftId,
      draftTitle: "How to grow leads",
      targetKeyword: "lead generation",
      briefTitle: "Q3 Campaign",
      goal: "Increase qualified leads"
    });

    assert.equal(candidate.status, "READY_FOR_GENERATION");
    assert.ok(candidate.prompt.includes("How to grow leads"));
    assert.ok(candidate.notes.includes(WORKFLOW_BRIEF_IMAGE_MARKER));
  });

  it("allows image prep for workflow brief drafts", () => {
    const eligible = canPrepareWorkflowBriefImageSetFromDraft(
      {
        notes: `[${WORKFLOW_BRIEF_DRAFT_MARKER} brief=${briefId} item=${itemId}]`,
        draftBody: "Body",
        isArchived: false,
        contentPlanItemId: itemId
      },
      briefId
    );
    assert.equal(eligible, true);
  });

  it("locks refresh for approved images", () => {
    assert.equal(isArticleImageLockedForRefresh("APPROVED"), true);
    assert.equal(isArticleImageLockedForRefresh("DRAFT"), false);
  });

  it("classifies image set item states", () => {
    assert.equal(
      classifyImageSetItemState({ isEligible: true, hasImage: false, imageStatus: null }),
      "missing"
    );
    assert.equal(
      classifyImageSetItemState({ isEligible: true, hasImage: true, imageStatus: "READY_FOR_GENERATION" }),
      "prepared"
    );
  });

  it("computes package item completeness", () => {
    const complete = computePackageItemCompleteness({
      hasTextDeliverable: true,
      textDeliverableStatus: "APPROVED_BY_CLIENT",
      hasImageCandidate: true,
      imageStatus: "APPROVED",
      imageApprovalStatus: null,
      deliverableStatus: "APPROVED_BY_CLIENT"
    });
    assert.equal(complete.packageComplete, true);
    assert.equal(complete.completenessStage, "package_complete");
  });

  it("computes release prep stage", () => {
    assert.equal(
      computeReleasePrepStage({
        packageComplete: false,
        publicationTargetAvailable: true,
        releasePrepared: false
      }),
      "not_ready"
    );
    assert.equal(
      computeReleasePrepStage({
        packageComplete: true,
        publicationTargetAvailable: true,
        releasePrepared: false
      }),
      "ready_for_release"
    );
  });

  it("summarizes image set batch outcomes", () => {
    const summary = summarizeImageSetBatchResult(["created", "reused", "skipped_locked"]);
    assert.equal(summary.created, 1);
    assert.equal(summary.reused, 1);
    assert.equal(summary.skippedLocked, 1);
  });

  it("computes image set stage", () => {
    assert.equal(
      computeImageSetStage({
        eligibleCount: 2,
        preparedCount: 2,
        pendingReviewCount: 0,
        reviewCompleteCount: 0
      }),
      "fully_prepared"
    );
  });
});
