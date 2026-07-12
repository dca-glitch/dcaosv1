import type { AiBudgetSnapshot } from "@dca-os-v1/shared";

export const AI_BUDGET_GUARD_VERSION = "AI_BUDGET_GUARD_V1";

/** Puriva operating pack hard monthly AI cap (USD). */
export const PURIVA_AI_MONTHLY_CAP_USD = 100;

const DEFAULT_MONTHLY_CAP_USD = 100;

const STEP_COST_ESTIMATES_USD: Record<string, number> = {
  research_pack: 0.15,
  seo_plan: 0.25,
  article_outline: 0.2,
  article_draft: 0.75,
  compliance_review: 0.35,
  rewrite_polish: 0.3,
  report_narrative: 0.4,
  image_prompt: 0.1,
  image_generation: 0.1,
  vision_technical_qa: 0.2,
  local_deterministic: 0
};

export function resolveMonthlyCapUsd(operatingPackKey: string | null | undefined): number {
  if (operatingPackKey === "puriva" || operatingPackKey === "PURIVA_OPERATING_PACK_V1") {
    return PURIVA_AI_MONTHLY_CAP_USD;
  }
  return DEFAULT_MONTHLY_CAP_USD;
}

export function estimateStepCostUsd(taskType: string): number {
  return STEP_COST_ESTIMATES_USD[taskType] ?? 0.1;
}

export function buildPeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export interface AiBudgetGuardInput {
  clientId?: string | null;
  operatingPackKey?: string | null;
  taskType: string;
  workflowStepCount?: number;
  actualCostUsd?: number | null;
  spentThisPeriodUsd?: number;
  maxCostUsdPerRun?: number | null;
}

export function buildAiBudgetSnapshot(input: AiBudgetGuardInput): AiBudgetSnapshot {
  const monthlyCapUsd = resolveMonthlyCapUsd(input.operatingPackKey);
  const routeCap = input.maxCostUsdPerRun;
  const estimatedStepCostUsd =
    typeof routeCap === "number" && routeCap > 0 ? routeCap : estimateStepCostUsd(input.taskType);
  const workflowStepCount = input.workflowStepCount ?? 1;
  const estimatedWorkflowCostUsd = Number((estimatedStepCostUsd * workflowStepCount).toFixed(4));
  const spentThisPeriodUsd = input.spentThisPeriodUsd ?? 0;
  const remainingBudgetUsd = Number(Math.max(0, monthlyCapUsd - spentThisPeriodUsd - estimatedStepCostUsd).toFixed(4));
  const projectedOverBudget = spentThisPeriodUsd + estimatedWorkflowCostUsd > monthlyCapUsd;
  const killSwitchActive = spentThisPeriodUsd >= monthlyCapUsd;

  return {
    clientId: input.clientId ?? null,
    operatingPackKey: input.operatingPackKey ?? null,
    monthlyCapUsd,
    estimatedWorkflowCostUsd,
    estimatedStepCostUsd,
    actualCostUsd: input.actualCostUsd ?? null,
    remainingBudgetUsd,
    projectedOverBudget,
    killSwitchActive,
    periodKey: buildPeriodKey()
  };
}

export function isAiBudgetBlocked(
  budget: AiBudgetSnapshot,
  maxCostUsdPerRun?: number | null
): {
  blocked: boolean;
  reason: string | null;
} {
  if (budget.killSwitchActive) {
    return {
      blocked: true,
      reason: `Monthly AI budget cap of $${budget.monthlyCapUsd} USD exceeded for period ${budget.periodKey}.`
    };
  }

  if (
    typeof maxCostUsdPerRun === "number" &&
    maxCostUsdPerRun > 0 &&
    budget.remainingBudgetUsd < maxCostUsdPerRun
  ) {
    return {
      blocked: true,
      reason: `Route cost cap of $${maxCostUsdPerRun} USD exceeds remaining monthly AI budget.`
    };
  }

  if (budget.projectedOverBudget) {
    return {
      blocked: true,
      reason: `Projected workflow cost would exceed remaining monthly AI budget.`
    };
  }

  return { blocked: false, reason: null };
}
