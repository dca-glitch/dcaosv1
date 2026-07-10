import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateImageAltTextPolicy, evaluateImageAltTextReviewGate } from "./image-alt-text-policy";

describe("image-alt-text-policy", () => {
  it("G191/G314 allows descriptive neutral alt text", () => {
    const decision = evaluateImageAltTextPolicy(
      "Soft-lit wellness interior with linen textures and calm natural light"
    );

    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.issues, []);
    assert.ok(decision.checks.includes("ALLOW:descriptive_neutral_alt"));
    assert.equal(
      decision.normalizedAltText,
      "Soft-lit wellness interior with linen textures and calm natural light"
    );
  });

  it("G191/G315 rejects medical claims", () => {
    const decision = evaluateImageAltTextPolicy("Image that treats acne and cures wrinkles overnight");

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "medical_claim"));

    const permanent = evaluateImageAltTextPolicy("Visual promising permanent results after one visit");
    assert.equal(permanent.allowed, false);
    assert.ok(permanent.issues.some((i) => i.code === "medical_claim"));
  });

  it("G191/G315 rejects before/after implication", () => {
    const decision = evaluateImageAltTextPolicy("Before and after transformation results shown");

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "before_after_implication"));

    const progress = evaluateImageAltTextPolicy("Progress photos then vs now wellness comparison");
    assert.equal(progress.allowed, false);
    assert.ok(progress.issues.some((i) => i.code === "before_after_implication"));
  });

  it("G314 rejects keyword-stuffed alt text", () => {
    const decision = evaluateImageAltTextPolicy(
      "Bali clinic Bali clinic Bali clinic wellness Bali clinic skincare"
    );

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "keyword_stuffed"));
  });

  it("G314 rejects empty, too short/long, and provider/prompt leaks", () => {
    assert.equal(evaluateImageAltTextPolicy("").allowed, false);
    assert.equal(evaluateImageAltTextPolicy("   ").allowed, false);
    assert.equal(evaluateImageAltTextPolicy("short").allowed, false);

    const tooLong = evaluateImageAltTextPolicy("a".repeat(161));
    assert.equal(tooLong.allowed, false);
    assert.ok(tooLong.issues.some((i) => i.code === "too_long"));

    const leak = evaluateImageAltTextPolicy("Generated with Midjourney prompt: soft light");
    assert.equal(leak.allowed, false);
    assert.ok(leak.issues.some((i) => i.code === "provider_or_prompt_leak"));
  });

  it("G555 rejects filler/Botox result and day-0 comparison alt text", () => {
    const filler = evaluateImageAltTextPolicy("Clinic visual showing Botox result after visit");
    assert.equal(filler.allowed, false);
    assert.ok(filler.issues.some((i) => i.code === "medical_claim"));

    const day0 = evaluateImageAltTextPolicy("Day 0 vs day 30 progress photos for wellness");
    assert.equal(day0.allowed, false);
    assert.ok(day0.issues.some((i) => i.code === "before_after_implication"));
  });

  it("G555 enforces required alt review gate for final/WP paths", () => {
    const optionalOk = evaluateImageAltTextReviewGate({ altText: "", required: false });
    assert.equal(optionalOk.ok, true);

    const requiredEmpty = evaluateImageAltTextReviewGate({ altText: "", required: true });
    assert.equal(requiredEmpty.ok, false);

    const requiredOk = evaluateImageAltTextReviewGate({
      altText: "Soft-lit wellness interior with linen textures",
      required: true
    });
    assert.equal(requiredOk.ok, true);
    assert.ok(requiredOk.checks.includes("ALLOW:alt_review_gate"));
  });
});
