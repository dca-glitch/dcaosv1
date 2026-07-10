import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateClientPortalApprovalAction,
  evaluateImageRejectReasonPolicy,
  evaluateRequestChangesReasonPolicy,
  getClientPortalApprovalPolicyMessage
} from "./client-portal-approval-policy";

describe("G577 content approval policy", () => {
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

  it("allows approve with no images attached", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: [],
      imageApprovals: []
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.nextDeliverableStatus, "APPROVED_BY_CLIENT");
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
    assert.equal(result.message, getClientPortalApprovalPolicyMessage("IMAGES_PENDING"));
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

  it("treats rejected images as reviewed for deliverable approve", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      imageIds: ["img-1", "img-2"],
      imageApprovals: [
        { articleImageId: "img-1", status: "APPROVED" },
        { articleImageId: "img-2", status: "REJECTED" }
      ]
    });
    assert.equal(result.ok, true);
  });
});

describe("G578 request changes policy", () => {
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

  it("trims request-changes reason via reason policy helper", () => {
    const reason = evaluateRequestChangesReasonPolicy("  Needs clearer CTA  ");
    assert.equal(reason.ok, true);
    if (!reason.ok) return;
    assert.equal(reason.sanitizedReason, "Needs clearer CTA");
  });

  it("blocks request_changes when not pending review", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "DRAFT",
      reason: "Too late",
      revisionRoundUsed: false
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "NOT_PENDING_REVIEW");
  });
});

describe("G579 one revision round design", () => {
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

  it("consumes the revision round on first successful request_changes", () => {
    const first = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "First pass",
      revisionRoundUsed: false
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.revisionRoundConsumed, true);
  });
});

describe("G580 image approval/reject reason policy", () => {
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
    assert.equal(ok.sanitizedReason, "Wrong product shown");
  });

  it("exposes image reject reason helper for empty and valid reasons", () => {
    const empty = evaluateImageRejectReasonPolicy(null);
    assert.equal(empty.ok, false);
    if (empty.ok) return;
    assert.equal(empty.code, "REASON_REQUIRED");

    const valid = evaluateImageRejectReasonPolicy("  Crop tighter  ");
    assert.equal(valid.ok, true);
    if (!valid.ok) return;
    assert.equal(valid.sanitizedReason, "Crop tighter");
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
