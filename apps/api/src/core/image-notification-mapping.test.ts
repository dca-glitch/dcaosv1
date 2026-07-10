import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IMAGE_NOTIFICATION_EXISTING_EVENTS,
  IMAGE_NOTIFICATION_NEEDED_EVENTS,
  listExistingImageNotificationEvents,
  listNeededImageNotificationEvents,
  mapImageApprovalTransitionToNotification,
  mapImageStateChangeToNotification
} from "./image-notification-mapping";

describe("image-notification-mapping", () => {
  it("G194 maps admin approve to existing image_set_ready_for_client_review", () => {
    const mapping = mapImageStateChangeToNotification({
      fromState: "candidate_generated",
      toState: "admin_approved",
      transition: "admin_approve"
    });

    assert.ok(mapping);
    assert.equal(mapping.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_set_ready_for_client_review);
    assert.equal(mapping.taxonomyStatus, "existing");
    assert.deepEqual(mapping.audiences, ["client"]);
  });

  it("G194 maps client approve/reject to existing taxonomy events", () => {
    const approved = mapImageApprovalTransitionToNotification({
      from: "admin_approved",
      to: "client_approved",
      transition: "client_approve"
    });
    assert.ok(approved);
    assert.equal(approved.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.client_image_approved);
    assert.equal(approved.taxonomyStatus, "existing");

    const rejected = mapImageApprovalTransitionToNotification({
      from: "admin_approved",
      to: "client_rejected",
      transition: "client_reject"
    });
    assert.ok(rejected);
    assert.equal(rejected.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.client_image_rejected);
    assert.equal(rejected.taxonomyStatus, "existing");
  });

  it("G194 maps admin reject / replacement / final with shared taxonomy events", () => {
    const adminRejected = mapImageStateChangeToNotification({
      fromState: "candidate_generated",
      toState: "admin_rejected",
      transition: "admin_reject"
    });
    assert.ok(adminRejected);
    assert.equal(adminRejected.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_admin_rejected);
    assert.equal(adminRejected.taxonomyStatus, "existing");

    const replacement = mapImageStateChangeToNotification({
      fromState: "client_rejected",
      toState: "replacement_requested",
      transition: "request_replacement"
    });
    assert.ok(replacement);
    assert.equal(replacement.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_replacement_requested);

    const finalAccepted = mapImageStateChangeToNotification({
      fromState: "client_approved",
      toState: "final_accepted",
      transition: "accept_final"
    });
    assert.ok(finalAccepted);
    assert.equal(finalAccepted.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_final_accepted);

    const candidateReady = mapImageStateChangeToNotification({
      fromState: "replacement_requested",
      toState: "candidate_generated",
      transition: "replacement_candidate_ready"
    });
    assert.ok(candidateReady);
    assert.equal(candidateReady.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_candidate_generated);
  });

  it("G194 reports all mapped events as existing after G228 taxonomy integration", () => {
    const existing = listExistingImageNotificationEvents();
    const needed = listNeededImageNotificationEvents();

    assert.ok(existing.includes("image_set_ready_for_client_review"));
    assert.ok(existing.includes("client_image_approved"));
    assert.ok(existing.includes("client_image_rejected"));
    assert.ok(existing.includes("admin_action_required"));
    assert.ok(existing.includes("image_candidate_generated"));
    assert.ok(existing.includes("image_admin_rejected"));
    assert.ok(existing.includes("image_replacement_requested"));
    assert.ok(existing.includes("image_final_accepted"));

    assert.equal(needed.length, 0);
    assert.ok(IMAGE_NOTIFICATION_NEEDED_EVENTS.image_candidate_generated);
  });

  it("G194/G319 returns null for no-op same-state changes", () => {
    const noop = mapImageStateChangeToNotification({
      fromState: "candidate_generated",
      toState: "candidate_generated",
      transition: "generate_candidate"
    });
    assert.equal(noop, null);
  });

  it("G319 maps admin_rejected replacement_candidate_ready to image_candidate_generated", () => {
    const mapping = mapImageStateChangeToNotification({
      fromState: "admin_rejected",
      toState: "candidate_generated",
      transition: "replacement_candidate_ready"
    });
    assert.ok(mapping);
    assert.equal(mapping.eventType, IMAGE_NOTIFICATION_EXISTING_EVENTS.image_candidate_generated);
    assert.deepEqual(mapping.audiences, ["admin"]);
  });
});
