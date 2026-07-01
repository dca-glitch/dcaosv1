/**
 * Puriva image package v1 — deterministic local image prompt scaffolds from content production.
 * Internal admin planning only; no provider calls, image generation, crawling, or client portal exposure.
 */

import imagePackageSeedData from "./puriva-image-package.json";
import {
  buildPurivaContentProductionContext,
  buildPurivaWorkflowBriefProductionInput,
  type PurivaContentDraftScaffold,
  type PurivaContentProductionContext,
  workflowBriefProductionMatches
} from "./puriva-content-production";
import {
  assessPurivaMedicalCompliance,
  type PurivaMedicalComplianceAssessment,
  type PurivaMedicalComplianceFlag
} from "./puriva-medical-compliance";
import {
  buildPurivaSeoPlanContext,
  type PurivaSeoPlanContext
} from "./puriva-seo-plan";
import {
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  type PurivaContentType
} from "./puriva-service-taxonomy";

export const PURIVA_IMAGE_PACKAGE_VERSION = "PURIVA_IMAGE_PACKAGE_V1";

export const PURIVA_IMAGE_PACKAGE_KIND = "puriva_image_package_seed";

export const PURIVA_IMAGE_PACKAGE_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_IMAGE_PACKAGE_V1";

export const PURIVA_IMAGE_INTERNAL_PROMPT_LABEL =
  "INTERNAL ADMIN IMAGE PROMPT SCAFFOLD — NOT FOR CLIENT OR GENERATION USE";

export type PurivaImageConceptRole = "hero_header" | "supporting_education" | "lifestyle_context";

export type PurivaImageConcept = {
  id: string;
  role: PurivaImageConceptRole;
  roleLabel: string;
  title: string;
  promptScaffold: string;
  altTextDraft: string;
  conceptStatus: "internal_prompt_scaffold";
  complianceFlags: PurivaMedicalComplianceFlag[];
  complianceAssessment: Pick<
    PurivaMedicalComplianceAssessment,
    "severity" | "action" | "aggregateFlags" | "reviewerNotes" | "guidanceNotes"
  >;
  visualSafetyNotes: string[];
};

export type PurivaContentImagePackage = {
  seoPlanItemId: string;
  contentType: PurivaContentType;
  serviceCategoryId: string;
  targetKeyword: string;
  medicalReviewRequired: boolean;
  verificationRequired: boolean;
  complianceFlags: PurivaMedicalComplianceFlag[];
  concepts: PurivaImageConcept[];
  packageStatus: "internal_prompt_scaffold";
  finalReadyGating: {
    allowed: false;
    reasons: string[];
  };
  packageMetadata: {
    packageKind: typeof PURIVA_IMAGE_PACKAGE_KIND;
    packageVersion: typeof PURIVA_IMAGE_PACKAGE_VERSION;
    label: typeof PURIVA_IMAGE_INTERNAL_PROMPT_LABEL;
    seoPlanItemId: string;
    conceptCount: number;
  };
};

export type PurivaImagePackageContext = {
  version: typeof PURIVA_IMAGE_PACKAGE_VERSION;
  kind: typeof PURIVA_IMAGE_PACKAGE_KIND;
  seedLabel: string;
  targetMonth: string;
  contentProductionVersion: string;
  imagePackages: PurivaContentImagePackage[];
  visualSafetyNotes: string[];
  verificationRequiredNotes: string[];
};

type ConceptRoleConfig = {
  id: PurivaImageConceptRole;
  label: string;
  purpose: string;
};

type ImagePackageSeedConfig = {
  version: typeof PURIVA_IMAGE_PACKAGE_VERSION;
  seedLabel: string;
  internalPromptLabel: string;
  conceptCountByContentType: Record<PurivaContentType, number>;
  conceptRoles: ConceptRoleConfig[];
  promptFragments: Record<PurivaImageConceptRole, Record<PurivaContentType, string>>;
  altTextPatterns: Record<PurivaImageConceptRole, string>;
  visualSafetyNotes: string[];
  finalReadyGatingReasons: string[];
  verificationRequiredNotes: string[];
  unsafeVisualPhrases: string[];
};

const imagePackageSeed = imagePackageSeedData as ImagePackageSeedConfig;

const REQUIRED_IMAGE_COMPLIANCE_FLAGS: PurivaMedicalComplianceFlag[] = [
  "before_after_result_claim_risk",
  "medical_claim_risk",
  "prescription_medication_risk"
];

export function getPurivaImagePackageSeed(): ImagePackageSeedConfig {
  return imagePackageSeed;
}

function conceptRolesForContentType(contentType: PurivaContentType): ConceptRoleConfig[] {
  const count = imagePackageSeed.conceptCountByContentType[contentType] ?? 3;
  return imagePackageSeed.conceptRoles.slice(0, count);
}

function topicLabel(scaffold: PurivaContentDraftScaffold): string {
  return scaffold.targetKeyword.trim() || scaffold.title.replace(/^\[Draft Scaffold\]\s*/i, "");
}

function buildPromptScaffold(
  role: PurivaImageConceptRole,
  scaffold: PurivaContentDraftScaffold
): string {
  const fragment =
    imagePackageSeed.promptFragments[role]?.[scaffold.contentType] ??
    imagePackageSeed.promptFragments[role]?.service_page ??
    "Neutral licensed clinic educational visual concept.";
  const topic = topicLabel(scaffold);

  return [
    imagePackageSeed.internalPromptLabel,
    PURIVA_IMAGE_PACKAGE_MARKER,
    `SEO plan item: ${scaffold.seoPlanItemId}`,
    `Content type: ${scaffold.contentType}`,
    `Topic focus: ${topic}`,
    `Role: ${role}`,
    fragment,
    "Planning reference only — no generation, no client distribution, no before/after or outcome imagery."
  ].join("\n");
}

function buildAltTextDraft(role: PurivaImageConceptRole, scaffold: PurivaContentDraftScaffold): string {
  const pattern =
    imagePackageSeed.altTextPatterns[role] ??
    "Educational {topic} visual at a licensed Bali clinic, neutral planning reference";
  return pattern.replace("{topic}", topicLabel(scaffold));
}

function buildConceptTitle(role: ConceptRoleConfig, scaffold: PurivaContentDraftScaffold): string {
  const topic = topicLabel(scaffold);
  return `[Image Scaffold] ${role.label} — ${topic}`;
}

function buildImageConcept(
  role: ConceptRoleConfig,
  scaffold: PurivaContentDraftScaffold
): PurivaImageConcept {
  const promptScaffold = buildPromptScaffold(role.id, scaffold);
  const altTextDraft = buildAltTextDraft(role.id, scaffold);
  const complianceAssessment = assessPurivaMedicalCompliance({
    text: [promptScaffold, altTextDraft].join("\n"),
    categoryId: scaffold.serviceCategoryId
  });

  return {
    id: `${scaffold.seoPlanItemId}_${role.id}`,
    role: role.id,
    roleLabel: role.label,
    title: buildConceptTitle(role, scaffold),
    promptScaffold,
    altTextDraft,
    conceptStatus: "internal_prompt_scaffold",
    complianceFlags: complianceAssessment.aggregateFlags,
    complianceAssessment: {
      severity: complianceAssessment.severity,
      action: complianceAssessment.action,
      aggregateFlags: complianceAssessment.aggregateFlags,
      reviewerNotes: complianceAssessment.reviewerNotes,
      guidanceNotes: complianceAssessment.guidanceNotes
    },
    visualSafetyNotes: imagePackageSeed.visualSafetyNotes
  };
}

function buildImagePackage(scaffold: PurivaContentDraftScaffold): PurivaContentImagePackage {
  const roles = conceptRolesForContentType(scaffold.contentType);
  const concepts = roles.map((role) => buildImageConcept(role, scaffold));
  const complianceFlags = [
    ...new Set(concepts.flatMap((concept) => concept.complianceFlags))
  ] as PurivaMedicalComplianceFlag[];

  return {
    seoPlanItemId: scaffold.seoPlanItemId,
    contentType: scaffold.contentType,
    serviceCategoryId: scaffold.serviceCategoryId,
    targetKeyword: scaffold.targetKeyword,
    medicalReviewRequired: scaffold.medicalReviewRequired,
    verificationRequired: scaffold.verificationRequired,
    complianceFlags,
    concepts,
    packageStatus: "internal_prompt_scaffold",
    finalReadyGating: {
      allowed: false,
      reasons: [...imagePackageSeed.finalReadyGatingReasons]
    },
    packageMetadata: {
      packageKind: PURIVA_IMAGE_PACKAGE_KIND,
      packageVersion: PURIVA_IMAGE_PACKAGE_VERSION,
      label: PURIVA_IMAGE_INTERNAL_PROMPT_LABEL,
      seoPlanItemId: scaffold.seoPlanItemId,
      conceptCount: concepts.length
    }
  };
}

export function buildPurivaImagePackageContext(
  targetMonth: string,
  contentProduction: PurivaContentProductionContext = buildPurivaContentProductionContext(
    targetMonth,
    buildPurivaSeoPlanContext(targetMonth)
  )
): PurivaImagePackageContext {
  return {
    version: PURIVA_IMAGE_PACKAGE_VERSION,
    kind: PURIVA_IMAGE_PACKAGE_KIND,
    seedLabel: imagePackageSeed.seedLabel,
    targetMonth,
    contentProductionVersion: contentProduction.version,
    imagePackages: contentProduction.draftScaffolds.map(buildImagePackage),
    visualSafetyNotes: imagePackageSeed.visualSafetyNotes,
    verificationRequiredNotes: imagePackageSeed.verificationRequiredNotes
  };
}

export function buildPurivaWorkflowBriefImagePackageInput(
  targetMonth: string
): Record<string, unknown> {
  return {
    ...buildPurivaWorkflowBriefProductionInput(targetMonth),
    imagePackage: buildPurivaImagePackageContext(targetMonth)
  };
}

export function isPurivaImagePackageBriefAttachment(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.kind === PURIVA_IMAGE_PACKAGE_KIND && record.version === PURIVA_IMAGE_PACKAGE_VERSION;
}

export function workflowBriefImagePackageMatches(value: unknown, targetMonth?: string): boolean {
  if (!workflowBriefProductionMatches(value, targetMonth)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const imagePackage = record.imagePackage;
  if (!isPurivaImagePackageBriefAttachment(imagePackage)) {
    return false;
  }
  if (targetMonth && (imagePackage as Record<string, unknown>).targetMonth !== targetMonth) {
    return false;
  }
  return true;
}

function collectClientFacingImageText(context: PurivaImagePackageContext): string {
  return context.imagePackages
    .flatMap((pkg) => pkg.concepts.flatMap((concept) => [concept.title, concept.altTextDraft]))
    .join("\n");
}

export function findUnsafeVisualPhrasesInImagePackage(
  context: PurivaImagePackageContext = buildPurivaImagePackageContext("2026-01")
): string[] {
  const haystack = collectClientFacingImageText(context).toLowerCase();
  return imagePackageSeed.unsafeVisualPhrases.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function validatePurivaImagePackageContext(
  context: PurivaImagePackageContext = buildPurivaImagePackageContext("2026-01"),
  contentProduction: PurivaContentProductionContext = buildPurivaContentProductionContext(context.targetMonth),
  seoPlan: PurivaSeoPlanContext = buildPurivaSeoPlanContext(context.targetMonth)
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.version !== PURIVA_IMAGE_PACKAGE_VERSION) {
    errors.push(`Unexpected image package version: ${context.version}`);
  }

  if (context.imagePackages.length !== contentProduction.draftScaffolds.length) {
    errors.push("Image package count must match content production scaffold count");
  }

  if (context.imagePackages.length !== seoPlan.items.length) {
    errors.push("Image package count must match SEO plan item count");
  }

  const packageIds = new Set(context.imagePackages.map((pkg) => pkg.seoPlanItemId));
  for (const item of seoPlan.items) {
    if (!packageIds.has(item.id)) {
      errors.push(`Missing image package for SEO item ${item.id}`);
    }
  }

  for (const pkg of context.imagePackages) {
    const expectedCount = imagePackageSeed.conceptCountByContentType[pkg.contentType] ?? 3;
    if (pkg.concepts.length !== expectedCount) {
      errors.push(
        `Image package ${pkg.seoPlanItemId} expected ${expectedCount} concepts for ${pkg.contentType}, got ${pkg.concepts.length}`
      );
    }

    for (const concept of pkg.concepts) {
      if (!concept.promptScaffold.includes(imagePackageSeed.internalPromptLabel)) {
        errors.push(`Concept ${concept.id} prompt must be marked internal admin only`);
      }
      if (!concept.promptScaffold.includes(PURIVA_IMAGE_PACKAGE_MARKER)) {
        errors.push(`Concept ${concept.id} prompt missing package marker`);
      }
      if (!concept.altTextDraft.trim()) {
        errors.push(`Concept ${concept.id} missing alt text draft`);
      }
      if (concept.complianceFlags.length === 0) {
        errors.push(`Concept ${concept.id} missing compliance flags`);
      }
      if (concept.conceptStatus !== "internal_prompt_scaffold") {
        errors.push(`Concept ${concept.id} must remain internal prompt scaffold`);
      }
    }

    if (pkg.finalReadyGating.allowed !== false) {
      errors.push(`Image package ${pkg.seoPlanItemId} must not be final-ready at scaffold stage`);
    }
    if (pkg.finalReadyGating.reasons.length === 0) {
      errors.push(`Image package ${pkg.seoPlanItemId} missing final-ready gating reasons`);
    }
    if (pkg.packageStatus !== "internal_prompt_scaffold") {
      errors.push(`Image package ${pkg.seoPlanItemId} must remain internal prompt scaffold`);
    }

    if (
      (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(pkg.serviceCategoryId) &&
      !pkg.medicalReviewRequired
    ) {
      errors.push(`High-risk image package ${pkg.seoPlanItemId} must require medical review`);
    }

    if (pkg.serviceCategoryId === "wegovy_semaglutide_weight_management") {
      const hasPrescriptionFlag = pkg.complianceFlags.includes("prescription_medication_risk");
      if (!hasPrescriptionFlag) {
        errors.push(`Wegovy image package ${pkg.seoPlanItemId} must flag prescription_medication_risk`);
      }
    }

    const hasRelevantComplianceFlag = REQUIRED_IMAGE_COMPLIANCE_FLAGS.some((flag) =>
      pkg.complianceFlags.includes(flag)
    );
    if (
      (PURIVA_HIGH_RISK_CATEGORY_IDS as readonly string[]).includes(pkg.serviceCategoryId) &&
      !hasRelevantComplianceFlag
    ) {
      errors.push(`High-risk image package ${pkg.seoPlanItemId} missing required compliance flags`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /verification/i.test(note))) {
    errors.push("Missing verification-required notes in image package context");
  }

  const unsafe = findUnsafeVisualPhrasesInImagePackage(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe visual phrases in image package: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export function buildAiDeliveryArticleImageRequestsFromImagePackage(
  context: PurivaImagePackageContext = buildPurivaImagePackageContext("2026-01")
): Array<{
  seoPlanItemId: string;
  conceptId: string;
  title: string;
  prompt: string;
  styleNotes: string;
  status: string;
  notes: string;
  altTextDraft: string;
}> {
  return context.imagePackages.flatMap((pkg) =>
    pkg.concepts.map((concept) => ({
      seoPlanItemId: pkg.seoPlanItemId,
      conceptId: concept.id,
      title: concept.title,
      prompt: concept.promptScaffold,
      styleNotes: concept.visualSafetyNotes.join(" "),
      status: "DRAFT",
      notes: [
        PURIVA_IMAGE_PACKAGE_MARKER,
        `item:${pkg.seoPlanItemId}`,
        `concept:${concept.role}`,
        "internal_prompt_scaffold",
        "admin_only"
      ].join(" "),
      altTextDraft: concept.altTextDraft
    }))
  );
}

export function summarizePurivaImagePackageContext(
  context: PurivaImagePackageContext = buildPurivaImagePackageContext("2026-01")
): string {
  const conceptCount = context.imagePackages.reduce((sum, pkg) => sum + pkg.concepts.length, 0);
  return [
    `Puriva image package ${context.version}`,
    `month=${context.targetMonth}`,
    `packages=${context.imagePackages.length}`,
    `concepts=${conceptCount}`,
    `medical_review=${context.imagePackages.filter((entry) => entry.medicalReviewRequired).length}`
  ].join(" · ");
}
