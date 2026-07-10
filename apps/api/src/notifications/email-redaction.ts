/**
 * G509–G510 — email recipient + template-variable redaction helpers.
 * Pure, no network, no secrets, no provider calls.
 */

export const EMAIL_REDACTION_VERSION = "EMAIL_REDACTION_V1";

export const EMAIL_REDACTED_TOKEN = "[REDACTED]";
export const EMAIL_REDACTED_RECIPIENT_TOKEN = "[REDACTED_RECIPIENT]";

/** Keys that must never appear in email log / template variable views. */
export const EMAIL_TEMPLATE_VARIABLE_REDACT_KEYS = [
  "apiKey",
  "api_key",
  "authorization",
  "password",
  "secret",
  "token",
  "oauthToken",
  "oauth_token",
  "accessToken",
  "refreshToken",
  "storageKey",
  "storage_key",
  "stackTrace",
  "stack_trace",
  "privateAuditMetadata",
  "rawProviderResponse",
  "providerResponse",
  "resendApiKey",
  "RESEND_API_KEY"
] as const;

const REDACT_KEY_SET = new Set(
  EMAIL_TEMPLATE_VARIABLE_REDACT_KEYS.map((key) => key.toLowerCase())
);

function shouldRedactTemplateVariableKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (REDACT_KEY_SET.has(normalized)) {
    return true;
  }
  return (
    normalized.includes("secret") ||
    normalized.includes("apikey") ||
    normalized.includes("api_key") ||
    normalized.includes("oauth") ||
    normalized.includes("storagekey") ||
    normalized.includes("stacktrace") ||
    normalized.includes("privateaudit") ||
    normalized.includes("password") ||
    normalized.includes("authorization")
  );
}

/**
 * G509 — redact a recipient email for safe log / metadata views.
 * Keeps domain when the address is well-formed; otherwise a fixed token.
 */
export function redactEmailRecipient(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return EMAIL_REDACTED_RECIPIENT_TOKEN;
  }
  return `***@${trimmed.slice(at + 1)}`;
}

/**
 * G510 — redact sensitive template variables before any log / metadata exposure.
 * Nested objects/arrays are walked; sensitive keys become `[REDACTED]`.
 */
export function redactEmailTemplateVariables<T>(variables: T): T {
  return redactValue(variables) as T;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (typeof value !== "object") {
    return value;
  }
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(input)) {
    if (shouldRedactTemplateVariableKey(key)) {
      output[key] = EMAIL_REDACTED_TOKEN;
      continue;
    }
    output[key] = redactValue(nested);
  }
  return output;
}

/**
 * True when a serialized blob still contains an obvious secret-shaped value.
 * Key names alone (e.g. redacted `"RESEND_API_KEY":"[REDACTED]"`) are not leaks.
 */
export function emailSerializationContainsSecretLeak(serialized: string): boolean {
  if (/re_[A-Za-z0-9]{8,}/.test(serialized)) {
    return true;
  }
  if (serialized.includes("Bearer ")) {
    return true;
  }
  // Env-var name paired with a non-redacted string value.
  if (/RESEND_API_KEY"\s*:\s*"(?!\[REDACTED\])[^"]+"/.test(serialized)) {
    return true;
  }
  return false;
}
