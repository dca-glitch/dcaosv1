/**
 * Puriva content production v1 — deterministic draft scaffold from SEO plan.
 * Internal outline only; no provider calls, crawling, WordPress, or approved client copy.
 */

import productionSeedData from "./puriva-content-production.json";
import { assessPurivaMedicalCompliance, type PurivaMedicalComplianceAssessment } from "./puriva-medical-compliance";
import {
  buildPurivaSeoPlanContext,
  buildPurivaWorkflowBriefPlanningInput,
  PURIVA_SEO_PLAN_VERSION,
  type PurivaSeoPlanContext,
  type PurivaSeoPlanItem,
  workflowBriefPlanningMatches
} from "./puriva-seo-plan";
import {
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  type PurivaAudienceSegmentId,
  type PurivaContentType,
  type PurivaSearchIntentGroup
} from "./puriva-service-taxonomy";

export const PURIVA_CONTENT_PRODUCTION_VERSION = "PURIVA_CONTENT_PRODUCTION_V1";

export const PURIVA_CONTENT_PRODUCTION_KIND = "puriva_content_production_seed";

export const PURIVA_CONTENT_PRODUCTION_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_CONTENT_PRODUCTION_V1";

export const PURIVA_DRAFT_INTERNAL_LABEL = "INTERNAL DRAFT SCAFFOLD — NOT APPROVED CLIENT COPY";

export type PurivaDraftOutlineSection = {
  id: string;
  heading: string;
  purpose: string;
  complianceNotes: string[];
};

export type PurivaContentDraftScaffold = {
  seoPlanItemId: string;
  title: string;
  contentType: PurivaContentType;
  audienceSegments: PurivaAudienceSegmentId[];
  searchIntent: PurivaSearchIntentGroup;
  targetKeyword: string;
  serviceCategoryId: string;
  priority: PurivaSeoPlanItem["priority"];
  stage: PurivaSeoPlanItem["stage"];
  draftStatus: "internal_draft_scaffold";
  medicalReviewRequired: boolean;
  verificationRequired: boolean;
  verificationNotes: string[];
  complianceFlags: string[];
  complianceAssessment: Pick<
    PurivaMedicalComplianceAssessment,
    "severity" | "action" | "aggregateFlags" | "reviewerNotes" | "guidanceNotes"
  >;
  outlineSections: PurivaDraftOutlineSection[];
  draftBrief: string;
  productionMetadata: {
    productionKind: typeof PURIVA_CONTENT_PRODUCTION_KIND;
    productionVersion: typeof PURIVA_CONTENT_PRODUCTION_VERSION;
    label: typeof PURIVA_DRAFT_INTERNAL_LABEL;
    seoPlanItemId: string;
    seoPlanVersion: typeof PURIVA_SEO_PLAN_VERSION;
  };
};

export type PurivaContentProductionContext = {
  version: typeof PURIVA_CONTENT_PRODUCTION_VERSION;
  kind: typeof PURIVA_CONTENT_PRODUCTION_KIND;
  seedLabel: string;
  targetMonth: string;
  seoPlanVersion: typeof PURIVA_SEO_PLAN_VERSION;
  draftScaffolds: PurivaContentDraftScaffold[];
  verificationRequiredNotes: string[];
};

type OutlineTemplateSection = {
  id: string;
  heading: string;
  purpose: string;
};

type ProductionSeedConfig = {
  version: typeof PURIVA_CONTENT_PRODUCTION_VERSION;
  seedLabel: string;
  internalDraftLabel: string;
  verificationRequiredNotes: string[];
  outlineTemplates: Record<string, OutlineTemplateSection[]>;
};

const productionSeed = productionSeedData as ProductionSeedConfig;

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

export function getPurivaContentProductionSeed(): ProductionSeedConfig {
  return productionSeed;
}

function outlineTemplateForContentType(contentType: PurivaContentType): OutlineTemplateSection[] {
  return productionSeed.outlineTemplates[contentType] ?? productionSeed.outlineTemplates.service_page;
}

function buildOutlineSections(item: PurivaSeoPlanItem): PurivaDraftOutlineSection[] {
  const template = outlineTemplateForContentType(item.contentType);
  const sharedComplianceNotes = [
    "Outline section only — expand with compliance review before client use.",
    ...(item.verificationRequired
      ? ["Credential or partner references require verification before publication."]
      : [])
  ];

  return template.map((section) => ({
    id: section.id,
    heading: section.heading,
    purpose: section.purpose,
    complianceNotes: sharedComplianceNotes
  }));
}

function buildVerificationNotes(item: PurivaSeoPlanItem): string[] {
  if (!item.verificationRequired) {
    return [];
  }
  return [
    "Hospital, accreditation, partner, or license references require verification before client-facing use.",
    "Use planning language that explains verification steps rather than asserting credentials."
  ];
}

function buildDraftBrief(item: PurivaSeoPlanItem, outlineSections: PurivaDraftOutlineSection[]): string {
  const lines = [
    productionSeed.internalDraftLabel,
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

function buildDraftScaffold(item: PurivaSeoPlanItem): PurivaContentDraftScaffold {
  const outlineSections = buildOutlineSections(item);
  const draftBrief = buildDraftBrief(item, outlineSections);
  const complianceAssessment = assessPurivaMedicalCompliance({
    text: draftBrief,
    categoryId: item.serviceCategoryId
  });

  const medicalReviewRequired =
    item.medicalReviewRequired ||
    (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(item.serviceCategoryId) ||
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
      label: PURIVA_DRAFT_INTERNAL_LABEL,
      seoPlanItemId: item.id,
      seoPlanVersion: PURIVA_SEO_PLAN_VERSION
    }
  };
}

export function buildPurivaContentProductionContext(
  targetMonth: string,
  seoPlan: PurivaSeoPlanContext = buildPurivaSeoPlanContext(targetMonth)
): PurivaContentProductionContext {
  return {
    version: PURIVA_CONTENT_PRODUCTION_VERSION,
    kind: PURIVA_CONTENT_PRODUCTION_KIND,
    seedLabel: productionSeed.seedLabel,
    targetMonth,
    seoPlanVersion: seoPlan.version,
    draftScaffolds: seoPlan.items.map(buildDraftScaffold),
    verificationRequiredNotes: productionSeed.verificationRequiredNotes
  };
}

export function buildPurivaWorkflowBriefProductionInput(
  targetMonth: string
): Record<string, unknown> {
  return {
    ...buildPurivaWorkflowBriefPlanningInput(targetMonth),
    contentProduction: buildPurivaContentProductionContext(targetMonth)
  };
}

export function isPurivaContentProductionBriefAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.kind === PURIVA_CONTENT_PRODUCTION_KIND && record.version === PURIVA_CONTENT_PRODUCTION_VERSION;
}

export function workflowBriefProductionMatches(value: unknown, targetMonth?: string): boolean {
  if (!workflowBriefPlanningMatches(value, targetMonth)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const contentProduction = record.contentProduction;
  if (!isPurivaContentProductionBriefAttachment(contentProduction)) {
    return false;
  }
  if (targetMonth && (contentProduction as Record<string, unknown>).targetMonth !== targetMonth) {
    return false;
  }
  return true;
}

function collectApprovedCopyText(context: PurivaContentProductionContext): string {
  return [
    context.seedLabel,
    ...context.draftScaffolds.flatMap((scaffold) => [
      scaffold.title,
      scaffold.draftBrief.replace(productionSeed.internalDraftLabel, ""),
      scaffold.targetKeyword
    ]),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInContentProduction(
  context: PurivaContentProductionContext = buildPurivaContentProductionContext("2026-01")
): string[] {
  const haystack = collectApprovedCopyText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaContentProductionContext(
  context: PurivaContentProductionContext = buildPurivaContentProductionContext("2026-01"),
  seoPlan: PurivaSeoPlanContext = buildPurivaSeoPlanContext(context.targetMonth)
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.version !== PURIVA_CONTENT_PRODUCTION_VERSION) {
    errors.push(`Unexpected content production version: ${context.version}`);
  }

  if (context.draftScaffolds.length !== seoPlan.items.length) {
    errors.push("Draft scaffold count must match SEO plan item count");
  }

  const scaffoldIds = new Set(context.draftScaffolds.map((scaffold) => scaffold.seoPlanItemId));
  for (const item of seoPlan.items) {
    if (!scaffoldIds.has(item.id)) {
      errors.push(`Missing draft scaffold for SEO item ${item.id}`);
    }
  }

  for (const scaffold of context.draftScaffolds) {
    if (!scaffold.searchIntent || !scaffold.contentType || scaffold.outlineSections.length === 0) {
      errors.push(`Missing planning fields on draft scaffold ${scaffold.seoPlanItemId}`);
    }
    if (scaffold.audienceSegments.length === 0) {
      errors.push(`Missing audience segments on draft scaffold ${scaffold.seoPlanItemId}`);
    }
    if (scaffold.complianceFlags.length === 0 || !scaffold.complianceAssessment.action) {
      errors.push(`Missing compliance assessment on draft scaffold ${scaffold.seoPlanItemId}`);
    }
    if (!scaffold.draftBrief.includes(PURIVA_DRAFT_INTERNAL_LABEL)) {
      errors.push(`Draft scaffold ${scaffold.seoPlanItemId} must be marked internal draft`);
    }
    if (
      (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(scaffold.serviceCategoryId) &&
      !scaffold.medicalReviewRequired
    ) {
      errors.push(`High-risk draft scaffold ${scaffold.seoPlanItemId} must require medical review`);
    }
    if (scaffold.verificationRequired && scaffold.verificationNotes.length === 0) {
      errors.push(`Verification-required scaffold ${scaffold.seoPlanItemId} missing verification notes`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes in content production context");
  }

  const unsafe = findUnsafeApprovedPhrasesInContentProduction(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases in content production: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function buildAiDeliveryContentDraftRequestsFromProduction(
  context: PurivaContentProductionContext = buildPurivaContentProductionContext("2026-01")
): Array<{
  seoPlanItemId: string;
  title: string;
  draftBody: string;
  status: string;
  notes: string;
}> {
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

export function summarizePurivaContentProductionContext(
  context: PurivaContentProductionContext = buildPurivaContentProductionContext("2026-01")
): string {
  return [
    `Puriva content production ${context.version}`,
    `month=${context.targetMonth}`,
    `scaffolds=${context.draftScaffolds.length}`,
    `medical_review=${context.draftScaffolds.filter((entry) => entry.medicalReviewRequired).length}`,
    `verification=${context.draftScaffolds.filter((entry) => entry.verificationRequired).length}`
  ].join(" · ");
}
