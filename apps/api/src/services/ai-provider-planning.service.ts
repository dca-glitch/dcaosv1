import {
  getAiProviderConfig,
  isOpenRouterLiveExecutionReady,
  validateAiProviderConfigForRuntime,
  type AiProviderConfig
} from "../config";

export interface AiProviderPlanningSnapshot {
  textGateway: AiProviderConfig["textGateway"];
  preferredTextGateway: AiProviderConfig["preferredTextGateway"];
  hasOpenRouterApiKey: boolean;
  openRouterBaseUrl: string;
  models: {
    primary: string | null;
    secondary: string | null;
    reviewer: string | null;
    longContext: string | null;
  };
  openRouterLiveExecutionEnabled: boolean;
  openRouterFallbackActive: boolean;
  validation: ReturnType<typeof validateAiProviderConfigForRuntime>;
}

export function isOpenRouterLiveExecutionEnabled(config: AiProviderConfig): boolean {
  return isOpenRouterLiveExecutionReady(config);
}

export function getAiProviderPlanningSnapshot(): AiProviderPlanningSnapshot {
  const config = getAiProviderConfig();
  const validation = validateAiProviderConfigForRuntime(config);
  const openRouterLiveExecutionEnabled = isOpenRouterLiveExecutionEnabled(config);

  return {
    textGateway: config.textGateway,
    preferredTextGateway: config.preferredTextGateway,
    hasOpenRouterApiKey: config.hasOpenRouterApiKey,
    openRouterBaseUrl: config.openRouterBaseUrl,
    models: {
      primary: config.openRouterTextPrimaryModel,
      secondary: config.openRouterTextSecondaryModel,
      reviewer: config.openRouterTextReviewerModel,
      longContext: config.openRouterTextLongContextModel
    },
    openRouterLiveExecutionEnabled,
    openRouterFallbackActive: config.textGateway === "openrouter" && !openRouterLiveExecutionEnabled,
    validation
  };
}
