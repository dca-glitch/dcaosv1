import type {
  AiFallbackBehavior,
  AiModelRoute,
  AiModelRouteAudit,
  AiRoutingClientProfile,
  AiRoutingContentChannel,
  AiRoutingTaskType,
  ApprovedAiTextModelId
} from "@dca-os-v1/shared";
import {
  AI_MODEL_ROUTING_POLICY_VERSION,
  APPROVED_AI_TEXT_MODEL_IDS,
  APPROVED_AI_IMAGE_MODEL_IDS
} from "@dca-os-v1/shared";
import type { AiTaskType } from "@dca-os-v1/shared";

const APPROVED_MODEL: ApprovedAiTextModelId = "anthropic/claude-haiku-4.5";

const PURIVA_CHANNELS: AiRoutingContentChannel[] = ["website", "social_media"];

function route(
  partial: Omit<AiModelRoute, "taskType"> & { taskType: AiRoutingTaskType }
): AiModelRoute {
  return partial;
}

/** Static backend routing table — sole source of model selection per task type. */
export const AI_MODEL_ROUTING_TABLE: Record<AiRoutingTaskType, AiModelRoute> = {
  research_pack: route({
    taskType: "research_pack",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 6000,
    maxOutputTokens: 1200,
    maxCostUsdPerRun: 0.3,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "medium",
    description: "Research pack synthesis for Puriva website/social content."
  }),
  seo_plan: route({
    taskType: "seo_plan",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 5000,
    maxOutputTokens: 1000,
    maxCostUsdPerRun: 0.25,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "medium",
    description: "SEO planning for Puriva website/social content."
  }),
  content_draft: route({
    taskType: "content_draft",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 8000,
    maxOutputTokens: 1800,
    maxCostUsdPerRun: 0.6,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "medium",
    description: "Content draft generation for Puriva website/social channels."
  }),
  medical_compliance_review: route({
    taskType: "medical_compliance_review",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: false,
    requiresBudgetLedger: true,
    maxInputTokens: 8000,
    maxOutputTokens: 1200,
    maxCostUsdPerRun: 0.5,
    complianceProfile: "puriva_medical_strict",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "high",
    description: "Medical/compliance review — conservative; no weak model fallback."
  }),
  final_client_polish: route({
    taskType: "final_client_polish",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 6000,
    maxOutputTokens: 1200,
    maxCostUsdPerRun: 0.35,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "medium",
    description: "Final client-safe polish for Puriva deliverables."
  }),
  long_context_review: route({
    taskType: "long_context_review",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: false,
    requiresBudgetLedger: true,
    maxInputTokens: 12000,
    maxOutputTokens: 1500,
    maxCostUsdPerRun: 0.75,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "high",
    description: "Long-context review — live disabled until explicitly approved."
  }),
  workflow_summary: route({
    taskType: "workflow_summary",
    gateway: "openrouter",
    primaryModel: APPROVED_MODEL,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 4000,
    maxOutputTokens: 700,
    maxCostUsdPerRun: 0.15,
    complianceProfile: "internal_summary_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "low",
    description: "Internal workflow summary for admin observability."
  }),
  image_single: route({
    taskType: "image_single",
    gateway: "bfl",
    primaryModel: "flux-2-pro",
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: true,
    requiresBudgetLedger: true,
    maxInputTokens: 0,
    maxOutputTokens: 0,
    maxCostUsdPerRun: 0.1,
    complianceProfile: "puriva_medical_safe",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: PURIVA_CHANNELS,
    riskLevel: "medium",
    description: "Single image generation via BFL FLUX.2 Pro (direct adapter; not OpenRouter).",
    provider: "bfl",
    broker: "direct",
    outputCount: 1,
    maxMegapixels: 1,
    maxProviderRequests: 1,
    maxGenerationJobs: 1,
    retryLimit: 0,
    fallbackAllowed: false
  }),
  fallback_stop_admin_review: route({
    taskType: "fallback_stop_admin_review",
    gateway: "local",
    primaryModel: null,
    fallbackModels: [],
    fallbackBehavior: "STOP_AND_ADMIN_REVIEW",
    allowLive: false,
    requiresBudgetLedger: false,
    maxInputTokens: 0,
    maxOutputTokens: 0,
    maxCostUsdPerRun: 0,
    complianceProfile: "stop_admin_review",
    supportedClientProfiles: ["puriva"],
    supportedContentChannels: [],
    riskLevel: "high",
    description: "Blocked route — requires admin review.",
    blockedReason: "unsupported_or_high_risk_route_requires_admin_review"
  })
};

/** Maps orchestrator task types to routing task types. Unknown types block. */
export const ORCHESTRATOR_TASK_TO_ROUTING_TASK: Partial<Record<AiTaskType, AiRoutingTaskType>> = {
  research_pack: "research_pack",
  seo_plan: "seo_plan",
  article_outline: "seo_plan",
  article_draft: "content_draft",
  compliance_review: "medical_compliance_review",
  rewrite_polish: "final_client_polish",
  report_narrative: "workflow_summary",
  local_deterministic: "fallback_stop_admin_review",
  image_prompt: "fallback_stop_admin_review",
  /** Orchestrator preview remains blocked; live single-image uses routing task `image_single` directly. */
  image_generation: "fallback_stop_admin_review",
  vision_technical_qa: "fallback_stop_admin_review"
};

export function normalizeClientProfile(
  operatingPackKey: string | null | undefined
): AiRoutingClientProfile | null {
  if (!operatingPackKey) {
    return null;
  }
  const normalized = operatingPackKey.trim().toLowerCase();
  if (normalized === "puriva" || normalized === "puriva_operating_pack_v1") {
    return "puriva";
  }
  return null;
}

export function normalizeContentChannel(channel: string | null | undefined): AiRoutingContentChannel | null {
  if (!channel) {
    return null;
  }
  const normalized = channel.trim().toLowerCase();
  if (normalized === "website") return "website";
  if (normalized === "social_media" || normalized === "social") return "social_media";
  if (normalized === "paid_ads" || normalized === "paid") return "paid_ads";
  return null;
}

export function isApprovedModelId(modelId: string | null | undefined): modelId is ApprovedAiTextModelId {
  if (!modelId) return false;
  return (APPROVED_AI_TEXT_MODEL_IDS as readonly string[]).includes(modelId);
}

export function isApprovedImageModelId(modelId: string | null | undefined): boolean {
  if (!modelId) return false;
  return (APPROVED_AI_IMAGE_MODEL_IDS as readonly string[]).includes(modelId);
}

export function isApprovedRoutingModelId(modelId: string | null | undefined): boolean {
  return isApprovedModelId(modelId) || isApprovedImageModelId(modelId);
}

export function resolveRoutingTaskType(
  orchestratorTaskType: string
): AiRoutingTaskType | null {
  const mapped = ORCHESTRATOR_TASK_TO_ROUTING_TASK[orchestratorTaskType as AiTaskType];
  if (mapped) {
    return mapped;
  }
  if (orchestratorTaskType in AI_MODEL_ROUTING_TABLE) {
    return orchestratorTaskType as AiRoutingTaskType;
  }
  return null;
}

export interface ResolveModelRouteInput {
  orchestratorTaskType: string;
  clientProfile?: string | null;
  contentChannel?: string | null;
  requestedModelOverride?: string | null;
}

export interface ResolveModelRouteResult {
  route: AiModelRoute;
  audit: AiModelRouteAudit;
  blocked: boolean;
  blockedReason: string | null;
}

function buildAudit(
  routeDef: AiModelRoute,
  options: {
    blocked: boolean;
    blockedReason: string | null;
    modelOverrideRejected: boolean;
    selectionReason: string;
  }
): AiModelRouteAudit {
  return {
    policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
    routingTaskType: routeDef.taskType,
    gateway: routeDef.gateway,
    primaryModel: routeDef.primaryModel,
    fallbackModels: routeDef.fallbackModels,
    fallbackBehavior: routeDef.fallbackBehavior,
    allowLive: routeDef.allowLive,
    requiresBudgetLedger: routeDef.requiresBudgetLedger,
    maxInputTokens: routeDef.maxInputTokens,
    maxOutputTokens: routeDef.maxOutputTokens,
    maxCostUsdPerRun: routeDef.maxCostUsdPerRun,
    complianceProfile: routeDef.complianceProfile,
    supportedClientProfiles: routeDef.supportedClientProfiles,
    supportedContentChannels: routeDef.supportedContentChannels,
    riskLevel: routeDef.riskLevel,
    blocked: options.blocked,
    blockedReason: options.blockedReason,
    modelOverrideRejected: options.modelOverrideRejected,
    selectionReason: options.selectionReason
  };
}

export function resolveModelRoute(input: ResolveModelRouteInput): ResolveModelRouteResult {
  const routingTaskType = resolveRoutingTaskType(input.orchestratorTaskType);
  const fallbackRoute = AI_MODEL_ROUTING_TABLE.fallback_stop_admin_review;

  if (!routingTaskType) {
    return {
      route: fallbackRoute,
      audit: buildAudit(fallbackRoute, {
        blocked: true,
        blockedReason: `Unknown task type "${input.orchestratorTaskType}" — model routing blocked.`,
        modelOverrideRejected: false,
        selectionReason: "Unknown task type mapped to fallback_stop_admin_review."
      }),
      blocked: true,
      blockedReason: `Unknown task type "${input.orchestratorTaskType}" — model routing blocked.`
    };
  }

  const routeDef = AI_MODEL_ROUTING_TABLE[routingTaskType];
  const clientProfile = normalizeClientProfile(input.clientProfile);
  const contentChannel = normalizeContentChannel(input.contentChannel ?? "website");

  let modelOverrideRejected = false;
  if (input.requestedModelOverride && !isApprovedRoutingModelId(input.requestedModelOverride)) {
    modelOverrideRejected = true;
  }

  if (routeDef.blockedReason) {
    return {
      route: routeDef,
      audit: buildAudit(routeDef, {
        blocked: true,
        blockedReason: routeDef.blockedReason,
        modelOverrideRejected,
        selectionReason: routeDef.blockedReason
      }),
      blocked: true,
      blockedReason: routeDef.blockedReason
    };
  }

  if (clientProfile && !routeDef.supportedClientProfiles.includes(clientProfile)) {
    const reason = `Client profile "${clientProfile}" is not supported for task ${routingTaskType}.`;
    return {
      route: fallbackRoute,
      audit: buildAudit(fallbackRoute, {
        blocked: true,
        blockedReason: reason,
        modelOverrideRejected,
        selectionReason: reason
      }),
      blocked: true,
      blockedReason: reason
    };
  }

  if (contentChannel === "paid_ads") {
    const reason = "Paid ads channel is deferred — requires manual/admin review.";
    return {
      route: fallbackRoute,
      audit: buildAudit(fallbackRoute, {
        blocked: true,
        blockedReason: reason,
        modelOverrideRejected,
        selectionReason: reason
      }),
      blocked: true,
      blockedReason: reason
    };
  }

  if (
    contentChannel &&
    routeDef.supportedContentChannels.length > 0 &&
    !routeDef.supportedContentChannels.includes(contentChannel)
  ) {
    const reason = `Content channel "${contentChannel}" is not supported for task ${routingTaskType}.`;
    return {
      route: fallbackRoute,
      audit: buildAudit(fallbackRoute, {
        blocked: true,
        blockedReason: reason,
        modelOverrideRejected,
        selectionReason: reason
      }),
      blocked: true,
      blockedReason: reason
    };
  }

  const selectionReason = modelOverrideRejected
    ? `Backend policy selected ${routeDef.primaryModel ?? "local"}; unapproved model override rejected.`
    : `Backend policy route for ${routingTaskType} via ${routeDef.gateway}.`;

  return {
    route: routeDef,
    audit: buildAudit(routeDef, {
      blocked: false,
      blockedReason: null,
      modelOverrideRejected,
      selectionReason
    }),
    blocked: false,
    blockedReason: null
  };
}

export function listAiModelRoutingPolicySnapshot(): {
  policyVersion: typeof AI_MODEL_ROUTING_POLICY_VERSION;
  approvedModels: readonly string[];
  approvedImageModels: readonly string[];
  routes: AiModelRoute[];
} {
  return {
    policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
    approvedModels: APPROVED_AI_TEXT_MODEL_IDS,
    approvedImageModels: APPROVED_AI_IMAGE_MODEL_IDS,
    routes: Object.values(AI_MODEL_ROUTING_TABLE)
  };
}
