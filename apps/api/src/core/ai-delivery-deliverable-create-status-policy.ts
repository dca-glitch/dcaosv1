import { AiDeliveryGuardError } from "./ai-delivery-guard-error";
import { parseAiDeliveryDeliverableStatus, type AiDeliveryDeliverableStatus } from "@dca-os-v1/shared";

export const AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED = "AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED";
export const AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE =
  "Deliverables must be created in DRAFT. Use the dedicated workflow action to change status.";

export function resolveAiDeliveryDeliverableCreateStatus(
  requestedStatus: unknown
): AiDeliveryDeliverableStatus {
  if (requestedStatus === undefined) {
    return "DRAFT";
  }

  if (typeof requestedStatus !== "string") {
    throw new AiDeliveryGuardError(
      400,
      AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED,
      AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE
    );
  }

  const trimmed = requestedStatus.trim();
  if (!trimmed) {
    throw new AiDeliveryGuardError(
      400,
      AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED,
      AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE
    );
  }

  const parsed = parseAiDeliveryDeliverableStatus(trimmed);
  if (parsed === "DRAFT") {
    return "DRAFT";
  }

  throw new AiDeliveryGuardError(
    400,
    AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED,
    AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE
  );
}
