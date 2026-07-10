/**
 * One-revision-round design helpers (G579 / G335).
 * Pure policy only — no DB persistence. Durable counter remains schema-deferred.
 */

export const REVISION_POLICY_VERSION = "REVISION_POLICY_V1";

/** Product rule: one client request-changes round per deliverable review cycle. */
export const CLIENT_REVISION_ROUND_LIMIT = 1;

export type RevisionRoundState = {
  /** How many request-changes rounds the client has already consumed. */
  roundsUsed: number;
  /** Soft design flag when a durable counter is not yet persisted. */
  persistenceAvailable: boolean;
};

export type RevisionRoundDecision =
  | {
      ok: true;
      version: typeof REVISION_POLICY_VERSION;
      roundsUsed: number;
      roundsRemaining: number;
      wouldConsumeRound: true;
      nextRoundsUsed: number;
    }
  | {
      ok: false;
      version: typeof REVISION_POLICY_VERSION;
      code: "REVISION_ROUND_EXHAUSTED" | "INVALID_ROUNDS_USED";
      message: string;
      roundsUsed: number;
      roundsRemaining: number;
    };

export const REVISION_ROUND_EXHAUSTED_MESSAGE =
  "Only one revision round is available for this article.";

/**
 * Evaluates whether a request-changes action may consume the single revision round.
 */
export function evaluateRevisionRound(state: RevisionRoundState): RevisionRoundDecision {
  const roundsUsed = Number.isFinite(state.roundsUsed) ? Math.max(0, Math.floor(state.roundsUsed)) : -1;
  if (roundsUsed < 0) {
    return {
      ok: false,
      version: REVISION_POLICY_VERSION,
      code: "INVALID_ROUNDS_USED",
      message: "Revision round state is invalid.",
      roundsUsed: 0,
      roundsRemaining: CLIENT_REVISION_ROUND_LIMIT
    };
  }

  const roundsRemaining = Math.max(0, CLIENT_REVISION_ROUND_LIMIT - roundsUsed);
  if (roundsRemaining <= 0) {
    return {
      ok: false,
      version: REVISION_POLICY_VERSION,
      code: "REVISION_ROUND_EXHAUSTED",
      message: REVISION_ROUND_EXHAUSTED_MESSAGE,
      roundsUsed,
      roundsRemaining: 0
    };
  }

  return {
    ok: true,
    version: REVISION_POLICY_VERSION,
    roundsUsed,
    roundsRemaining,
    wouldConsumeRound: true,
    nextRoundsUsed: roundsUsed + 1
  };
}

/**
 * Maps a boolean `revisionRoundUsed` flag (current runtime shape) onto RevisionRoundState.
 */
export function revisionRoundStateFromUsedFlag(
  revisionRoundUsed: boolean,
  persistenceAvailable = false
): RevisionRoundState {
  return {
    roundsUsed: revisionRoundUsed ? CLIENT_REVISION_ROUND_LIMIT : 0,
    persistenceAvailable
  };
}

/**
 * Design contract for deferred schema persistence (proposal only — no migration).
 */
export function getRevisionRoundPersistenceProposal(): {
  version: typeof REVISION_POLICY_VERSION;
  proposedField: "clientRevisionRoundUsed";
  proposedType: "Boolean @default(false)";
  model: "AiDeliveryDeliverable";
  resetOn: "send_for_client_review";
  enforceIn: "rejectClientPortalDeliverable";
  schemaChangeApproved: false;
  notes: string;
} {
  return {
    version: REVISION_POLICY_VERSION,
    proposedField: "clientRevisionRoundUsed",
    proposedType: "Boolean @default(false)",
    model: "AiDeliveryDeliverable",
    resetOn: "send_for_client_review",
    enforceIn: "rejectClientPortalDeliverable",
    schemaChangeApproved: false,
    notes:
      "Runtime currently passes revisionRoundUsed: false. Persist a boolean (or small int) after owner-approved migration; do not invent soft counters in JSON."
  };
}
