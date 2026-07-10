/**
 * Client-portal error message safety (G204).
 * Strips stack traces, storage keys, unsafe internal IDs, and provider metadata
 * from any message that might reach a client-facing response.
 */

const CLIENT_PORTAL_UNSAFE_ERROR_PATTERNS: RegExp[] = [
  /\bat\s+\S+\s+\([^)]+:\d+:\d+\)/g,
  /\bat\s+\S+\s+\(.*[\\/][^)]+\)/g,
  /\bstorageKey\b/gi,
  /\btenants\/[A-Za-z0-9_\-./]+/g,
  /\bproviderMetadata\b/gi,
  /\bworkflowRunId\b/gi,
  /\bexecutionLog\b/gi,
  /\badminSummaryNotes\b/gi,
  /\bactualCostUsd\b/gi,
  /\bjobQueueStatus\b/gi,
  /\bauditLog(s)?\b/gi,
  /\bmiHandoffId\b/gi,
  /\breleasePackageId\b/gi,
  /\bstack\b\s*:/gi,
  /Error:\s*.+\n\s+at\s+/g
];

const DEFAULT_CLIENT_PORTAL_SAFE_ERROR = "Request could not be completed.";

export function containsClientPortalUnsafeErrorContent(value: string): boolean {
  if (!value.trim()) return false;
  return CLIENT_PORTAL_UNSAFE_ERROR_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

export function toClientPortalSafeErrorMessage(
  raw: unknown,
  fallback: string = DEFAULT_CLIENT_PORTAL_SAFE_ERROR
): string {
  const safeFallback =
    typeof fallback === "string" && fallback.trim().length > 0
      ? fallback.trim()
      : DEFAULT_CLIENT_PORTAL_SAFE_ERROR;

  if (typeof raw !== "string") {
    return safeFallback;
  }

  const cleaned = raw.trim();
  if (!cleaned) {
    return safeFallback;
  }

  // Any unsafe marker in the original message → replace entirely (do not partial-strip).
  if (containsClientPortalUnsafeErrorContent(cleaned)) {
    return safeFallback;
  }

  // Cap length so accidental dumps cannot leak through.
  if (cleaned.length > 240) {
    return safeFallback;
  }

  return cleaned;
}

/** Forbidden keys that must never appear in client-portal JSON payloads. */
export const CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS = [
  "storageKey",
  "providerMetadata",
  "provider",
  "workflowRunId",
  "workflowRunStatus",
  "jobQueueStatus",
  "queueStatus",
  "auditLog",
  "auditLogs",
  "actualCostUsd",
  "estimatedCostUsd",
  "rawCost",
  "costRows",
  "adminSummaryNotes",
  "adminNotes",
  "executionLog",
  "releasePackageId",
  "miHandoffId",
  "structuredInputJson",
  "promptScaffold",
  "itemMetrics",
  "verificationRequiredNotes"
] as const;

export function collectClientPortalForbiddenPayloadKeys(
  value: unknown,
  found: Set<string> = new Set(),
  depth = 0
): string[] {
  if (depth > 8 || value === null || value === undefined) {
    return [...found];
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectClientPortalForbiddenPayloadKeys(item, found, depth + 1);
    }
    return [...found];
  }

  if (typeof value !== "object") {
    return [...found];
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectClientPortalForbiddenPayloadKeys(child, found, depth + 1);
  }

  return [...found];
}

export function assertClientPortalPayloadHasNoForbiddenKeys(value: unknown): void {
  const forbidden = collectClientPortalForbiddenPayloadKeys(value);
  if (forbidden.length > 0) {
    throw new Error(`Client portal payload leaked forbidden keys: ${forbidden.join(", ")}`);
  }
}
