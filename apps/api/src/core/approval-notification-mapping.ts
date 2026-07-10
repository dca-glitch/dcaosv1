/**
 * Client approval / revision / monthly-report → notification event map (G581–G583).
 *
 * Maps approval-loop signals onto existing shared notification taxonomy event names.
 * Does NOT edit packages/shared/src/notification-events.ts (Lane 3 ownership).
 * Pure; no send, no DB.
 */

export const APPROVAL_NOTIFICATION_MAPPING_VERSION = "APPROVAL_NOTIFICATION_MAPPING_V1";

/**
 * Existing NotificationEventType strings from packages/shared (read-only map targets).
 * Do not invent new taxonomy keys in this lane.
 */
export const APPROVAL_NOTIFICATION_EXISTING_EVENTS = {
  client_approval_needed: "client_approval_needed",
  content_approved: "content_approved",
  content_changes_requested: "content_changes_requested",
  image_approved: "image_approved",
  image_rejected_with_reason: "image_rejected_with_reason",
  admin_alert_after_client_action: "admin_alert_after_client_action",
  monthly_report_available: "monthly_report_available",
  /** Legacy alias still present in shared taxonomy. */
  monthly_report_final: "monthly_report_final"
} as const;

export type ApprovalNotificationEventType =
  (typeof APPROVAL_NOTIFICATION_EXISTING_EVENTS)[keyof typeof APPROVAL_NOTIFICATION_EXISTING_EVENTS];

/** Existing schema EmailLog / notifyDcaTeam kind strings used by runtime today. */
export const APPROVAL_NOTIFICATION_SCHEMA_KINDS = {
  AI_DELIVERY_APPROVED: "AI_DELIVERY_APPROVED",
  AI_DELIVERY_REVIEW_REQUEST: "AI_DELIVERY_REVIEW_REQUEST"
} as const;

export type ApprovalNotificationSchemaKind =
  (typeof APPROVAL_NOTIFICATION_SCHEMA_KINDS)[keyof typeof APPROVAL_NOTIFICATION_SCHEMA_KINDS];

export type ApprovalNotificationAudience = "admin" | "client";

export type ApprovalNotificationSignal =
  | "content_sent_for_client_review"
  | "content_approved_by_client"
  | "content_changes_requested_by_client"
  | "image_approved_by_client"
  | "image_rejected_by_client"
  | "admin_alert_after_client_action"
  | "monthly_report_final_available";

export type ApprovalNotificationMappingRow = {
  signal: ApprovalNotificationSignal;
  eventType: ApprovalNotificationEventType;
  /** Secondary taxonomy event when an admin alert should also fire. */
  adminAlertEventType?: typeof APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action;
  audiences: ApprovalNotificationAudience[];
  schemaKind: ApprovalNotificationSchemaKind | null;
  /** Whether runtime currently records email intent for this signal. */
  runtimeWired: boolean;
  /** Local/default send posture until owner live-email gate. */
  sendDefault: "no_send_until_owner_gate";
  notes: string;
};

export type ApprovalNotificationMappingResult = {
  version: typeof APPROVAL_NOTIFICATION_MAPPING_VERSION;
  signal: ApprovalNotificationSignal;
  eventType: ApprovalNotificationEventType;
  adminAlertEventType?: typeof APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action;
  audiences: ApprovalNotificationAudience[];
  schemaKind: ApprovalNotificationSchemaKind | null;
  notify: boolean;
  runtimeWired: boolean;
  sendDefault: "no_send_until_owner_gate";
  notes: string;
};

const MAPPINGS: readonly ApprovalNotificationMappingRow[] = [
  {
    signal: "content_sent_for_client_review",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.client_approval_needed,
    audiences: ["client"],
    schemaKind: APPROVAL_NOTIFICATION_SCHEMA_KINDS.AI_DELIVERY_REVIEW_REQUEST,
    runtimeWired: true,
    sendDefault: "no_send_until_owner_gate",
    notes: "sendAiDeliveryDeliverableForClientReview → notifyClientUsers (local often SKIPPED)."
  },
  {
    signal: "content_approved_by_client",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.content_approved,
    adminAlertEventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action,
    audiences: ["admin"],
    schemaKind: APPROVAL_NOTIFICATION_SCHEMA_KINDS.AI_DELIVERY_APPROVED,
    runtimeWired: true,
    sendDefault: "no_send_until_owner_gate",
    notes: "approveClientPortalDeliverable → notifyDcaTeam(AI_DELIVERY_APPROVED)."
  },
  {
    signal: "content_changes_requested_by_client",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.content_changes_requested,
    adminAlertEventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action,
    audiences: ["admin"],
    schemaKind: APPROVAL_NOTIFICATION_SCHEMA_KINDS.AI_DELIVERY_REVIEW_REQUEST,
    runtimeWired: true,
    sendDefault: "no_send_until_owner_gate",
    notes: "rejectClientPortalDeliverable → notifyDcaTeam(AI_DELIVERY_REVIEW_REQUEST) with reason."
  },
  {
    signal: "image_approved_by_client",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.image_approved,
    audiences: ["admin"],
    schemaKind: null,
    runtimeWired: false,
    sendDefault: "no_send_until_owner_gate",
    notes: "Policy maps to image_approved; runtime does not notify on image approve today."
  },
  {
    signal: "image_rejected_by_client",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.image_rejected_with_reason,
    adminAlertEventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action,
    audiences: ["admin"],
    schemaKind: null,
    runtimeWired: false,
    sendDefault: "no_send_until_owner_gate",
    notes: "Policy maps to image_rejected_with_reason; runtime stores reason only — no email intent yet."
  },
  {
    signal: "admin_alert_after_client_action",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.admin_alert_after_client_action,
    audiences: ["admin"],
    schemaKind: APPROVAL_NOTIFICATION_SCHEMA_KINDS.AI_DELIVERY_REVIEW_REQUEST,
    runtimeWired: true,
    sendDefault: "no_send_until_owner_gate",
    notes: "Generic admin alert taxonomy row; deliverable approve/reject already notify via schema kinds."
  },
  {
    signal: "monthly_report_final_available",
    eventType: APPROVAL_NOTIFICATION_EXISTING_EVENTS.monthly_report_available,
    audiences: ["client", "admin"],
    schemaKind: APPROVAL_NOTIFICATION_SCHEMA_KINDS.AI_DELIVERY_APPROVED,
    runtimeWired: false,
    sendDefault: "no_send_until_owner_gate",
    notes:
      "Taxonomy target is monthly_report_available (legacy monthly_report_final aliases). Client delivery path not wired; admin FINAL notify is separate admin path."
  }
];

export function getApprovalNotificationMappingContract(): {
  version: typeof APPROVAL_NOTIFICATION_MAPPING_VERSION;
  lane3Ownership: "notification-events_owned_elsewhere";
  proposedNewEventKeys: readonly string[];
  mappings: readonly ApprovalNotificationMappingRow[];
} {
  return {
    version: APPROVAL_NOTIFICATION_MAPPING_VERSION,
    lane3Ownership: "notification-events_owned_elsewhere",
    proposedNewEventKeys: [],
    mappings: MAPPINGS
  };
}

export function mapApprovalSignalToNotification(
  signal: ApprovalNotificationSignal
): ApprovalNotificationMappingResult {
  const row = MAPPINGS.find((entry) => entry.signal === signal);
  if (!row) {
    throw new Error(`Unknown approval notification signal: ${String(signal)}`);
  }
  return {
    version: APPROVAL_NOTIFICATION_MAPPING_VERSION,
    signal: row.signal,
    eventType: row.eventType,
    ...(row.adminAlertEventType ? { adminAlertEventType: row.adminAlertEventType } : {}),
    audiences: [...row.audiences],
    schemaKind: row.schemaKind,
    notify: true,
    runtimeWired: row.runtimeWired,
    sendDefault: row.sendDefault,
    notes: row.notes
  };
}

/** G581 — monthly report FINAL → client/admin availability event (policy map only). */
export function mapMonthlyReportAvailabilityNotification(): ApprovalNotificationMappingResult {
  return mapApprovalSignalToNotification("monthly_report_final_available");
}

/** G582 — admin alert after client action (taxonomy + when it should fire). */
export function mapAdminAlertAfterClientAction(input: {
  clientAction:
    | "approve_deliverable"
    | "request_changes"
    | "approve_image"
    | "reject_image"
    | "undo_image_review";
}): ApprovalNotificationMappingResult | null {
  if (input.clientAction === "undo_image_review") {
    return null;
  }
  if (input.clientAction === "approve_image") {
    // Image approve is optional/low-noise; map exists but does not force admin_alert.
    return mapApprovalSignalToNotification("image_approved_by_client");
  }
  if (input.clientAction === "reject_image") {
    return mapApprovalSignalToNotification("image_rejected_by_client");
  }
  if (input.clientAction === "approve_deliverable") {
    return mapApprovalSignalToNotification("content_approved_by_client");
  }
  return mapApprovalSignalToNotification("content_changes_requested_by_client");
}

export function listApprovalNotificationExistingEvents(): string[] {
  return Object.values(APPROVAL_NOTIFICATION_EXISTING_EVENTS);
}

export function listRuntimeWiredApprovalSignals(): ApprovalNotificationSignal[] {
  return MAPPINGS.filter((row) => row.runtimeWired).map((row) => row.signal);
}
