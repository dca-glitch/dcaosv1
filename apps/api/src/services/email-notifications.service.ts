import type { EmailStatus, EmailTemplateKey, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { getEmailProviderConfig, type EmailProviderConfig } from "../config";

export type EmailNotificationTemplateKey = EmailTemplateKey;
export type EmailNotificationStatus = EmailStatus;

export interface SendEmailNotificationInput {
  tenantId?: string | null;
  recipientEmail: string;
  subject: string;
  templateKey: EmailNotificationTemplateKey;
  relatedModule?: string | null;
  relatedEntityId?: string | null;
}

export interface SendEmailNotificationResult {
  emailLogId: string;
  status: EmailNotificationStatus;
  provider: EmailProviderConfig["provider"];
  providerMessageId: string | null;
  errorMessage: string | null;
}

type PrismaClientLike = Prisma.TransactionClient | ReturnType<typeof createPrismaClient>;

const prisma = createPrismaClient();

function toNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeRecipientEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resolveSendStatus(config: EmailProviderConfig): Pick<SendEmailNotificationResult, "status" | "providerMessageId" | "errorMessage"> {
  if (config.provider === "local") {
    return {
      status: "SKIPPED",
      providerMessageId: null,
      errorMessage: "Local email provider selected; no email was sent."
    };
  }

  if (!config.hasResendApiKey) {
    return {
      status: "FAILED",
      providerMessageId: null,
      errorMessage: "Resend provider selected but RESEND_API_KEY is not configured."
    };
  }

  return {
    status: "SKIPPED",
    providerMessageId: null,
    errorMessage: "Resend adapter is not enabled in EN1; no email was sent."
  };
}

export async function sendEmailNotification(
  input: SendEmailNotificationInput,
  client: PrismaClientLike = prisma
): Promise<SendEmailNotificationResult> {
  const config = getEmailProviderConfig();
  const delivery = resolveSendStatus(config);
  const now = new Date();

  const emailLog = await client.emailLog.create({
    data: {
      tenantId: toNullableString(input.tenantId),
      recipientEmail: normalizeRecipientEmail(input.recipientEmail),
      subject: input.subject.trim(),
      templateKey: input.templateKey,
      status: delivery.status,
      relatedModule: toNullableString(input.relatedModule),
      relatedEntityId: toNullableString(input.relatedEntityId),
      providerMessageId: delivery.providerMessageId,
      errorMessage: delivery.errorMessage,
      sentAt: delivery.status === "SENT" ? now : null
    }
  });

  return {
    emailLogId: emailLog.id,
    status: emailLog.status,
    provider: config.provider,
    providerMessageId: emailLog.providerMessageId,
    errorMessage: emailLog.errorMessage
  };
}