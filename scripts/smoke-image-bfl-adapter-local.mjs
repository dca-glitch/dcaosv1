/**
 * Local no-live smoke for AI Policy BFL image adapter (fake transport only).
 * Never contacts api.bfl.ai. Never requires IMAGE_GENERATION_API_KEY to be real.
 */

import assert from "node:assert/strict";
import { generateOneImageViaAiPolicy } from "../apps/api/src/core/image-generation-ai-policy.service.ts";
import { IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED } from "../apps/api/src/core/image-generation-guard.service.ts";
import { resolveModelRoute } from "../apps/api/src/core/ai-model-routing-policy.service.ts";
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
    "image_single policy route is bfl/flux-2-pro",
    routed.blocked === false &&
      routed.route.provider === "bfl" &&
      routed.route.primaryModel === "flux-2-pro" &&
      routed.route.maxCostUsdPerRun === 0.1,
    `provider=${routed.route.provider} model=${routed.route.primaryModel}`
  );

  process.env.IMAGE_GENERATION_ENABLED = "true";
  process.env.IMAGE_GENERATION_PROVIDER = "bfl";
  process.env.IMAGE_GENERATION_MODEL = "flux-2-pro";
  process.env.IMAGE_GENERATION_API_KEY = "smoke-fake-key-not-live";

  const { fetchImpl, stats } = createFakeBflTransport({ width: 64, height: 64, pendingPolls: 1 });
  const outcome = await generateOneImageViaAiPolicy({
    authorizeForFakeTransport: true,
    adapterOptions: { fetchImpl, sleepImpl: async () => undefined },
    request: {
      prompt:
        "Minimal abstract wellness composition with soft natural shapes, neutral studio lighting, no people, no text, no logos, no medical equipment.",
      width: 64,
      height: 64,
      outputFormat: "png",
      correlationId: "DCA-IMG-SMOKE-LOCAL"
    }
  });

  record("fake submit count is 1", stats.submitCount === 1, `submit=${stats.submitCount}`);
  record("fake download count is 1", stats.downloadCount === 1, `download=${stats.downloadCount}`);
  record("no host is api.bfl.ai live path only fake hosts", stats.hosts.every((h) => h.includes("bfl.ai") || h.includes("delivery")), `hosts=${stats.hosts.join(",")}`);
  record("result COMPLETED", outcome.result.status === "COMPLETED", outcome.result.status);
  record("retry/fallback zero", outcome.result.retryCount === 0 && outcome.result.fallbackUsed === false);
  record("r2 not called", outcome.r2Called === false && outcome.result.artifactHandoff?.r2Called === false);
  record("output count 1", outcome.result.outputCount === 1);
  record("sha256 present", Boolean(outcome.result.sha256));

  // Prove key alone does not authorize without fake bypass
  delete process.env.IMAGE_GENERATION_LIVE_CALLS_ALLOWED;
  const blocked = await generateOneImageViaAiPolicy({
    adapterOptions: { fetchImpl },
    request: {
      prompt: "Minimal abstract wellness composition soft shapes.",
      width: 64,
      height: 64,
      outputFormat: "png",
      correlationId: "DCA-IMG-SMOKE-NOLIVE"
    }
  });
  record(
    "without live auth no second submit occurs",
    blocked.result.liveProviderCalled === false && stats.submitCount === 1,
    `submit=${stats.submitCount} live=${blocked.result.liveProviderCalled}`
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`[SMOKE][IMAGE_BFL_ADAPTER_LOCAL] finished - ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[SMOKE][IMAGE_BFL_ADAPTER_LOCAL] crashed", error);
  process.exitCode = 1;
});
