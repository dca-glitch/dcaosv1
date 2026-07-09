import type {
  AiMaterialRoutingPreview,
  AiMockedProviderExecutionResult,
  AiOrchestratorLitePlanRequest,
  AiOrchestratorLitePlanResult,
  AiRunAuditMetadata
} from "@dca-os-v1/shared";
import { AI_ORCHESTRATOR_LITE_VERSION } from "@dca-os-v1/shared";
import { getAiAgentRoleDefinition } from "./ai-agent-role-registry";
import { applyAiMaterialPolicy, buildDefaultAiSafeMaterialSet } from "./ai-material-policy.guard";
import { buildAiBudgetSnapshot, isAiBudgetBlocked } from "./ai-budget-guard.service";
import {
  buildPlannedLedgerMetadata,
  prepareCompletedLedgerAttribution,
  type CompletedLedgerAttributionResult
} from "./ai-budget-ledger.service";
import { resolveModelRoute, listAiModelRoutingPolicySnapshot } from "./ai-model-routing-policy.service";
import { AI_AGENT_ROLE_REGISTRY } from "./ai-agent-role-registry";
import { listAiProviderRegistrySnapshot, resolveProviderForRole } from "./ai-provider-registry.service";
import { resolvePromptTemplateVersion } from "./ai-prompt-template-registry.service";

export function planAiOrchestratorLiteStep(
  request: AiOrchestratorLitePlanRequest
): AiOrchestratorLitePlanResult {
  const roleDefinition = getAiAgentRoleDefinition(request.agentRole);
  if (!roleDefinition) {
    const blocked = buildBlockedPreview(request, `Unknown agent role "${request.agentRole}".`);
    return {
      preview: blocked.preview,
      plannedLedgerMetadata: blocked.plannedLedgerMetadata,
      canExecute: false,
      blockedReason: `Unknown agent role "${request.agentRole}".`
    };
  }

  const rawMaterials =
    request.materialReferences && request.materialReferences.length > 0
      ? request.materialReferences
      : buildDefaultAiSafeMaterialSet(request.workflow);

  const { inputMaterials, excludedMaterials, policyDecision } = applyAiMaterialPolicy(
    request.agentRole,
    rawMaterials
  );

  const providerResolution = resolveProviderForRole(request.agentRole);
  const routingResolution = resolveModelRoute({
    orchestratorTaskType: request.taskType,
    clientProfile: request.operatingPackKey,
    contentChannel: request.contentChannel ?? "website",
    requestedModelOverride: request.requestedModelOverride ?? null
  });

  const budget = buildAiBudgetSnapshot({
    clientId: request.clientId,
    operatingPackKey: request.operatingPackKey,
    taskType: request.taskType,
    workflowStepCount: 8,
    spentThisPeriodUsd: request.spentThisPeriodUsd,
    maxCostUsdPerRun: routingResolution.route.maxCostUsdPerRun
  });

  const budgetBlock = isAiBudgetBlocked(budget, routingResolution.route.maxCostUsdPerRun);
  const estimatedCostUsd = routingResolution.route.requiresBudgetLedger
    ? routingResolution.route.maxCostUsdPerRun
    : budget.estimatedStepCostUsd;

  const audit: AiRunAuditMetadata = {
    orchestratorVersion: AI_ORCHESTRATOR_LITE_VERSION,
    workflowId: null,
    workflowReference: request.workflowReference ?? request.workflow,
    stepId: null,
    stepReference: request.stepReference ?? request.step,
    clientId: request.clientId ?? null,
    agentRole: request.agentRole,
    providerKey: providerResolution.effective.providerKey,
    modelId: providerResolution.effective.modelId,
    promptTemplateVersion: resolvePromptTemplateVersion(request.taskType, request.agentRole),
    inputMaterials,
    excludedMaterials,
    estimatedCostUsd,
    actualCostUsd: null,
    status: "preview",
    retryCount: 0,
    outputVisibility: roleDefinition.approvalRequired ? "review_ready" : "internal",
    reviewerUserId: null,
    approvalStatus: roleDefinition.approvalRequired ? "pending" : "not_required",
    policyDecision,
    liveProviderCalled: false,
    providerSelectionReason: `${providerResolution.selectionReason} ${routingResolution.audit.selectionReason}`.trim()
  };

  const preview: AiMaterialRoutingPreview = {
    workflow: request.workflow,
    clientId: request.clientId ?? null,
    clientLabel: null,
    step: request.step,
    agentRole: request.agentRole,
    agentRoleLabel: roleDefinition.label,
    providerKey: providerResolution.effective.providerKey,
    modelId: routingResolution.route.primaryModel ?? providerResolution.effective.modelId,
    inputMaterials,
    excludedMaterials,
    policyChecks: policyDecision,
    estimatedCostUsd,
    budget,
    approvalRequired: roleDefinition.approvalRequired,
    outputVisibility: audit.outputVisibility,
    executionMode: providerResolution.effective.executionMode,
    modelRouting: routingResolution.audit,
    audit
  };

  let blockedReason: string | null = null;
  if (!policyDecision.allowed) {
    blockedReason = policyDecision.blockedReason;
  } else if (routingResolution.blocked) {
    blockedReason = routingResolution.blockedReason;
  } else if (budgetBlock.blocked) {
    blockedReason = budgetBlock.reason;
  }

  const canExecute = blockedReason === null;
  const plannedLedgerMetadata = buildPlannedLedgerMetadata({
    orchestratorTaskType: request.taskType,
    clientProfile: request.operatingPackKey,
    contentChannel: request.contentChannel ?? "website",
    providerKey: providerResolution.effective.providerKey,
    estimatedCostUsd,
    canExecute,
    routingAudit: routingResolution.audit
  });

  return {
    preview,
    plannedLedgerMetadata,
    canExecute,
    blockedReason
  };
}

export function getAiOrchestratorLiteRegistrySnapshot(): {
  orchestratorVersion: typeof AI_ORCHESTRATOR_LITE_VERSION;
  agentRoles: typeof AI_AGENT_ROLE_REGISTRY;
  providerRegistry: ReturnType<typeof listAiProviderRegistrySnapshot>;
  modelRoutingPolicy: ReturnType<typeof listAiModelRoutingPolicySnapshot>;
} {
  return {
    orchestratorVersion: AI_ORCHESTRATOR_LITE_VERSION,
    agentRoles: AI_AGENT_ROLE_REGISTRY,
    providerRegistry: listAiProviderRegistrySnapshot(),
    modelRoutingPolicy: listAiModelRoutingPolicySnapshot()
  };
}

export function finalizeOrchestratorLiteLedgerAttribution(input: {
  plan: AiOrchestratorLitePlanResult;
  providerExecution: AiMockedProviderExecutionResult;
  workflowRunId?: string | null;
  contentChannel?: string | null;
  operatingPackKey?: string | null;
}): CompletedLedgerAttributionResult {
  return prepareCompletedLedgerAttribution({
    orchestratorTaskType: input.plan.plannedLedgerMetadata.taskType,
    clientProfile: input.operatingPackKey ?? input.plan.plannedLedgerMetadata.clientProfile,
    contentChannel: input.contentChannel ?? input.plan.plannedLedgerMetadata.contentChannel,
    routingAudit: input.plan.preview.modelRouting,
    plannedLedgerMetadata: input.plan.plannedLedgerMetadata,
    providerExecution: input.providerExecution,
    estimatedCostUsd: input.plan.plannedLedgerMetadata.estimatedCostUsd,
    workflowRunId: input.workflowRunId ?? null
  });
}

function buildBlockedPreview(
  request: AiOrchestratorLitePlanRequest,
  reason: string
): { preview: AiMaterialRoutingPreview; plannedLedgerMetadata: ReturnType<typeof buildPlannedLedgerMetadata> } {
  const routingResolution = resolveModelRoute({
    orchestratorTaskType: request.taskType,
    clientProfile: request.operatingPackKey,
    contentChannel: request.contentChannel ?? "website"
  });
  const budget = buildAiBudgetSnapshot({
    clientId: request.clientId,
    operatingPackKey: request.operatingPackKey,
    taskType: request.taskType,
    maxCostUsdPerRun: routingResolution.route.maxCostUsdPerRun
  });

  const plannedLedgerMetadata = buildPlannedLedgerMetadata({
    orchestratorTaskType: request.taskType,
    clientProfile: request.operatingPackKey,
    contentChannel: request.contentChannel ?? "website",
    providerKey: "local_deterministic",
    estimatedCostUsd: 0,
    canExecute: false,
    routingAudit: routingResolution.audit
  });

  return {
    preview: {
    workflow: request.workflow,
    clientId: request.clientId ?? null,
    clientLabel: null,
    step: request.step,
    agentRole: request.agentRole,
    agentRoleLabel: request.agentRole,
    providerKey: "local_deterministic",
    modelId: "local-deterministic-v1",
    inputMaterials: [],
    excludedMaterials: [],
    policyChecks: { allowed: false, blockedReason: reason, checks: [] },
    estimatedCostUsd: 0,
    budget,
    approvalRequired: true,
    outputVisibility: "internal",
    executionMode: "disabled",
    modelRouting: routingResolution.audit,
    audit: {
      orchestratorVersion: AI_ORCHESTRATOR_LITE_VERSION,
      workflowId: null,
      workflowReference: request.workflow,
      stepId: null,
      stepReference: request.step,
      clientId: request.clientId ?? null,
      agentRole: request.agentRole,
      providerKey: "local_deterministic",
      modelId: "local-deterministic-v1",
      promptTemplateVersion: null,
      inputMaterials: [],
      excludedMaterials: [],
      estimatedCostUsd: 0,
      actualCostUsd: null,
      status: "blocked",
      retryCount: 0,
      outputVisibility: "internal",
      reviewerUserId: null,
      approvalStatus: "not_required",
      policyDecision: { allowed: false, blockedReason: reason, checks: [] },
      liveProviderCalled: false,
      providerSelectionReason: reason
    }
    },
    plannedLedgerMetadata
  };
}
