/**
 * AI Policy single-image generation orchestration.
 * Workflows call this — never vendor APIs directly. Adapter never calls R2.
 */

import type { ImageGenerationRequestInput, NormalizedImageGenerationResult } from "@dca-os-v1/shared";
import { IMAGE_GENERATION_DEFAULTS } from "../config/image-generation.config";
import type { ImageProviderAdapterResolveOptions } from "./image-provider-adapter.registry";
import {
  assertOneGenerationGuard,
  evaluateImageGenerationLiveAuthorization
} from "./image-generation-guard.service";
import { resolveImageProviderAdapter } from "./image-provider-adapter.registry";
import { resolveImageSinglePolicyRoute, validateImageGenerationRequestAgainstPolicy } from "./image-policy-route";
import { buildImageGenerationLedgerMetadata } from "./image-ledger-attribution.service";

export type GenerateOneImageViaAiPolicyInput = {
  request: ImageGenerationRequestInput;
  clientProfile?: string | null;
  contentChannel?: string | null;
  /** Test-only transport options. */
  adapterOptions?: ImageProviderAdapterResolveOptions;
  /**
   * Test-only: authorize liveExecutionAuthorized without IMAGE_GENERATION_LIVE_CALLS_ALLOWED.
   * Must never be used by production HTTP routes.
   */
  authorizeForFakeTransport?: boolean;
};

export type GenerateOneImageViaAiPolicyResult = {
  result: NormalizedImageGenerationResult;
  ledgerMetadata: ReturnType<typeof buildImageGenerationLedgerMetadata>;
  r2Called: false;
};

function blockedResult(
  correlationId: string,
  safeError: string,
  status: NormalizedImageGenerationResult["status"] = "BLOCKED"
): NormalizedImageGenerationResult {
  return {
    status,
    taskType: "image_single",
    capability: "image_generation",
    provider: IMAGE_GENERATION_DEFAULTS.provider,
    broker: "direct",
    model: IMAGE_GENERATION_DEFAULTS.model,
    correlationId,
    providerRequestId: null,
    providerJobId: null,
    submitRequestCount: 0,
    generationJobCount: 0,
    pollRequestCount: 0,
    resultDownloadCount: 0,
    retryCount: 0,
    fallbackUsed: false,
    liveProviderCalled: false,
    estimatedCostUsd: 0.1,
    actualCostUsd: null,
    outputCount: 0,
    contentType: null,
    byteLength: null,
    width: null,
    height: null,
    sha256: null,
    imageBytes: null,
    providerTemporaryUrlPresent: false,
    safeError,
    ledgerAttribution: {
      capability: "image_generation",
      provider: IMAGE_GENERATION_DEFAULTS.provider,
      broker: "direct",
      model: IMAGE_GENERATION_DEFAULTS.model,
      correlationId,
      providerRequestId: null,
      providerJobId: null,
      width: null,
      height: null,
      outputCount: 0,
      submitRequestCount: 0,
      pollRequestCount: 0,
      downloadCount: 0,
      retryCount: 0,
      fallbackUsed: false,
      estimatedCostUsd: 0.1,
      actualCostUsd: null,
      contentType: null,
      byteLength: null,
      sha256: null,
      artifactPersisted: false
    },
    artifactHandoff: null
  };
}

/**
 * Canonical path: AI Policy → route → ImageProviderAdapter → BFLFluxAdapter.
 * No public HTTP route is registered by this module.
 */
export async function generateOneImageViaAiPolicy(
  input: GenerateOneImageViaAiPolicyInput
): Promise<GenerateOneImageViaAiPolicyResult> {
  const auth = evaluateImageGenerationLiveAuthorization();
  const liveAuthorized = input.authorizeForFakeTransport === true ? true : auth.authorized;

  if (!liveAuthorized && input.authorizeForFakeTransport !== true) {
    const result = blockedResult(input.request.correlationId, auth.reason, auth.readinessLabel === "disabled" ? "SKIPPED" : "BLOCKED");
    return {
      result,
      ledgerMetadata: buildImageGenerationLedgerMetadata(result),
      r2Called: false
    };
  }

  const route = resolveImageSinglePolicyRoute({
    correlationId: input.request.correlationId,
    liveExecutionAuthorized: liveAuthorized,
    clientProfile: input.clientProfile,
    contentChannel: input.contentChannel
  });

  if (!route.ok) {
    const result = blockedResult(input.request.correlationId, route.safeError);
    return { result, ledgerMetadata: buildImageGenerationLedgerMetadata(result), r2Called: false };
  }

  const oneGuard = assertOneGenerationGuard({
    maxProviderRequests: route.policy.maxProviderRequests,
    maxGenerationJobs: route.policy.maxGenerationJobs,
    retryLimit: route.policy.retryLimit,
    fallbackAllowed: route.policy.fallbackAllowed,
    outputCount: route.policy.outputCount
  });
  if (!oneGuard.ok) {
    const result = blockedResult(input.request.correlationId, oneGuard.safeError);
    return { result, ledgerMetadata: buildImageGenerationLedgerMetadata(result), r2Called: false };
  }

  const requestCheck = validateImageGenerationRequestAgainstPolicy(input.request, route.policy);
  if (!requestCheck.ok) {
    const result = blockedResult(input.request.correlationId, requestCheck.safeError);
    return { result, ledgerMetadata: buildImageGenerationLedgerMetadata(result), r2Called: false };
  }

  const adapter = resolveImageProviderAdapter(route.policy.provider, {
    ...input.adapterOptions,
    bypassNetworkLiveEnvForTests: input.authorizeForFakeTransport === true
  });
  if (!adapter) {
    const result = blockedResult(input.request.correlationId, "No image provider adapter registered for resolved provider.");
    return { result, ledgerMetadata: buildImageGenerationLedgerMetadata(result), r2Called: false };
  }

  const result = await adapter.generateOneImage(input.request, {
    ...route.policy,
    liveExecutionAuthorized: true
  });

  return {
    result,
    ledgerMetadata: buildImageGenerationLedgerMetadata(result),
    r2Called: false
  };
}

/** Client-safe projection — never includes bytes, URLs, keys, or storageKey. */
export function toClientSafeImageGenerationResult(result: NormalizedImageGenerationResult): Record<string, unknown> {
  return {
    status: result.status,
    taskType: result.taskType,
    capability: result.capability,
    outputCount: result.outputCount,
    correlationId: result.correlationId,
    liveProviderCalled: result.liveProviderCalled,
    safeError: result.safeError,
    width: result.width,
    height: result.height,
    contentType: result.contentType,
    byteLength: result.byteLength
  };
}
