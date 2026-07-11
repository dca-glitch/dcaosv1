import {
  getClientStatusLabel,
  isClientVisibleStatus,
  normalizeStatusKey,
  type StatusKey
} from "../../design-system/status";

/**
 * Fragments that must never appear as client-visible status copy.
 * Used for negative tests and defensive filtering of free-form strings.
 */
const FORBIDDEN_CLIENT_STATUS_FRAGMENTS = [
  "blocked",
  "failed",
  "changes_requested",
  "workflowrun",
  "jobid",
  "runid",
  "tokencount",
  "openrouter",
  "providername",
  "rawai",
  "internalnote"
] as const;

/** Early / incomplete statuses hidden on archive-style surfaces. */
const ARCHIVE_HIDDEN_NORMALIZED = new Set([
  "DRAFT",
  "NONE",
  "PENDING",
  "NOT_STARTED",
  "IN_PROGRESS"
]);

/**
 * Explicit client-safe labels for portal enums that should not fall through
 * to raw title-casing (which can leak internal tokens).
 */
const EXPLICIT_CLIENT_LABELS: Record<string, string> = {
  ADMIN_REVIEW: "Under review",
  FINAL: "Complete",
  DELIVERED: "Delivered",
  ACCEPTED: "Accepted",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  APPROVED: "Approved",
  PENDING_CLIENT_REVIEW: "Needs your review",
  APPROVED_BY_CLIENT: "Approved",
  SENT_TO_CLIENT: "Shared with you"
};

/** Returns true when a status string looks like forbidden admin metadata. */
export function containsForbiddenClientStatusLeak(value: string): boolean {
  const compact = value.toLowerCase().replace(/[\s_-]+/g, "");
  return FORBIDDEN_CLIENT_STATUS_FRAGMENTS.some((fragment) => {
    const compactFragment = fragment.toLowerCase().replace(/[\s_-]+/g, "");
    return compact.includes(compactFragment);
  });
}

/**
 * Resolve a client-visible label for portal surfaces.
 * Returns null when the status should be hidden (incomplete, internal, or unknown).
 */
export function toClientPortalStatusLabel(status: string | null | undefined): string | null {
  if (!status || !status.trim()) {
    return null;
  }

  const normalized = status.trim().toUpperCase();

  if (ARCHIVE_HIDDEN_NORMALIZED.has(normalized)) {
    return null;
  }

  if (EXPLICIT_CLIENT_LABELS[normalized]) {
    return EXPLICIT_CLIENT_LABELS[normalized];
  }

  const key = normalizeStatusKey(status);
  if (key) {
    if (!isClientVisibleStatus(key)) {
      return null;
    }
    return getClientStatusLabel(key);
  }

  // Unknown internal enums — do not title-case leak workflow tokens to clients.
  return null;
}

/** Whether a raw status may be shown on portal surfaces. */
export function isClientPortalStatusVisible(status: string | null | undefined): boolean {
  return toClientPortalStatusLabel(status) != null;
}

/** Map brief workflow status to a calm client-facing label. */
export function toClientBriefStatusLabel(
  status: "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED" | string
): { label: string; tone: "success" | "info" | "warning" } {
  if (status === "DRAFT") return { label: "Draft", tone: "warning" };
  if (status === "SUBMITTED") return { label: "Submitted", tone: "success" };
  if (status === "AWAITING_CLIENT") return { label: "Awaiting your input", tone: "info" };
  return { label: "In progress", tone: "info" };
}

/** Prefer canonical client vocabulary when a StatusKey is known. */
export function resolveClientStatusKey(status: string): StatusKey | null {
  const key = normalizeStatusKey(status);
  if (!key || !isClientVisibleStatus(key)) {
    return null;
  }
  return key;
}
