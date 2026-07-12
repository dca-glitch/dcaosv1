/**
 * Image generation ledger metadata builder — compatible with AiBudgetLedgerEntry.metadata JSON.
 * No Prisma migration in this block.
 */

import type { NormalizedImageGenerationResult } from "@dca-os-v1/shared";

export type ImageGenerationLedgerMetadata = {
  modality: "image";
  capability: "image_generation";
  taskType: "image_single";
  provider: string;
  broker: "direct";
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
  retryCount: 0;
  fallbackUsed: false;
  estimatedCostUsd: number;
  actualCostUsd: null;
  contentType: string | null;
  byteLength: number | null;
  sha256: string | null;
  artifactPersisted: false;
  liveProviderCalled: boolean;
  ledgerStatus: "COMPLETED" | "FAILED" | "BLOCKED" | "SKIPPED";
  safeError: string | null;
};

export function buildImageGenerationLedgerMetadata(
  result: NormalizedImageGenerationResult
): ImageGenerationLedgerMetadata {
  return {
    modality: "image",
    capability: "image_generation",
    taskType: "image_single",
    provider: result.provider,
    broker: "direct",
    model: result.model,
    correlationId: result.correlationId,
    providerRequestId: result.providerRequestId,
    providerJobId: result.providerJobId,
    width: result.width,
    height: result.height,
    outputCount: result.outputCount,
    submitRequestCount: result.submitRequestCount,
    pollRequestCount: result.pollRequestCount,
    downloadCount: result.resultDownloadCount,
    retryCount: 0,
    fallbackUsed: false,
    estimatedCostUsd: result.estimatedCostUsd,
    actualCostUsd: null,
    contentType: result.contentType,
    byteLength: result.byteLength,
    sha256: result.sha256,
    artifactPersisted: false,
    liveProviderCalled: result.liveProviderCalled,
    ledgerStatus: result.status,
    safeError: result.safeError
  };
}
