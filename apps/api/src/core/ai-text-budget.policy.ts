export type AiWorkflowOutputType = "summary" | "content_plan_draft" | "article_draft";

export interface AiTextBudget {
  maxOutputTokens: number;
  approximateInputTokens: number;
  budgetPolicy: string;
}

export interface AiTextBudgetDecision {
  maxOutputTokens: number;
  approximateInputTokens: number;
  budgetPolicy: string;
  longContextPreferred: boolean;
  inputTooLarge: boolean;
}

export const AI_TEXT_BUDGET_POLICY_NAME = "AI_TEXT_BUDGET_POLICY_V1";
export const AI_TEXT_OUTPUT_TOKEN_CAPS: Record<AiWorkflowOutputType, number> = {
  summary: 180,
  content_plan_draft: 700,
  article_draft: 1800
};

const AI_TEXT_PRIMARY_CONTEXT_TOKEN_THRESHOLD = 1800;
const AI_TEXT_HARD_CONTEXT_TOKEN_LIMIT = 3200;

export function estimateApproximateInputTokens(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return Math.ceil(trimmed.length / 4);
}

export function getAiTextBudgetDecision(
  outputType: AiWorkflowOutputType,
  approximateInputTokens: number
): AiTextBudgetDecision {
  return {
    maxOutputTokens: AI_TEXT_OUTPUT_TOKEN_CAPS[outputType],
    approximateInputTokens,
    budgetPolicy: AI_TEXT_BUDGET_POLICY_NAME,
    longContextPreferred: approximateInputTokens > AI_TEXT_PRIMARY_CONTEXT_TOKEN_THRESHOLD,
    inputTooLarge: approximateInputTokens > AI_TEXT_HARD_CONTEXT_TOKEN_LIMIT
  };
}

export function toAiTextBudget(decision: AiTextBudgetDecision): AiTextBudget {
  return {
    maxOutputTokens: decision.maxOutputTokens,
    approximateInputTokens: decision.approximateInputTokens,
    budgetPolicy: decision.budgetPolicy
  };
}
