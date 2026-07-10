export const NOTIFICATION_EVENTS_VERSION = "NOTIFICATION_EVENTS_V2";

/** Recipient roles for pure recipient-policy resolution (G160). */
export type NotificationRecipientRole = "admin" | "client" | "owner_operator" | "system_log_only";

/** Legacy audience labels retained for existing mappings. */
export type NotificationAudience = "admin" | "client";

export type NotificationChannel = "in_system" | "email" | "phone" | "audit_only";

/**
 * Severity / priority scale (G162).
 * Replaces the older normal/high/launch_critical labels for new consumers.
 */
export type NotificationSeverity =
  | "info"
  | "action_required"
  | "warning"
  | "blocked"
  | "critical";

/** @deprecated Prefer NotificationSeverity. Kept for transitional consumers. */
export type NotificationPriority = NotificationSeverity | "normal" | "high" | "launch_critical";

export type NotificationEmailProvider = "local" | "resend";

/**
 * Expanded launch + ops notification taxonomy (G159).
 * Legacy G94-G102 event names are retained for compatibility.
 */
export type NotificationEventType =
  // G159 expanded taxonomy
  | "content_draft_ready"
  | "content_approved"
  | "content_changes_requested"
  | "image_set_ready"
  | "image_rejected_with_reason"
  | "image_approved"
  | "image_candidate_generated"
  | "image_admin_rejected"
  | "image_replacement_requested"
  | "image_final_accepted"
  | "client_approval_needed"
  | "admin_alert_after_client_action"
  | "monthly_report_available"
  | "external_integration_disabled"
  | "external_proof_failed"
  | "budget_threshold_warning"
  | "budget_cap_blocked"
  | "wordpress_draft_prepared"
  | "storage_proof_failed"
  // Legacy G94-G102 aliases (still valid event types)
  | "article_ready_for_client_review"
  | "image_set_ready_for_client_review"
  | "client_deliverable_approved"
  | "client_deliverable_rejected"
  | "client_image_approved"
  | "client_image_rejected"
  | "admin_action_required"
  | "monthly_report_final"
  | "workflow_blocked"
  | "budget_cap_reached"
  | "kill_switch";

/** Schema-locked EmailTemplateKey values only. */
export type SchemaEmailTemplateKey =
  | "CLIENT_INVITE"
  | "PASSWORD_RESET"
  | "AI_DELIVERY_BRIEF_REQUEST"
  | "AI_DELIVERY_REVIEW_REQUEST"
  | "AI_DELIVERY_APPROVED"
  | "INVOICE_ISSUED";

/**
 * Typed logical template catalog (G166).
 * These are not schema enum values; they map onto SchemaEmailTemplateKey until a schema gate adds dedicated keys.
 */
export type TypedNotificationTemplateKey =
  | "CLIENT_APPROVAL_REQUIRED"
  | "CONTENT_CHANGES_REQUESTED"
  | "IMAGE_REPLACEMENT_READY"
  | "MONTHLY_REPORT_AVAILABLE"
  | "WORDPRESS_DRAFT_PREPARED"
  | "INTEGRATION_PROOF_FAILED"
  | "BUDGET_CAP_BLOCKED";

export interface EmailTemplateInventoryItem {
  templateKey: SchemaEmailTemplateKey;
  purpose: string;
  launchNotificationUse: "direct" | "reused_generic" | "not_launch_notification";
  dedicatedTemplateBlockedBySchema: boolean;
}

export const EMAIL_TEMPLATE_INVENTORY: Record<SchemaEmailTemplateKey, EmailTemplateInventoryItem> = {
  CLIENT_INVITE: {
    templateKey: "CLIENT_INVITE",
    purpose: "Client invitation email.",
    launchNotificationUse: "not_launch_notification",
    dedicatedTemplateBlockedBySchema: false
  },
  PASSWORD_RESET: {
    templateKey: "PASSWORD_RESET",
    purpose: "Password reset email.",
    launchNotificationUse: "not_launch_notification",
    dedicatedTemplateBlockedBySchema: false
  },
  AI_DELIVERY_BRIEF_REQUEST: {
    templateKey: "AI_DELIVERY_BRIEF_REQUEST",
    purpose: "AI Delivery brief or admin action request.",
    launchNotificationUse: "direct",
    dedicatedTemplateBlockedBySchema: false
  },
  AI_DELIVERY_REVIEW_REQUEST: {
    templateKey: "AI_DELIVERY_REVIEW_REQUEST",
    purpose: "AI Delivery review request or changes requested.",
    launchNotificationUse: "reused_generic",
    dedicatedTemplateBlockedBySchema: true
  },
  AI_DELIVERY_APPROVED: {
    templateKey: "AI_DELIVERY_APPROVED",
    purpose: "AI Delivery approval notification.",
    launchNotificationUse: "reused_generic",
    dedicatedTemplateBlockedBySchema: true
  },
  INVOICE_ISSUED: {
    templateKey: "INVOICE_ISSUED",
    purpose: "Finance invoice notification.",
    launchNotificationUse: "not_launch_notification",
    dedicatedTemplateBlockedBySchema: false
  }
} as const;

export interface TypedNotificationTemplateDefinition {
  templateKey: TypedNotificationTemplateKey;
  label: string;
  purpose: string;
  /** Schema key reused until dedicated enum values are approved. */
  schemaTemplateKey: SchemaEmailTemplateKey;
  dedicatedTemplateBlockedBySchema: true;
}

export const TYPED_NOTIFICATION_TEMPLATE_CATALOG: Record<
  TypedNotificationTemplateKey,
  TypedNotificationTemplateDefinition
> = {
  CLIENT_APPROVAL_REQUIRED: {
    templateKey: "CLIENT_APPROVAL_REQUIRED",
    label: "Client approval required",
    purpose: "Notify client that a deliverable or image set needs approval.",
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  CONTENT_CHANGES_REQUESTED: {
    templateKey: "CONTENT_CHANGES_REQUESTED",
    label: "Content changes requested",
    purpose: "Notify admin that the client requested content changes.",
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  IMAGE_REPLACEMENT_READY: {
    templateKey: "IMAGE_REPLACEMENT_READY",
    label: "Image replacement ready",
    purpose: "Notify client that a replacement image set is ready for review.",
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  MONTHLY_REPORT_AVAILABLE: {
    templateKey: "MONTHLY_REPORT_AVAILABLE",
    label: "Monthly report available",
    purpose: "Notify client/admin that a monthly report is available.",
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  WORDPRESS_DRAFT_PREPARED: {
    templateKey: "WORDPRESS_DRAFT_PREPARED",
    label: "WordPress draft prepared",
    purpose: "Notify admin that a WordPress draft was prepared.",
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  INTEGRATION_PROOF_FAILED: {
    templateKey: "INTEGRATION_PROOF_FAILED",
    label: "Integration proof failed",
    purpose: "Notify admin/owner-operator that an external integration proof failed.",
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  },
  BUDGET_CAP_BLOCKED: {
    templateKey: "BUDGET_CAP_BLOCKED",
    label: "Budget cap blocked",
    purpose: "Notify admin/owner-operator that a budget cap blocked further work.",
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    dedicatedTemplateBlockedBySchema: true
  }
} as const;

export interface NotificationEventDefinition {
  eventType: NotificationEventType;
  label: string;
  /** G162 severity/priority. */
  severity: NotificationSeverity;
  /** Transitional mirror of severity for older consumers. */
  priority: NotificationSeverity;
  audiences: NotificationAudience[];
  recipientRoles: NotificationRecipientRole[];
  launchCritical: boolean;
  /** Internal proof / ops events that must not fan out as client email. */
  auditOnly: boolean;
  schemaTemplateKey: SchemaEmailTemplateKey;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  dedicatedTemplateKeyNeeded: boolean;
}

function def(
  partial: Omit<NotificationEventDefinition, "priority"> & { priority?: NotificationSeverity }
): NotificationEventDefinition {
  return {
    ...partial,
    priority: partial.severity
  };
}

export const NOTIFICATION_EVENT_DEFINITIONS: Record<NotificationEventType, NotificationEventDefinition> = {
  content_draft_ready: def({
    eventType: "content_draft_ready",
    label: "Content draft ready",
    severity: "action_required",
    audiences: ["client", "admin"],
    recipientRoles: ["client", "admin"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CLIENT_APPROVAL_REQUIRED",
    dedicatedTemplateKeyNeeded: true
  }),
  content_approved: def({
    eventType: "content_approved",
    label: "Content approved",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: false
  }),
  content_changes_requested: def({
    eventType: "content_changes_requested",
    label: "Content changes requested",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CONTENT_CHANGES_REQUESTED",
    dedicatedTemplateKeyNeeded: true
  }),
  image_set_ready: def({
    eventType: "image_set_ready",
    label: "Image set ready",
    severity: "action_required",
    audiences: ["client"],
    recipientRoles: ["client"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "IMAGE_REPLACEMENT_READY",
    dedicatedTemplateKeyNeeded: true
  }),
  image_rejected_with_reason: def({
    eventType: "image_rejected_with_reason",
    label: "Image rejected with reason",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CONTENT_CHANGES_REQUESTED",
    dedicatedTemplateKeyNeeded: true
  }),
  image_approved: def({
    eventType: "image_approved",
    label: "Image approved",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: true
  }),
  image_candidate_generated: def({
    eventType: "image_candidate_generated",
    label: "Image candidate generated",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "IMAGE_REPLACEMENT_READY",
    dedicatedTemplateKeyNeeded: true
  }),
  image_admin_rejected: def({
    eventType: "image_admin_rejected",
    label: "Image admin rejected",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CONTENT_CHANGES_REQUESTED",
    dedicatedTemplateKeyNeeded: true
  }),
  image_replacement_requested: def({
    eventType: "image_replacement_requested",
    label: "Image replacement requested",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "IMAGE_REPLACEMENT_READY",
    dedicatedTemplateKeyNeeded: true
  }),
  image_final_accepted: def({
    eventType: "image_final_accepted",
    label: "Image final accepted",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: true
  }),
  client_approval_needed: def({
    eventType: "client_approval_needed",
    label: "Client approval needed",
    severity: "action_required",
    audiences: ["client"],
    recipientRoles: ["client"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CLIENT_APPROVAL_REQUIRED",
    dedicatedTemplateKeyNeeded: true
  }),
  admin_alert_after_client_action: def({
    eventType: "admin_alert_after_client_action",
    label: "Admin alert after client action",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: false
  }),
  monthly_report_available: def({
    eventType: "monthly_report_available",
    label: "Monthly report available",
    severity: "action_required",
    audiences: ["client", "admin"],
    recipientRoles: ["client", "admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "MONTHLY_REPORT_AVAILABLE",
    dedicatedTemplateKeyNeeded: true
  }),
  external_integration_disabled: def({
    eventType: "external_integration_disabled",
    label: "External integration disabled",
    severity: "warning",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator", "system_log_only"],
    launchCritical: false,
    auditOnly: true,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "INTEGRATION_PROOF_FAILED",
    dedicatedTemplateKeyNeeded: true
  }),
  external_proof_failed: def({
    eventType: "external_proof_failed",
    label: "External proof failed",
    severity: "warning",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator", "system_log_only"],
    launchCritical: false,
    auditOnly: true,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "INTEGRATION_PROOF_FAILED",
    dedicatedTemplateKeyNeeded: true
  }),
  budget_threshold_warning: def({
    eventType: "budget_threshold_warning",
    label: "Budget threshold warning",
    severity: "warning",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "BUDGET_CAP_BLOCKED",
    dedicatedTemplateKeyNeeded: true
  }),
  budget_cap_blocked: def({
    eventType: "budget_cap_blocked",
    label: "Budget cap blocked",
    severity: "blocked",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "BUDGET_CAP_BLOCKED",
    dedicatedTemplateKeyNeeded: true
  }),
  wordpress_draft_prepared: def({
    eventType: "wordpress_draft_prepared",
    label: "WordPress draft prepared",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "WORDPRESS_DRAFT_PREPARED",
    dedicatedTemplateKeyNeeded: true
  }),
  storage_proof_failed: def({
    eventType: "storage_proof_failed",
    label: "Storage proof failed",
    severity: "critical",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator", "system_log_only"],
    launchCritical: false,
    auditOnly: true,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "INTEGRATION_PROOF_FAILED",
    dedicatedTemplateKeyNeeded: true
  }),

  // Legacy aliases — same policy as their G159 counterparts
  article_ready_for_client_review: def({
    eventType: "article_ready_for_client_review",
    label: "Article ready for client review",
    severity: "action_required",
    audiences: ["client"],
    recipientRoles: ["client"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CLIENT_APPROVAL_REQUIRED",
    dedicatedTemplateKeyNeeded: true
  }),
  image_set_ready_for_client_review: def({
    eventType: "image_set_ready_for_client_review",
    label: "Image set ready for client review",
    severity: "action_required",
    audiences: ["client"],
    recipientRoles: ["client"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "IMAGE_REPLACEMENT_READY",
    dedicatedTemplateKeyNeeded: true
  }),
  client_deliverable_approved: def({
    eventType: "client_deliverable_approved",
    label: "Client approved deliverable",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: false
  }),
  client_deliverable_rejected: def({
    eventType: "client_deliverable_rejected",
    label: "Client requested deliverable changes",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CONTENT_CHANGES_REQUESTED",
    dedicatedTemplateKeyNeeded: false
  }),
  client_image_approved: def({
    eventType: "client_image_approved",
    label: "Client approved image",
    severity: "info",
    audiences: ["admin"],
    recipientRoles: ["admin"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: true
  }),
  client_image_rejected: def({
    eventType: "client_image_rejected",
    label: "Client rejected image",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "CONTENT_CHANGES_REQUESTED",
    dedicatedTemplateKeyNeeded: true
  }),
  admin_action_required: def({
    eventType: "admin_action_required",
    label: "Admin action required",
    severity: "action_required",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: false
  }),
  monthly_report_final: def({
    eventType: "monthly_report_final",
    label: "Monthly report final",
    severity: "action_required",
    audiences: ["client", "admin"],
    recipientRoles: ["client", "admin", "owner_operator"],
    launchCritical: true,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: "MONTHLY_REPORT_AVAILABLE",
    dedicatedTemplateKeyNeeded: true
  }),
  workflow_blocked: def({
    eventType: "workflow_blocked",
    label: "Workflow blocked",
    severity: "blocked",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: true
  }),
  budget_cap_reached: def({
    eventType: "budget_cap_reached",
    label: "Budget cap reached",
    severity: "blocked",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator"],
    launchCritical: false,
    auditOnly: false,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: "BUDGET_CAP_BLOCKED",
    dedicatedTemplateKeyNeeded: true
  }),
  kill_switch: def({
    eventType: "kill_switch",
    label: "AI kill switch changed",
    severity: "critical",
    audiences: ["admin"],
    recipientRoles: ["admin", "owner_operator", "system_log_only"],
    launchCritical: false,
    auditOnly: true,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    typedTemplateKey: null,
    dedicatedTemplateKeyNeeded: true
  })
} as const;

export type NotificationBusinessEvent =
  | "CONTENT_DRAFT_READY"
  | "CONTENT_APPROVED"
  | "CONTENT_CHANGES_REQUESTED"
  | "CONTENT_SENT_FOR_CLIENT_REVIEW"
  | "IMAGE_SET_READY"
  | "IMAGE_SET_READY_FOR_CLIENT_REVIEW"
  | "IMAGE_REJECTED_WITH_REASON"
  | "IMAGE_APPROVED"
  | "CLIENT_APPROVAL_NEEDED"
  | "CLIENT_DELIVERABLE_APPROVED"
  | "CLIENT_DELIVERABLE_REJECTED"
  | "CLIENT_IMAGE_APPROVED"
  | "CLIENT_IMAGE_REJECTED"
  | "ADMIN_ALERT_AFTER_CLIENT_ACTION"
  | "BRIEF_SUBMITTED"
  | "MONTHLY_REPORT_AVAILABLE"
  | "MONTHLY_REPORT_FINAL"
  | "EXTERNAL_INTEGRATION_DISABLED"
  | "EXTERNAL_PROOF_FAILED"
  | "BUDGET_THRESHOLD_WARNING"
  | "BUDGET_CAP_BLOCKED"
  | "BUDGET_CAP_REACHED"
  | "WORDPRESS_DRAFT_PREPARED"
  | "STORAGE_PROOF_FAILED"
  | "WORKFLOW_BLOCKED"
  | "KILL_SWITCH";

const BUSINESS_EVENT_MAP: Record<NotificationBusinessEvent, NotificationEventType> = {
  CONTENT_DRAFT_READY: "content_draft_ready",
  CONTENT_APPROVED: "content_approved",
  CONTENT_CHANGES_REQUESTED: "content_changes_requested",
  CONTENT_SENT_FOR_CLIENT_REVIEW: "article_ready_for_client_review",
  IMAGE_SET_READY: "image_set_ready",
  IMAGE_SET_READY_FOR_CLIENT_REVIEW: "image_set_ready_for_client_review",
  IMAGE_REJECTED_WITH_REASON: "image_rejected_with_reason",
  IMAGE_APPROVED: "image_approved",
  CLIENT_APPROVAL_NEEDED: "client_approval_needed",
  CLIENT_DELIVERABLE_APPROVED: "client_deliverable_approved",
  CLIENT_DELIVERABLE_REJECTED: "client_deliverable_rejected",
  CLIENT_IMAGE_APPROVED: "client_image_approved",
  CLIENT_IMAGE_REJECTED: "client_image_rejected",
  ADMIN_ALERT_AFTER_CLIENT_ACTION: "admin_alert_after_client_action",
  BRIEF_SUBMITTED: "admin_action_required",
  MONTHLY_REPORT_AVAILABLE: "monthly_report_available",
  MONTHLY_REPORT_FINAL: "monthly_report_final",
  EXTERNAL_INTEGRATION_DISABLED: "external_integration_disabled",
  EXTERNAL_PROOF_FAILED: "external_proof_failed",
  BUDGET_THRESHOLD_WARNING: "budget_threshold_warning",
  BUDGET_CAP_BLOCKED: "budget_cap_blocked",
  BUDGET_CAP_REACHED: "budget_cap_reached",
  WORDPRESS_DRAFT_PREPARED: "wordpress_draft_prepared",
  STORAGE_PROOF_FAILED: "storage_proof_failed",
  WORKFLOW_BLOCKED: "workflow_blocked",
  KILL_SWITCH: "kill_switch"
} as const;

export interface EventNotificationMapping {
  eventType: NotificationEventType;
  label: string;
  severity: NotificationSeverity;
  priority: NotificationSeverity;
  audiences: NotificationAudience[];
  recipientRoles: NotificationRecipientRole[];
  requiredChannels: NotificationChannel[];
  schemaTemplateKey: SchemaEmailTemplateKey;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  dedicatedTemplateKeyNeeded: boolean;
}

function requiredChannelsFor(definition: NotificationEventDefinition): NotificationChannel[] {
  if (definition.auditOnly) {
    return ["audit_only", "in_system"];
  }
  if (definition.launchCritical) {
    return ["in_system", "email"];
  }
  return ["in_system"];
}

export function mapBusinessEventToNotification(event: NotificationBusinessEvent): EventNotificationMapping {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[BUSINESS_EVENT_MAP[event]];
  return {
    eventType: definition.eventType,
    label: definition.label,
    severity: definition.severity,
    priority: definition.severity,
    audiences: [...definition.audiences],
    recipientRoles: [...definition.recipientRoles],
    requiredChannels: requiredChannelsFor(definition),
    schemaTemplateKey: definition.schemaTemplateKey,
    typedTemplateKey: definition.typedTemplateKey,
    dedicatedTemplateKeyNeeded: definition.dedicatedTemplateKeyNeeded
  };
}

/** G160 — pure recipient policy helper. No persistence or email. */
export interface NotificationRecipientPolicyInput {
  eventType: NotificationEventType;
}

export interface NotificationRecipientPolicy {
  eventType: NotificationEventType;
  roles: NotificationRecipientRole[];
  audiences: NotificationAudience[];
  systemLogOnly: boolean;
}

export function resolveNotificationRecipientPolicy(
  input: NotificationRecipientPolicyInput
): NotificationRecipientPolicy {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.eventType];
  const roles = [...definition.recipientRoles];
  return {
    eventType: input.eventType,
    roles,
    audiences: [...definition.audiences],
    systemLogOnly: roles.length === 1 && roles[0] === "system_log_only"
  };
}

export interface NotificationChannelPolicyInput {
  eventType: NotificationEventType;
  emailProvider: NotificationEmailProvider;
  hasEmailProviderKey: boolean;
  hasInSystemPersistence: boolean;
}

export interface NotificationChannelPolicy {
  eventType: NotificationEventType;
  severity: NotificationSeverity;
  priority: NotificationSeverity;
  inSystem: {
    required: true;
    status: "ready" | "blocked_no_persistence";
  };
  email: {
    required: boolean;
    status:
      | "not_required"
      | "no_send_local"
      | "blocked_missing_provider_key"
      | "configured_not_live_proven"
      | "audit_only_no_email";
  };
  auditOnly: {
    required: boolean;
    reason: "internal_proof_or_ops_event" | "not_audit_only";
  };
  phone: {
    allowedForLaunchClaim: false;
    reason: "phone_is_supplement_only";
  };
}

/**
 * G161 — channel policy:
 * - in-system always required
 * - email for launch-critical client/admin actions (not audit-only)
 * - audit-only for internal proof / ops events
 * - local provider remains no-send
 */
export function resolveNotificationChannelPolicy(input: NotificationChannelPolicyInput): NotificationChannelPolicy {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.eventType];
  const emailRequired = definition.launchCritical && !definition.auditOnly;

  let emailStatus: NotificationChannelPolicy["email"]["status"];
  if (definition.auditOnly) {
    emailStatus = "audit_only_no_email";
  } else if (!emailRequired) {
    emailStatus = "not_required";
  } else if (input.emailProvider === "local") {
    emailStatus = "no_send_local";
  } else if (input.hasEmailProviderKey) {
    emailStatus = "configured_not_live_proven";
  } else {
    emailStatus = "blocked_missing_provider_key";
  }

  return {
    eventType: input.eventType,
    severity: definition.severity,
    priority: definition.severity,
    inSystem: {
      required: true,
      status: input.hasInSystemPersistence ? "ready" : "blocked_no_persistence"
    },
    email: {
      required: emailRequired,
      status: emailStatus
    },
    auditOnly: {
      required: definition.auditOnly,
      reason: definition.auditOnly ? "internal_proof_or_ops_event" : "not_audit_only"
    },
    phone: {
      allowedForLaunchClaim: false,
      reason: "phone_is_supplement_only"
    }
  };
}

export const APPROVAL_REJECT_NOTIFICATION_MATRIX = {
  deliverableApproved: mapBusinessEventToNotification("CLIENT_DELIVERABLE_APPROVED"),
  deliverableRejected: mapBusinessEventToNotification("CLIENT_DELIVERABLE_REJECTED"),
  imageApproved: mapBusinessEventToNotification("CLIENT_IMAGE_APPROVED"),
  imageRejected: mapBusinessEventToNotification("CLIENT_IMAGE_REJECTED"),
  contentApproved: mapBusinessEventToNotification("CONTENT_APPROVED"),
  contentChangesRequested: mapBusinessEventToNotification("CONTENT_CHANGES_REQUESTED"),
  imageApprovedG159: mapBusinessEventToNotification("IMAGE_APPROVED"),
  imageRejectedWithReason: mapBusinessEventToNotification("IMAGE_REJECTED_WITH_REASON")
} as const;

/** Keys that must never appear in redacted notification payloads (G163). */
export const NOTIFICATION_PAYLOAD_REDACT_KEYS = [
  "password",
  "secret",
  "apiKey",
  "api_key",
  "token",
  "accessToken",
  "refreshToken",
  "oauthToken",
  "oauth_token",
  "authorization",
  "storageKey",
  "rawProviderResponse",
  "raw_provider_response",
  "providerResponse",
  "stack",
  "stackTrace",
  "stack_trace",
  "privateAuditMetadata",
  "private_audit_metadata",
  "RESEND_API_KEY",
  "clientSecret",
  "client_secret"
] as const;

const REDACT_KEY_SET = new Set<string>(NOTIFICATION_PAYLOAD_REDACT_KEYS.map((k) => k.toLowerCase()));

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (REDACT_KEY_SET.has(normalized)) {
    return true;
  }
  return (
    normalized.includes("secret") ||
    normalized.includes("apikey") ||
    normalized.includes("api_key") ||
    normalized.includes("oauth") ||
    normalized.includes("storagekey") ||
    normalized.includes("stacktrace") ||
    normalized.includes("privateaudit")
  );
}

/**
 * G163 — redact secrets, storageKey, raw provider responses, OAuth tokens,
 * stack traces, and private audit metadata from notification payloads.
 */
export function redactNotificationPayload<T>(payload: T): T {
  return redactValue(payload) as T;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (typeof value !== "object") {
    return value;
  }
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(input)) {
    if (shouldRedactKey(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    output[key] = redactValue(nested);
  }
  return output;
}

export interface BuildNotificationAuditMetadataInput {
  eventType: NotificationEventType;
  tenantId: string;
  clientId?: string | null;
  actorUserId?: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  correlationId?: string | null;
  emailProvider: NotificationEmailProvider;
  hasEmailProviderKey: boolean;
  hasInSystemPersistence: boolean;
}

export interface NotificationAuditMetadata {
  version: typeof NOTIFICATION_EVENTS_VERSION;
  eventType: NotificationEventType;
  severity: NotificationSeverity;
  priority: NotificationSeverity;
  tenantId: string;
  clientId: string | null;
  actorUserId: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  correlationId: string | null;
  templateKey: SchemaEmailTemplateKey;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  recipientPolicy: NotificationRecipientPolicy;
  channelPolicy: NotificationChannelPolicy;
}

export function buildNotificationAuditMetadata(input: BuildNotificationAuditMetadataInput): NotificationAuditMetadata {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.eventType];
  return {
    version: NOTIFICATION_EVENTS_VERSION,
    eventType: input.eventType,
    severity: definition.severity,
    priority: definition.severity,
    tenantId: input.tenantId,
    clientId: input.clientId ?? null,
    actorUserId: input.actorUserId ?? null,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    correlationId: input.correlationId ?? null,
    templateKey: definition.schemaTemplateKey,
    typedTemplateKey: definition.typedTemplateKey,
    recipientPolicy: resolveNotificationRecipientPolicy({ eventType: input.eventType }),
    channelPolicy: resolveNotificationChannelPolicy(input)
  };
}

export function isNotificationEventType(value: string): value is NotificationEventType {
  return Object.prototype.hasOwnProperty.call(NOTIFICATION_EVENT_DEFINITIONS, value);
}

export function isTypedNotificationTemplateKey(value: string): value is TypedNotificationTemplateKey {
  return Object.prototype.hasOwnProperty.call(TYPED_NOTIFICATION_TEMPLATE_CATALOG, value);
}

export function isSchemaEmailTemplateKey(value: string): value is SchemaEmailTemplateKey {
  return Object.prototype.hasOwnProperty.call(EMAIL_TEMPLATE_INVENTORY, value);
}

export function resolveTypedTemplateToSchemaKey(
  templateKey: TypedNotificationTemplateKey
): SchemaEmailTemplateKey {
  return TYPED_NOTIFICATION_TEMPLATE_CATALOG[templateKey].schemaTemplateKey;
}

/** G159 event types that must exist in the expanded taxonomy. */
export const G159_REQUIRED_EVENT_TYPES: readonly NotificationEventType[] = [
  "content_draft_ready",
  "content_approved",
  "content_changes_requested",
  "image_set_ready",
  "image_rejected_with_reason",
  "image_approved",
  "client_approval_needed",
  "admin_alert_after_client_action",
  "monthly_report_available",
  "external_integration_disabled",
  "external_proof_failed",
  "budget_threshold_warning",
  "budget_cap_blocked",
  "wordpress_draft_prepared",
  "storage_proof_failed"
] as const;
