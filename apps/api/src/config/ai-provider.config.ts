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

const DEFAULT_TEXT_GATEWAY: AiTextGateway = "local";
const PREFERRED_TEXT_GATEWAY = "openrouter" as const;
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function readEnvString(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function readAiTextGateway(): AiTextGateway {
  const gateway = readEnvString("AI_TEXT_GATEWAY")?.toLowerCase();

  if (gateway === "openrouter") {
    return "openrouter";
  }

  return DEFAULT_TEXT_GATEWAY;
}

export function getAiProviderConfig(): AiProviderConfig {
  return {
    textGateway: readAiTextGateway(),
    preferredTextGateway: PREFERRED_TEXT_GATEWAY,
    hasOpenRouterApiKey: Boolean(readEnvString("OPENROUTER_API_KEY")),
    openRouterBaseUrl: readEnvString("OPENROUTER_BASE_URL") ?? DEFAULT_OPENROUTER_BASE_URL,
    openRouterTextPrimaryModel: readEnvString("OPENROUTER_TEXT_PRIMARY_MODEL"),
    openRouterTextSecondaryModel: readEnvString("OPENROUTER_TEXT_SECONDARY_MODEL"),
    openRouterTextReviewerModel: readEnvString("OPENROUTER_TEXT_REVIEWER_MODEL"),
    openRouterTextLongContextModel: readEnvString("OPENROUTER_TEXT_LONG_CONTEXT_MODEL")
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

  return {
    ok: issues.length === 0,
    issues,
    warnings
  };
}
