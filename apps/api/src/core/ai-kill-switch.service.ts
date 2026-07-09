/**
 * AI kill switch and live-flag invariant service (G56).
 * Aggregates all live AI flags; default must remain disabled-safe.
 */

import { getAiProviderConfig, isOpenRouterLiveExecutionReady } from "../config/ai-provider.config";
import { getImageGenerationIntegrationReadiness } from "../config/image-generation.config";
import { AI_PROVIDER_REGISTRY } from "./ai-provider-registry.service";

export const AI_KILL_SWITCH_VERSION = "AI_KILL_SWITCH_V1";

export interface AiKillSwitchSnapshot {
  textGatewayLive: boolean;
  researchProviderLive: boolean;
  imageGenerationLive: boolean;
  visionQaLive: boolean;
  anyLiveProviderEnabled: boolean;
  orchestratorLiveSafe: boolean;
  notes: string[];
}

export function getAiKillSwitchSnapshot(): AiKillSwitchSnapshot {
  const providerConfig = getAiProviderConfig();
  const imageReadiness = getImageGenerationIntegrationReadiness();

  const textGatewayLive = isOpenRouterLiveExecutionReady(providerConfig);
  const researchProviderLive = isRegistryProviderLive("perplexity_placeholder");
  const imageGenerationLive =
    imageReadiness.generationEnabled && imageReadiness.status === "configured_shape_ok";
  const visionQaLive = isRegistryProviderLive("vision_qa_placeholder");

  const anyLiveProviderEnabled = Object.values(AI_PROVIDER_REGISTRY).some(
    (entry) => entry.enabled && entry.executionMode === "live"
  );

  const orchestratorLiveSafe = !anyLiveProviderEnabled && !textGatewayLive;

  const notes: string[] = [];
  if (textGatewayLive) {
    notes.push("OpenRouter live text gateway is configured.");
  }
  if (imageGenerationLive) {
    notes.push("Image generation env flags indicate live readiness shape.");
  }
  if (!orchestratorLiveSafe) {
    notes.push("Orchestrator must remain preview-only until live proof gates pass.");
  }

  return {
    textGatewayLive,
    researchProviderLive,
    imageGenerationLive,
    visionQaLive,
    anyLiveProviderEnabled,
    orchestratorLiveSafe,
    notes
  };
}

function isRegistryProviderLive(providerKey: string): boolean {
  const entry = AI_PROVIDER_REGISTRY[providerKey];
  return Boolean(entry?.enabled && entry.executionMode === "live");
}

export function assertOrchestratorDisabledSafeInvariant(): {
  ok: boolean;
  violations: string[];
} {
  const snapshot = getAiKillSwitchSnapshot();
  const violations: string[] = [];

  if (snapshot.anyLiveProviderEnabled) {
    violations.push("Registry contains enabled live provider entries.");
  }

  if (!snapshot.orchestratorLiveSafe && !snapshot.textGatewayLive) {
    violations.push("Orchestrator live-safe invariant failed.");
  }

  return { ok: violations.length === 0, violations };
}
