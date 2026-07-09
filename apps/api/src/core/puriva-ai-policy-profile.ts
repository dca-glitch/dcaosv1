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
