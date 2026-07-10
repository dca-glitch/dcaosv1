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
