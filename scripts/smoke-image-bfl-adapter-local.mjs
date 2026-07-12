/**
 * Local no-live smoke for BFL image adapter preservation (fake transport only).
 * Active AI Policy route is OpenAI; this smoke proves BFL remains registrable and functional.
 * Never contacts api.bfl.ai.
 */

import { IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED } from "../apps/api/src/core/image-generation-guard.service.ts";
import { resolveModelRoute } from "../apps/api/src/core/ai-model-routing-policy.service.ts";
import { resolveImageProviderAdapter } from "../apps/api/src/core/image-provider-adapter.registry.ts";
import { createBflFluxAdapter } from "../apps/api/src/services/bfl-flux.adapter.ts";
import { createFakeBflTransport } from "../apps/api/src/services/bfl-flux.fake-transport.ts";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  console.log("[SMOKE][IMAGE_BFL_ADAPTER_LOCAL] starting");

  record("foundation live-calls constant is false", IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED === false);

  const routed = resolveModelRoute({
    orchestratorTaskType: "image_single",
    clientProfile: "puriva",
    contentChannel: "website"
  });
  record(
    "active image_single route is openai (BFL not active default)",
    routed.blocked === false && routed.route.provider === "openai" && routed.route.primaryModel === "gpt-image-1",
    `provider=${routed.route.provider} model=${routed.route.primaryModel}`
  );
  record("BFL adapter remains registrable", Boolean(resolveImageProviderAdapter("bfl")));

  process.env.IMAGE_GENERATION_ENABLED = "true";
  process.env.IMAGE_GENERATION_PROVIDER = "bfl";
  process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
  process.env.IMAGE_GENERATION_API_KEY = "smoke-fake-key-not-live";
  process.env.IMAGE_GENERATION_BASE_URL = "https://api.bfl.ai";

  const { fetchImpl, stats } = createFakeBflTransport({ width: 64, height: 64, pendingPolls: 1 });
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
      correlationId: "DCA-IMG-SMOKE-BFL-LOCAL"
    },
    {
      taskType: "image_single",
      capability: "image_generation",
      correlationId: "DCA-IMG-SMOKE-BFL-LOCAL",
      provider: "bfl",
      broker: "direct",
      model: "flux-2-pro",
      maxCostUsd: 0.1,
      maxProviderRequests: 1,
      maxGenerationJobs: 1,
      retryLimit: 0,
      fallbackAllowed: false,
      liveExecutionAuthorized: true,
      timeoutMs: 120_000,
      outputCount: 1,
      maxMegapixels: 1,
      maxWidth: 1024,
      maxHeight: 1024
    }
  );

  record("fake submit count is 1", stats.submitCount === 1, `submit=${stats.submitCount}`);
  record("fake download count is 1", stats.downloadCount === 1, `download=${stats.downloadCount}`);
  record("result COMPLETED", result.status === "COMPLETED", result.status);
  record("retry/fallback zero", result.retryCount === 0 && result.fallbackUsed === false);
  record("r2 not called", result.artifactHandoff?.r2Called === false);
  record("output count 1", result.outputCount === 1);
  record("sha256 present", Boolean(result.sha256));

  const failed = results.filter((r) => !r.ok);
  console.log(`[SMOKE][IMAGE_BFL_ADAPTER_LOCAL] finished - ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
