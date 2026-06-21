import type { EmailTemplateKey, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";

type PrismaClientLike = Prisma.TransactionClient | ReturnType<typeof createPrismaClient>;

export type AiDeliverySystemEventName =
  | "AI_DELIVERY_PROJECT_CREATED"
  | "AI_DELIVERY_PROJECT_UPDATED"
  | "AI_DELIVERY_PROJECT_ARCHIVED"
  | "AI_DELIVERY_BRIEF_SAVED"
  | "AI_DELIVERY_BRIEF_CLIENT_INPUT_REQUESTED"
  | "AI_DELIVERY_BRIEF_REVISION_REQUESTED"
  | "AI_DELIVERY_BRIEF_APPROVED"
  | "AI_DELIVERY_WORKFLOW_RUN_CREATED"
  | "AI_DELIVERY_WORKFLOW_RUN_UPDATED"
  | "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_STARTED"
  | "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_FAILED"
  | "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_COMPLETED"
  | "AI_DELIVERY_RESEARCH_REQUEST_CREATED"
  | "AI_DELIVERY_RESEARCH_REQUEST_UPDATED"
  | "AI_DELIVERY_RESEARCH_SOURCE_CREATED"
  | "AI_DELIVERY_RESEARCH_SOURCE_UPDATED"
  | "AI_DELIVERY_RESEARCH_SUMMARY_CREATED"
  | "AI_DELIVERY_RESEARCH_SUMMARY_UPDATED"
  | "AI_DELIVERY_RESEARCH_SUMMARY_APPLIED_TO_BRIEF"
  | "AI_DELIVERY_DELIVERABLE_REVIEW_CREATED"
  | "AI_DELIVERY_DELIVERABLE_REVIEW_UPDATED";

export interface AiDeliverySystemEventInput {
  tenantId: string;
  aiDeliveryProjectId: string;
  eventName: AiDeliverySystemEventName;
  relatedEntityId?: string | null;
}

const prisma = createPrismaClient();
const INTERNAL_EVENT_RECIPIENT = "internal-events@dcaos.local";
const AI_DELIVERY_RELATED_MODULE = "AI_DELIVERY";

function getTemplateKey(eventName: AiDeliverySystemEventName): EmailTemplateKey {
  if (eventName === "AI_DELIVERY_BRIEF_APPROVED") {
    return "AI_DELIVERY_APPROVED";
  }

  if (eventName.startsWith("AI_DELIVERY_BRIEF_")) {
    return "AI_DELIVERY_BRIEF_REQUEST";
  }

  return "AI_DELIVERY_REVIEW_REQUEST";
}

export async function recordAiDeliverySystemEvent(
  input: AiDeliverySystemEventInput,
  client: PrismaClientLike = prisma
): Promise<void> {
  await client.emailLog.create({
    data: {
      tenantId: input.tenantId,
      recipientEmail: INTERNAL_EVENT_RECIPIENT,
      subject: `EN2 internal event: ${input.eventName}`,
      templateKey: getTemplateKey(input.eventName),
      status: "SKIPPED",
      relatedModule: AI_DELIVERY_RELATED_MODULE,
      relatedEntityId: input.aiDeliveryProjectId,
      providerMessageId: null,
      errorMessage: "EN2 internal system event recorded only; no email delivery attempted.",
      sentAt: null
    }
  });
}