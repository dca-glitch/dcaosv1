import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPROVAL_NOTIFICATION_EXISTING_EVENTS,
  APPROVAL_NOTIFICATION_MAPPING_VERSION,
  getApprovalNotificationMappingContract,
  listApprovalNotificationExistingEvents,
  listRuntimeWiredApprovalSignals,
  mapAdminAlertAfterClientAction,
  mapApprovalSignalToNotification,
  mapMonthlyReportAvailabilityNotification
} from "./approval-notification-mapping";

describe("G581 monthly report availability notification policy", () => {
  it("maps FINAL monthly report availability to monthly_report_available", () => {
    const mapped = mapMonthlyReportAvailabilityNotification();
    assert.equal(mapped.version, APPROVAL_NOTIFICATION_MAPPING_VERSION);
    assert.equal(mapped.signal, "monthly_report_final_available");
    assert.equal(mapped.eventType, APPROVAL_NOTIFICATION_EXISTING_EVENTS.monthly_report_available);
    assert.deepEqual(mapped.audiences.sort(), ["admin", "client"]);
    assert.equal(mapped.runtimeWired, false);
    assert.equal(mapped.sendDefault, "no_send_until_owner_gate");
  });
});

describe("G582 admin alert after client action", () => {
  it("maps deliverable approve/request-changes to admin-facing events with alert", () => {
    const approved = mapAdminAlertAfterClientAction({ clientAction: "approve_deliverable" });
    assert.ok(approved);
    assert.equal(approved.eventType, "content_approved");
    assert.equal(approved.adminAlertEventType, "admin_alert_after_client_action");
    assert.equal(approved.audiences.includes("admin"), true);
    assert.equal(approved.runtimeWired, true);

    const changes = mapAdminAlertAfterClientAction({ clientAction: "request_changes" });
    assert.ok(changes);
    assert.equal(changes.eventType, "content_changes_requested");
    assert.equal(changes.adminAlertEventType, "admin_alert_after_client_action");
  });

  it("maps image reject to image_rejected_with_reason and optional admin alert", () => {
    const rejected = mapAdminAlertAfterClientAction({ clientAction: "reject_image" });
    assert.ok(rejected);
    assert.equal(rejected.eventType, "image_rejected_with_reason");
    assert.equal(rejected.adminAlertEventType, "admin_alert_after_client_action");
    assert.equal(rejected.runtimeWired, false);
  });

  it("does not emit admin alert for undo_image_review", () => {
    assert.equal(mapAdminAlertAfterClientAction({ clientAction: "undo_image_review" }), null);
  });
});

describe("G583 approval event-to-notification map", () => {
  it("exposes a complete contract with no proposed new taxonomy keys", () => {
    const contract = getApprovalNotificationMappingContract();
    assert.equal(contract.version, APPROVAL_NOTIFICATION_MAPPING_VERSION);
    assert.equal(contract.lane3Ownership, "notification-events_owned_elsewhere");
    assert.deepEqual(contract.proposedNewEventKeys, []);
    assert.equal(contract.mappings.length >= 7, true);
  });

  it("maps send-for-review to client_approval_needed", () => {
    const mapped = mapApprovalSignalToNotification("content_sent_for_client_review");
    assert.equal(mapped.eventType, "client_approval_needed");
    assert.deepEqual(mapped.audiences, ["client"]);
    assert.equal(mapped.runtimeWired, true);
  });

  it("lists only existing shared taxonomy event names", () => {
    const events = listApprovalNotificationExistingEvents();
    assert.equal(events.includes("client_approval_needed"), true);
    assert.equal(events.includes("content_approved"), true);
    assert.equal(events.includes("admin_alert_after_client_action"), true);
    assert.equal(events.includes("monthly_report_available"), true);
    assert.equal(events.includes("brand_new_invented_event"), false);
  });

  it("identifies currently runtime-wired signals", () => {
    const wired = listRuntimeWiredApprovalSignals();
    assert.equal(wired.includes("content_sent_for_client_review"), true);
    assert.equal(wired.includes("content_approved_by_client"), true);
    assert.equal(wired.includes("content_changes_requested_by_client"), true);
    assert.equal(wired.includes("admin_alert_after_client_action"), true);
    assert.equal(wired.includes("image_rejected_by_client"), false);
    assert.equal(wired.includes("monthly_report_final_available"), false);
  });
});
