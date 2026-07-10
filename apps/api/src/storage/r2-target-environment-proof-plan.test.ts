import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertR2TargetEnvironmentProofPlanNoIoInvariant,
  buildR2TargetEnvironmentProofPlan,
  getR2TargetEnvironmentProofPlanStep,
  isR2TargetEnvironmentProofPlanStepKey,
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS,
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION,
  toR2TargetEnvironmentProofPlanSnapshot
} from "./r2-target-environment-proof-plan";
import { R2_REQUIRED_ENV_KEYS } from "./r2.config";
import { R2_CLEANUP_PROOF_PLAN_STEP_KEYS } from "./r2-cleanup-proof-plan";

describe("r2-target-environment-proof-plan (G469)", () => {
  it("freezes ordered target-environment steps without claiming live IO", () => {
    const plan = buildR2TargetEnvironmentProofPlan();
    assert.equal(plan.version, R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION);
    assert.equal(plan.liveIoPerformed, false);
    assert.equal(plan.claimsLiveBucketProof, false);
    assert.equal(plan.futureLiveStage, "future_real_bucket");
    assert.equal(plan.futureLiveTruthLabel, "future_real_bucket_not_executed");
    assert.deepEqual(
      plan.steps.map((step) => step.key),
      [...R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS]
    );
    assert.deepEqual(
      plan.steps.map((step) => step.order),
      [1, 2, 3, 4, 5, 6, 7]
    );
  });

  it("references required env key names and cleanup plan keys only", () => {
    const plan = buildR2TargetEnvironmentProofPlan();
    assert.deepEqual(plan.requiredEnvKeyNames, [...R2_REQUIRED_ENV_KEYS]);
    assert.deepEqual(plan.cleanupPlanStepKeys, [...R2_CLEANUP_PROOF_PLAN_STEP_KEYS]);
    const serialized = JSON.stringify(plan);
    assert.equal(serialized.includes("R2_SECRET_ACCESS_KEY"), true);
    assert.equal(/AKIA|secret-|password/i.test(serialized), false);
  });

  it("marks only execute_byte_roundtrip_future as live-IO-when-executed", () => {
    for (const key of R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS) {
      const step = getR2TargetEnvironmentProofPlanStep(key);
      assert.equal(step.executedInThisModule, false);
      assert.equal(step.stopOnFailure, true);
      const expectLive = key === "execute_byte_roundtrip_future";
      assert.equal(step.liveIoRequiredWhenExecuted, expectLive);
    }
  });

  it("enforces no-IO target plan invariant", () => {
    const invariant = assertR2TargetEnvironmentProofPlanNoIoInvariant();
    assert.equal(invariant.ok, true);
    assert.equal(invariant.liveIoPerformed, false);
    assert.equal(invariant.claimsLiveBucketProof, false);
    assert.equal(invariant.allStepsUnexecuted, true);
    assert.equal(invariant.onlyOneLiveIoStep, true);
  });

  it("rejects unknown step keys and snapshots without secret values", () => {
    assert.equal(isR2TargetEnvironmentProofPlanStepKey("confirm_owner_approval"), true);
    assert.equal(isR2TargetEnvironmentProofPlanStepKey("execute_now"), false);
    assert.equal(isR2TargetEnvironmentProofPlanStepKey(""), false);

    const snap = toR2TargetEnvironmentProofPlanSnapshot();
    assert.deepEqual(snap, {
      version: R2_TARGET_ENVIRONMENT_PROOF_PLAN_VERSION,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      futureLiveStage: "future_real_bucket",
      futureLiveTruthLabel: "future_real_bucket_not_executed",
      stepKeys: [...R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS],
      requiredEnvKeyNames: [...R2_REQUIRED_ENV_KEYS],
      liveIoStepCount: 1
    });
  });
});
