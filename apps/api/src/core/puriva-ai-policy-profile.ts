export const PURIVA_AI_POLICY_PROFILE_KEY = "PURIVA_OPERATING_PACK_V1";

export const PURIVA_AI_POLICY_PROFILE = {
  key: PURIVA_AI_POLICY_PROFILE_KEY,
  label: "Puriva AI Pre-Live Policy Profile",
  monthlyAiCapUsd: 100,
  scope: {
    website: true,
    socialMedia: true,
    paidAds: false
  },
  medicalDataCollection: false,
  aiOutputReviewReadyOnly: true,
  complianceReviewRequired: true,
  humanApprovalBeforeClientVisible: true,
  beforeAfter: {
    clientProvidedMarketingAsset: true,
    clientManagesConsent: true,
    originalsTemporary: true,
    workingFilesTemporary: true,
    finalExportRetentionDays: 60,
    visionTechnicalQaOnly: true,
    noOutcomeEnhancement: true
  },
  aiGeneratedPeople: {
    neutralLifestyleWellnessOnly: true,
    noFakeDoctors: true,
    noFakePatients: true,
    noProcedures: true,
    noTreatmentResultImagery: true
  },
  workflowPreset: [
    "client_brief_review",
    "ai_safe_context_pack",
    "research_pack",
    "seo_plan",
    "article_outlines",
    "article_drafts",
    "compliance_review",
    "rewrite_polish",
    "image_prompts",
    "admin_final_review"
  ] as const
} as const;

export type PurivaAiWorkflowPresetStep = (typeof PURIVA_AI_POLICY_PROFILE.workflowPreset)[number];

export function getPurivaAiPolicyProfile() {
  return PURIVA_AI_POLICY_PROFILE;
}

/** Maps Puriva workflow preset steps to orchestrator task types (dry-run wiring). */
export const PURIVA_WORKFLOW_STEP_TASK_MAP: Record<
  PurivaAiWorkflowPresetStep,
  { agentRole: string; taskType: string }
> = {
  client_brief_review: { agentRole: "local_disabled_safe_agent", taskType: "local_deterministic" },
  ai_safe_context_pack: { agentRole: "local_disabled_safe_agent", taskType: "local_deterministic" },
  research_pack: { agentRole: "research_agent", taskType: "research_pack" },
  seo_plan: { agentRole: "seo_planning_agent", taskType: "seo_plan" },
  article_outlines: { agentRole: "seo_planning_agent", taskType: "article_outline" },
  article_drafts: { agentRole: "content_drafting_agent", taskType: "article_draft" },
  compliance_review: { agentRole: "compliance_review_agent", taskType: "compliance_review" },
  rewrite_polish: { agentRole: "rewrite_localization_agent", taskType: "rewrite_polish" },
  image_prompts: { agentRole: "image_prompt_agent", taskType: "image_prompt" },
  admin_final_review: { agentRole: "local_disabled_safe_agent", taskType: "local_deterministic" }
};
