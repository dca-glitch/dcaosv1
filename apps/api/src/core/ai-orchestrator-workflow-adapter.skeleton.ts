import type {
  AiContentDraftBatchPlan,
  AiMockedProviderExecutionResult,
  AiOrchestratorLitePlanRequest,
  AiOrchestratorLitePlanResult,
  AiPlannedLedgerMetadata,
  AiResearchPackOutput,
  AiSeoPlanOutput
} from "@dca-os-v1/shared";
import { planAiOrchestratorLiteStep, finalizeOrchestratorLiteLedgerAttribution } from "./ai-orchestrator-lite.service";
import type { CompletedLedgerAttributionResult } from "./ai-budget-ledger.service";
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
  contentChannel?: string | null;
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
  plannedLedgerMetadata: AiPlannedLedgerMetadata;
  dryRunOutput: AiOrchestratorWorkflowAdapterDryRunOutput;
  canProceedToExecution: boolean;
  blockedReason: string | null;
  executionDeferred: true;
}

export interface AiOrchestratorWorkflowCompletedAttributionResult {
  adapter: AiOrchestratorWorkflowAdapterResult;
  completedLedgerAttribution: CompletedLedgerAttributionResult;
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
    contentChannel: input.contentChannel,
    workflowReference: input.workflowReference,
    stepReference: input.stepReference
  };

  if (input.briefApproved === false) {
    const plan = planAiOrchestratorLiteStep(planRequest);
    return {
      adapterVersion: AI_ORCHESTRATOR_WORKFLOW_ADAPTER_VERSION,
      plan,
      plannedLedgerMetadata: plan.plannedLedgerMetadata,
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
    plannedLedgerMetadata: plan.plannedLedgerMetadata,
    dryRunOutput: buildDryRunOutput(input.taskType),
    canProceedToExecution: plan.canExecute,
    blockedReason: plan.blockedReason,
    executionDeferred: true
  };
}

export function completeWorkflowStepLedgerAttribution(input: {
  workflow: string;
  step: string;
  agentRole: AiOrchestratorLitePlanRequest["agentRole"];
  taskType: AiOrchestratorLitePlanRequest["taskType"];
  clientId?: string | null;
  operatingPackKey?: string | null;
  briefApproved?: boolean;
  spentThisPeriodUsd?: number;
  contentChannel?: string | null;
  workflowReference?: string | null;
  stepReference?: string | null;
  workflowRunId?: string | null;
  providerExecution: AiMockedProviderExecutionResult;
}): AiOrchestratorWorkflowCompletedAttributionResult {
  const adapter = planWorkflowStepWithOrchestrator(input);
  const completedLedgerAttribution = finalizeOrchestratorLiteLedgerAttribution({
    plan: adapter.plan,
    providerExecution: input.providerExecution,
    workflowRunId: input.workflowRunId,
    contentChannel: input.contentChannel,
    operatingPackKey: input.operatingPackKey
  });
  return { adapter, completedLedgerAttribution };
}
