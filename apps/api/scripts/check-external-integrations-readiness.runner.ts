/**
 * Block 1 — external integrations readiness runner (config-only, no live calls).
 */

import {
  AI_PROVIDER_ENV_KEYS,
  getAiProviderConfig
} from "../src/config/ai-provider.config.ts";
import { IMAGE_GENERATION_ENV_KEYS } from "../src/config/image-generation.config.ts";
import { WORDPRESS_INTEGRATION_ENV_KEYS } from "../src/config/wordpress-integration.config.ts";
import {
  getExternalIntegrationsReadinessSnapshot,
  type ExternalIntegrationsReadinessSnapshot
} from "../src/core/external-integrations-readiness.service.ts";
import { executeOpenRouterTextRequest } from "../src/services/openrouter-text.service.ts";
import { getR2EnvPresence } from "../src/storage/r2.config.ts";

const smokeMarker = "[CHECK][EXTERNAL_INTEGRATIONS_READINESS]";

const integrationEnvKeys = [
  ...Object.values(AI_PROVIDER_ENV_KEYS),
  ...Object.values(WORDPRESS_INTEGRATION_ENV_KEYS),
  ...Object.values(IMAGE_GENERATION_ENV_KEYS),
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "R2_PUBLIC_BASE_URL"
];

const forbiddenValuePatterns = [/sk-or-[a-z0-9]{8,}/i, /passwordHash/i, /sessionTokenHash/i, /-----BEGIN/i];

const results: Array<{ name: string; ok: boolean; detail: string }> = [];

function record(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function snapshotEnv(): Record<string, string | undefined> {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of integrationEnvKeys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of integrationEnvKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearIntegrationEnv() {
  for (const key of integrationEnvKeys) {
    delete process.env[key];
  }
}

function setIntegrationEnv(values: Record<string, string | undefined>) {
  clearIntegrationEnv();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function responseLeaksSecretValues(text: string): boolean {
  return forbiddenValuePatterns.some((pattern) => pattern.test(text));
}

function findCategory(snapshot: ExternalIntegrationsReadinessSnapshot, key: string) {
  return snapshot.categories.find((category) => category.key === key) ?? null;
}

async function main() {
  console.log(`${smokeMarker} starting`);
  const initialEnv = snapshotEnv();
  let fetchCallCount = 0;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    fetchCallCount++;
    return Promise.reject(new Error(`Unexpected live fetch during readiness check: ${String(args[0])}`));
  }) as typeof fetch;

  try {
    clearIntegrationEnv();

    const emptySnapshot = getExternalIntegrationsReadinessSnapshot();
    record("snapshot builds with empty integration env", emptySnapshot.categories.length === 4, `categories=${emptySnapshot.categories.length}`);
    record(
      "empty env image_generation disabled",
      findCategory(emptySnapshot, "image_generation")?.status === "disabled",
      findCategory(emptySnapshot, "image_generation")?.status ?? "missing"
    );
    record(
      "empty env AI provider defaults local/disabled-safe",
      findCategory(emptySnapshot, "ai_provider")?.aiProvider?.textGateway === "local",
      findCategory(emptySnapshot, "ai_provider")?.aiProvider?.textGateway ?? "missing"
    );
    record(
      "empty env WordPress publish disabled",
      findCategory(emptySnapshot, "wordpress")?.status === "disabled",
      findCategory(emptySnapshot, "wordpress")?.status ?? "missing"
    );
    record(
      "empty env R2 disabled",
      findCategory(emptySnapshot, "private_storage")?.status === "disabled",
      findCategory(emptySnapshot, "private_storage")?.privateStorage?.mode ?? "missing"
    );

    const serialized = JSON.stringify(emptySnapshot);
    record("snapshot JSON hides secrets", !responseLeaksSecretValues(serialized), "safe JSON");
    record(
      "snapshot marks no live calls in layer",
      emptySnapshot.summary.noLiveCallsInThisLayer === true,
      String(emptySnapshot.summary.noLiveCallsInThisLayer)
    );

    setIntegrationEnv({
      [AI_PROVIDER_ENV_KEYS.textGateway]: "openrouter"
    });
    const misconfiguredAi = getExternalIntegrationsReadinessSnapshot();
    record(
      "partial OpenRouter config reports missing_config",
      findCategory(misconfiguredAi, "ai_provider")?.status === "missing_config",
      findCategory(misconfiguredAi, "ai_provider")?.status ?? "missing"
    );
    record(
      "partial OpenRouter blocks live execution",
      findCategory(misconfiguredAi, "ai_provider")?.aiProvider?.openRouterLiveExecutionEnabled === false,
      String(findCategory(misconfiguredAi, "ai_provider")?.aiProvider?.openRouterLiveExecutionEnabled)
    );

    const openRouterGuard = await executeOpenRouterTextRequest({
      config: getAiProviderConfig(),
      model: "example/model",
      systemPrompt: "system",
      userPrompt: "user",
      maxOutputTokens: 120,
      temperature: 0.2
    });
    record(
      "OpenRouter helper does not call provider when misconfigured",
      openRouterGuard.ok === false && openRouterGuard.errorMessage === "OpenRouter is not fully configured.",
      openRouterGuard.errorMessage ?? "missing error"
    );

    setIntegrationEnv({
      [AI_PROVIDER_ENV_KEYS.textGateway]: "openrouter",
      [AI_PROVIDER_ENV_KEYS.openRouterApiKey]: "sk-or-smoke-test-key-not-real",
      [AI_PROVIDER_ENV_KEYS.openRouterTextPrimaryModel]: "example/primary"
    });
    const shapedAi = getExternalIntegrationsReadinessSnapshot();
    record(
      "complete OpenRouter shape reports configured_shape_ok",
      findCategory(shapedAi, "ai_provider")?.status === "configured_shape_ok",
      findCategory(shapedAi, "ai_provider")?.status ?? "missing"
    );
    record(
      "complete OpenRouter shape still defers live calls in readiness layer",
      findCategory(shapedAi, "ai_provider")?.liveCallsDeferred === true,
      "deferred"
    );
    record(
      "complete OpenRouter JSON omits raw API key",
      !JSON.stringify(shapedAi).includes("sk-or-smoke-test-key-not-real"),
      "key absent"
    );

    clearIntegrationEnv();
    setIntegrationEnv({
      [WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled]: "true"
    });
    const wpMissing = getExternalIntegrationsReadinessSnapshot();
    record(
      "WordPress publish on without encryption key is missing_config",
      findCategory(wpMissing, "wordpress")?.status === "missing_config",
      findCategory(wpMissing, "wordpress")?.status ?? "missing"
    );

    setIntegrationEnv({
      [WORDPRESS_INTEGRATION_ENV_KEYS.publishEnabled]: "true",
      [WORDPRESS_INTEGRATION_ENV_KEYS.credentialEncryptionMasterKey]: "smoke-master-key-placeholder"
    });
    const wpShaped = getExternalIntegrationsReadinessSnapshot();
    record(
      "WordPress publish + encryption key is configured_shape_ok",
      findCategory(wpShaped, "wordpress")?.status === "configured_shape_ok",
      findCategory(wpShaped, "wordpress")?.status ?? "missing"
    );
    record(
      "WordPress readiness JSON omits master key value",
      !JSON.stringify(wpShaped).includes("smoke-master-key-placeholder"),
      "key absent"
    );

    clearIntegrationEnv();
    setIntegrationEnv({
      R2_ACCOUNT_ID: "smoke-account",
      R2_ACCESS_KEY_ID: "smoke-access",
      R2_SECRET_ACCESS_KEY: "smoke-secret",
      R2_BUCKET_NAME: "smoke-bucket"
    });
    const r2Shaped = getExternalIntegrationsReadinessSnapshot();
    record(
      "R2 full env shape reports configured_shape_ok without bucket IO",
      findCategory(r2Shaped, "private_storage")?.status === "configured_shape_ok",
      findCategory(r2Shaped, "private_storage")?.status ?? "missing"
    );
    record(
      "R2 readiness JSON omits secret access key value",
      !JSON.stringify(r2Shaped).includes("smoke-secret"),
      "secret absent"
    );
    record(
      "R2 env presence uses booleans only",
      getR2EnvPresence().R2_SECRET_ACCESS_KEY === true,
      "presence boolean"
    );

    clearIntegrationEnv();
    setIntegrationEnv({
      R2_ACCOUNT_ID: "partial-account"
    });
    const r2Partial = getExternalIntegrationsReadinessSnapshot();
    record(
      "partial R2 env reports missing_config",
      findCategory(r2Partial, "private_storage")?.status === "missing_config",
      findCategory(r2Partial, "private_storage")?.status ?? "missing"
    );

    clearIntegrationEnv();
    setIntegrationEnv({
      [IMAGE_GENERATION_ENV_KEYS.enabled]: "true"
    });
    const imageGenMissing = getExternalIntegrationsReadinessSnapshot();
    record(
      "image_generation enabled without provider/key is missing_config",
      findCategory(imageGenMissing, "image_generation")?.status === "missing_config",
      findCategory(imageGenMissing, "image_generation")?.status ?? "missing"
    );

    setIntegrationEnv({
      [IMAGE_GENERATION_ENV_KEYS.enabled]: "true",
      [IMAGE_GENERATION_ENV_KEYS.provider]: "openai",
      [IMAGE_GENERATION_ENV_KEYS.apiKey]: "smoke-image-provider-key",
      [IMAGE_GENERATION_ENV_KEYS.model]: "gpt-image-1"
    });
    const imageGenShaped = getExternalIntegrationsReadinessSnapshot();
    record(
      "image_generation full env shape reports configured_shape_ok",
      findCategory(imageGenShaped, "image_generation")?.status === "configured_shape_ok",
      findCategory(imageGenShaped, "image_generation")?.status ?? "missing"
    );
    record(
      "image_generation readiness still defers live provider calls",
      findCategory(imageGenShaped, "image_generation")?.imageGeneration?.liveProviderCallsDeferred === true,
      "deferred"
    );
    record(
      "image_generation readiness JSON omits API key value",
      !JSON.stringify(imageGenShaped).includes("smoke-image-provider-key"),
      "key absent"
    );

    record("no live fetch during readiness runner", fetchCallCount === 0, `calls=${fetchCallCount}`);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(initialEnv);
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log(
      "PROVEN: External integrations readiness is config-shape only; no live provider/publish/sync/bucket calls."
    );
  } else {
    console.log("NOT PROVEN: one or more external integrations readiness checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

await main();
