import type { AiAgentRole, AiTaskType } from "@dca-os-v1/shared";
import type { AiPromptTemplateMetadata } from "@dca-os-v1/shared";
import { formatPromptTemplateVersion } from "@dca-os-v1/shared";

export const AI_PROMPT_TEMPLATE_REGISTRY_VERSION = "AI_PROMPT_TEMPLATE_REGISTRY_V1";

const BASE_SAFETY_NOTES = [
  "No medical/patient data in prompts.",
  "No SaaS/user/billing data in prompts by default.",
  "Outputs are review-ready only until admin approval."
];

export const AI_PROMPT_TEMPLATE_REGISTRY: AiPromptTemplateMetadata[] = [
  {
    templateId: "research_pack",
    version: "v1",
    taskType: "research_pack",
    agentRole: "research_agent",
    clientPolicyProfile: "PURIVA_OPERATING_PACK_V1",
    outputSchemaRef: "AiResearchPackOutput",
    safetyNotes: [...BASE_SAFETY_NOTES, "Public sources only."]
  },
  {
    templateId: "seo_plan",
    version: "v1",
    taskType: "seo_plan",
    agentRole: "seo_planning_agent",
    clientPolicyProfile: "PURIVA_OPERATING_PACK_V1",
    outputSchemaRef: "AiSeoPlanOutput",
    safetyNotes: BASE_SAFETY_NOTES
  },
  {
    templateId: "article_draft",
    version: "v1",
    taskType: "article_draft",
    agentRole: "content_drafting_agent",
    clientPolicyProfile: "PURIVA_OPERATING_PACK_V1",
    outputSchemaRef: "AiContentDraftBatchItem",
    safetyNotes: BASE_SAFETY_NOTES
  },
  {
    templateId: "compliance_review",
    version: "v1",
    taskType: "compliance_review",
    agentRole: "compliance_review_agent",
    clientPolicyProfile: "PURIVA_OPERATING_PACK_V1",
    outputSchemaRef: "ComplianceReviewFixtureResult",
    safetyNotes: [...BASE_SAFETY_NOTES, "Human review required for flagged claims."]
  },
  {
    templateId: "local_deterministic",
    version: "v1",
    taskType: "local_deterministic",
    agentRole: "local_disabled_safe_agent",
    clientPolicyProfile: null,
    outputSchemaRef: null,
    safetyNotes: ["Disabled-safe local deterministic path."]
  }
];

export function resolvePromptTemplateVersion(
  taskType: AiTaskType,
  agentRole: AiAgentRole
): string | null {
  const match =
    AI_PROMPT_TEMPLATE_REGISTRY.find(
      (entry) => entry.taskType === taskType && entry.agentRole === agentRole
    ) ??
    AI_PROMPT_TEMPLATE_REGISTRY.find((entry) => entry.taskType === taskType);

  if (!match) {
    return `${taskType}_v1`;
  }

  return formatPromptTemplateVersion(match.templateId, match.version);
}

export function getPromptTemplateMetadata(
  templateId: string
): AiPromptTemplateMetadata | null {
  return AI_PROMPT_TEMPLATE_REGISTRY.find((entry) => entry.templateId === templateId) ?? null;
}
