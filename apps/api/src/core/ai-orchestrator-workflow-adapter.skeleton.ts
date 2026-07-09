import type {
  AiContentDraftBatchPlan,
  AiOrchestratorLitePlanRequest,
  AiOrchestratorLitePlanResult,
  AiResearchPackOutput,
  AiSeoPlanOutput
} from "@dca-os-v1/shared";
import { planAiOrchestratorLiteStep } from "./ai-orchestrator-lite.service";
import { resolveDryRunContractForTaskType } from "./ai-workflow-dry-run-contracts.service";

/**
 * Workflow execution adapter (G57–G59).
 * Planning-only bridge — does not execute live providers or mutate workflow state.
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
  spentThisPeriodUsd?: number;
  workflowReference?: string | null;
  stepReference?: string | null;
}

export interface AiOrchestratorWorkflowAdapterDryRunOutput {
  contractVersion: string;
  researchPack: AiResearchPackOutput | null;
  seoPlan: AiSeoPlanOutput | null;
  contentDraftBatch: AiContentDraftBatchPlan | null;
}

export interface AiOrchestratorWorkflowAdapterResult {
  adapterVersion: typeof AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION;
  plan: AiOrchestratorLitePlanResult;
  dryRunOutput: AiOrchestratorWorkflowAdapterDryRunOutput;
  canProceedToExecution: boolean;
  blockedReason: string | null;
  executionDeferred: true;
}

function buildDryRunOutput(taskType: string): AiOrchestratorWorkflowAdapterDryRunOutput {
  const resolved = resolveDryRunContractForTaskType(taskType);
  return {
    contractVersion: resolved.contractVersion,
    researchPack: resolved.output && "packId" in resolved.output ? resolved.output : null,
    seoPlan: resolved.output && "planId" in resolved.output && "articleOutlines" in resolved.output ? resolved.output : null,
    contentDraftBatch: resolved.output && "batchId" in resolved.output ? resolved.output : null
  };
}

export function planWorkflowStepWithOrchestrator(
  input: AiOrchestratorWorkflowAdapterInput
): AiOrchestratorWorkflowAdapterResult {
  const planRequest: AiOrchestratorLitePlanRequest = {
    workflow: input.workflow,
    step: input.step,
    agentRole: input.agentRole,
    taskType: input.taskType,
    clientId: input.clientId,
    operatingPackKey: input.operatingPackKey,
    spentThisPeriodUsd: input.spentThisPeriodUsd,
    workflowReference: input.workflowReference,
    stepReference: input.stepReference
  };

  if (input.briefApproved === false) {
    return {
      adapterVersion: AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION,
      plan: planAiOrchestratorLiteStep(planRequest),
      dryRunOutput: buildDryRunOutput(input.taskType),
      canProceedToExecution: false,
      blockedReason: "Brief is not approved; cannot route as AI-safe context.",
      executionDeferred: true
    };
  }

  const plan = planAiOrchestratorLiteStep(planRequest);

  return {
    adapterVersion: AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION,
    plan,
    dryRunOutput: buildDryRunOutput(input.taskType),
    canProceedToExecution: plan.canExecute,
    blockedReason: plan.blockedReason,
    executionDeferred: true
  };
}
