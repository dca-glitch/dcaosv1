import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance.mjs";
import {
  buildPurivaMarketIntelligenceContext,
  buildPurivaWorkflowBriefFoundationInput,
  isPurivaMarketIntelligenceBriefAttachment,
  PURIVA_MARKET_INTELLIGENCE_VERSION
} from "./puriva-market-intelligence.mjs";
import {
  getPurivaServiceTaxonomy,
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION
} from "./puriva-service-taxonomy.mjs";

const seoPlanJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-seo-plan.json"
);

export const PURIVA_SEO_PLAN_VERSION = "PURIVA_SEO_PLAN_V1";
export const PURIVA_SEO_PLAN_KIND = "puriva_seo_plan_seed";
export const PURIVA_SEO_PLAN_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_SEO_PLAN_V1";

export { PURIVA_REQUIRED_SERVICE_CATEGORY_IDS };

let cachedSeed = null;

export function getPurivaSeoPlanSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(seoPlanJsonPath, "utf8"));
  }
  return cachedSeed;
}

export function purivaSeoPlanScopeNotes(targetMonth) {
  return `${PURIVA_SEO_PLAN_MARKER} Monthly SEO planning scaffold for ${targetMonth}. Planning objectives only — not final copy.`;
}

function buildSeoPlanItem(template, taxonomy, miContext) {
  const category = taxonomy.serviceCategories.find((entry) => entry.id === template.serviceCategoryId);
  const miSummary = miContext.serviceCategorySummaries.find((entry) => entry.categoryId === template.serviceCategoryId);
  const complianceAssessment = assessPurivaMedicalCompliance({
    text: `${template.title} ${template.planningObjective}`,
    categoryId: template.serviceCategoryId
  });

  const complianceFlags = [
    ...new Set([...(category?.complianceFlags ?? []), ...complianceAssessment.aggregateFlags])
  ];

  const medicalReviewRequired =
    template.medicalReviewRequired ||
    PURIVA_HIGH_RISK_CATEGORY_IDS.includes(template.serviceCategoryId) ||
    complianceAssessment.action === "require_medical_review" ||
    complianceAssessment.action === "block";

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
    planningNotes: [
      "Planning objective only — not final article or ad copy.",
      ...(category?.complianceNotes.slice(0, 2) ?? []),
      ...(miSummary ? [`MI placeholder context: ${miSummary.researchSummary}`] : [])
    ]
  };
}

export function buildPurivaSeoPlanContext(targetMonth) {
  const seed = getPurivaSeoPlanSeed();
  const taxonomy = getPurivaServiceTaxonomy();
  const miContext = buildPurivaMarketIntelligenceContext();

  return {
    version: PURIVA_SEO_PLAN_VERSION,
    kind: PURIVA_SEO_PLAN_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    clientDomain: seed.clientDomain,
    market: seed.market,
    monthlyFocus: seed.monthlyFocus,
    audienceSegments: taxonomy.audienceSegments,
    items: seed.itemTemplates.map((template) => buildSeoPlanItem(template, taxonomy, miContext)),
    verificationRequiredNotes: seed.verificationRequiredNotes,
    marketIntelligenceVersion: miContext.version
  };
}

export function buildPurivaWorkflowBriefPlanningInput(targetMonth) {
  return {
    ...buildPurivaWorkflowBriefFoundationInput(),
    seoPlan: buildPurivaSeoPlanContext(targetMonth)
  };
}

export function isPurivaSeoPlanBriefAttachment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return value.kind === PURIVA_SEO_PLAN_KIND && value.version === PURIVA_SEO_PLAN_VERSION;
}

export function workflowBriefPlanningMatches(value, targetMonth) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  if (
    value.kind !== "puriva_service_taxonomy" ||
    value.version !== PURIVA_SERVICE_TAXONOMY_VERSION ||
    !isPurivaMarketIntelligenceBriefAttachment(value.marketIntelligence) ||
    !isPurivaSeoPlanBriefAttachment(value.seoPlan)
  ) {
    return false;
  }
  if (targetMonth && value.seoPlan?.targetMonth !== targetMonth) {
    return false;
  }
  return true;
}

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

function collectApprovedConclusionText(context) {
  return [
    context.seedLabel,
    context.market,
    context.monthlyFocus,
    ...context.items.flatMap((item) => [item.title, item.planningObjective, item.targetKeyword]),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInSeoPlan(context = buildPurivaSeoPlanContext("2026-01")) {
  const haystack = collectApprovedConclusionText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaSeoPlanContext(context = buildPurivaSeoPlanContext("2026-01")) {
  const errors = [];

  if (context.version !== PURIVA_SEO_PLAN_VERSION) {
    errors.push(`Unexpected SEO plan version: ${context.version}`);
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
    if (PURIVA_HIGH_RISK_CATEGORY_IDS.includes(item.serviceCategoryId) && !item.medicalReviewRequired) {
      errors.push(`High-risk SEO item ${item.id} must require medical review`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes");
  }

  const unsafe = findUnsafeApprovedPhrasesInSeoPlan(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function buildAiDeliveryContentPlanItemsFromSeoPlan(context) {
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

function contentPlanHasPurivaSeoItems(items, expectedCount) {
  if (!Array.isArray(items) || items.length < expectedCount) {
    return false;
  }
  return items.filter((item) => typeof item.notes === "string" && item.notes.includes(PURIVA_SEO_PLAN_MARKER)).length >=
    expectedCount;
}

export async function ensurePurivaSeoPlanApiSeed({
  request,
  token,
  client,
  aiDeliveryProject,
  targetMonth,
  log = () => {}
}) {
  const context = buildPurivaSeoPlanContext(targetMonth);
  const validation = validatePurivaSeoPlanContext(context);
  if (!validation.ok) {
    throw new Error(`Puriva SEO plan invalid: ${validation.errors.join("; ")}`);
  }

  const created = { scopeNotesAttached: false, contentPlan: false };
  const scopeNotes = purivaSeoPlanScopeNotes(targetMonth);

  if (!aiDeliveryProject.plannedContentScopeNotes?.includes(PURIVA_SEO_PLAN_MARKER)) {
    const updateResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}`, {
      method: "PUT",
      token,
      body: {
        clientId: client.id,
        name: aiDeliveryProject.name,
        targetMonth: aiDeliveryProject.targetMonth ?? targetMonth,
        plannedContentScopeNotes: scopeNotes
      }
    });
    if (updateResponse.status !== 200 || updateResponse.body?.ok !== true) {
      throw new Error(`Puriva SEO scope notes attach failed with HTTP ${updateResponse.status}.`);
    }
    created.scopeNotesAttached = true;
    log("attached ai delivery seo scope notes");
  } else {
    log("reused ai delivery seo scope notes");
  }

  const planResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-plan`, { token });
  const existingPlan = planResponse.body?.data?.contentPlan ?? null;
  const existingItems = existingPlan?.items ?? [];

  if (contentPlanHasPurivaSeoItems(existingItems, context.items.length)) {
    log(`reused ai delivery content plan: ${existingPlan.id}`);
  } else if (!existingPlan) {
    const createResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-plan`, {
      method: "POST",
      token,
      body: { items: buildAiDeliveryContentPlanItemsFromSeoPlan(context) }
    });
    if (createResponse.status !== 201 || createResponse.body?.ok !== true) {
      throw new Error(`Puriva SEO content plan create failed with HTTP ${createResponse.status}.`);
    }
    created.contentPlan = true;
    log(`created ai delivery content plan: ${createResponse.body?.data?.contentPlan?.id ?? "missing"}`);
  } else {
    log(`reused existing ai delivery content plan without replacement: ${existingPlan.id}`);
  }

  return { context, created };
}
