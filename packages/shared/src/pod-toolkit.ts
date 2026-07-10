export const POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION = "POD_TOOLKIT_WORKFLOW_CONTRACT_V1";

export const POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION = "POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_V1";

export type PodToolkitWorkflowStage =
  | "intake"
  | "bounded_research"
  | "angle_planning"
  | "draft_review"
  | "approved_handoff"
  | "archived";

export type PodToolkitResearchSourceOrigin =
  | "operator_note"
  | "approved_url_reference"
  | "uploaded_document"
  | "existing_internal_record";

export interface PodToolkitNoLiveMarketplacePolicy {
  marketplaceLiveLookupAllowed: false;
  broadCrawlingAllowed: false;
  livePublishAllowed: false;
  supplierCredentialAccessAllowed: false;
  /** Explicit: no marketplace listing sync in this contract. */
  marketplaceSyncAllowed: false;
}

export interface PodToolkitResearchSourceReference {
  id: string;
  origin: PodToolkitResearchSourceOrigin;
  title: string;
  sourceUrl: string | null;
  notes: string | null;
}

/** Product idea captured during intake / angle planning. */
export interface PodToolkitIdeaContractV1 {
  id: string;
  title: string;
  conceptSummary: string;
  targetAudienceNote: string | null;
}

/**
 * Prompt / image generation requirement for a POD draft.
 * Does not authorize live image provider calls or marketplace upload.
 */
export interface PodToolkitPromptImageRequirementV1 {
  id: string;
  ideaId: string;
  promptText: string;
  imageBrief: string;
  styleNotes: string | null;
  liveImageGenerationAllowed: false;
}

export interface PodToolkitListingCopyDraftV1 {
  id: string;
  ideaId: string;
  titleDraft: string;
  descriptionDraft: string;
  bulletPoints: string[];
  tags: string[];
}

/**
 * Compliance / IP caution — operator must review before any external use.
 * Not legal advice; contract-level caution only.
 */
export interface PodToolkitComplianceIpCautionV1 {
  trademarkReviewRequired: true;
  copyrightReviewRequired: true;
  likenessConsentRequired: true;
  marketplacePolicyReviewRequired: true;
  legalAdviceClaimed: false;
  cautionSummary: string;
}

export interface PodToolkitDraftBundleContractV1 {
  version: typeof POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION;
  projectId: string;
  tenantId: string;
  idea: PodToolkitIdeaContractV1;
  promptImageRequirement: PodToolkitPromptImageRequirementV1;
  listingCopy: PodToolkitListingCopyDraftV1;
  complianceIpCaution: PodToolkitComplianceIpCautionV1;
  policy: PodToolkitNoLiveMarketplacePolicy;
  operatorReviewRequired: true;
  marketplaceSyncAllowed: false;
}

export interface PodToolkitWorkflowContractV1 {
  version: typeof POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION;
  projectId: string;
  tenantId: string;
  clientId: string | null;
  brandName: string;
  targetMonth: string | null;
  stage: PodToolkitWorkflowStage;
  researchSources: PodToolkitResearchSourceReference[];
  productAngles: string[];
  listingDrafts: string[];
  imageBriefs: string[];
  /** Optional structured draft bundle when stage reaches draft_review+. */
  draftBundle: PodToolkitDraftBundleContractV1 | null;
  policy: PodToolkitNoLiveMarketplacePolicy;
  operatorReviewRequired: true;
}

export const POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION: PodToolkitComplianceIpCautionV1 = {
  trademarkReviewRequired: true,
  copyrightReviewRequired: true,
  likenessConsentRequired: true,
  marketplacePolicyReviewRequired: true,
  legalAdviceClaimed: false,
  cautionSummary:
    "Operator must review trademark, copyright, likeness, and marketplace policy before any external listing use. This caution is not legal advice."
};

export const POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY: PodToolkitNoLiveMarketplacePolicy = {
  marketplaceLiveLookupAllowed: false,
  broadCrawlingAllowed: false,
  livePublishAllowed: false,
  supplierCredentialAccessAllowed: false,
  marketplaceSyncAllowed: false
};
