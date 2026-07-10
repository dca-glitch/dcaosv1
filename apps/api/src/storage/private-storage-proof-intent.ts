import {
  assertNoLiveProofWithoutIo,
  getR2ProofStage,
  getR2ProofTruthLabel,
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

const STAGE_PURPOSE: Record<R2ProofStageKey, string> = {
  local_mock: "Exercise local/mock private-storage helpers without bucket IO.",
  config_shape: "Validate required R2 env shape and redacted readiness labels only.",
  future_real_bucket: "Plan a future owner-approved real bucket proof; do not execute here.",
  client_safe_download: "Prove client responses may expose export/download URLs but never storageKey.",
  cleanup: "Plan fixture cleanup/rollback steps before any future live proof."
};

export function buildPrivateStorageProofIntent(stage: R2ProofStageKey): PrivateStorageProofIntent {
  const proofStage = getR2ProofStage(stage);
  const guard = assertNoLiveProofWithoutIo(stage, false);

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

export function isPrivateStorageProofIntentLiveSafe(intent: PrivateStorageProofIntent): boolean {
  return intent.liveIoPerformed === false && intent.claimsLiveBucketProof === false;
}
