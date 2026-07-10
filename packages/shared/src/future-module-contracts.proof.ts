import type {
  MarketIntelligenceLocalResultContractV1
} from "./market-intelligence";

import type {
  RevenueHubAiRecommendationContractV1,
  RevenueHubDataContractV1
} from "./ai-delivery-revenue-chain";

import type {
  PodToolkitWorkflowContractV1
} from "./pod-toolkit";

import {
  MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION
} from "./market-intelligence";

import {
  REVENUE_HUB_DATA_CONTRACT_VERSION
} from "./ai-delivery-revenue-chain";

import {
  POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION
} from "./pod-toolkit";

const marketIntelligenceLocalResultProof = {
  version: MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION,
  projectId: "mi_project_local_only",
  generatedAt: null,
  sourcePolicy: {
    liveCrawlingAllowed: false,
    marketplaceLiveLookupAllowed: false,
    crmLiveLookupAllowed: false,
    allowedOrigins: ["operator_note", "uploaded_document", "approved_url_reference"]
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

const podToolkitWorkflowProof = {
  version: POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION,
  projectId: "pod_project_1",
  tenantId: "tenant_1",
  clientId: null,
  brandName: "Operator Brand",
  targetMonth: "2026-07",
  stage: "bounded_research",
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
  listingDrafts: [],
  imageBriefs: [],
  policy: {
    marketplaceLiveLookupAllowed: false,
    broadCrawlingAllowed: false,
    livePublishAllowed: false,
    supplierCredentialAccessAllowed: false
  },
  operatorReviewRequired: true
} satisfies PodToolkitWorkflowContractV1;

export const futureModuleContractProofs = {
  marketIntelligenceLocalResultProof,
  revenueHubDataProof,
  revenueHubRecommendationProof,
  podToolkitWorkflowProof
};
