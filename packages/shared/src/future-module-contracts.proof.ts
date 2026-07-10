/**
 * G217–G221 future-module contract proofs.
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
  MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS,
  MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION,
  MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION,
  buildMarketIntelligenceClientSafeSummary,
  buildMarketIntelligenceSourceLabel,
  findForbiddenClientSafeMiFields,
  mapOriginToSourceLabelKind,
  sanitizeMarketIntelligenceClientSafePayload
} from "./market-intelligence";

import {
  REVENUE_HUB_DATA_CONTRACT_VERSION,
  REVENUE_HUB_OPERATING_CONTRACT_VERSION
} from "./ai-delivery-revenue-chain";

import {
  POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION,
  POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
  POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION,
  POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION
} from "./pod-toolkit";

// ---------------------------------------------------------------------------
// G217 — Market Intelligence local result + admin-reviewed source summary
// ---------------------------------------------------------------------------

const marketIntelligenceLocalResultProof = {
  version: MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION,
  projectId: "mi_project_local_only",
  generatedAt: null,
  sourcePolicy: {
    liveCrawlingAllowed: false,
    marketplaceLiveLookupAllowed: false,
    crmLiveLookupAllowed: false,
    allowedOrigins: [
      "operator_note",
      "uploaded_document",
      "approved_url_reference",
      "existing_internal_record"
    ]
  },
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
  },
  operatorReviewRequired: true
} satisfies MarketIntelligenceLocalResultContractV1;

const marketIntelligenceAdminSourceSummaryProof = {
  version: MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION,
  projectId: "mi_project_local_only",
  sourceCount: 1,
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
  ],
  uncontrolledScrapingAllowed: false,
  liveCrawlingAllowed: false,
  operatorReviewRequired: true,
  reviewedAt: "2026-07-10T00:00:00.000Z"
} satisfies MarketIntelligenceAdminReviewedSourceSummaryV1;

// ---------------------------------------------------------------------------
// G218 — MI output sanitization / source-label proofs
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
// G219 — Revenue Hub operating contract (lead / opportunity / attribution)
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

const revenueHubRecommendationProof = {
  id: "recommendation_1",
  recordIds: ["revenue_record_1"],
  actionType: "review_anomaly",
  summary: "Review the revenue movement before taking operator action.",
  rationale: "Recommendations are advisory only and cannot execute billing changes.",
  confidence: "medium",
  guard: {
    advisoryOnly: true,
    allowedActionTypes: [
      "review_anomaly",
      "follow_up_with_client",
      "prepare_operator_note",
      "check_source_data",
      "defer"
    ],
    paymentExecutionAllowed: false,
    priceChangeAllowed: false,
    refundAllowed: false,
    externalSystemWriteAllowed: false,
    operatorApprovalRequired: true
  }
} satisfies RevenueHubAiRecommendationContractV1;

const revenueHubOperatingProof = {
  version: REVENUE_HUB_OPERATING_CONTRACT_VERSION,
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
  recommendations: [revenueHubRecommendationProof],
  policy: {
    crmLiveSyncAllowed: false,
    crmWriteBackAllowed: false,
    financialGuaranteeAllowed: false,
    paymentExecutionAllowed: false,
    externalBillingWriteAllowed: false
  },
  operatorReviewRequired: true,
  clientVisibleByDefault: false
} satisfies RevenueHubOperatingContractV1;

if (revenueHubOperatingProof.opportunities[0]?.financialGuarantee !== false) {
  throw new Error("G219 opportunity must not claim a financial guarantee");
}

if (revenueHubOperatingProof.policy.crmLiveSyncAllowed !== false) {
  throw new Error("G219 CRM live sync must remain disabled");
}

// ---------------------------------------------------------------------------
// G220 — POD Toolkit draft bundle (idea / prompt-image / listing / IP caution)
// ---------------------------------------------------------------------------

const podToolkitDraftBundleProof = {
  version: POD_TOOLKIT_DRAFT_BUNDLE_CONTRACT_VERSION,
  projectId: "pod_project_1",
  tenantId: "tenant_1",
  idea: {
    id: "idea_1",
    title: "Operator-reviewed product idea",
    conceptSummary: "Bounded POD idea for admin draft review only.",
    targetAudienceNote: "Internal planning audience"
  },
  promptImageRequirement: {
    id: "prompt_image_1",
    ideaId: "idea_1",
    promptText: "Clean product mock on neutral background",
    imageBrief: "Square listing mock — no real-person likeness",
    styleNotes: "Draft brief only",
    liveImageGenerationAllowed: false
  },
  listingCopy: {
    id: "listing_1",
    ideaId: "idea_1",
    titleDraft: "Draft listing title",
    descriptionDraft: "Draft listing description for operator review.",
    bulletPoints: ["Operator-reviewed bullet"],
    tags: ["draft"]
  },
  complianceIpCaution: POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION,
  policy: POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
  operatorReviewRequired: true,
  marketplaceSyncAllowed: false
} satisfies PodToolkitDraftBundleContractV1;

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

if (podToolkitWorkflowProof.policy.marketplaceSyncAllowed !== false) {
  throw new Error("G220 marketplace sync must remain disabled");
}

if (podToolkitDraftBundleProof.complianceIpCaution.legalAdviceClaimed !== false) {
  throw new Error("G220 compliance caution must not claim legal advice");
}

if (podToolkitDraftBundleProof.promptImageRequirement.liveImageGenerationAllowed !== false) {
  throw new Error("G220 live image generation must remain disabled");
}

// ---------------------------------------------------------------------------
// G221 — Export / compile stability bundle
// ---------------------------------------------------------------------------

export const futureModuleContractProofs = {
  marketIntelligenceLocalResultProof,
  marketIntelligenceAdminSourceSummaryProof,
  marketIntelligenceClientSafeSummaryProof,
  clientSafeSanitizeResult,
  forbiddenFieldsFound,
  revenueHubDataProof,
  revenueHubRecommendationProof,
  revenueHubOperatingProof,
  podToolkitDraftBundleProof,
  podToolkitWorkflowProof
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
  if (proofs.revenueHubOperatingProof.policy.financialGuaranteeAllowed !== false) {
    throw new Error("G221 Revenue Hub must forbid financial guarantees");
  }
  if (proofs.podToolkitWorkflowProof.policy.marketplaceSyncAllowed !== false) {
    throw new Error("G221 POD toolkit must forbid marketplace sync");
  }
  if (proofs.podToolkitDraftBundleProof.marketplaceSyncAllowed !== false) {
    throw new Error("G221 POD draft bundle must forbid marketplace sync");
  }
  if (
    proofs.marketIntelligenceClientSafeSummaryProof.version !==
    MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION
  ) {
    throw new Error("G221 client-safe MI version drift");
  }
}

assertFutureModuleContractProofs();
