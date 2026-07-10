import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapAcceptedImagesToWordPressDraftInclusion,
  WORDPRESS_DRAFT_IMAGE_SLOTS
} from "./wordpress-image-inclusion";

describe("wordpress-image-inclusion (G186)", () => {
  it("exposes hero / supporting / social_preview slots", () => {
    assert.deepEqual([...WORDPRESS_DRAFT_IMAGE_SLOTS], [
      "hero",
      "supporting_1",
      "supporting_2",
      "social_preview"
    ]);
  });

  it("maps accepted hero to featuredImagePlaceholder and social_preview separately", () => {
    const inclusion = mapAcceptedImagesToWordPressDraftInclusion([
      { slot: "hero", acceptance: "accepted", reference: "assets/hero.png" },
      { slot: "supporting_1", acceptance: "accepted", reference: "assets/s1.png" },
      { slot: "supporting_2", acceptance: "rejected", reference: "assets/s2-rejected.png" },
      { slot: "social_preview", acceptance: "accepted", reference: "assets/og.png" },
      { slot: "supporting_2", acceptance: "pending", reference: "assets/s2-pending.png" }
    ]);

    assert.equal(inclusion.featuredImagePlaceholder, "assets/hero.png");
    assert.deepEqual(inclusion.supportingImagePlaceholders, ["assets/s1.png"]);
    assert.equal(inclusion.socialPreviewPlaceholder, "assets/og.png");
    assert.equal(inclusion.hasAcceptedImages, true);
    assert.equal(JSON.stringify(inclusion).includes("s2-rejected"), false);
    assert.equal(JSON.stringify(inclusion).includes("s2-pending"), false);
  });

  it("returns null placeholders when no accepted images exist", () => {
    const inclusion = mapAcceptedImagesToWordPressDraftInclusion([
      { slot: "hero", acceptance: "pending", reference: "assets/hero.png" },
      { slot: "social_preview", acceptance: "missing", reference: null }
    ]);

    assert.equal(inclusion.featuredImagePlaceholder, null);
    assert.deepEqual(inclusion.supportingImagePlaceholders, []);
    assert.equal(inclusion.socialPreviewPlaceholder, null);
    assert.equal(inclusion.hasAcceptedImages, false);
  });
});
