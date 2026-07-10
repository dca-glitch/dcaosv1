/**
 * G470 — Consolidated R2 proof-stage / readiness / cleanup contracts (barrel).
 * Re-exports typed constants and helpers used by no-IO proof planning.
 * Never performs live R2 IO.
 */

export {
  R2_PROOF_STAGE_KEYS,
  R2_PROOF_STAGES,
  assertNoLiveProofWithoutIo,
  assertR2ProofNoIoOnlyLabelInvariant,
  claimsLiveBucketProof,
  getR2ProofStage,
  getR2ProofTruthLabel,
  isR2ProofStageKey,
  resolveR2ProofStage,
  toR2ProofStageSnapshot,
  type R2ProofStage,
  type R2ProofStageKey,
  type R2ProofTruthLabel
} from "./r2-proof-stage";

export {
  R2_ENV_KEYS,
  R2_REQUIRED_ENV_KEYS,
  getR2Config,
  getR2ConfigRedactedSummary,
  getR2EnvPresence,
  toR2ConfigRedactedSummarySnapshot,
  type R2Config,
  type R2ConfigReadinessLabel,
  type R2ConfigRedactedSummary
} from "./r2.config";

export {
  getR2DisabledStateLabel,
  getR2PartialConfigDiagnostics,
  isR2StorageFailClosed,
  toR2PartialConfigDiagnosticsSnapshot,
  type R2PartialConfigDiagnostics
} from "./r2-partial-config-diagnostics";

export {
  R2_CLEANUP_PROOF_PLAN_STEP_KEYS,
  R2_CLEANUP_PROOF_PLAN_STEPS,
  assertR2CleanupProofPlanNoIoInvariant,
  buildR2CleanupProofPlan,
  getR2CleanupProofPlanStep,
  isR2CleanupProofPlanStepKey,
  type R2CleanupProofPlan,
  type R2CleanupProofPlanStep,
  type R2CleanupProofPlanStepKey
} from "./r2-cleanup-proof-plan";

export {
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS,
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEPS,
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION,
  assertR2TargetEnvironmentProofPlanNoIoInvariant,
  buildR2TargetEnvironmentProofPlan,
  getR2TargetEnvironmentProofPlanStep,
  isR2TargetEnvironmentProofPlanStepKey,
  toR2TargetEnvironmentProofPlanSnapshot,
  type R2TargetEnvironmentProofPlan,
  type R2TargetEnvironmentProofPlanStep,
  type R2TargetEnvironmentProofPlanStepKey
} from "./r2-target-environment-proof-plan";

export {
  assertR2NoIoReadinessInvariant,
  toR2NoIoReadinessInvariantSnapshot,
  type R2NoIoReadinessInvariantResult
} from "./r2-no-io-readiness-invariant";
