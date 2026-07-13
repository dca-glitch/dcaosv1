/**
 * Block 1 — external integrations readiness (config shape only, no live calls).
 */

import {
  getAiProviderConfig,
  isOpenRouterLiveExecutionReady,
  validateAiProviderConfigForRuntime,
  type AiProviderConfigValidationResult
} from "../config/ai-provider.config";
import {
  getImageGenerationIntegrationReadiness,
  type ImageGenerationIntegrationReadiness
} from "../config/image-generation.config";
import {
  getWordPressIntegrationReadiness,
  type WordPressIntegrationReadiness
} from "../config/wordpress-integration.config";
import { getPrivateStorageStatus, type PrivateStorageStatus } from "../storage/private-storage.service";

export type ExternalIntegrationReadinessStatus =
  | "disabled"
  | "missing_config"
  | "configured_shape_ok";

export type ExternalIntegrationCategoryKey =
  | "ai_provider"
  | "wordpress"
  | "private_storage"
  | "image_generation";

export interface AiProviderIntegrationReadiness {
  status: ExternalIntegrationReadinessStatus;
  textGateway: ReturnType<typeof getAiProviderConfig>["textGateway"];
  hasOpenRouterApiKey: boolean;
  openRouterLiveExecutionEnabled: boolean;
  missingKeys: string[];
  validation: AiProviderConfigValidationResult;
  liveProviderCallsDeferred: true;
}

export interface PrivateStorageIntegrationReadiness {
  status: ExternalIntegrationReadinessStatus;
  mode: PrivateStorageStatus["mode"];
  provider: PrivateStorageStatus["provider"];
  configured: boolean;
  missingKeys: string[];
  liveBucketMutationDeferred: true;
}

export interface ExternalIntegrationReadinessCategory {
  key: ExternalIntegrationCategoryKey;
  label: string;
  status: ExternalIntegrationReadinessStatus;
  detail: string;
  liveCallsDeferred: true;
  aiProvider?: AiProviderIntegrationReadiness;
  wordpress?: WordPressIntegrationReadiness;
  privateStorage?: PrivateStorageIntegrationReadiness;
  imageGeneration?: ImageGenerationIntegrationReadiness;
}

export interface ExternalIntegrationsReadinessSnapshot {
  generatedAtIso: string;
  categories: ExternalIntegrationReadinessCategory[];
  summary: {
    allCategoriesSafe: boolean;
    liveExecutionBlocked: boolean;
    noLiveCallsInThisLayer: true;
  };
}

function resolveAiProviderStatus(
  config: ReturnType<typeof getAiProviderConfig>
): ExternalIntegrationReadinessStatus {
  if (config.textGateway === "disabled") {
    return "disabled";
  }

  if (config.textGateway === "local") {
    return "configured_shape_ok";
  }

  if (!config.hasOpenRouterApiKey || !config.openRouterTextPrimaryModel) {
    return "missing_config";
  }

  return "configured_shape_ok";
}

function buildAiProviderMissingKeys(config: ReturnType<typeof getAiProviderConfig>): string[] {
  const missing: string[] = [];
  if (config.textGateway === "openrouter" && !config.hasOpenRouterApiKey) {
    missing.push("OPENROUTER_API_KEY");
  }
  if (config.textGateway === "openrouter" && !config.openRouterTextPrimaryModel) {
    missing.push("OPENROUTER_TEXT_PRIMARY_MODEL");
  }
  return missing;
}

export function getAiProviderIntegrationReadiness(): AiProviderIntegrationReadiness {
  const config = getAiProviderConfig();
  const validation = validateAiProviderConfigForRuntime(config);
  const openRouterLiveExecutionEnabled = isOpenRouterLiveExecutionReady(config);

  return {
    status: resolveAiProviderStatus(config),
    textGateway: config.textGateway,
    hasOpenRouterApiKey: config.hasOpenRouterApiKey,
    openRouterLiveExecutionEnabled,
    missingKeys: buildAiProviderMissingKeys(config),
    validation,
    liveProviderCallsDeferred: true
  };
}

export function getPrivateStorageIntegrationReadiness(): PrivateStorageIntegrationReadiness {
  const storage = getPrivateStorageStatus();

  return {
    status: storage.configured ? "configured_shape_ok" : storage.requiredEnvPresent ? "missing_config" : "disabled",
    mode: storage.mode,
    provider: storage.provider,
    configured: storage.configured,
    missingKeys: storage.missingEnvKeys,
    liveBucketMutationDeferred: true
  };
}

function buildAiProviderDetail(readiness: AiProviderIntegrationReadiness): string {
  if (readiness.status === "disabled") {
    return "AI text gateway disabled; no provider execution.";
  }

  if (readiness.textGateway === "local") {
    return "Local deterministic gateway active; live provider calls deferred.";
  }

  if (readiness.openRouterLiveExecutionEnabled) {
    return "OpenRouter config shape complete; readiness layer does not execute live calls.";
  }

  return "OpenRouter gateway requested but incomplete; live execution remains blocked.";
}

function buildWordPressDetail(readiness: WordPressIntegrationReadiness): string {
  if (readiness.status === "disabled") {
    return "WORDPRESS_PUBLISH_ENABLED is not true; draft prep remains local-only.";
  }

  if (readiness.status === "missing_config") {
    return `Publish gate open but missing: ${readiness.missingKeys.join(", ")}.`;
  }

  return "Publish env + credential encryption present; live publish remains confirm-gated.";
}

function buildPrivateStorageDetail(readiness: PrivateStorageIntegrationReadiness): string {
  if (readiness.status === "disabled") {
    return `R2 not configured (mode=${readiness.mode}); upload/download guarded.`;
  }
  if (readiness.status === "missing_config") {
    return `R2 config incomplete; missing: ${readiness.missingKeys.join(", ")}. Upload/download guarded.`;
  }

  return `R2 config shape OK (mode=${readiness.mode}); bucket mutation deferred in readiness layer.`;
}

function buildImageGenerationDetail(readiness: ImageGenerationIntegrationReadiness): string {
  if (readiness.status === "disabled") {
    return "IMAGE_GENERATION_ENABLED is not true; no image provider execution.";
  }

  if (readiness.status === "missing_config") {
    return `Generation flag on but missing: ${readiness.missingKeys.join(", ")}; provider not called.`;
  }

  return "Provider config shape present; live image generation calls remain deferred in this block.";
}

export function getExternalIntegrationsReadinessSnapshot(): ExternalIntegrationsReadinessSnapshot {
  const aiProvider = getAiProviderIntegrationReadiness();
  const wordpress = getWordPressIntegrationReadiness();
  const privateStorage = getPrivateStorageIntegrationReadiness();
  const imageGeneration = getImageGenerationIntegrationReadiness();

  const categories: ExternalIntegrationReadinessCategory[] = [
    {
      key: "ai_provider",
      label: "AI provider",
      status: aiProvider.status,
      detail: buildAiProviderDetail(aiProvider),
      liveCallsDeferred: true,
      aiProvider
    },
    {
      key: "wordpress",
      label: "WordPress",
      status: wordpress.status,
      detail: buildWordPressDetail(wordpress),
      liveCallsDeferred: true,
      wordpress
    },
    {
      key: "private_storage",
      label: "Private storage (R2)",
      status: privateStorage.status,
      detail: buildPrivateStorageDetail(privateStorage),
      liveCallsDeferred: true,
      privateStorage
    },
    {
      key: "image_generation",
      label: "Image generation",
      status: imageGeneration.status,
      detail: buildImageGenerationDetail(imageGeneration),
      liveCallsDeferred: true,
      imageGeneration
    }
  ];

  const liveExecutionBlocked =
    !aiProvider.openRouterLiveExecutionEnabled &&
    wordpress.status !== "configured_shape_ok" &&
    !privateStorage.configured &&
    imageGeneration.status !== "configured_shape_ok";

  return {
    generatedAtIso: new Date().toISOString(),
    categories,
    summary: {
      allCategoriesSafe: categories.every((category) =>
        ["disabled", "missing_config", "configured_shape_ok"].includes(category.status)
      ),
      liveExecutionBlocked,
      noLiveCallsInThisLayer: true
    }
  };
}
