/**
 * Notification event types (G56).
 * No-send / local provider remains default.
 */

export const AI_NOTIFICATION_EVENTS_VERSION = "AI_NOTIFICATION_EVENTS_V1";

export type AiNotificationEventType =
  | "brief_submitted"
  | "ai_workflow_ready"
  | "compliance_review_ready"
  | "content_ready_for_admin_review"
  | "content_approved"
  | "content_rejected"
  | "image_set_ready"
  | "image_set_approved"
  | "image_set_rejected"
  | "report_ready"
  | "report_approved"
  | "workflow_blocked"
  | "budget_warning"
  | "budget_cap_reached"
  | "deliverable_final"
  | "report_final"
  | "kill_switch"
  | "wordpress_draft_prepared";

export interface AiNotificationEventPayload {
  eventType: AiNotificationEventType;
  clientId: string | null;
  workflowReference: string | null;
  stepReference: string | null;
  message: string;
  noSend: true;
}
