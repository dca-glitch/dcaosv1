/**
 * WordPress slug normalize policy (local-only).
 * No HTTP. Used by draft payload preparation only.
 */

export const WORDPRESS_SLUG_MAX_LENGTH = 80 as const;

/**
 * Normalize a title or raw slug candidate into a WordPress-safe post slug.
 * Returns null when the input yields no usable characters.
 *
 * Edge rules (G289 / G542):
 * - lowercase ASCII [a-z0-9-] only after NFKD diacritic strip
 * - underscores become hyphens (WordPress-safe URL segment)
 * - collapse whitespace / repeated hyphens; trim leading/trailing hyphens
 * - truncate to WORDPRESS_SLUG_MAX_LENGTH without leaving a trailing hyphen
 * - null for empty, whitespace-only, symbol-only, emoji-only, or non-string input
 */
export function normalizeWordPressSlug(input: string | null | undefined): string | null {
  if (input == null || typeof input !== "string") {
    return null;
  }

  let normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return null;
  }

  if (normalized.length > WORDPRESS_SLUG_MAX_LENGTH) {
    normalized = normalized.slice(0, WORDPRESS_SLUG_MAX_LENGTH).replace(/-+$/g, "");
  }

  return normalized || null;
}
