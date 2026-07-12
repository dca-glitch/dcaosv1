/**
 * OpenAI gpt-image-1 direct image adapter (synchronous generations → b64_json).
 * Never owns R2, workflow, fallback, generation retry, or BFL.
 */

import { createHash } from "node:crypto";
import type {
  AiProviderExecutionPolicy,
  ImageGenerationRequestInput,
  ImageProviderAdapter,
  ImageProviderAdapterReadinessSnapshot,
  NormalizedImageGenerationResult,
  NormalizedImageLedgerAttribution
} from "@dca-os-v1/shared";
import {
  getImageGenerationProviderConfig,
  IMAGE_GENERATION_COST_USD_CEILING,
  IMAGE_GENERATION_DEFAULTS,
  IMAGE_OPENAI_HTTP_CONTRACT,
  readImageGenerationApiKey
} from "../config/image-generation.config";
import { evaluateImageGenerationLiveAuthorization } from "../core/image-generation-guard.service";
import { validateImageGenerationRequestAgainstPolicy } from "../core/image-policy-route";

export type OpenAIFetch = typeof fetch;

export type OpenAIImageAdapterOptions = {
  fetchImpl?: OpenAIFetch;
  /** Test-only: allow generate when policy.liveExecutionAuthorized without env live flag. */
  bypassNetworkLiveEnvForTests?: boolean;
};

type OpenAIImagesResponse = {
  data?: Array<{ b64_json?: unknown; url?: unknown }>;
  id?: unknown;
  created?: unknown;
  error?: unknown;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

export function getSafeOpenAIImageError(status: number): string {
  return `OpenAI image request failed with HTTP ${status}.`;
}

function hostnameAllowed(hostname: string): boolean {
  return (IMAGE_OPENAI_HTTP_CONTRACT.allowedHostnames as readonly string[]).includes(hostname.toLowerCase());
}

function detectImageContentType(bytes: Buffer): "image/png" | "image/jpeg" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return "image/png";
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(JPEG_SIGNATURE)) return "image/jpeg";
  return null;
}

/** Minimal PNG IHDR width/height reader; JPEG SOF0/SOF2 scan. */
export function extractOpenAIImageDimensions(bytes: Buffer): { width: number; height: number } | null {
  const contentType = detectImageContentType(bytes);
  if (contentType === "image/png") {
    if (bytes.length < 24) return null;
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }
  if (contentType === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      const size = bytes.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        const height = bytes.readUInt16BE(offset + 5);
        const width = bytes.readUInt16BE(offset + 7);
        if (width <= 0 || height <= 0) return null;
        return { width, height };
      }
      offset += 2 + size;
    }
  }
  return null;
}

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function resolveOpenAIImageSize(width: number, height: number): string | null {
  const size = `${width}x${height}`;
  if ((IMAGE_OPENAI_HTTP_CONTRACT.allowedSizes as readonly string[]).includes(size)) {
    return size;
  }
  return null;
}

function emptyLedger(
  policy: AiProviderExecutionPolicy,
  counts: {
    submitRequestCount: number;
    pollRequestCount: number;
    downloadCount: number;
    providerRequestId: string | null;
    providerJobId: string | null;
    width: number | null;
    height: number | null;
    contentType: string | null;
    byteLength: number | null;
    sha256: string | null;
  }
): NormalizedImageLedgerAttribution {
  return {
    capability: "image_generation",
    provider: policy.provider,
    broker: "direct",
    model: policy.model,
    correlationId: policy.correlationId,
    providerRequestId: counts.providerRequestId,
    providerJobId: counts.providerJobId,
    width: counts.width,
    height: counts.height,
    outputCount: 1,
    submitRequestCount: counts.submitRequestCount,
    pollRequestCount: counts.pollRequestCount,
    downloadCount: counts.downloadCount,
    retryCount: 0,
    fallbackUsed: false,
    estimatedCostUsd: Math.min(policy.maxCostUsd, IMAGE_GENERATION_DEFAULTS.estimatedCostUsd),
    actualCostUsd: null,
    contentType: counts.contentType,
    byteLength: counts.byteLength,
    sha256: counts.sha256,
    artifactPersisted: false
  };
}

function failResult(
  policy: AiProviderExecutionPolicy,
  safeError: string,
  counts: {
    submitRequestCount: number;
    generationJobCount: number;
    pollRequestCount: number;
    resultDownloadCount: number;
    liveProviderCalled: boolean;
    providerRequestId?: string | null;
    providerJobId?: string | null;
  },
  status: NormalizedImageGenerationResult["status"] = "FAILED"
): NormalizedImageGenerationResult {
  const ledger = emptyLedger(policy, {
    submitRequestCount: counts.submitRequestCount,
    pollRequestCount: counts.pollRequestCount,
    downloadCount: counts.resultDownloadCount,
    providerRequestId: counts.providerRequestId ?? null,
    providerJobId: counts.providerJobId ?? null,
    width: null,
    height: null,
    contentType: null,
    byteLength: null,
    sha256: null
  });
  return {
    status,
    taskType: "image_single",
    capability: "image_generation",
    provider: policy.provider,
    broker: "direct",
    model: policy.model,
    correlationId: policy.correlationId,
    providerRequestId: counts.providerRequestId ?? null,
    providerJobId: counts.providerJobId ?? null,
    submitRequestCount: counts.submitRequestCount,
    generationJobCount: counts.generationJobCount,
    pollRequestCount: counts.pollRequestCount,
    resultDownloadCount: counts.resultDownloadCount,
    retryCount: 0,
    fallbackUsed: false,
    liveProviderCalled: counts.liveProviderCalled,
    estimatedCostUsd: ledger.estimatedCostUsd,
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
    ledgerAttribution: ledger,
    artifactHandoff: null
  };
}

export class OpenAIImageAdapter implements ImageProviderAdapter {
  readonly providerId = "openai" as const;
  readonly supportedModels = ["gpt-image-1"] as const;
  private readonly fetchImpl: OpenAIFetch;

  constructor(private readonly options: OpenAIImageAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getReadinessSnapshot(): ImageProviderAdapterReadinessSnapshot {
    return evaluateImageGenerationLiveAuthorization().snapshot;
  }

  async generateOneImage(
    request: ImageGenerationRequestInput,
    policy: AiProviderExecutionPolicy
  ): Promise<NormalizedImageGenerationResult> {
    const validation = validateImageGenerationRequestAgainstPolicy(request, policy);
    if (!validation.ok) {
      return failResult(
        policy,
        validation.safeError,
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    if (policy.provider !== "openai" || policy.model !== "gpt-image-1" || policy.broker !== "direct") {
      return failResult(
        policy,
        "Policy provider/model/broker mismatch for OpenAIImageAdapter.",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    if (policy.maxCostUsd > IMAGE_GENERATION_COST_USD_CEILING + 1e-9) {
      return failResult(
        policy,
        "OpenAI image cost cap exceeds USD 0.10 ceiling.",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    const size = resolveOpenAIImageSize(request.width, request.height);
    if (!size) {
      return failResult(
        policy,
        "OpenAI gpt-image-1 requires an allowlisted size within the 1 MP policy (1024x1024).",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    if (!policy.liveExecutionAuthorized && !this.options.bypassNetworkLiveEnvForTests) {
      return failResult(
        policy,
        "Live image execution is not authorized.",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "SKIPPED"
      );
    }

    const apiKey = readImageGenerationApiKey();
    if (!apiKey) {
      return failResult(
        policy,
        "Image generation API key is not configured.",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    const config = getImageGenerationProviderConfig();
    let hostOk = false;
    try {
      hostOk = hostnameAllowed(new URL(config.baseUrl).hostname);
    } catch {
      hostOk = false;
    }
    if (!hostOk) {
      return failResult(
        policy,
        "OpenAI base URL hostname is not allowlisted.",
        {
          submitRequestCount: 0,
          generationJobCount: 0,
          pollRequestCount: 0,
          resultDownloadCount: 0,
          liveProviderCalled: false
        },
        "BLOCKED"
      );
    }

    const submitUrl = `${config.baseUrl}${IMAGE_OPENAI_HTTP_CONTRACT.generationsPath}`;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), policy.timeoutMs);

    let submitRequestCount = 0;
    let generationJobCount = 0;
    let pollRequestCount = 0;
    let resultDownloadCount = 0;
    let providerRequestId: string | null = null;
    let providerJobId: string | null = null;
    let liveProviderCalled = false;

    try {
      // Exactly one synchronous generations request — no poll URL, no second download.
      submitRequestCount = 1;
      liveProviderCalled = true;
      const submitResponse = await this.fetchImpl(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: request.prompt,
          size,
          n: IMAGE_OPENAI_HTTP_CONTRACT.n,
          quality: IMAGE_OPENAI_HTTP_CONTRACT.quality,
          output_format: request.outputFormat === "jpeg" ? "jpeg" : "png"
        }),
        signal: abortController.signal
      });

      if (!submitResponse.ok) {
        // Discard body — may echo request fragments.
        await submitResponse.arrayBuffer().catch(() => undefined);
        return failResult(policy, getSafeOpenAIImageError(submitResponse.status), {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const payload = (await submitResponse.json()) as OpenAIImagesResponse;
      const rows = Array.isArray(payload.data) ? payload.data : [];
      if (rows.length !== 1) {
        return failResult(policy, "OpenAI image response did not contain exactly one output.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const row = rows[0];
      if (row.url) {
        return failResult(policy, "OpenAI image URL responses are not accepted; b64_json required.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const b64 = typeof row.b64_json === "string" ? row.b64_json.trim() : "";
      if (!b64) {
        return failResult(policy, "OpenAI image response was missing b64_json.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      generationJobCount = 1;
      resultDownloadCount = 1;
      providerRequestId = typeof payload.id === "string" ? payload.id : policy.correlationId;
      providerJobId = providerRequestId;

      let bytes: Buffer;
      try {
        bytes = Buffer.from(b64, "base64");
      } catch {
        return failResult(policy, "OpenAI image b64_json could not be decoded.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      if (!bytes.length || bytes.length > IMAGE_GENERATION_DEFAULTS.maxDownloadBytes) {
        return failResult(policy, "OpenAI image bytes failed size validation.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const headText = bytes.subarray(0, Math.min(64, bytes.length)).toString("utf8").toLowerCase();
      if (headText.includes("<!doctype") || headText.includes("<html") || headText.trimStart().startsWith("{")) {
        return failResult(policy, "OpenAI image payload looked like HTML/JSON error content.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const detectedType = detectImageContentType(bytes);
      if (!detectedType) {
        return failResult(policy, "OpenAI download content type was not a supported image.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const dimensions = extractOpenAIImageDimensions(bytes);
      if (!dimensions) {
        return failResult(policy, "Unable to read image dimensions from OpenAI bytes.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      if (
        dimensions.width !== request.width ||
        dimensions.height !== request.height ||
        dimensions.width * dimensions.height > policy.maxWidth * policy.maxHeight
      ) {
        return failResult(policy, "Downloaded image dimensions failed policy validation.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const digest = sha256Hex(bytes);
      const ledger = emptyLedger(policy, {
        submitRequestCount,
        pollRequestCount,
        downloadCount: resultDownloadCount,
        providerRequestId,
        providerJobId,
        width: dimensions.width,
        height: dimensions.height,
        contentType: detectedType,
        byteLength: bytes.length,
        sha256: digest
      });

      return {
        status: "COMPLETED",
        taskType: "image_single",
        capability: "image_generation",
        provider: policy.provider,
        broker: "direct",
        model: policy.model,
        correlationId: policy.correlationId,
        providerRequestId,
        providerJobId,
        submitRequestCount,
        generationJobCount,
        pollRequestCount,
        resultDownloadCount,
        retryCount: 0,
        fallbackUsed: false,
        liveProviderCalled,
        estimatedCostUsd: ledger.estimatedCostUsd,
        actualCostUsd: null,
        outputCount: 1,
        contentType: detectedType,
        byteLength: bytes.length,
        width: dimensions.width,
        height: dimensions.height,
        sha256: digest,
        imageBytes: bytes,
        providerTemporaryUrlPresent: false,
        safeError: null,
        ledgerAttribution: ledger,
        artifactHandoff: {
          ready: true,
          contentType: detectedType,
          byteLength: bytes.length,
          sha256: digest,
          width: dimensions.width,
          height: dimensions.height,
          internalByteRef: "inline_buffer",
          publicUrl: null,
          storageKey: null,
          r2Called: false
        }
      };
    } catch {
      return failResult(policy, "OpenAI image request failed safely.", {
        submitRequestCount,
        generationJobCount,
        pollRequestCount,
        resultDownloadCount,
        liveProviderCalled,
        providerRequestId,
        providerJobId
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function createOpenAIImageAdapter(options?: OpenAIImageAdapterOptions): OpenAIImageAdapter {
  return new OpenAIImageAdapter(options);
}
