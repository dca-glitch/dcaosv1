import type { AiAgentRoleDefinition } from "@dca-os-v1/shared";

export const AI_AGENT_ROLE_REGISTRY: Record<string, AiAgentRoleDefinition> = {
  research_agent: {
    role: "research_agent",
    label: "Research Agent",
    taskTypes: ["research_pack"],
    allowedMaterialClasses: ["client_brief", "approved_business_facts", "public_research"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data", "before_after_asset"],
    outputType: "research_pack",
    approvalRequired: false,
    liveProviderRequired: false,
    defaultProviderKey: "perplexity_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  seo_planning_agent: {
    role: "seo_planning_agent",
    label: "SEO Planning Agent",
    taskTypes: ["seo_plan"],
    allowedMaterialClasses: ["client_brief", "approved_business_facts", "public_research", "seo_plan"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data", "before_after_asset"],
    outputType: "seo_plan",
    approvalRequired: false,
    liveProviderRequired: false,
    defaultProviderKey: "openai_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  content_drafting_agent: {
    role: "content_drafting_agent",
    label: "Content Drafting Agent",
    taskTypes: ["article_outline", "article_draft"],
    allowedMaterialClasses: [
      "client_brief",
      "approved_business_facts",
      "seo_plan",
      "article_outline",
      "public_research"
    ],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data", "before_after_asset"],
    outputType: "article_draft",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "openai_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  rewrite_localization_agent: {
    role: "rewrite_localization_agent",
    label: "Rewrite / Localization Agent",
    taskTypes: ["rewrite_polish"],
    allowedMaterialClasses: ["article_draft", "social_copy", "approved_business_facts"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data", "before_after_asset"],
    outputType: "article_draft",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "openai_mini_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  compliance_review_agent: {
    role: "compliance_review_agent",
    label: "Compliance Review Agent",
    taskTypes: ["compliance_review"],
    allowedMaterialClasses: ["article_draft", "social_copy", "approved_business_facts", "seo_plan"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data"],
    outputType: "compliance_review",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "anthropic_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  report_narrative_agent: {
    role: "report_narrative_agent",
    label: "Report Narrative Agent",
    taskTypes: ["report_narrative"],
    allowedMaterialClasses: ["report_metrics", "approved_business_facts"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data", "before_after_asset"],
    outputType: "report_narrative",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "openai_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  image_prompt_agent: {
    role: "image_prompt_agent",
    label: "Image Prompt Agent",
    taskTypes: ["image_prompt"],
    allowedMaterialClasses: ["article_draft", "approved_business_facts", "image_prompt"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "before_after_asset", "saas_user_account_billing_data"],
    outputType: "image_prompt",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "openai_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  image_generation_agent: {
    role: "image_generation_agent",
    label: "Image Generation Agent",
    taskTypes: ["image_generation"],
    allowedMaterialClasses: ["image_prompt", "stock_ai_marketing_asset"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "before_after_asset", "saas_user_account_billing_data"],
    outputType: "marketing_image",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "manual_stock_default",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  vision_technical_qa_agent: {
    role: "vision_technical_qa_agent",
    label: "Vision Technical QA Agent",
    taskTypes: ["vision_technical_qa"],
    allowedMaterialClasses: ["before_after_asset"],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data"],
    outputType: "vision_qa_report",
    approvalRequired: true,
    liveProviderRequired: false,
    defaultProviderKey: "vision_qa_placeholder",
    defaultModelId: null,
    disabledSafeFallback: "local_deterministic"
  },
  local_disabled_safe_agent: {
    role: "local_disabled_safe_agent",
    label: "Local Disabled-Safe Agent",
    taskTypes: ["local_deterministic"],
    allowedMaterialClasses: [
      "client_brief",
      "approved_business_facts",
      "public_research",
      "seo_plan",
      "article_outline",
      "article_draft",
      "report_metrics",
      "social_copy",
      "image_prompt"
    ],
    forbiddenMaterialClasses: ["forbidden_medical_data", "saas_user_account_billing_data"],
    outputType: "local_deterministic",
    approvalRequired: false,
    liveProviderRequired: false,
    defaultProviderKey: "local_deterministic",
    defaultModelId: "local-deterministic-v1",
    disabledSafeFallback: "local_deterministic"
  }
};

export function getAiAgentRoleDefinition(role: string): AiAgentRoleDefinition | null {
  return AI_AGENT_ROLE_REGISTRY[role] ?? null;
}
