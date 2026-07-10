export interface MarketIntelligenceProjectSummary {
  id: string;
  clientId: string | null;
  client: { id: string; name: string; website: string | null } | null;
  title: string;
  description: string | null;
  keywords: string | null;
  competitors: string | null;
  niche: string | null;
  productServiceFocus: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  status: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceSourceSummary {
  id: string;
  projectId: string;
  title: string;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceNotes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceResearchRunSummary {
  id: string;
  projectId: string;
  status: string;
  resultSummary: string | null;
  executionLog: string | null;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number; // Number of sources analyzed (evidence context)
  generatedInsightId?: string | null; // ID of the insight generated from this run
}

export interface MarketIntelligenceInsightResultV1 {
  summary: string | null;
  competitors: string[] | null;
  audienceSignals: string[] | null;
  marketTrends: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  pricingSignals: string[] | null;
  contentOrSeoAngles: string[] | null;
  recommendedNextActions: string[] | null;
  sourceNotes: string | null;
  confidenceNotes: string | null;
}

export const MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION =
  "MARKET_INTELLIGENCE_LOCAL_RESULT_V1";

export type MarketIntelligenceSourceOrigin =
  | "operator_note"
  | "uploaded_document"
  | "approved_url_reference"
  | "existing_internal_record";

export type MarketIntelligenceLiveSourceStatus = "not_requested" | "blocked_by_policy";

export const MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS: readonly MarketIntelligenceSourceOrigin[] =
  [
    "operator_note",
    "uploaded_document",
    "approved_url_reference",
    "existing_internal_record"
  ] as const;

export interface MarketIntelligenceNoLiveSourcePolicy {
  liveCrawlingAllowed: false;
  marketplaceLiveLookupAllowed: false;
  crmLiveLookupAllowed: false;
  /** Explicit: no uncontrolled scraping in this contract. */
  uncontrolledScrapingAllowed: false;
  allowedOrigins: MarketIntelligenceSourceOrigin[];
}

/** Canonical no-live / no-scrape MI source policy (G369–G372). */
export const MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY: MarketIntelligenceNoLiveSourcePolicy =
  {
    liveCrawlingAllowed: false,
    marketplaceLiveLookupAllowed: false,
    crmLiveLookupAllowed: false,
    uncontrolledScrapingAllowed: false,
    allowedOrigins: [...MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS]
  };

export interface MarketIntelligenceLocalSourceReference {
  id: string;
  origin: MarketIntelligenceSourceOrigin;
  title: string;
  sourceUrl: string | null;
  operatorProvidedAt: string | null;
  notes: string | null;
}

export interface MarketIntelligenceLocalResultContractV1 {
  version: typeof MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION;
  projectId: string;
  generatedAt: string | null;
  sourcePolicy: MarketIntelligenceNoLiveSourcePolicy;
  liveSourceStatus: MarketIntelligenceLiveSourceStatus;
  sourceReferences: MarketIntelligenceLocalSourceReference[];
  result: MarketIntelligenceInsightResultV1;
  operatorReviewRequired: true;
}

export interface MarketIntelligenceInsightSummary {
  id: string;
  projectId: string;
  title: string;
  summary: string | null;
  resultData: MarketIntelligenceInsightResultV1 | null;
  status: string;
  reviewerNotes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number; // Number of sources in the project (evidence context)
}

// Internal handoff bridge — admin-only, not client-facing
export interface MarketIntelligenceHandoffSummary {
  id: string;
  projectId: string;
  insightId: string;
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: string[] | null;
  opportunities: string[] | null;
  risks: string[] | null;
  recommendedActions: string[] | null;
  sourceNote: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  handoffStatus: string; // DRAFT | READY | APPLIED | ARCHIVED
  isArchived: boolean;
  aiDeliveryProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceFindingSummary {
  id: string;
  projectId: string;
  researchRunId: string | null;
  sourceId: string | null;
  findingCategory: string;
  findingText: string;
  priority: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceSummaryRecord {
  id: string;
  projectId: string;
  clientId: string | null;
  title: string;
  summaryText: string;
  status: string;
  sourceNotes: string | null;
  integrationContext: Record<string, unknown> | null;
  isArchived: boolean;
  finalizedAt: string | null;
  aiDeliveryProjectId: string | null;
  appliedAt: string | null;
  linkage?: MarketIntelligenceSummaryLinkageSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceSummaryLinkageSummary {
  aiDeliveryProjectId: string | null;
  aiDeliveryProjectName: string | null;
  monthlyReportId: string | null;
  monthlyReportTitle: string | null;
  appliedAt: string | null;
}

export interface MarketIntelligenceFinalizedSummaryPickerItem {
  id: string;
  projectId: string;
  title: string;
  status: string;
  clientId: string | null;
  finalizedAt: string | null;
  appliedAt: string | null;
  aiDeliveryProjectId: string | null;
}

export interface MarketIntelligenceSummaryApplyTargetRequest {
  target?: "delivery" | "brief" | "seo" | "monthly_report" | null;
  aiDeliveryProjectId?: string | null;
  reportId?: string | null;
}

export interface AiDeliveryMiSummaryContextSummary {
  id: string;
  projectId: string;
  title: string;
  status: string;
  sourceNotes: string | null;
  aiDeliveryProjectId: string | null;
  appliedAt: string | null;
  finalizedAt: string | null;
}

export interface AiDeliveryMiSummaryContextResponse {
  summaries: AiDeliveryMiSummaryContextSummary[];
}

export interface AiDeliveryMiSummaryApplyRequest {
  summaryId?: string | null;
}

// ---------------------------------------------------------------------------
// G217–G218 — Client-safe MI summary + source-label sanitization contracts
// ---------------------------------------------------------------------------

export const MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION =
  "MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_V1";

export const MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION =
  "MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_V1";

/** Fields that must never appear on a client-safe MI summary payload. */
export const MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS = [
  "tenantId",
  "storageKey",
  "executionLog",
  "reviewerNotes",
  "resultData",
  "sourceUrl",
  "sourceNotes",
  "confidenceNotes",
  "provider",
  "prompt",
  "rawFindings",
  "researchRunId",
  "insightId"
] as const;

export type MarketIntelligenceClientSafeForbiddenField =
  (typeof MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS)[number];

export type MarketIntelligenceSourceLabelKind =
  | "operator_reviewed_placeholder"
  | "approved_url_reference"
  | "uploaded_document"
  | "existing_internal_record"
  | "admin_curated_note";

export interface MarketIntelligenceSourceLabelV1 {
  kind: MarketIntelligenceSourceLabelKind;
  /** Human-readable label safe for admin UI; never implies live crawl proof. */
  displayLabel: string;
  liveCrawlImplied: false;
  marketplaceLookupImplied: false;
}

export interface MarketIntelligenceAdminReviewedSourceSummaryV1 {
  version: typeof MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION;
  projectId: string;
  sourceCount: number;
  sources: Array<{
    id: string;
    title: string;
    origin: MarketIntelligenceSourceOrigin;
    label: MarketIntelligenceSourceLabelV1;
    /** Admin-only URL reference; omitted from client-safe payloads. */
    sourceUrl: string | null;
    notes: string | null;
  }>;
  /** Explicit policy: no uncontrolled scraping / live crawl. */
  uncontrolledScrapingAllowed: false;
  liveCrawlingAllowed: false;
  operatorReviewRequired: true;
  reviewedAt: string | null;
}

/**
 * Client-visible MI summary only — no raw internals, URLs, prompts, or run metadata.
 * Admin must approve before any client exposure.
 */
export interface MarketIntelligenceClientSafeSummaryContractV1 {
  version: typeof MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION;
  title: string;
  marketSummary: string | null;
  opportunities: string[];
  recommendedActions: string[];
  status: "READY" | "APPLIED";
  /** Provenance label only — never a live source claim. */
  sourceLabel: MarketIntelligenceSourceLabelV1;
  adminReviewed: true;
  rawInternalsExposed: false;
}

const SOURCE_LABEL_DISPLAY: Record<MarketIntelligenceSourceLabelKind, string> = {
  operator_reviewed_placeholder: "Operator-reviewed placeholder (not live research)",
  approved_url_reference: "Approved URL reference (manual)",
  uploaded_document: "Uploaded document (operator-provided)",
  existing_internal_record: "Existing internal record",
  admin_curated_note: "Admin-curated note"
};

export function buildMarketIntelligenceSourceLabel(
  kind: MarketIntelligenceSourceLabelKind
): MarketIntelligenceSourceLabelV1 {
  return {
    kind,
    displayLabel: SOURCE_LABEL_DISPLAY[kind],
    liveCrawlImplied: false,
    marketplaceLookupImplied: false
  };
}

export function mapOriginToSourceLabelKind(
  origin: MarketIntelligenceSourceOrigin
): MarketIntelligenceSourceLabelKind {
  switch (origin) {
    case "operator_note":
      return "admin_curated_note";
    case "uploaded_document":
      return "uploaded_document";
    case "approved_url_reference":
      return "approved_url_reference";
    case "existing_internal_record":
      return "existing_internal_record";
    default: {
      const _exhaustive: never = origin;
      return _exhaustive;
    }
  }
}

const CLIENT_SAFE_FORBIDDEN_KEY_SET = new Set<string>(
  MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS
);

/**
 * Returns forbidden keys present on a candidate client-safe payload.
 * Used by contract proofs — does not mutate input.
 */
export function findForbiddenClientSafeMiFields(
  payload: Record<string, unknown>
): MarketIntelligenceClientSafeForbiddenField[] {
  return MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS.filter((key) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  );
}

/**
 * Strip forbidden internal keys from a candidate MI summary object.
 * Preserves only client-safe surface fields when present.
 */
export function sanitizeMarketIntelligenceClientSafePayload(
  candidate: Record<string, unknown>
): {
  sanitized: Record<string, unknown>;
  removedFields: string[];
  wasSanitized: boolean;
} {
  const removedFields: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(candidate)) {
    if (CLIENT_SAFE_FORBIDDEN_KEY_SET.has(key)) {
      removedFields.push(key);
      continue;
    }
    sanitized[key] = value;
  }

  return {
    sanitized,
    removedFields,
    wasSanitized: removedFields.length > 0
  };
}

/**
 * Build a typed client-safe summary from admin-reviewed handoff-style fields.
 * Does not authorize live crawl or raw internal exposure.
 */
export function buildMarketIntelligenceClientSafeSummary(input: {
  title: string;
  marketSummary: string | null;
  opportunities: string[] | null;
  recommendedActions: string[] | null;
  status: "READY" | "APPLIED";
  sourceLabelKind?: MarketIntelligenceSourceLabelKind;
}): MarketIntelligenceClientSafeSummaryContractV1 {
  return {
    version: MARKET_INTELLIGENCE_CLIENT_SAFE_SUMMARY_CONTRACT_VERSION,
    title: input.title,
    marketSummary: input.marketSummary,
    opportunities: (input.opportunities ?? []).slice(0, 12),
    recommendedActions: (input.recommendedActions ?? []).slice(0, 12),
    status: input.status,
    sourceLabel: buildMarketIntelligenceSourceLabel(
      input.sourceLabelKind ?? "operator_reviewed_placeholder"
    ),
    adminReviewed: true,
    rawInternalsExposed: false
  };
}

/**
 * Returns policy violations for a candidate MI no-live source policy object.
 * Used by contract proofs — does not mutate input / does not authorize scraping.
 */
export function findMarketIntelligenceSourcePolicyViolations(
  policy: Record<string, unknown>
): string[] {
  const violations: string[] = [];
  const requiredFalse = [
    "liveCrawlingAllowed",
    "marketplaceLiveLookupAllowed",
    "crmLiveLookupAllowed",
    "uncontrolledScrapingAllowed"
  ] as const;

  for (const key of requiredFalse) {
    if (policy[key] !== false) {
      violations.push(key);
    }
  }

  const origins = policy.allowedOrigins;
  if (!Array.isArray(origins)) {
    violations.push("allowedOrigins");
  } else {
    const allowed = new Set<string>(MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS);
    for (const origin of origins) {
      if (typeof origin !== "string" || !allowed.has(origin)) {
        violations.push(`allowedOrigins:${String(origin)}`);
      }
    }
  }

  return violations;
}

/**
 * Build a local-only MI result contract with canonical no-live source policy.
 * Always requires operator review; never authorizes live crawl.
 */
export function buildMarketIntelligenceLocalResult(input: {
  projectId: string;
  generatedAt?: string | null;
  sourceReferences: MarketIntelligenceLocalSourceReference[];
  result: MarketIntelligenceInsightResultV1;
  liveSourceStatus?: MarketIntelligenceLiveSourceStatus;
}): MarketIntelligenceLocalResultContractV1 {
  return {
    version: MARKET_INTELLIGENCE_LOCAL_RESULT_CONTRACT_VERSION,
    projectId: input.projectId,
    generatedAt: input.generatedAt ?? null,
    sourcePolicy: MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY,
    liveSourceStatus: input.liveSourceStatus ?? "blocked_by_policy",
    sourceReferences: input.sourceReferences,
    result: input.result,
    operatorReviewRequired: true
  };
}

/**
 * Build an admin-reviewed source summary with scraping/crawl disabled.
 */
export function buildMarketIntelligenceAdminReviewedSourceSummary(input: {
  projectId: string;
  sources: MarketIntelligenceAdminReviewedSourceSummaryV1["sources"];
  reviewedAt?: string | null;
}): MarketIntelligenceAdminReviewedSourceSummaryV1 {
  return {
    version: MARKET_INTELLIGENCE_ADMIN_SOURCE_SUMMARY_CONTRACT_VERSION,
    projectId: input.projectId,
    sourceCount: input.sources.length,
    sources: input.sources,
    uncontrolledScrapingAllowed: false,
    liveCrawlingAllowed: false,
    operatorReviewRequired: true,
    reviewedAt: input.reviewedAt ?? null
  };
}

/**
 * G601–G602 — Returns violations when a candidate policy enables live/uncontrolled sources.
 * Alias-friendly wrapper used by focused lane tests; same rules as source-policy finder.
 */
export function findMarketIntelligenceUncontrolledScrapingViolations(
  policy: Record<string, unknown>
): string[] {
  return findMarketIntelligenceSourcePolicyViolations(policy).filter(
    (v) =>
      v === "uncontrolledScrapingAllowed" ||
      v === "liveCrawlingAllowed" ||
      v.startsWith("allowedOrigins:")
  );
}

/**
 * G604 — Admin / operator review must remain required on local results,
 * admin source summaries, and client-safe summaries.
 */
export function findMarketIntelligenceAdminReviewViolations(
  candidate: Record<string, unknown>
): string[] {
  const violations: string[] = [];

  if (
    Object.prototype.hasOwnProperty.call(candidate, "operatorReviewRequired") &&
    candidate.operatorReviewRequired !== true
  ) {
    violations.push("operatorReviewRequired");
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "adminReviewed") &&
    candidate.adminReviewed !== true
  ) {
    violations.push("adminReviewed");
  }

  if (
    !Object.prototype.hasOwnProperty.call(candidate, "operatorReviewRequired") &&
    !Object.prototype.hasOwnProperty.call(candidate, "adminReviewed")
  ) {
    violations.push("adminReviewFlagMissing");
  }

  return violations;
}
