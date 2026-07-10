/**
 * Image generation provider config — disabled-safe shape only.
 *
 * No live provider client is wired in this block. This module only resolves
 * env-derived configuration shape so the readiness layer and downstream
 * execution helpers can report `disabled` / `missing_config` /
 * `configured_shape_ok` without ever making a network call.
 *
 * See docs/runbooks/IMAGE_GENERATION_PROOF.md Phase B.
 */

export const IMAGE_GENERATION_ENV_KEYS = {
  enabled: "IMAGE_GENERATION_ENABLED",
  provider: "IMAGE_GENERATION_PROVIDER",
  apiKey: "IMAGE_GENERATION_API_KEY"
} as const;

export type ImageGenerationIntegrationReadinessStatus = "disabled" | "missing_config" | "configured_shape_ok";

export interface ImageGenerationIntegrationReadiness {
  status: ImageGenerationIntegrationReadinessStatus;
  generationEnabled: boolean;
  provider: string | null;
  hasApiKey: boolean;
  missingKeys: string[];
  liveProviderCallsDeferred: true;
}

function readEnvPresent(key: string): boolean {
  const value = process.env[key]?.trim();
  return Boolean(value);
}

function readEnvValue(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

export function getImageGenerationIntegrationReadiness(): ImageGenerationIntegrationReadiness {
  const generationEnabled = process.env[IMAGE_GENERATION_ENV_KEYS.enabled] === "true";
  const provider = readEnvValue(IMAGE_GENERATION_ENV_KEYS.provider);
  const hasApiKey = readEnvPresent(IMAGE_GENERATION_ENV_KEYS.apiKey);

  if (!generationEnabled) {
    return {
      status: "disabled",
      generationEnabled: false,
      provider,
      hasApiKey,
      missingKeys: [],
      liveProviderCallsDeferred: true
    };
  }

  const missingKeys: string[] = [];
  if (!provider) {
    missingKeys.push(IMAGE_GENERATION_ENV_KEYS.provider);
  }
  if (!hasApiKey) {
    missingKeys.push(IMAGE_GENERATION_ENV_KEYS.apiKey);
  }

  if (missingKeys.length > 0) {
    return {
      status: "missing_config",
      generationEnabled: true,
      provider,
      hasApiKey,
      missingKeys,
      liveProviderCallsDeferred: true
    };
  }

  return {
    status: "configured_shape_ok",
    generationEnabled: true,
    provider,
    hasApiKey: true,
    missingKeys: [],
    liveProviderCallsDeferred: true
  };
}

export type ImageGenerationNoLiveConfigSnapshot = {
  liveProviderCallsDeferred: true;
  liveProviderCallsAllowed: false;
  readinessStatuses: ImageGenerationIntegrationReadinessStatus[];
  envKeys: typeof IMAGE_GENERATION_ENV_KEYS;
};

/**
 * G562 — Safe no-live config snapshot. Never reads secret values into the snapshot.
 */
export function buildImageGenerationNoLiveConfigSnapshot(): ImageGenerationNoLiveConfigSnapshot {
  return {
    liveProviderCallsDeferred: true,
    liveProviderCallsAllowed: false,
    readinessStatuses: ["disabled", "missing_config", "configured_shape_ok"],
    envKeys: IMAGE_GENERATION_ENV_KEYS
  };
}
