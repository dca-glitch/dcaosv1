/**
 * AI Orchestrator Lite — shared contracts (G55).
 * Planning/preview only; no live provider execution in this layer.
 */

import type {
  AiModelRouteAudit,
  AiRoutingClientProfile,
  AiRoutingContentChannel,
  AiRoutingTaskType,
  AiRoutingGateway
} from "./ai-model-routing-policy";
import type { AI_MODEL_ROUTING_POLICY_VERSION } from "./ai-model-routing-policy";

export const AI_ORCHESTRATOR_LITE_VERSION = "AI_ORCHESTRATOR_LITE_V1";

/**
 * actualCostUsd remains null until a trusted provider cost source is integrated.
 * Do not fabricate from estimates, route caps, or pricing pages.
 */
export const AI_BUDGET_ACTUAL_COST_NULL_POLICY =
  "leave_null_until_trusted_provider_cost" as const;

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
  modelRouting: AiModelRouteAudit;
  audit: AiRunAuditMetadata;
}

/** Preview/planned ledger attribution metadata (G73) — no live provider call. */
export interface AiPlannedLedgerMetadata {
  ledgerVersion: "AI_BUDGET_LEDGER_V1";
  taskType: string;
  routingTaskType: AiRoutingTaskType;
  gateway: AiRoutingGateway;
  model: string | null;
  maxCostUsdPerRun: number;
  policyVersion: typeof AI_MODEL_ROUTING_POLICY_VERSION;
  clientProfile: AiRoutingClientProfile | null;
  contentChannel: AiRoutingContentChannel | null;
  provider: string;
  estimatedCostUsd: number;
  requiresBudgetLedger: boolean;
  liveProviderCalled: false;
  ledgerStatus: "PREVIEW" | "BLOCKED";
}

/** Mocked provider execution result for completed ledger attribution (G74). No live calls in tests. */
export interface AiMockedProviderExecutionResult {
  ok: boolean;
  providerKey: string;
  model: string | null;
  actualCostUsd?: number | null;
  approximateInputTokens?: number | null;
  approximateOutputTokens?: number | null;
  liveProviderCalled: boolean;
  safeError?: string | null;
  runId?: string | null;
}

/** Completed ledger attribution metadata (G74) — post-execution, no secrets. */
export interface AiCompletedLedgerMetadata {
  ledgerVersion: "AI_BUDGET_LEDGER_V1";
  ledgerStatus: "COMPLETED" | "BLOCKED" | "SKIPPED";
  taskType: string;
  routingTaskType: AiRoutingTaskType;
  gateway: AiRoutingGateway;
  provider: string;
  model: string | null;
  policyVersion: typeof AI_MODEL_ROUTING_POLICY_VERSION;
  clientProfile: AiRoutingClientProfile | null;
  contentChannel: AiRoutingContentChannel | null;
  maxCostUsdPerRun: number;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  approximateInputTokens: number | null;
  approximateOutputTokens: number | null;
  liveProviderCalled: boolean;
  safeError: string | null;
  overCap: boolean;
  overCapReason: string | null;
  workflowRunId: string | null;
  runId: string | null;
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
  contentChannel?: string | null;
  /** Ignored if not owner-approved — backend policy selects model. */
  requestedModelOverride?: string | null;
}

export interface AiOrchestratorLitePlanResult {
  preview: AiMaterialRoutingPreview;
  plannedLedgerMetadata: AiPlannedLedgerMetadata;
  canExecute: boolean;
  blockedReason: string | null;
}
