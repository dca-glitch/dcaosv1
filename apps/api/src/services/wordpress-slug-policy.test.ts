import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeWordPressSlug, WORDPRESS_SLUG_MAX_LENGTH } from "./wordpress-slug-policy";

describe("wordpress-slug-policy (G289 / G542)", () => {
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
    assert.equal(normalizeWordPressSlug("---"), null);
    assert.equal(normalizeWordPressSlug(null), null);
    assert.equal(normalizeWordPressSlug(undefined), null);
  });

  it("truncates to WORDPRESS_SLUG_MAX_LENGTH without trailing hyphen", () => {
    const long = "a".repeat(WORDPRESS_SLUG_MAX_LENGTH + 40);
    const slug = normalizeWordPressSlug(long);
    assert.ok(slug);
    assert.equal(slug.length, WORDPRESS_SLUG_MAX_LENGTH);
    assert.equal(slug.endsWith("-"), false);
  });

  it("handles edge truncation when cut lands on a hyphen run", () => {
    const prefix = "word-".repeat(20);
    const slug = normalizeWordPressSlug(prefix);
    assert.ok(slug);
    assert.ok(slug.length <= WORDPRESS_SLUG_MAX_LENGTH);
    assert.equal(slug.endsWith("-"), false);
    assert.match(slug, /^[a-z0-9-]+$/);
  });

  it("strips leading/trailing hyphens from messy titles", () => {
    assert.equal(normalizeWordPressSlug("---Hello World---"), "hello-world");
  });

  it("keeps digits and collapses mixed punctuation", () => {
    assert.equal(normalizeWordPressSlug("Q3 2026: ROI #1 (Draft)"), "q3-2026-roi-1-draft");
  });

  it("returns null for non-string typed input cast through any", () => {
    assert.equal(normalizeWordPressSlug(42 as unknown as string), null);
  });

  it("G542 converts underscores to hyphens", () => {
    assert.equal(normalizeWordPressSlug("puriva_seo_article"), "puriva-seo-article");
    assert.equal(normalizeWordPressSlug("mixed_under-score__run"), "mixed-under-score-run");
  });

  it("G542 returns null for emoji-only or CJK-only titles after strip", () => {
    assert.equal(normalizeWordPressSlug("🔥🔥🔥"), null);
    assert.equal(normalizeWordPressSlug("日本語タイトル"), null);
  });

  it("G542 preserves ascii when mixed with emoji", () => {
    assert.equal(normalizeWordPressSlug("Puriva 🔥 Launch"), "puriva-launch");
  });
});
