/**
 * Durable article-image asset references for admin status transitions.
 * Private R2 objects are represented by storageKey (never require a public URL).
 * Presigned / download URLs must not be persisted into preview/final URL fields.
 */

export type ArticleImageReferenceFields = {
  previewImageUrl?: string | null;
  finalImageUrl?: string | null;
  storageKey?: string | null;
};

function hasNonEmpty(value: string | null | undefined): boolean {
  return Boolean((value ?? "").trim());
}

/** Preview/approve/request-changes: URL fields or a private storageKey. */
export function hasArticleImagePreviewReference(image: ArticleImageReferenceFields): boolean {
  return (
    hasNonEmpty(image.previewImageUrl) ||
    hasNonEmpty(image.finalImageUrl) ||
    hasNonEmpty(image.storageKey)
  );
}

/** Final-ready: final URL or private storageKey. */
export function hasArticleImageFinalReference(image: ArticleImageReferenceFields): boolean {
  return hasNonEmpty(image.finalImageUrl) || hasNonEmpty(image.storageKey);
}

/** Stage A bounded shape: PREVIEW_READY + storageKey only (no persisted URLs). */
export function isStorageKeyOnlyPreviewReadyImage(image: ArticleImageReferenceFields & {
  status?: string | null;
}): boolean {
  return (
    (image.status ?? "") === "PREVIEW_READY" &&
    hasNonEmpty(image.storageKey) &&
    !hasNonEmpty(image.previewImageUrl) &&
    !hasNonEmpty(image.finalImageUrl)
  );
}
