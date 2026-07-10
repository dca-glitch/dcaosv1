import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWordPressAcceptedImagesOnly,
  mapAcceptedImagesToWordPressDraftInclusion,
  WORDPRESS_DRAFT_IMAGE_SLOTS
} from "./wordpress-image-inclusion";

describe("wordpress-image-inclusion (G296/G297)", () => {
  it("exposes hero / supporting / social_preview slots", () => {
    assert.deepEqual([...WORDPRESS_DRAFT_IMAGE_SLOTS], [
      "hero",
      "supporting_1",
      "supporting_2",
      "social_preview"
    ]);
  });

  it("maps accepted hero to featuredImagePlaceholder and social_preview separately", () => {
    const candidates = [
      { slot: "hero" as const, acceptance: "accepted" as const, reference: "assets/hero.png" },
      { slot: "supporting_1" as const, acceptance: "accepted" as const, reference: "assets/s1.png" },
      { slot: "supporting_2" as const, acceptance: "rejected" as const, reference: "assets/s2-rejected.png" },
      { slot: "social_preview" as const, acceptance: "accepted" as const, reference: "assets/og.png" },
      { slot: "supporting_2" as const, acceptance: "pending" as const, reference: "assets/s2-pending.png" }
    ];
    const inclusion = mapAcceptedImagesToWordPressDraftInclusion(candidates);

    assert.equal(inclusion.featuredImagePlaceholder, "assets/hero.png");
    assert.deepEqual(inclusion.supportingImagePlaceholders, ["assets/s1.png"]);
    assert.equal(inclusion.socialPreviewPlaceholder, "assets/og.png");
    assert.equal(inclusion.hasAcceptedImages, true);
    assert.equal(JSON.stringify(inclusion).includes("s2-rejected"), false);
    assert.equal(JSON.stringify(inclusion).includes("s2-pending"), false);
    assert.equal(assertWordPressAcceptedImagesOnly(candidates, inclusion), true);
  });

  it("returns null placeholders when no accepted images exist", () => {
    const candidates = [
      { slot: "hero" as const, acceptance: "pending" as const, reference: "assets/hero.png" },
      { slot: "social_preview" as const, acceptance: "missing" as const, reference: null }
    ];
    const inclusion = mapAcceptedImagesToWordPressDraftInclusion(candidates);

    assert.equal(inclusion.featuredImagePlaceholder, null);
    assert.deepEqual(inclusion.supportingImagePlaceholders, []);
    assert.equal(inclusion.socialPreviewPlaceholder, null);
    assert.equal(inclusion.hasAcceptedImages, false);
    assert.equal(assertWordPressAcceptedImagesOnly(candidates, inclusion), true);
  });

  it("ignores accepted slots with empty references (accepted-image-only)", () => {
    const inclusion = mapAcceptedImagesToWordPressDraftInclusion([
      { slot: "hero", acceptance: "accepted", reference: "   " },
      { slot: "supporting_1", acceptance: "accepted", reference: null },
      { slot: "supporting_2", acceptance: "rejected", reference: "assets/nope.png" }
    ]);

    assert.equal(inclusion.hasAcceptedImages, false);
    assert.equal(inclusion.featuredImagePlaceholder, null);
    assert.deepEqual(inclusion.supportingImagePlaceholders, []);
  });
});
