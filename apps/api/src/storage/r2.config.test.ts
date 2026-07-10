import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getR2Config,
  getR2ConfigRedactedSummary,
  getR2EnvPresence,
  toR2ConfigRedactedSummarySnapshot
} from "./r2.config";
import {
  getR2DisabledStateLabel,
  getR2PartialConfigDiagnostics,
  isR2StorageFailClosed
} from "./r2-partial-config-diagnostics";

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

describe("r2.config — redacted summary (G150 / G230)", () => {
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

  it("snapshot stays boolean-only across disabled / partial / full shapes (G230)", () => {
    withR2Env({}, () => {
      const snap = toR2ConfigRedactedSummarySnapshot();
      assert.deepEqual(snap, {
        readinessLabel: "disabled",
        liveProven: false,
        endpointPresent: false,
        bucketPresent: false,
        accessKeyIdPresent: false,
        secretAccessKeyPresent: false,
        requiredKeysPresentCount: 0
      });
    });

    withR2Env({
      R2_ACCOUNT_ID: "snap-acct",
      R2_ACCESS_KEY_ID: "snap-key",
      R2_SECRET_ACCESS_KEY: "",
      R2_BUCKET_NAME: "",
      R2_ENDPOINT: "",
      R2_PUBLIC_BASE_URL: ""
    }, () => {
      const snap = toR2ConfigRedactedSummarySnapshot();
      const serialized = JSON.stringify(snap);
      assert.equal(snap.readinessLabel, "missing_config");
      assert.equal(snap.liveProven, false);
      assert.equal(snap.accessKeyIdPresent, true);
      assert.equal(snap.secretAccessKeyPresent, false);
      assert.equal(snap.bucketPresent, false);
      assert.equal(snap.requiredKeysPresentCount, 2);
      assert.equal(serialized.includes("snap-key"), false);
      assert.equal(serialized.includes("snap-acct"), false);
    });

    withR2Env({
      R2_ACCOUNT_ID: "snap-full",
      R2_ACCESS_KEY_ID: "snap-full-key",
      R2_SECRET_ACCESS_KEY: "snap-full-secret",
      R2_BUCKET_NAME: "snap-full-bucket",
      R2_ENDPOINT: "https://snap.example.r2.cloudflarestorage.com"
    }, () => {
      const snap = toR2ConfigRedactedSummarySnapshot();
      assert.equal(snap.readinessLabel, "configured_shape_ok");
      assert.equal(snap.liveProven, false);
      assert.equal(snap.requiredKeysPresentCount, 4);
      assert.equal(snap.endpointPresent, true);
      assert.equal(JSON.stringify(snap).includes("snap-full-secret"), false);
    });
  });
});

describe("r2 disabled-state + partial-config diagnostics (G231 / G232)", () => {
  it("labels fully unset env as disabled and fail-closed (G231)", () => {
    withR2Env({}, () => {
      assert.equal(getR2DisabledStateLabel(), "disabled");
      assert.equal(isR2StorageFailClosed(), true);
      const diagnostics = getR2PartialConfigDiagnostics();
      assert.equal(diagnostics.fullyDisabled, true);
      assert.equal(diagnostics.partiallyConfigured, false);
      assert.equal(diagnostics.configured, false);
      assert.equal(diagnostics.liveProven, false);
      assert.equal(diagnostics.liveIoPerformed, false);
      assert.deepEqual(diagnostics.presentRequiredEnvKeys, []);
      assert.equal(diagnostics.missingRequiredEnvKeys.length, 4);
    });
  });

  it("reports partial config with missing key names only — never values (G232)", () => {
    withR2Env({
      R2_ACCOUNT_ID: "diag-acct-should-not-leak",
      R2_ACCESS_KEY_ID: "diag-key-should-not-leak",
      R2_SECRET_ACCESS_KEY: undefined,
      R2_BUCKET_NAME: undefined,
      R2_ENDPOINT: "https://diag.example.should-not-leak"
    }, () => {
      const diagnostics = getR2PartialConfigDiagnostics();
      const serialized = JSON.stringify(diagnostics);

      assert.equal(diagnostics.readinessLabel, "missing_config");
      assert.equal(diagnostics.partiallyConfigured, true);
      assert.equal(diagnostics.fullyDisabled, false);
      assert.equal(isR2StorageFailClosed(), true);
      assert.deepEqual(diagnostics.presentRequiredEnvKeys, ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID"]);
      assert.deepEqual(diagnostics.missingRequiredEnvKeys, ["R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]);
      assert.equal(diagnostics.optionalEndpointPresent, true);
      assert.equal(serialized.includes("diag-acct-should-not-leak"), false);
      assert.equal(serialized.includes("diag-key-should-not-leak"), false);
      assert.equal(serialized.includes("https://diag.example.should-not-leak"), false);
    });
  });

  it("treats whitespace-only required keys as absent", () => {
    withR2Env({
      R2_ACCOUNT_ID: "   ",
      R2_ACCESS_KEY_ID: "\t",
      R2_SECRET_ACCESS_KEY: "",
      R2_BUCKET_NAME: "  "
    }, () => {
      assert.equal(getR2Config(), null);
      assert.equal(getR2DisabledStateLabel(), "disabled");
      assert.equal(getR2PartialConfigDiagnostics().fullyDisabled, true);
    });
  });

  it("marks full shape configured but still not live-proven", () => {
    withR2Env({
      R2_ACCOUNT_ID: "ok-acct",
      R2_ACCESS_KEY_ID: "ok-key",
      R2_SECRET_ACCESS_KEY: "ok-secret",
      R2_BUCKET_NAME: "ok-bucket"
    }, () => {
      const diagnostics = getR2PartialConfigDiagnostics();
      assert.equal(diagnostics.readinessLabel, "configured_shape_ok");
      assert.equal(diagnostics.configured, true);
      assert.equal(diagnostics.partiallyConfigured, false);
      assert.equal(diagnostics.liveProven, false);
      assert.equal(isR2StorageFailClosed(), false);
    });
  });
});
