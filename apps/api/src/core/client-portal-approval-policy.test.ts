import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateClientPortalApprovalAction } from "./client-portal-approval-policy";

describe("client portal approval action policy (G202/G333–G335)", () => {
  it("allows approve when pending and all images reviewed, and notifies admin", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageApprovals: [{ articleImageId: "img-1", status: "APPROVED" }]
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.nextDeliverableStatus, "APPROVED_BY_CLIENT");
    assert.equal(result.notifyAdmin, true);
    assert.equal(result.notificationKind, "AI_DELIVERY_APPROVED");
  });

  it("blocks approve when images are still pending", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageApprovals: [{ articleImageId: "img-1", status: "PENDING" }]
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "IMAGES_PENDING");
  });

  it("blocks approve when already approved or not pending review", () => {
    const already = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "APPROVED_BY_CLIENT"
    });
    assert.equal(already.ok, false);
    if (!already.ok) assert.equal(already.code, "ALREADY_APPROVED");

    const notPending = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "DRAFT"
    });
    assert.equal(notPending.ok, false);
    if (!notPending.ok) assert.equal(notPending.code, "NOT_PENDING_REVIEW");
  });

  it("allows request changes with reason, one revision round, and admin notify", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "Please tighten the intro",
      revisionRoundUsed: false
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.nextDeliverableStatus, "DRAFT");
    assert.equal(result.notifyAdmin, true);
    assert.equal(result.notificationKind, "AI_DELIVERY_REVIEW_REQUEST");
    assert.equal(result.revisionRoundConsumed, true);
    assert.equal(result.sanitizedReason, "Please tighten the intro");
  });

  it("requires a reason for request_changes", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "  ",
      revisionRoundUsed: false
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "REASON_REQUIRED");
  });

  it("blocks a second revision round (one-revision-round design)", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "Another pass",
      revisionRoundUsed: true
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "REVISION_ROUND_EXHAUSTED");
    assert.equal(result.message.includes("one revision round"), true);
  });

  it("allows image approve and undo without admin notify", () => {
    const approve = evaluateClientPortalApprovalAction({
      action: "approve_image",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageId: "img-1"
    });
    assert.equal(approve.ok, true);
    if (approve.ok) {
      assert.equal(approve.nextImageStatus, "APPROVED");
      assert.equal(approve.notifyAdmin, false);
    }

    const undo = evaluateClientPortalApprovalAction({
      action: "undo_image_review",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageId: "img-1"
    });
    assert.equal(undo.ok, true);
    if (undo.ok) {
      assert.equal(undo.nextImageStatus, "PENDING");
      assert.equal(undo.notifyAdmin, false);
    }
  });

  it("requires a reason when rejecting an image", () => {
    const missing = evaluateClientPortalApprovalAction({
      action: "reject_image",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageId: "img-1",
      reason: "   "
    });
    assert.equal(missing.ok, false);
    if (missing.ok) return;
    assert.equal(missing.code, "REASON_REQUIRED");

    const ok = evaluateClientPortalApprovalAction({
      action: "reject_image",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageId: "img-1",
      reason: "Wrong product shown"
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.nextImageStatus, "REJECTED");
    assert.equal(ok.notifyAdmin, false);
  });

  it("rejects unknown image ids with client-safe message", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "approve_image",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1"],
      imageId: "missing"
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "IMAGE_NOT_FOUND");
    assert.equal(result.message.includes("storageKey"), false);
  });
});
