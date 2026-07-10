/**
 * WordPress category/tag placeholder policy (local-only, no HTTP).
 *
 * Draft payloads may carry string placeholders for categories/tags.
 * Live WordPress taxonomy IDs are never resolved in this gate.
 */

export const WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_LENGTH = 64 as const;
export const WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_ITEMS = 20 as const;

export type WordPressTaxonomyPlaceholderKind = "category" | "tag";

export interface WordPressTaxonomyPlaceholderPolicy {
  /**
   * Normalized unique labels only — never WordPress term IDs.
   */
  categories: string[];
  tags: string[];
  /**
   * True when any placeholder was retained after normalization.
   */
  hasPlaceholders: boolean;
  /**
   * Operator note: placeholders are local labels, not live taxonomy sync.
   */
  note: string;
}

function normalizeLabel(value: string | null | undefined): string | null {
  if (value == null || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_LENGTH);
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const label = normalizeLabel(value);
    if (!label) {
      continue;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(label);
    if (normalized.length >= WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_ITEMS) {
      break;
    }
  }
  return normalized;
}

/**
 * Build local category/tag placeholders for a WordPress draft payload.
 * Does not call WordPress taxonomy APIs or resolve term IDs.
 */
export function buildWordPressTaxonomyPlaceholders(input: {
  categories?: string[];
  tags?: string[];
}): WordPressTaxonomyPlaceholderPolicy {
  const categories = normalizeList(input.categories);
  const tags = normalizeList(input.tags);
  const hasPlaceholders = categories.length > 0 || tags.length > 0;

  return {
    categories,
    tags,
    hasPlaceholders,
    note: hasPlaceholders
      ? "Local category/tag string placeholders only. Live WordPress term ID sync is deferred."
      : "No category/tag placeholders supplied. Live taxonomy sync remains deferred."
  };
}

/**
 * True when a value looks like a numeric WordPress term ID rather than a label.
 * Draft prep must not treat raw IDs as placeholders.
 */
export function isWordPressTaxonomyTermIdPlaceholder(value: string | null | undefined): boolean {
  if (value == null || typeof value !== "string") {
    return false;
  }
  return /^\d+$/.test(value.trim());
}
