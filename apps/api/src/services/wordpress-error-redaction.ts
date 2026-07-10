/**
 * WordPress error redaction helper (local-only, no HTTP).
 *
 * Ensures provider/error messages never echo Application Passwords,
 * Authorization headers, ciphertext, or token query fragments.
 */

import {
  assertWordPressCredentialsNeverSerialize,
  redactWordPressSerializableValue
} from "./wordpress-credentials-redaction";

const SECRET_FRAGMENT_PATTERN =
  /(application[_-]?password|wp[_-]?app[_-]?password|authorization\s*:|bearer\s+[a-z0-9._-]+|token=[^\s&]+|ciphertext|basic\s+[a-z0-9+/=]+)/gi;

export interface WordPressRedactedError {
  ok: false;
  status: "error" | "provider_disabled";
  errorMessage: string | null;
  providerDisabledReason?: string;
  /**
   * Safe category label for logs — never raw exception stacks with secrets.
   */
  errorCategory: string;
}

/**
 * Redact a free-form WordPress-related error string for API/log surfaces.
 */
export function redactWordPressErrorMessage(message: string | null | undefined): string | null {
  if (message == null || typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(SECRET_FRAGMENT_PATTERN, "[REDACTED]");
}

/**
 * Build a serializable WordPress error shape with credential-safe fields only.
 */
export function buildWordPressRedactedError(input: {
  status?: "error" | "provider_disabled";
  errorMessage?: string | null;
  providerDisabledReason?: string | null;
  errorCategory?: string;
  [key: string]: unknown;
}): WordPressRedactedError {
  const safe = redactWordPressSerializableValue({
    errorMessage: input.errorMessage,
    providerDisabledReason: input.providerDisabledReason,
    errorCategory: input.errorCategory
  }) as {
    errorMessage?: string | null;
    providerDisabledReason?: string | null;
    errorCategory?: string;
  };

  const result: WordPressRedactedError = {
    ok: false,
    status: input.status === "provider_disabled" ? "provider_disabled" : "error",
    errorMessage: redactWordPressErrorMessage(safe.errorMessage ?? null),
    errorCategory: (safe.errorCategory?.trim() || "wordpress_provider_error").slice(0, 80)
  };

  if (input.status === "provider_disabled" || input.providerDisabledReason) {
    result.providerDisabledReason =
      redactWordPressErrorMessage(safe.providerDisabledReason ?? null) ?? undefined;
  }

  if (!assertWordPressCredentialsNeverSerialize(result)) {
    throw new Error("WordPress redacted error failed credential serialization invariant.");
  }

  return result;
}
