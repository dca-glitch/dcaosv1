/**
 * Image generation foundation — disabled-safe variant scaffolding + reject/client-safe helpers.
 *
 * Pure local logic only. No provider client, no network calls, no storageKey
 * persistence, no schema changes. This module defines the hero / supporting_1 /
 * supporting_2 / social_preview variant shape from
 * docs/runbooks/IMAGE_GENERATION_PROOF.md §1.2 and the disabled-safe execution,
 * required-reason reject, and client-safe-metadata helpers needed before any
 * live provider wiring (Phase C+) can be approved.
 */

import type { ImageGenerationIntegrationReadiness } from "../config/image-generation.config";

export const IMAGE_GENERATION_FOUNDATION_VERSION = "IMAGE_GENERATION_FOUNDATION_V1";

export const IMAGE_GENERATION_VARIANT_SLOTS = [
  "hero",
  "supporting_1",
  "supporting_2",
  "social_preview"
] as const;

export type ImageGenerationVariantSlot = (typeof IMAGE_GENERATION_VARIANT_SLOTS)[number];

export const IMAGE_GENERATION_VARIANT_LABEL: Record<ImageGenerationVariantSlot, string> = {
  hero: "Hero",
  supporting_1: "Supporting 1",
  supporting_2: "Supporting 2",
  social_preview: "Social preview"
};

export const IMAGE_GENERATION_VARIANT_ASPECT_RATIO: Record<ImageGenerationVariantSlot, string> = {
  hero: "16:9",
  supporting_1: "4:3",
  supporting_2: "4:3",
  social_preview: "1.91:1"
};

export const IMAGE_GENERATION_VARIANT_PURPOSE: Record<ImageGenerationVariantSlot, string> = {
  hero: "Article header / WordPress featured image",
  supporting_1: "Inline section A",
  supporting_2: "Inline section B",
  social_preview: "OG / Twitter card"
};

export type ImageGenerationVariantRequestInput = {
  contentDraftId: string;
  draftTitle: string;
  targetKeyword?: string | null;
  briefTitle?: string | null;
};

export type ImageGenerationVariantRequest = {
  id: string;
  contentDraftId: string;
  variantSlot: ImageGenerationVariantSlot;
  variantLabel: string;
  aspectRatio: string;
  prompt: string;
  status: "queued_disabled";
};

function buildVariantPrompt(
  slot: ImageGenerationVariantSlot,
  input: ImageGenerationVariantRequestInput
): string {
  const keyword = input.targetKeyword?.trim() || "primary topic";
  const briefTitle = input.briefTitle?.trim();

  return [
    `Variant: ${IMAGE_GENERATION_VARIANT_LABEL[slot]} (${IMAGE_GENERATION_VARIANT_ASPECT_RATIO[slot]}).`,
    `Article: "${input.draftTitle.trim()}".`,
    `Keyword focus: ${keyword}.`,
    briefTitle ? `Campaign brief: ${briefTitle}.` : null,
    "Professional, on-brand, no misleading before/after or outcome imagery, no real-person likeness without consent."
  ]
    .filter((line): line is string => Boolean(line))
    .join(" ");
}

/**
 * Builds the full hero/supporting_1/supporting_2/social_preview request set for a
 * content draft. Pure function — no persistence, no provider call.
 */
export function buildImageGenerationVariantRequestSet(
  input: ImageGenerationVariantRequestInput
): ImageGenerationVariantRequest[] {
  return IMAGE_GENERATION_VARIANT_SLOTS.map((slot) => ({
    id: `${input.contentDraftId}_${slot}`,
    contentDraftId: input.contentDraftId,
    variantSlot: slot,
    variantLabel: IMAGE_GENERATION_VARIANT_LABEL[slot],
    aspectRatio: IMAGE_GENERATION_VARIANT_ASPECT_RATIO[slot],
    prompt: buildVariantPrompt(slot, input),
    status: "queued_disabled"
  }));
}

export type ImageGenerationExecutionOutcome =
  | "skipped_disabled"
  | "skipped_missing_config"
  | "skipped_not_implemented";

export type ImageGenerationExecutionResult = {
  requestId: string;
  variantSlot: ImageGenerationVariantSlot;
  outcome: ImageGenerationExecutionOutcome;
  providerCalled: false;
  reason: string;
};

/**
 * Disabled-safe execution: never issues a provider call regardless of readiness
 * status. `configured_shape_ok` still resolves to `skipped_not_implemented`
 * because no live provider client is wired in this block.
 */
/**
 * Hard no-live guard (G323): every execution path must set providerCalled=false.
 * This block never contacts an image provider regardless of readiness status.
 */
export const IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED = false as const;

export function executeImageGenerationVariantRequest(
  request: ImageGenerationVariantRequest,
  readiness: ImageGenerationIntegrationReadiness
): ImageGenerationExecutionResult {
  if (readiness.status === "disabled") {
    return {
      requestId: request.id,
      variantSlot: request.variantSlot,
      outcome: "skipped_disabled",
      providerCalled: false,
      reason: "Image generation disabled (IMAGE_GENERATION_ENABLED is not true)."
    };
  }

  if (readiness.status === "missing_config") {
    return {
      requestId: request.id,
      variantSlot: request.variantSlot,
      outcome: "skipped_missing_config",
      providerCalled: false,
      reason: `Image generation enabled but missing required config: ${readiness.missingKeys.join(", ")}.`
    };
  }

  return {
    requestId: request.id,
    variantSlot: request.variantSlot,
    outcome: "skipped_not_implemented",
    providerCalled: false,
    reason: "Provider config shape OK; live provider execution is not implemented in this block."
  };
}

export function executeImageGenerationVariantRequestSet(
  requests: ImageGenerationVariantRequest[],
  readiness: ImageGenerationIntegrationReadiness
): ImageGenerationExecutionResult[] {
  return requests.map((request) => executeImageGenerationVariantRequest(request, readiness));
}

export function summarizeImageGenerationExecutionResults(
  results: ImageGenerationExecutionResult[]
): {
  total: number;
  skippedDisabled: number;
  skippedMissingConfig: number;
  skippedNotImplemented: number;
  anyProviderCalled: boolean;
} {
  return {
    total: results.length,
    skippedDisabled: results.filter((result) => result.outcome === "skipped_disabled").length,
    skippedMissingConfig: results.filter((result) => result.outcome === "skipped_missing_config").length,
    skippedNotImplemented: results.filter((result) => result.outcome === "skipped_not_implemented").length,
    anyProviderCalled: results.some((result): boolean => result.providerCalled)
  };
}

const MIN_REJECT_REASON_LENGTH = 3;

export type ImageGenerationRejectValidation =
  | { ok: true; reason: string }
  | { ok: false; error: string };

/**
 * Reject always requires a non-empty reason (learning-layer input per
 * docs/runbooks/IMAGE_GENERATION_PROOF.md §1.9). Never optional.
 */
export function validateImageGenerationRejectReason(
  reason: string | null | undefined
): ImageGenerationRejectValidation {
  const trimmed = (reason ?? "").trim();

  if (!trimmed) {
    return { ok: false, error: "Reject reason is required." };
  }

  if (trimmed.length < MIN_REJECT_REASON_LENGTH) {
    return { ok: false, error: `Reject reason must be at least ${MIN_REJECT_REASON_LENGTH} characters.` };
  }

  return { ok: true, reason: trimmed };
}

export type ImageGenerationRejection = {
  requestId: string;
  variantSlot: ImageGenerationVariantSlot;
  rejectReason: string;
  rejectedAtIso: string;
};

export function buildImageGenerationRejection(input: {
  requestId: string;
  variantSlot: ImageGenerationVariantSlot;
  reason: string | null | undefined;
}): { ok: true; rejection: ImageGenerationRejection } | { ok: false; error: string } {
  const validation = validateImageGenerationRejectReason(input.reason);

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return {
    ok: true,
    rejection: {
      requestId: input.requestId,
      variantSlot: input.variantSlot,
      rejectReason: validation.reason,
      rejectedAtIso: new Date().toISOString()
    }
  };
}

export type ImageGenerationClientSafeVariant = {
  variantSlot: ImageGenerationVariantSlot;
  variantLabel: string;
  status: "not_generated";
  rejectReason: string | null;
};

/**
 * Client boundary: only variant slot, label, a fixed status, and (if present) the
 * reject reason are exposed. No `prompt`, `provider`, `model`, or `storageKey`.
 */
export function toImageGenerationClientSafeVariant(input: {
  variantSlot: ImageGenerationVariantSlot;
  rejectReason?: string | null;
}): ImageGenerationClientSafeVariant {
  return {
    variantSlot: input.variantSlot,
    variantLabel: IMAGE_GENERATION_VARIANT_LABEL[input.variantSlot],
    status: "not_generated",
    rejectReason: input.rejectReason?.trim() || null
  };
}

export function toImageGenerationClientSafeVariantSet(
  requests: ImageGenerationVariantRequest[],
  rejections: ImageGenerationRejection[] = []
): ImageGenerationClientSafeVariant[] {
  const rejectionBySlot = new Map(rejections.map((rejection) => [rejection.variantSlot, rejection.rejectReason]));

  return requests.map((request) =>
    toImageGenerationClientSafeVariant({
      variantSlot: request.variantSlot,
      rejectReason: rejectionBySlot.get(request.variantSlot) ?? null
    })
  );
}

const FORBIDDEN_CLIENT_FIELD_PATTERN = /storageKey|prompt|provider|model|apiKey/i;

/**
 * Test/boundary helper — returns true when a serialized client-safe payload
 * contains none of the internal-only field names.
 */
export function isFreeOfInternalOnlyFields(value: unknown): boolean {
  return !FORBIDDEN_CLIENT_FIELD_PATTERN.test(JSON.stringify(value));
}

export type ImageGenerationFoundationSnapshot = {
  version: typeof IMAGE_GENERATION_FOUNDATION_VERSION;
  variantSlots: Array<{
    slot: ImageGenerationVariantSlot;
    label: string;
    aspectRatio: string;
    purpose: string;
  }>;
  readiness: ImageGenerationIntegrationReadiness;
  disabledSafe: true;
  liveProviderCallsDeferred: true;
  liveProviderCallsAllowed: typeof IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED;
  note: string;
};

/**
 * Static, non-draft-specific foundation snapshot for admin config visibility.
 * No provider call, no DB read/write.
 */
export function buildImageGenerationFoundationSnapshot(
  readiness: ImageGenerationIntegrationReadiness
): ImageGenerationFoundationSnapshot {
  return {
    version: IMAGE_GENERATION_FOUNDATION_VERSION,
    variantSlots: IMAGE_GENERATION_VARIANT_SLOTS.map((slot) => ({
      slot,
      label: IMAGE_GENERATION_VARIANT_LABEL[slot],
      aspectRatio: IMAGE_GENERATION_VARIANT_ASPECT_RATIO[slot],
      purpose: IMAGE_GENERATION_VARIANT_PURPOSE[slot]
    })),
    readiness,
    disabledSafe: true,
    liveProviderCallsDeferred: true,
    liveProviderCallsAllowed: IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED,
    note:
      "Foundation snapshot only. No provider call is made regardless of readiness status; see docs/runbooks/IMAGE_GENERATION_PROOF.md Phase B."
  };
}
