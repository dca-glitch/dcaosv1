/**
 * Canonical AI Delivery deliverable status policy regression tests.
 *
 * Covers: valid status set (incl. client-review states), transition matrix, classification,
 * unknown/legacy label safety, and cross-layer alignment (controller/runtime must accept the
 * same client-review states — the enum-drift regression that produced spurious 400s).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AI_DELIVERY_DELIVERABLE_STATUSES,
  canTransitionAiDeliveryDeliverableStatus,
  checkAiDeliveryDeliverableTransition,
  formatAiDeliveryDeliverableStatusLabel,
  isApprovedFinalDeliverableStatus,
  isClientReviewDeliverableStatus,
  isEditableDeliverableStatus,
  isRevisionRequestedDeliverableStatus,
  isWorkflowControlledDeliverableStatus,
  parseAiDeliveryDeliverableStatus
} from "@dca-os-v1/shared";
import { evaluateClientPortalApprovalAction } from "./client-portal-approval-policy";
import { CLIENT_REVISION_ROUND_LIMIT } from "./revision-policy";

describe("canonical deliverable status set", () => {
  it("includes every persisted status including client-review states", () => {
    assert.deepEqual(
      [...AI_DELIVERY_DELIVERABLE_STATUSES].sort(),
      [
        "ACCEPTED",
        "APPROVED_BY_CLIENT",
        "ARCHIVED",
        "DELIVERED",
        "DRAFT",
        "PENDING_CLIENT_REVIEW",
        "READY",
        "REVISION_REQUESTED"
      ]
    );
  });

  it("parses case-insensitively and rejects unknown values", () => {
    assert.equal(parseAiDeliveryDeliverableStatus("pending_client_review"), "PENDING_CLIENT_REVIEW");
    assert.equal(parseAiDeliveryDeliverableStatus("  Approved_By_Client "), "APPROVED_BY_CLIENT");
    assert.equal(parseAiDeliveryDeliverableStatus("NONSENSE"), null);
    assert.equal(parseAiDeliveryDeliverableStatus(null), null);
  });
});

describe("deliverable transition matrix", () => {
  it("allows the canonical client-review lifecycle transitions", () => {
    assert.equal(canTransitionAiDeliveryDeliverableStatus("DRAFT", "PENDING_CLIENT_REVIEW"), true);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("REVISION_REQUESTED", "PENDING_CLIENT_REVIEW"), true);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("PENDING_CLIENT_REVIEW", "APPROVED_BY_CLIENT"), true);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("PENDING_CLIENT_REVIEW", "REVISION_REQUESTED"), true);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("ARCHIVED", "DRAFT"), true);
  });

  it("treats same-status as an idempotent no-op", () => {
    assert.equal(canTransitionAiDeliveryDeliverableStatus("PENDING_CLIENT_REVIEW", "PENDING_CLIENT_REVIEW"), true);
  });

  it("blocks illegal jumps", () => {
    assert.equal(canTransitionAiDeliveryDeliverableStatus("DRAFT", "APPROVED_BY_CLIENT"), false);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("APPROVED_BY_CLIENT", "DRAFT"), false);
    assert.equal(canTransitionAiDeliveryDeliverableStatus("PENDING_CLIENT_REVIEW", "READY"), false);

    const check = checkAiDeliveryDeliverableTransition("DRAFT", "APPROVED_BY_CLIENT");
    assert.equal(check.ok, false);
    if (check.ok) return;
    assert.equal(check.code, "AI_DELIVERY_DELIVERABLE_TRANSITION_BLOCKED");
  });
});

describe("deliverable status classification", () => {
  it("classifies editable, client-review, revision, and final states", () => {
    assert.equal(isEditableDeliverableStatus("DRAFT"), true);
    assert.equal(isEditableDeliverableStatus("REVISION_REQUESTED"), true);
    assert.equal(isEditableDeliverableStatus("PENDING_CLIENT_REVIEW"), false);
    assert.equal(isClientReviewDeliverableStatus("PENDING_CLIENT_REVIEW"), true);
    assert.equal(isRevisionRequestedDeliverableStatus("REVISION_REQUESTED"), true);
    assert.equal(isApprovedFinalDeliverableStatus("APPROVED_BY_CLIENT"), true);
    assert.equal(isApprovedFinalDeliverableStatus("ACCEPTED"), true);
  });

  it("marks every non-draft state as workflow-controlled (not freely editable)", () => {
    assert.equal(isWorkflowControlledDeliverableStatus("DRAFT"), false);
    for (const status of AI_DELIVERY_DELIVERABLE_STATUSES) {
      if (status === "DRAFT") continue;
      assert.equal(isWorkflowControlledDeliverableStatus(status), true, `${status} should be workflow-controlled`);
    }
  });
});

describe("status label safety", () => {
  it("renders human-readable labels for client-review states", () => {
    assert.equal(formatAiDeliveryDeliverableStatusLabel("PENDING_CLIENT_REVIEW"), "Pending client review");
    assert.equal(formatAiDeliveryDeliverableStatusLabel("APPROVED_BY_CLIENT"), "Approved by client");
    assert.equal(formatAiDeliveryDeliverableStatusLabel("REVISION_REQUESTED"), "Revision requested");
  });

  it("never silently coerces an unknown/legacy status to a Draft label", () => {
    const label = formatAiDeliveryDeliverableStatusLabel("SOME_LEGACY_STATUS");
    assert.notEqual(label, "Draft / packaging");
    assert.equal(label, "Some Legacy Status");
  });
});

describe("one-client-revision derivation (persisted-count → policy flag)", () => {
  it("allows the first revision request and blocks the second based on prior count", () => {
    const firstRound = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "Please tighten the intro",
      revisionRoundUsed: 0 >= CLIENT_REVISION_ROUND_LIMIT
    });
    assert.equal(firstRound.ok, true);
    if (firstRound.ok) {
      assert.equal(firstRound.nextDeliverableStatus, "REVISION_REQUESTED");
      assert.equal(firstRound.revisionRoundConsumed, true);
    }

    const secondRound = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      reason: "More changes please",
      revisionRoundUsed: 1 >= CLIENT_REVISION_ROUND_LIMIT
    });
    assert.equal(secondRound.ok, false);
    if (!secondRound.ok) {
      assert.equal(secondRound.code, "REVISION_ROUND_EXHAUSTED");
    }
  });
});
