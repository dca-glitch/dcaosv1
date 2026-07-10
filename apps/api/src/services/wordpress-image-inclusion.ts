/**
 * WordPress draft image inclusion contract (local-only, no HTTP).
 *
 * Maps accepted hero / supporting / social_preview slots into the draft payload
 * shape. Does not call image-compliance modules or WordPress media APIs.
 */

export const WORDPRESS_DRAFT_IMAGE_SLOTS = ["hero", "supporting_1", "supporting_2", "social_preview"] as const;

export type WordPressDraftImageSlot = (typeof WORDPRESS_DRAFT_IMAGE_SLOTS)[number];

export type WordPressDraftImageAcceptance = "accepted" | "rejected" | "pending" | "missing";

export interface WordPressDraftImageCandidate {
  slot: WordPressDraftImageSlot;
  acceptance: WordPressDraftImageAcceptance;
  /**
   * Non-secret reference only (storage key, public URL placeholder, or null).
   * Never a credential or signed secret.
   */
  reference: string | null;
  altText?: string | null;
  caption?: string | null;
}

export interface WordPressDraftImageInclusion {
  /**
   * Featured image maps from accepted hero only.
   */
  featuredImagePlaceholder: string | null;
  /**
   * Inline supporting images from accepted supporting_1 / supporting_2.
   */
  supportingImagePlaceholders: string[];
  /**
   * Social / OG preview maps from accepted social_preview only.
   */
  socialPreviewPlaceholder: string | null;
  /**
   * True when at least one accepted image was mapped.
   */
  hasAcceptedImages: boolean;
  /**
   * Human-readable note for operators (no secrets).
   */
  note: string;
}

function isAccepted(candidate: WordPressDraftImageCandidate): boolean {
  return candidate.acceptance === "accepted" && Boolean(candidate.reference?.trim());
}

/**
 * Map accepted image candidates into WordPress draft payload placeholders.
 * Rejected/pending/missing slots are ignored. No live media upload.
 */
export function mapAcceptedImagesToWordPressDraftInclusion(
  candidates: WordPressDraftImageCandidate[]
): WordPressDraftImageInclusion {
  const accepted = candidates.filter(isAccepted);
  const bySlot = new Map(accepted.map((candidate) => [candidate.slot, candidate] as const));

  const hero = bySlot.get("hero");
  const supporting = WORDPRESS_DRAFT_IMAGE_SLOTS.filter(
    (slot): slot is "supporting_1" | "supporting_2" => slot === "supporting_1" || slot === "supporting_2"
  )
    .map((slot) => bySlot.get(slot)?.reference?.trim() || null)
    .filter((reference): reference is string => Boolean(reference));

  const social = bySlot.get("social_preview");

  const featuredImagePlaceholder = hero?.reference?.trim() || null;
  const socialPreviewPlaceholder = social?.reference?.trim() || null;
  const hasAcceptedImages = Boolean(featuredImagePlaceholder || supporting.length || socialPreviewPlaceholder);

  return {
    featuredImagePlaceholder,
    supportingImagePlaceholders: supporting,
    socialPreviewPlaceholder,
    hasAcceptedImages,
    note: hasAcceptedImages
      ? "Accepted hero maps to featuredImagePlaceholder; supporting_1/2 to supportingImagePlaceholders; social_preview to socialPreviewPlaceholder. No live WordPress media call."
      : "No accepted hero/supporting/social_preview images mapped. Featured and social placeholders remain null."
  };
}
