import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPROVAL_REJECT_NOTIFICATION_MATRIX,
  EMAIL_TEMPLATE_INVENTORY,
  G159_REQUIRED_EVENT_TYPES,
  NOTIFICATION_EVENT_DEFINITIONS,
  TYPED_NOTIFICATION_TEMPLATE_CATALOG,
  buildNotificationAuditMetadata,
  isNotificationEventType,
  isTypedNotificationTemplateKey,
  mapBusinessEventToNotification,
  redactNotificationPayload,
  resolveNotificationChannelPolicy,
  resolveNotificationRecipientPolicy,
  resolveTypedTemplateToSchemaKey
} from "@dca-os-v1/shared";

describe("G159 notification event taxonomy", () => {
  it("defines every required G159 event type", () => {
    for (const eventType of G159_REQUIRED_EVENT_TYPES) {
      assert.equal(isNotificationEventType(eventType), true, eventType);
      assert.equal(NOTIFICATION_EVENT_DEFINITIONS[eventType].eventType, eventType);
    }
  });

  it("keeps legacy G94-G102 event types valid", () => {
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

describe("G160 recipient policy helper", () => {
  it("resolves admin / client / owner-operator / system-log-only roles without side effects", () => {
    const clientPolicy = resolveNotificationRecipientPolicy({ eventType: "client_approval_needed" });
    assert.deepEqual(clientPolicy.roles, ["client"]);
    assert.equal(clientPolicy.systemLogOnly, false);

    const adminPolicy = resolveNotificationRecipientPolicy({ eventType: "admin_alert_after_client_action" });
    assert.ok(adminPolicy.roles.includes("admin"));
    assert.ok(adminPolicy.roles.includes("owner_operator"));

    const proofPolicy = resolveNotificationRecipientPolicy({ eventType: "external_proof_failed" });
    assert.ok(proofPolicy.roles.includes("system_log_only"));
    assert.ok(proofPolicy.roles.includes("admin"));
  });

  it("maps business events to recipient roles", () => {
    const mapping = mapBusinessEventToNotification("STORAGE_PROOF_FAILED");
    assert.equal(mapping.eventType, "storage_proof_failed");
    assert.ok(mapping.recipientRoles.includes("system_log_only"));
  });
});

describe("G161 channel policy", () => {
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
      eventType: "client_approval_needed",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: true
    });

    assert.equal(policy.email.required, true);
    assert.equal(policy.email.status, "no_send_local");
  });

  it("marks internal proof events as audit-only with no email fan-out", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "external_proof_failed",
      emailProvider: "resend",
      hasEmailProviderKey: true,
      hasInSystemPersistence: true
    });

    assert.equal(policy.auditOnly.required, true);
    assert.equal(policy.email.required, false);
    assert.equal(policy.email.status, "audit_only_no_email");
    assert.equal(policy.inSystem.required, true);
  });

  it("treats phone as supplement only and insufficient for launch claims", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "monthly_report_available",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: false
    });

    assert.equal(policy.phone.allowedForLaunchClaim, false);
    assert.equal(policy.phone.reason, "phone_is_supplement_only");
  });
});

describe("G162 severity and priority", () => {
  it("assigns info / action_required / warning / blocked / critical severities", () => {
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.content_approved.severity, "info");
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.client_approval_needed.severity, "action_required");
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.budget_threshold_warning.severity, "warning");
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.budget_cap_blocked.severity, "blocked");
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.storage_proof_failed.severity, "critical");
  });

  it("mirrors severity onto priority for transitional consumers", () => {
    const mapping = mapBusinessEventToNotification("BUDGET_CAP_BLOCKED");
    assert.equal(mapping.severity, "blocked");
    assert.equal(mapping.priority, "blocked");
  });
});

describe("G163 payload redaction", () => {
  it("excludes secrets, storageKey, raw provider responses, OAuth tokens, stack traces, and private audit metadata", () => {
    const redacted = redactNotificationPayload({
      title: "Safe title",
      reason: "Client requested changes",
      password: "should-not-leak",
      apiKey: "re_test",
      storageKey: "tenant/client/object.bin",
      rawProviderResponse: { ok: false, body: "secret-body" },
      oauthToken: "ya29.secret",
      stackTrace: "Error: boom\n    at fail",
      privateAuditMetadata: { internalNote: "do-not-expose" },
      nested: {
        refreshToken: "refresh-secret",
        clientId: "client_1"
      }
    });

    assert.equal(redacted.title, "Safe title");
    assert.equal(redacted.reason, "Client requested changes");
    assert.equal(redacted.password, "[REDACTED]");
    assert.equal(redacted.apiKey, "[REDACTED]");
    assert.equal(redacted.storageKey, "[REDACTED]");
    assert.equal(redacted.rawProviderResponse, "[REDACTED]");
    assert.equal(redacted.oauthToken, "[REDACTED]");
    assert.equal(redacted.stackTrace, "[REDACTED]");
    assert.equal(redacted.privateAuditMetadata, "[REDACTED]");
    assert.equal(redacted.nested.refreshToken, "[REDACTED]");
    assert.equal(redacted.nested.clientId, "client_1");

    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("should-not-leak"), false);
    assert.equal(serialized.includes("re_test"), false);
    assert.equal(serialized.includes("ya29.secret"), false);
    assert.equal(serialized.includes("tenant/client/object.bin"), false);
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

  it("maps monthly report available as launch-critical for client and admin", () => {
    const mapping = mapBusinessEventToNotification("MONTHLY_REPORT_AVAILABLE");

    assert.equal(mapping.eventType, "monthly_report_available");
    assert.equal(mapping.severity, "action_required");
    assert.deepEqual(mapping.audiences, ["client", "admin"]);
    assert.deepEqual(mapping.requiredChannels, ["in_system", "email"]);
  });

  it("maps WordPress draft prepared and budget cap blocked", () => {
    const wp = mapBusinessEventToNotification("WORDPRESS_DRAFT_PREPARED");
    assert.equal(wp.eventType, "wordpress_draft_prepared");
    assert.deepEqual(wp.requiredChannels, ["in_system"]);

    const budget = mapBusinessEventToNotification("BUDGET_CAP_BLOCKED");
    assert.equal(budget.eventType, "budget_cap_blocked");
    assert.equal(budget.typedTemplateKey, "BUDGET_CAP_BLOCKED");
  });
});

describe("approval and reject notification matrix", () => {
  it("marks deliverable approval and rejection as admin launch-critical notifications", () => {
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableApproved.severity, "action_required");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableApproved.audiences, ["admin"]);
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.deliverableRejected.requiredChannels, [
      "in_system",
      "email"
    ]);
  });

  it("keeps image rejection action-required while image approval remains info", () => {
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageRejected.severity, "action_required");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageRejected.requiredChannels, [
      "in_system",
      "email"
    ]);
    assert.equal(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageApproved.severity, "info");
    assert.deepEqual(APPROVAL_REJECT_NOTIFICATION_MATRIX.imageApproved.requiredChannels, ["in_system"]);
  });
});

describe("notification audit metadata builder", () => {
  it("builds a stable audit metadata shape with recipient and channel policy", () => {
    const metadata = buildNotificationAuditMetadata({
      eventType: "content_changes_requested",
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

    assert.equal(metadata.version, "NOTIFICATION_EVENTS_V2");
    assert.equal(metadata.templateKey, "AI_DELIVERY_REVIEW_REQUEST");
    assert.equal(metadata.typedTemplateKey, "CONTENT_CHANGES_REQUESTED");
    assert.equal(metadata.channelPolicy.inSystem.status, "blocked_no_persistence");
    assert.equal(metadata.channelPolicy.email.status, "no_send_local");
    assert.ok(metadata.recipientPolicy.roles.includes("admin"));
  });

  it("does not serialize secret-like provider key values", () => {
    const metadata = buildNotificationAuditMetadata({
      eventType: "monthly_report_available",
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

describe("G166 typed template catalog", () => {
  it("lists the required typed templates and maps them onto schema keys", () => {
    const required = [
      "CLIENT_APPROVAL_REQUIRED",
      "CONTENT_CHANGES_REQUESTED",
      "IMAGE_REPLACEMENT_READY",
      "MONTHLY_REPORT_AVAILABLE",
      "WORDPRESS_DRAFT_PREPARED",
      "INTEGRATION_PROOF_FAILED",
      "BUDGET_CAP_BLOCKED"
    ] as const;

    for (const key of required) {
      assert.equal(isTypedNotificationTemplateKey(key), true, key);
      assert.equal(TYPED_NOTIFICATION_TEMPLATE_CATALOG[key].dedicatedTemplateBlockedBySchema, true);
      assert.ok(Object.keys(EMAIL_TEMPLATE_INVENTORY).includes(resolveTypedTemplateToSchemaKey(key)));
    }
  });

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
