/**
 * WordPress draft idempotency DESIGN helper (no Prisma, no HTTP).
 *
 * Decision (WORDPRESS_DRAFT_PROOF.md §6.5): ship a pure key builder now;
 * until an owner-approved live draft gate + optional schema for persisted
 * idempotency keys, live sessions must still use manual WordPress-admin
 * duplicate checks and record them in the evidence log.
 */

export const WORDPRESS_DRAFT_IDEMPOTENCY_DESIGN_VERSION = "WP_DRAFT_IDEM_V1" as const;

export interface BuildWordPressDraftIdempotencyKeyInput {
  tenantId: string;
  deliverableId: string;
  publicationTargetId?: string | null;
  /** Monotonic attempt counter for a future live create; defaults to 1. */
  attemptCounter?: number;
}

/**
 * Deterministic idempotency key for a future live WordPress draft create.
 * Format is stable for tests and manual evidence logs; not persisted yet.
 */
export function buildWordPressDraftIdempotencyKey(
  input: BuildWordPressDraftIdempotencyKeyInput
): string {
  const tenantId = input.tenantId.trim();
  const deliverableId = input.deliverableId.trim();
  const publicationTargetId = input.publicationTargetId?.trim() || "default-target";
  const attempt =
    typeof input.attemptCounter === "number" && Number.isFinite(input.attemptCounter)
      ? Math.max(1, Math.floor(input.attemptCounter))
      : 1;

  if (!tenantId || !deliverableId) {
    throw new Error("WordPress draft idempotency key requires tenantId and deliverableId.");
  }

  return ["wp-draft", tenantId, deliverableId, publicationTargetId, `attempt-${attempt}`].join("|");
}

export interface WordPressDraftIdempotencyDesignDecision {
  version: typeof WORDPRESS_DRAFT_IDEMPOTENCY_DESIGN_VERSION;
  /** Pure helper exists in-repo. */
  designHelperImplemented: true;
  /** No PublicationLog / request-row column yet — schema gate required to persist. */
  schemaPersistedKey: false;
  /** Live sessions remain manual-check until owner live gate. */
  liveProofPolicy: "design_helper_plus_manual_check_until_live_gate";
  liveHttpDeferred: true;
}

export function getWordPressDraftIdempotencyDesignDecision(): WordPressDraftIdempotencyDesignDecision {
  return {
    version: WORDPRESS_DRAFT_IDEMPOTENCY_DESIGN_VERSION,
    designHelperImplemented: true,
    schemaPersistedKey: false,
    liveProofPolicy: "design_helper_plus_manual_check_until_live_gate",
    liveHttpDeferred: true
  };
}
