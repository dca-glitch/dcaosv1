import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildR2CleanupProofPlan,
  getR2CleanupProofPlanStep,
  R2_CLEANUP_PROOF_PLAN_STEP_KEYS,
  R2_CLEANUP_PROOF_PLAN_STEPS
} from "./r2-cleanup-proof-plan";

describe("r2-cleanup-proof-plan (G156)", () => {
  it("defines create → read/download → delete → verify → rollback/failure-stop in order", () => {
    assert.deepEqual(R2_CLEANUP_PROOF_PLAN_STEP_KEYS, [
      "create_test_object",
      "read_download",
      "delete",
      "verify_delete",
      "rollback_failure_stop"
    ]);

    const plan = buildR2CleanupProofPlan();
    assert.equal(plan.steps.length, 5);
    assert.deepEqual(
      plan.steps.map((step) => step.order),
      [1, 2, 3, 4, 5]
    );
    assert.equal(plan.liveIoPerformed, false);
    assert.equal(plan.claimsLiveBucketProof, false);
  });

  it("marks IO steps as not executed in this module", () => {
    for (const key of R2_CLEANUP_PROOF_PLAN_STEP_KEYS) {
      const step = getR2CleanupProofPlanStep(key);
      assert.equal(step.executedInThisModule, false);
      assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS[key].stopOnFailure, true);
    }

    assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS.create_test_object.liveIoRequiredWhenExecuted, true);
    assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS.read_download.liveIoRequiredWhenExecuted, true);
    assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS.delete.liveIoRequiredWhenExecuted, true);
    assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS.verify_delete.liveIoRequiredWhenExecuted, true);
    assert.equal(R2_CLEANUP_PROOF_PLAN_STEPS.rollback_failure_stop.liveIoRequiredWhenExecuted, false);
  });
});
