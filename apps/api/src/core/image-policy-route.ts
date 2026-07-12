/**
 * AI Policy image route resolution — capability image_generation / task image_single.
 * Does not create a parallel routing table; extends AI_MODEL_ROUTING_TABLE.
 */

import type {
  AiProviderExecutionPolicy,
  ApprovedAiImageModelId,
  ApprovedAiImageProviderId,
  ImageGenerationRequestInput
} from "@dca-os-v1/shared";
import { APPROVED_AI_IMAGE_MODEL_IDS, APPROVED_AI_IMAGE_PROVIDER_IDS } from "@dca-os-v1/shared";
import {
  IMAGE_GENERATION_COST_USD_CEILING,
  IMAGE_GENERATION_DEFAULTS,
  getImageGenerationProviderConfig
} from "../config/image-generation.config";
import { resolveModelRoute } from "./ai-model-routing-policy.service";

/** Affirmative risk tokens — must not reject approved negative-constraint proof prompts. */
export const IMAGE_POLICY_PROMPT_FORBIDDEN_TOKENS = [
  "doctor",
  "patient",
  "before/after",
  "before and after",
  "injection",
  "syringe",
  "puriva branding",
  "copyrighted character"
] as const;

export type ImagePolicyRouteResolution =
  | { ok: true; policy: AiProviderExecutionPolicy }
  | { ok: false; safeError: string };

export function isAllowlistedImageProvider(provider: string | null | undefined): provider is ApprovedAiImageProviderId {
  if (!provider) return false;
  return (APPROVED_AI_IMAGE_PROVIDER_IDS as readonly string[]).includes(provider);
}

export function isAllowlistedImageModel(model: string | null | undefined): model is ApprovedAiImageModelId {
  if (!model) return false;
  return (APPROVED_AI_IMAGE_MODEL_IDS as readonly string[]).includes(model);
}

export function megapixelsForDimensions(width: number, height: number): number {
  return (width * height) / 1_000_000;
}

export function validateImagePromptPolicy(prompt: string): { ok: true } | { ok: false; safeError: string } {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { ok: false, safeError: "Image prompt is required." };
  }
  const lower = trimmed.toLowerCase();
  for (const token of IMAGE_POLICY_PROMPT_FORBIDDEN_TOKENS) {
    if (lower.includes(token)) {
      return { ok: false, safeError: "Image prompt failed bounded safety policy checks." };
    }
  }
  return { ok: true };
}

export function validateImageGenerationRequestAgainstPolicy(
  request: ImageGenerationRequestInput,
  policy: AiProviderExecutionPolicy
): { ok: true } | { ok: false; safeError: string } {
  const promptCheck = validateImagePromptPolicy(request.prompt);
  if (!promptCheck.ok) return promptCheck;

  if (policy.outputCount !== 1) {
    return { ok: false, safeError: "Image policy outputCount must be exactly 1." };
  }
  if (policy.retryLimit !== 0) {
    return { ok: false, safeError: "Image policy retryLimit must be 0." };
  }
  if (policy.fallbackAllowed) {
    return { ok: false, safeError: "Image policy fallback is disabled for this route." };
  }
  if (policy.maxCostUsd > IMAGE_GENERATION_COST_USD_CEILING + 1e-9) {
    return { ok: false, safeError: "Image policy cost cap exceeds USD 0.10 ceiling." };
  }
  if (!Number.isInteger(request.width) || !Number.isInteger(request.height) || request.width <= 0 || request.height <= 0) {
    return { ok: false, safeError: "Image dimensions must be positive integers." };
  }
  if (request.width > policy.maxWidth || request.height > policy.maxHeight) {
    return { ok: false, safeError: "Image dimensions exceed policy maximum." };
  }
  // Allow 1024×1024 (exactly maxWidth×maxHeight) as the 1MP-class ceiling used by OpenAI gpt-image-1.
  if (request.width * request.height > policy.maxWidth * policy.maxHeight) {
    return { ok: false, safeError: "Image dimensions exceed 1 MP policy maximum." };
  }
  if (request.outputFormat !== "jpeg" && request.outputFormat !== "png") {
    return { ok: false, safeError: "Unsupported image output format." };
  }
  if (request.correlationId.trim().length === 0) {
    return { ok: false, safeError: "correlationId is required." };
  }
  return { ok: true };
}

/**
 * Resolves the owner-approved active image_single route under AI Policy (OpenAI by default).
 * liveExecutionAuthorized is supplied by the layered guard — never inferred from key alone.
 */
export function resolveImageSinglePolicyRoute(input: {
  correlationId: string;
  liveExecutionAuthorized: boolean;
  clientProfile?: string | null;
  contentChannel?: string | null;
}): ImagePolicyRouteResolution {
  const routed = resolveModelRoute({
    orchestratorTaskType: "image_single",
    clientProfile: input.clientProfile ?? "puriva",
    contentChannel: input.contentChannel ?? "website"
  });

  if (routed.blocked || routed.route.taskType !== "image_single") {
    return {
      ok: false,
      safeError: routed.blockedReason ?? "Image generation route is blocked by AI Policy."
    };
  }

  const config = getImageGenerationProviderConfig();
  const provider = (routed.route.provider ?? config.provider ?? IMAGE_GENERATION_DEFAULTS.provider) as string;
  const model = (routed.route.primaryModel ?? config.model ?? IMAGE_GENERATION_DEFAULTS.model) as string;

  if (!isAllowlistedImageProvider(provider)) {
    return { ok: false, safeError: "Unsupported image provider." };
  }
  if (!isAllowlistedImageModel(model)) {
    return { ok: false, safeError: "Unsupported image model." };
  }

  const maxCostUsd = Math.min(
    routed.route.maxCostUsdPerRun,
    config.maxCostUsd,
    IMAGE_GENERATION_COST_USD_CEILING
  );

  if (maxCostUsd > IMAGE_GENERATION_COST_USD_CEILING + 1e-9) {
    return { ok: false, safeError: "Resolved image cost cap exceeds USD 0.10." };
  }

  const retryLimit = routed.route.retryLimit ?? 0;
  const fallbackAllowed = routed.route.fallbackAllowed ?? false;
  if (retryLimit !== 0) {
    return { ok: false, safeError: "Image route retryLimit must be 0." };
  }
  if (fallbackAllowed) {
    return { ok: false, safeError: "Image route fallback must be disabled." };
  }

  const policy: AiProviderExecutionPolicy = {
    taskType: "image_single",
    capability: "image_generation",
    correlationId: input.correlationId,
    provider,
    broker: "direct",
    model,
    maxCostUsd,
    maxProviderRequests: routed.route.maxProviderRequests ?? 1,
    maxGenerationJobs: routed.route.maxGenerationJobs ?? 1,
    retryLimit: 0,
    fallbackAllowed: false,
    liveExecutionAuthorized: input.liveExecutionAuthorized,
    timeoutMs: Math.min(config.timeoutMs, IMAGE_GENERATION_DEFAULTS.timeoutMs),
    outputCount: 1,
    maxMegapixels: routed.route.maxMegapixels ?? IMAGE_GENERATION_DEFAULTS.maxMegapixels,
    maxWidth: IMAGE_GENERATION_DEFAULTS.maxWidth,
    maxHeight: IMAGE_GENERATION_DEFAULTS.maxHeight
  };

  return { ok: true, policy };
}
