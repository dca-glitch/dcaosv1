import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateImageAltTextPolicy } from "./image-alt-text-policy";

describe("image-alt-text-policy", () => {
  it("G191 allows descriptive neutral alt text", () => {
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

  it("G191 rejects medical claims", () => {
    const decision = evaluateImageAltTextPolicy("Image that treats acne and cures wrinkles overnight");

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "medical_claim"));
  });

  it("G191 rejects before/after implication", () => {
    const decision = evaluateImageAltTextPolicy("Before and after transformation results shown");

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "before_after_implication"));
  });

  it("G191 rejects keyword-stuffed alt text", () => {
    const decision = evaluateImageAltTextPolicy(
      "Bali clinic Bali clinic Bali clinic wellness Bali clinic skincare"
    );

    assert.equal(decision.allowed, false);
    assert.ok(decision.issues.some((i) => i.code === "keyword_stuffed"));
  });

  it("G191 rejects empty and provider/prompt leaks", () => {
    assert.equal(evaluateImageAltTextPolicy("").allowed, false);
    assert.equal(evaluateImageAltTextPolicy("   ").allowed, false);

    const leak = evaluateImageAltTextPolicy("Generated with Midjourney prompt: soft light");
    assert.equal(leak.allowed, false);
    assert.ok(leak.issues.some((i) => i.code === "provider_or_prompt_leak"));
  });
});
