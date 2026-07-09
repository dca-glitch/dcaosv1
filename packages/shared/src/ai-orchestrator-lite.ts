/**
 * AI Orchestrator Lite — shared contracts (G55).
 * Planning/preview only; no live provider execution in this layer.
 */

export const AI_ORCHESTRATOR_LITE_VERSION = "AI_ORCHESTRATOR_LITE_V1";

/** System-level AI agent roles. */
export type AiAgentRole =
  | "research_agent"
  | "seo_planning_agent"
  | "content_drafting_agent"
  | "rewrite_localization_agent"
  | "compliance_review_agent"
  | "report_narrative_agent"
  | "image_prompt_agent"
  | "image_generation_agent"
  | "vision_technical_qa_agent"
  | "local_disabled_safe_agent";

export type AiTaskType =
  | "research_pack"
  | "seo_plan"
  | "article_outline"
  | "article_draft"
  | "compliance_review"
  | "rewrite_polish"
  | "report_narrative"
  | "image_prompt"
  | "image_generation"
  | "vision_technical_qa"
  | "local_deterministic";

/** Material classes for routing and policy guards. */
export type AiMaterialClass =
  | "client_brief"
  | "approved_business_facts"
  | "public_research"
  | "seo_plan"
  | "article_outline"
  | "article_draft"
  | "report_metrics"
  | "social_copy"
  | "image_prompt"
  | "stock_ai_marketing_asset"
  | "before_after_asset"
  | "saas_user_account_billing_data"
  | "forbidden_medical_data";

export type AiMaterialVisibility = "internal" | "review_ready" | "client_final";

export type AiProviderEnvironment = "local" | "staging" | "production";

export type AiProviderExecutionMode = "disabled" | "local" | "live";

export interface AiAgentRoleDefinition {
  role: AiAgentRole;
  label: string;
  taskTypes: AiTaskType[];
  allowedMaterialClasses: AiMaterialClass[];
  forbiddenMaterialClasses: AiMaterialClass[];
  outputType: string;
  approvalRequired: boolean;
  liveProviderRequired: boolean;
  defaultProviderKey: string;
  defaultModelId: string | null;
  disabledSafeFallback: "local_deterministic";
}

export interface AiProviderRegistryEntry {
  providerKey: string;
  displayName: string;
  modelId: string | null;
  modelName: string | null;
  enabled: boolean;
  environment: AiProviderEnvironment;
  executionMode: AiProviderExecutionMode;
  fallbackProviderKey: string | null;
  timeoutMs: number;
  retryLimit: number;
  estimatedCostUsdPer1kTokens: number | null;
  notes: string | null;
}

export interface AiRoleProviderMapping {
  role: AiAgentRole;
  primaryProviderKey: string;
  fallbackProviderKey: string | null;
}

export interface AiMaterialReference {
  materialClass: AiMaterialClass;
  referenceId: string | null;
  label: string;
  included: boolean;
  exclusionReason: string | null;
}

export interface AiPolicyDecision {
  allowed: boolean;
  blockedReason: string | null;
  checks: string[];
}

export interface AiBudgetSnapshot {
  clientId: string | null;
  operatingPackKey: string | null;
  monthlyCapUsd: number;
  estimatedWorkflowCostUsd: number;
  estimatedStepCostUsd: number;
  actualCostUsd: number | null;
  remainingBudgetUsd: number;
  projectedOverBudget: boolean;
  killSwitchActive: boolean;
  periodKey: string;
}

export interface AiRunAuditMetadata {
  orchestratorVersion: typeof AI_ORCHESTRATOR_LITE_VERSION;
  workflowId: string | null;
  workflowReference: string | null;
  stepId: string | null;
  stepReference: string | null;
  clientId: string | null;
  agentRole: AiAgentRole;
  providerKey: string;
  modelId: string | null;
  promptTemplateVersion: string | null;
  inputMaterials: AiMaterialReference[];
  excludedMaterials: AiMaterialReference[];
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  status: "planned" | "preview" | "blocked" | "skipped" | "completed";
  retryCount: number;
  outputVisibility: AiMaterialVisibility;
  reviewerUserId: string | null;
  approvalStatus: "not_required" | "pending" | "approved" | "rejected";
  policyDecision: AiPolicyDecision;
  liveProviderCalled: boolean;
  providerSelectionReason: string;
}

export interface AiMaterialRoutingPreview {
  workflow: string;
  clientId: string | null;
  clientLabel: string | null;
  step: string;
  agentRole: AiAgentRole;
  agentRoleLabel: string;
  providerKey: string;
  modelId: string | null;
  inputMaterials: AiMaterialReference[];
  excludedMaterials: AiMaterialReference[];
  policyChecks: AiPolicyDecision;
  estimatedCostUsd: number;
  budget: AiBudgetSnapshot;
  approvalRequired: boolean;
  outputVisibility: AiMaterialVisibility;
  executionMode: AiProviderExecutionMode;
  audit: AiRunAuditMetadata;
}

export interface AiOrchestratorLitePlanRequest {
  workflow: string;
  step: string;
  clientId?: string | null;
  operatingPackKey?: string | null;
  agentRole: AiAgentRole;
  taskType: AiTaskType;
  materialReferences?: AiMaterialReference[];
  workflowReference?: string | null;
  stepReference?: string | null;
  spentThisPeriodUsd?: number;
}

export interface AiOrchestratorLitePlanResult {
  preview: AiMaterialRoutingPreview;
  canExecute: boolean;
  blockedReason: string | null;
}
