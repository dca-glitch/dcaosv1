/**
 * Typed R2 cleanup / rollback proof-plan constants.
 * Planning only for staging live IO — no real bucket create/read/delete is executed here.
 *
 * Local capability status (application layer):
 * - exact-key HEAD: implemented (`headR2Object`)
 * - exact-key DELETE: implemented (`deleteR2Object`, idempotent 404 → alreadyAbsent)
 * - staging live create/read/delete: NOT proven
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
  /** This module only plans steps; staging live execution is always deferred. */
  executedInThisModule: false;
  /** Application-layer capability available locally (not staging live proof). */
  localCapabilityImplemented: boolean;
  canonicalOperation: string | null;
  stopOnFailure: boolean;
};

export const R2_CLEANUP_PROOF_PLAN_STEPS: Record<R2CleanupProofPlanStepKey, R2CleanupProofPlanStep> = {
  create_test_object: {
    key: "create_test_object",
    label: "Create disposable proof object (future live only)",
    order: 1,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    localCapabilityImplemented: true,
    canonicalOperation: "uploadR2Object / putPrivateStorageObject",
    stopOnFailure: true
  },
  read_download: {
    key: "read_download",
    label: "Read/download proof object to confirm bytes",
    order: 2,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    localCapabilityImplemented: true,
    canonicalOperation: "getSignedR2ReadUrl / getPrivateStorageDownloadReference",
    stopOnFailure: true
  },
  delete: {
    key: "delete",
    label: "Delete exact proof object via deleteR2Object (no prefix/batch)",
    order: 3,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    localCapabilityImplemented: true,
    canonicalOperation: "deleteR2Object / deletePrivateStorageObject",
    stopOnFailure: true
  },
  verify_delete: {
    key: "verify_delete",
    label: "Verify object is gone via exact-key HEAD (headR2Object)",
    order: 4,
    liveIoRequiredWhenExecuted: true,
    executedInThisModule: false,
    localCapabilityImplemented: true,
    canonicalOperation: "headR2Object / privateStorageObjectExists",
    stopOnFailure: true
  },
  rollback_failure_stop: {
    key: "rollback_failure_stop",
    label: "On any failure: stop, do not continue, record rollback needed",
    order: 5,
    liveIoRequiredWhenExecuted: false,
    executedInThisModule: false,
    localCapabilityImplemented: true,
    canonicalOperation: null,
    stopOnFailure: true
  }
} as const;

export type R2CleanupProofPlan = {
  version: "r2-cleanup-proof-plan-v1";
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  localExactKeyCleanupImplemented: true;
  steps: R2CleanupProofPlanStep[];
  note: string;
};

export function buildR2CleanupProofPlan(): R2CleanupProofPlan {
  return {
    version: "r2-cleanup-proof-plan-v1",
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    localExactKeyCleanupImplemented: true,
    steps: R2_CLEANUP_PROOF_PLAN_STEP_KEYS.map((key) => R2_CLEANUP_PROOF_PLAN_STEPS[key]),
    note:
      "Proof-plan constants only. Exact-key HEAD/DELETE are implemented locally; no staging live create/read/delete is claimed by this helper."
  };
}

export function getR2CleanupProofPlanStep(key: R2CleanupProofPlanStepKey): R2CleanupProofPlanStep {
  return R2_CLEANUP_PROOF_PLAN_STEPS[key];
}

export function isR2CleanupProofPlanStepKey(value: string): value is R2CleanupProofPlanStepKey {
  return (R2_CLEANUP_PROOF_PLAN_STEP_KEYS as readonly string[]).includes(value);
}

/**
 * Invariant: building/resolving the cleanup plan never claims live bucket proof or IO.
 */
export function assertR2CleanupProofPlanNoIoInvariant(plan: R2CleanupProofPlan = buildR2CleanupProofPlan()): {
  ok: boolean;
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  allStepsUnexecuted: boolean;
  localExactKeyCleanupImplemented: true;
  reason: string;
} {
  const allStepsUnexecuted = plan.steps.every((step) => step.executedInThisModule === false);
  const ok =
    plan.liveIoPerformed === false &&
    plan.claimsLiveBucketProof === false &&
    allStepsUnexecuted &&
    plan.localExactKeyCleanupImplemented === true;

  return {
    ok,
    liveIoPerformed: false,
    claimsLiveBucketProof: false,
    allStepsUnexecuted,
    localExactKeyCleanupImplemented: true,
    reason: ok
      ? "Cleanup proof plan is planning-only for staging live IO; local exact-key HEAD/DELETE capability is recorded without claiming live proof."
      : "Cleanup proof plan invariant violated."
  };
}
