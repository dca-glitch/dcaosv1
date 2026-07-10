import type { NotificationEventType, SchemaEmailTemplateKey } from "@dca-os-v1/shared";

export const EMAIL_NO_SEND_ADAPTER_VERSION = "EMAIL_NO_SEND_ADAPTER_V1";

export interface EmailNoSendAdapterInput {
  tenantId: string;
  recipientEmail: string;
  subject: string;
  templateKey: SchemaEmailTemplateKey;
  eventType: NotificationEventType;
  relatedEntityId?: string | null;
  textBody?: string | null;
}

export interface EmailNoSendAdapterResult {
  status: "SKIPPED";
  provider: "local";
  providerMessageId: null;
  sentAt: null;
  noSend: true;
  reason: "Local no-send adapter selected; no external email request was made.";
}

export interface EmailNoSendAdapter {
  readonly provider: "local";
  readonly noSend: true;
  send(input: EmailNoSendAdapterInput): Promise<EmailNoSendAdapterResult>;
  listAttempts(): readonly EmailNoSendAdapterInput[];
}

function normalizeAttempt(input: EmailNoSendAdapterInput): EmailNoSendAdapterInput {
  return {
    ...input,
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    subject: input.subject.trim(),
    relatedEntityId: input.relatedEntityId?.trim() || null,
    textBody: input.textBody?.trim() || null
  };
}

export function createEmailNoSendAdapter(): EmailNoSendAdapter {
  const attempts: EmailNoSendAdapterInput[] = [];

  return {
    provider: "local",
    noSend: true,
    async send(input) {
      attempts.push(normalizeAttempt(input));
      return {
        status: "SKIPPED",
        provider: "local",
        providerMessageId: null,
        sentAt: null,
        noSend: true,
        reason: "Local no-send adapter selected; no external email request was made."
      };
    },
    listAttempts() {
      return attempts.slice();
    }
  };
}
