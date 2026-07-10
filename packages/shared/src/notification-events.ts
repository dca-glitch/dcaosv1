export const NOTIFICATION_EVENTS_VERSION = "NOTIFICATION_EVENTS_V1";

export type NotificationAudience = "admin" | "client";
export type NotificationChannel = "in_system" | "email" | "phone";
export type NotificationPriority = "normal" | "high" | "launch_critical";
export type NotificationEmailProvider = "local" | "resend";

export type NotificationEventType =
  | "article_ready_for_client_review"
  | "image_set_ready_for_client_review"
  | "client_deliverable_approved"
  | "client_deliverable_rejected"
  | "client_image_approved"
  | "client_image_rejected"
  | "admin_action_required"
  | "monthly_report_final"
  | "wordpress_draft_prepared"
  | "workflow_blocked"
  | "budget_cap_reached"
  | "kill_switch";

export type SchemaEmailTemplateKey =
  | "CLIENT_INVITE"
  | "PASSWORD_RESET"
  | "AI_DELIVERY_BRIEF_REQUEST"
  | "AI_DELIVERY_REVIEW_REQUEST"
  | "AI_DELIVERY_APPROVED"
  | "INVOICE_ISSUED";

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

export interface NotificationEventDefinition {
  eventType: NotificationEventType;
  label: string;
  priority: NotificationPriority;
  audiences: NotificationAudience[];
  launchCritical: boolean;
  schemaTemplateKey: SchemaEmailTemplateKey;
  dedicatedTemplateKeyNeeded: boolean;
}

export const NOTIFICATION_EVENT_DEFINITIONS: Record<NotificationEventType, NotificationEventDefinition> = {
  article_ready_for_client_review: {
    eventType: "article_ready_for_client_review",
    label: "Article ready for client review",
    priority: "launch_critical",
    audiences: ["client"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  image_set_ready_for_client_review: {
    eventType: "image_set_ready_for_client_review",
    label: "Image set ready for client review",
    priority: "launch_critical",
    audiences: ["client"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  client_deliverable_approved: {
    eventType: "client_deliverable_approved",
    label: "Client approved deliverable",
    priority: "launch_critical",
    audiences: ["admin"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    dedicatedTemplateKeyNeeded: false
  },
  client_deliverable_rejected: {
    eventType: "client_deliverable_rejected",
    label: "Client requested deliverable changes",
    priority: "launch_critical",
    audiences: ["admin"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: false
  },
  client_image_approved: {
    eventType: "client_image_approved",
    label: "Client approved image",
    priority: "high",
    audiences: ["admin"],
    launchCritical: false,
    schemaTemplateKey: "AI_DELIVERY_APPROVED",
    dedicatedTemplateKeyNeeded: true
  },
  client_image_rejected: {
    eventType: "client_image_rejected",
    label: "Client rejected image",
    priority: "launch_critical",
    audiences: ["admin"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  admin_action_required: {
    eventType: "admin_action_required",
    label: "Admin action required",
    priority: "launch_critical",
    audiences: ["admin"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_BRIEF_REQUEST",
    dedicatedTemplateKeyNeeded: false
  },
  monthly_report_final: {
    eventType: "monthly_report_final",
    label: "Monthly report final",
    priority: "launch_critical",
    audiences: ["client", "admin"],
    launchCritical: true,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  wordpress_draft_prepared: {
    eventType: "wordpress_draft_prepared",
    label: "WordPress draft prepared",
    priority: "high",
    audiences: ["admin"],
    launchCritical: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  workflow_blocked: {
    eventType: "workflow_blocked",
    label: "Workflow blocked",
    priority: "high",
    audiences: ["admin"],
    launchCritical: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  budget_cap_reached: {
    eventType: "budget_cap_reached",
    label: "Budget cap reached",
    priority: "high",
    audiences: ["admin"],
    launchCritical: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  },
  kill_switch: {
    eventType: "kill_switch",
    label: "AI kill switch changed",
    priority: "high",
    audiences: ["admin"],
    launchCritical: false,
    schemaTemplateKey: "AI_DELIVERY_REVIEW_REQUEST",
    dedicatedTemplateKeyNeeded: true
  }
} as const;

export type NotificationBusinessEvent =
  | "CONTENT_SENT_FOR_CLIENT_REVIEW"
  | "IMAGE_SET_READY_FOR_CLIENT_REVIEW"
  | "CLIENT_DELIVERABLE_APPROVED"
  | "CLIENT_DELIVERABLE_REJECTED"
  | "CLIENT_IMAGE_APPROVED"
  | "CLIENT_IMAGE_REJECTED"
  | "BRIEF_SUBMITTED"
  | "MONTHLY_REPORT_FINAL"
  | "WORDPRESS_DRAFT_PREPARED"
  | "WORKFLOW_BLOCKED"
  | "BUDGET_CAP_REACHED"
  | "KILL_SWITCH";

const BUSINESS_EVENT_MAP: Record<NotificationBusinessEvent, NotificationEventType> = {
  CONTENT_SENT_FOR_CLIENT_REVIEW: "article_ready_for_client_review",
  IMAGE_SET_READY_FOR_CLIENT_REVIEW: "image_set_ready_for_client_review",
  CLIENT_DELIVERABLE_APPROVED: "client_deliverable_approved",
  CLIENT_DELIVERABLE_REJECTED: "client_deliverable_rejected",
  CLIENT_IMAGE_APPROVED: "client_image_approved",
  CLIENT_IMAGE_REJECTED: "client_image_rejected",
  BRIEF_SUBMITTED: "admin_action_required",
  MONTHLY_REPORT_FINAL: "monthly_report_final",
  WORDPRESS_DRAFT_PREPARED: "wordpress_draft_prepared",
  WORKFLOW_BLOCKED: "workflow_blocked",
  BUDGET_CAP_REACHED: "budget_cap_reached",
  KILL_SWITCH: "kill_switch"
} as const;

export interface EventNotificationMapping {
  eventType: NotificationEventType;
  label: string;
  priority: NotificationPriority;
  audiences: NotificationAudience[];
  requiredChannels: NotificationChannel[];
  schemaTemplateKey: SchemaEmailTemplateKey;
  dedicatedTemplateKeyNeeded: boolean;
}

export function mapBusinessEventToNotification(event: NotificationBusinessEvent): EventNotificationMapping {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[BUSINESS_EVENT_MAP[event]];
  return {
    eventType: definition.eventType,
    label: definition.label,
    priority: definition.priority,
    audiences: [...definition.audiences],
    requiredChannels: definition.launchCritical ? ["in_system", "email"] : ["in_system"],
    schemaTemplateKey: definition.schemaTemplateKey,
    dedicatedTemplateKeyNeeded: definition.dedicatedTemplateKeyNeeded
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
  priority: NotificationPriority;
  inSystem: {
    required: true;
    status: "ready" | "blocked_no_persistence";
  };
  email: {
    required: boolean;
    status: "not_required" | "no_send_local" | "blocked_missing_provider_key" | "configured_not_live_proven";
  };
  phone: {
    allowedForLaunchClaim: false;
    reason: "phone_is_supplement_only";
  };
}

export function resolveNotificationChannelPolicy(input: NotificationChannelPolicyInput): NotificationChannelPolicy {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.eventType];
  const emailRequired = definition.launchCritical;
  const emailStatus = !emailRequired
    ? "not_required"
    : input.emailProvider === "local"
      ? "no_send_local"
      : input.hasEmailProviderKey
        ? "configured_not_live_proven"
        : "blocked_missing_provider_key";

  return {
    eventType: input.eventType,
    priority: definition.priority,
    inSystem: {
      required: true,
      status: input.hasInSystemPersistence ? "ready" : "blocked_no_persistence"
    },
    email: {
      required: emailRequired,
      status: emailStatus
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
  imageRejected: mapBusinessEventToNotification("CLIENT_IMAGE_REJECTED")
} as const;

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
  priority: NotificationPriority;
  tenantId: string;
  clientId: string | null;
  actorUserId: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  correlationId: string | null;
  templateKey: SchemaEmailTemplateKey;
  channelPolicy: NotificationChannelPolicy;
}

export function buildNotificationAuditMetadata(input: BuildNotificationAuditMetadataInput): NotificationAuditMetadata {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.eventType];
  return {
    version: NOTIFICATION_EVENTS_VERSION,
    eventType: input.eventType,
    priority: definition.priority,
    tenantId: input.tenantId,
    clientId: input.clientId ?? null,
    actorUserId: input.actorUserId ?? null,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    correlationId: input.correlationId ?? null,
    templateKey: definition.schemaTemplateKey,
    channelPolicy: resolveNotificationChannelPolicy(input)
  };
}

export function isNotificationEventType(value: string): value is NotificationEventType {
  return Object.prototype.hasOwnProperty.call(NOTIFICATION_EVENT_DEFINITIONS, value);
}
