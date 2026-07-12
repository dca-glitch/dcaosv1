/**
 * Local no-live smoke for AI Policy OpenAI image adapter (fake transport only).
 * Never contacts api.openai.com. Never requires a real IMAGE_GENERATION_API_KEY.
 */

import { generateOneImageViaAiPolicy } from "../apps/api/src/core/image-generation-ai-policy.service.ts";
import { IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED } from "../apps/api/src/core/image-generation-guard.service.ts";
import { resolveModelRoute } from "../apps/api/src/core/ai-model-routing-policy.service.ts";
import { resolveImageProviderAdapter } from "../apps/api/src/core/image-provider-adapter.registry.ts";
import { createFakeOpenAITransport } from "../apps/api/src/services/openai-image.fake-transport.ts";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  console.log("[SMOKE][IMAGE_OPENAI_ADAPTER_LOCAL] starting");

  record("foundation live-calls constant is false", IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED === false);

  const routed = resolveModelRoute({
    orchestratorTaskType: "image_single",
    clientProfile: "puriva",
    contentChannel: "website"
  });
  record(
    "image_single policy route is openai/gpt-image-1",
    routed.blocked === false &&
      routed.route.provider === "openai" &&
      routed.route.primaryModel === "gpt-image-1" &&
      routed.route.maxCostUsdPerRun === 0.1,
    `provider=${routed.route.provider} model=${routed.route.primaryModel}`
  );

  record("BFL adapter remains registrable", Boolean(resolveImageProviderAdapter("bfl")));

  process.env.IMAGE_GENERATION_ENABLED = "true";
  process.env.IMAGE_GENERATION_PROVIDER = "openai";
  process.env.IMAGE_GENERATION_MODEL = "gpt-image-1";
  process.env.IMAGE_GENERATION_API_KEY = "smoke-fake-key-not-live";
  process.env.IMAGE_GENERATION_BASE_URL = "https://api.openai.com/v1";

  const { fetchImpl, stats } = createFakeOpenAITransport({ width: 1024, height: 1024 });
  const outcome = await generateOneImageViaAiPolicy({
    authorizeForFakeTransport: true,
    adapterOptions: { fetchImpl },
    request: {
      prompt:
        "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting, no people, no text, no logos, no medical equipment.",
      width: 1024,
      height: 1024,
      outputFormat: "png",
      correlationId: "DCA-IMG-SMOKE-OPENAI-LOCAL"
    }
  });

  record("fake submit count is 1", stats.submitCount === 1, `submit=${stats.submitCount}`);
  record("no live openai host required beyond fake", stats.hosts.every((h) => h === "api.openai.com"), `hosts=${stats.hosts.join(",")}`);
  record("result COMPLETED", outcome.result.status === "COMPLETED", outcome.result.status);
  record("provider openai / model gpt-image-1", outcome.result.provider === "openai" && outcome.result.model === "gpt-image-1");
  record("retry/fallback zero", outcome.result.retryCount === 0 && outcome.result.fallbackUsed === false);
  record("r2 not called", outcome.r2Called === false && outcome.result.artifactHandoff?.r2Called === false);
  record("output count 1", outcome.result.outputCount === 1);
  record("sha256 present", Boolean(outcome.result.sha256));
  record("quality locked low", stats.lastBody?.quality === "low");

  delete process.env.IMAGE_GENERATION_LIVE_CALLS_ALLOWED;
  const blocked = await generateOneImageViaAiPolicy({
    adapterOptions: { fetchImpl },
    request: {
      prompt: "Minimal abstract wellness composition soft shapes.",
      width: 1024,
      height: 1024,
      outputFormat: "png",
      correlationId: "DCA-IMG-SMOKE-OPENAI-NOLIVE"
    }
  });
  record(
    "without live auth no second submit occurs",
    blocked.result.liveProviderCalled === false && stats.submitCount === 1,
    `submit=${stats.submitCount} status=${blocked.result.status}`
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`[SMOKE][IMAGE_OPENAI_ADAPTER_LOCAL] finished - ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
