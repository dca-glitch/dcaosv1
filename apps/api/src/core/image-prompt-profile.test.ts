import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IMAGE_GENERATION_VARIANT_SLOTS } from "./image-generation.execution";
import {
  buildDefaultImagePromptProfileCandidate,
  IMAGE_PROMPT_PROFILE_ID_BY_KIND,
  IMAGE_PROMPT_PROFILE_KINDS,
  resolveImagePromptProfileKindForSlot,
  validateImagePromptProfile
} from "./image-prompt-profile";

describe("image-prompt-profile", () => {
  it("G190/G312 validates hero profile with aspect ratio, profile ID, and alt text", () => {
    const result = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "hero",
        promptText: "Calm editorial wellness hero with soft clinic ambience, no procedure.",
        altText: "Soft-lit wellness interior with neutral textures",
        slot: "hero"
      })
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.profileId, IMAGE_PROMPT_PROFILE_ID_BY_KIND.hero);
      assert.equal(result.kind, "hero");
      assert.equal(result.aspectRatio, "16:9");
      assert.equal(result.altTextRequired, true);
      assert.ok(result.forbiddenElements.includes("before_after_risk"));
    }
  });

  it("G190/G312 validates supporting inline and social preview profiles", () => {
    const supporting = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "supporting_inline",
        promptText: "Neutral supporting inline wellness texture study.",
        altText: "Abstract skincare texture detail",
        slot: "supporting_1",
        aspectRatio: "4:3"
      })
    );
    assert.equal(supporting.ok, true);

    const social = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "social_preview",
        promptText: "Product-neutral lifestyle social preview composition.",
        altText: "Calm lifestyle wellness moment for social preview",
        slot: "social_preview",
        aspectRatio: "1.91:1"
      })
    );
    assert.equal(social.ok, true);
  });

  it("G313 maps variant slots to prompt profile roles", () => {
    assert.deepEqual([...IMAGE_PROMPT_PROFILE_KINDS], [
      "hero",
      "supporting_inline",
      "social_preview",
      "service_specific"
    ]);

    assert.equal(resolveImagePromptProfileKindForSlot("hero"), "hero");
    assert.equal(resolveImagePromptProfileKindForSlot("supporting_1"), "supporting_inline");
    assert.equal(resolveImagePromptProfileKindForSlot("supporting_2"), "supporting_inline");
    assert.equal(resolveImagePromptProfileKindForSlot("social_preview"), "social_preview");

    for (const slot of IMAGE_GENERATION_VARIANT_SLOTS) {
      const kind = resolveImagePromptProfileKindForSlot(slot);
      const result = validateImagePromptProfile(
        buildDefaultImagePromptProfileCandidate({
          kind,
          promptText: "Neutral wellness composition without procedure staging.",
          altText: "Neutral wellness visual for role mapping",
          slot,
          serviceCategoryId: kind === "service_specific" ? "skin_health_education" : null
        })
      );
      assert.equal(result.ok, true, slot);
    }
  });

  it("G190/G312 validates service-specific profile requires serviceCategoryId", () => {
    const missing = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "service_specific",
        promptText: "Educational service visual without procedure staging.",
        altText: "Educational clinic environment detail"
      })
    );
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.ok(missing.issues.some((i) => i.code === "service_category_required"));
    }

    const ok = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "service_specific",
        promptText: "Educational service visual without procedure staging.",
        altText: "Educational clinic environment detail",
        serviceCategoryId: "skin_health_education"
      })
    );
    assert.equal(ok.ok, true);
  });

  it("G190/G312 rejects forbidden elements and missing alt text", () => {
    const forbidden = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "hero",
        promptText: "Show a syringe injection with guaranteed results.",
        altText: "Clinic scene"
      })
    );
    assert.equal(forbidden.ok, false);
    if (!forbidden.ok) {
      assert.ok(forbidden.issues.some((i) => i.code === "forbidden_element"));
    }

    const noAlt = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "hero",
        promptText: "Neutral wellness hero composition.",
        altText: "   "
      })
    );
    assert.equal(noAlt.ok, false);
    if (!noAlt.ok) {
      assert.ok(noAlt.issues.some((i) => i.code === "missing_alt_text"));
    }
  });

  it("G312 rejects invalid aspect ratio, profile ID mismatch, and slot/kind mismatch", () => {
    const badAspect = validateImagePromptProfile({
      profileId: "puriva_hero_v1",
      kind: "hero",
      aspectRatio: "9:16",
      promptText: "Neutral wellness hero.",
      altText: "Neutral wellness hero image"
    });
    assert.equal(badAspect.ok, false);
    if (!badAspect.ok) {
      assert.ok(badAspect.issues.some((i) => i.code === "invalid_aspect_ratio"));
    }

    const badId = validateImagePromptProfile({
      profileId: "puriva_social_preview_v1",
      kind: "hero",
      aspectRatio: "16:9",
      promptText: "Neutral wellness hero.",
      altText: "Neutral wellness hero image"
    });
    assert.equal(badId.ok, false);
    if (!badId.ok) {
      assert.ok(badId.issues.some((i) => i.code === "profile_id_kind_mismatch"));
    }

    const badSlot = validateImagePromptProfile(
      buildDefaultImagePromptProfileCandidate({
        kind: "hero",
        promptText: "Neutral wellness hero.",
        altText: "Neutral wellness hero image",
        slot: "social_preview"
      })
    );
    assert.equal(badSlot.ok, false);
    if (!badSlot.ok) {
      assert.ok(badSlot.issues.some((i) => i.code === "slot_kind_mismatch"));
    }
  });
});
