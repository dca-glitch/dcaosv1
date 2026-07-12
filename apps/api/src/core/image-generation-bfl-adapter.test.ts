import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getImageGenerationIntegrationReadiness,
  getImageGenerationProviderConfig,
  buildImageGenerationNoLiveConfigSnapshot,
  IMAGE_GENERATION_ENV_KEYS,
  IMAGE_GENERATION_DEFAULTS
} from "../config/image-generation.config";
import { resolveModelRoute, isApprovedImageModelId } from "./ai-model-routing-policy.service";
import {
  evaluateImageGenerationLiveAuthorization,
  IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED,
  assertOneGenerationGuard
} from "./image-generation-guard.service";
import { resolveImageSinglePolicyRoute, validateImageGenerationRequestAgainstPolicy } from "./image-policy-route";
import { generateOneImageViaAiPolicy, toClientSafeImageGenerationResult } from "./image-generation-ai-policy.service";
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

describe("AI Policy image_single route", () => {
  it("resolves provider=bfl broker=direct model=flux-2-pro cost=0.10 retry=0 fallback=false output=1", () => {
    const routed = resolveModelRoute({
      orchestratorTaskType: "image_single",
      clientProfile: "puriva",
      contentChannel: "website"
    });
    assert.equal(routed.blocked, false);
    assert.equal(routed.route.taskType, "image_single");
    assert.equal(routed.route.gateway, "bfl");
    assert.equal(routed.route.provider, "bfl");
    assert.equal(routed.route.broker, "direct");
    assert.equal(routed.route.primaryModel, "flux-2-pro");
    assert.equal(routed.route.maxCostUsdPerRun, 0.1);
    assert.equal(routed.route.retryLimit, 0);
    assert.equal(routed.route.fallbackAllowed, false);
    assert.equal(routed.route.outputCount, 1);
    assert.equal(routed.route.maxMegapixels, 1);
    assert.equal(isApprovedImageModelId("flux-2-pro"), true);
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

describe("image generation live authorization", () => {
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

  it("API key alone does not authorize live calls", () => {
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
    assert.equal(assertOneGenerationGuard({
      maxProviderRequests: 1,
      maxGenerationJobs: 1,
      retryLimit: 1,
      fallbackAllowed: false,
      outputCount: 1
    }).ok, false);
    assert.equal(assertOneGenerationGuard({
      maxProviderRequests: 1,
      maxGenerationJobs: 1,
      retryLimit: 0,
      fallbackAllowed: true,
      outputCount: 1
    }).ok, false);
    assert.equal(assertOneGenerationGuard({
      maxProviderRequests: 1,
      maxGenerationJobs: 1,
      retryLimit: 0,
      fallbackAllowed: false,
      outputCount: 2
    }).ok, false);
  });
});

describe("BFLFluxAdapter fake transport", () => {
  it("completes one submit, bounded polls, one download with validated bytes", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";

    const { fetchImpl, stats, imageBytes } = createFakeBflTransport({
      width: 64,
      height: 64,
      pendingPolls: 1
    });

    const outcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl, sleepImpl: async () => undefined },
      request: {
        prompt: "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting, no people, no text, no logos, no medical equipment.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-001"
      }
    });

    assert.equal(outcome.r2Called, false);
    assert.equal(stats.submitCount, 1);
    assert.ok(stats.pollCount >= 1);
    assert.equal(stats.downloadCount, 1);
    assert.equal(outcome.result.status, "COMPLETED");
    assert.equal(outcome.result.submitRequestCount, 1);
    assert.equal(outcome.result.generationJobCount, 1);
    assert.equal(outcome.result.resultDownloadCount, 1);
    assert.equal(outcome.result.retryCount, 0);
    assert.equal(outcome.result.fallbackUsed, false);
    assert.equal(outcome.result.outputCount, 1);
    assert.equal(outcome.result.liveProviderCalled, true);
    assert.equal(outcome.result.width, 64);
    assert.equal(outcome.result.height, 64);
    assert.equal(outcome.result.byteLength, imageBytes.length);
    assert.ok(outcome.result.sha256);
    assert.equal(outcome.result.actualCostUsd, null);
    assert.ok(outcome.result.estimatedCostUsd <= 0.1);
    assert.equal(outcome.result.artifactHandoff?.r2Called, false);
    assert.equal(outcome.result.artifactHandoff?.publicUrl, null);
    assert.equal(outcome.result.artifactHandoff?.storageKey, null);

    const ledger = buildImageGenerationLedgerMetadata(outcome.result);
    assert.equal(ledger.modality, "image");
    assert.equal(ledger.provider, "bfl");
    assert.equal(ledger.model, "flux-2-pro");
    assert.equal(ledger.retryCount, 0);
    assert.equal(ledger.fallbackUsed, false);
    assert.equal(ledger.artifactPersisted, false);

    const clientSafe = JSON.stringify(toClientSafeImageGenerationResult(outcome.result));
    assert.equal(clientSafe.includes("test-key-not-real"), false);
    assert.equal(clientSafe.includes("polling_url"), false);
    assert.equal(clientSafe.includes("bfl.ai"), false);
    assert.equal(clientSafe.includes("sha256"), false);
  });

  it("rejects unsafe polling hostname", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";

    const { fetchImpl } = createFakeBflTransport({
      unsafePollingUrl: "https://evil.example/poll"
    });

    const outcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl, sleepImpl: async () => undefined },
      request: {
        prompt: "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-UNSAFE-POLL"
      }
    });

    assert.equal(outcome.result.status, "FAILED");
    assert.ok(outcome.result.safeError?.includes("hostname") || outcome.result.safeError?.includes("allowlisted"));
    assert.equal(outcome.result.generationJobCount, 1);
    assert.equal(outcome.result.resultDownloadCount, 0);
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

    const { fetchImpl, stats } = createFakeBflTransport({ failPoll: true, pendingPolls: 0 });
    const outcome = await generateOneImageViaAiPolicy({
      authorizeForFakeTransport: true,
      adapterOptions: { fetchImpl, sleepImpl: async () => undefined },
      request: {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-FAIL"
      }
    });

    assert.equal(outcome.result.status, "FAILED");
    assert.equal(outcome.result.fallbackUsed, false);
    assert.equal(outcome.result.retryCount, 0);
    assert.equal(stats.submitCount, 1);
  });

  it("extracts PNG dimensions and rejects malformed image", () => {
    const bytes = buildFakePngBuffer(32, 48);
    const dims = extractImageDimensions(bytes);
    assert.deepEqual(dims, { width: 32, height: 48 });
    assert.equal(extractImageDimensions(Buffer.from("not-an-image")), null);
  });

  it("registry resolves only bfl adapter", () => {
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

  it("without authorizeForFakeTransport, generate does not call transport", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";

    const { fetchImpl, stats } = createFakeBflTransport();
    const outcome = await generateOneImageViaAiPolicy({
      adapterOptions: { fetchImpl },
      request: {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "DCA-IMG-TEST-NOLIVE"
      }
    });

    assert.equal(stats.submitCount, 0);
    assert.equal(outcome.result.liveProviderCalled, false);
    assert.ok(outcome.result.status === "BLOCKED" || outcome.result.status === "SKIPPED");
  });
});

describe("BFLFluxAdapter direct unit", () => {
  it("submit uses POST x-key and flux-2-pro path", async () => {
    process.env.IMAGE_GENERATION_ENABLED = "true";
    process.env.IMAGE_GENERATION_PROVIDER = "bfl";
    process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
    process.env.IMAGE_GENERATION_API_KEY = "test-key-not-real";

    const { fetchImpl, stats } = createFakeBflTransport({ width: 64, height: 64, pendingPolls: 0 });
    const adapter = createBflFluxAdapter({
      fetchImpl,
      sleepImpl: async () => undefined,
      bypassNetworkLiveEnvForTests: true
    });
    const route = resolveImageSinglePolicyRoute({
      correlationId: "unit-1",
      liveExecutionAuthorized: true
    });
    assert.equal(route.ok, true);
    if (!route.ok) return;

    const result = await adapter.generateOneImage(
      {
        prompt: "Minimal abstract wellness composition soft shapes.",
        width: 64,
        height: 64,
        outputFormat: "png",
        correlationId: "unit-1"
      },
      route.policy
    );

    assert.equal(result.status, "COMPLETED");
    assert.equal(stats.submitCount, 1);
    assert.ok(stats.methods.includes("POST"));
    assert.ok(stats.hosts.some((h) => h.includes("bfl.ai")));
    assert.equal(getImageGenerationProviderConfig().hasApiKey, true);
  });
});
