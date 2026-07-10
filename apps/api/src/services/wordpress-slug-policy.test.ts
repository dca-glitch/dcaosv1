import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeWordPressSlug, WORDPRESS_SLUG_MAX_LENGTH } from "./wordpress-slug-policy";

describe("wordpress-slug-policy (G182)", () => {
  it("normalizes titles into lowercase hyphenated slugs", () => {
    assert.equal(
      normalizeWordPressSlug("  Puriva SEO Article: Recovery & Wellness  "),
      "puriva-seo-article-recovery-wellness"
    );
  });

  it("collapses whitespace and repeated hyphens", () => {
    assert.equal(normalizeWordPressSlug("Hello---World   Test"), "hello-world-test");
  });

  it("strips diacritics and non-ascii punctuation", () => {
    assert.equal(normalizeWordPressSlug("Café — Résumé!"), "cafe-resume");
  });

  it("returns null for empty or symbol-only input", () => {
    assert.equal(normalizeWordPressSlug(""), null);
    assert.equal(normalizeWordPressSlug("   "), null);
    assert.equal(normalizeWordPressSlug("!!!"), null);
    assert.equal(normalizeWordPressSlug(null), null);
    assert.equal(normalizeWordPressSlug(undefined), null);
  });

  it("truncates to WORDPRESS_SLUG_MAX_LENGTH", () => {
    const long = "a".repeat(WORDPRESS_SLUG_MAX_LENGTH + 40);
    const slug = normalizeWordPressSlug(long);
    assert.ok(slug);
    assert.equal(slug.length, WORDPRESS_SLUG_MAX_LENGTH);
  });
});
