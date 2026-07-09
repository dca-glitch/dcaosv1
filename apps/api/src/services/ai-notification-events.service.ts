import type { AiNotificationEventPayload, AiNotificationEventType } from "@dca-os-v1/shared";

export const AI_NOTIFICATION_EVENTS_SERVICE_VERSION = "AI_NOTIFICATION_EVENTS_SERVICE_V1";

const MAX_EVENTS = 100;
const eventsByTenant = new Map<string, AiNotificationEventPayload[]>();

export function recordAiNotificationEvent(
  tenantId: string,
  payload: Omit<AiNotificationEventPayload, "noSend">
): AiNotificationEventPayload {
  const event: AiNotificationEventPayload = { ...payload, noSend: true };
  const existing = eventsByTenant.get(tenantId) ?? [];
  const next = [event, ...existing].slice(0, MAX_EVENTS);
  eventsByTenant.set(tenantId, next);
  return event;
}

export function listAiNotificationEvents(tenantId: string, limit = 20): AiNotificationEventPayload[] {
  return (eventsByTenant.get(tenantId) ?? []).slice(0, limit);
}

export function clearAiNotificationEventsForTests(tenantId?: string): void {
  if (tenantId) {
    eventsByTenant.delete(tenantId);
    return;
  }
  eventsByTenant.clear();
}

export function emitWorkflowBlockedNotification(
  tenantId: string,
  input: { clientId: string | null; workflowReference: string | null; message: string }
): AiNotificationEventPayload {
  return recordAiNotificationEvent(tenantId, {
    eventType: "workflow_blocked",
    clientId: input.clientId,
    workflowReference: input.workflowReference,
    stepReference: null,
    message: input.message
  });
}

export function emitBudgetCapNotification(
  tenantId: string,
  input: { clientId: string | null; message: string }
): AiNotificationEventPayload {
  return recordAiNotificationEvent(tenantId, {
    eventType: "budget_cap_reached",
    clientId: input.clientId,
    workflowReference: null,
    stepReference: null,
    message: input.message
  });
}

export function emitKillSwitchNotification(
  tenantId: string,
  input: { message: string }
): AiNotificationEventPayload {
  return recordAiNotificationEvent(tenantId, {
    eventType: "kill_switch",
    clientId: null,
    workflowReference: null,
    stepReference: null,
    message: input.message
  });
}

export function isKnownAiNotificationEventType(value: string): value is AiNotificationEventType {
  const known: AiNotificationEventType[] = [
    "brief_submitted",
    "ai_workflow_ready",
    "compliance_review_ready",
    "content_ready_for_admin_review",
    "content_approved",
    "content_rejected",
    "image_set_ready",
    "image_set_approved",
    "image_set_rejected",
    "report_ready",
    "report_approved",
    "workflow_blocked",
    "budget_warning",
    "budget_cap_reached",
    "deliverable_final",
    "report_final",
    "kill_switch",
    "wordpress_draft_prepared"
  ];
  return known.includes(value as AiNotificationEventType);
}
