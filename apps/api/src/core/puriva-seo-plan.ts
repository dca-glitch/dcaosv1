/**
 * Puriva AI SEO Plan v1 — deterministic local planning scaffolding.
 * No final copy generation, provider calls, crawling, or credential claims.
 */

import seoPlanSeedData from "./puriva-seo-plan.json";
import { assessPurivaMedicalCompliance, type PurivaMedicalComplianceAssessment } from "./puriva-medical-compliance";
import {
  buildPurivaMarketIntelligenceContext,
  buildPurivaWorkflowBriefFoundationInput,
  isPurivaMarketIntelligenceBriefAttachment,
  type PurivaMarketIntelligenceContext
} from "./puriva-market-intelligence";
import {
  getPurivaServiceTaxonomy,
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  type PurivaAudienceSegmentId,
  type PurivaContentType,
  type PurivaSearchIntentGroup,
  type PurivaServiceTaxonomy
} from "./puriva-service-taxonomy";

export const PURIVA_SEO_PLAN_VERSION = "PURIVA_SEO_PLAN_V1";

export const PURIVA_SEO_PLAN_KIND = "puriva_seo_plan_seed";

export const PURIVA_SEO_PLAN_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_SEO_PLAN_V1";

export type PurivaSeoPlanPriority = "high" | "medium" | "low";

export type PurivaSeoPlanStage = "foundation" | "expansion" | "support";

export type PurivaSeoPlanItem = {
  id: string;
  title: string;
  planningObjective: string;
  serviceCategoryId: string;
  audienceSegments: PurivaAudienceSegmentId[];
  searchIntent: PurivaSearchIntentGroup;
  contentType: PurivaContentType;
  priority: PurivaSeoPlanPriority;
  stage: PurivaSeoPlanStage;
  targetKeyword: string;
  complianceFlags: string[];
  medicalReviewRequired: boolean;
  verificationRequired: boolean;
  complianceAssessment: Pick<
    PurivaMedicalComplianceAssessment,
    "severity" | "action" | "aggregateFlags" | "reviewerNotes" | "guidanceNotes"
  >;
  planningNotes: string[];
};

export type PurivaSeoPlanContext = {
  version: typeof PURIVA_SEO_PLAN_VERSION;
  kind: typeof PURIVA_SEO_PLAN_KIND;
  seedLabel: string;
  targetMonth: string;
  clientDomain: string;
  market: string;
  monthlyFocus: string;
  audienceSegments: PurivaServiceTaxonomy["audienceSegments"];
  items: PurivaSeoPlanItem[];
  verificationRequiredNotes: string[];
  marketIntelligenceVersion: string;
};

type SeoPlanItemTemplate = {
  id: string;
  title: string;
  planningObjective: string;
  serviceCategoryId: string;
  audienceSegments: PurivaAudienceSegmentId[];
  searchIntent: PurivaSearchIntentGroup;
  contentType: PurivaContentType;
  priority: PurivaSeoPlanPriority;
  stage: PurivaSeoPlanStage;
  targetKeyword: string;
  medicalReviewRequired: boolean;
  verificationRequired: boolean;
};

type SeoPlanSeedConfig = {
  version: typeof PURIVA_SEO_PLAN_VERSION;
  seedLabel: string;
  clientDomain: string;
  market: string;
  monthlyFocus: string;
  verificationRequiredNotes: string[];
  itemTemplates: SeoPlanItemTemplate[];
};

const seoPlanSeed = seoPlanSeedData as SeoPlanSeedConfig;

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

export function getPurivaSeoPlanSeed(): SeoPlanSeedConfig {
  return seoPlanSeed;
}

export function purivaSeoPlanScopeNotes(targetMonth: string): string {
  return `${PURIVA_SEO_PLAN_MARKER} Monthly SEO planning scaffold for ${targetMonth}. Planning objectives only — not final copy.`;
}

function buildSeoPlanItem(
  template: SeoPlanItemTemplate,
  taxonomy: PurivaServiceTaxonomy,
  miContext: PurivaMarketIntelligenceContext
): PurivaSeoPlanItem {
  const category = taxonomy.serviceCategories.find((entry) => entry.id === template.serviceCategoryId);
  const miSummary = miContext.serviceCategorySummaries.find((entry) => entry.categoryId === template.serviceCategoryId);
  const complianceText = [template.title, template.planningObjective].join(" ");
  const complianceAssessment = assessPurivaMedicalCompliance({
    text: complianceText,
    categoryId: template.serviceCategoryId
  });

  const complianceFlags = [
    ...new Set([...(category?.complianceFlags ?? []), ...complianceAssessment.aggregateFlags])
  ];

  const medicalReviewRequired =
    template.medicalReviewRequired ||
    (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(template.serviceCategoryId) ||
    complianceAssessment.action === "require_medical_review" ||
    complianceAssessment.action === "block";

  const planningNotes = [
    "Planning objective only — not final article or ad copy.",
    ...(category?.complianceNotes.slice(0, 2) ?? []),
    ...(miSummary ? [`MI placeholder context: ${miSummary.researchSummary}`] : [])
  ];

  return {
    id: template.id,
    title: template.title,
    planningObjective: template.planningObjective,
    serviceCategoryId: template.serviceCategoryId,
    audienceSegments: template.audienceSegments,
    searchIntent: template.searchIntent,
    contentType: template.contentType,
    priority: template.priority,
    stage: template.stage,
    targetKeyword: template.targetKeyword,
    complianceFlags,
    medicalReviewRequired,
    verificationRequired: template.verificationRequired,
    complianceAssessment: {
      severity: complianceAssessment.severity,
      action: complianceAssessment.action,
      aggregateFlags: complianceAssessment.aggregateFlags,
      reviewerNotes: complianceAssessment.reviewerNotes,
      guidanceNotes: complianceAssessment.guidanceNotes
    },
    planningNotes
  };
}

export function buildPurivaSeoPlanContext(
  targetMonth: string,
  taxonomy: PurivaServiceTaxonomy = getPurivaServiceTaxonomy(),
  miContext: PurivaMarketIntelligenceContext = buildPurivaMarketIntelligenceContext(taxonomy)
): PurivaSeoPlanContext {
  return {
    version: PURIVA_SEO_PLAN_VERSION,
    kind: PURIVA_SEO_PLAN_KIND,
    seedLabel: seoPlanSeed.seedLabel,
    targetMonth,
    clientDomain: seoPlanSeed.clientDomain,
    market: seoPlanSeed.market,
    monthlyFocus: seoPlanSeed.monthlyFocus,
    audienceSegments: taxonomy.audienceSegments,
    items: seoPlanSeed.itemTemplates.map((template) => buildSeoPlanItem(template, taxonomy, miContext)),
    verificationRequiredNotes: seoPlanSeed.verificationRequiredNotes,
    marketIntelligenceVersion: miContext.version
  };
}

export function buildPurivaWorkflowBriefPlanningInput(
  targetMonth: string,
  taxonomy: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()
): Record<string, unknown> {
  return {
    ...buildPurivaWorkflowBriefFoundationInput(taxonomy),
    seoPlan: buildPurivaSeoPlanContext(targetMonth, taxonomy)
  };
}

export function isPurivaSeoPlanBriefAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.kind === PURIVA_SEO_PLAN_KIND && record.version === PURIVA_SEO_PLAN_VERSION;
}

export function workflowBriefPlanningMatches(value: unknown, targetMonth?: string): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const seoPlan = record.seoPlan;
  if (
    record.kind !== "puriva_service_taxonomy" ||
    record.version !== PURIVA_SERVICE_TAXONOMY_VERSION ||
    !isPurivaMarketIntelligenceBriefAttachment(record.marketIntelligence) ||
    !isPurivaSeoPlanBriefAttachment(seoPlan)
  ) {
    return false;
  }
  if (targetMonth && (seoPlan as Record<string, unknown>).targetMonth !== targetMonth) {
    return false;
  }
  return true;
}

function collectApprovedConclusionText(context: PurivaSeoPlanContext): string {
  return [
    context.seedLabel,
    context.market,
    context.monthlyFocus,
    ...context.items.flatMap((item) => [item.title, item.planningObjective, item.targetKeyword]),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInSeoPlan(
  context: PurivaSeoPlanContext = buildPurivaSeoPlanContext("2026-01")
): string[] {
  const haystack = collectApprovedConclusionText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaSeoPlanContext(
  context: PurivaSeoPlanContext = buildPurivaSeoPlanContext("2026-01")
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.version !== PURIVA_SEO_PLAN_VERSION) {
    errors.push(`Unexpected SEO plan version: ${context.version}`);
  }

  if (context.audienceSegments.length < 2) {
    errors.push("Expected both Puriva audience segments in SEO plan context");
  }

  const categoryIds = new Set(context.items.map((item) => item.serviceCategoryId));
  for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
    if (!categoryIds.has(requiredId)) {
      errors.push(`Missing SEO plan item for service category: ${requiredId}`);
    }
  }

  const audienceIds = new Set(context.items.flatMap((item) => item.audienceSegments));
  if (!audienceIds.has("local_clients") || !audienceIds.has("international_medical_tourists")) {
    errors.push("Expected both audience segments across SEO plan items");
  }

  for (const item of context.items) {
    if (!item.searchIntent || !item.contentType || !item.priority) {
      errors.push(`Missing planning fields on SEO item ${item.id}`);
    }
    if (item.complianceFlags.length === 0) {
      errors.push(`Missing compliance flags on SEO item ${item.id}`);
    }
    if (
      (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(item.serviceCategoryId) &&
      !item.medicalReviewRequired
    ) {
      errors.push(`High-risk SEO item ${item.id} must require medical review`);
    }
    if (item.verificationRequired && !context.verificationRequiredNotes.some((note) => /verification/i.test(note))) {
      errors.push(`Verification-required SEO item ${item.id} missing plan-level verification notes`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes for hospital/partner/license topics");
  }

  const unsafe = findUnsafeApprovedPhrasesInSeoPlan(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases in SEO plan: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function summarizePurivaSeoPlanContext(
  context: PurivaSeoPlanContext = buildPurivaSeoPlanContext("2026-01")
): string {
  return [
    `Puriva SEO ${context.version}`,
    `month=${context.targetMonth}`,
    `items=${context.items.length}`,
    `high=${context.items.filter((item) => item.priority === "high").length}`,
    `medical_review=${context.items.filter((item) => item.medicalReviewRequired).length}`
  ].join(" · ");
}

export function buildAiDeliveryContentPlanItemsFromSeoPlan(
  context: PurivaSeoPlanContext = buildPurivaSeoPlanContext("2026-01")
): Array<{
  title: string;
  targetKeyword: string;
  contentType: string;
  notes: string;
  sortOrder: number;
  approvalStatus: string;
}> {
  return context.items.map((item, index) => ({
    title: item.title,
    targetKeyword: item.targetKeyword,
    contentType: item.contentType,
    notes: [
      PURIVA_SEO_PLAN_MARKER,
      `item:${item.id}`,
      `intent:${item.searchIntent}`,
      `priority:${item.priority}`,
      `stage:${item.stage}`,
      `medical_review:${item.medicalReviewRequired}`,
      `verification:${item.verificationRequired}`
    ].join(" "),
    sortOrder: index,
    approvalStatus: "DRAFT"
  }));
}
