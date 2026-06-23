import type { AiTextBudget, AiWorkflowOutputType } from "./ai-text-budget.policy";

export interface AiWorkflowResultV1 {
  version: "AI_WORKFLOW_RESULT_V1";
  gateway: "local" | "openrouter";
  model: string;
  outputType: AiWorkflowOutputType;
  generatedAt: string;
  title: string;
  summary: string;
  structuredContent: Record<string, unknown> | null;
  safeError: string | null;
  budget: AiTextBudget;
}

export function serializeAiWorkflowResultForPlaceholder(result: AiWorkflowResultV1): string {
  if (result.outputType === "content_plan_draft") {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    result.title.trim(),
    result.summary.trim(),
    `Gateway: ${result.gateway}`,
    `Model: ${result.model}`,
    `Generated at: ${result.generatedAt}`,
    `Budget policy: ${result.budget.budgetPolicy}`,
    `Approximate input tokens: ${result.budget.approximateInputTokens}`,
    `Max output tokens: ${result.budget.maxOutputTokens}`
  ];

  if (result.safeError) {
    lines.push(`Safe error: ${result.safeError}`);
  }

  return lines.filter(Boolean).join("\n");
}
