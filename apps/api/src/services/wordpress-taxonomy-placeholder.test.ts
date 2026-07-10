import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWordPressTaxonomyPlaceholders,
  isWordPressTaxonomyTermIdPlaceholder,
  WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_ITEMS,
  WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_LENGTH
} from "./wordpress-taxonomy-placeholder";

describe("wordpress-taxonomy-placeholder (G298 / G548)", () => {
  it("normalizes category/tag placeholders without resolving live term IDs", () => {
    const policy = buildWordPressTaxonomyPlaceholders({
      categories: ["Wellness", " Recovery ", "Wellness", "wellness"],
      tags: ["puriva", " SEO ", "puriva"]
    });

    assert.deepEqual(policy.categories, ["Wellness", "Recovery"]);
    assert.deepEqual(policy.tags, ["puriva", "SEO"]);
    assert.equal(policy.hasPlaceholders, true);
    assert.match(policy.note, /Local category\/tag string placeholders only/);
    assert.equal(JSON.stringify(policy).includes("termId"), false);
  });

  it("returns empty placeholders when none supplied", () => {
    const policy = buildWordPressTaxonomyPlaceholders({});
    assert.deepEqual(policy.categories, []);
    assert.deepEqual(policy.tags, []);
    assert.equal(policy.hasPlaceholders, false);
  });

  it("caps label length and item count", () => {
    const long = "x".repeat(WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_LENGTH + 10);
    const many = Array.from({ length: WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_ITEMS + 5 }, (_, i) => `tag-${i}`);
    const policy = buildWordPressTaxonomyPlaceholders({
      categories: [long],
      tags: many
    });

    assert.equal(policy.categories[0]?.length, WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_LENGTH);
    assert.equal(policy.tags.length, WORDPRESS_TAXONOMY_PLACEHOLDER_MAX_ITEMS);
  });

  it("detects numeric term-id shaped values as non-label placeholders", () => {
    assert.equal(isWordPressTaxonomyTermIdPlaceholder("42"), true);
    assert.equal(isWordPressTaxonomyTermIdPlaceholder("Wellness"), false);
    assert.equal(isWordPressTaxonomyTermIdPlaceholder(null), false);
  });

  it("G548 drops numeric-only term-id shaped labels from placeholder lists", () => {
    const policy = buildWordPressTaxonomyPlaceholders({
      categories: ["12", "Wellness", " 99 "],
      tags: ["7", "seo", "007"]
    });
    assert.deepEqual(policy.categories, ["Wellness"]);
    assert.deepEqual(policy.tags, ["seo"]);
    assert.equal(policy.hasPlaceholders, true);
  });
});
