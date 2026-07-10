import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPrivateStorageProofIntent,
  isPrivateStorageProofIntentLiveSafe
} from "./private-storage-proof-intent";
import { R2_PROOF_STAGE_KEYS } from "./r2-proof-stage";

describe("private-storage-proof-intent (G151)", () => {
  it("builds a pure no-IO intent for every proof stage", () => {
    for (const stage of R2_PROOF_STAGE_KEYS) {
      const intent = buildPrivateStorageProofIntent(stage);
      assert.equal(intent.stage, stage);
      assert.equal(intent.liveIoPerformed, false);
      assert.equal(intent.claimsLiveBucketProof, false);
      assert.equal(isPrivateStorageProofIntentLiveSafe(intent), true);
      assert.ok(intent.purpose.length > 0);
      assert.ok(intent.label.length > 0);
    }
  });

  it("never claims live bucket proof for future_real_bucket intent construction", () => {
    const intent = buildPrivateStorageProofIntent("future_real_bucket");
    assert.equal(intent.liveIoAllowed, true);
    assert.equal(intent.liveIoPerformed, false);
    assert.equal(intent.claimsLiveBucketProof, false);
    assert.equal(intent.truthLabel, "future_real_bucket_not_executed");
  });

  it("marks client_safe_download intent as client-safe and no-IO", () => {
    const intent = buildPrivateStorageProofIntent("client_safe_download");
    assert.equal(intent.clientSafe, true);
    assert.equal(intent.liveIoAllowed, false);
    assert.equal(intent.truthLabel, "client_safe_boundary_only");
  });
});
