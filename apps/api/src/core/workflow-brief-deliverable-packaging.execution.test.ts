import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorkflowBriefDeliverableNotes,
  buildWorkflowBriefDeliverablePayload,
  canPackageWorkflowBriefContentDraft,
  canRepackageWorkflowBriefDeliverable,
  classifyItemPackagingStateWithRejection,
  computePackagingStage,
  isDeliverableLockedForRepackage,
  isWorkflowBriefPackagedDeliverable,
  summarizeBatchPackagingResult,
  WORKFLOW_BRIEF_DELIVERABLE_MARKER
} from "./workflow-brief-deliverable-packaging.execution";
import { WORKFLOW_BRIEF_DRAFT_MARKER } from "./workflow-brief-draft.execution";

describe("workflow-brief-deliverable-packaging.execution", () => {
  const briefId = "brief-abc";
  const itemId = "item-1";
  const draftId = "draft-1";

  it("detects workflow brief packaged deliverable notes", () => {
    const notes = buildWorkflowBriefDeliverableNotes(briefId, itemId, draftId);
    assert.ok(notes.includes(WORKFLOW_BRIEF_DELIVERABLE_MARKER));
    assert.ok(isWorkflowBriefPackagedDeliverable(notes, briefId));
    assert.equal(isWorkflowBriefPackagedDeliverable(notes, "other-brief"), false);
  });

  it("allows packaging workflow brief drafts with body content", () => {
    const eligible = canPackageWorkflowBriefContentDraft(
      {
        notes: `[${WORKFLOW_BRIEF_DRAFT_MARKER} brief=${briefId} item=${itemId}]`,
        draftBody: "Article body",
        isArchived: false,
        contentPlanItemId: itemId
      },
      briefId
    );
    assert.equal(eligible, true);

    const ineligible = canPackageWorkflowBriefContentDraft(
      {
        notes: `[${WORKFLOW_BRIEF_DRAFT_MARKER} brief=${briefId} item=${itemId}]`,
        draftBody: "   ",
        isArchived: false,
        contentPlanItemId: itemId
      },
      briefId
    );
    assert.equal(ineligible, false);
  });

  it("builds deliverable payload from draft", () => {
    const payload = buildWorkflowBriefDeliverablePayload({
      briefId,
      productionPlanId: "plan-1",
      contentPlanItemId: itemId,
      contentDraftId: draftId,
      title: "Test title",
      draftBody: "Body content for review",
      slug: "test-title"
    });

    assert.equal(payload.deliveryType, "ARTICLE_DRAFT");
    assert.equal(payload.status, "DRAFT");
    assert.equal(payload.briefId, briefId);
    assert.equal(payload.contentDraftId, draftId);
    assert.equal(payload.bodyContent, "Body content for review");
    assert.ok(payload.notes.includes(briefId));
  });

  it("locks repackage for client review states", () => {
    assert.equal(isDeliverableLockedForRepackage("PENDING_CLIENT_REVIEW"), true);
    assert.equal(isDeliverableLockedForRepackage("APPROVED_BY_CLIENT"), true);
    assert.equal(canRepackageWorkflowBriefDeliverable({ status: "DRAFT", isArchived: false }), true);
    assert.equal(
      canRepackageWorkflowBriefDeliverable({ status: "PENDING_CLIENT_REVIEW", isArchived: false }),
      false
    );
  });

  it("classifies item packaging states", () => {
    assert.equal(
      classifyItemPackagingStateWithRejection({
        isEligible: true,
        hasDeliverable: false,
        deliverableStatus: null,
        clientRejectionReason: null
      }),
      "unpackaged"
    );
    assert.equal(
      classifyItemPackagingStateWithRejection({
        isEligible: true,
        hasDeliverable: true,
        deliverableStatus: "PENDING_CLIENT_REVIEW",
        clientRejectionReason: null
      }),
      "pending_review"
    );
    assert.equal(
      classifyItemPackagingStateWithRejection({
        isEligible: true,
        hasDeliverable: true,
        deliverableStatus: "DRAFT",
        clientRejectionReason: "Please revise intro"
      }),
      "rejected"
    );
  });

  it("computes packaging stage", () => {
    assert.equal(
      computePackagingStage({
        eligibleDraftCount: 0,
        packagedCount: 0,
        pendingReviewCount: 0,
        approvedByClientCount: 0
      }),
      "none"
    );
    assert.equal(
      computePackagingStage({
        eligibleDraftCount: 2,
        packagedCount: 0,
        pendingReviewCount: 0,
        approvedByClientCount: 0
      }),
      "drafts_only"
    );
    assert.equal(
      computePackagingStage({
        eligibleDraftCount: 2,
        packagedCount: 2,
        pendingReviewCount: 1,
        approvedByClientCount: 0
      }),
      "in_client_review"
    );
  });

  it("summarizes batch packaging outcomes", () => {
    const summary = summarizeBatchPackagingResult(["created", "reused", "skipped_locked", "created"]);
    assert.equal(summary.created, 2);
    assert.equal(summary.reused, 1);
    assert.equal(summary.skippedLocked, 1);
  });
});
