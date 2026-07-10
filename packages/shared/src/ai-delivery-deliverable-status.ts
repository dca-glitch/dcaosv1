/**
 * Canonical AI Delivery deliverable status policy (shared frontend + backend contract).
 *
 * Single source of truth for:
 * - the valid deliverable status set,
 * - permitted source-to-target transitions,
 * - status classification helpers,
 * - human-readable labels.
 *
 * Backend runtime, controller validation, and frontend all import from here so the
 * status definition cannot drift across layers. Pure module: no I/O, no persistence.
 */

export const AI_DELIVERY_DELIVERABLE_STATUSES = [
  "DRAFT",
  "READY",
  "DELIVERED",
  "REVISION_REQUESTED",
  "ACCEPTED",
  "ARCHIVED",
  "PENDING_CLIENT_REVIEW",
  "APPROVED_BY_CLIENT"
] as const;

export type AiDeliveryDeliverableStatus = (typeof AI_DELIVERY_DELIVERABLE_STATUSES)[number];

const AI_DELIVERY_DELIVERABLE_STATUS_SET = new Set<string>(AI_DELIVERY_DELIVERABLE_STATUSES);

export function isAiDeliveryDeliverableStatus(value: unknown): value is AiDeliveryDeliverableStatus {
  return typeof value === "string" && AI_DELIVERY_DELIVERABLE_STATUS_SET.has(value);
}

/** Normalizes free-form input to a canonical status, or null when unrecognized. */
export function parseAiDeliveryDeliverableStatus(
  value: string | null | undefined
): AiDeliveryDeliverableStatus | null {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : null;
  return normalized && AI_DELIVERY_DELIVERABLE_STATUS_SET.has(normalized)
    ? (normalized as AiDeliveryDeliverableStatus)
    : null;
}

/**
 * Permitted source-to-target transitions, reconstructed from the existing runtime lifecycle:
 * - drafting → internal ready / client review,
 * - internal ready/delivered → accepted / revision,
 * - client review → approved / revision,
 * - one revision cycle back into ready or client review,
 * - archive from any active state, restore from archive.
 */
export const AI_DELIVERY_DELIVERABLE_TRANSITIONS: Record<
  AiDeliveryDeliverableStatus,
  AiDeliveryDeliverableStatus[]
> = {
  DRAFT: ["READY", "PENDING_CLIENT_REVIEW", "ARCHIVED"],
  READY: ["REVISION_REQUESTED", "ACCEPTED", "ARCHIVED"],
  DELIVERED: ["REVISION_REQUESTED", "ACCEPTED", "ARCHIVED"],
  REVISION_REQUESTED: ["READY", "PENDING_CLIENT_REVIEW", "ARCHIVED"],
  ACCEPTED: ["REVISION_REQUESTED", "ARCHIVED"],
  PENDING_CLIENT_REVIEW: ["APPROVED_BY_CLIENT", "REVISION_REQUESTED", "ARCHIVED"],
  APPROVED_BY_CLIENT: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"]
};

/** True when moving from → to is allowed. Same-status is treated as an idempotent no-op. */
export function canTransitionAiDeliveryDeliverableStatus(
  from: AiDeliveryDeliverableStatus,
  to: AiDeliveryDeliverableStatus
): boolean {
  if (from === to) return true;
  return (AI_DELIVERY_DELIVERABLE_TRANSITIONS[from] ?? []).includes(to);
}

export type AiDeliveryDeliverableTransitionCheck =
  | { ok: true }
  | { ok: false; code: "AI_DELIVERY_DELIVERABLE_TRANSITION_BLOCKED"; message: string };

export function checkAiDeliveryDeliverableTransition(
  from: AiDeliveryDeliverableStatus,
  to: AiDeliveryDeliverableStatus
): AiDeliveryDeliverableTransitionCheck {
  if (canTransitionAiDeliveryDeliverableStatus(from, to)) {
    return { ok: true };
  }
  return {
    ok: false,
    code: "AI_DELIVERY_DELIVERABLE_TRANSITION_BLOCKED",
    message: `Deliverable status transition from ${from} to ${to} is not allowed.`
  };
}

// --- Classification helpers -------------------------------------------------

/** Freely editable draft-track states (safe to edit body/links without workflow meaning). */
export function isEditableDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "DRAFT" || status === "REVISION_REQUESTED";
}

/** Internal admin handoff track (not client-facing). */
export function isInternalDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "READY" || status === "DELIVERED" || status === "ACCEPTED";
}

/** Deliverable is awaiting client review. */
export function isClientReviewDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "PENDING_CLIENT_REVIEW";
}

/** Deliverable is in the client-requested revision state. */
export function isRevisionRequestedDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "REVISION_REQUESTED";
}

/** Approved / finalized states. */
export function isApprovedFinalDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "APPROVED_BY_CLIENT" || status === "ACCEPTED" || status === "DELIVERED";
}

export function isArchivedDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status === "ARCHIVED";
}

/**
 * True when the status is driven by dedicated workflow actions and must NOT be freely
 * re-selected through a generic editor (prevents silent resets to DRAFT).
 */
export function isWorkflowControlledDeliverableStatus(status: AiDeliveryDeliverableStatus): boolean {
  return status !== "DRAFT";
}

// --- Labels -----------------------------------------------------------------

export const AI_DELIVERY_DELIVERABLE_STATUS_LABELS: Record<AiDeliveryDeliverableStatus, string> = {
  DRAFT: "Draft / packaging",
  READY: "Ready for final handoff",
  DELIVERED: "Delivered record",
  REVISION_REQUESTED: "Revision requested",
  ACCEPTED: "Internally accepted",
  ARCHIVED: "Archived",
  PENDING_CLIENT_REVIEW: "Pending client review",
  APPROVED_BY_CLIENT: "Approved by client"
};

/**
 * Human-readable label. Unknown/legacy values are humanized (never silently coerced to DRAFT),
 * so an unexpected persisted status is visible rather than misrepresented.
 */
export function formatAiDeliveryDeliverableStatusLabel(value?: string | null): string {
  const parsed = parseAiDeliveryDeliverableStatus(value);
  if (parsed) {
    return AI_DELIVERY_DELIVERABLE_STATUS_LABELS[parsed];
  }
  if (!value) return "Not set";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
}
