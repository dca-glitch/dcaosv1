import { AiDeliveryGuardError } from "./ai-delivery-guard-error";
import { parseAiDeliveryDeliverableStatus, type AiDeliveryDeliverableStatus } from "@dca-os-v1/shared";

export const AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED = "AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED";
export const AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE =
  "Deliverables must be created in DRAFT. Use the dedicated workflow action to change status.";

export function resolveAiDeliveryDeliverableCreateStatus(
  requestedStatus: string | null | undefined
): AiDeliveryDeliverableStatus {
  if (requestedStatus === undefined || requestedStatus === null || requestedStatus.trim().length === 0) {
    return "DRAFT";
  }

  const parsed = parseAiDeliveryDeliverableStatus(requestedStatus);
  if (parsed === "DRAFT") {
    return "DRAFT";
  }

  throw new AiDeliveryGuardError(
    400,
    AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED,
    AI_DELIVERY_DELIVERABLE_CREATE_STATUS_BLOCKED_MESSAGE
  );
}
