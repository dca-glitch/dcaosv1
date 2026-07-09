import type { AiOrchestratorLitePlanRequest, AiOrchestratorLitePlanResult } from "@dca-os-v1/shared";
import { planAiOrchestratorLiteStep } from "./ai-orchestrator-lite.service";

/**
 * Workflow execution adapter skeleton (G56).
 * Planning-only bridge — does not execute live providers or mutate workflow state.
 *
 * Future flow:
 * 1. workflow request
 * 2. routing preview (this adapter)
 * 3. budget check
 * 4. disabled-safe/local execution
 * 5. audit
 * 6. admin approval
 */

export const AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION = "AI_ORCHESTRATOR_WORKFLOW_ADAPTER_V1";

export interface AiOrchestratorWorkflowAdapterInput {
  workflow: string;
  step: string;
  agentRole: AiOrchestratorLitePlanRequest["agentRole"];
  taskType: AiOrchestratorLitePlanRequest["taskType"];
  clientId?: string | null;
  operatingPackKey?: string | null;
  briefApproved?: boolean;
}

export interface AiOrchestratorWorkflowAdapterResult {
  adapterVersion: typeof AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION;
  plan: AiOrchestratorLitePlanResult;
  canProceedToExecution: boolean;
  blockedReason: string | null;
  executionDeferred: true;
}

export function planWorkflowStepWithOrchestrator(
  input: AiOrchestratorWorkflowAdapterInput
): AiOrchestratorWorkflowAdapterResult {
  if (input.briefApproved === false) {
    return {
      adapterVersion: AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION,
      plan: planAiOrchestratorLiteStep({
        workflow: input.workflow,
        step: input.step,
        agentRole: input.agentRole,
        taskType: input.taskType,
        clientId: input.clientId,
        operatingPackKey: input.operatingPackKey
      }),
      canProceedToExecution: false,
      blockedReason: "Brief is not approved; cannot route as AI-safe context.",
      executionDeferred: true
    };
  }

  const plan = planAiOrchestratorLiteStep({
    workflow: input.workflow,
    step: input.step,
    agentRole: input.agentRole,
    taskType: input.taskType,
    clientId: input.clientId,
    operatingPackKey: input.operatingPackKey
  });

  return {
    adapterVersion: AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION,
    plan,
    canProceedToExecution: plan.canExecute,
    blockedReason: plan.blockedReason,
    executionDeferred: true
  };
}
