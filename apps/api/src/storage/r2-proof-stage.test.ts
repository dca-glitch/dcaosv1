import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getR2ProofStage, R2_PROOF_STAGE_KEYS, R2_PROOF_STAGES } from "./r2-proof-stage";

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
});
