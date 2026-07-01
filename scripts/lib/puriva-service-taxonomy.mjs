import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const taxonomyJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-service-taxonomy.json"
);

export const PURIVA_SERVICE_TAXONOMY_VERSION = "PURIVA_SERVICE_TAXONOMY_V1";
export const PURIVA_STRUCTURED_INPUT_KIND = "puriva_service_taxonomy";

export const PURIVA_REQUIRED_SERVICE_CATEGORY_IDS = [
  "wegovy_semaglutide_weight_management",
  "stem_cell_therapy",
  "general_aesthetic_services",
  "bali_medical_tourism_journey"
];

export const PURIVA_HIGH_RISK_CATEGORY_IDS = [
  "wegovy_semaglutide_weight_management",
  "stem_cell_therapy"
];

export const PURIVA_FORBIDDEN_PROMOTIONAL_PHRASES = [
  "guaranteed",
  "guarantee",
  "cure",
  "cures",
  "permanent result",
  "permanent results",
  "universally suitable",
  "works for everyone"
];

let cachedTaxonomy = null;

export function getPurivaServiceTaxonomy() {
  if (!cachedTaxonomy) {
    cachedTaxonomy = JSON.parse(readFileSync(taxonomyJsonPath, "utf8"));
  }
  return cachedTaxonomy;
}

export function buildPurivaWorkflowBriefStructuredInput(source = getPurivaServiceTaxonomy()) {
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

function collectPromotionalTaxonomyTextFragments(source) {
  return [
    source.clientName,
    source.market,
    ...source.audienceSegments.flatMap((segment) => [segment.label, segment.description]),
    ...source.serviceCategories.flatMap((category) => [category.label, category.description, ...category.contentClusters])
  ];
}

export function findForbiddenPromotionalPhrases(source = getPurivaServiceTaxonomy()) {
  const haystack = collectPromotionalTaxonomyTextFragments(source).join("\n").toLowerCase();
  return PURIVA_FORBIDDEN_PROMOTIONAL_PHRASES.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function validatePurivaServiceTaxonomy(source = getPurivaServiceTaxonomy()) {
  const errors = [];

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

export function isPurivaWorkflowBriefStructuredInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return value.kind === PURIVA_STRUCTURED_INPUT_KIND && value.version === PURIVA_SERVICE_TAXONOMY_VERSION;
}

export function taxonomyStructuredInputMatches(value, expected = buildPurivaWorkflowBriefStructuredInput()) {
  if (!isPurivaWorkflowBriefStructuredInput(value)) {
    return false;
  }
  return value.version === expected.version && value.kind === expected.kind;
}
