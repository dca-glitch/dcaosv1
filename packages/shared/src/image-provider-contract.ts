/**
 * Shared image-provider execution contracts under AI Policy.
 * Modality-specific: not a universal text/image/audio mega-method.
 */

export const AI_IMAGE_PROVIDER_CONTRACT_VERSION = "AI_IMAGE_PROVIDER_CONTRACT_V1" as const;

export const APPROVED_AI_IMAGE_MODEL_IDS = ["gpt-image-1", "flux-2-pro"] as const;
export type ApprovedAiImageModelId = (typeof APPROVED_AI_IMAGE_MODEL_IDS)[number];

export const APPROVED_AI_IMAGE_PROVIDER_IDS = ["openai", "bfl"] as const;
export type ApprovedAiImageProviderId = (typeof APPROVED_AI_IMAGE_PROVIDER_IDS)[number];

export type AiImageBroker = "direct";

export type AiImageCapability = "image_generation";

export type AiImageTaskType = "image_single";

export type AiImageOutputFormat = "jpeg" | "png";

/** Shared execution policy metadata resolved by AI Policy for one image generation. */
export type AiProviderExecutionPolicy = {
  taskType: AiImageTaskType;
  capability: AiImageCapability;
  correlationId: string;
  provider: ApprovedAiImageProviderId;
  broker: AiImageBroker;
  model: ApprovedAiImageModelId;
  maxCostUsd: number;
  maxProviderRequests: number;
  maxGenerationJobs: number;
  retryLimit: number;
  fallbackAllowed: false;
  liveExecutionAuthorized: boolean;
  timeoutMs: number;
  outputCount: 1;
  maxMegapixels: number;
  maxWidth: number;
  maxHeight: number;
};

export type ImageGenerationRequestInput = {
  prompt: string;
  width: number;
  height: number;
  outputFormat: AiImageOutputFormat;
  correlationId: string;
  /** Optional non-secret operator metadata only. */
  safeMetadata?: Record<string, string | number | boolean | null>;
};

export type ImageProviderAdapterReadinessSnapshot = {
  provider: string;
  model: string | null;
  keyPresent: boolean;
  configured: boolean;
  enabled: boolean;
  liveAuthorized: boolean;
  baseHostname: string;
  costCapUsd: number;
  timeoutMs: number;
  maxPollAttempts: number;
  pollIntervalMs: number;
  readinessLabel: "disabled" | "missing_config" | "configured_not_authorized" | "live_authorized";
};

export type NormalizedImageGenerationStatus = "COMPLETED" | "FAILED" | "BLOCKED" | "SKIPPED";

export type NormalizedImageLedgerAttribution = {
  capability: AiImageCapability;
  provider: string;
  broker: AiImageBroker;
  model: string;
  correlationId: string;
  providerRequestId: string | null;
  providerJobId: string | null;
  width: number | null;
  height: number | null;
  outputCount: number;
  submitRequestCount: number;
  pollRequestCount: number;
  downloadCount: number;
  retryCount: number;
  fallbackUsed: boolean;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  contentType: string | null;
  byteLength: number | null;
  sha256: string | null;
  artifactPersisted: false;
};

/** Optional handoff for a future orchestration layer — adapter never calls R2. */
export type ImageArtifactPersistenceHandoff = {
  ready: boolean;
  contentType: string;
  byteLength: number;
  sha256: string;
  width: number;
  height: number;
  /** Opaque internal reference only; never a public URL. */
  internalByteRef: "inline_buffer";
  publicUrl: null;
  storageKey: null;
  r2Called: false;
};

export type NormalizedImageGenerationResult = {
  status: NormalizedImageGenerationStatus;
  taskType: AiImageTaskType;
  capability: AiImageCapability;
  provider: string;
  broker: AiImageBroker;
  model: string;
  correlationId: string;
  providerRequestId: string | null;
  providerJobId: string | null;
  submitRequestCount: number;
  generationJobCount: number;
  pollRequestCount: number;
  resultDownloadCount: number;
  retryCount: 0;
  fallbackUsed: false;
  liveProviderCalled: boolean;
  estimatedCostUsd: number;
  actualCostUsd: null;
  outputCount: number;
  contentType: string | null;
  byteLength: number | null;
  width: number | null;
  height: number | null;
  sha256: string | null;
  /** Present only on successful in-process results; never serialized to clients. */
  imageBytes: Buffer | null;
  providerTemporaryUrlPresent: boolean;
  safeError: string | null;
  ledgerAttribution: NormalizedImageLedgerAttribution;
  artifactHandoff: ImageArtifactPersistenceHandoff | null;
};

export interface ImageProviderAdapter {
  readonly providerId: ApprovedAiImageProviderId;
  readonly supportedModels: readonly ApprovedAiImageModelId[];
  getReadinessSnapshot(): ImageProviderAdapterReadinessSnapshot;
  generateOneImage(
    request: ImageGenerationRequestInput,
    policy: AiProviderExecutionPolicy
  ): Promise<NormalizedImageGenerationResult>;
}
