import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertR2NoIoReadinessInvariant,
  toR2NoIoReadinessInvariantSnapshot
} from "./r2-no-io-readiness-invariant";
import { R2_PROOF_STAGE_KEYS } from "./r2-proof-stage";

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_BASE_URL"
] as const;

function withR2Env(overrides: Partial<Record<(typeof R2_ENV_KEYS)[number], string | undefined>>, run: () => void) {
  const saved: Partial<Record<(typeof R2_ENV_KEYS)[number], string | undefined>> = {};
  for (const key of R2_ENV_KEYS) {
    saved[key] = process.env[key];
  }

  try {
    for (const key of R2_ENV_KEYS) {
      const value = overrides[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    run();
  } finally {
    for (const key of R2_ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("r2-no-io-readiness-invariant (G471)", () => {
  it("passes for disabled local env without claiming live proof", () => {
    withR2Env({}, () => {
      const result = assertR2NoIoReadinessInvariant();
      assert.equal(result.ok, true);
      assert.equal(result.liveIoPerformed, false);
      assert.equal(result.claimsLiveBucketProof, false);
      assert.equal(result.liveProven, false);
      assert.equal(result.proofStagesOk, true);
      assert.equal(result.cleanupPlanOk, true);
      assert.equal(result.targetPlanOk, true);

      const snap = toR2NoIoReadinessInvariantSnapshot(result);
      assert.equal(snap.ok, true);
      assert.equal(snap.proofStageCount, R2_PROOF_STAGE_KEYS.length);
      assert.equal(snap.proofStagesClaimLiveWithoutIo, false);
      assert.equal(snap.redactedReadinessLabel, "disabled");
      assert.equal(snap.diagnosticsReadinessLabel, "disabled");
      assert.equal(JSON.stringify(snap).includes("liveProven\":true"), false);
    });
  });

  it("passes for configured_shape_ok without treating shape as live proof", () => {
    withR2Env({
      R2_ACCOUNT_ID: "g471-acct",
      R2_ACCESS_KEY_ID: "g471-key",
      R2_SECRET_ACCESS_KEY: "g471-secret-must-not-leak",
      R2_BUCKET_NAME: "g471-bucket"
    }, () => {
      const result = assertR2NoIoReadinessInvariant();
      assert.equal(result.ok, true);
      assert.equal(result.liveProven, false);

      const snap = toR2NoIoReadinessInvariantSnapshot(result);
      assert.equal(snap.redactedReadinessLabel, "configured_shape_ok");
      assert.equal(snap.diagnosticsReadinessLabel, "configured_shape_ok");
      assert.equal(snap.liveProven, false);
      assert.equal(JSON.stringify(snap).includes("g471-secret-must-not-leak"), false);
    });
  });

  it("passes for partial missing_config and stays fail-closed / not live-proven", () => {
    withR2Env({
      R2_ACCOUNT_ID: "g471-partial",
      R2_ACCESS_KEY_ID: "g471-partial-key",
      R2_SECRET_ACCESS_KEY: undefined,
      R2_BUCKET_NAME: undefined
    }, () => {
      const result = assertR2NoIoReadinessInvariant();
      assert.equal(result.ok, true);
      const snap = toR2NoIoReadinessInvariantSnapshot(result);
      assert.equal(snap.redactedReadinessLabel, "missing_config");
      assert.equal(snap.diagnosticsReadinessLabel, "missing_config");
      assert.equal(snap.claimsLiveBucketProof, false);
    });
  });
});
