export type AiDeliveryRevenueChainReadinessStatus = "ready" | "warning" | "missing" | "optional";

export interface AiDeliveryRevenueChainReadinessCheck {
  key: string;
  label: string;
  status: AiDeliveryRevenueChainReadinessStatus;
  detail: string;
}

export interface AiDeliveryRevenueChainReadinessResponse {
  projectId: string;
  projectName: string;
  targetMonth: string;
  overallStatus: "ready" | "partial" | "blocked";
  checks: AiDeliveryRevenueChainReadinessCheck[];
  warnings: string[];
}

export const REVENUE_HUB_DATA_CONTRACT_VERSION = "REVENUE_HUB_DATA_CONTRACT_V1";

export type RevenueHubRecordSource =
  | "manual_entry"
  | "finance_reference"
  | "read_only_connector_snapshot";

export type RevenueHubRecommendationActionType =
  | "review_anomaly"
  | "follow_up_with_client"
  | "prepare_operator_note"
  | "check_source_data"
  | "defer";

export interface RevenueHubRevenueRecordContractV1 {
  id: string;
  tenantId: string;
  clientId: string | null;
  source: RevenueHubRecordSource;
  periodStart: string;
  periodEnd: string;
  currencyCode: string;
  grossAmountMinor: number;
  netAmountMinor: number | null;
  label: string;
  sourceReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueHubDataContractV1 {
  version: typeof REVENUE_HUB_DATA_CONTRACT_VERSION;
  tenantId: string;
  clientId: string | null;
  records: RevenueHubRevenueRecordContractV1[];
  connectorWriteAccessAllowed: false;
  paymentExecutionAllowed: false;
  clientVisibleByDefault: false;
}

export interface RevenueHubAiRecommendationGuardV1 {
  advisoryOnly: true;
  allowedActionTypes: RevenueHubRecommendationActionType[];
  paymentExecutionAllowed: false;
  priceChangeAllowed: false;
  refundAllowed: false;
  externalSystemWriteAllowed: false;
  operatorApprovalRequired: true;
}

export interface RevenueHubAiRecommendationContractV1 {
  id: string;
  recordIds: string[];
  actionType: RevenueHubRecommendationActionType;
  summary: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
  guard: RevenueHubAiRecommendationGuardV1;
}

// ---------------------------------------------------------------------------
// G219 — Revenue Hub operating contract (lead / opportunity / attribution)
// ---------------------------------------------------------------------------

export const REVENUE_HUB_OPERATING_CONTRACT_VERSION = "REVENUE_HUB_OPERATING_CONTRACT_V1";

export type RevenueHubLeadStatus =
  | "new"
  | "qualified"
  | "nurturing"
  | "converted"
  | "disqualified"
  | "archived";

export type RevenueHubOpportunityStage =
  | "identified"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "deferred";

export type RevenueHubAttributionChannel =
  | "manual_entry"
  | "referral"
  | "organic_search"
  | "paid_campaign"
  | "partner"
  | "unknown";

/** Explicit CRM / finance execution policy — all live sync and guarantees disabled. */
export interface RevenueHubNoLiveCrmPolicy {
  crmLiveSyncAllowed: false;
  crmWriteBackAllowed: false;
  financialGuaranteeAllowed: false;
  paymentExecutionAllowed: false;
  externalBillingWriteAllowed: false;
}

export interface RevenueHubLeadContractV1 {
  id: string;
  tenantId: string;
  clientId: string | null;
  displayName: string;
  status: RevenueHubLeadStatus;
  sourceNote: string | null;
  ownerOperatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueHubOpportunityContractV1 {
  id: string;
  tenantId: string;
  clientId: string | null;
  leadId: string | null;
  title: string;
  stage: RevenueHubOpportunityStage;
  /** Advisory estimate only — never a financial guarantee. */
  estimatedValueMinor: number | null;
  currencyCode: string | null;
  financialGuarantee: false;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueHubAttributionContractV1 {
  id: string;
  tenantId: string;
  clientId: string | null;
  leadId: string | null;
  opportunityId: string | null;
  channel: RevenueHubAttributionChannel;
  campaignLabel: string | null;
  /** Operator-entered attribution note; not a live CRM sync artifact. */
  attributionNote: string | null;
  recordedAt: string;
  crmLiveSynced: false;
}

export interface RevenueHubOperatingContractV1 {
  version: typeof REVENUE_HUB_OPERATING_CONTRACT_VERSION;
  tenantId: string;
  clientId: string | null;
  leads: RevenueHubLeadContractV1[];
  opportunities: RevenueHubOpportunityContractV1[];
  attributions: RevenueHubAttributionContractV1[];
  recommendations: RevenueHubAiRecommendationContractV1[];
  policy: RevenueHubNoLiveCrmPolicy;
  operatorReviewRequired: true;
  clientVisibleByDefault: false;
}
