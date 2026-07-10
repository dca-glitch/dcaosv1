import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertR2CleanupProofPlanNoIoInvariant,
  assertR2NoIoReadinessInvariant,
  assertR2ProofNoIoOnlyLabelInvariant,
  assertR2TargetEnvironmentProofPlanNoIoInvariant,
  buildR2CleanupProofPlan,
  buildR2TargetEnvironmentProofPlan,
  claimsLiveBucketProof,
  getR2ConfigRedactedSummary,
  getR2PartialConfigDiagnostics,
  R2_CLEANUP_PROOF_PLAN_STEP_KEYS,
  R2_PROOF_STAGE_KEYS,
  R2_REQUIRED_ENV_KEYS,
  R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS,
  toR2ProofStageSnapshot
} from "./r2-proof-contracts";

describe("r2-proof-contracts consolidation (G470)", () => {
  it("re-exports proof-stage, readiness, cleanup, and target-plan contracts", () => {
    assert.equal(R2_PROOF_STAGE_KEYS.length, 5);
    assert.equal(R2_REQUIRED_ENV_KEYS.length, 4);
    assert.equal(R2_CLEANUP_PROOF_PLAN_STEP_KEYS.length, 5);
    assert.equal(R2_TARGET_ENVIRONMENT_PROOF_PLAN_STEP_KEYS.length, 7);

    const stageSnap = toR2ProofStageSnapshot();
    assert.equal(stageSnap.every((row) => row.claimsLiveWithoutIo === false), true);

    for (const key of R2_PROOF_STAGE_KEYS) {
      assert.equal(assertR2ProofNoIoOnlyLabelInvariant(key).ok, true);
      assert.equal(claimsLiveBucketProof(key, false), false);
    }

    assert.equal(assertR2CleanupProofPlanNoIoInvariant(buildR2CleanupProofPlan()).ok, true);
    assert.equal(assertR2TargetEnvironmentProofPlanNoIoInvariant(buildR2TargetEnvironmentProofPlan()).ok, true);
    assert.equal(getR2ConfigRedactedSummary().liveProven, false);
    assert.equal(getR2PartialConfigDiagnostics().liveIoPerformed, false);
    assert.equal(assertR2NoIoReadinessInvariant().ok, true);
  });

  it("never claims live proof from the consolidated barrel surface", () => {
    const serialized = JSON.stringify({
      stages: toR2ProofStageSnapshot(),
      cleanup: buildR2CleanupProofPlan(),
      target: buildR2TargetEnvironmentProofPlan(),
      readiness: assertR2NoIoReadinessInvariant()
    });
    assert.equal(serialized.includes('"claimsLiveBucketProof":true'), false);
    assert.equal(serialized.includes('"liveIoPerformed":true'), false);
    assert.equal(serialized.includes('"liveProven":true'), false);
  });
});
