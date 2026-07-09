import type {
  AiMaterialRoutingPreview,
  AiOrchestratorLitePlanRequest,
  AiOrchestratorLitePlanResult,
  AiRunAuditMetadata
} from "@dca-os-v1/shared";
import { AI_ORCHESTRATOR_LITE_VERSION } from "@dca-os-v1/shared";
import { getAiAgentRoleDefinition } from "./ai-agent-role-registry";
import { applyAiMaterialPolicy, buildDefaultAiSafeMaterialSet } from "./ai-material-policy.guard";
import { buildAiBudgetSnapshot, isAiBudgetBlocked } from "./ai-budget-guard.service";
import { AI_AGENT_ROLE_REGISTRY } from "./ai-agent-role-registry";
import { listAiProviderRegistrySnapshot, resolveProviderForRole } from "./ai-provider-registry.service";
import { resolvePromptTemplateVersion } from "./ai-prompt-template-registry.service";

export function planAiOrchestratorLiteStep(
  request: AiOrchestratorLitePlanRequest
): AiOrchestratorLitePlanResult {
  const roleDefinition = getAiAgentRoleDefinition(request.agentRole);
  if (!roleDefinition) {
    return {
      preview: buildBlockedPreview(request, `Unknown agent role "${request.agentRole}".`),
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
  const budget = buildAiBudgetSnapshot({
    clientId: request.clientId,
    operatingPackKey: request.operatingPackKey,
    taskType: request.taskType,
    workflowStepCount: 8,
    spentThisPeriodUsd: request.spentThisPeriodUsd
  });

  const budgetBlock = isAiBudgetBlocked(budget);
  const estimatedCostUsd = budget.estimatedStepCostUsd;

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
    providerSelectionReason: providerResolution.selectionReason
  };

  const preview: AiMaterialRoutingPreview = {
    workflow: request.workflow,
    clientId: request.clientId ?? null,
    clientLabel: null,
    step: request.step,
    agentRole: request.agentRole,
    agentRoleLabel: roleDefinition.label,
    providerKey: providerResolution.effective.providerKey,
    modelId: providerResolution.effective.modelId,
    inputMaterials,
    excludedMaterials,
    policyChecks: policyDecision,
    estimatedCostUsd,
    budget,
    approvalRequired: roleDefinition.approvalRequired,
    outputVisibility: audit.outputVisibility,
    executionMode: providerResolution.effective.executionMode,
    audit
  };

  let blockedReason: string | null = null;
  if (!policyDecision.allowed) {
    blockedReason = policyDecision.blockedReason;
  } else if (budgetBlock.blocked) {
    blockedReason = budgetBlock.reason;
  }

  return {
    preview,
    canExecute: blockedReason === null,
    blockedReason
  };
}

export function getAiOrchestratorLiteRegistrySnapshot(): {
  orchestratorVersion: typeof AI_ORCHESTRATOR_LITE_VERSION;
  agentRoles: typeof AI_AGENT_ROLE_REGISTRY;
  providerRegistry: ReturnType<typeof listAiProviderRegistrySnapshot>;
} {
  return {
    orchestratorVersion: AI_ORCHESTRATOR_LITE_VERSION,
    agentRoles: AI_AGENT_ROLE_REGISTRY,
    providerRegistry: listAiProviderRegistrySnapshot()
  };
}

function buildBlockedPreview(
  request: AiOrchestratorLitePlanRequest,
  reason: string
): AiMaterialRoutingPreview {
  const budget = buildAiBudgetSnapshot({
    clientId: request.clientId,
    operatingPackKey: request.operatingPackKey,
    taskType: request.taskType
  });

  return {
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
  };
}
