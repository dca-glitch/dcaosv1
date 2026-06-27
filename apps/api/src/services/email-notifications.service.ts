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

export interface TenantEmailLogListItem {
  id: string;
  tenantId: string | null;
  recipientEmail: string;
  subject: string;
  templateKey: EmailNotificationTemplateKey;
  status: EmailNotificationStatus;
  relatedModule: string | null;
  relatedEntityId: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface EmailNotificationOutboxStatus {
  provider: EmailProviderConfig["provider"];
  fromAddress: string;
  replyTo: string;
  hasResendApiKey: boolean;
  sendingEnabled: false;
}

export interface TenantEmailLogListResponse {
  emailLogs: TenantEmailLogListItem[];
  outbox: EmailNotificationOutboxStatus;
}

export interface ListTenantEmailLogsFilters {
  tenantId: string;
  templateKey?: EmailNotificationTemplateKey;
  status?: EmailNotificationStatus;
  limit: number;
}

export function getEmailNotificationOutboxStatus(): EmailNotificationOutboxStatus {
  const config = getEmailProviderConfig();

  return {
    provider: config.provider,
    fromAddress: config.fromAddress,
    replyTo: config.replyTo,
    hasResendApiKey: config.hasResendApiKey,
    sendingEnabled: false
  };
}

export async function listTenantEmailLogs(
  filters: ListTenantEmailLogsFilters,
  client: PrismaClientLike = prisma
): Promise<TenantEmailLogListResponse> {
  const emailLogs = await client.emailLog.findMany({
    where: {
      tenantId: filters.tenantId,
      ...(filters.templateKey ? { templateKey: filters.templateKey } : {}),
      ...(filters.status ? { status: filters.status } : {})
    },
    orderBy: {
      createdAt: "desc"
    },
    take: filters.limit,
    select: {
      id: true,
      tenantId: true,
      recipientEmail: true,
      subject: true,
      templateKey: true,
      status: true,
      relatedModule: true,
      relatedEntityId: true,
      providerMessageId: true,
      errorMessage: true,
      createdAt: true,
      sentAt: true
    }
  });

  return {
    emailLogs: emailLogs.map((emailLog) => ({
      id: emailLog.id,
      tenantId: emailLog.tenantId,
      recipientEmail: emailLog.recipientEmail,
      subject: emailLog.subject,
      templateKey: emailLog.templateKey,
      status: emailLog.status,
      relatedModule: emailLog.relatedModule,
      relatedEntityId: emailLog.relatedEntityId,
      providerMessageId: emailLog.providerMessageId,
      errorMessage: emailLog.errorMessage,
      createdAt: emailLog.createdAt.toISOString(),
      sentAt: emailLog.sentAt ? emailLog.sentAt.toISOString() : null
    })),
    outbox: getEmailNotificationOutboxStatus()
  };
}