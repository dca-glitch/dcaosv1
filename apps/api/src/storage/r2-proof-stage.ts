export const R2_PROOF_STAGE_KEYS = [
  "local_mock",
  "config_shape",
  "future_real_bucket",
  "client_safe_download",
  "cleanup"
] as const;

export type R2ProofStageKey = (typeof R2_PROOF_STAGE_KEYS)[number];

export type R2ProofStage = {
  key: R2ProofStageKey;
  label: string;
  liveBucketIoAllowed: boolean;
  clientSafe: boolean;
  cleanupRequiredBeforeLiveProof: boolean;
};

/**
 * Truth labels for proof reporting. No-IO stages must never be labeled as live-proven.
 */
export type R2ProofTruthLabel =
  | "local_mock_no_io"
  | "config_shape_only"
  | "client_safe_boundary_only"
  | "cleanup_plan_only"
  | "future_real_bucket_not_executed";

export const R2_PROOF_STAGES: Record<R2ProofStageKey, R2ProofStage> = {
  local_mock: {
    key: "local_mock",
    label: "Local/mock no-IO proof",
    liveBucketIoAllowed: false,
    clientSafe: true,
    cleanupRequiredBeforeLiveProof: false
  },
  config_shape: {
    key: "config_shape",
    label: "Config-shape readiness proof",
    liveBucketIoAllowed: false,
    clientSafe: true,
    cleanupRequiredBeforeLiveProof: false
  },
  future_real_bucket: {
    key: "future_real_bucket",
    label: "Future real bucket proof",
    liveBucketIoAllowed: true,
    clientSafe: false,
    cleanupRequiredBeforeLiveProof: true
  },
  client_safe_download: {
    key: "client_safe_download",
    label: "Client-safe signed download boundary",
    liveBucketIoAllowed: false,
    clientSafe: true,
    cleanupRequiredBeforeLiveProof: false
  },
  cleanup: {
    key: "cleanup",
    label: "Proof fixture cleanup",
    liveBucketIoAllowed: false,
    clientSafe: true,
    cleanupRequiredBeforeLiveProof: true
  }
} as const;

const R2_PROOF_TRUTH_LABELS: Record<R2ProofStageKey, R2ProofTruthLabel> = {
  local_mock: "local_mock_no_io",
  config_shape: "config_shape_only",
  client_safe_download: "client_safe_boundary_only",
  cleanup: "cleanup_plan_only",
  future_real_bucket: "future_real_bucket_not_executed"
};

export function isR2ProofStageKey(value: string): value is R2ProofStageKey {
  return (R2_PROOF_STAGE_KEYS as readonly string[]).includes(value);
}

export function getR2ProofStage(key: R2ProofStageKey): R2ProofStage {
  return R2_PROOF_STAGES[key];
}

/**
 * Resolves a stage key safely. Invalid keys return null — never invent a live-proof stage.
 */
export function resolveR2ProofStage(key: string): R2ProofStage | null {
  if (!isR2ProofStageKey(key)) {
    return null;
  }
  return R2_PROOF_STAGES[key];
}

export function getR2ProofTruthLabel(key: R2ProofStageKey): R2ProofTruthLabel {
  return R2_PROOF_TRUTH_LABELS[key];
}

/**
 * Live bucket proof is only claimable when the stage allows IO **and** IO actually ran.
 * Config/mock/cleanup helpers must pass `ioPerformed: false` and therefore never claim live proof.
 */
export function claimsLiveBucketProof(key: R2ProofStageKey, ioPerformed: boolean): boolean {
  return R2_PROOF_STAGES[key].liveBucketIoAllowed === true && ioPerformed === true;
}

/**
 * Forbidden for automated no-IO unit/proof helpers: selecting a live-IO stage while claiming
 * that no bucket IO occurred still must not be reported as live-proven.
 */
export function assertNoLiveProofWithoutIo(key: R2ProofStageKey, ioPerformed: boolean): {
  ok: boolean;
  liveProven: false | true;
  truthLabel: R2ProofTruthLabel;
  reason: string;
} {
  const truthLabel = getR2ProofTruthLabel(key);
  const liveProven = claimsLiveBucketProof(key, ioPerformed);

  if (!ioPerformed) {
    return {
      ok: true,
      liveProven: false,
      truthLabel,
      reason: "No bucket IO performed; live proof is not claimed."
    };
  }

  if (!R2_PROOF_STAGES[key].liveBucketIoAllowed) {
    return {
      ok: false,
      liveProven: false,
      truthLabel,
      reason: `Stage "${key}" forbids live bucket IO.`
    };
  }

  return {
    ok: true,
    liveProven: true,
    truthLabel,
    reason: "Live bucket IO performed under an allowed stage."
  };
}
