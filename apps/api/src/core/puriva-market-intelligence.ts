/**
 * Puriva Market Intelligence — deterministic local seed/context scaffolding.
 * No live crawling, provider calls, or factual credential claims.
 */

import miSeedData from "./puriva-market-intelligence.json";
import { assessPurivaMedicalCompliance, type PurivaMedicalComplianceAssessment } from "./puriva-medical-compliance";
import {
  buildPurivaWorkflowBriefStructuredInput,
  getPurivaServiceTaxonomy,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  type PurivaAudienceSegmentId,
  type PurivaServiceCategory,
  type PurivaServiceTaxonomy
} from "./puriva-service-taxonomy";

export const PURIVA_MARKET_INTELLIGENCE_VERSION = "PURIVA_MARKET_INTELLIGENCE_V1";

export const PURIVA_MARKET_INTELLIGENCE_KIND = "puriva_market_intelligence_seed";

export const PURIVA_MI_SETUP_MARKER = "[PURIVA_LOCAL_SETUP]";

export type PurivaMiCompetitorPlaceholder = {
  id: string;
  name: string;
  sourceType: "WEBSITE" | "OTHER";
  sourceUrl: string;
  notes: string;
};

export type PurivaMiContentGapCategory = {
  id: string;
  label: string;
  description: string;
  relatedServiceCategoryIds: string[];
};

export type PurivaMiServiceCategoryResearchSummary = {
  categoryId: string;
  categoryLabel: string;
  audienceSegments: PurivaAudienceSegmentId[];
  searchIntentGroups: string[];
  contentClusters: string[];
  researchSummary: string;
  recommendedContentTypes: string[];
  complianceFlags: string[];
  complianceAssessment: Pick<
    PurivaMedicalComplianceAssessment,
    "severity" | "action" | "aggregateFlags" | "reviewerNotes" | "guidanceNotes"
  >;
};

export type PurivaMarketIntelligenceContext = {
  version: typeof PURIVA_MARKET_INTELLIGENCE_VERSION;
  kind: typeof PURIVA_MARKET_INTELLIGENCE_KIND;
  seedLabel: string;
  clientDomain: string;
  market: string;
  audienceSegments: PurivaServiceTaxonomy["audienceSegments"];
  competitorPlaceholders: PurivaMiCompetitorPlaceholder[];
  searchIntentMapping: Array<{
    serviceCategoryId: string;
    searchIntentGroups: string[];
    contentClusters: string[];
  }>;
  contentGapCategories: PurivaMiContentGapCategory[];
  serviceCategorySummaries: PurivaMiServiceCategoryResearchSummary[];
  verificationRequiredNotes: string[];
  complianceAnnotations: string[];
};

type MiSeedConfig = {
  version: typeof PURIVA_MARKET_INTELLIGENCE_VERSION;
  seedLabel: string;
  clientDomain: string;
  market: string;
  competitorPlaceholders: PurivaMiCompetitorPlaceholder[];
  contentGapCategories: PurivaMiContentGapCategory[];
  verificationRequiredNotes: string[];
};

const miSeed = miSeedData as MiSeedConfig;

const UNSAFE_APPROVED_PHRASES = [
  "guaranteed",
  "guarantee",
  "cure",
  "cures",
  "permanent result",
  "permanent results",
  "universally suitable",
  "works for everyone",
  "best hospital",
  "official partner hospital"
];

export function getPurivaMarketIntelligenceSeed(): MiSeedConfig {
  return miSeed;
}

export function purivaMarketIntelligenceProjectTitle(targetMonth: string): string {
  return `${PURIVA_MI_SETUP_MARKER} Market Intelligence — ${targetMonth}`;
}

export function buildPurivaMarketIntelligenceProjectSeed(input: {
  clientId: string;
  clientName: string;
  targetMonth: string;
}): Record<string, unknown> {
  const taxonomy = getPurivaServiceTaxonomy();
  return {
    clientId: input.clientId,
    title: purivaMarketIntelligenceProjectTitle(input.targetMonth),
    description: `${miSeed.seedLabel} Puriva MI scaffold for ${input.targetMonth}.`,
    keywords: taxonomy.serviceCategories
      .flatMap((category) => category.contentClusters)
      .slice(0, 6)
      .join(", "),
    competitors: miSeed.competitorPlaceholders.map((entry) => entry.name).join("; "),
    niche: "Bali licensed aesthetic clinic",
    productServiceFocus: "Educational SEO/MI planning context only",
    targetClientName: input.clientName,
    targetMonth: input.targetMonth,
    status: "ACTIVE"
  };
}

function buildServiceCategorySummary(category: PurivaServiceCategory): PurivaMiServiceCategoryResearchSummary {
  const researchSummary = [
    `Operator-reviewed placeholder research for ${category.label}.`,
    `Focus clusters: ${category.contentClusters.slice(0, 3).join("; ")}.`,
    "Educational positioning only; individual outcomes require licensed assessment."
  ].join(" ");

  const complianceAssessment = assessPurivaMedicalCompliance({
    text: researchSummary,
    categoryId: category.id
  });

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    audienceSegments: category.audienceSegments,
    searchIntentGroups: category.searchIntentGroups,
    contentClusters: category.contentClusters,
    researchSummary,
    recommendedContentTypes: category.recommendedContentTypes,
    complianceFlags: category.complianceFlags,
    complianceAssessment: {
      severity: complianceAssessment.severity,
      action: complianceAssessment.action,
      aggregateFlags: complianceAssessment.aggregateFlags,
      reviewerNotes: complianceAssessment.reviewerNotes,
      guidanceNotes: complianceAssessment.guidanceNotes
    }
  };
}

export function buildPurivaMarketIntelligenceContext(
  taxonomy: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()
): PurivaMarketIntelligenceContext {
  const serviceCategorySummaries = taxonomy.serviceCategories.map(buildServiceCategorySummary);

  const complianceAnnotations = [
    ...new Set([
      ...miSeed.verificationRequiredNotes,
      ...serviceCategorySummaries.flatMap((summary) => summary.complianceAssessment.guidanceNotes),
      ...taxonomy.serviceCategories.flatMap((category) => category.complianceNotes)
    ])
  ];

  return {
    version: PURIVA_MARKET_INTELLIGENCE_VERSION,
    kind: PURIVA_MARKET_INTELLIGENCE_KIND,
    seedLabel: miSeed.seedLabel,
    clientDomain: miSeed.clientDomain,
    market: miSeed.market,
    audienceSegments: taxonomy.audienceSegments,
    competitorPlaceholders: miSeed.competitorPlaceholders,
    searchIntentMapping: taxonomy.serviceCategories.map((category) => ({
      serviceCategoryId: category.id,
      searchIntentGroups: category.searchIntentGroups,
      contentClusters: category.contentClusters
    })),
    contentGapCategories: miSeed.contentGapCategories,
    serviceCategorySummaries,
    verificationRequiredNotes: miSeed.verificationRequiredNotes,
    complianceAnnotations
  };
}

export function buildPurivaWorkflowBriefFoundationInput(
  taxonomy: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()
): Record<string, unknown> {
  return {
    ...buildPurivaWorkflowBriefStructuredInput(taxonomy),
    marketIntelligence: buildPurivaMarketIntelligenceContext(taxonomy)
  };
}

export function isPurivaMarketIntelligenceBriefAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.kind === PURIVA_MARKET_INTELLIGENCE_KIND && record.version === PURIVA_MARKET_INTELLIGENCE_VERSION;
}

export function workflowBriefFoundationMatches(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.kind === "puriva_service_taxonomy" &&
    record.version === PURIVA_SERVICE_TAXONOMY_VERSION &&
    isPurivaMarketIntelligenceBriefAttachment(record.marketIntelligence)
  );
}

function collectApprovedConclusionText(context: PurivaMarketIntelligenceContext): string {
  return [
    context.seedLabel,
    context.market,
    ...context.competitorPlaceholders.flatMap((entry) => [entry.name, entry.notes]),
    ...context.contentGapCategories.flatMap((entry) => [entry.label, entry.description]),
    ...context.serviceCategorySummaries.map((entry) => entry.researchSummary),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInMarketIntelligence(
  context: PurivaMarketIntelligenceContext = buildPurivaMarketIntelligenceContext()
): string[] {
  const haystack = collectApprovedConclusionText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaMarketIntelligenceContext(
  context: PurivaMarketIntelligenceContext = buildPurivaMarketIntelligenceContext()
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.version !== PURIVA_MARKET_INTELLIGENCE_VERSION) {
    errors.push(`Unexpected MI version: ${context.version}`);
  }

  if (context.audienceSegments.length < 2) {
    errors.push("Expected both Puriva audience segments in MI context");
  }

  const summaryIds = new Set(context.serviceCategorySummaries.map((entry) => entry.categoryId));
  for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
    if (!summaryIds.has(requiredId)) {
      errors.push(`Missing service category summary: ${requiredId}`);
    }
  }

  for (const summary of context.serviceCategorySummaries) {
    if (summary.complianceFlags.length === 0) {
      errors.push(`Missing compliance flags on summary ${summary.categoryId}`);
    }
    if (summary.audienceSegments.length === 0) {
      errors.push(`Missing audience segments on summary ${summary.categoryId}`);
    }
    if (summary.searchIntentGroups.length === 0) {
      errors.push(`Missing search intent groups on summary ${summary.categoryId}`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes for hospital/partner/license claims");
  }

  const unsafe = findUnsafeApprovedPhrasesInMarketIntelligence(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases in MI context: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function summarizePurivaMarketIntelligenceContext(
  context: PurivaMarketIntelligenceContext = buildPurivaMarketIntelligenceContext()
): string {
  return [
    `Puriva MI ${context.version}`,
    `market=${context.market}`,
    `categories=${context.serviceCategorySummaries.length}`,
    `audiences=${context.audienceSegments.map((segment) => segment.id).join(",")}`,
    `gaps=${context.contentGapCategories.length}`
  ].join(" · ");
}
