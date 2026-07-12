/**
 * BFL FLUX.2 Pro direct image adapter (async submit → poll → one download).
 * Never owns R2, workflow, fallback, or generation retry.
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
  IMAGE_BFL_HTTP_CONTRACT,
  IMAGE_GENERATION_DEFAULTS,
  readImageGenerationApiKey
} from "../config/image-generation.config";
import { evaluateImageGenerationLiveAuthorization } from "../core/image-generation-guard.service";
import { megapixelsForDimensions, validateImageGenerationRequestAgainstPolicy } from "../core/image-policy-route";

export type BflFetch = typeof fetch;

export type BflFluxAdapterOptions = {
  fetchImpl?: BflFetch;
  /** Test-only: skip wall-clock sleep between polls. */
  sleepImpl?: (ms: number) => Promise<void>;
  /** Test-only: allow generate when policy.liveExecutionAuthorized without env live flag. */
  bypassNetworkLiveEnvForTests?: boolean;
};

type BflSubmitResponse = {
  id?: unknown;
  polling_url?: unknown;
};

type BflPollResponse = {
  status?: unknown;
  result?: {
    sample?: unknown;
  };
  error?: unknown;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getSafeBflError(status: number): string {
  return `BFL image request failed with HTTP ${status}.`;
}

function hostnameAllowedForSubmit(hostname: string): boolean {
  return (IMAGE_BFL_HTTP_CONTRACT.allowedSubmitHostnames as readonly string[]).includes(hostname);
}

function hostnameAllowedForPollOrDownload(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "api.bfl.ai") return true;
  return IMAGE_BFL_HTTP_CONTRACT.allowedPollHostnameSuffixes.some((suffix) => {
    if (suffix.startsWith(".")) {
      return lower.endsWith(suffix) || lower === suffix.slice(1);
    }
    return lower === suffix;
  });
}

export function assertSafeBflHttpsUrl(rawUrl: string, kind: "poll" | "download"): { ok: true; url: URL } | { ok: false; safeError: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, safeError: `Invalid BFL ${kind} URL.` };
  }
  if (url.protocol !== "https:") {
    return { ok: false, safeError: `BFL ${kind} URL must use HTTPS.` };
  }
  if (!hostnameAllowedForPollOrDownload(url.hostname)) {
    return { ok: false, safeError: `BFL ${kind} hostname is not allowlisted.` };
  }
  return { ok: true, url };
}

function detectImageContentType(bytes: Buffer): "image/png" | "image/jpeg" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return "image/png";
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(JPEG_SIGNATURE)) return "image/jpeg";
  return null;
}

/** Minimal PNG IHDR width/height reader; JPEG SOF0/SOF2 scan. */
export function extractImageDimensions(bytes: Buffer): { width: number; height: number } | null {
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
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const size = bytes.readUInt16BE(offset + 2);
      if (size < 2) break;
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

export class BFLFluxAdapter implements ImageProviderAdapter {
  readonly providerId = "bfl" as const;
  readonly supportedModels = ["flux-2-pro"] as const;
  private readonly fetchImpl: BflFetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;

  constructor(private readonly options: BflFluxAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleepImpl = options.sleepImpl ?? defaultSleep;
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
      return failResult(policy, validation.safeError, {
        submitRequestCount: 0,
        generationJobCount: 0,
        pollRequestCount: 0,
        resultDownloadCount: 0,
        liveProviderCalled: false
      }, "BLOCKED");
    }

    if (policy.provider !== "bfl" || policy.model !== "flux-2-pro" || policy.broker !== "direct") {
      return failResult(policy, "Policy provider/model/broker mismatch for BFLFluxAdapter.", {
        submitRequestCount: 0,
        generationJobCount: 0,
        pollRequestCount: 0,
        resultDownloadCount: 0,
        liveProviderCalled: false
      }, "BLOCKED");
    }

    if (!policy.liveExecutionAuthorized && !this.options.bypassNetworkLiveEnvForTests) {
      return failResult(policy, "Live image execution is not authorized.", {
        submitRequestCount: 0,
        generationJobCount: 0,
        pollRequestCount: 0,
        resultDownloadCount: 0,
        liveProviderCalled: false
      }, "SKIPPED");
    }

    const apiKey = readImageGenerationApiKey();
    if (!apiKey) {
      return failResult(policy, "Image generation API key is not configured.", {
        submitRequestCount: 0,
        generationJobCount: 0,
        pollRequestCount: 0,
        resultDownloadCount: 0,
        liveProviderCalled: false
      }, "BLOCKED");
    }

    const config = getImageGenerationProviderConfig();
    let submitHostOk = false;
    try {
      const submitHost = new URL(config.baseUrl).hostname;
      submitHostOk = hostnameAllowedForSubmit(submitHost);
    } catch {
      submitHostOk = false;
    }
    if (!submitHostOk) {
      return failResult(policy, "BFL base URL hostname is not allowlisted.", {
        submitRequestCount: 0,
        generationJobCount: 0,
        pollRequestCount: 0,
        resultDownloadCount: 0,
        liveProviderCalled: false
      }, "BLOCKED");
    }

    const submitUrl = `${config.baseUrl}${IMAGE_GENERATION_DEFAULTS.submitPath}`;
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
      // Exactly one submit — no generation retry loop.
      submitRequestCount = 1;
      liveProviderCalled = true;
      const submitResponse = await this.fetchImpl(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-key": apiKey
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width,
          height: request.height,
          output_format: request.outputFormat === "jpeg" ? "jpeg" : "png"
        }),
        signal: abortController.signal
      });

      if (!submitResponse.ok) {
        return failResult(policy, getSafeBflError(submitResponse.status), {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const submitPayload = (await submitResponse.json()) as BflSubmitResponse;
      const jobId = typeof submitPayload.id === "string" ? submitPayload.id : null;
      const pollingUrlRaw = typeof submitPayload.polling_url === "string" ? submitPayload.polling_url : null;
      if (!jobId || !pollingUrlRaw) {
        return failResult(policy, "BFL submit response was incomplete.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId: jobId,
          providerJobId: jobId
        });
      }

      providerRequestId = jobId;
      providerJobId = jobId;
      generationJobCount = 1;

      const pollingUrlCheck = assertSafeBflHttpsUrl(pollingUrlRaw, "poll");
      if (!pollingUrlCheck.ok) {
        return failResult(policy, pollingUrlCheck.safeError, {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      let sampleUrl: string | null = null;
      const maxPolls = Math.min(config.maxPollAttempts, IMAGE_GENERATION_DEFAULTS.maxPollAttempts);
      const pollInterval = Math.min(config.pollIntervalMs, IMAGE_GENERATION_DEFAULTS.pollIntervalMs);
      const deadline = Date.now() + policy.timeoutMs;

      for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        if (Date.now() > deadline) {
          return failResult(policy, "BFL polling timed out.", {
            submitRequestCount,
            generationJobCount,
            pollRequestCount,
            resultDownloadCount,
            liveProviderCalled,
            providerRequestId,
            providerJobId
          });
        }

        if (attempt > 0) {
          await this.sleepImpl(pollInterval);
        }

        pollRequestCount += 1;
        const pollResponse = await this.fetchImpl(pollingUrlCheck.url.toString(), {
          method: "GET",
          headers: { "x-key": apiKey },
          signal: abortController.signal
        });

        if (!pollResponse.ok) {
          return failResult(policy, getSafeBflError(pollResponse.status), {
            submitRequestCount,
            generationJobCount,
            pollRequestCount,
            resultDownloadCount,
            liveProviderCalled,
            providerRequestId,
            providerJobId
          });
        }

        const pollPayload = (await pollResponse.json()) as BflPollResponse;
        const status = typeof pollPayload.status === "string" ? pollPayload.status.toLowerCase() : "";

        if (status === "pending" || status === "processing" || status === "queued" || status === "task not found") {
          // Read-only poll of the same job — not a generation retry.
          continue;
        }

        if (status === "error" || status === "failed") {
          return failResult(policy, "BFL generation failed.", {
            submitRequestCount,
            generationJobCount,
            pollRequestCount,
            resultDownloadCount,
            liveProviderCalled,
            providerRequestId,
            providerJobId
          });
        }

        if (status === "ready" || status === "completed" || status === "success") {
          const sample = pollPayload.result?.sample;
          if (typeof sample !== "string" || !sample) {
            return failResult(policy, "BFL result did not include an image sample.", {
              submitRequestCount,
              generationJobCount,
              pollRequestCount,
              resultDownloadCount,
              liveProviderCalled,
              providerRequestId,
              providerJobId
            });
          }
          sampleUrl = sample;
          break;
        }

        return failResult(policy, "BFL returned an unrecognized poll status.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      if (!sampleUrl) {
        return failResult(policy, "BFL polling exhausted without a result.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const downloadUrlCheck = assertSafeBflHttpsUrl(sampleUrl, "download");
      if (!downloadUrlCheck.ok) {
        return failResult(policy, downloadUrlCheck.safeError, {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      resultDownloadCount = 1;
      const downloadResponse = await this.fetchImpl(downloadUrlCheck.url.toString(), {
        method: "GET",
        signal: abortController.signal,
        redirect: "error"
      });

      if (!downloadResponse.ok) {
        return failResult(policy, getSafeBflError(downloadResponse.status), {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const arrayBuffer = await downloadResponse.arrayBuffer();
      const bytes = Buffer.from(arrayBuffer);
      if (bytes.length === 0) {
        return failResult(policy, "BFL downloaded image was empty.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }
      if (bytes.length > IMAGE_GENERATION_DEFAULTS.maxDownloadBytes) {
        return failResult(policy, "BFL downloaded image exceeded size limit.", {
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
      if (headText.includes("<!doctype html") || headText.includes("<html") || headText.trimStart().startsWith("{")) {
        return failResult(policy, "BFL download did not return image bytes.", {
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
        return failResult(policy, "BFL download content type was not a supported image.", {
          submitRequestCount,
          generationJobCount,
          pollRequestCount,
          resultDownloadCount,
          liveProviderCalled,
          providerRequestId,
          providerJobId
        });
      }

      const dimensions = extractImageDimensions(bytes);
      if (!dimensions) {
        return failResult(policy, "Unable to read image dimensions from downloaded bytes.", {
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
        megapixelsForDimensions(dimensions.width, dimensions.height) > policy.maxMegapixels + 1e-9
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
        providerTemporaryUrlPresent: true,
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
    } catch (error) {
      const errorName = (error as { name?: string }).name;
      return failResult(policy, errorName === "AbortError" ? "BFL image request timed out." : "BFL image request could not be completed.", {
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

export function createBflFluxAdapter(options?: BflFluxAdapterOptions): BFLFluxAdapter {
  return new BFLFluxAdapter(options);
}
