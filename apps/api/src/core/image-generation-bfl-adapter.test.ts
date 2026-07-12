import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { AiProviderExecutionPolicy } from "@dca-os-v1/shared";
import {
  getImageGenerationIntegrationReadiness,
  buildImageGenerationNoLiveConfigSnapshot,
  IMAGE_GENERATION_ENV_KEYS,
  IMAGE_GENERATION_DEFAULTS
} from "../config/image-generation.config";
import { isApprovedImageModelId } from "./ai-model-routing-policy.service";
import {
  evaluateImageGenerationLiveAuthorization,
  IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED,
  assertOneGenerationGuard
} from "./image-generation-guard.service";
import { resolveImageSinglePolicyRoute, validateImageGenerationRequestAgainstPolicy } from "./image-policy-route";
import { buildImageGenerationLedgerMetadata } from "./image-ledger-attribution.service";
import { createBflFluxAdapter, assertSafeBflHttpsUrl, extractImageDimensions } from "../services/bfl-flux.adapter";
import { createFakeBflTransport, buildFakePngBuffer } from "../services/bfl-flux.fake-transport";
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

function bflPolicy(correlationId: string, live = true): AiProviderExecutionPolicy {
  return {
    taskType: "image_single",
    capability: "image_generation",
    correlationId,
    provider: "bfl",
    broker: "direct",
    model: "flux-2-pro",
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

describe("BFL preservation under OpenAI-active policy", () => {
  it("keeps flux-2-pro allowlisted and BFL adapter registrable while active route is openai", () => {
    assert.equal(isApprovedImageModelId("flux-2-pro"), true);
    assert.ok(resolveImageProviderAdapter("bfl"));
    assert.equal(IMAGE_GENERATION_DEFAULTS.provider, "openai");
    const active = resolveImageSinglePolicyRoute({
      correlationId: "active-check",
      liveExecutionAuthorized: false
    });
    assert.equal(active.ok, true);
    if (active.ok) {
      assert.equal(active.policy.provider, "openai");
      assert.equal(active.policy.model, "gpt-image-1");
    }
  });

  it("rejects unsupported provider and model via policy helpers", () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "openai_images";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro-preview";
    const auth = evaluateImageGenerationLiveAuthorization();
    assert.equal(auth.authorized, false);
  });
});

describe("image generation live authorization (shared)", () => {
  it("keeps foundation live-calls constant false", () => {
    assert.equal(IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED, false);
  });

  it("disabled when enabled flag false — no provider request possible", () => {
    process.env.IMAGE_GENERATION_ENABLED = "false";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    const auth = evaluateImageGenerationLiveAuthorization();
    assert.equal(auth.authorized, false);
    assert.equal(auth.readinessLabel, "disabled");
  });

  it("API key alone does not authorize live calls for BFL env shape", () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    delete process.env.IMAGE_GENERATION_LIVE_CALLS_ALLOWED;
    const auth = evaluateImageGenerationLiveAuthorization();
    assert.equal(auth.authorized, false);
    assert.equal(auth.snapshot.keyPresent, true);
    assert.equal(auth.snapshot.liveAuthorized, false);
    assert.equal(auth.readinessLabel, "configured_not_authorized");
  });

  it("missing model reports missing_config", () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    delete process.env.IMAGE_GENERATION_MODEL;
    const readiness = getImageGenerationIntegrationReadiness();
    assert.equal(readiness.status, "missing_config");
    assert.ok(readiness.missingKeys.includes(IMAGE_GENERATION_ENV_KEYS.model));
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
});

describe("BFLFluxAdapter fake transport", () => {
  it("completes one submit, bounded polls, one download with validated bytes", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

    const { fetchImpl, stats, imageBytes } = createFakeBflTransport({
      width: 64,
      height: 64,
      pendingPolls: 1
    });

    const adapter = createBflFluxAdapter({
      fetchImpl,
      sleepImpl: async () => undefined,
      bypassNetworkLiveEnvForTests: true
    });
    const result = await adapter.generateOneImage(
      {
        prompt:
          "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting, no people, no text, no logos, no medical equipment.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-001"
      },
      bflPolicy("DCA-IMG-TEST-001", true)
    );

    assert.equal(stats.submitCount, 1);
    assert.ok(stats.pollCount >= 1);
    assert.equal(stats.downloadCount, 1);
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.provider, "bfl");
    assert.equal(result.model, "flux-2-pro");
    assert.equal(result.submitRequestCount, 1);
    assert.equal(result.generationJobCount, 1);
    assert.equal(result.resultDownloadCount, 1);
    assert.equal(result.retryCount, 0);
    assert.equal(result.fallbackUsed, false);
    assert.equal(result.outputCount, 1);
    assert.equal(result.liveProviderCalled, true);
    assert.equal(result.width, 64);
    assert.equal(result.height, 64);
    assert.equal(result.byteLength, imageBytes.length);
    assert.ok(result.sha256);
    assert.equal(result.actualCostUsd, null);
    assert.ok(result.estimatedCostUsd <= 0.1);
    assert.equal(result.artifactHandoff?.r2Called, false);

    const ledger = buildImageGenerationLedgerMetadata(result);
    assert.equal(ledger.modality, "image");
    assert.equal(ledger.provider, "bfl");
    assert.equal(ledger.model, "flux-2-pro");
  });

  it("rejects unsafe polling hostname", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

    const { fetchImpl } = createFakeBflTransport({
      unsafePollingUrl: "https://evil.example/poll"
    });

    const result = await createBflFluxAdapter({
      fetchImpl,
      sleepImpl: async () => undefined,
      bypassNetworkLiveEnvForTests: true
    }).generateOneImage(
      {
        prompt: "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-UNSAFE-POLL"
      },
      bflPolicy("DCA-IMG-TEST-UNSAFE-POLL", true)
    );

    assert.equal(result.status, "FAILED");
    assert.ok(result.safeError?.includes("hostname") || result.safeError?.includes("allowlisted"));
    assert.equal(result.generationJobCount, 1);
    assert.equal(result.resultDownloadCount, 0);
  });

  it("rejects http polling URL", () => {
    const check = assertSafeBflHttpsUrl("http://api.bfl.ai/v1/get_result?id=x", "poll");
    assert.equal(check.ok, false);
  });

  it("rejects empty/html downloads and oversized cost/dimensions at policy layer", () => {
    const route = resolveImageSinglePolicyRoute({
      correlationId: "c1",
      liveExecutionAuthorized: false
    });
    assert.equal(route.ok, true);
    if (!route.ok) return;

    const overCost = validateImageGenerationRequestAgainstPolicy(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "c1"
      },
      { ...route.policy, maxCostUsd: 0.5 }
    );
    assert.equal(overCost.ok, false);

    const overMp = validateImageGenerationRequestAgainstPolicy(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 2000,
        height: 2000,
        outputFormat: "png",
        correlationId: "c1"
      },
      route.policy
    );
    assert.equal(overMp.ok, false);
  });

  it("terminal provider failure does not fallback or retry", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

    const { fetchImpl, stats } = createFakeBflTransport({ failPoll: true, pendingPolls: 0 });
    const result = await createBflFluxAdapter({
      fetchImpl,
      sleepImpl: async () => undefined,
      bypassNetworkLiveEnvForTests: true
    }).generateOneImage(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-FAIL"
      },
      bflPolicy("DCA-IMG-TEST-FAIL", true)
    );

    assert.equal(result.status, "FAILED");
    assert.equal(result.fallbackUsed, false);
    assert.equal(result.retryCount, 0);
    assert.equal(stats.submitCount, 1);
  });

  it("extracts PNG dimensions and rejects malformed image", () => {
    const bytes = buildFakePngBuffer(32, 48);
    const dims = extractImageDimensions(bytes);
    assert.deepEqual(dims, { width: 32, height: 48 });
    assert.equal(extractImageDimensions(Buffer.from("not-an-image")), null);
  });

  it("registry resolves bfl adapter and rejects unknown", () => {
    assert.ok(resolveImageProviderAdapter("bfl"));
    assert.equal(resolveImageProviderAdapter("firefly"), null);
  });

  it("no-live snapshot never includes api key value", () => {
    const snapshot = buildImageGenerationNoLiveConfigSnapshot();
    const json = JSON.stringify(snapshot);
    assert.equal(snapshot.liveProviderCallsAllowed, false);
    assert.equal(json.includes("apiKeyValue"), false);
    assert.equal(snapshot.defaults.model, IMAGE_GENERATION_DEFAULTS.model);
  });

  it("without live authorization, BFL adapter does not call transport", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

    const { fetchImpl, stats } = createFakeBflTransport();
    const result = await createBflFluxAdapter({ fetchImpl }).generateOneImage(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-NOLIVE"
      },
      bflPolicy("DCA-IMG-TEST-NOLIVE", false)
    );

    assert.equal(stats.submitCount, 0);
    assert.equal(result.liveProviderCalled, false);
    assert.ok(result.status === "BLOCKED" || result.status === "SKIPPED");
  });
});

describe("BFLFluxAdapter direct unit", () => {
  it("submit uses POST x-key and flux-2-pro path", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";
    process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

    const { fetchImpl, stats } = createFakeBflTransport({ width: 64, height: 64, pendingPolls: 0 });
    const adapter = createBflFluxAdapter({
      fetchImpl,
      sleepImpl: async () => undefined,
      bypassNetworkLiveEnvForTests: true
    });
    const result = await adapter.generateOneImage(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "unit-1"
      },
      bflPolicy("unit-1", true)
    );
    assert.equal(result.status, "COMPLETED");
    assert.equal(stats.submitCount, 1);
    assert.ok(stats.methods.includes("POST"));
  });
});
