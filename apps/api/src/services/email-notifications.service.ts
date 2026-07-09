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
  textBody?: string | null;
  htmlBody?: string | null;
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

function buildDefaultTextBody(input: SendEmailNotificationInput): string {
  return input.textBody?.trim() || input.subject.trim();
}

function buildDefaultHtmlBody(input: SendEmailNotificationInput): string {
  if (input.htmlBody?.trim()) {
    return input.htmlBody.trim();
  }
  const text = buildDefaultTextBody(input);
  return `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`;
}

async function sendViaResend(
  config: EmailProviderConfig,
  input: SendEmailNotificationInput
): Promise<Pick<SendEmailNotificationResult, "status" | "providerMessageId" | "errorMessage">> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: "FAILED",
      providerMessageId: null,
      errorMessage: "Resend provider selected but RESEND_API_KEY is not configured."
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.fromAddress,
        to: [normalizeRecipientEmail(input.recipientEmail)],
        reply_to: config.replyTo,
        subject: input.subject.trim(),
        text: buildDefaultTextBody(input),
        html: buildDefaultHtmlBody(input)
      })
    });

    const payload = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      return {
        status: "FAILED",
        providerMessageId: null,
        errorMessage: payload.message ?? `Resend request failed with status ${response.status}.`
      };
    }

    return {
      status: "SENT",
      providerMessageId: payload.id ?? null,
      errorMessage: null
    };
  } catch (error) {
    return {
      status: "FAILED",
      providerMessageId: null,
      errorMessage: error instanceof Error ? error.message : "Resend request failed."
    };
  }
}

async function resolveSendStatus(
  config: EmailProviderConfig,
  input: SendEmailNotificationInput
): Promise<Pick<SendEmailNotificationResult, "status" | "providerMessageId" | "errorMessage">> {
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

  return sendViaResend(config, input);
}

export async function sendEmailNotification(
  input: SendEmailNotificationInput,
  client: PrismaClientLike = prisma
): Promise<SendEmailNotificationResult> {
  const config = getEmailProviderConfig();
  const delivery = await resolveSendStatus(config, input);
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

export type AiDeliveryEmailTemplateKey = Extract<
  EmailNotificationTemplateKey,
  "AI_DELIVERY_REVIEW_REQUEST" | "AI_DELIVERY_APPROVED"
>;

export async function notifyDcaTeam(
  tenantId: string,
  subject: string,
  templateKey: AiDeliveryEmailTemplateKey,
  relatedEntityId: string,
  textBody?: string | null
) {
  const config = getEmailProviderConfig();
  const adminUsers = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          tenantId,
          status: "ACTIVE",
          membershipRoles: {
            some: {
              role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
            }
          }
        }
      }
    },
    select: { email: true }
  });

  const uniqueEmails = [...new Set(adminUsers.map((user) => user.email.toLowerCase()))];
  for (const recipientEmail of uniqueEmails) {
    await sendEmailNotification({
      tenantId,
      recipientEmail,
      subject,
      templateKey,
      relatedModule: "ai-delivery",
      relatedEntityId,
      textBody
    });
  }

  if (config.replyTo) {
    await sendEmailNotification({
      tenantId,
      recipientEmail: config.replyTo,
      subject,
      templateKey,
      relatedModule: "ai-delivery",
      relatedEntityId,
      textBody
    });
  }
}

export async function notifyClientUsers(
  tenantId: string,
  clientId: string,
  subject: string,
  relatedEntityId: string,
  textBody?: string | null
) {
  const clientUsers = await prisma.clientUserAccess.findMany({
    where: { tenantId, clientId, isArchived: false },
    include: { user: { select: { email: true } } }
  });

  for (const access of clientUsers) {
    if (!access.user?.email) continue;
    await sendEmailNotification({
      tenantId,
      recipientEmail: access.user.email,
      subject,
      templateKey: "AI_DELIVERY_REVIEW_REQUEST",
      relatedModule: "ai-delivery",
      relatedEntityId,
      textBody
    });
  }
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
  sendingEnabled: boolean;
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
    sendingEnabled: config.provider === "resend" && config.hasResendApiKey
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
