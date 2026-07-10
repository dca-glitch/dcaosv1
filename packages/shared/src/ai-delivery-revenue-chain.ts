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

export const REVENUE_HUB_ALLOWED_RECOMMENDATION_ACTION_TYPES: readonly RevenueHubRecommendationActionType[] =
  [
    "review_anomaly",
    "follow_up_with_client",
    "prepare_operator_note",
    "check_source_data",
    "defer"
  ] as const;

export interface RevenueHubAiRecommendationGuardV1 {
  advisoryOnly: true;
  allowedActionTypes: RevenueHubRecommendationActionType[];
  paymentExecutionAllowed: false;
  priceChangeAllowed: false;
  refundAllowed: false;
  externalSystemWriteAllowed: false;
  /** Explicit: recommendations never constitute a financial guarantee. */
  financialGuaranteeAllowed: false;
  /** Explicit: no CRM live sync from recommendation actions. */
  crmLiveSyncAllowed: false;
  operatorApprovalRequired: true;
}

/** Canonical advisory-only recommendation guard (G373–G376). */
export const REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD: RevenueHubAiRecommendationGuardV1 = {
  advisoryOnly: true,
  allowedActionTypes: [...REVENUE_HUB_ALLOWED_RECOMMENDATION_ACTION_TYPES],
  paymentExecutionAllowed: false,
  priceChangeAllowed: false,
  refundAllowed: false,
  externalSystemWriteAllowed: false,
  financialGuaranteeAllowed: false,
  crmLiveSyncAllowed: false,
  operatorApprovalRequired: true
};

export interface RevenueHubAiRecommendationContractV1 {
  id: string;
  recordIds: string[];
  actionType: RevenueHubRecommendationActionType;
  summary: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
  /** Explicit advisory disclaimer — never a financial guarantee. */
  financialGuarantee: false;
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

/** Canonical no-live CRM / no-guarantee policy (G373–G376). */
export const REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY: RevenueHubNoLiveCrmPolicy = {
  crmLiveSyncAllowed: false,
  crmWriteBackAllowed: false,
  financialGuaranteeAllowed: false,
  paymentExecutionAllowed: false,
  externalBillingWriteAllowed: false
};

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

/**
 * Returns violations for a candidate Revenue Hub recommendation guard.
 * Used by contract proofs — does not authorize payment/CRM/guarantee actions.
 */
export function findRevenueHubRecommendationGuardViolations(
  guard: Record<string, unknown>
): string[] {
  const violations: string[] = [];
  if (guard.advisoryOnly !== true) {
    violations.push("advisoryOnly");
  }
  if (guard.operatorApprovalRequired !== true) {
    violations.push("operatorApprovalRequired");
  }

  const requiredFalse = [
    "paymentExecutionAllowed",
    "priceChangeAllowed",
    "refundAllowed",
    "externalSystemWriteAllowed",
    "financialGuaranteeAllowed",
    "crmLiveSyncAllowed"
  ] as const;

  for (const key of requiredFalse) {
    if (guard[key] !== false) {
      violations.push(key);
    }
  }

  const allowed = guard.allowedActionTypes;
  if (!Array.isArray(allowed)) {
    violations.push("allowedActionTypes");
  } else {
    const permitted = new Set<string>(REVENUE_HUB_ALLOWED_RECOMMENDATION_ACTION_TYPES);
    for (const action of allowed) {
      if (typeof action !== "string" || !permitted.has(action)) {
        violations.push(`allowedActionTypes:${String(action)}`);
      }
    }
  }

  return violations;
}

/**
 * Returns violations for a candidate no-live CRM policy object.
 */
export function findRevenueHubNoLiveCrmPolicyViolations(
  policy: Record<string, unknown>
): string[] {
  const violations: string[] = [];
  const requiredFalse = [
    "crmLiveSyncAllowed",
    "crmWriteBackAllowed",
    "financialGuaranteeAllowed",
    "paymentExecutionAllowed",
    "externalBillingWriteAllowed"
  ] as const;

  for (const key of requiredFalse) {
    if (policy[key] !== false) {
      violations.push(key);
    }
  }
  return violations;
}

/**
 * Build an advisory-only recommendation with canonical guard (no financial guarantee).
 */
export function buildRevenueHubAiRecommendation(input: {
  id: string;
  recordIds: string[];
  actionType: RevenueHubRecommendationActionType;
  summary: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
}): RevenueHubAiRecommendationContractV1 {
  return {
    id: input.id,
    recordIds: input.recordIds,
    actionType: input.actionType,
    summary: input.summary,
    rationale: input.rationale,
    confidence: input.confidence,
    financialGuarantee: false,
    guard: REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD
  };
}

/**
 * Build an operating contract snapshot with canonical no-live CRM policy.
 */
export function buildRevenueHubOperatingContract(input: {
  tenantId: string;
  clientId: string | null;
  leads?: RevenueHubLeadContractV1[];
  opportunities?: RevenueHubOpportunityContractV1[];
  attributions?: RevenueHubAttributionContractV1[];
  recommendations?: RevenueHubAiRecommendationContractV1[];
}): RevenueHubOperatingContractV1 {
  return {
    version: REVENUE_HUB_OPERATING_CONTRACT_VERSION,
    tenantId: input.tenantId,
    clientId: input.clientId,
    leads: input.leads ?? [],
    opportunities: input.opportunities ?? [],
    attributions: input.attributions ?? [],
    recommendations: input.recommendations ?? [],
    policy: REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY,
    operatorReviewRequired: true,
    clientVisibleByDefault: false
  };
}

/**
 * G605 — Detect financial-guarantee claims on recommendations, opportunities, or policy.
 */
export function findRevenueHubFinancialGuaranteeViolations(
  candidate: Record<string, unknown>
): string[] {
  const violations: string[] = [];

  if (
    Object.prototype.hasOwnProperty.call(candidate, "financialGuarantee") &&
    candidate.financialGuarantee !== false
  ) {
    violations.push("financialGuarantee");
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "financialGuaranteeAllowed") &&
    candidate.financialGuaranteeAllowed !== false
  ) {
    violations.push("financialGuaranteeAllowed");
  }

  const guard = candidate.guard;
  if (guard && typeof guard === "object" && !Array.isArray(guard)) {
    const guardRecord = guard as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(guardRecord, "financialGuaranteeAllowed") &&
      guardRecord.financialGuaranteeAllowed !== false
    ) {
      violations.push("guard.financialGuaranteeAllowed");
    }
  }

  return violations;
}

/**
 * G606 — Detect CRM live-sync / write-back claims on policy, attribution, or guard.
 */
export function findRevenueHubCrmLiveSyncViolations(
  candidate: Record<string, unknown>
): string[] {
  const violations: string[] = [];

  if (
    Object.prototype.hasOwnProperty.call(candidate, "crmLiveSyncAllowed") &&
    candidate.crmLiveSyncAllowed !== false
  ) {
    violations.push("crmLiveSyncAllowed");
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "crmWriteBackAllowed") &&
    candidate.crmWriteBackAllowed !== false
  ) {
    violations.push("crmWriteBackAllowed");
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "crmLiveSynced") &&
    candidate.crmLiveSynced !== false
  ) {
    violations.push("crmLiveSynced");
  }

  const guard = candidate.guard;
  if (guard && typeof guard === "object" && !Array.isArray(guard)) {
    const guardRecord = guard as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(guardRecord, "crmLiveSyncAllowed") &&
      guardRecord.crmLiveSyncAllowed !== false
    ) {
      violations.push("guard.crmLiveSyncAllowed");
    }
  }

  return violations;
}
