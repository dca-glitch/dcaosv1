/**
 * Puriva service/content taxonomy — deterministic local context for MI, SEO planning,
 * workflow brief structured input, compliance checks, and monthly reporting scaffolding.
 * No generated marketing copy; taxonomy and safety notes only.
 */

import taxonomyData from "./puriva-service-taxonomy.json";

export const PURIVA_SERVICE_TAXONOMY_VERSION = "PURIVA_SERVICE_TAXONOMY_V1";

export const PURIVA_STRUCTURED_INPUT_KIND = "puriva_service_taxonomy";

export type PurivaAudienceSegmentId = "local_clients" | "international_medical_tourists";

export type PurivaSearchIntentGroup =
  | "informational"
  | "commercial_investigation"
  | "transactional_booking"
  | "comparison"
  | "trust_compliance";

export type PurivaContentType =
  | "service_page"
  | "faq"
  | "blog_article"
  | "comparison_education"
  | "booking_contact_support";

export type PurivaComplianceFlag =
  | "medical_claim_risk"
  | "prescription_medication_risk"
  | "before_after_result_claim_risk"
  | "licensed_provider_required";

export type PurivaAudienceSegment = {
  id: PurivaAudienceSegmentId;
  label: string;
  description: string;
};

export type PurivaServiceCategory = {
  id: string;
  label: string;
  slug: string;
  description: string;
  contentClusters: string[];
  searchIntentGroups: PurivaSearchIntentGroup[];
  audienceSegments: PurivaAudienceSegmentId[];
  complianceFlags: PurivaComplianceFlag[];
  recommendedContentTypes: PurivaContentType[];
  complianceNotes: string[];
};

export type PurivaServiceTaxonomy = {
  version: typeof PURIVA_SERVICE_TAXONOMY_VERSION;
  clientDomain: string;
  clientName: string;
  market: string;
  audienceSegments: PurivaAudienceSegment[];
  searchIntentGroups: PurivaSearchIntentGroup[];
  contentTypes: PurivaContentType[];
  complianceFlags: PurivaComplianceFlag[];
  serviceCategories: PurivaServiceCategory[];
};

export const PURIVA_REQUIRED_SERVICE_CATEGORY_IDS = [
  "wegovy_semaglutide_weight_management",
  "stem_cell_therapy",
  "general_aesthetic_services",
  "bali_medical_tourism_journey"
] as const;

export const PURIVA_HIGH_RISK_CATEGORY_IDS = [
  "wegovy_semaglutide_weight_management",
  "stem_cell_therapy"
] as const;

export const PURIVA_FORBIDDEN_PROMOTIONAL_PHRASES = [
  "guaranteed",
  "guarantee",
  "cure",
  "cures",
  "permanent result",
  "permanent results",
  "universally suitable",
  "works for everyone"
] as const;

const taxonomy = taxonomyData as PurivaServiceTaxonomy;

export function getPurivaServiceTaxonomy(): PurivaServiceTaxonomy {
  return taxonomy;
}

export function buildPurivaWorkflowBriefStructuredInput(
  source: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()
): Record<string, unknown> {
  const keywordClusters = source.serviceCategories.flatMap((category) => category.contentClusters);
  const complianceHints = source.serviceCategories.flatMap((category) => category.complianceNotes);

  return {
    version: source.version,
    kind: PURIVA_STRUCTURED_INPUT_KIND,
    clientDomain: source.clientDomain,
    clientName: source.clientName,
    market: source.market,
    audienceSegments: source.audienceSegments,
    serviceCategories: source.serviceCategories,
    keywords: keywordClusters,
    keywordClusters,
    notes: complianceHints,
    hints: [
      `Puriva service taxonomy ${source.version}`,
      "Use complianceNotes before drafting medical or aesthetic content.",
      "Audience segments: local_clients and international_medical_tourists."
    ]
  };
}

function collectPromotionalTaxonomyTextFragments(source: PurivaServiceTaxonomy): string[] {
  return [
    source.clientName,
    source.market,
    ...source.audienceSegments.flatMap((segment) => [segment.label, segment.description]),
    ...source.serviceCategories.flatMap((category) => [category.label, category.description, ...category.contentClusters])
  ];
}

export function findForbiddenPromotionalPhrases(source: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()): string[] {
  const haystack = collectPromotionalTaxonomyTextFragments(source).join("\n").toLowerCase();
  return PURIVA_FORBIDDEN_PROMOTIONAL_PHRASES.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function validatePurivaServiceTaxonomy(source: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (source.version !== PURIVA_SERVICE_TAXONOMY_VERSION) {
    errors.push(`Unexpected taxonomy version: ${source.version}`);
  }

  if (source.clientDomain !== "puriva.id") {
    errors.push(`Unexpected client domain: ${source.clientDomain}`);
  }

  const categoryIds = new Set(source.serviceCategories.map((category) => category.id));
  for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
    if (!categoryIds.has(requiredId)) {
      errors.push(`Missing required service category: ${requiredId}`);
    }
  }

  for (const category of source.serviceCategories) {
    if (category.audienceSegments.length === 0) {
      errors.push(`Category ${category.id} missing audienceSegments`);
    }
    if (category.searchIntentGroups.length === 0) {
      errors.push(`Category ${category.id} missing searchIntentGroups`);
    }
    if (category.recommendedContentTypes.length === 0) {
      errors.push(`Category ${category.id} missing recommendedContentTypes`);
    }
    if (category.contentClusters.length === 0) {
      errors.push(`Category ${category.id} missing contentClusters`);
    }
    if (category.complianceNotes.length === 0) {
      errors.push(`Category ${category.id} missing complianceNotes`);
    }
  }

  for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
    const category = source.serviceCategories.find((entry) => entry.id === highRiskId);
    if (!category) {
      continue;
    }
    if (!category.complianceFlags.includes("medical_claim_risk")) {
      errors.push(`High-risk category ${highRiskId} must include medical_claim_risk`);
    }
    if (!category.complianceFlags.includes("licensed_provider_required")) {
      errors.push(`High-risk category ${highRiskId} must include licensed_provider_required`);
    }
  }

  const forbidden = findForbiddenPromotionalPhrases(source);
  if (forbidden.length > 0) {
    errors.push(`Forbidden promotional phrases present: ${forbidden.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function isPurivaWorkflowBriefStructuredInput(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.kind === PURIVA_STRUCTURED_INPUT_KIND && record.version === PURIVA_SERVICE_TAXONOMY_VERSION;
}

export function taxonomyStructuredInputMatches(
  value: unknown,
  expected: Record<string, unknown> = buildPurivaWorkflowBriefStructuredInput()
): boolean {
  if (!isPurivaWorkflowBriefStructuredInput(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.version === expected.version && record.kind === expected.kind;
}
