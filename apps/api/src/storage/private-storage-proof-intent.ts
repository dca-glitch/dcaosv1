import {
  assertNoLiveProofWithoutIo,
  getR2ProofStage,
  getR2ProofTruthLabel,
  isR2ProofStageKey,
  type R2ProofStageKey,
  type R2ProofTruthLabel
} from "./r2-proof-stage";

/**
 * Pure private-storage proof intent — planning/labeling only.
 * Never performs R2/network/filesystem IO.
 */
export type PrivateStorageProofIntent = {
  stage: R2ProofStageKey;
  label: string;
  truthLabel: R2ProofTruthLabel;
  liveIoAllowed: boolean;
  /** Always false for this helper: intent construction is not live proof. */
  liveIoPerformed: false;
  /** Always false: building intent never claims a real-bucket proof. */
  claimsLiveBucketProof: false;
  clientSafe: boolean;
  cleanupRequiredBeforeLiveProof: boolean;
  purpose: string;
};

export type PrivateStorageProofIntentResult =
  | { ok: true; intent: PrivateStorageProofIntent }
  | { ok: false; intent: null; error: string };

const STAGE_PURPOSE: Record<R2ProofStageKey, string> = {
  local_mock: "Exercise local/mock private-storage helpers without bucket IO.",
  config_shape: "Validate required R2 env shape and redacted readiness labels only.",
  future_real_bucket: "Plan a future owner-approved real bucket proof; do not execute here.",
  client_safe_download: "Prove client responses may expose export/download URLs but never storageKey.",
  cleanup: "Plan fixture cleanup/rollback steps before any future live proof."
};

export function buildPrivateStorageProofIntent(stage: R2ProofStageKey): PrivateStorageProofIntent {
  const proofStage = getR2ProofStage(stage);
  void assertNoLiveProofWithoutIo(stage, false);

  return {
    stage,
    label: proofStage.label,
    truthLabel: getR2ProofTruthLabel(stage),
    liveIoAllowed: proofStage.liveBucketIoAllowed,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    clientSafe: proofStage.clientSafe,
    cleanupRequiredBeforeLiveProof: proofStage.cleanupRequiredBeforeLiveProof,
    purpose: STAGE_PURPOSE[stage]
  };
}

/**
 * Safe resolver for untrusted stage input. Invalid keys never invent a live-proof intent.
 */
export function resolvePrivateStorageProofIntent(stage: unknown): PrivateStorageProofIntentResult {
  if (typeof stage !== "string" || !stage.trim()) {
    return {
      ok: false,
      intent: null,
      error: "Proof stage must be a non-empty string."
    };
  }

  if (!isR2ProofStageKey(stage)) {
    return {
      ok: false,
      intent: null,
      error: `Unknown proof stage "${stage}"; refusing to invent a live-proof intent.`
    };
  }

  return { ok: true, intent: buildPrivateStorageProofIntent(stage) };
}

export function isPrivateStorageProofIntentLiveSafe(intent: PrivateStorageProofIntent): boolean {
  return intent.liveIoPerformed === false && intent.claimsLiveBucketProof === false;
}

/**
 * Snapshot-friendly shape for proof intent (stable field order for tests).
 */
export function toPrivateStorageProofIntentSnapshot(intent: PrivateStorageProofIntent): {
  stage: R2ProofStageKey;
  truthLabel: R2ProofTruthLabel;
  liveIoAllowed: boolean;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  clientSafe: boolean;
  cleanupRequiredBeforeLiveProof: boolean;
} {
  return {
    stage: intent.stage,
    truthLabel: intent.truthLabel,
    liveIoAllowed: intent.liveIoAllowed,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    clientSafe: intent.clientSafe,
    cleanupRequiredBeforeLiveProof: intent.cleanupRequiredBeforeLiveProof
  };
}
