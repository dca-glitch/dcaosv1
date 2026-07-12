import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ImageGenerationIntegrationReadiness } from "../config/image-generation.config";
import {
  buildImageGenerationFoundationSnapshot,
  buildImageGenerationRejection,
  buildImageGenerationVariantRequestSet,
  executeImageGenerationVariantRequestSet,
  IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED,
  IMAGE_GENERATION_VARIANT_SLOTS,
  isFreeOfInternalOnlyFields,
  summarizeImageGenerationExecutionResults,
  toImageGenerationClientSafeVariantSet,
  validateImageGenerationRejectReason
} from "./image-generation.execution";

function readiness(overrides: Partial<ImageGenerationIntegrationReadiness>): ImageGenerationIntegrationReadiness {
  return {
    status: "disabled",
    generationEnabled: false,
    provider: null,
    model: null,
    hasApiKey: false,
    missingKeys: [],
    liveProviderCallsDeferred: true,
    baseHostname: "api.bfl.ai",
    maxCostUsd: 0.1,
    timeoutMs: 120_000,
    maxPollAttempts: 40,
    pollIntervalMs: 3_000,
    ...overrides
  };
}

describe("image-generation.execution", () => {
  const draftInput = {
    contentDraftId: "draft-1",
    draftTitle: "How Wegovy Works",
    targetKeyword: "semaglutide weight loss",
    briefTitle: "Q3 Weight Management Campaign"
  };

  it("builds the hero/supporting_1/supporting_2/social_preview variant request set", () => {
    const requests = buildImageGenerationVariantRequestSet(draftInput);

    assert.equal(requests.length, 4);
    assert.deepEqual(
      requests.map((request) => request.variantSlot),
      ["hero", "supporting_1", "supporting_2", "social_preview"]
    );
    assert.deepEqual(IMAGE_GENERATION_VARIANT_SLOTS, ["hero", "supporting_1", "supporting_2", "social_preview"]);

    for (const request of requests) {
      assert.equal(request.status, "queued_disabled");
      assert.ok(request.prompt.includes("How Wegovy Works"));
      assert.ok(request.aspectRatio.length > 0);
    }
  });

  it("never calls a provider when disabled by default (no IMAGE_GENERATION_ENABLED)", () => {
    const requests = buildImageGenerationVariantRequestSet(draftInput);
    const results = executeImageGenerationVariantRequestSet(requests, readiness({ status: "disabled" }));

    assert.equal(results.length, 4);
    for (const result of results) {
      assert.equal(result.providerCalled, false);
      assert.equal(result.outcome, "skipped_disabled");
    }

    const summary = summarizeImageGenerationExecutionResults(results);
    assert.equal(summary.anyProviderCalled, false);
    assert.equal(summary.skippedDisabled, 4);
  });

  it("stays disabled-safe when missing_config (enabled but no provider/key)", () => {
    const requests = buildImageGenerationVariantRequestSet(draftInput);
    const results = executeImageGenerationVariantRequestSet(
      requests,
      readiness({ status: "missing_config", generationEnabled: true, missingKeys: ["IMAGE_GENERATION_API_KEY"] })
    );

    for (const result of results) {
      assert.equal(result.providerCalled, false);
      assert.equal(result.outcome, "skipped_missing_config");
      assert.ok(result.reason.includes("IMAGE_GENERATION_API_KEY"));
    }
  });

  it("still makes no provider call even when configured_shape_ok (no live client wired)", () => {
    const requests = buildImageGenerationVariantRequestSet(draftInput);
    const results = executeImageGenerationVariantRequestSet(
      requests,
      readiness({
        status: "configured_shape_ok",
        generationEnabled: true,
        provider: "openai_images",
        hasApiKey: true
      })
    );

    for (const result of results) {
      assert.equal(result.providerCalled, false);
      assert.equal(result.outcome, "skipped_not_implemented");
    }
  });

  it("requires a non-empty reject reason", () => {
    assert.equal(validateImageGenerationRejectReason(undefined).ok, false);
    assert.equal(validateImageGenerationRejectReason(null).ok, false);
    assert.equal(validateImageGenerationRejectReason("  ").ok, false);
    assert.equal(validateImageGenerationRejectReason("ok").ok, false);
    assert.equal(validateImageGenerationRejectReason("Blurry, unusable composition").ok, true);
  });

  it("rejects a variant only when a valid reason is supplied", () => {
    const missingReason = buildImageGenerationRejection({
      requestId: "draft-1_hero",
      variantSlot: "hero",
      reason: ""
    });
    assert.equal(missingReason.ok, false);

    const validReason = buildImageGenerationRejection({
      requestId: "draft-1_hero",
      variantSlot: "hero",
      reason: "Misleading before/after implication"
    });
    assert.equal(validReason.ok, true);
    if (validReason.ok) {
      assert.equal(validReason.rejection.rejectReason, "Misleading before/after implication");
      assert.equal(validReason.rejection.variantSlot, "hero");
      assert.ok(validReason.rejection.rejectedAtIso);
    }
  });

  it("exposes only safe metadata to the client (no prompt/provider/storageKey)", () => {
    const requests = buildImageGenerationVariantRequestSet(draftInput);
    const rejection = buildImageGenerationRejection({
      requestId: requests[0].id,
      variantSlot: "hero",
      reason: "Unlicensed clinical setting depicted"
    });
    assert.equal(rejection.ok, true);

    const clientSafeSet = toImageGenerationClientSafeVariantSet(
      requests,
      rejection.ok ? [rejection.rejection] : []
    );

    assert.equal(clientSafeSet.length, 4);
    const heroVariant = clientSafeSet.find((variant) => variant.variantSlot === "hero");
    assert.equal(heroVariant?.rejectReason, "Unlicensed clinical setting depicted");
    assert.equal(heroVariant?.status, "not_generated");

    assert.equal(isFreeOfInternalOnlyFields(clientSafeSet), true);
    for (const variant of clientSafeSet) {
      assert.ok(!("prompt" in variant));
      assert.ok(!("storageKey" in variant));
    }
  });

  it("flags internal-only fields when present (boundary sanity check)", () => {
    assert.equal(isFreeOfInternalOnlyFields({ prompt: "leaked" }), false);
    assert.equal(isFreeOfInternalOnlyFields({ storageKey: "leaked" }), false);
    assert.equal(isFreeOfInternalOnlyFields({ provider: "leaked" }), false);
    assert.equal(isFreeOfInternalOnlyFields({ variantSlot: "hero" }), true);
  });

  it("builds a disabled-safe foundation snapshot regardless of readiness status", () => {
    const disabledSnapshot = buildImageGenerationFoundationSnapshot(readiness({ status: "disabled" }));
    assert.equal(disabledSnapshot.variantSlots.length, 4);
    assert.equal(disabledSnapshot.disabledSafe, true);
    assert.equal(disabledSnapshot.liveProviderCallsDeferred, true);
    assert.equal(disabledSnapshot.liveProviderCallsAllowed, false);
    assert.equal(disabledSnapshot.readiness.status, "disabled");

    const configuredSnapshot = buildImageGenerationFoundationSnapshot(
      readiness({ status: "configured_shape_ok", generationEnabled: true, provider: "openai_images", hasApiKey: true })
    );
    assert.equal(configuredSnapshot.disabledSafe, true);
    assert.equal(configuredSnapshot.liveProviderCallsAllowed, false);
    assert.equal(JSON.stringify(configuredSnapshot).includes("skipped"), false);
  });

  it("G323 enforces no-live provider invariant at the foundation constant", () => {
    assert.equal(IMAGE_GENERATION_LIVE_PROVIDER_CALLS_ALLOWED, false);
  });
});
