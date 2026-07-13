import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { IMAGE_GENERATION_ENV_KEYS } from "../config/image-generation.config";
import { WORDPRESS_INTEGRATION_ENV_KEYS } from "../config/wordpress-integration.config";
import { getExternalIntegrationsReadinessSnapshot } from "./external-integrations-readiness.service";

const trackedKeys = [
  ...Object.values(WORDPRESS_INTEGRATION_ENV_KEYS),
  ...Object.values(IMAGE_GENERATION_ENV_KEYS),
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "AI_TEXT_GATEWAY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_TEXT_PRIMARY_MODEL"
];

function snapshotEnv() {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of trackedKeys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of trackedKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("external-integrations-readiness.service", () => {
  const initialEnv = snapshotEnv();

  afterEach(() => {
    restoreEnv(initialEnv);
  });

  it("returns four safe categories with empty integration env", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }

    const readiness = getExternalIntegrationsReadinessSnapshot();
    assert.equal(readiness.categories.length, 4);
    assert.equal(readiness.summary.noLiveCallsInThisLayer, true);
    assert.deepEqual(
      readiness.categories.map((category) => category.key),
      ["ai_provider", "wordpress", "private_storage", "image_generation"]
    );

    const serialized = JSON.stringify(readiness);
    assert.match(serialized, /ai_provider/);
    assert.doesNotMatch(serialized, /sk-or-/i);
    assert.doesNotMatch(serialized, /ga_gsc/);
  });

  it("reports R2 configured_shape_ok from config shape only without bucket IO", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env.R2_ACCOUNT_ID = "unit-account";
    process.env.R2_ACCESS_KEY_ID = "unit-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "unit-secret-value";
    process.env.R2_BUCKET_NAME = "unit-bucket";

    let fetchCallCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((..._args: Parameters<typeof fetch>) => {
      fetchCallCount++;
      return Promise.reject(new Error("Unexpected bucket IO in R2 readiness unit test"));
    }) as typeof fetch;

    try {
      const readiness = getExternalIntegrationsReadinessSnapshot();
      const privateStorage = readiness.categories.find((category) => category.key === "private_storage");
      const serialized = JSON.stringify(readiness);

      assert.equal(privateStorage?.status, "configured_shape_ok");
      assert.equal(privateStorage?.privateStorage?.configured, true);
      assert.equal(privateStorage?.privateStorage?.liveBucketMutationDeferred, true);
      assert.equal(serialized.includes("unit-secret-value"), false);
      assert.equal(fetchCallCount, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports R2 missing_config for partial required env and serializes no secrets", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env.R2_ACCOUNT_ID = "partial-account";
    process.env.R2_SECRET_ACCESS_KEY = "partial-secret-value";

    const readiness = getExternalIntegrationsReadinessSnapshot();
    const privateStorage = readiness.categories.find((category) => category.key === "private_storage");
    const serialized = JSON.stringify(readiness);

    assert.equal(privateStorage?.status, "missing_config");
    assert.equal(privateStorage?.privateStorage?.configured, false);
    assert.deepEqual(privateStorage?.privateStorage?.missingKeys.sort(), [
      "R2_ACCESS_KEY_ID",
      "R2_BUCKET_NAME"
    ]);
    assert.equal(serialized.includes("partial-secret-value"), false);
  });

  it("reports image_generation disabled by default with no live provider calls", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }

    const imageGeneration = getExternalIntegrationsReadinessSnapshot().categories.find(
      (category) => category.key === "image_generation"
    );

    assert.equal(imageGeneration?.status, "disabled");
    assert.equal(imageGeneration?.imageGeneration?.generationEnabled, false);
    assert.equal(imageGeneration?.imageGeneration?.liveProviderCallsDeferred, true);
  });

  it("reports image_generation missing_config when enabled without provider/key", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env[IMAGE_GENERATION_ENV_KEYS.enabled] = "true";

    const imageGeneration = getExternalIntegrationsReadinessSnapshot().categories.find(
      (category) => category.key === "image_generation"
    );

    assert.equal(imageGeneration?.status, "missing_config");
    assert.ok(imageGeneration?.imageGeneration?.missingKeys.includes(IMAGE_GENERATION_ENV_KEYS.provider));
    assert.ok(imageGeneration?.imageGeneration?.missingKeys.includes(IMAGE_GENERATION_ENV_KEYS.apiKey));
    assert.ok(imageGeneration?.imageGeneration?.missingKeys.includes(IMAGE_GENERATION_ENV_KEYS.model));
  });

  it("reports image_generation configured_shape_ok without exposing the API key value", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env[IMAGE_GENERATION_ENV_KEYS.enabled] = "true";
    process.env[IMAGE_GENERATION_ENV_KEYS.provider] = "openai";
    process.env[IMAGE_GENERATION_ENV_KEYS.apiKey] = "smoke-secret-key-value";
    process.env[IMAGE_GENERATION_ENV_KEYS.model] = "gpt-image-1";

    const readiness = getExternalIntegrationsReadinessSnapshot();
    const imageGeneration = readiness.categories.find((category) => category.key === "image_generation");

    assert.equal(imageGeneration?.status, "configured_shape_ok");
    assert.equal(JSON.stringify(readiness).includes("smoke-secret-key-value"), false);
  });

  it("reports WordPress missing_config when publish enabled without encryption key", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env[WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled] = "true";

    const wordpress = getExternalIntegrationsReadinessSnapshot().categories.find(
      (category) => category.key === "wordpress"
    );

    assert.equal(wordpress?.status, "missing_config");
    assert.ok(
      wordpress?.wordpress?.missingKeys.includes(WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey)
    );
  });
});
