import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPrivateStorageProofIntent,
  isPrivateStorageProofIntentLiveSafe,
  resolvePrivateStorageProofIntent,
  toPrivateStorageProofIntentSnapshot
} from "./private-storage-proof-intent";
import { R2_PROOF_STAGE_KEYS } from "./r2-proof-stage";

describe("private-storage-proof-intent (G151 / G235 / G236)", () => {
  it("builds a pure no-IO intent for every proof stage (G235 snapshot)", () => {
    for (const stage of R2_PROOF_STAGE_KEYS) {
      const intent = buildPrivateStorageProofIntent(stage);
      assert.equal(intent.stage, stage);
      assert.equal(intent.liveIoPerformed, false);
      assert.equal(intent.claimsLiveBucketProof, false);
      assert.equal(isPrivateStorageProofIntentLiveSafe(intent), true);
      assert.ok(intent.purpose.length > 0);
      assert.ok(intent.label.length > 0);

      const snapshot = toPrivateStorageProofIntentSnapshot(intent);
      assert.equal(snapshot.stage, stage);
      assert.equal(snapshot.liveIoPerformed, false);
      assert.equal(snapshot.claimsLiveBucketProof, false);
      assert.equal(snapshot.liveIoAllowed, intent.liveIoAllowed);
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

  it("rejects invalid stage input without inventing live-proof intent (G236)", () => {
    for (const bad of [null, undefined, "", "  ", 42, {}, [], "live_proven", "Future_Real_Bucket"]) {
      const result = resolvePrivateStorageProofIntent(bad);
      assert.equal(result.ok, false);
      assert.equal(result.intent, null);
      assert.ok(result.error.length > 0);
    }
  });

  it("resolves valid stage keys to live-safe intents", () => {
    for (const stage of R2_PROOF_STAGE_KEYS) {
      const result = resolvePrivateStorageProofIntent(stage);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(isPrivateStorageProofIntentLiveSafe(result.intent), true);
        assert.equal(result.intent.claimsLiveBucketProof, false);
      }
    }
  });
});
