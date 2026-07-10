/**
 * G217–G221 / G369–G388 future-module contract proofs.
 * Imports concrete modules directly (not via index.ts) so shared check stays stable
 * without requiring index re-exports for every new symbol.
 */

import type {
  MarketIntelligenceAdminReviewedSourceSummaryV1,
  MarketIntelligenceClientSafeSummaryContractV1,
  MarketIntelligenceLocalResultContractV1
} from "./market-intelligence";

import type {
  RevenueHubAiRecommendationContractV1,
  RevenueHubDataContractV1,
  RevenueHubOperatingContractV1
} from "./ai-delivery-revenue-chain";

import type {
  PodToolkitDraftBundleContractV1,
  PodToolkitWorkflowContractV1
} from "./pod-toolkit";

import {
  MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION,
  MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS,
  MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS,
  MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION,
  MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY,
  MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION,
  buildMarketIntelligenceAdminReviewedSourceSummary,
  buildMarketIntelligenceClientSafeSummary,
  buildMarketIntelligenceLocalResult,
  buildMarketIntelligenceSourceLabel,
  findForbiddenClientSafeMiFields,
  findMarketIntelligenceSourcePolicyViolations,
  mapOriginToSourceLabelKind,
  sanitizeMarketIntelligenceClientSafePayload
} from "./market-intelligence";

import {
  REVENUE_HUB_DATA_CONTRACT_VERSION,
  REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY,
  REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD,
  REVENUE_HUB_OPERATING_CONTRACT_VERSION,
  buildRevenueHubAiRecommendation,
  buildRevenueHubOperatingContract,
  findRevenueHubNoLiveCrmPolicyViolations,
  findRevenueHubRecommendationGuardViolations
} from "./ai-delivery-revenue-chain";

import {
  POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION,
  POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
  POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION,
  POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION,
  buildPodToolkitDraftBundle,
  buildPodToolkitPromptImageRequirement,
  findPodToolkitComplianceIpCautionViolations,
  findPodToolkitMarketplacePolicyViolations
} from "./pod-toolkit";

// ---------------------------------------------------------------------------
// G217 / G369–G372 — Market Intelligence local result + admin-reviewed sources
// ---------------------------------------------------------------------------

const marketIntelligenceLocalResultProof: MarketIntelligenceLocalResultContractV1 =
  buildMarketIntelligenceLocalResult({
    projectId: "mi_project_local_only",
    generatedAt: null,
    liveSourceStatus: "blocked_by_policy",
    sourceReferences: [
      {
        id: "source_operator_note",
        origin: "operator_note",
        title: "Operator-provided notes",
        sourceUrl: null,
        operatorProvidedAt: "2026-07-10T00:00:00.000Z",
        notes: "Bounded local source only"
      }
    ],
    result: {
      summary: "Local-only market intelligence result.",
      competitors: null,
      audienceSignals: [],
      marketTrends: [],
      opportunities: [],
      threats: [],
      pricingSignals: null,
      contentOrSeoAngles: [],
      recommendedNextActions: ["Review with operator before reuse"],
      sourceNotes: "No live crawling, marketplace lookup, or CRM lookup.",
      confidenceNotes: "Based only on operator-provided source references."
    }
  });

const marketIntelligenceAdminSourceSummaryProof: MarketIntelligenceAdminReviewedSourceSummaryV1 =
  buildMarketIntelligenceAdminReviewedSourceSummary({
    projectId: "mi_project_local_only",
    reviewedAt: "2026-07-10T00:00:00.000Z",
    sources: [
      {
        id: "source_operator_note",
        title: "Operator-provided notes",
        origin: "operator_note",
        label: buildMarketIntelligenceSourceLabel(
          mapOriginToSourceLabelKind("operator_note")
        ),
        sourceUrl: null,
        notes: "Bounded local source only"
      }
    ]
  });

const miSourcePolicyViolations = findMarketIntelligenceSourcePolicyViolations(
  MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY as unknown as Record<string, unknown>
);

const miUnsafeSourcePolicyViolations = findMarketIntelligenceSourcePolicyViolations({
  liveCrawlingAllowed: true,
  marketplaceLiveLookupAllowed: false,
  crmLiveLookupAllowed: false,
  uncontrolledScrapingAllowed: true,
  allowedOrigins: ["operator_note", "live_scrape"]
});

if (miSourcePolicyViolations.length !== 0) {
  throw new Error("G369 default MI source policy must have zero violations");
}

if (!miUnsafeSourcePolicyViolations.includes("liveCrawlingAllowed")) {
  throw new Error("G369 must detect liveCrawlingAllowed violation");
}

if (!miUnsafeSourcePolicyViolations.includes("uncontrolledScrapingAllowed")) {
  throw new Error("G370 must detect uncontrolledScrapingAllowed violation");
}

if (!miUnsafeSourcePolicyViolations.some((v) => v.startsWith("allowedOrigins:"))) {
  throw new Error("G370 must reject non-bounded source origins");
}

if (
  marketIntelligenceLocalResultProof.version !==
  MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION
) {
  throw new Error("G369 unexpected MI local result contract version");
}

if (marketIntelligenceLocalResultProof.sourcePolicy.uncontrolledScrapingAllowed !== false) {
  throw new Error("G370 MI local result must forbid uncontrolled scraping");
}

if (
  MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS.length !==
  marketIntelligenceLocalResultProof.sourcePolicy.allowedOrigins.length
) {
  throw new Error("G369 MI allowed origins must match canonical bounded list");
}

if (marketIntelligenceAdminSourceSummaryProof.operatorReviewRequired !== true) {
  throw new Error("G372 MI admin source summary requires operator review");
}

if (marketIntelligenceAdminSourceSummaryProof.uncontrolledScrapingAllowed !== false) {
  throw new Error("G370 MI admin source summary must forbid uncontrolled scraping");
}

// ---------------------------------------------------------------------------
// G218 / G371 — MI output sanitization / source-label proofs
// ---------------------------------------------------------------------------

const marketIntelligenceClientSafeSummaryProof: MarketIntelligenceClientSafeSummaryContractV1 =
  buildMarketIntelligenceClientSafeSummary({
    title: "Client-safe market summary",
    marketSummary: "Operator-reviewed summary for client visibility.",
    opportunities: ["Clarify educational positioning"],
    recommendedActions: ["Review with admin before reuse"],
    status: "READY",
    sourceLabelKind: "operator_reviewed_placeholder"
  });

const unsafeClientSafeCandidate: Record<string, unknown> = {
  title: "Leak candidate",
  marketSummary: "Should keep",
  opportunities: ["ok"],
  recommendedActions: ["ok"],
  status: "READY",
  tenantId: "must-strip",
  storageKey: "must-strip",
  executionLog: "must-strip",
  reviewerNotes: "must-strip",
  resultData: { raw: true },
  sourceUrl: "https://example.invalid/internal",
  sourceNotes: "must-strip",
  confidenceNotes: "must-strip",
  provider: "must-strip",
  prompt: "must-strip",
  rawFindings: [],
  researchRunId: "must-strip",
  insightId: "must-strip"
};

const clientSafeSanitizeResult = sanitizeMarketIntelligenceClientSafePayload(
  unsafeClientSafeCandidate
);

const forbiddenFieldsFound = findForbiddenClientSafeMiFields(unsafeClientSafeCandidate);

if (clientSafeSanitizeResult.removedFields.length === 0) {
  throw new Error("G218 expected forbidden MI fields to be stripped");
}

if (forbiddenFieldsFound.length !== MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS.length) {
  throw new Error("G218 expected all forbidden MI fields to be detected on unsafe candidate");
}

if (clientSafeSanitizeResult.sanitized.tenantId !== undefined) {
  throw new Error("G218 tenantId must not remain on sanitized client-safe payload");
}

if (marketIntelligenceClientSafeSummaryProof.rawInternalsExposed !== false) {
  throw new Error("G218 client-safe summary must not expose raw internals");
}

if (marketIntelligenceClientSafeSummaryProof.adminReviewed !== true) {
  throw new Error("G372 client-safe summary requires admin review");
}

if (marketIntelligenceClientSafeSummaryProof.sourceLabel.liveCrawlImplied !== false) {
  throw new Error("G218 source label must not imply live crawl");
}

if (
  marketIntelligenceClientSafeSummaryProof.version !==
  MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION
) {
  throw new Error("G218 unexpected client-safe summary contract version");
}

// ---------------------------------------------------------------------------
// G219 / G373–G376 — Revenue Hub operating contract + recommendation guards
// ---------------------------------------------------------------------------

const revenueHubDataProof = {
  version: REVENUE_HUB_DATA_CONTRACT_VERSION,
  tenantId: "tenant_1",
  clientId: "client_1",
  records: [
    {
      id: "revenue_record_1",
      tenantId: "tenant_1",
      clientId: "client_1",
      source: "manual_entry",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      currencyCode: "USD",
      grossAmountMinor: 100000,
      netAmountMinor: null,
      label: "Manual revenue note",
      sourceReference: null,
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z"
    }
  ],
  connectorWriteAccessAllowed: false,
  paymentExecutionAllowed: false,
  clientVisibleByDefault: false
} satisfies RevenueHubDataContractV1;

const revenueHubRecommendationProof: RevenueHubAiRecommendationContractV1 =
  buildRevenueHubAiRecommendation({
    id: "recommendation_1",
    recordIds: ["revenue_record_1"],
    actionType: "review_anomaly",
    summary: "Review the revenue movement before taking operator action.",
    rationale: "Recommendations are advisory only and cannot execute billing changes.",
    confidence: "medium"
  });

const revenueHubOperatingProof: RevenueHubOperatingContractV1 = buildRevenueHubOperatingContract({
  tenantId: "tenant_1",
  clientId: "client_1",
  leads: [
    {
      id: "lead_1",
      tenantId: "tenant_1",
      clientId: "client_1",
      displayName: "Manual lead note",
      status: "qualified",
      sourceNote: "Operator-entered lead — no CRM live sync",
      ownerOperatorId: "operator_1",
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z"
    }
  ],
  opportunities: [
    {
      id: "opportunity_1",
      tenantId: "tenant_1",
      clientId: "client_1",
      leadId: "lead_1",
      title: "Advisory opportunity draft",
      stage: "discovery",
      estimatedValueMinor: 250000,
      currencyCode: "USD",
      financialGuarantee: false,
      notes: "Estimate only — not a financial guarantee",
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z"
    }
  ],
  attributions: [
    {
      id: "attribution_1",
      tenantId: "tenant_1",
      clientId: "client_1",
      leadId: "lead_1",
      opportunityId: "opportunity_1",
      channel: "manual_entry",
      campaignLabel: null,
      attributionNote: "Manual attribution — CRM live sync disabled",
      recordedAt: "2026-07-10T00:00:00.000Z",
      crmLiveSynced: false
    }
  ],
  recommendations: [revenueHubRecommendationProof]
});

const rhGuardViolations = findRevenueHubRecommendationGuardViolations(
  REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD as unknown as Record<string, unknown>
);

const rhUnsafeGuardViolations = findRevenueHubRecommendationGuardViolations({
  advisoryOnly: false,
  allowedActionTypes: ["execute_payment"],
  paymentExecutionAllowed: true,
  priceChangeAllowed: false,
  refundAllowed: false,
  externalSystemWriteAllowed: false,
  financialGuaranteeAllowed: true,
  crmLiveSyncAllowed: true,
  operatorApprovalRequired: false
});

const rhPolicyViolations = findRevenueHubNoLiveCrmPolicyViolations(
  REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY as unknown as Record<string, unknown>
);

if (rhGuardViolations.length !== 0) {
  throw new Error("G374 default recommendation guard must have zero violations");
}

if (!rhUnsafeGuardViolations.includes("paymentExecutionAllowed")) {
  throw new Error("G374 must detect paymentExecutionAllowed violation");
}

if (!rhUnsafeGuardViolations.includes("financialGuaranteeAllowed")) {
  throw new Error("G375 must detect financialGuaranteeAllowed violation");
}

if (!rhUnsafeGuardViolations.includes("crmLiveSyncAllowed")) {
  throw new Error("G376 must detect crmLiveSyncAllowed violation");
}

if (rhPolicyViolations.length !== 0) {
  throw new Error("G376 default no-live CRM policy must have zero violations");
}

if (revenueHubRecommendationProof.financialGuarantee !== false) {
  throw new Error("G375 recommendation must not claim a financial guarantee");
}

if (revenueHubRecommendationProof.guard.financialGuaranteeAllowed !== false) {
  throw new Error("G375 recommendation guard must forbid financial guarantees");
}

if (revenueHubOperatingProof.opportunities[0]?.financialGuarantee !== false) {
  throw new Error("G219 opportunity must not claim a financial guarantee");
}

if (revenueHubOperatingProof.policy.crmLiveSyncAllowed !== false) {
  throw new Error("G219 CRM live sync must remain disabled");
}

if (revenueHubOperatingProof.version !== REVENUE_HUB_OPERATING_CONTRACT_VERSION) {
  throw new Error("G373 unexpected Revenue Hub operating contract version");
}

// ---------------------------------------------------------------------------
// G220 / G377–G380 — POD Toolkit draft bundle (idea / prompt-image / listing / IP)
// ---------------------------------------------------------------------------

const podToolkitDraftBundleProof: PodToolkitDraftBundleContractV1 = buildPodToolkitDraftBundle({
  projectId: "pod_project_1",
  tenantId: "tenant_1",
  idea: {
    id: "idea_1",
    title: "Operator-reviewed product idea",
    conceptSummary: "Bounded POD idea for admin draft review only.",
    targetAudienceNote: "Internal planning audience"
  },
  promptImageRequirement: buildPodToolkitPromptImageRequirement({
    id: "prompt_image_1",
    ideaId: "idea_1",
    promptText: "Clean product mock on neutral background",
    imageBrief: "Square listing mock — no real-person likeness",
    styleNotes: "Draft brief only"
  }),
  listingCopy: {
    id: "listing_1",
    ideaId: "idea_1",
    titleDraft: "Draft listing title",
    descriptionDraft: "Draft listing description for operator review.",
    bulletPoints: ["Operator-reviewed bullet"],
    tags: ["draft"]
  }
});

const podToolkitWorkflowProof = {
  version: POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION,
  projectId: "pod_project_1",
  tenantId: "tenant_1",
  clientId: null,
  brandName: "Operator Brand",
  targetMonth: "2026-07",
  stage: "draft_review",
  researchSources: [
    {
      id: "pod_source_1",
      origin: "approved_url_reference",
      title: "Operator-approved product reference",
      sourceUrl: "https://example.invalid/reference",
      notes: "Manual reference only"
    }
  ],
  productAngles: ["Operator-reviewed angle"],
  listingDrafts: ["Draft listing title"],
  imageBriefs: ["Square listing mock — no real-person likeness"],
  draftBundle: podToolkitDraftBundleProof,
  policy: POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
  operatorReviewRequired: true
} satisfies PodToolkitWorkflowContractV1;

const podPolicyViolations = findPodToolkitMarketplacePolicyViolations(
  POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY as unknown as Record<string, unknown>
);

const podUnsafePolicyViolations = findPodToolkitMarketplacePolicyViolations({
  marketplaceLiveLookupAllowed: false,
  broadCrawlingAllowed: false,
  livePublishAllowed: false,
  supplierCredentialAccessAllowed: false,
  marketplaceSyncAllowed: true
});

const podCautionViolations = findPodToolkitComplianceIpCautionViolations(
  POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION as unknown as Record<string, unknown>
);

const podUnsafeCautionViolations = findPodToolkitComplianceIpCautionViolations({
  trademarkReviewRequired: false,
  copyrightReviewRequired: true,
  likenessConsentRequired: true,
  marketplacePolicyReviewRequired: true,
  legalAdviceClaimed: true,
  cautionSummary: "unsafe"
});

if (podPolicyViolations.length !== 0) {
  throw new Error("G379 default POD marketplace policy must have zero violations");
}

if (!podUnsafePolicyViolations.includes("marketplaceSyncAllowed")) {
  throw new Error("G379 must detect marketplaceSyncAllowed violation");
}

if (podCautionViolations.length !== 0) {
  throw new Error("G378 default POD IP caution must have zero violations");
}

if (!podUnsafeCautionViolations.includes("trademarkReviewRequired")) {
  throw new Error("G378 must detect missing trademark review requirement");
}

if (!podUnsafeCautionViolations.includes("legalAdviceClaimed")) {
  throw new Error("G378 must detect legalAdviceClaimed violation");
}

if (podToolkitWorkflowProof.policy.marketplaceSyncAllowed !== false) {
  throw new Error("G220 marketplace sync must remain disabled");
}

if (podToolkitDraftBundleProof.complianceIpCaution.legalAdviceClaimed !== false) {
  throw new Error("G220 compliance caution must not claim legal advice");
}

if (podToolkitDraftBundleProof.promptImageRequirement.liveImageGenerationAllowed !== false) {
  throw new Error("G380 live image generation must remain disabled");
}

if (podToolkitDraftBundleProof.marketplaceSyncAllowed !== false) {
  throw new Error("G379 POD draft bundle must forbid marketplace sync");
}

if (podToolkitDraftBundleProof.version !== POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION) {
  throw new Error("G377 unexpected POD draft bundle contract version");
}

// ---------------------------------------------------------------------------
// G221 / G381 — Export / compile stability bundle
// ---------------------------------------------------------------------------

export const futureModuleContractProofs = {
  marketIntelligenceLocalResultProof,
  marketIntelligenceAdminSourceSummaryProof,
  marketIntelligenceClientSafeSummaryProof,
  clientSafeSanitizeResult,
  forbiddenFieldsFound,
  miSourcePolicyViolations,
  miUnsafeSourcePolicyViolations,
  revenueHubDataProof,
  revenueHubRecommendationProof,
  revenueHubOperatingProof,
  rhGuardViolations,
  rhUnsafeGuardViolations,
  rhPolicyViolations,
  podToolkitDraftBundleProof,
  podToolkitWorkflowProof,
  podPolicyViolations,
  podUnsafePolicyViolations,
  podCautionViolations,
  podUnsafeCautionViolations
};

/** Compile-time / runtime smoke that proofs remain importable and version-stable. */
export function assertFutureModuleContractProofs(): void {
  const proofs = futureModuleContractProofs;
  if (proofs.marketIntelligenceLocalResultProof.operatorReviewRequired !== true) {
    throw new Error("G221 MI local result requires operator review");
  }
  if (proofs.marketIntelligenceAdminSourceSummaryProof.uncontrolledScrapingAllowed !== false) {
    throw new Error("G221 MI admin source summary must forbid uncontrolled scraping");
  }
  if (
    proofs.marketIntelligenceLocalResultProof.sourcePolicy.uncontrolledScrapingAllowed !== false
  ) {
    throw new Error("G369 MI local result source policy must forbid uncontrolled scraping");
  }
  if (proofs.revenueHubOperatingProof.policy.financialGuaranteeAllowed !== false) {
    throw new Error("G221 Revenue Hub must forbid financial guarantees");
  }
  if (proofs.revenueHubRecommendationProof.financialGuarantee !== false) {
    throw new Error("G375 Revenue Hub recommendation must forbid financial guarantees");
  }
  if (proofs.revenueHubRecommendationProof.guard.crmLiveSyncAllowed !== false) {
    throw new Error("G376 Revenue Hub recommendation guard must forbid CRM live sync");
  }
  if (proofs.podToolkitWorkflowProof.policy.marketplaceSyncAllowed !== false) {
    throw new Error("G221 POD toolkit must forbid marketplace sync");
  }
  if (proofs.podToolkitDraftBundleProof.marketplaceSyncAllowed !== false) {
    throw new Error("G221 POD draft bundle must forbid marketplace sync");
  }
  if (
    proofs.podToolkitDraftBundleProof.promptImageRequirement.liveImageGenerationAllowed !== false
  ) {
    throw new Error("G380 POD prompt/image requirement must forbid live image generation");
  }
  if (
    proofs.marketIntelligenceClientSafeSummaryProof.version !==
    MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION
  ) {
    throw new Error("G221 client-safe MI version drift");
  }
  if (
    proofs.marketIntelligenceAdminSourceSummaryProof.version !==
    MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION
  ) {
    throw new Error("G381 MI admin source summary version drift");
  }
}

assertFutureModuleContractProofs();
