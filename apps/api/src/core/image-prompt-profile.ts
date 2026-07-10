/**
 * Image prompt profile validator (G190).
 *
 * Pure local logic: validates hero / supporting inline / social preview /
 * service-specific prompt profiles for forbidden elements, alt-text requirement,
 * aspect ratio, and profile ID. No provider calls, no DB.
 */

import {
  IMAGE_GENERATION_VARIANT_ASPECT_RATIO,
  IMAGE_GENERATION_VARIANT_SLOTS,
  type ImageGenerationVariantSlot
} from "./image-generation.execution";
import {
  IMAGE_COMPLIANCE_HARD_BLOCK_CODES,
  IMAGE_COMPLIANCE_REJECT_CODES,
  type ImageComplianceRejectCode,
  evaluateImageCompliancePolicy
} from "./image-compliance-policy";

export const IMAGE_PROMPT_PROFILE_VERSION = "IMAGE_PROMPT_PROFILE_V3";

export const IMAGE_PROMPT_PROFILE_KINDS = [
  "hero",
  "supporting_inline",
  "social_preview",
  "service_specific"
] as const;

export type ImagePromptProfileKindId = (typeof IMAGE_PROMPT_PROFILE_KINDS)[number];

export const IMAGE_PROMPT_PROFILE_IDS = [
  "puriva_hero_v1",
  "puriva_supporting_inline_v1",
  "puriva_social_preview_v1",
  "puriva_service_specific_v1"
] as const;

export type ImagePromptProfileId = (typeof IMAGE_PROMPT_PROFILE_IDS)[number];

export const IMAGE_PROMPT_PROFILE_ID_BY_KIND: Record<ImagePromptProfileKindId, ImagePromptProfileId> = {
  hero: "puriva_hero_v1",
  supporting_inline: "puriva_supporting_inline_v1",
  social_preview: "puriva_social_preview_v1",
  service_specific: "puriva_service_specific_v1"
};

export const IMAGE_PROMPT_PROFILE_DEFAULT_ASPECT: Record<ImagePromptProfileKindId, string> = {
  hero: IMAGE_GENERATION_VARIANT_ASPECT_RATIO.hero,
  supporting_inline: IMAGE_GENERATION_VARIANT_ASPECT_RATIO.supporting_1,
  social_preview: IMAGE_GENERATION_VARIANT_ASPECT_RATIO.social_preview,
  service_specific: IMAGE_GENERATION_VARIANT_ASPECT_RATIO.supporting_2
};

export const IMAGE_PROMPT_PROFILE_ALLOWED_ASPECTS: Record<ImagePromptProfileKindId, readonly string[]> = {
  hero: ["16:9", "3:2"],
  supporting_inline: ["4:3", "1:1", "3:2"],
  social_preview: ["1.91:1", "1:1"],
  service_specific: ["4:3", "1:1", "16:9"]
};

export type ImagePromptProfileCandidate = {
  profileId: string;
  kind: ImagePromptProfileKindId;
  aspectRatio: string;
  promptText: string;
  altText?: string | null;
  /** Optional slot when mapping from generation variant scaffolding. */
  slot?: ImageGenerationVariantSlot | null;
  /** Service-specific profiles may name a service category. */
  serviceCategoryId?: string | null;
  forbiddenElements?: ImageComplianceRejectCode[];
};

export type ImagePromptProfileValidationIssue = {
  code:
    | "unknown_profile_id"
    | "profile_id_kind_mismatch"
    | "unknown_kind"
    | "invalid_aspect_ratio"
    | "missing_alt_text"
    | "forbidden_element"
    | "service_category_required"
    | "slot_kind_mismatch";
  message: string;
};

export type ImagePromptProfileValidationResult =
  | {
      ok: true;
      version: typeof IMAGE_PROMPT_PROFILE_VERSION;
      profileId: ImagePromptProfileId;
      kind: ImagePromptProfileKindId;
      aspectRatio: string;
      altTextRequired: true;
      forbiddenElements: ImageComplianceRejectCode[];
    }
  | {
      ok: false;
      version: typeof IMAGE_PROMPT_PROFILE_VERSION;
      issues: ImagePromptProfileValidationIssue[];
    };

const DEFAULT_FORBIDDEN: ImageComplianceRejectCode[] = [...IMAGE_COMPLIANCE_HARD_BLOCK_CODES];

/** Maps generation variant slots to prompt-profile kinds (G313). */
export function resolveImagePromptProfileKindForSlot(
  slot: ImageGenerationVariantSlot
): ImagePromptProfileKindId {
  if (slot === "hero") {
    return "hero";
  }
  if (slot === "social_preview") {
    return "social_preview";
  }
  return "supporting_inline";
}

function slotMatchesKind(slot: ImageGenerationVariantSlot, kind: ImagePromptProfileKindId): boolean {
  if (kind === "hero") {
    return slot === "hero";
  }
  if (kind === "social_preview") {
    return slot === "social_preview";
  }
  if (kind === "supporting_inline") {
    return slot === "supporting_1" || slot === "supporting_2";
  }
  // service_specific may map to any non-social slot
  return slot !== "social_preview";
}

/**
 * Validates a prompt profile candidate for G190 requirements:
 * known profile ID, kind, aspect ratio, alt text presence, and forbidden elements.
 */
export function validateImagePromptProfile(
  candidate: ImagePromptProfileCandidate
): ImagePromptProfileValidationResult {
  const issues: ImagePromptProfileValidationIssue[] = [];

  if (!IMAGE_PROMPT_PROFILE_KINDS.includes(candidate.kind)) {
    issues.push({
      code: "unknown_kind",
      message: `Unknown prompt profile kind "${String(candidate.kind)}".`
    });
    return { ok: false, version: IMAGE_PROMPT_PROFILE_VERSION, issues };
  }

  const expectedId = IMAGE_PROMPT_PROFILE_ID_BY_KIND[candidate.kind];
  if (!(IMAGE_PROMPT_PROFILE_IDS as readonly string[]).includes(candidate.profileId)) {
    issues.push({
      code: "unknown_profile_id",
      message: `Unknown prompt profile ID "${candidate.profileId}".`
    });
  } else if (candidate.profileId !== expectedId) {
    issues.push({
      code: "profile_id_kind_mismatch",
      message: `Profile ID "${candidate.profileId}" does not match kind "${candidate.kind}" (expected "${expectedId}").`
    });
  }

  const allowedAspects = IMAGE_PROMPT_PROFILE_ALLOWED_ASPECTS[candidate.kind];
  if (!allowedAspects.includes(candidate.aspectRatio)) {
    issues.push({
      code: "invalid_aspect_ratio",
      message: `Aspect ratio "${candidate.aspectRatio}" is not allowed for kind "${candidate.kind}".`
    });
  }

  const alt = candidate.altText?.trim() ?? "";
  if (!alt) {
    issues.push({
      code: "missing_alt_text",
      message: "Alt text is required for every prompt profile."
    });
  }

  if (candidate.kind === "service_specific" && !candidate.serviceCategoryId?.trim()) {
    issues.push({
      code: "service_category_required",
      message: "Service-specific prompt profiles require a serviceCategoryId."
    });
  }

  if (candidate.slot) {
    if (!(IMAGE_GENERATION_VARIANT_SLOTS as readonly string[]).includes(candidate.slot)) {
      issues.push({
        code: "slot_kind_mismatch",
        message: `Unknown variant slot "${String(candidate.slot)}".`
      });
    } else if (!slotMatchesKind(candidate.slot, candidate.kind)) {
      issues.push({
        code: "slot_kind_mismatch",
        message: `Variant slot "${candidate.slot}" does not match profile kind "${candidate.kind}".`
      });
    }
  }

  const forbidden =
    candidate.forbiddenElements && candidate.forbiddenElements.length > 0
      ? candidate.forbiddenElements
      : DEFAULT_FORBIDDEN;

  for (const code of forbidden) {
    if (!IMAGE_COMPLIANCE_REJECT_CODES.includes(code)) {
      issues.push({
        code: "forbidden_element",
        message: `Unknown forbidden element code "${code}".`
      });
    }
  }

  const compliance = evaluateImageCompliancePolicy({
    stage: "pre_generation_prompt",
    text: candidate.promptText
  });
  for (const finding of compliance.findings) {
    if (forbidden.includes(finding.code)) {
      issues.push({
        code: "forbidden_element",
        message: `Prompt contains forbidden element ${finding.code} (${finding.matchedRule}).`
      });
    }
  }

  if (issues.length > 0) {
    return { ok: false, version: IMAGE_PROMPT_PROFILE_VERSION, issues };
  }

  return {
    ok: true,
    version: IMAGE_PROMPT_PROFILE_VERSION,
    profileId: candidate.profileId as ImagePromptProfileId,
    kind: candidate.kind,
    aspectRatio: candidate.aspectRatio,
    altTextRequired: true,
    forbiddenElements: [...forbidden]
  };
}

export function buildDefaultImagePromptProfileCandidate(input: {
  kind: ImagePromptProfileKindId;
  promptText: string;
  altText: string;
  aspectRatio?: string;
  slot?: ImageGenerationVariantSlot | null;
  serviceCategoryId?: string | null;
}): ImagePromptProfileCandidate {
  return {
    profileId: IMAGE_PROMPT_PROFILE_ID_BY_KIND[input.kind],
    kind: input.kind,
    aspectRatio: input.aspectRatio ?? IMAGE_PROMPT_PROFILE_DEFAULT_ASPECT[input.kind],
    promptText: input.promptText,
    altText: input.altText,
    slot: input.slot ?? null,
    serviceCategoryId: input.serviceCategoryId ?? null,
    forbiddenElements: [...DEFAULT_FORBIDDEN]
  };
}

export type ImagePromptProfileCatalogEntry = {
  kind: ImagePromptProfileKindId;
  profileId: ImagePromptProfileId;
  defaultAspectRatio: string;
  allowedAspectRatios: readonly string[];
  altTextRequired: true;
  forbiddenElements: ImageComplianceRejectCode[];
};

/**
 * G556 — Stable catalog of prompt profiles for docs/tests (no provider contact).
 */
export function listImagePromptProfileCatalog(): ImagePromptProfileCatalogEntry[] {
  return IMAGE_PROMPT_PROFILE_KINDS.map((kind) => ({
    kind,
    profileId: IMAGE_PROMPT_PROFILE_ID_BY_KIND[kind],
    defaultAspectRatio: IMAGE_PROMPT_PROFILE_DEFAULT_ASPECT[kind],
    allowedAspectRatios: IMAGE_PROMPT_PROFILE_ALLOWED_ASPECTS[kind],
    altTextRequired: true as const,
    forbiddenElements: [...DEFAULT_FORBIDDEN]
  }));
}
