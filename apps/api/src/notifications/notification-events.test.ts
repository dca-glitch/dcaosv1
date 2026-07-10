import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPROVAL_REJECT_NOTIFICATION_MATRIX,
  EMAIL_TEMPLATE_INVENTORY,
  NOTIFICATION_EVENT_DEFINITIONS,
  buildNotificationAuditMetadata,
  isNotificationEventType,
  mapBusinessEventToNotification,
  resolveNotificationChannelPolicy
} from "@dca-os-v1/shared";

describe("notification event taxonomy", () => {
  it("defines the Puriva launch notification events", () => {
    assert.equal(isNotificationEventType("article_ready_for_client_review"), true);
    assert.equal(isNotificationEventType("monthly_report_final"), true);
    assert.equal(isNotificationEventType("client_image_rejected"), true);
    assert.equal(isNotificationEventType("not_a_real_notification"), false);
  });

  it("keeps every event mapped to a schema-compatible email template key", () => {
    const templateKeys = new Set(Object.keys(EMAIL_TEMPLATE_INVENTORY));
    for (const definition of Object.values(NOTIFICATION_EVENT_DEFINITIONS)) {
      assert.equal(templateKeys.has(definition.schemaTemplateKey), true, definition.eventType);
    }
  });
});

describe("event-to-notification mapping", () => {
  it("maps content review to required client channels", () => {
    const mapping = mapBusinessEventToNotification("CONTENT_SENT_FOR_CLIENT_REVIEW");

    assert.equal(mapping.eventType, "article_ready_for_client_review");
    assert.deepEqual(mapping.audiences, ["client"]);
    assert.deepEqual(mapping.requiredChannels, ["in_system", "email"]);
    assert.equal(mapping.schemaTemplateKey, "AI_DELIVERY_REVIEW_REQUEST");
  });

  it("maps monthly report final to client and admin launch-critical notification", () => {
    const mapping = mapBusinessEventToNotification("MONTHLY_REPORT_FINAL");

    assert.equal(mapping.eventType, "monthly_report_final");
    assert.equal(mapping.priority, "launch_critical");
    assert.deepEqual(mapping.audiences, ["client", "admin"]);
  });
});

describe("notification priority and channel policy", () => {
  it("requires in-system persistence even when email is configured", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "client_deliverable_approved",
      emailProvider: "resend",
      hasEmailProviderKey: true,
      hasInSystemPersistence: false
    });

    assert.equal(policy.inSystem.required, true);
    assert.equal(policy.inSystem.status, "blocked_no_persistence");
    assert.equal(policy.email.required, true);
    assert.equal(policy.email.status, "configured_not_live_proven");
  });

  it("keeps local launch-critical email in no-send mode", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "client_deliverable_rejected",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: true
    });

    assert.equal(policy.email.required, true);
    assert.equal(policy.email.status, "no_send_local");
  });

  it("treats phone as supplement only and insufficient for launch claims", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "monthly_report_final",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: false
    });

    assert.equal(policy.phone.allowedForLaunchClaim, false);
    assert.equal(policy.phone.reason, "phone_is_supplement_only");
  });
});

describe("approval and reject notification matrix", () => {
  it("marks deliverable approval and rejection as admin launch-critical notifications", () => {
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableApproved.priority, "launch_critical");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableApproved.audiences, ["admin"]);
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableRejected.requiredChannels, ["in_system", "email"]);
  });

  it("keeps image rejection launch-critical while image approval remains high priority", () => {
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageRejected.priority, "launch_critical");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageRejected.requiredChannels, ["in_system", "email"]);
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageApproved.priority, "high");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageApproved.requiredChannels, ["in_system"]);
  });
});

describe("notification audit metadata builder", () => {
  it("builds a stable audit metadata shape with channel policy", () => {
    const metadata = buildNotificationAuditMetadata({
      eventType: "client_deliverable_rejected",
      tenantId: "tenant_1",
      clientId: "client_1",
      actorUserId: "user_1",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      correlationId: "corr_1",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: false
    });

    assert.equal(metadata.version, "NOTIFICATION_EVENTS_V1");
    assert.equal(metadata.templateKey, "AI_DELIVERY_REVIEW_REQUEST");
    assert.equal(metadata.channelPolicy.inSystem.status, "blocked_no_persistence");
    assert.equal(metadata.channelPolicy.email.status, "no_send_local");
  });

  it("does not serialize secret-like provider key values", () => {
    const metadata = buildNotificationAuditMetadata({
      eventType: "monthly_report_final",
      tenantId: "tenant_1",
      relatedEntityType: "monthlyReport",
      relatedEntityId: "report_1",
      emailProvider: "resend",
      hasEmailProviderKey: true,
      hasInSystemPersistence: true
    });

    const serialized = JSON.stringify(metadata);
    assert.equal(serialized.includes("RESEND_API_KEY"), false);
    assert.equal(serialized.includes("re_test"), false);
    assert.equal(metadata.channelPolicy.email.status, "configured_not_live_proven");
  });
});

describe("email template inventory", () => {
  it("lists only schema-safe template keys and marks generic reuse where dedicated keys are blocked", () => {
    assert.deepEqual(Object.keys(EMAIL_TEMPLATE_INVENTORY).sort(), [
      "AI_DELIVERY_APPROVED",
      "AI_DELIVERY_BRIEF_REQUEST",
      "AI_DELIVERY_REVIEW_REQUEST",
      "CLIENT_INVITE",
      "INVOICE_ISSUED",
      "PASSWORD_RESET"
    ]);
    assert.equal(EMAIL_TEMPLATE_INVENTORY.AI_DELIVERY_REVIEW_REQUEST.dedicatedTemplateBlockedBySchema, true);
    assert.equal(EMAIL_TEMPLATE_INVENTORY.AI_DELIVERY_BRIEF_REQUEST.dedicatedTemplateBlockedBySchema, false);
  });
});
