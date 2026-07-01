import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance.mjs";
import {
  buildPurivaContentProductionContext,
  buildPurivaWorkflowBriefProductionInput,
  PURIVA_CONTENT_PRODUCTION_MARKER,
  PURIVA_CONTENT_PRODUCTION_VERSION,
  workflowBriefProductionMatches
} from "./puriva-content-production.mjs";
import {
  buildPurivaSeoPlanContext
} from "./puriva-seo-plan.mjs";
import { PURIVA_HIGH_RISK_CATEGORY_IDS } from "./puriva-service-taxonomy.mjs";

const imagePackageJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-image-package.json"
);

export const PURIVA_IMAGE_PACKAGE_VERSION = "PURIVA_IMAGE_PACKAGE_V1";
export const PURIVA_IMAGE_PACKAGE_KIND = "puriva_image_package_seed";
export const PURIVA_IMAGE_PACKAGE_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_IMAGE_PACKAGE_V1";
export const PURIVA_IMAGE_INTERNAL_PROMPT_LABEL =
  "INTERNAL ADMIN IMAGE PROMPT SCAFFOLD — NOT FOR CLIENT OR GENERATION USE";

const REQUIRED_IMAGE_COMPLIANCE_FLAGS = [
  "before_after_result_claim_risk",
  "medical_claim_risk",
  "prescription_medication_risk"
];

let cachedSeed = null;

export function getPurivaImagePackageSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(imagePackageJsonPath, "utf8"));
  }
  return cachedSeed;
}

function conceptRolesForContentType(contentType) {
  const seed = getPurivaImagePackageSeed();
  const count = seed.conceptCountByContentType[contentType] ?? 3;
  return seed.conceptRoles.slice(0, count);
}

function topicLabel(scaffold) {
  return scaffold.targetKeyword.trim() || scaffold.title.replace(/^\[Draft Scaffold\]\s*/i, "");
}

function buildPromptScaffold(role, scaffold) {
  const seed = getPurivaImagePackageSeed();
  const fragment =
    seed.promptFragments[role]?.[scaffold.contentType] ??
    seed.promptFragments[role]?.service_page ??
    "Neutral licensed clinic educational visual concept.";
  const topic = topicLabel(scaffold);

  return [
    seed.internalPromptLabel,
    PURIVA_IMAGE_PACKAGE_MARKER,
    `SEO plan item: ${scaffold.seoPlanItemId}`,
    `Content type: ${scaffold.contentType}`,
    `Topic focus: ${topic}`,
    `Role: ${role}`,
    fragment,
    "Planning reference only — no generation, no client distribution, no before/after or outcome imagery."
  ].join("\n");
}

function buildAltTextDraft(role, scaffold) {
  const seed = getPurivaImagePackageSeed();
  const pattern =
    seed.altTextPatterns[role] ??
    "Educational {topic} visual at a licensed Bali clinic, neutral planning reference";
  return pattern.replace("{topic}", topicLabel(scaffold));
}

function buildConceptTitle(role, scaffold) {
  return `[Image Scaffold] ${role.label} — ${topicLabel(scaffold)}`;
}

function buildImageConcept(role, scaffold) {
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
    visualSafetyNotes: getPurivaImagePackageSeed().visualSafetyNotes
  };
}

function buildImagePackage(scaffold) {
  const seed = getPurivaImagePackageSeed();
  const roles = conceptRolesForContentType(scaffold.contentType);
  const concepts = roles.map((role) => buildImageConcept(role, scaffold));
  const complianceFlags = [...new Set(concepts.flatMap((concept) => concept.complianceFlags))];

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
      reasons: [...seed.finalReadyGatingReasons]
    },
    packageMetadata: {
      packageKind: PURIVA_IMAGE_PACKAGE_KIND,
      packageVersion: PURIVA_IMAGE_PACKAGE_VERSION,
      label: seed.internalPromptLabel,
      seoPlanItemId: scaffold.seoPlanItemId,
      conceptCount: concepts.length
    }
  };
}

export function buildPurivaImagePackageContext(targetMonth, contentProduction) {
  const production =
    contentProduction ?? buildPurivaContentProductionContext(targetMonth, buildPurivaSeoPlanContext(targetMonth));
  const seed = getPurivaImagePackageSeed();
  return {
    version: PURIVA_IMAGE_PACKAGE_VERSION,
    kind: PURIVA_IMAGE_PACKAGE_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    contentProductionVersion: production.version,
    imagePackages: production.draftScaffolds.map(buildImagePackage),
    visualSafetyNotes: seed.visualSafetyNotes,
    verificationRequiredNotes: seed.verificationRequiredNotes
  };
}

export function buildPurivaWorkflowBriefImagePackageInput(targetMonth) {
  return {
    ...buildPurivaWorkflowBriefProductionInput(targetMonth),
    imagePackage: buildPurivaImagePackageContext(targetMonth)
  };
}

export function isPurivaImagePackageBriefAttachment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return value.kind === PURIVA_IMAGE_PACKAGE_KIND && value.version === PURIVA_IMAGE_PACKAGE_VERSION;
}

export function workflowBriefImagePackageMatches(value, targetMonth) {
  if (!workflowBriefProductionMatches(value, targetMonth)) {
    return false;
  }
  if (!isPurivaImagePackageBriefAttachment(value.imagePackage)) {
    return false;
  }
  if (targetMonth && value.imagePackage?.targetMonth !== targetMonth) {
    return false;
  }
  return true;
}

function collectClientFacingImageText(context) {
  return context.imagePackages
    .flatMap((pkg) => pkg.concepts.flatMap((concept) => [concept.title, concept.altTextDraft]))
    .join("\n");
}

export function findUnsafeVisualPhrasesInImagePackage(context = buildPurivaImagePackageContext("2026-01")) {
  const seed = getPurivaImagePackageSeed();
  const haystack = collectClientFacingImageText(context).toLowerCase();
  return seed.unsafeVisualPhrases.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function validatePurivaImagePackageContext(
  context = buildPurivaImagePackageContext("2026-01"),
  contentProduction = buildPurivaContentProductionContext(context.targetMonth),
  seoPlan = buildPurivaSeoPlanContext(context.targetMonth)
) {
  const errors = [];
  const seed = getPurivaImagePackageSeed();

  if (context.version !== PURIVA_IMAGE_PACKAGE_VERSION) {
    errors.push(`Unexpected image package version: ${context.version}`);
  }

  if (context.imagePackages.length !== contentProduction.draftScaffolds.length) {
    errors.push("Image package count must match content production scaffold count");
  }

  if (context.imagePackages.length !== seoPlan.items.length) {
    errors.push("Image package count must match SEO plan item count");
  }

  for (const item of seoPlan.items) {
    if (!context.imagePackages.some((pkg) => pkg.seoPlanItemId === item.id)) {
      errors.push(`Missing image package for SEO item ${item.id}`);
    }
  }

  for (const pkg of context.imagePackages) {
    const expectedCount = seed.conceptCountByContentType[pkg.contentType] ?? 3;
    if (pkg.concepts.length !== expectedCount) {
      errors.push(
        `Image package ${pkg.seoPlanItemId} expected ${expectedCount} concepts for ${pkg.contentType}, got ${pkg.concepts.length}`
      );
    }

    for (const concept of pkg.concepts) {
      if (!concept.promptScaffold.includes(seed.internalPromptLabel)) {
        errors.push(`Concept ${concept.id} prompt must be marked internal admin only`);
      }
      if (!concept.altTextDraft.trim()) {
        errors.push(`Concept ${concept.id} missing alt text draft`);
      }
      if (concept.complianceFlags.length === 0) {
        errors.push(`Concept ${concept.id} missing compliance flags`);
      }
    }

    if (pkg.finalReadyGating.allowed !== false) {
      errors.push(`Image package ${pkg.seoPlanItemId} must not be final-ready at scaffold stage`);
    }

    if (PURIVA_HIGH_RISK_CATEGORY_IDS.includes(pkg.serviceCategoryId) && !pkg.medicalReviewRequired) {
      errors.push(`High-risk image package ${pkg.seoPlanItemId} must require medical review`);
    }

    if (pkg.serviceCategoryId === "wegovy_semaglutide_weight_management") {
      if (!pkg.complianceFlags.includes("prescription_medication_risk")) {
        errors.push(`Wegovy image package ${pkg.seoPlanItemId} must flag prescription_medication_risk`);
      }
    }

    const hasRelevantComplianceFlag = REQUIRED_IMAGE_COMPLIANCE_FLAGS.some((flag) =>
      pkg.complianceFlags.includes(flag)
    );
    if (PURIVA_HIGH_RISK_CATEGORY_IDS.includes(pkg.serviceCategoryId) && !hasRelevantComplianceFlag) {
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

export function buildAiDeliveryArticleImageRequestsFromImagePackage(context) {
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

function findContentDraftForSeoItem(contentDrafts, seoPlanItemId) {
  return (
    contentDrafts.find(
      (draft) =>
        typeof draft.notes === "string" &&
        draft.notes.includes(PURIVA_CONTENT_PRODUCTION_MARKER) &&
        draft.notes.includes(`item:${seoPlanItemId}`)
    ) ?? null
  );
}

function hasImagePackageConcept(existingImages, seoPlanItemId, conceptRole) {
  return existingImages.some(
    (image) =>
      typeof image.notes === "string" &&
      image.notes.includes(PURIVA_IMAGE_PACKAGE_MARKER) &&
      image.notes.includes(`item:${seoPlanItemId}`) &&
      image.notes.includes(`concept:${conceptRole}`)
  );
}

function conceptRoleFromImageRequest(imageRequest) {
  return imageRequest.notes.match(/concept:([a-z_]+)/)?.[1] ?? null;
}

export async function ensurePurivaImagePackageApiSeed({
  request,
  token,
  aiDeliveryProject,
  targetMonth,
  log = () => {}
}) {
  const contentProduction = buildPurivaContentProductionContext(targetMonth);
  const context = buildPurivaImagePackageContext(targetMonth, contentProduction);
  const validation = validatePurivaImagePackageContext(context, contentProduction);
  if (!validation.ok) {
    throw new Error(`Puriva image package invalid: ${validation.errors.join("; ")}`);
  }

  const created = { articleImages: 0 };

  const draftsResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/content-drafts`, { token });
  const existingDrafts = draftsResponse.body?.data?.contentDrafts ?? [];

  const imagesResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/article-images`, { token });
  const existingImages = imagesResponse.body?.data?.articleImages ?? [];

  for (const imageRequest of buildAiDeliveryArticleImageRequestsFromImagePackage(context)) {
    const conceptRole = conceptRoleFromImageRequest(imageRequest);
    if (conceptRole && hasImagePackageConcept(existingImages, imageRequest.seoPlanItemId, conceptRole)) {
      log(`reused image package concept: ${imageRequest.seoPlanItemId}/${conceptRole}`);
      continue;
    }

    const contentDraft = findContentDraftForSeoItem(existingDrafts, imageRequest.seoPlanItemId);
    if (!contentDraft?.id) {
      throw new Error(`Missing content draft for image package item ${imageRequest.seoPlanItemId}`);
    }

    const createResponse = await request(`/ai-delivery-projects/${aiDeliveryProject.id}/article-images`, {
      method: "POST",
      token,
      body: {
        contentDraftId: contentDraft.id,
        title: imageRequest.title,
        prompt: imageRequest.prompt,
        styleNotes: `${imageRequest.styleNotes} Alt text draft: ${imageRequest.altTextDraft}`,
        status: imageRequest.status,
        previewImageUrl: "",
        finalImageUrl: "",
        storageKey: "",
        notes: imageRequest.notes
      }
    });

    if (createResponse.status !== 201 || createResponse.body?.ok !== true) {
      throw new Error(
        `Puriva image package concept create failed for ${imageRequest.conceptId} with HTTP ${createResponse.status}.`
      );
    }

    created.articleImages += 1;
    log(`created image package concept: ${imageRequest.conceptId}`);
  }

  return { context, created };
}

export function summarizePurivaImagePackageContext(context = buildPurivaImagePackageContext("2026-01")) {
  const conceptCount = context.imagePackages.reduce((sum, pkg) => sum + pkg.concepts.length, 0);
  return [
    `Puriva image package ${context.version}`,
    `month=${context.targetMonth}`,
    `packages=${context.imagePackages.length}`,
    `concepts=${conceptCount}`,
    `medical_review=${context.imagePackages.filter((entry) => entry.medicalReviewRequired).length}`
  ].join(" · ");
}
