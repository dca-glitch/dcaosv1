/**
 * Typed R2 cleanup / rollback proof-plan constants.
 * Planning only — no real bucket create/read/delete IO.
 */

export const R2_CLEANUP_PROOF_PLAN_STEP_KEYS = [
  "create_test_object",
  "read_download",
  "delete",
  "verify_delete",
  "rollback_failure_stop"
] as const;

export type R2CleanupProofPlanStepKey = (typeof R2_CLEANUP_PROOF_PLAN_STEP_KEYS)[number];

export type R2CleanupProofPlanStep = {
  key: R2CleanupProofPlanStepKey;
  label: string;
  order: number;
  liveIoRequiredWhenExecuted: boolean;
  /** This module only plans steps; execution is always deferred. */
  executedInThisModule: false;
  stopOnFailure: boolean;
};

export const R2_CLEANUP_PROOF_PLAN_STEPS: Record<R2CleanupProofPlanStepKey, R2CleanupProofPlanStep> = {
  create_test_object: {
    key: "create_test_object",
    label: "Create disposable proof object (future live only)",
    order: 1,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    stopOnFailure: true
  },
  read_download: {
    key: "read_download",
    label: "Read/download proof object to confirm bytes",
    order: 2,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    stopOnFailure: true
  },
  delete: {
    key: "delete",
    label: "Delete proof object from bucket",
    order: 3,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    stopOnFailure: true
  },
  verify_delete: {
    key: "verify_delete",
    label: "Verify object is gone (GET/HEAD must fail)",
    order: 4,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    stopOnFailure: true
  },
  rollback_failure_stop: {
    key: "rollback_failure_stop",
    label: "On any failure: stop, do not continue, record rollback needed",
    order: 5,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    stopOnFailure: true
  }
} as const;

export type R2CleanupProofPlan = {
  version: "r2-cleanup-proof-plan-v1";
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  steps: R2CleanupProofPlanStep[];
  note: string;
};

export function buildR2CleanupProofPlan(): R2CleanupProofPlan {
  return {
    version: "r2-cleanup-proof-plan-v1",
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    steps: R2_CLEANUP_PROOF_PLAN_STEP_KEYS.map((key) => R2_CLEANUP_PROOF_PLAN_STEPS[key]),
    note: "Proof-plan constants only. No create/read/delete against a real R2 bucket is performed by this helper."
  };
}

export function getR2CleanupProofPlanStep(key: R2CleanupProofPlanStepKey): R2CleanupProofPlanStep {
  return R2_CLEANUP_PROOF_PLAN_STEPS[key];
}
