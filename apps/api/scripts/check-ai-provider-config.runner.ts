/**
 * AI provider local config hardening checks.
 * Proves missing provider env does not crash, local deterministic path works,
 * misconfigured OpenRouter stays guarded, and planning snapshots do not leak secrets.
 */

import {
  AI_PROVIDER_ENV_KEYS,
  DEFAULT_AI_TEXT_GATEWAY,
  getAiProviderConfig,
  isOpenRouterLiveExecutionReady,
  validateAiProviderConfigForRuntime
} from "../src/config/ai-provider.config.ts";
import { createAiDeliveryWorkflowExecutionAdapter } from "../src/core/ai-delivery-workflow-execution.adapter.ts";
import { getAiProviderPlanningSnapshot } from "../src/services/ai-provider-planning.service.ts";
import { executeOpenRouterTextRequest } from "../src/services/openrouter-text.service.ts";

const smokeMarker = "[CHECK][AI_PROVIDER_CONFIG]";
const expectOpenRouterLive = (process.env.SMOKE_EXPECT_OPENROUTER_LIVE ?? "").trim().toLowerCase() === "true";

const providerEnvKeys = Object.values(AI_PROVIDER_ENV_KEYS);
const forbiddenPatterns = [/OPENROUTER_API_KEY/i, /sk-or-[a-z0-9]/i, /passwordHash/i, /sessionTokenHash/i];

const results: Array<{ name: string; ok: boolean; detail: string }> = [];

function record(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function snapshotEnv(): Record<string, string | undefined> {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of providerEnvKeys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of providerEnvKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearProviderEnv() {
  for (const key of providerEnvKeys) {
    delete process.env[key];
  }
}

function setProviderEnv(values: Record<string, string | undefined>) {
  clearProviderEnv();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function responseLeaksSecrets(text: string): boolean {
  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

async function runDeterministicAdapterProof(config = getAiProviderConfig()) {
  const adapter = createAiDeliveryWorkflowExecutionAdapter(config);
  const finishedAtIso = new Date().toISOString();
  const output = await adapter.execute({
    projectName: `${smokeMarker} project`,
    targetMonth: "2027-09",
    briefStatus: "DRAFT",
    briefNotes: null,
    plannedContentScopeNotes: null,
    adminNotes: `${smokeMarker} deterministic proof`,
    existingResultPlaceholder: null,
    researchSummaries: [],
    approvedSourceMetadata: [],
    marketIntelligenceHandoffs: [],
    selectedContentPlanItem: null,
    finishedAtIso
  });

  return {
    gateway: output.workflowResult.gateway,
    model: output.workflowResult.model,
    placeholder: output.resultPlaceholder ?? ""
  };
}

async function main() {
  console.log(`${smokeMarker} starting`);
  const initialEnv = snapshotEnv();

  try {
    clearProviderEnv();

    let config: ReturnType<typeof getAiProviderConfig>;
    try {
      config = getAiProviderConfig();
      record("getAiProviderConfig with missing provider env", true, "no throw");
    } catch (error) {
      record(
        "getAiProviderConfig with missing provider env",
        false,
        error instanceof Error ? error.message : String(error)
      );
      config = getAiProviderConfig();
    }

    record("default text gateway is local", config.textGateway === DEFAULT_AI_TEXT_GATEWAY, config.textGateway);
    record("default live execution disabled", !isOpenRouterLiveExecutionReady(config), String(isOpenRouterLiveExecutionReady(config)));

    const runtimeValidation = validateAiProviderConfigForRuntime(config);
    record("runtime validation stays safe without provider env", runtimeValidation.ok, `warnings=${runtimeValidation.warnings.length}`);

    const planningSnapshot = JSON.stringify(getAiProviderPlanningSnapshot());
    record("planning snapshot hides secrets", !responseLeaksSecrets(planningSnapshot), "safe JSON");
    record(
      "planning snapshot reports local gateway by default",
      planningSnapshot.includes('"textGateway":"local"') && planningSnapshot.includes('"openRouterLiveExecutionEnabled":false'),
      "local/disabled"
    );

    const deterministic = await runDeterministicAdapterProof(config);
    record(
      "deterministic adapter executes locally",
      deterministic.gateway === "local" && deterministic.model === "local-deterministic",
      `${deterministic.gateway}/${deterministic.model}`
    );

    setProviderEnv({
      [AI_PROVIDER_ENV_KEYS.textGateway]: "openrouter"
    });
    const misconfigured = getAiProviderConfig();
    record(
      "openrouter gateway without key stays guarded",
      misconfigured.textGateway === "openrouter" && !isOpenRouterLiveExecutionReady(misconfigured),
      `live=${isOpenRouterLiveExecutionReady(misconfigured)}`
    );

    const misconfiguredValidation = validateAiProviderConfigForRuntime(misconfigured);
    record(
      "misconfigured openrouter emits runtime warnings",
      misconfiguredValidation.warnings.length > 0,
      `warnings=${misconfiguredValidation.warnings.length}`
    );

    const fallbackExecution = await runDeterministicAdapterProof(misconfigured);
    record(
      "misconfigured openrouter falls back to deterministic local execution",
      fallbackExecution.gateway === "local" && fallbackExecution.model === "local-deterministic",
      `${fallbackExecution.gateway}/${fallbackExecution.model}`
    );

    const openRouterWithoutFetch = await executeOpenRouterTextRequest({
      config: misconfigured,
      model: "example/model",
      systemPrompt: "system",
      userPrompt: "user",
      maxOutputTokens: 120,
      temperature: 0.2
    });
    record(
      "openrouter request without key does not call provider",
      openRouterWithoutFetch.ok === false && openRouterWithoutFetch.errorMessage === "OpenRouter is not fully configured.",
      openRouterWithoutFetch.errorMessage ?? "missing error"
    );

    setProviderEnv({
      [AI_PROVIDER_ENV_KEYS.textGateway]: "unexpected-provider"
    });
    const unrecognized = getAiProviderConfig();
    const unrecognizedValidation = validateAiProviderConfigForRuntime(unrecognized);
    record(
      "unrecognized gateway falls back to local",
      unrecognized.textGateway === DEFAULT_AI_TEXT_GATEWAY,
      unrecognized.textGateway
    );
    record(
      "unrecognized gateway emits warning",
      unrecognizedValidation.warnings.some((warning) => warning.includes("Unrecognized")),
      "warning present"
    );

    if (expectOpenRouterLive) {
      const liveConfig = getAiProviderConfig();
      record(
        "strict live openrouter execution enabled",
        isOpenRouterLiveExecutionReady(liveConfig),
        String(isOpenRouterLiveExecutionReady(liveConfig))
      );
    } else {
      record("live openrouter probe skipped by default", true, "set SMOKE_EXPECT_OPENROUTER_LIVE=true to enable");
    }
  } finally {
    restoreEnv(initialEnv);
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: AI provider config is safe locally without provider secrets.");
  } else {
    console.log("NOT PROVEN: one or more AI provider config checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

await main();
