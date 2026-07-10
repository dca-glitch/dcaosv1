import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getR2Config, getR2ConfigRedactedSummary, getR2EnvPresence } from "./r2.config";

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

describe("r2.config — boolean presence and disabled-safe defaults", () => {
  it("reports all-false presence when R2 env is unset", () => {
    withR2Env({}, () => {
      const presence = getR2EnvPresence();
      assert.equal(presence.R2_ACCOUNT_ID, false);
      assert.equal(presence.R2_ACCESS_KEY_ID, false);
      assert.equal(presence.R2_SECRET_ACCESS_KEY, false);
      assert.equal(presence.R2_BUCKET_NAME, false);
      assert.equal(getR2Config(), null);
    });
  });

  it("never exposes secret values in presence JSON", () => {
    withR2Env({
      R2_ACCOUNT_ID: "acct-test",
      R2_ACCESS_KEY_ID: "key-test",
      R2_SECRET_ACCESS_KEY: "secret-should-not-appear",
      R2_BUCKET_NAME: "bucket-test"
    }, () => {
      const presence = getR2EnvPresence();
      const serialized = JSON.stringify(presence);
      assert.equal(serialized.includes("secret-should-not-appear"), false);
      assert.equal(presence.R2_SECRET_ACCESS_KEY, true);
      assert.ok(getR2Config());
    });
  });

  it("returns null config when any required key is missing", () => {
    withR2Env({
      R2_ACCOUNT_ID: "acct-test",
      R2_ACCESS_KEY_ID: "key-test",
      R2_BUCKET_NAME: "bucket-test"
    }, () => {
      assert.equal(getR2Config(), null);
    });
  });
});

describe("r2.config — redacted summary (G150)", () => {
  it("redacts access key ID and secret while reporting endpoint/bucket presence safely", () => {
    withR2Env({
      R2_ACCOUNT_ID: "acct-redact",
      R2_ACCESS_KEY_ID: "AKIA_SHOULD_NOT_LEAK",
      R2_SECRET_ACCESS_KEY: "super-secret-value-should-not-leak",
      R2_BUCKET_NAME: "private-bucket-name",
      R2_ENDPOINT: "https://example.r2.cloudflarestorage.com"
    }, () => {
      const summary = getR2ConfigRedactedSummary();
      const serialized = JSON.stringify(summary);

      assert.equal(summary.accessKeyIdPresent, true);
      assert.equal(summary.secretAccessKeyPresent, true);
      assert.equal(summary.endpointPresent, true);
      assert.equal(summary.bucketPresent, true);
      assert.equal(serialized.includes("AKIA_SHOULD_NOT_LEAK"), false);
      assert.equal(serialized.includes("super-secret-value-should-not-leak"), false);
      assert.equal(serialized.includes("private-bucket-name"), false);
      assert.equal(serialized.includes("https://example.r2.cloudflarestorage.com"), false);
      assert.equal(serialized.includes("acct-redact"), false);
    });
  });

  it("labels partial env as missing_config and never live_proven", () => {
    withR2Env({
      R2_ACCOUNT_ID: "partial-acct",
      R2_ACCESS_KEY_ID: "partial-key",
      R2_SECRET_ACCESS_KEY: undefined,
      R2_BUCKET_NAME: undefined
    }, () => {
      const summary = getR2ConfigRedactedSummary();
      assert.equal(summary.readinessLabel, "missing_config");
      assert.equal(summary.liveProven, false);
      assert.equal(getR2Config(), null);
    });
  });

  it("labels full env as configured_shape_ok but not live_proven", () => {
    withR2Env({
      R2_ACCOUNT_ID: "full-acct",
      R2_ACCESS_KEY_ID: "full-key",
      R2_SECRET_ACCESS_KEY: "full-secret",
      R2_BUCKET_NAME: "full-bucket"
    }, () => {
      const summary = getR2ConfigRedactedSummary();
      assert.equal(summary.readinessLabel, "configured_shape_ok");
      assert.equal(summary.liveProven, false);
      assert.ok(getR2Config());
    });
  });
});
