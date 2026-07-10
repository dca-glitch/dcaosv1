/**
 * Client-portal serializer / no-leak helpers (G565–G569).
 * Pure functions for asserting and stripping forbidden internal fields
 * from client-facing payloads. Does not weaken RBAC.
 */

import {
  CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS,
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";

/** Internal / admin workflow statuses that must never appear as archive-visible. */
export const CLIENT_PORTAL_INTERNAL_DELIVERABLE_STATUSES = [
  "DRAFT",
  "PENDING_CLIENT_REVIEW",
  "APPROVED_BY_CLIENT",
  "ADMIN_REVIEW",
  "IN_PROGRESS",
  "GENERATING",
  "FAILED",
  "CANCELLED"
] as const;

/** Monthly report statuses that must never appear in client archive lists. */
export const CLIENT_PORTAL_INTERNAL_MONTHLY_REPORT_STATUSES = [
  "DRAFT",
  "IMPORTED",
  "APPROVED",
  "ADMIN_REVIEW",
  "ARCHIVED"
] as const;

/** Client archive deliverable statuses only. */
export const CLIENT_PORTAL_ARCHIVE_DELIVERABLE_STATUSES = ["DELIVERED", "ACCEPTED"] as const;

/** Client archive monthly report status only. */
export const CLIENT_PORTAL_ARCHIVE_MONTHLY_REPORT_STATUS = "FINAL" as const;

export type ClientPortalSafeDownloadReference = {
  downloadUrl: string;
  expiresSeconds: number;
};

/**
 * Builds a client-safe download envelope from an internal storage key.
 * The storageKey is consumed and never returned.
 */
export function toClientPortalSafeDownloadReference(
  storageKey: string | null | undefined,
  downloadUrl: string | null | undefined,
  expiresSeconds: number | null | undefined
): { downloadReference: ClientPortalSafeDownloadReference | null } {
  if (!storageKey?.trim() || !downloadUrl?.trim()) {
    return { downloadReference: null };
  }

  const expires =
    typeof expiresSeconds === "number" && Number.isFinite(expiresSeconds) && expiresSeconds > 0
      ? Math.floor(expiresSeconds)
      : 60;

  return {
    downloadReference: {
      downloadUrl: downloadUrl.trim(),
      expiresSeconds: expires
    }
  };
}

/**
 * Returns true when a deliverable status is allowed on the client archive surface.
 */
export function isClientPortalArchiveDeliverableStatus(status: string): boolean {
  return (CLIENT_PORTAL_ARCHIVE_DELIVERABLE_STATUSES as readonly string[]).includes(status);
}

/**
 * Returns true when a monthly report status is allowed on the client archive surface.
 */
export function isClientPortalArchiveMonthlyReportStatus(status: string): boolean {
  return status === CLIENT_PORTAL_ARCHIVE_MONTHLY_REPORT_STATUS;
}

/**
 * Returns true when a status is an internal/admin workflow status that must not
 * leak into archive serializers as a visible client status.
 */
export function isClientPortalInternalDeliverableStatus(status: string): boolean {
  return (CLIENT_PORTAL_INTERNAL_DELIVERABLE_STATUSES as readonly string[]).includes(status);
}

/**
 * Deep-clones a value while omitting forbidden client-portal keys.
 * Used as a defensive last-pass before asserting serializer output.
 */
export function stripClientPortalForbiddenKeys<T>(value: T, depth = 0): T {
  if (depth > 8 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripClientPortalForbiddenKeys(item, depth + 1)) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    out[key] = stripClientPortalForbiddenKeys(child, depth + 1);
  }
  return out as T;
}

/**
 * Asserts a payload has no forbidden keys and no raw storage path / cost markers
 * in its JSON serialization.
 */
export function assertClientPortalSerializerNoLeak(
  value: unknown,
  options: { forbiddenRawFragments?: string[] } = {}
): void {
  assertClientPortalPayloadHasNoForbiddenKeys(value);

  const serialized = JSON.stringify(value);
  const fragments = options.forbiddenRawFragments ?? [];
  for (const fragment of fragments) {
    if (fragment && serialized.includes(fragment)) {
      throw new Error(`Client portal payload leaked raw fragment: ${fragment}`);
    }
  }

  if (/"storageKey"\s*:/.test(serialized)) {
    throw new Error("Client portal payload leaked storageKey field in JSON");
  }
  if (/"providerMetadata"\s*:/.test(serialized)) {
    throw new Error("Client portal payload leaked providerMetadata field in JSON");
  }
  if (/"actualCostUsd"\s*:/.test(serialized) || /"rawCost"\s*:/.test(serialized)) {
    throw new Error("Client portal payload leaked raw cost field in JSON");
  }
}

export function listClientPortalForbiddenSerializerKeys(): readonly string[] {
  return CLIENT_PORTAL_FORBIDDEN_PAYLOAD_KEYS;
}

export function findClientPortalForbiddenSerializerKeys(value: unknown): string[] {
  return collectClientPortalForbiddenPayloadKeys(value);
}
