import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance.mjs";
import {
  buildPurivaSeoPlanContext,
  buildPurivaWorkflowBriefPlanningInput,
  PURIVA_SEO_PLAN_VERSION,
  workflowBriefPlanningMatches
} from "./puriva-seo-plan.mjs";
import { PURIVA_HIGH_RISK_CATEGORY_IDS } from "./puriva-service-taxonomy.mjs";

const productionJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-content-production.json"
);

export const PURIVA_CONTENT_PRODUCTION_VERSION = "PURIVA_CONTENT_PRODUCTION_V1";
export const PURIVA_CONTENT_PRODUCTION_KIND = "puriva_content_production_seed";
export const PURIVA_CONTENT_PRODUCTION_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_CONTENT_PRODUCTION_V1";
export const PURIVA_DRAFT_INTERNAL_LABEL = "INTERNAL DRAFT SCAFFOLD — NOT APPROVED CLIENT COPY";

let cachedSeed = null;

export function getPurivaContentProductionSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(productionJsonPath, "utf8"));
  }
  return cachedSeed;
}

function outlineTemplateForContentType(contentType) {
  const seed = getPurivaContentProductionSeed();
  return seed.outlineTemplates[contentType] ?? seed.outlineTemplates.service_page;
}

function buildVerificationNotes(item) {
  if (!item.verificationRequired) {
    return [];
  }
  return [
    "Hospital, accreditation, partner, or license references require verification before client-facing use.",
    "Use planning language that explains verification steps rather than asserting credentials."
  ];
}

function buildOutlineSections(item) {
  const sharedComplianceNotes = [
    "Outline section only — expand with compliance review before client use.",
    ...(item.verificationRequired
      ? ["Credential or partner references require verification before publication."]
      : [])
  ];

  return outlineTemplateForContentType(item.contentType).map((section) => ({
    id: section.id,
    heading: section.heading,
    purpose: section.purpose,
    complianceNotes: sharedComplianceNotes
  }));
}

function buildDraftBrief(item, outlineSections) {
  const seed = getPurivaContentProductionSeed();
  const lines = [
    seed.internalDraftLabel,
    PURIVA_CONTENT_PRODUCTION_MARKER,
    `SEO plan item: ${item.id}`,
    `Planning objective: ${item.planningObjective}`,
    `Audience segments: ${item.audienceSegments.join(", ")}`,
    `Search intent: ${item.searchIntent}`,
    `Content type: ${item.contentType}`,
    `Target keyword: ${item.targetKeyword}`,
    `Medical review required: ${item.medicalReviewRequired ? "yes" : "no"}`,
    `Verification required: ${item.verificationRequired ? "yes" : "no"}`,
    "",
    "Outline sections:"
  ];

  outlineSections.forEach((section, index) => {
    lines.push(`${index + 1}. ${section.heading} — ${section.purpose}`);
  });

  lines.push("", "Compliance guidance:");
  for (const note of item.complianceAssessment.guidanceNotes.slice(0, 3)) {
    lines.push(`- ${note}`);
  }

  if (item.medicalReviewRequired) {
    lines.push("- Medical reviewer sign-off required before expanding this scaffold into client-facing copy.");
  }

  return lines.join("\n");
}

function buildDraftScaffold(item) {
  const seed = getPurivaContentProductionSeed();
  const outlineSections = buildOutlineSections(item);
  const draftBrief = buildDraftBrief(item, outlineSections);
  const complianceAssessment = assessPurivaMedicalCompliance({
    text: draftBrief,
    categoryId: item.serviceCategoryId
  });

  const medicalReviewRequired =
    item.medicalReviewRequired ||
    PURIVA_HIGH_RISK_CATEGORY_IDS.includes(item.serviceCategoryId) ||
    complianceAssessment.action === "require_medical_review" ||
    complianceAssessment.action === "block";

  return {
    seoPlanItemId: item.id,
    title: `[Draft Scaffold] ${item.title}`,
    contentType: item.contentType,
    audienceSegments: item.audienceSegments,
    searchIntent: item.searchIntent,
    targetKeyword: item.targetKeyword,
    serviceCategoryId: item.serviceCategoryId,
    priority: item.priority,
    stage: item.stage,
    draftStatus: "internal_draft_scaffold",
    medicalReviewRequired,
    verificationRequired: item.verificationRequired,
    verificationNotes: buildVerificationNotes(item),
    complianceFlags: [...new Set([...item.complianceFlags, ...complianceAssessment.aggregateFlags])],
    complianceAssessment: {
      severity: complianceAssessment.severity,
      action: complianceAssessment.action,
      aggregateFlags: complianceAssessment.aggregateFlags,
      reviewerNotes: complianceAssessment.reviewerNotes,
      guidanceNotes: complianceAssessment.guidanceNotes
    },
    outlineSections,
    draftBrief,
    productionMetadata: {
      productionKind: PURIVA_CONTENT_PRODUCTION_KIND,
      productionVersion: PURIVA_CONTENT_PRODUCTION_VERSION,
      label: seed.internalDraftLabel,
      seoPlanItemId: item.id,
      seoPlanVersion: PURIVA_SEO_PLAN_VERSION
    }
  };
}

export function buildPurivaContentProductionContext(targetMonth, seoPlan = buildPurivaSeoPlanContext(targetMonth)) {
  const seed = getPurivaContentProductionSeed();
  return {
    version: PURIVA_CONTENT_PRODUCTION_VERSION,
    kind: PURIVA_CONTENT_PRODUCTION_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    seoPlanVersion: seoPlan.version,
    draftScaffolds: seoPlan.items.map(buildDraftScaffold),
    verificationRequiredNotes: seed.verificationRequiredNotes
  };
}

export function buildPurivaWorkflowBriefProductionInput(targetMonth) {
  return {
    ...buildPurivaWorkflowBriefPlanningInput(targetMonth),
    contentProduction: buildPurivaContentProductionContext(targetMonth)
  };
}

export function isPurivaContentProductionBriefAttachment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return value.kind === PURIVA_CONTENT_PRODUCTION_KIND && value.version === PURIVA_CONTENT_PRODUCTION_VERSION;
}

export function workflowBriefProductionMatches(value, targetMonth) {
  if (!workflowBriefPlanningMatches(value, targetMonth)) {
    return false;
  }
  if (!isPurivaContentProductionBriefAttachment(value.contentProduction)) {
    return false;
  }
  if (targetMonth && value.contentProduction?.targetMonth !== targetMonth) {
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

function collectApprovedCopyText(context) {
  const seed = getPurivaContentProductionSeed();
  return [
    context.seedLabel,
    ...context.draftScaffolds.flatMap((scaffold) => [
      scaffold.title,
      scaffold.draftBrief.replace(seed.internalDraftLabel, ""),
      scaffold.targetKeyword
    ]),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInContentProduction(context = buildPurivaContentProductionContext("2026-01")) {
  const haystack = collectApprovedCopyText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaContentProductionContext(
  context = buildPurivaContentProductionContext("2026-01"),
  seoPlan = buildPurivaSeoPlanContext(context.targetMonth)
) {
  const errors = [];
  const seed = getPurivaContentProductionSeed();

  if (context.version !== PURIVA_CONTENT_PRODUCTION_VERSION) {
    errors.push(`Unexpected content production version: ${context.version}`);
  }

  if (context.draftScaffolds.length !== seoPlan.items.length) {
    errors.push("Draft scaffold count must match SEO plan item count");
  }

  for (const item of seoPlan.items) {
    if (!context.draftScaffolds.some((scaffold) => scaffold.seoPlanItemId === item.id)) {
      errors.push(`Missing draft scaffold for SEO item ${item.id}`);
    }
  }

  for (const scaffold of context.draftScaffolds) {
    if (!scaffold.searchIntent || !scaffold.contentType || scaffold.outlineSections.length === 0) {
      errors.push(`Missing planning fields on draft scaffold ${scaffold.seoPlanItemId}`);
    }
    if (scaffold.complianceFlags.length === 0) {
      errors.push(`Missing compliance flags on draft scaffold ${scaffold.seoPlanItemId}`);
    }
    if (!scaffold.draftBrief.includes(seed.internalDraftLabel)) {
      errors.push(`Draft scaffold ${scaffold.seoPlanItemId} must be marked internal draft`);
    }
    if (PURIVA_HIGH_RISK_CATEGORY_IDS.includes(scaffold.serviceCategoryId) && !scaffold.medicalReviewRequired) {
      errors.push(`High-risk draft scaffold ${scaffold.seoPlanItemId} must require medical review`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes");
  }

  const unsafe = findUnsafeApprovedPhrasesInContentProduction(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function buildAiDeliveryContentDraftRequestsFromProduction(context) {
  return context.draftScaffolds.map((scaffold) => ({
    seoPlanItemId: scaffold.seoPlanItemId,
    title: scaffold.title,
    draftBody: scaffold.draftBrief,
    status: "DRAFT",
    notes: [
      PURIVA_CONTENT_PRODUCTION_MARKER,
      `item:${scaffold.seoPlanItemId}`,
      `content_type:${scaffold.contentType}`,
      `medical_review:${scaffold.medicalReviewRequired}`,
      `verification:${scaffold.verificationRequired}`,
      "internal_draft_scaffold"
    ].join(" ")
  }));
}

function findContentPlanItemForSeoItem(contentPlanItems, seoPlanItemId) {
  return (
    contentPlanItems.find(
      (item) => typeof item.notes === "string" && item.notes.includes(`item:${seoPlanItemId}`)
    ) ?? null
  );
}

function hasProductionDraftForSeoItem(contentDrafts, seoPlanItemId) {
  return contentDrafts.some(
    (draft) =>
      typeof draft.notes === "string" &&
      draft.notes.includes(PURIVA_CONTENT_PRODUCTION_MARKER) &&
      draft.notes.includes(`item:${seoPlanItemId}`)
  );
}

export async function ensurePurivaContentProductionApiSeed({
  request,
  token,
  aiDeliveryProject,
  targetMonth,
  log = () => {}
}) {
  const seoPlan = buildPurivaSeoPlanContext(targetMonth);
  const context = buildPurivaContentProductionContext(targetMonth, seoPlan);
  const validation = validatePurivaContentProductionContext(context, seoPlan);
  if (!validation.ok) {
    throw new Error(`Puriva content production invalid: ${validation.errors.join("; ")}`);
  }

  const created = { contentDrafts: 0 };

  const planResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-plan`, { token });
  const contentPlanItems = planResponse.body?.data?.contentPlan?.items ?? [];

  const draftsResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-drafts`, { token });
  const existingDrafts = draftsResponse.body?.data?.contentDrafts ?? [];

  for (const draftRequest of buildAiDeliveryContentDraftRequestsFromProduction(context)) {
    if (hasProductionDraftForSeoItem(existingDrafts, draftRequest.seoPlanItemId)) {
      log(`reused content draft scaffold: ${draftRequest.seoPlanItemId}`);
      continue;
    }

    const planItem = findContentPlanItemForSeoItem(contentPlanItems, draftRequest.seoPlanItemId);
    const createResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-drafts`, {
      method: "POST",
      token,
      body: {
        title: draftRequest.title,
        draftBody: draftRequest.draftBody,
        status: draftRequest.status,
        notes: draftRequest.notes,
        contentPlanItemId: planItem?.id ?? null
      }
    });

    if (createResponse.status !== 201 || createResponse.body?.ok !== true) {
      throw new Error(
        `Puriva content draft scaffold create failed for ${draftRequest.seoPlanItemId} with HTTP ${createResponse.status}.`
      );
    }

    created.contentDrafts += 1;
    log(`created content draft scaffold: ${draftRequest.seoPlanItemId}`);
  }

  return { context, created };
}
