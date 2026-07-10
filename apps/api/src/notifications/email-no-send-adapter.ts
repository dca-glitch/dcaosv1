import type {
  NotificationEventType,
  SchemaEmailTemplateKey,
  TypedNotificationTemplateKey
} from "@dca-os-v1/shared";
import { TYPED_NOTIFICATION_TEMPLATE_CATALOG } from "@dca-os-v1/shared";
import { redactEmailRecipient, redactEmailTemplateVariables } from "./email-redaction";
import { resolveEmailTemplateKey } from "./email-template-catalog";

export const EMAIL_NO_SEND_ADAPTER_VERSION = "EMAIL_NO_SEND_ADAPTER_V2";

export interface EmailNoSendAdapterInput {
  tenantId: string;
  recipientEmail: string;
  subject: string;
  /**
   * Schema-locked template key, typed catalog key, or unknown string.
   * Unknown keys are treated as missing-template (still no-send safe).
   */
  templateKey: SchemaEmailTemplateKey | TypedNotificationTemplateKey | string;
  eventType: NotificationEventType;
  relatedEntityId?: string | null;
  textBody?: string | null;
  /** Optional payload; redacted before any log/metadata exposure. */
  payload?: Record<string, unknown> | null;
  /** When true, recipient email is redacted in safe metadata / log views. */
  redactRecipientInLogs?: boolean;
}

export interface EmailNoSendSafeMetadata {
  tenantId: string;
  recipientEmail: string;
  subject: string;
  templateKey: SchemaEmailTemplateKey | null;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  eventType: NotificationEventType;
  relatedEntityId: string | null;
  templateResolved: boolean;
  templateMissing: boolean;
  payload: Record<string, unknown> | null;
  noSend: true;
  provider: "local";
}

export interface EmailNoSendAdapterResult {
  status: "SKIPPED";
  provider: "local";
  providerMessageId: null;
  sentAt: null;
  noSend: true;
  reason: "Local no-send adapter selected; no external email request was made.";
  templateResolved: boolean;
  templateMissing: boolean;
  safeMetadata: EmailNoSendSafeMetadata;
}

export interface EmailNoSendAdapter {
  readonly provider: "local";
  readonly noSend: true;
  send(input: EmailNoSendAdapterInput): Promise<EmailNoSendAdapterResult>;
  listAttempts(): readonly EmailNoSendAdapterInput[];
  listSafeMetadata(): readonly EmailNoSendSafeMetadata[];
}

function normalizeAttempt(input: EmailNoSendAdapterInput): EmailNoSendAdapterInput {
  return {
    ...input,
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    subject: input.subject.trim(),
    relatedEntityId: input.relatedEntityId?.trim() || null,
    textBody: input.textBody?.trim() || null,
    payload: input.payload ? redactEmailTemplateVariables(input.payload) : null,
    redactRecipientInLogs: Boolean(input.redactRecipientInLogs)
  };
}

function toSafeMetadata(attempt: EmailNoSendAdapterInput): EmailNoSendSafeMetadata {
  const resolved = resolveEmailTemplateKey(String(attempt.templateKey));
  const recipientEmail = attempt.redactRecipientInLogs
    ? redactEmailRecipient(attempt.recipientEmail)
    : attempt.recipientEmail;

  return {
    tenantId: attempt.tenantId,
    recipientEmail,
    subject: attempt.subject,
    templateKey: resolved.schemaTemplateKey,
    typedTemplateKey: resolved.typedTemplateKey,
    eventType: attempt.eventType,
    relatedEntityId: attempt.relatedEntityId ?? null,
    templateResolved: resolved.templateResolved,
    templateMissing: resolved.templateMissing,
    payload: attempt.payload ?? null,
    noSend: true,
    provider: "local"
  };
}

/**
 * Local no-send email adapter (G99 / G165 / G506).
 * Never calls an external provider, never requires an API key, and exposes only safe metadata.
 */
export function createEmailNoSendAdapter(): EmailNoSendAdapter {
  const attempts: EmailNoSendAdapterInput[] = [];
  const safeMetadata: EmailNoSendSafeMetadata[] = [];

  return {
    provider: "local",
    noSend: true,
    async send(input) {
      const normalized = normalizeAttempt(input);
      const metadata = toSafeMetadata(normalized);
      attempts.push(normalized);
      safeMetadata.push(metadata);

      return {
        status: "SKIPPED",
        provider: "local",
        providerMessageId: null,
        sentAt: null,
        noSend: true,
        reason: "Local no-send adapter selected; no external email request was made.",
        templateResolved: metadata.templateResolved,
        templateMissing: metadata.templateMissing,
        safeMetadata: metadata
      };
    },
    listAttempts() {
      return attempts.slice();
    },
    listSafeMetadata() {
      return safeMetadata.slice();
    }
  };
}

/** Convenience: assert a typed catalog key is known without requiring schema migration. */
export function isKnownTypedTemplate(templateKey: string): templateKey is TypedNotificationTemplateKey {
  return Object.prototype.hasOwnProperty.call(TYPED_NOTIFICATION_TEMPLATE_CATALOG, templateKey);
}
