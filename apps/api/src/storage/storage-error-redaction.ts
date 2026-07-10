/**
 * Storage error redaction — strip storageKey paths, secrets, and stack traces
 * from messages safe for client-facing or log-summary surfaces.
 * Pure string helpers only — no R2 IO.
 * G475 — expanded patterns for documentStorageKey, signed-URL query fragments, and AWS-style keys.
 */

const STORAGE_KEY_PATH_PATTERN = /tenants\/[^\s"'`]+/gi;
const STORAGE_KEY_FIELD_PATTERN =
  /\b(storageKey|documentStorageKey)\b\s*[:=]\s*[^\s,;]+/gi;
const SECRET_ENV_VALUE_PATTERN =
  /\b(R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|R2_ACCOUNT_ID|secretAccessKey|accessKeyId|accountId)\b\s*[:=]\s*[^\s,;]+/gi;
const SIGNED_URL_QUERY_PATTERN =
  /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token|Signature)=[^\s&"']+/gi;
const AWS_ACCESS_KEY_PATTERN = /\bAKIA[0-9A-Z]{16}\b/g;
const STACK_TRACE_PATTERN = /\s+at\s+[^\n]+/g;
const WINDOWS_PATH_IN_STACK_PATTERN = /[A-Za-z]:\\[^\s)]+/g;

export type RedactedStorageError = {
  message: string;
  redacted: true;
  /** Always false: redaction is not live proof. */
  liveProven: false;
};

/**
 * Redact storage-sensitive fragments from an error message.
 * Prefer a short fallback when the message is unsafe or empty after scrubbing.
 */
export function redactStorageErrorMessage(
  raw: unknown,
  fallback = "Storage operation failed."
): RedactedStorageError {
  const source = typeof raw === "string" ? raw : raw instanceof Error ? raw.message : "";
  if (!source.trim()) {
    return { message: fallback, redacted: true, liveProven: false };
  }

  let scrubbed = source
    .replace(STORAGE_KEY_PATH_PATTERN, "[redacted-storage-key]")
    .replace(STORAGE_KEY_FIELD_PATTERN, "$1=[redacted]")
    .replace(SECRET_ENV_VALUE_PATTERN, "$1=[redacted]")
    .replace(SIGNED_URL_QUERY_PATTERN, "$1=[redacted]")
    .replace(AWS_ACCESS_KEY_PATTERN, "[redacted-access-key]")
    .replace(STACK_TRACE_PATTERN, "")
    .replace(WINDOWS_PATH_IN_STACK_PATTERN, "[redacted-path]")
    .replace(/\s+/g, " ")
    .trim();

  if (
    /\b(storageKey|documentStorageKey)\b/i.test(scrubbed) ||
    /tenants\/[^\s"'`]+/i.test(scrubbed) ||
    /X-Amz-Signature=[^\s[&"']+/i.test(scrubbed) ||
    /\bAKIA[0-9A-Z]{16}\b/.test(scrubbed)
  ) {
    return { message: fallback, redacted: true, liveProven: false };
  }

  if (!scrubbed || scrubbed.length > 240) {
    return { message: fallback, redacted: true, liveProven: false };
  }

  return { message: scrubbed, redacted: true, liveProven: false };
}

export function containsUnsafeStorageErrorContent(raw: unknown): boolean {
  const source = typeof raw === "string" ? raw : raw instanceof Error ? raw.message : String(raw ?? "");
  if (!source) {
    return false;
  }
  return (
    /tenants\/[^\s"'`]+/i.test(source) ||
    /\b(storageKey|documentStorageKey)\b\s*[:=]\s*[^\s,;]+/i.test(source) ||
    /\b(R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|R2_ACCOUNT_ID|secretAccessKey|accessKeyId|accountId)\b\s*[:=]\s*[^\s,;]+/i.test(
      source
    ) ||
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token|Signature)=[^\s&"']+/i.test(source) ||
    /\bAKIA[0-9A-Z]{16}\b/.test(source) ||
    /\bat\s+/.test(source)
  );
}

/**
 * Snapshot-friendly redaction result — never includes the raw unsafe message.
 */
export function toRedactedStorageErrorSnapshot(
  raw: unknown,
  fallback = "Storage operation failed."
): {
  redacted: true;
  liveProven: false;
  messageLength: number;
  usedFallback: boolean;
  stillContainsStorageKeyMarker: boolean;
  stillContainsTenantPath: boolean;
} {
  const result = redactStorageErrorMessage(raw, fallback);
  return {
    redacted: true,
    liveProven: false,
    messageLength: result.message.length,
    usedFallback: result.message === fallback,
    stillContainsStorageKeyMarker: /\b(storageKey|documentStorageKey)\b/i.test(result.message),
    stillContainsTenantPath: /tenants\//i.test(result.message)
  };
}
