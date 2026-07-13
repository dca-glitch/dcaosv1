import type { AiBudgetSnapshot } from "@dca-os-v1/shared";
import { PURIVA_MONTHLY_AI_CAP_USD, normalizeOperatingPackBindingKey, getClientOperatingPackConfigFromBindingKey } from "@dca-os-v1/shared";

export const AI_BUDGET_GUARD_VERSION = "AI_BUDGET_GUARD_V1";

/** Puriva operating pack hard monthly AI cap (USD) — single source: shared pack constant. */
export const PURIVA_AI_MONTHLY_CAP_USD = PURIVA_MONTHLY_AI_CAP_USD;

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

/**
 * Resolve monthly AI cap from an operating-pack binding key.
 * Unbound (null) and unknown keys return null — no silent Puriva $100 default.
 */
export function resolveMonthlyCapUsd(operatingPackKey: string | null | undefined): number | null {
  const bindingKey = normalizeOperatingPackBindingKey(operatingPackKey);
  if (!bindingKey) {
    return null;
  }
  return getClientOperatingPackConfigFromBindingKey(bindingKey).monthlyAiCapUsd;
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
  const resolvedCap = resolveMonthlyCapUsd(input.operatingPackKey);
  const packBound = resolvedCap !== null;
  const monthlyCapUsd = packBound ? resolvedCap : 0;
  const routeCap = input.maxCostUsdPerRun;
  const estimatedStepCostUsd =
    typeof routeCap === "number" && routeCap > 0 ? routeCap : estimateStepCostUsd(input.taskType);
  const workflowStepCount = input.workflowStepCount ?? 1;
  const estimatedWorkflowCostUsd = Number((estimatedStepCostUsd * workflowStepCount).toFixed(4));
  const spentThisPeriodUsd = input.spentThisPeriodUsd ?? 0;
  const remainingBudgetUsd = packBound
    ? Number(Math.max(0, monthlyCapUsd - spentThisPeriodUsd - estimatedStepCostUsd).toFixed(4))
    : 0;
  const projectedOverBudget = !packBound || spentThisPeriodUsd + estimatedWorkflowCostUsd > monthlyCapUsd;
  const killSwitchActive = !packBound || spentThisPeriodUsd >= monthlyCapUsd;

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
  const bindingKey = normalizeOperatingPackBindingKey(budget.operatingPackKey);
  if (!bindingKey) {
    return {
      blocked: true,
      reason: "Operating pack binding missing or unknown — AI budget is fail-closed until a registered pack is bound."
    };
  }

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
