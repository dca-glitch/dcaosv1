/**
 * G469 — R2 target-environment proof plan freeze (planning constants only).
 * Freezes the ordered checklist for a future owner-approved live bucket proof.
 * Never performs create/read/delete against a real R2 bucket.
 */

import {
  R2_PROOF_STAGE_KEYS,
  getR2ProofTruthLabel,
  type R2ProofStageKey,
  type R2ProofTruthLabel
} from "./r2-proof-stage";
import { R2_REQUIRED_ENV_KEYS } from "./r2.config";
import { R2_CLEANUP_PROOF_PLAN_STEP_KEYS } from "./r2-cleanup-proof-plan";

export const R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION = "r2-target-environment-proof-plan-v1" as const;

export const R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS = [
  "confirm_owner_approval",
  "confirm_target_env_names_only",
  "confirm_disabled_safe_local_baseline",
  "confirm_cleanup_plan_ready",
  "execute_byte_roundtrip_future",
  "verify_client_safe_no_storage_key",
  "restore_disabled_safe"
] as const;

export type R2TargetEnvironmentProofPlanStepKey =
  (typeof R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS)[number];

export type R2TargetEnvironmentProofPlanStep = {
  key: R2TargetEnvironmentProofPlanStepKey;
  label: string;
  order: number;
  /** True only for the future live roundtrip step — never executed by this module. */
  liveIoRequiredWhenExecuted: boolean;
  executedInThisModule: false;
  stopOnFailure: boolean;
};

export const R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEPS: Record<
  R2TargetEnvironmentProofPlanStepKey,
  R2TargetEnvironmentProofPlanStep
> = {
  confirm_owner_approval: {
    key: "confirm_owner_approval",
    label: "Confirm explicit owner approval for target-environment live R2 IO",
    order: 1,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  },
  confirm_target_env_names_only: {
    key: "confirm_target_env_names_only",
    label: "Confirm required R2_* env key names present (boolean presence only; never print values)",
    order: 2,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  },
  confirm_disabled_safe_local_baseline: {
    key: "confirm_disabled_safe_local_baseline",
    label: "Record local disabled-safe baseline before any target mutation",
    order: 3,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  },
  confirm_cleanup_plan_ready: {
    key: "confirm_cleanup_plan_ready",
    label: "Confirm cleanup/rollback proof-plan steps are ready before live IO",
    order: 4,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  },
  execute_byte_roundtrip_future: {
    key: "execute_byte_roundtrip_future",
    label: "Future: upload → signed download → SHA-256 match → delete (owner-approved live only)",
    order: 5,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    stopOnFailure: true
  },
  verify_client_safe_no_storage_key: {
    key: "verify_client_safe_no_storage_key",
    label: "Verify client responses expose no storageKey / documentStorageKey",
    order: 6,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  },
  restore_disabled_safe: {
    key: "restore_disabled_safe",
    label: "Restore disabled-safe local posture after proof session",
    order: 7,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  }
} as const;

export type R2TargetEnvironmentProofPlan = {
  version: typeof R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION;
  /** Always false: freezing the plan is not live proof. */
  liveIoPerformed: false;
  /** Always false: plan freeze never claims a real-bucket proof. */
  claimsLiveBucketProof: false;
  /** Stage that may allow IO later — still not executed here. */
  futureLiveStage: Extract<R2ProofStageKey, "future_real_bucket">;
  futureLiveTruthLabel: R2ProofTruthLabel;
  requiredEnvKeyNames: readonly (typeof R2_REQUIRED_ENV_KEYS)[number][];
  cleanupPlanStepKeys: readonly (typeof R2_CLEANUP_PROOF_PLAN_STEP_KEYS)[number][];
  proofStageKeys: readonly R2ProofStageKey[];
  steps: R2TargetEnvironmentProofPlanStep[];
  note: string;
};

/**
 * Build the frozen target-environment proof plan.
 * Planning only — no network, filesystem, or bucket IO.
 */
export function buildR2TargetEnvironmentProofPlan(): R2TargetEnvironmentProofPlan {
  return {
    version: R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    futureLiveStage: "future_real_bucket",
    futureLiveTruthLabel: getR2ProofTruthLabel("future_real_bucket"),
    requiredEnvKeyNames: [...R2_REQUIRED_ENV_KEYS],
    cleanupPlanStepKeys: [...R2_CLEANUP_PROOF_PLAN_STEP_KEYS],
    proofStageKeys: [...R2_PROOF_STAGE_KEYS],
    steps: R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS.map(
      (key) => R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEPS[key]
    ),
    note: "Plan freeze only. No create/read/delete against a real R2 bucket is performed by this helper."
  };
}

export function getR2TargetEnvironmentProofPlanStep(
  key: R2TargetEnvironmentProofPlanStepKey
): R2TargetEnvironmentProofPlanStep {
  return R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEPS[key];
}

export function isR2TargetEnvironmentProofPlanStepKey(
  value: string
): value is R2TargetEnvironmentProofPlanStepKey {
  return (R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS as readonly string[]).includes(value);
}

/**
 * Invariant: building/resolving the target-environment plan never claims live bucket proof or IO.
 */
export function assertR2TargetEnvironmentProofPlanNoIoInvariant(
  plan: R2TargetEnvironmentProofPlan = buildR2TargetEnvironmentProofPlan()
): {
  ok: boolean;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  allStepsUnexecuted: boolean;
  onlyOneLiveIoStep: boolean;
  reason: string;
} {
  const allStepsUnexecuted = plan.steps.every((step) => step.executedInThisModule === false);
  const liveIoSteps = plan.steps.filter((step) => step.liveIoRequiredWhenExecuted);
  const onlyOneLiveIoStep =
    liveIoSteps.length === 1 && liveIoSteps[0]?.key === "execute_byte_roundtrip_future";
  const ok =
    plan.liveIoPerformed === false &&
    plan.claimsLiveBucketProof === false &&
    plan.futureLiveTruthLabel === "future_real_bucket_not_executed" &&
    allStepsUnexecuted &&
    onlyOneLiveIoStep;

  return {
    ok,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    allStepsUnexecuted,
    onlyOneLiveIoStep,
    reason: ok
      ? "Target-environment proof plan is frozen planning-only; no live IO claimed."
      : "Target-environment proof plan invariant violated."
  };
}

/**
 * Snapshot-friendly shape for tests/docs — never includes secret values.
 */
export function toR2TargetEnvironmentProofPlanSnapshot(
  plan: R2TargetEnvironmentProofPlan = buildR2TargetEnvironmentProofPlan()
): {
  version: typeof R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  futureLiveStage: "future_real_bucket";
  futureLiveTruthLabel: R2ProofTruthLabel;
  stepKeys: R2TargetEnvironmentProofPlanStepKey[];
  requiredEnvKeyNames: string[];
  liveIoStepCount: number;
} {
  return {
    version: plan.version,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    futureLiveStage: "future_real_bucket",
    futureLiveTruthLabel: plan.futureLiveTruthLabel,
    stepKeys: plan.steps.map((step) => step.key),
    requiredEnvKeyNames: [...plan.requiredEnvKeyNames],
    liveIoStepCount: plan.steps.filter((step) => step.liveIoRequiredWhenExecuted).length
  };
}
