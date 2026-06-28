export type AiTextGateway = "local" | "openrouter";

export interface AiProviderConfig {
  textGateway: AiTextGateway;
  preferredTextGateway: "openrouter";
  hasOpenRouterApiKey: boolean;
  openRouterBaseUrl: string;
  openRouterTextPrimaryModel: string | null;
  openRouterTextSecondaryModel: string | null;
  openRouterTextReviewerModel: string | null;
  openRouterTextLongContextModel: string | null;
}

export interface AiProviderConfigValidationResult {
  ok: boolean;
  issues: string[];
  warnings: string[];
}

export const AI_PROVIDER_ENV_KEYS = {
  textGateway: "AI_TEXT_GATEWAY",
  openRouterApiKey: "OPENROUTER_API_KEY",
  openRouterBaseUrl: "OPENROUTER_BASE_URL",
  openRouterTextPrimaryModel: "OPENROUTER_TEXT_PRIMARY_MODEL",
  openRouterTextSecondaryModel: "OPENROUTER_TEXT_SECONDARY_MODEL",
  openRouterTextReviewerModel: "OPENROUTER_TEXT_REVIEWER_MODEL",
  openRouterTextLongContextModel: "OPENROUTER_TEXT_LONG_CONTEXT_MODEL"
} as const;

export const DEFAULT_AI_TEXT_GATEWAY: AiTextGateway = "local";
const PREFERRED_TEXT_GATEWAY = "openrouter" as const;
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function readEnvString(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function readAiTextGateway(): AiTextGateway {
  const gateway = readEnvString(AI_PROVIDER_ENV_KEYS.textGateway)?.toLowerCase();

  if (gateway === "openrouter") {
    return "openrouter";
  }

  return DEFAULT_AI_TEXT_GATEWAY;
}

export function isOpenRouterLiveExecutionReady(config: AiProviderConfig): boolean {
  return (
    config.textGateway === "openrouter" &&
    config.hasOpenRouterApiKey &&
    Boolean(config.openRouterTextPrimaryModel)
  );
}

export function getAiProviderConfig(): AiProviderConfig {
  return {
    textGateway: readAiTextGateway(),
    preferredTextGateway: PREFERRED_TEXT_GATEWAY,
    hasOpenRouterApiKey: Boolean(readEnvString(AI_PROVIDER_ENV_KEYS.openRouterApiKey)),
    openRouterBaseUrl: readEnvString(AI_PROVIDER_ENV_KEYS.openRouterBaseUrl) ?? DEFAULT_OPENROUTER_BASE_URL,
    openRouterTextPrimaryModel: readEnvString(AI_PROVIDER_ENV_KEYS.openRouterTextPrimaryModel),
    openRouterTextSecondaryModel: readEnvString(AI_PROVIDER_ENV_KEYS.openRouterTextSecondaryModel),
    openRouterTextReviewerModel: readEnvString(AI_PROVIDER_ENV_KEYS.openRouterTextReviewerModel),
    openRouterTextLongContextModel: readEnvString(AI_PROVIDER_ENV_KEYS.openRouterTextLongContextModel)
  };
}

export function validateAiProviderConfigForPlanning(config: AiProviderConfig): AiProviderConfigValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (config.textGateway !== "local" && config.textGateway !== "openrouter") {
    issues.push("AI text gateway must be local or openrouter.");
  }

  if (!config.openRouterBaseUrl) {
    issues.push("OpenRouter base URL must remain available for future planning.");
  }

  if (config.textGateway === "openrouter" && !config.hasOpenRouterApiKey) {
    warnings.push("OpenRouter API key is not configured; real provider execution must remain disabled.");
  }

  if (config.textGateway === "openrouter" && !config.openRouterTextPrimaryModel) {
    warnings.push("OpenRouter primary text model is not configured; live provider execution must remain disabled.");
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings
  };
}

export function validateAiProviderConfigForRuntime(config: AiProviderConfig): AiProviderConfigValidationResult {
  const planning = validateAiProviderConfigForPlanning(config);
  const warnings = [...planning.warnings];
  const issues = [...planning.issues];

  const rawGateway = readEnvString(AI_PROVIDER_ENV_KEYS.textGateway);
  if (rawGateway) {
    const normalized = rawGateway.toLowerCase();
    if (normalized !== "local" && normalized !== "openrouter") {
      warnings.push(
        `Unrecognized ${AI_PROVIDER_ENV_KEYS.textGateway} value "${rawGateway}"; runtime uses local deterministic gateway.`
      );
    }
  }

  if (config.textGateway === "openrouter" && !isOpenRouterLiveExecutionReady(config)) {
    warnings.push(
      "OpenRouter gateway requested but live execution remains disabled; deterministic local fallback is active."
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings
  };
}
