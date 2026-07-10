import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertNoLiveProofWithoutIo,
  assertR2ProofNoIoOnlyLabelInvariant,
  claimsLiveBucketProof,
  getR2ProofStage,
  getR2ProofTruthLabel,
  isR2ProofStageKey,
  resolveR2ProofStage,
  R2_PROOF_STAGE_KEYS,
  R2_PROOF_STAGES,
  toR2ProofStageSnapshot
} from "./r2-proof-stage";

describe("r2-proof-stage", () => {
  it("defines the expected proof stages with stable typed keys", () => {
    assert.deepEqual(R2_PROOF_STAGE_KEYS, [
      "local_mock",
      "config_shape",
      "future_real_bucket",
      "client_safe_download",
      "cleanup"
    ]);

    for (const key of R2_PROOF_STAGE_KEYS) {
      assert.equal(R2_PROOF_STAGES[key].key, key);
      assert.equal(getR2ProofStage(key), R2_PROOF_STAGES[key]);
    }
  });

  it("keeps current proof stages no-IO and isolates future real bucket proof", () => {
    assert.equal(R2_PROOF_STAGES.local_mock.liveBucketIoAllowed, false);
    assert.equal(R2_PROOF_STAGES.config_shape.liveBucketIoAllowed, false);
    assert.equal(R2_PROOF_STAGES.client_safe_download.liveBucketIoAllowed, false);
    assert.equal(R2_PROOF_STAGES.cleanup.liveBucketIoAllowed, false);
    assert.equal(R2_PROOF_STAGES.future_real_bucket.liveBucketIoAllowed, true);
  });

  it("marks client-safe download as client-safe and live cleanup as required", () => {
    assert.equal(R2_PROOF_STAGES.client_safe_download.clientSafe, true);
    assert.equal(R2_PROOF_STAGES.future_real_bucket.cleanupRequiredBeforeLiveProof, true);
    assert.equal(R2_PROOF_STAGES.cleanup.cleanupRequiredBeforeLiveProof, true);
  });

  it("rejects invalid stage keys without inventing a live-proof stage", () => {
    assert.equal(isR2ProofStageKey("not_a_real_stage"), false);
    assert.equal(isR2ProofStageKey("live_proven"), false);
    assert.equal(resolveR2ProofStage("invalid"), null);
    assert.equal(resolveR2ProofStage(""), null);
  });

  it("forbids claiming live proof for no-IO stages even if a caller lies about IO", () => {
    for (const key of ["local_mock", "config_shape", "client_safe_download", "cleanup"] as const) {
      assert.equal(claimsLiveBucketProof(key, false), false);
      assert.equal(claimsLiveBucketProof(key, true), false);
      const guard = assertNoLiveProofWithoutIo(key, true);
      assert.equal(guard.ok, false);
      assert.equal(guard.liveProven, false);
    }
  });

  it("labels proof stages so no-IO work is never described as live-proven", () => {
    assert.equal(getR2ProofTruthLabel("local_mock"), "local_mock_no_io");
    assert.equal(getR2ProofTruthLabel("config_shape"), "config_shape_only");
    assert.equal(getR2ProofTruthLabel("client_safe_download"), "client_safe_boundary_only");
    assert.equal(getR2ProofTruthLabel("cleanup"), "cleanup_plan_only");
    assert.equal(getR2ProofTruthLabel("future_real_bucket"), "future_real_bucket_not_executed");

    for (const key of R2_PROOF_STAGE_KEYS) {
      const withoutIo = assertNoLiveProofWithoutIo(key, false);
      assert.equal(withoutIo.liveProven, false);
      assert.equal(withoutIo.ok, true);
      assert.equal(withoutIo.truthLabel.includes("live_proven"), false);
    }
  });

  it("allows live-proven only when future_real_bucket stage and IO actually ran", () => {
    assert.equal(claimsLiveBucketProof("future_real_bucket", false), false);
    assert.equal(claimsLiveBucketProof("future_real_bucket", true), true);

    const plannedOnly = assertNoLiveProofWithoutIo("future_real_bucket", false);
    assert.equal(plannedOnly.liveProven, false);
    assert.equal(plannedOnly.truthLabel, "future_real_bucket_not_executed");
  });
});

describe("r2-proof-stage exhaustive edges (G229)", () => {
  it("covers every stage key in the snapshot with claimsLiveWithoutIo false", () => {
    const snapshot = toR2ProofStageSnapshot();
    assert.equal(snapshot.length, R2_PROOF_STAGE_KEYS.length);
    assert.deepEqual(
      snapshot.map((row) => row.key),
      [...R2_PROOF_STAGE_KEYS]
    );
    for (const row of snapshot) {
      assert.equal(row.claimsLiveWithoutIo, false);
      assert.equal(claimsLiveBucketProof(row.key, false), false);
    }
  });

  it("rejects whitespace, casing variants, and lookalike live stage names", () => {
    for (const bad of [
      " LOCAL_MOCK ",
      "Local_Mock",
      "future-real-bucket",
      "future_real_bucket ",
      "live_bucket",
      "proven",
      "null",
      "undefined"
    ]) {
      assert.equal(isR2ProofStageKey(bad), false);
      assert.equal(resolveR2ProofStage(bad), null);
    }
  });

  it("keeps clientSafe false only for future_real_bucket", () => {
    for (const key of R2_PROOF_STAGE_KEYS) {
      const expected = key !== "future_real_bucket";
      assert.equal(R2_PROOF_STAGES[key].clientSafe, expected);
    }
  });

  it("requires cleanup before live proof only for future_real_bucket and cleanup stages", () => {
    assert.equal(R2_PROOF_STAGES.future_real_bucket.cleanupRequiredBeforeLiveProof, true);
    assert.equal(R2_PROOF_STAGES.cleanup.cleanupRequiredBeforeLiveProof, true);
    assert.equal(R2_PROOF_STAGES.local_mock.cleanupRequiredBeforeLiveProof, false);
    assert.equal(R2_PROOF_STAGES.config_shape.cleanupRequiredBeforeLiveProof, false);
    assert.equal(R2_PROOF_STAGES.client_safe_download.cleanupRequiredBeforeLiveProof, false);
  });
});

describe("r2-proof-stage no-IO only label invariant (G233)", () => {
  it("passes the no-IO only label invariant for every stage", () => {
    for (const key of R2_PROOF_STAGE_KEYS) {
      const result = assertR2ProofNoIoOnlyLabelInvariant(key);
      assert.equal(result.ok, true, result.reason);
      assert.equal(result.truthLabel.includes("live_proven"), false);
    }
  });

  it("keeps future_real_bucket labeled not_executed until IO runs", () => {
    const result = assertR2ProofNoIoOnlyLabelInvariant("future_real_bucket");
    assert.equal(result.truthLabel, "future_real_bucket_not_executed");
    assert.equal(result.liveBucketIoAllowed, true);
  });
});
