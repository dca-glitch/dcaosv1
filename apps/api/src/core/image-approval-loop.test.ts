import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyImageApprovalLoopTransition,
  assertImageFinalAcceptedInvariant,
  IMAGE_APPROVAL_LOOP_STATES,
  IMAGE_APPROVAL_LOOP_TRANSITIONS,
  isTerminalImageApprovalState,
  listImageApprovalLoopTransitions
} from "./image-approval-loop";

describe("image-approval-loop", () => {
  it("G193/G317 exposes the required approval-loop states", () => {
    assert.deepEqual(IMAGE_APPROVAL_LOOP_STATES, [
      "candidate_generated",
      "admin_approved",
      "admin_rejected",
      "client_approved",
      "client_rejected",
      "replacement_requested",
      "final_accepted"
    ]);
    assert.ok(IMAGE_APPROVAL_LOOP_TRANSITIONS.includes("accept_final"));
  });

  it("G193/G317 walks the happy path to final_accepted", () => {
    const adminApprove = applyImageApprovalLoopTransition("candidate_generated", "admin_approve");
    assert.equal(adminApprove.ok, true);
    if (adminApprove.ok) {
      assert.equal(adminApprove.to, "admin_approved");
      assert.equal(adminApprove.requiresRejectReason, false);
    }

    const clientApprove = applyImageApprovalLoopTransition("admin_approved", "client_approve");
    assert.equal(clientApprove.ok, true);
    if (clientApprove.ok) {
      assert.equal(clientApprove.to, "client_approved");
    }

    const acceptFinal = applyImageApprovalLoopTransition("client_approved", "accept_final");
    assert.equal(acceptFinal.ok, true);
    if (acceptFinal.ok) {
      assert.equal(acceptFinal.to, "final_accepted");
    }

    assert.equal(isTerminalImageApprovalState("final_accepted"), true);
  });

  it("G193/G317 requires reject reason on reject and replacement paths", () => {
    const adminReject = applyImageApprovalLoopTransition("candidate_generated", "admin_reject");
    assert.equal(adminReject.ok, true);
    if (adminReject.ok) {
      assert.equal(adminReject.to, "admin_rejected");
      assert.equal(adminReject.requiresRejectReason, true);
    }

    const clientReject = applyImageApprovalLoopTransition("admin_approved", "client_reject");
    assert.equal(clientReject.ok, true);
    if (clientReject.ok) {
      assert.equal(clientReject.to, "client_rejected");
      assert.equal(clientReject.requiresRejectReason, true);
    }

    const replacement = applyImageApprovalLoopTransition("client_rejected", "request_replacement");
    assert.equal(replacement.ok, true);
    if (replacement.ok) {
      assert.equal(replacement.to, "replacement_requested");
      assert.equal(replacement.requiresRejectReason, true);
    }

    const ready = applyImageApprovalLoopTransition("replacement_requested", "replacement_candidate_ready");
    assert.equal(ready.ok, true);
    if (ready.ok) {
      assert.equal(ready.to, "candidate_generated");
    }
  });

  it("G318 rejects illegal transitions from final_accepted and other invalid edges", () => {
    const illegal = applyImageApprovalLoopTransition("final_accepted", "admin_approve");
    assert.equal(illegal.ok, false);
    assert.deepEqual(listImageApprovalLoopTransitions("final_accepted"), []);

    const skipClient = applyImageApprovalLoopTransition("candidate_generated", "client_approve");
    assert.equal(skipClient.ok, false);

    const acceptTooEarly = applyImageApprovalLoopTransition("admin_approved", "accept_final");
    assert.equal(acceptTooEarly.ok, false);

    const fromClientApprovedToAdmin = applyImageApprovalLoopTransition(
      "client_approved",
      "admin_approve"
    );
    assert.equal(fromClientApprovedToAdmin.ok, false);
  });

  it("G321 enforces final_accepted invariant with alt and compliance gates", () => {
    const ok = assertImageFinalAcceptedInvariant({
      approvalState: "final_accepted",
      hasAltText: true,
      altTextAllowed: true,
      complianceAllowed: true
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.ok(ok.checks.includes("INVARIANT:final_accepted_ready"));
    }

    const notFinal = assertImageFinalAcceptedInvariant({
      approvalState: "client_approved",
      hasAltText: true
    });
    assert.equal(notFinal.ok, false);

    const noAlt = assertImageFinalAcceptedInvariant({
      approvalState: "final_accepted",
      hasAltText: false
    });
    assert.equal(noAlt.ok, false);

    const badAlt = assertImageFinalAcceptedInvariant({
      approvalState: "final_accepted",
      hasAltText: true,
      altTextAllowed: false
    });
    assert.equal(badAlt.ok, false);

    const badCompliance = assertImageFinalAcceptedInvariant({
      approvalState: "final_accepted",
      hasAltText: true,
      complianceAllowed: false
    });
    assert.equal(badCompliance.ok, false);
  });
});
