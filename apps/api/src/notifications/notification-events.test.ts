import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPROVAL_REJECT_NOTIFICATION_MATRIX,
  EMAIL_TEMPLATE_INVENTORY,
  G159_REQUIRED_EVENT_TYPES,
  G249_IMAGE_LOOP_EVENT_TYPES,
  G495_REQUIRED_FAMILY_EVENT_TYPES,
  NOTIFICATION_EVENT_DEFINITIONS,
  NOTIFICATION_EVENT_FAMILIES,
  NOTIFICATION_LEGACY_EVENT_ALIASES,
  NOTIFICATION_PAYLOAD_REDACT_KEYS,
  NOTIFICATION_TAXONOMY_CLOSEOUT_VERSION,
  TYPED_NOTIFICATION_TEMPLATE_CATALOG,
  auditNotificationTaxonomyCoverage,
  buildNotificationAuditMetadata,
  buildNotificationAuditMetadataSafeShape,
  buildNotificationEventMetadata,
  buildNotificationPayloadSnapshot,
  getNotificationEventFamily,
  isNotificationAuditMetadataSafe,
  isNotificationEventType,
  isNotificationLegacyEventAlias,
  isTypedNotificationTemplateKey,
  mapBusinessEventToNotification,
  redactNotificationPayload,
  resolveNotificationChannelPolicy,
  resolveNotificationLegacyAlias,
  resolveNotificationRecipientPolicy,
  resolveTypedTemplateToSchemaKey
} from "@dca-os-v1/shared";
import {
  NOTIFICATION_CORRELATION_DESIGN_VERSION,
  NOTIFICATION_IDEMPOTENCY_SCHEMA_NOTE,
  assertNotificationCorrelationContract,
  buildNotificationCorrelationDesign,
  notificationCorrelationDesignsEqual
} from "./notification-correlation";

describe("G249 notification taxonomy completeness", () => {
  it("defines every required G159 event type", () => {
    for (const eventType of G159_REQUIRED_EVENT_TYPES) {
      assert.equal(isNotificationEventType(eventType), true, eventType);
      assert.equal(NOTIFICATION_EVENT_DEFINITIONS[eventType].eventType, eventType);
    }
  });

  it("includes image-loop event types for Lane 5 consumers", () => {
    for (const eventType of G249_IMAGE_LOOP_EVENT_TYPES) {
      assert.equal(isNotificationEventType(eventType), true, eventType);
      assert.ok(NOTIFICATION_EVENT_DEFINITIONS[eventType].label.length > 0);
    }
  });

  it("keeps every event mapped to a schema-compatible email template key", () => {
    const templateKeys = new Set(Object.keys(EMAIL_TEMPLATE_INVENTORY));
    for (const definition of Object.values(NOTIFICATION_EVENT_DEFINITIONS)) {
      assert.equal(templateKeys.has(definition.schemaTemplateKey), true, definition.eventType);
      assert.equal(definition.severity === definition.priority, true, definition.eventType);
    }
  });

  it("rejects unknown event types", () => {
    assert.equal(isNotificationEventType("not_a_real_notification"), false);
  });
});

describe("G250 notification taxonomy backward-compat aliases", () => {
  it("keeps legacy G94-G102 event types valid", () => {
    assert.equal(isNotificationEventType("article_ready_for_client_review"), true);
    assert.equal(isNotificationEventType("monthly_report_final"), true);
    assert.equal(isNotificationEventType("client_image_rejected"), true);
    assert.equal(isNotificationEventType("admin_action_required"), true);
    assert.equal(isNotificationEventType("workflow_blocked"), true);
    assert.equal(isNotificationEventType("kill_switch"), true);
  });

  it("resolves legacy aliases to preferred G159 canonical types", () => {
    assert.equal(resolveNotificationLegacyAlias("article_ready_for_client_review"), "client_approval_needed");
    assert.equal(resolveNotificationLegacyAlias("image_set_ready_for_client_review"), "image_set_ready");
    assert.equal(resolveNotificationLegacyAlias("client_deliverable_approved"), "content_approved");
    assert.equal(resolveNotificationLegacyAlias("client_deliverable_rejected"), "content_changes_requested");
    assert.equal(resolveNotificationLegacyAlias("budget_cap_reached"), "budget_cap_blocked");
    assert.equal(resolveNotificationLegacyAlias("monthly_report_final"), "monthly_report_available");
  });

  it("returns canonical types unchanged and unknown as null", () => {
    assert.equal(resolveNotificationLegacyAlias("content_draft_ready"), "content_draft_ready");
    assert.equal(resolveNotificationLegacyAlias("kill_switch"), "kill_switch");
    assert.equal(resolveNotificationLegacyAlias("totally_unknown"), null);
  });

  it("lists only known legacy alias keys", () => {
    for (const key of Object.keys(NOTIFICATION_LEGACY_EVENT_ALIASES)) {
      assert.equal(isNotificationLegacyEventAlias(key), true, key);
      assert.equal(isNotificationEventType(key), true, key);
      const preferred = NOTIFICATION_LEGACY_EVENT_ALIASES[key as keyof typeof NOTIFICATION_LEGACY_EVENT_ALIASES];
      assert.equal(isNotificationEventType(preferred), true, preferred);
    }
  });
});

describe("G251 recipient policy", () => {
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

  it("never marks client-facing approval events as system-log-only", () => {
    for (const eventType of ["client_approval_needed", "image_set_ready", "monthly_report_available"] as const) {
      const policy = resolveNotificationRecipientPolicy({ eventType });
      assert.equal(policy.systemLogOnly, false, eventType);
      assert.ok(policy.roles.includes("client"), eventType);
    }
  });
});

describe("G252 channel policy", () => {
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

  it("blocks email when resend is selected without a provider key", () => {
    const policy = resolveNotificationChannelPolicy({
      eventType: "content_draft_ready",
      emailProvider: "resend",
      hasEmailProviderKey: false,
      hasInSystemPersistence: true
    });
    assert.equal(policy.email.required, true);
    assert.equal(policy.email.status, "blocked_missing_provider_key");
  });
});

describe("G253 severity mapping", () => {
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

  it("covers every severity value at least once in the taxonomy", () => {
    const severities = new Set(Object.values(NOTIFICATION_EVENT_DEFINITIONS).map((d) => d.severity));
    for (const required of ["info", "action_required", "warning", "blocked", "critical"] as const) {
      assert.equal(severities.has(required), true, required);
    }
  });
});

describe("G254 payload redaction hardening", () => {
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

  it("redacts snake_case and substring secret-like keys", () => {
    const redacted = redactNotificationPayload({
      api_key: "x",
      oauth_token: "y",
      mySecretValue: "z",
      providerResponse: { raw: true },
      stack_trace: "boom",
      private_audit_metadata: { a: 1 },
      RESEND_API_KEY: "re_env",
      client_secret: "cs"
    });

    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.oauth_token, "[REDACTED]");
    assert.equal(redacted.mySecretValue, "[REDACTED]");
    assert.equal(redacted.providerResponse, "[REDACTED]");
    assert.equal(redacted.stack_trace, "[REDACTED]");
    assert.equal(redacted.private_audit_metadata, "[REDACTED]");
    assert.equal(redacted.RESEND_API_KEY, "[REDACTED]");
    assert.equal(redacted.client_secret, "[REDACTED]");
    assert.ok(NOTIFICATION_PAYLOAD_REDACT_KEYS.includes("storageKey"));
  });

  it("handles arrays and nullish values without throwing", () => {
    assert.deepEqual(redactNotificationPayload(null), null);
    assert.deepEqual(redactNotificationPayload(undefined), undefined);
    assert.deepEqual(redactNotificationPayload([{ token: "secret", ok: true }]), [
      { token: "[REDACTED]", ok: true }
    ]);
  });
});

describe("G255 notification payload safe snapshot", () => {
  it("builds a redacted allowlisted snapshot without secret leakage", () => {
    const snapshot = buildNotificationPayloadSnapshot({
      eventType: "client_approval_needed",
      title: " Approval needed ",
      body: " Please review ",
      reason: null,
      clientId: "client_1",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      deliverableId: "deliverable_1",
      deepLinkHash: "#/client-portal/pending-approvals",
      statusLabel: "PENDING_CLIENT_REVIEW",
      extra: {
        title: "ignored-extra-title",
        storageKey: "must-not-appear",
        apiKey: "re_secret",
        reason: "safe-extra-reason",
        workflowRunId: "internal-run"
      }
    });

    assert.equal(snapshot.version, "NOTIFICATION_EVENTS_V2");
    assert.equal(snapshot.title, "Approval needed");
    assert.equal(snapshot.body, "Please review");
    assert.equal(snapshot.severity, "action_required");
    assert.equal(snapshot.deepLinkHash, "#/client-portal/pending-approvals");
    assert.equal(snapshot.safeExtra.reason, "safe-extra-reason");
    assert.equal(Object.prototype.hasOwnProperty.call(snapshot.safeExtra, "storageKey"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(snapshot.safeExtra, "apiKey"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(snapshot.safeExtra, "workflowRunId"), false);

    const serialized = JSON.stringify(snapshot);
    assert.equal(serialized.includes("must-not-appear"), false);
    assert.equal(serialized.includes("re_secret"), false);
    assert.equal(serialized.includes("internal-run"), false);
  });
});

describe("G256 notification metadata builder", () => {
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

describe("G257 correlation and idempotency design (no migration)", () => {
  it("builds deterministic correlation and idempotency keys without persistence", () => {
    const a = buildNotificationCorrelationDesign({
      tenantId: "tenant_1",
      eventType: "client_approval_needed",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      recipientUserId: "user_1",
      clientId: "client_1",
      actionKey: "sent_for_review"
    });
    const b = buildNotificationCorrelationDesign({
      tenantId: "tenant_1",
      eventType: "client_approval_needed",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      recipientUserId: "user_1",
      clientId: "client_1",
      actionKey: "sent_for_review"
    });

    assert.equal(a.version, NOTIFICATION_CORRELATION_DESIGN_VERSION);
    assert.equal(a.persistence, "design_only_no_migration");
    assert.equal(a.uniquenessScope, "tenant_event_entity_recipient_action");
    assert.equal(a.correlationId, b.correlationId);
    assert.equal(a.idempotencyKey, b.idempotencyKey);
    assert.ok(a.correlationId.startsWith("corr_"));
    assert.ok(NOTIFICATION_IDEMPOTENCY_SCHEMA_NOTE.includes("No migration"));
  });

  it("changes idempotency key when recipient or action differs", () => {
    const base = buildNotificationCorrelationDesign({
      tenantId: "tenant_1",
      eventType: "content_approved",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      recipientUserId: "admin_1",
      actionKey: "approved"
    });
    const otherRecipient = buildNotificationCorrelationDesign({
      tenantId: "tenant_1",
      eventType: "content_approved",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      recipientUserId: "admin_2",
      actionKey: "approved"
    });
    const otherAction = buildNotificationCorrelationDesign({
      tenantId: "tenant_1",
      eventType: "content_approved",
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: "deliverable_1",
      recipientUserId: "admin_1",
      actionKey: "reapproved"
    });

    assert.notEqual(base.idempotencyKey, otherRecipient.idempotencyKey);
    assert.notEqual(base.idempotencyKey, otherAction.idempotencyKey);
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

describe("G261 typed template catalog completeness", () => {
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

describe("G493 notification taxonomy coverage audit", () => {
  it("reports complete coverage for definitions, families, G159, and G495 anchors", () => {
    const audit = auditNotificationTaxonomyCoverage();
    assert.equal(audit.version, NOTIFICATION_TAXONOMY_CLOSEOUT_VERSION);
    assert.equal(audit.complete, true);
    assert.equal(audit.g159CoverageComplete, true);
    assert.equal(audit.g495FamilyCoverageComplete, true);
    assert.deepEqual(audit.missingDefinitions, []);
    assert.deepEqual(audit.orphanFamilyMembers, []);
    assert.deepEqual(audit.uncoveredByFamily, []);
    assert.ok(audit.totalEventTypes >= G159_REQUIRED_EVENT_TYPES.length);
  });

  it("assigns every defined event type to exactly one family", () => {
    const seen = new Set<string>();
    for (const [family, eventTypes] of Object.entries(NOTIFICATION_EVENT_FAMILIES)) {
      for (const eventType of eventTypes) {
        assert.equal(seen.has(eventType), false, `duplicate family member ${eventType} in ${family}`);
        seen.add(eventType);
        assert.equal(getNotificationEventFamily(eventType), family, eventType);
      }
    }
    for (const eventType of Object.keys(NOTIFICATION_EVENT_DEFINITIONS)) {
      assert.equal(seen.has(eventType), true, eventType);
    }
  });
});

describe("G494 legacy alias compatibility", () => {
  it("keeps every legacy alias valid and resolvable to a preferred canonical type", () => {
    for (const [legacy, preferred] of Object.entries(NOTIFICATION_LEGACY_EVENT_ALIASES)) {
      assert.equal(isNotificationEventType(legacy), true, legacy);
      assert.equal(isNotificationEventType(preferred), true, preferred);
      assert.equal(resolveNotificationLegacyAlias(legacy), preferred);

      const legacyDef = NOTIFICATION_EVENT_DEFINITIONS[legacy as keyof typeof NOTIFICATION_EVENT_DEFINITIONS];
      const preferredDef = NOTIFICATION_EVENT_DEFINITIONS[preferred];
      // Both remain first-class event types (compat, not deletion).
      assert.ok(legacyDef.label.length > 0, legacy);
      assert.ok(preferredDef.label.length > 0, preferred);
      assert.equal(legacyDef.auditOnly, preferredDef.auditOnly, legacy);
      assert.deepEqual(legacyDef.audiences, preferredDef.audiences, legacy);
    }
  });

  it("preserves first-class legacy types without forced rename", () => {
    for (const eventType of ["admin_action_required", "workflow_blocked", "kill_switch"] as const) {
      assert.equal(isNotificationLegacyEventAlias(eventType), false);
      assert.equal(resolveNotificationLegacyAlias(eventType), eventType);
    }
  });
});

describe("G495 event families for storage budget wordpress reports images", () => {
  it("defines typed contracts for required family anchors", () => {
    for (const [family, eventTypes] of Object.entries(G495_REQUIRED_FAMILY_EVENT_TYPES)) {
      for (const eventType of eventTypes) {
        assert.equal(isNotificationEventType(eventType), true, `${family}:${eventType}`);
        assert.equal(getNotificationEventFamily(eventType), family, eventType);
        assert.ok(NOTIFICATION_EVENT_DEFINITIONS[eventType].label.length > 0);
      }
    }
  });

  it("maps business events onto family anchors without inventing DB rows", () => {
    assert.equal(mapBusinessEventToNotification("STORAGE_PROOF_FAILED").eventType, "storage_proof_failed");
    assert.equal(mapBusinessEventToNotification("BUDGET_THRESHOLD_WARNING").eventType, "budget_threshold_warning");
    assert.equal(mapBusinessEventToNotification("WORDPRESS_DRAFT_PREPARED").eventType, "wordpress_draft_prepared");
    assert.equal(mapBusinessEventToNotification("MONTHLY_REPORT_AVAILABLE").eventType, "monthly_report_available");
    assert.equal(mapBusinessEventToNotification("IMAGE_SET_READY").eventType, "image_set_ready");
  });
});

describe("G496 notification correlation idempotency contract", () => {
  it("passes contract checks and equality for identical inputs", () => {
    const input = {
      tenantId: "tenant_1",
      eventType: "storage_proof_failed" as const,
      relatedEntityType: "storageProof",
      relatedEntityId: "proof_1",
      recipientUserId: "admin_1",
      actionKey: "proof_failed"
    };
    const a = buildNotificationCorrelationDesign(input);
    const b = buildNotificationCorrelationDesign(input);
    const check = assertNotificationCorrelationContract(a);

    assert.equal(check.deterministic, true);
    assert.equal(check.persistenceDesignOnly, true);
    assert.equal(check.correlationIdFormatOk, true);
    assert.equal(check.idempotencyKeyNonEmpty, true);
    assert.equal(notificationCorrelationDesignsEqual(a, b), true);
    assert.ok(NOTIFICATION_IDEMPOTENCY_SCHEMA_NOTE.includes("G496"));
  });

  it("does not claim persistence or migration", () => {
    const design = buildNotificationCorrelationDesign({
      tenantId: "t",
      eventType: "budget_cap_blocked",
      relatedEntityType: "budget",
      relatedEntityId: "period_1"
    });
    assert.equal(design.persistence, "design_only_no_migration");
  });
});

describe("G497 notification payload redaction snapshots", () => {
  it("snapshots family events without leaking storage keys or secrets", () => {
    for (const eventType of [
      "storage_proof_failed",
      "budget_threshold_warning",
      "wordpress_draft_prepared",
      "monthly_report_available",
      "image_set_ready"
    ] as const) {
      const snapshot = buildNotificationPayloadSnapshot({
        eventType,
        title: `${eventType} title`,
        relatedEntityType: "entity",
        relatedEntityId: "id_1",
        extra: {
          storageKey: "bucket/path/object",
          apiKey: "secret-key",
          reason: "safe-reason"
        }
      });
      const serialized = JSON.stringify(snapshot);
      assert.equal(serialized.includes("bucket/path/object"), false, eventType);
      assert.equal(serialized.includes("secret-key"), false, eventType);
      assert.equal(snapshot.safeExtra.reason, "safe-reason", eventType);
    }
  });
});

describe("G498 recipient channel severity policy", () => {
  it("enforces family-specific recipient channel and severity expectations", () => {
    const storage = resolveNotificationRecipientPolicy({ eventType: "storage_proof_failed" });
    assert.ok(storage.roles.includes("system_log_only"));
    assert.equal(NOTIFICATION_EVENT_DEFINITIONS.storage_proof_failed.severity, "critical");
    assert.equal(
      resolveNotificationChannelPolicy({
        eventType: "storage_proof_failed",
        emailProvider: "local",
        hasEmailProviderKey: false,
        hasInSystemPersistence: false
      }).email.status,
      "audit_only_no_email"
    );

    const budget = resolveNotificationChannelPolicy({
      eventType: "budget_cap_blocked",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: false
    });
    assert.equal(budget.severity, "blocked");
    assert.equal(budget.email.required, false);

    const report = resolveNotificationChannelPolicy({
      eventType: "monthly_report_available",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: true
    });
    assert.equal(report.severity, "action_required");
    assert.equal(report.email.status, "no_send_local");

    const image = resolveNotificationRecipientPolicy({ eventType: "image_set_ready" });
    assert.deepEqual(image.roles, ["client"]);
  });
});

describe("G499 notification event metadata builder", () => {
  it("composes family policies payload and audit metadata without secrets", () => {
    const metadata = buildNotificationEventMetadata({
      eventType: "wordpress_draft_prepared",
      tenantId: "tenant_1",
      clientId: "client_1",
      actorUserId: "admin_1",
      relatedEntityType: "wordpressDraft",
      relatedEntityId: "draft_1",
      correlationId: "corr_wp_1",
      actionKey: "draft_prepared",
      title: "WordPress draft prepared",
      body: "Draft is ready for review",
      statusLabel: "PREPARED",
      emailProvider: "local",
      hasEmailProviderKey: false,
      hasInSystemPersistence: false,
      extra: {
        storageKey: "must-not-leak",
        reason: "draft-ready"
      }
    });

    assert.equal(metadata.version, NOTIFICATION_TAXONOMY_CLOSEOUT_VERSION);
    assert.equal(metadata.family, "wordpress");
    assert.equal(metadata.eventType, "wordpress_draft_prepared");
    assert.equal(metadata.payload.statusLabel, "PREPARED");
    assert.equal(metadata.payload.safeExtra.reason, "draft-ready");
    assert.equal(metadata.audit.correlationId, "corr_wp_1");
    assert.equal(metadata.actionKey, "draft_prepared");
    assert.equal(Object.prototype.hasOwnProperty.call(metadata.payload.safeExtra, "storageKey"), false);

    const serialized = JSON.stringify(metadata);
    assert.equal(serialized.includes("must-not-leak"), false);
  });
});

describe("G500 notification audit metadata safe shape", () => {
  it("builds a safe audit shape and rejects unsafe trees", () => {
    const safe = buildNotificationAuditMetadataSafeShape({
      eventType: "budget_threshold_warning",
      tenantId: "tenant_1",
      relatedEntityType: "aiBudget",
      relatedEntityId: "budget_1",
      emailProvider: "resend",
      hasEmailProviderKey: true,
      hasInSystemPersistence: false,
      extra: {
        statusLabel: "WARNING",
        storageKey: "s3://bucket/key",
        apiKey: "re_live",
        note: "threshold crossed"
      }
    });

    assert.equal(safe.family, "budget");
    assert.equal(safe.channelSummary.emailStatus, "not_required");
    assert.equal(safe.safeExtra.statusLabel, "WARNING");
    assert.equal(Object.prototype.hasOwnProperty.call(safe.safeExtra, "storageKey"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(safe.safeExtra, "apiKey"), false);
    assert.equal(isNotificationAuditMetadataSafe(safe), true);

    assert.equal(
      isNotificationAuditMetadataSafe({
        eventType: "budget_threshold_warning",
        storageKey: "leak"
      }),
      false
    );
    assert.equal(isNotificationAuditMetadataSafe({ password: "x" }), false);
  });
});

describe("G501 notification contract shared export surface", () => {
  it("exposes taxonomy closeout helpers from shared package imports", () => {
    assert.equal(typeof auditNotificationTaxonomyCoverage, "function");
    assert.equal(typeof buildNotificationEventMetadata, "function");
    assert.equal(typeof buildNotificationAuditMetadataSafeShape, "function");
    assert.equal(typeof getNotificationEventFamily, "function");
    assert.equal(typeof isNotificationAuditMetadataSafe, "function");
    assert.ok(NOTIFICATION_EVENT_FAMILIES.storage.includes("storage_proof_failed"));
  });
});
