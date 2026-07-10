/**
 * WordPress draft payload sanitization (local-only, no HTTP).
 *
 * Strips control characters and credential-like fragments from draft text
 * fields before local serialization. Does not call WordPress.
 */

import { redactWordPressSerializableValue } from "./wordpress-credentials-redaction";

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** G546 — strip credential-shaped fragments that must never ride in draft text. */
const DRAFT_SECRET_FRAGMENT_PATTERN =
  /(application[_-]?password\s*[:=]\s*\S+|wp[_-]?app[_-]?password\s*[:=]\s*\S+|authorization\s*:\s*\S+|bearer\s+[a-z0-9._-]+|basic\s+[a-z0-9+/=]+)/gi;

export function sanitizeWordPressDraftText(value: string | null | undefined): string | null {
  if (value == null || typeof value !== "string") {
    return null;
  }

  const sanitized = value
    .replace(CONTROL_CHARS_PATTERN, "")
    .replace(DRAFT_SECRET_FRAGMENT_PATTERN, "[REDACTED]")
    .trim();
  return sanitized.length > 0 ? sanitized : null;
}

export interface WordPressDraftSanitizationInput {
  title?: string | null;
  body?: string | null;
  content?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  categories?: string[];
  tags?: string[];
  featuredImagePlaceholder?: string | null;
  [key: string]: unknown;
}

export interface WordPressDraftSanitizedPayload {
  title: string | null;
  body: string | null;
  content: string | null;
  excerpt: string | null;
  slug: string | null;
  categories: string[];
  tags: string[];
  featuredImagePlaceholder: string | null;
}

function sanitizeList(values: string[] | undefined): string[] {
  if (!values?.length) {
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const sanitized = sanitizeWordPressDraftText(value);
    if (!sanitized || seen.has(sanitized)) {
      continue;
    }
    seen.add(sanitized);
    out.push(sanitized);
  }
  return out;
}

/**
 * Sanitize draft text fields and drop credential-like keys from extras.
 */
export function sanitizeWordPressDraftPayload(
  input: WordPressDraftSanitizationInput
): WordPressDraftSanitizedPayload {
  const body = sanitizeWordPressDraftText(input.body ?? input.content);
  const redactedExtras = redactWordPressSerializableValue(input);

  return {
    title: sanitizeWordPressDraftText(input.title),
    body,
    content: body,
    excerpt: sanitizeWordPressDraftText(input.excerpt),
    slug: sanitizeWordPressDraftText(input.slug)?.toLowerCase() ?? null,
    categories: sanitizeList(input.categories),
    tags: sanitizeList(input.tags),
    featuredImagePlaceholder: sanitizeWordPressDraftText(
      (redactedExtras as WordPressDraftSanitizationInput).featuredImagePlaceholder ??
        input.featuredImagePlaceholder
    )
  };
}
