/**
 * WordPress slug normalize policy (local-only).
 * No HTTP. Used by draft payload preparation only.
 */

export const WORDPRESS_SLUG_MAX_LENGTH = 80 as const;

/**
 * Normalize a title or raw slug candidate into a WordPress-safe post slug.
 * Returns null when the input yields no usable characters.
 */
export function normalizeWordPressSlug(input: string | null | undefined): string | null {
  if (input == null || typeof input !== "string") {
    return null;
  }

  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, WORDPRESS_SLUG_MAX_LENGTH);
}
