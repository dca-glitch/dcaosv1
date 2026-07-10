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

export function getR2ProofStage(key: R2ProofStageKey): R2ProofStage {
  return R2_PROOF_STAGES[key];
}
