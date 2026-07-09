/**
 * AI model routing policy — shared contracts (G72).
 * Backend policy selects models per task type; arbitrary overrides are forbidden.
 */

export const AI_MODEL_ROUTING_POLICY_VERSION = "AI_MODEL_ROUTING_POLICY_V1";

/** Approved live text model IDs (owner-gated). */
export const APPROVED_AI_TEXT_MODEL_IDS = ["anthropic/claude-haiku-4.5"] as const;

export type ApprovedAiTextModelId = (typeof APPROVED_AI_TEXT_MODEL_IDS)[number];

export type AiRoutingTaskType =
  | "research_pack"
  | "seo_plan"
  | "content_draft"
  | "medical_compliance_review"
  | "final_client_polish"
  | "long_context_review"
  | "workflow_summary"
  | "fallback_stop_admin_review";

export type AiRoutingGateway = "openrouter" | "local";

export type AiFallbackBehavior = "USE_FALLBACK_MODEL" | "STOP_AND_ADMIN_REVIEW" | "BLOCK_UNSUPPORTED";

export type AiRoutingRiskLevel = "low" | "medium" | "high";

export type AiRoutingContentChannel = "website" | "social_media" | "paid_ads";

export type AiRoutingClientProfile = "puriva";

export interface AiModelRoute {
  taskType: AiRoutingTaskType;
  gateway: AiRoutingGateway;
  primaryModel: string | null;
  fallbackModels: string[];
  fallbackBehavior: AiFallbackBehavior;
  allowLive: boolean;
  requiresBudgetLedger: boolean;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxCostUsdPerRun: number;
  complianceProfile: string;
  supportedClientProfiles: AiRoutingClientProfile[];
  supportedContentChannels: AiRoutingContentChannel[];
  riskLevel: AiRoutingRiskLevel;
  description: string;
  blockedReason?: string;
}

export interface AiModelRouteAudit {
  policyVersion: typeof AI_MODEL_ROUTING_POLICY_VERSION;
  routingTaskType: AiRoutingTaskType;
  gateway: AiRoutingGateway;
  primaryModel: string | null;
  fallbackModels: string[];
  fallbackBehavior: AiFallbackBehavior;
  allowLive: boolean;
  requiresBudgetLedger: boolean;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxCostUsdPerRun: number;
  complianceProfile: string;
  supportedClientProfiles: AiRoutingClientProfile[];
  supportedContentChannels: AiRoutingContentChannel[];
  riskLevel: AiRoutingRiskLevel;
  blocked: boolean;
  blockedReason: string | null;
  modelOverrideRejected: boolean;
  selectionReason: string;
}
