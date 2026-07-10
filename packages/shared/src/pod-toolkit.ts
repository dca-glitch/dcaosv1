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

/**
 * Build a prompt/image requirement that never authorizes live image generation
 * or marketplace upload (G377–G380).
 */
export function buildPodToolkitPromptImageRequirement(input: {
  id: string;
  ideaId: string;
  promptText: string;
  imageBrief: string;
  styleNotes?: string | null;
}): PodToolkitPromptImageRequirementV1 {
  return {
    id: input.id,
    ideaId: input.ideaId,
    promptText: input.promptText,
    imageBrief: input.imageBrief,
    styleNotes: input.styleNotes ?? null,
    liveImageGenerationAllowed: false
  };
}

/**
 * Build a draft bundle with mandatory IP/compliance caution and no-live marketplace policy.
 */
export function buildPodToolkitDraftBundle(input: {
  projectId: string;
  tenantId: string;
  idea: PodToolkitIdeaContractV1;
  promptImageRequirement: Omit<PodToolkitPromptImageRequirementV1, "liveImageGenerationAllowed"> & {
    liveImageGenerationAllowed?: false;
  };
  listingCopy: PodToolkitListingCopyDraftV1;
  complianceIpCaution?: PodToolkitComplianceIpCautionV1;
}): PodToolkitDraftBundleContractV1 {
  return {
    version: POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION,
    projectId: input.projectId,
    tenantId: input.tenantId,
    idea: input.idea,
    promptImageRequirement: {
      ...input.promptImageRequirement,
      liveImageGenerationAllowed: false
    },
    listingCopy: input.listingCopy,
    complianceIpCaution: input.complianceIpCaution ?? POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION,
    policy: POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
    operatorReviewRequired: true,
    marketplaceSyncAllowed: false
  };
}

/**
 * Returns policy violations for a candidate POD no-live marketplace policy object.
 * Used by contract proofs — does not mutate input.
 */
export function findPodToolkitMarketplacePolicyViolations(
  policy: Record<string, unknown>
): string[] {
  const violations: string[] = [];
  const requiredFalse = [
    "marketplaceLiveLookupAllowed",
    "broadCrawlingAllowed",
    "livePublishAllowed",
    "supplierCredentialAccessAllowed",
    "marketplaceSyncAllowed"
  ] as const;

  for (const key of requiredFalse) {
    if (policy[key] !== false) {
      violations.push(key);
    }
  }
  return violations;
}

/**
 * Returns compliance/IP caution violations (must require reviews; must not claim legal advice).
 */
export function findPodToolkitComplianceIpCautionViolations(
  caution: Record<string, unknown>
): string[] {
  const violations: string[] = [];
  const requiredTrue = [
    "trademarkReviewRequired",
    "copyrightReviewRequired",
    "likenessConsentRequired",
    "marketplacePolicyReviewRequired"
  ] as const;

  for (const key of requiredTrue) {
    if (caution[key] !== true) {
      violations.push(key);
    }
  }
  if (caution.legalAdviceClaimed !== false) {
    violations.push("legalAdviceClaimed");
  }
  return violations;
}

/**
 * G609 — Detect marketplace sync / live publish claims on policy or draft bundle.
 */
export function findPodToolkitMarketplaceSyncViolations(
  candidate: Record<string, unknown>
): string[] {
  const violations: string[] = [];

  if (
    Object.prototype.hasOwnProperty.call(candidate, "marketplaceSyncAllowed") &&
    candidate.marketplaceSyncAllowed !== false
  ) {
    violations.push("marketplaceSyncAllowed");
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "livePublishAllowed") &&
    candidate.livePublishAllowed !== false
  ) {
    violations.push("livePublishAllowed");
  }

  const policy = candidate.policy;
  if (policy && typeof policy === "object" && !Array.isArray(policy)) {
    const policyRecord = policy as Record<string, unknown>;
    for (const key of ["marketplaceSyncAllowed", "livePublishAllowed"] as const) {
      if (
        Object.prototype.hasOwnProperty.call(policyRecord, key) &&
        policyRecord[key] !== false
      ) {
        violations.push(`policy.${key}`);
      }
    }
  }

  return violations;
}

/**
 * G610 — Detect live image generation claims on prompt/image requirements or draft bundles.
 */
export function findPodToolkitLiveImageViolations(
  candidate: Record<string, unknown>
): string[] {
  const violations: string[] = [];

  if (
    Object.prototype.hasOwnProperty.call(candidate, "liveImageGenerationAllowed") &&
    candidate.liveImageGenerationAllowed !== false
  ) {
    violations.push("liveImageGenerationAllowed");
  }

  const promptImage = candidate.promptImageRequirement;
  if (promptImage && typeof promptImage === "object" && !Array.isArray(promptImage)) {
    const promptRecord = promptImage as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(promptRecord, "liveImageGenerationAllowed") &&
      promptRecord.liveImageGenerationAllowed !== false
    ) {
      violations.push("promptImageRequirement.liveImageGenerationAllowed");
    }
  }

  return violations;
}
