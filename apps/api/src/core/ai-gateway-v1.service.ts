import type { AiProviderConfig } from "../config";
import { isOpenRouterLiveExecutionReady } from "../config/ai-provider.config";
import { executeOpenRouterTextRequest } from "../services/openrouter-text.service";
import { sanitizeUntrustedContextText } from "./ai-prompt-injection-sanitize";
import {
  estimateApproximateInputTokens,
  getAiTextBudgetDecision,
  toAiTextBudget,
  type AiTextBudget,
  type AiTextBudgetDecision,
  type AiWorkflowOutputType
} from "./ai-text-budget.policy";

export type AiGatewayExecutionMode = "disabled" | "local" | "openrouter";

export const AI_GATEWAY_V1_NAME = "AI_GATEWAY_V1";

export type AiGatewayOpenRouterModelSlot = "primary" | "long_context";

export interface AiGatewayOpenRouterModelSelection {
  model: string;
  slot: AiGatewayOpenRouterModelSlot;
}

export interface AiGatewayV1PreparedContext {
  contextText: string;
  sanitizeFlags: string[];
  budgetDecision: AiTextBudgetDecision;
}

export interface AiGatewayV1ProviderExecutionInput {
  config: AiProviderConfig;
  outputType: AiWorkflowOutputType;
  systemPrompt: string;
  userPrompt: string;
  preparedContext: AiGatewayV1PreparedContext;
  temperature: number;
}

export interface AiGatewayV1ExecutionAudit {
  gatewayVersion: typeof AI_GATEWAY_V1_NAME;
  executionMode: AiGatewayExecutionMode;
  inputTooLarge: boolean;
  liveProviderCalled: boolean;
  providerSkippedReason: string | null;
  sanitizeFlags: string[];
}

export interface AiGatewayV1ProviderExecutionResult {
  ok: boolean;
  content: string | null;
  model: string;
  modelSlot: AiGatewayOpenRouterModelSlot;
  safeError: string | null;
  budget: AiTextBudget;
  audit: AiGatewayV1ExecutionAudit;
}

const AI_TEXT_PRIMARY_CONTEXT_TOKEN_THRESHOLD = 1800;

export function resolveAiGatewayExecutionMode(config: AiProviderConfig): AiGatewayExecutionMode {
  if (config.textGateway === "disabled") {
    return "disabled";
  }

  if (isOpenRouterLiveExecutionReady(config)) {
    return "openrouter";
  }

  return "local";
}

export function prepareAiGatewayV1Context(
  rawContextText: string,
  outputType: AiWorkflowOutputType
): AiGatewayV1PreparedContext {
  const sanitized = sanitizeUntrustedContextText(rawContextText);
  const contextText = sanitized.sanitizedText;
  const approximateInputTokens = estimateApproximateInputTokens(contextText);

  return {
    contextText,
    sanitizeFlags: sanitized.flags,
    budgetDecision: getAiTextBudgetDecision(outputType, approximateInputTokens)
  };
}

export function selectAiGatewayOpenRouterModel(
  config: AiProviderConfig,
  approximateInputTokens: number
): AiGatewayOpenRouterModelSelection {
  if (approximateInputTokens > AI_TEXT_PRIMARY_CONTEXT_TOKEN_THRESHOLD && config.openRouterTextLongContextModel) {
    return {
      model: config.openRouterTextLongContextModel,
      slot: "long_context"
    };
  }

  return {
    model: config.openRouterTextPrimaryModel ?? "unknown-model",
    slot: "primary"
  };
}

function sanitizePromptText(value: string): { text: string; flags: string[] } {
  const result = sanitizeUntrustedContextText(value);
  return {
    text: result.sanitizedText,
    flags: result.flags
  };
}

function buildSkippedProviderResult(
  input: AiGatewayV1ProviderExecutionInput,
  executionMode: AiGatewayExecutionMode,
  model: string,
  safeError: string | null,
  providerSkippedReason: string,
  inputTooLarge = false
): AiGatewayV1ProviderExecutionResult {
  return {
    ok: false,
    content: null,
    model,
    modelSlot: "primary",
    safeError,
    budget: toAiTextBudget(input.preparedContext.budgetDecision),
    audit: {
      gatewayVersion: AI_GATEWAY_V1_NAME,
      executionMode,
      inputTooLarge,
      liveProviderCalled: false,
      providerSkippedReason,
      sanitizeFlags: input.preparedContext.sanitizeFlags
    }
  };
}

export async function executeAiGatewayV1ProviderText(
  input: AiGatewayV1ProviderExecutionInput
): Promise<AiGatewayV1ProviderExecutionResult> {
  const executionMode = resolveAiGatewayExecutionMode(input.config);

  if (executionMode === "disabled") {
    return buildSkippedProviderResult(
      input,
      "disabled",
      "ai-disabled",
      "AI text execution is disabled by configuration.",
      "AI_TEXT_GATEWAY=disabled"
    );
  }

  if (executionMode === "local") {
    return buildSkippedProviderResult(
      input,
      "local",
      "local-deterministic",
      null,
      "live provider not enabled or not configured"
    );
  }

  if (input.preparedContext.budgetDecision.inputTooLarge) {
    return buildSkippedProviderResult(
      input,
      "openrouter",
      input.config.openRouterTextPrimaryModel ?? "openrouter-unconfigured",
      "Workflow context is too large for the current text budget policy. Reduce admin notes or compact supporting context before retrying.",
      "input budget exceeded",
      true
    );
  }

  const modelSelection = selectAiGatewayOpenRouterModel(
    input.config,
    input.preparedContext.budgetDecision.approximateInputTokens
  );
  const systemSanitized = sanitizePromptText(input.systemPrompt);
  const userSanitized = sanitizePromptText(input.userPrompt);
  const sanitizeFlags = [
    ...new Set([...input.preparedContext.sanitizeFlags, ...systemSanitized.flags, ...userSanitized.flags])
  ];

  const providerResult = await executeOpenRouterTextRequest({
    config: input.config,
    model: modelSelection.model,
    systemPrompt: systemSanitized.text,
    userPrompt: userSanitized.text,
    maxOutputTokens: input.preparedContext.budgetDecision.maxOutputTokens,
    temperature: input.temperature
  });

  return {
    ok: providerResult.ok,
    content: providerResult.content,
    model: providerResult.model,
    modelSlot: modelSelection.slot,
    safeError: providerResult.ok ? null : (providerResult.errorMessage ?? "OpenRouter text execution failed."),
    budget: toAiTextBudget(input.preparedContext.budgetDecision),
    audit: {
      gatewayVersion: AI_GATEWAY_V1_NAME,
      executionMode: "openrouter",
      inputTooLarge: false,
      liveProviderCalled: true,
      providerSkippedReason: null,
      sanitizeFlags
    }
  };
}
