import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { AiProviderExecutionPolicy } from "@dca-os-v1/shared";
import {
  buildImageGenerationNoLiveConfigSnapshot,
  IMAGE_GENERATION_DEFAULTS,
  IMAGE_GENERATION_ENV_KEYS
} from "../config/image-generation.config";
import { resolveModelRoute, isApprovedImageModelId } from "./ai-model-routing-policy.service";
import {
  assertOneGenerationGuard,
  evaluateImageGenerationLiveAuthorization,
  IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED
} from "./image-generation-guard.service";
import { resolveImageSinglePolicyRoute, validateImageGenerationRequestAgainstPolicy } from "./image-policy-route";
import { generateOneImageViaAiPolicy, toClientSafeImageGenerationResult } from "./image-generation-ai-policy.service";
import { buildImageGenerationLedgerMetadata } from "./image-ledger-attribution.service";
import { createOpenAIImageAdapter, resolveOpenAIImageSize } from "../services/openai-image.adapter";
import { createFakeOpenAITransport } from "../services/openai-image.fake-transport";
import { createBflFluxAdapter } from "../services/bfl-flux.adapter";
import { resolveImageProviderAdapter } from "./image-provider-adapter.registry";

const ORIGINAL_ENV = { ...process.env };

function resetEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("IMAGE_GENERATION_")) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (key.startsWith("IMAGE_GENERATION_")) {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  resetEnv();
});

function openaiPolicy(correlationId: string, live = true): AiProviderExecutionPolicy {
  return {
    taskType: "image_single",
    capability: "image_generation",
    correlationId,
    provider: "openai",
    broker: "direct",
    model: "gpt-image-1",
    maxCostUsd: 0.1,
    maxProviderRequests: 1,
    maxGenerationJobs: 1,
    retryLimit: 0,
    fallbackAllowed: false,
    liveExecutionAuthorized: live,
    timeoutMs: 120_000,
    outputCount: 1,
    maxMegapixels: 1,
    maxWidth: 1024,
    maxHeight: 1024
  };
}

describe("AI Policy image_single active route (OpenAI)", () => {
  it("resolves provider=openai broker=direct model=gpt-image-1 cost=0.10 retry=0 fallback=false output=1", () => {
    const routed = resolveModelRoute({
      orchestratorTaskType: "image_single",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    assert.equal(routed.blocked, false);
    assert.equal(routed.route.taskType, "image_single");
    assert.equal(routed.route.gateway, "openai");
    assert.equal(routed.route.provider, "openai");
    assert.equal(routed.route.broker, "direct");
    assert.equal(routed.route.primaryModel, "gpt-image-1");
    assert.equal(routed.route.maxCostUsdPerRun, 0.1);
    assert.equal(routed.route.retryLimit, 0);
    assert.equal(routed.route.fallbackAllowed, false);
    assert.equal(routed.route.outputCount, 1);
    assert.equal(routed.route.maxMegapixels, 1);
    assert.equal(isApprovedImageModelId("gpt-image-1"), true);
    assert.equal(isApprovedImageModelId("flux-2-pro"), true);
  });

  it("defaults snapshot is openai / gpt-image-1 / api.openai.com", () => {
    const snapshot = buildImageGenerationNoLiveConfigSnapshot();
    assert.equal(snapshot.defaults.provider, "openai");
    assert.equal(snapshot.defaults.model, "gpt-image-1");
    assert.equal(snapshot.defaults.baseHostname, "api.openai.com");
    assert.equal(IMAGE_GENERATION_DEFAULTS.provider, "openai");
  });
});

describe("image generation live authorization (OpenAI active)", () => {
  it("keeps foundation live-calls constant false", () => {
    assert.equal(IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED, false);
  });

  it("API key alone does not authorize live calls", () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai";
    process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    delete process.env.IMAGE_GENERATION_LIVE_CALLS_ALLOWED;
    const auth = evaluateImageGenerationLiveAuthorization();
    assert.equal(auth.authorized, false);
    assert.equal(auth.snapshot.keyPresent, true);
    assert.equal(auth.snapshot.liveAuthorized, false);
  });

  it("one-generation guard rejects retry/fallback/multi-output", () => {
    assert.equal(
      assertOneGenerationGuard({
        maxProviderRequests: 1,
        maxGenerationJobs: 1,
        retryLimit: 1,
        fallbackAllowed: false,
        outputCount: 1
      }).ok,
      false
    );
    assert.equal(
      assertOneGenerationGuard({
        maxProviderRequests: 1,
        maxGenerationJobs: 1,
        retryLimit: 0,
        fallbackAllowed: true,
        outputCount: 1
      }).ok,
      false
    );
    assert.equal(
      assertOneGenerationGuard({
        maxProviderRequests: 1,
        maxGenerationJobs: 1,
        retryLimit: 0,
        fallbackAllowed: false,
        outputCount: 2
      }).ok,
      false
    );
  });

  it("rejects over-cap cost and oversized dimensions", () => {
    const route = resolveImageSinglePolicyRoute({
      correlationId: "c1",
      liveExecutionAuthorized: false
    });
    assert.equal(route.ok, true);
    if (!route.ok) return;

    assert.equal(
      validateImageGenerationRequestAgainstPolicy(
        {
          prompt: "Minimal abstract wellness composition soft shapes.",
          width: 1024,
          height: 1024,
          outputFormat: "png",
          correlationId: "c1"
        },
        { ...route.policy, maxCostUsd: 0.5 }
      ).ok,
      false
    );

    assert.equal(
      validateImageGenerationRequestAgainstPolicy(
        {
          prompt: "Minimal abstract wellness composition soft shapes.",
          width: 2000,
          height: 2000,
          outputFormat: "png",
          correlationId: "c1"
        },
        route.policy
      ).ok,
      false
    );
  });
});

describe("OpenAIImageAdapter fake transport", () => {
  it("completes one synchronous generation with validated bytes", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai";
    process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.openai.com/v1";

    const { fetchImpl, stats, imageBytes } = createFakeOpenAITransport({ width: 1024, height: 1024 });
    const outcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl },
      request: {
        prompt:
          "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting, no people, no text, no logos, no medical equipment.",
        width: 1024,
        height: 1024,
        outputFormat: "png",
        correlationId: "DCA-IMG-OAI-001"
      }
    });

    assert.equal(outcome.r2Called, false);
    assert.equal(stats.submitCount, 1);
    assert.equal(outcome.result.status, "COMPLETED");
    assert.equal(outcome.result.provider, "openai");
    assert.equal(outcome.result.model, "gpt-image-1");
    assert.equal(outcome.result.broker, "direct");
    assert.equal(outcome.result.submitRequestCount, 1);
    assert.equal(outcome.result.generationJobCount, 1);
    assert.equal(outcome.result.pollRequestCount, 0);
    assert.equal(outcome.result.resultDownloadCount, 1);
    assert.equal(outcome.result.retryCount, 0);
    assert.equal(outcome.result.fallbackUsed, false);
    assert.equal(outcome.result.outputCount, 1);
    assert.equal(outcome.result.liveProviderCalled, true);
    assert.equal(outcome.result.width, 1024);
    assert.equal(outcome.result.height, 1024);
    assert.equal(outcome.result.byteLength, imageBytes.length);
    assert.ok(outcome.result.sha256);
    assert.equal(outcome.result.actualCostUsd, null);
    assert.ok(outcome.result.estimatedCostUsd <= 0.1);
    assert.equal(outcome.result.artifactHandoff?.r2Called, false);
    assert.equal(stats.lastBody?.quality, "low");
    assert.equal(stats.lastBody?.n, 1);
    assert.equal(stats.lastBody?.size, "1024x1024");

    const ledger = buildImageGenerationLedgerMetadata(outcome.result);
    assert.equal(ledger.modality, "image");
    assert.equal(ledger.provider, "openai");
    assert.equal(ledger.model, "gpt-image-1");
    assert.equal(ledger.retryCount, 0);
    assert.equal(ledger.fallbackUsed, false);

    const clientSafe = JSON.stringify(toClientSafeImageGenerationResult(outcome.result));
    assert.equal(clientSafe.includes("test-key-not-real"), false);
    assert.equal(clientSafe.includes("Bearer"), false);
    assert.equal(clientSafe.includes("b64_json"), false);
  });

  it("rejects URL-only and multi-output responses without retry", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai";
    process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.openai.com/v1";

    const urlTransport = createFakeOpenAITransport({ returnUrl: true });
    const urlOutcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl: urlTransport.fetchImpl },
      request: {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 1024,
        height: 1024,
        outputFormat: "png",
        correlationId: "DCA-IMG-OAI-URL"
      }
    });
    assert.equal(urlOutcome.result.status, "FAILED");
    assert.equal(urlOutcome.result.retryCount, 0);
    assert.equal(urlOutcome.result.fallbackUsed, false);
    assert.equal(urlTransport.stats.submitCount, 1);

    const multi = createFakeOpenAITransport({ multipleOutputs: true });
    const multiOutcome = await createOpenAIImageAdapter({
      fetchImpl: multi.fetchImpl,
      bypassNetworkLiveEnvForTests: true
    }).generateOneImage(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 1024,
        height: 1024,
        outputFormat: "png",
        correlationId: "DCA-IMG-OAI-MULTI"
      },
      openaiPolicy("DCA-IMG-OAI-MULTI", true)
    );
    assert.equal(multiOutcome.status, "FAILED");
    assert.equal(multi.stats.submitCount, 1);
  });

  it("terminal HTTP failure does not fallback or retry", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai";
    process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.openai.com/v1";

    const { fetchImpl, stats } = createFakeOpenAITransport({ failSubmit: true });
    const outcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl },
      request: {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 1024,
        height: 1024,
        outputFormat: "png",
        correlationId: "DCA-IMG-OAI-FAIL"
      }
    });
    assert.equal(outcome.result.status, "FAILED");
    assert.equal(outcome.result.retryCount, 0);
    assert.equal(outcome.result.fallbackUsed, false);
    assert.equal(stats.submitCount, 1);
  });

  it("without authorizeForFakeTransport, generate does not call transport", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai";
    process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";

    const { fetchImpl, stats } = createFakeOpenAITransport();
    const outcome = await generateOneImageViaAiPolicy({
      adapterOptions: { fetchImpl },
      request: {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 1024,
        height: 1024,
        outputFormat: "png",
        correlationId: "DCA-IMG-OAI-NOLIVE"
      }
    });
    assert.equal(stats.submitCount, 0);
    assert.equal(outcome.result.liveProviderCalled, false);
  });

  it("registry resolves openai and still resolves bfl; size helper allowlists 1024x1024 only", () => {
    assert.ok(resolveImageProviderAdapter("openai"));
    assert.ok(resolveImageProviderAdapter("bfl"));
    assert.ok(createBflFluxAdapter());
    assert.equal(resolveImageProviderAdapter("firefly"), null);
    assert.equal(resolveOpenAIImageSize(1024, 1024), "1024x1024");
    assert.equal(resolveOpenAIImageSize(512, 512), null);
    assert.equal(resolveOpenAIImageSize(1536, 1024), null);
  });
});
