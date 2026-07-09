/**
 * Notification event types (G56).
 * No-send / local provider remains default.
 */

export const AI_NOTIFICATION_EVENTS_VERSION = "AI_NOTIFICATION_EVENTS_V1";

export type AiNotificationEventType =
  | "brief_submitted"
  | "ai_workflow_ready"
  | "compliance_review_ready"
  | "budget_warning"
  | "deliverable_final"
  | "report_final"
  | "kill_switch";

export interface AiNotificationEventPayload {
  eventType: AiNotificationEventType;
  clientId: string | null;
  workflowReference: string | null;
  stepReference: string | null;
  message: string;
  noSend: true;
}
