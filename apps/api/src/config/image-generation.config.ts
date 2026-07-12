/**
 * Image generation provider config — disabled-safe shape + active OpenAI defaults.
 * BFL remains supported when env/route select provider=bfl.
 *
 * Live calls require layered authorization (see image-generation-guard.service).
 * Merely having IMAGE_GENERATION_API_KEY present does not authorize a provider call.
 */

export const IMAGE_GENERATION_ENV_KEYS = {
  enabled: "IMAGE_GENERATION_ENABLED",
  provider: "IMAGE_GENERATION_PROVIDER",
  apiKey: "IMAGE_GENERATION_API_KEY",
  model: "IMAGE_GENERATION_MODEL",
  baseUrl: "IMAGE_GENERATION_BASE_URL",
  maxCostUsd: "IMAGE_GENERATION_MAX_COST_USD",
  timeoutMs: "IMAGE_GENERATION_TIMEOUT_MS",
  maxPollAttempts: "IMAGE_GENERATION_MAX_POLL_ATTEMPTS",
  pollIntervalMs: "IMAGE_GENERATION_POLL_INTERVAL_MS",
  /** Explicit live opt-in; required in addition to enabled + key + policy. */
  liveCallsAllowed: "IMAGE_GENERATION_LIVE_CALLS_ALLOWED"
} as const;

/** Shared hard cost ceiling for all image adapters under AI Policy. */
export const IMAGE_GENERATION_COST_USD_CEILING = 0.1 as const;

export const IMAGE_GENERATION_DEFAULTS = {
  provider: "openai",
  model: "gpt-image-1",
  baseUrl: "https://api.openai.com/v1",
  maxCostUsd: IMAGE_GENERATION_COST_USD_CEILING,
  timeoutMs: 120_000,
  maxPollAttempts: 40,
  pollIntervalMs: 3_000,
  maxMegapixels: 1,
  maxWidth: 1024,
  maxHeight: 1024,
  maxDownloadBytes: 8 * 1024 * 1024,
  estimatedCostUsd: 0.1,
  generationsPath: "/images/generations"
} as const;

/** OpenAI Images HTTP contract — synchronous generations; quality locked low for cost bound. */
export const IMAGE_OPENAI_HTTP_CONTRACT = {
  retryCount: 0 as const,
  defaultTimeoutMs: IMAGE_GENERATION_DEFAULTS.timeoutMs,
  maxCostUsdCeiling: IMAGE_GENERATION_COST_USD_CEILING,
  allowedHostnames: ["api.openai.com"] as const,
  generationsPath: "/images/generations",
  /** Only square 1024 within ≤1MP / maxWidth×maxHeight policy. */
  allowedSizes: ["1024x1024"] as const,
  /** High quality exceeds USD 0.10; adapter must not accept higher. */
  quality: "low" as const,
  n: 1 as const
} as const;

/** Hard HTTP/poll contract for BFL — retained; not the active default route. */
export const IMAGE_BFL_HTTP_CONTRACT = {
  retryCount: 0 as const,
  defaultTimeoutMs: IMAGE_GENERATION_DEFAULTS.timeoutMs,
  defaultPollIntervalMs: IMAGE_GENERATION_DEFAULTS.pollIntervalMs,
  defaultMaxPollAttempts: IMAGE_GENERATION_DEFAULTS.maxPollAttempts,
  maxCostUsdCeiling: IMAGE_GENERATION_COST_USD_CEILING,
  allowedSubmitHostnames: ["api.bfl.ai"] as const,
  allowedPollHostnameSuffixes: [".bfl.ai", "api.bfl.ai"] as const,
  submitPath: "/v1/flux-2-pro",
  defaultBaseUrl: "https://api.bfl.ai",
  defaultModel: "flux-2-pro"
} as const;

export type ImageGenerationIntegrationReadinessStatus = "disabled" | "missing_config" | "configured_shape_ok";

export interface ImageGenerationIntegrationReadiness {
  status: ImageGenerationIntegrationReadinessStatus;
  generationEnabled: boolean;
  provider: string | null;
  model: string | null;
  hasApiKey: boolean;
  missingKeys: string[];
  liveProviderCallsDeferred: true;
  baseHostname: string;
  maxCostUsd: number;
  timeoutMs: number;
  maxPollAttempts: number;
  pollIntervalMs: number;
}

export type ImageGenerationProviderConfig = {
  generationEnabled: boolean;
  liveCallsAllowedEnv: boolean;
  provider: string | null;
  model: string | null;
  hasApiKey: boolean;
  baseUrl: string;
  baseHostname: string;
  maxCostUsd: number;
  timeoutMs: number;
  maxPollAttempts: number;
  pollIntervalMs: number;
};

function readEnvPresent(key: string): boolean {
  const value = process.env[key]?.trim();
  return Boolean(value);
}

function readEnvValue(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function readPositiveNumber(key: string, fallback: number, ceiling?: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  if (ceiling !== undefined && parsed > ceiling) return ceiling;
  return parsed;
}

function hostnameFromBaseUrl(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "invalid";
  }
}

export function getImageGenerationProviderConfig(): ImageGenerationProviderConfig {
  const baseUrl = readEnvValue(IMAGE_GENERATION_ENV_KEYS.baseUrl) ?? IMAGE_GENERATION_DEFAULTS.baseUrl;
  return {
    generationEnabled: process.env[IMAGE_GENERATION_ENV_KEYS.enabled] === "true",
    liveCallsAllowedEnv: process.env[IMAGE_GENERATION_ENV_KEYS.liveCallsAllowed] === "true",
    provider: readEnvValue(IMAGE_GENERATION_ENV_KEYS.provider),
    model: readEnvValue(IMAGE_GENERATION_ENV_KEYS.model),
    hasApiKey: readEnvPresent(IMAGE_GENERATION_ENV_KEYS.apiKey),
    baseUrl: baseUrl.replace(/\/+$/, ""),
    baseHostname: hostnameFromBaseUrl(baseUrl),
    maxCostUsd: readPositiveNumber(
      IMAGE_GENERATION_ENV_KEYS.maxCostUsd,
      IMAGE_GENERATION_DEFAULTS.maxCostUsd,
      IMAGE_GENERATION_COST_USD_CEILING
    ),
    timeoutMs: readPositiveNumber(
      IMAGE_GENERATION_ENV_KEYS.timeoutMs,
      IMAGE_GENERATION_DEFAULTS.timeoutMs,
      IMAGE_GENERATION_DEFAULTS.timeoutMs
    ),
    maxPollAttempts: Math.floor(
      readPositiveNumber(
        IMAGE_GENERATION_ENV_KEYS.maxPollAttempts,
        IMAGE_GENERATION_DEFAULTS.maxPollAttempts,
        IMAGE_GENERATION_DEFAULTS.maxPollAttempts
      )
    ),
    pollIntervalMs: Math.floor(
      readPositiveNumber(
        IMAGE_GENERATION_ENV_KEYS.pollIntervalMs,
        IMAGE_GENERATION_DEFAULTS.pollIntervalMs,
        IMAGE_GENERATION_DEFAULTS.pollIntervalMs
      )
    )
  };
}

export function getImageGenerationIntegrationReadiness(): ImageGenerationIntegrationReadiness {
  const config = getImageGenerationProviderConfig();

  if (!config.generationEnabled) {
    return {
      status: "disabled",
      generationEnabled: false,
      provider: config.provider,
      model: config.model,
      hasApiKey: config.hasApiKey,
      missingKeys: [],
      liveProviderCallsDeferred: true,
      baseHostname: config.baseHostname,
      maxCostUsd: config.maxCostUsd,
      timeoutMs: config.timeoutMs,
      maxPollAttempts: config.maxPollAttempts,
      pollIntervalMs: config.pollIntervalMs
    };
  }

  const missingKeys: string[] = [];
  if (!config.provider) missingKeys.push(IMAGE_GENERATION_ENV_KEYS.provider);
  if (!config.hasApiKey) missingKeys.push(IMAGE_GENERATION_ENV_KEYS.apiKey);
  if (!config.model) missingKeys.push(IMAGE_GENERATION_ENV_KEYS.model);

  if (missingKeys.length > 0) {
    return {
      status: "missing_config",
      generationEnabled: true,
      provider: config.provider,
      model: config.model,
      hasApiKey: config.hasApiKey,
      missingKeys,
      liveProviderCallsDeferred: true,
      baseHostname: config.baseHostname,
      maxCostUsd: config.maxCostUsd,
      timeoutMs: config.timeoutMs,
      maxPollAttempts: config.maxPollAttempts,
      pollIntervalMs: config.pollIntervalMs
    };
  }

  return {
    status: "configured_shape_ok",
    generationEnabled: true,
    provider: config.provider,
    model: config.model,
    hasApiKey: true,
    missingKeys: [],
    liveProviderCallsDeferred: true,
    baseHostname: config.baseHostname,
    maxCostUsd: config.maxCostUsd,
    timeoutMs: config.timeoutMs,
    maxPollAttempts: config.maxPollAttempts,
    pollIntervalMs: config.pollIntervalMs
  };
}

export type ImageGenerationNoLiveConfigSnapshot = {
  liveProviderCallsDeferred: true;
  liveProviderCallsAllowed: false;
  readinessStatuses: ImageGenerationIntegrationReadinessStatus[];
  envKeys: typeof IMAGE_GENERATION_ENV_KEYS;
  defaults: {
    provider: typeof IMAGE_GENERATION_DEFAULTS.provider;
    model: typeof IMAGE_GENERATION_DEFAULTS.model;
    baseHostname: string;
    maxCostUsd: number;
  };
};

/**
 * Safe no-live config snapshot. Never reads secret values into the snapshot.
 * Default liveProviderCallsAllowed remains false — layered auth is separate.
 */
export function buildImageGenerationNoLiveConfigSnapshot(): ImageGenerationNoLiveConfigSnapshot {
  return {
    liveProviderCallsDeferred: true,
    liveProviderCallsAllowed: false,
    readinessStatuses: ["disabled", "missing_config", "configured_shape_ok"],
    envKeys: IMAGE_GENERATION_ENV_KEYS,
    defaults: {
      provider: IMAGE_GENERATION_DEFAULTS.provider,
      model: IMAGE_GENERATION_DEFAULTS.model,
      baseHostname: hostnameFromBaseUrl(IMAGE_GENERATION_DEFAULTS.baseUrl),
      maxCostUsd: IMAGE_GENERATION_DEFAULTS.maxCostUsd
    }
  };
}

/** Reads API key from env for adapter transport only — never export value in snapshots. */
export function readImageGenerationApiKey(): string | null {
  return readEnvValue(IMAGE_GENERATION_ENV_KEYS.apiKey);
}
