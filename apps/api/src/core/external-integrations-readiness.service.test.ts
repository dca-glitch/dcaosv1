import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { GA_GSC_ENV_KEYS } from "../config/ga-gsc.config";
import { IMAGE_GENERATION_ENV_KEYS } from "../config/image-generation.config";
import { WORDPRESS_INTEGRATION_ENV_KEYS } from "../config/wordpress-integration.config";
import { getExternalIntegrationsReadinessSnapshot } from "./external-integrations-readiness.service";

const trackedKeys = [
  ...Object.values(WORDPRESS_INTEGRATION_ENV_KEYS),
  ...Object.values(GA_GSC_ENV_KEYS),
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

  it("returns five safe categories with empty integration env", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }

    const readiness = getExternalIntegrationsReadinessSnapshot();
    assert.equal(readiness.categories.length, 5);
    assert.equal(readiness.summary.noLiveCallsInThisLayer, true);
    assert.deepEqual(
      readiness.categories.map((category) => category.key),
      ["ai_provider", "wordpress", "private_storage", "ga_gsc", "image_generation"]
    );

    const serialized = JSON.stringify(readiness);
    assert.match(serialized, /ai_provider/);
    assert.doesNotMatch(serialized, /sk-or-/i);
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
  });

  it("reports image_generation configured_shape_ok without exposing the API key value", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env[IMAGE_GENERATION_ENV_KEYS.enabled] = "true";
    process.env[IMAGE_GENERATION_ENV_KEYS.provider] = "openai_images";
    process.env[IMAGE_GENERATION_ENV_KEYS.apiKey] = "smoke-secret-key-value";

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

  it("reports GA/GSC configured_shape_ok without exposing OAuth secret values", () => {
    for (const key of trackedKeys) {
      delete process.env[key];
    }
    process.env[GA_GSC_ENV_KEYS.syncEnabled] = "true";
    process.env[GA_GSC_ENV_KEYS.oauthClientId] = "client-id-smoke";
    process.env[GA_GSC_ENV_KEYS.oauthClientSecret] = "client-secret-smoke";

    const readiness = getExternalIntegrationsReadinessSnapshot();
    const gaGsc = readiness.categories.find((category) => category.key === "ga_gsc");

    assert.equal(gaGsc?.status, "configured_shape_ok");
    assert.equal(JSON.stringify(readiness).includes("client-secret-smoke"), false);
  });
});
