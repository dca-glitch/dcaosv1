import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateClientPortalApprovalAction } from "./client-portal-approval-policy";

describe("client portal approval action policy (G202)", () => {
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

  it("blocks a second revision round", () => {
    const result = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "Another pass",
      revisionRoundUsed: true
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "REVISION_ROUND_EXHAUSTED");
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
});
