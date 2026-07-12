/**
 * Layered live authorization for image generation.
 * Default remains no-live. API key alone never authorizes a provider call.
 */

import type { ImageProviderAdapterReadinessSnapshot } from "@dca-os-v1/shared";
import {
  getImageGenerationIntegrationReadiness,
  getImageGenerationProviderConfig,
  IMAGE_GENERATION_DEFAULTS,
  IMAGE_GENERATION_COST_USD_CEILING
} from "../config/image-generation.config";
import { isAllowlistedImageModel, isAllowlistedImageProvider } from "./image-policy-route";
import { resolveModelRoute } from "./ai-model-routing-policy.service";

/**
 * Foundation variant-set path remains hard no-live (G323).
 * Live single-image path uses layered authorization below — do not flip this const to true.
 */
export const IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED = false as const;

export type ImageLiveAuthorizationResult = {
  authorized: boolean;
  reason: string;
  readinessLabel: ImageProviderAdapterReadinessSnapshot["readinessLabel"];
  snapshot: ImageProviderAdapterReadinessSnapshot;
};

function buildSnapshot(
  liveAuthorized: boolean,
  readinessLabel: ImageProviderAdapterReadinessSnapshot["readinessLabel"]
): ImageProviderAdapterReadinessSnapshot {
  const config = getImageGenerationProviderConfig();
  const readiness = getImageGenerationIntegrationReadiness();
  return {
    provider: config.provider ?? IMAGE_GENERATION_DEFAULTS.provider,
    model: config.model ?? IMAGE_GENERATION_DEFAULTS.model,
    keyPresent: config.hasApiKey,
    configured: readiness.status === "configured_shape_ok",
    enabled: config.generationEnabled,
    liveAuthorized,
    baseHostname: config.baseHostname,
    costCapUsd: Math.min(config.maxCostUsd, IMAGE_GENERATION_COST_USD_CEILING),
    timeoutMs: config.timeoutMs,
    maxPollAttempts: config.maxPollAttempts,
    pollIntervalMs: config.pollIntervalMs,
    readinessLabel
  };
}

/**
 * All layers must pass. Foundation const remains false and
 * IMAGE_GENERATION_LIVE_CALLS_ALLOWED must be explicitly true for live authorization.
 */
export function evaluateImageGenerationLiveAuthorization(): ImageLiveAuthorizationResult {
  const config = getImageGenerationProviderConfig();
  const readiness = getImageGenerationIntegrationReadiness();

  if (!config.generationEnabled) {
    return {
      authorized: false,
      reason: "IMAGE_GENERATION_ENABLED is not true.",
      readinessLabel: "disabled",
      snapshot: buildSnapshot(false, "disabled")
    };
  }

  if (readiness.status !== "configured_shape_ok") {
    return {
      authorized: false,
      reason: `Image generation config incomplete: ${readiness.missingKeys.join(", ") || readiness.status}.`,
      readinessLabel: "missing_config",
      snapshot: buildSnapshot(false, "missing_config")
    };
  }

  if (!isAllowlistedImageProvider(config.provider)) {
    return {
      authorized: false,
      reason: "Image provider is not allowlisted.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  if (!isAllowlistedImageModel(config.model)) {
    return {
      authorized: false,
      reason: "Image model is not allowlisted.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  const routed = resolveModelRoute({
    orchestratorTaskType: "image_single",
    clientProfile: "puriva",
    contentChannel: "website"
  });
  if (routed.blocked || routed.route.taskType !== "image_single" || !routed.route.allowLive) {
    return {
      authorized: false,
      reason: routed.blockedReason ?? "AI Policy does not authorize live image execution.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  if ((routed.route.retryLimit ?? 0) !== 0 || (routed.route.fallbackAllowed ?? false)) {
    return {
      authorized: false,
      reason: "AI Policy image route must enforce retry=0 and fallback=false.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  if (routed.route.maxCostUsdPerRun > IMAGE_GENERATION_COST_USD_CEILING + 1e-9) {
    return {
      authorized: false,
      reason: "AI Policy image cost cap exceeds USD 0.10.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  // Explicit live opt-in — key + enabled alone never authorize.
  if (!config.liveCallsAllowedEnv) {
    return {
      authorized: false,
      reason: "IMAGE_GENERATION_LIVE_CALLS_ALLOWED is not true.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  // Foundation hard invariant remains false; live single-image path is separately gated above.
  // This check documents that the legacy foundation module must not be flipped.
  if (IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED !== false) {
    return {
      authorized: false,
      reason: "Foundation live-calls invariant violated.",
      readinessLabel: "configured_not_authorized",
      snapshot: buildSnapshot(false, "configured_not_authorized")
    };
  }

  return {
    authorized: true,
    reason: "All image live-authorization layers passed.",
    readinessLabel: "live_authorized",
    snapshot: buildSnapshot(true, "live_authorized")
  };
}

export function assertOneGenerationGuard(input: {
  maxProviderRequests: number;
  maxGenerationJobs: number;
  retryLimit: number;
  fallbackAllowed: boolean;
  outputCount: number;
}): { ok: true } | { ok: false; safeError: string } {
  if (input.maxProviderRequests !== 1) {
    return { ok: false, safeError: "maxProviderRequests must be exactly 1." };
  }
  if (input.maxGenerationJobs !== 1) {
    return { ok: false, safeError: "maxGenerationJobs must be exactly 1." };
  }
  if (input.retryLimit !== 0) {
    return { ok: false, safeError: "retryLimit must be 0." };
  }
  if (input.fallbackAllowed) {
    return { ok: false, safeError: "fallbackAllowed must be false." };
  }
  if (input.outputCount !== 1) {
    return { ok: false, safeError: "outputCount must be exactly 1." };
  }
  return { ok: true };
}
