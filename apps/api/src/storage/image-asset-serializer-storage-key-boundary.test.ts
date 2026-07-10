import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageGenerationVariantRequestSet,
  isFreeOfInternalOnlyFields,
  toImageGenerationClientSafeVariant,
  toImageGenerationClientSafeVariantSet
} from "../core/image-generation.execution";
import {
  evaluateExportUrlStorageKeyMatrix,
  payloadRespectsExportUrlStorageKeyMatrix
} from "./export-url-storage-key-matrix";
import { assertNoStorageKeyLeak } from "./storage-key-boundary";

/**
 * G154 / G241 / G484 — Image asset serializer storageKey leak boundary.
 * Exercises exported image-generation client-safe serializers (read-only import).
 * Admin `toAiDeliveryArticleImageSummary` in core.runtime.ts is not exported; see main-agent note.
 *
 * Local mirror of the admin article-image summary contract (hasDocument from storageKey,
 * never emit storageKey) so the expected boundary is still unit-tested in this lane.
 */
function toArticleImageClientSafeBoundarySummary(image: {
  id: string;
  title: string;
  previewImageUrl: string | null;
  finalImageUrl: string | null;
  storageKey: string | null;
  status: string;
}) {
  return {
    id: image.id,
    title: image.title,
    status: image.status,
    previewImageUrl: image.previewImageUrl,
    finalImageUrl: image.finalImageUrl,
    hasDocument: Boolean(image.storageKey)
  };
}

describe("image-asset-serializer-storage-key-boundary (G154 / G241 / G484)", () => {
  it("keeps image-generation client-safe variants free of storageKey", () => {
    const variant = toImageGenerationClientSafeVariant({
      variantSlot: "hero",
      rejectReason: null
    });
    const requests = buildImageGenerationVariantRequestSet({
      contentDraftId: "draft-boundary-1",
      draftTitle: "Boundary article"
    });
    const set = toImageGenerationClientSafeVariantSet(requests, []);

    assert.equal(isFreeOfInternalOnlyFields(variant), true);
    assert.equal(isFreeOfInternalOnlyFields(set), true);
    assertNoStorageKeyLeak(variant);
    assertNoStorageKeyLeak(set);
  });

  it("mirrors admin article-image summary: hasDocument from storageKey, no storageKey leak", () => {
    const forbiddenKey = "tenants/acme/years/2026/projects/p1/months/07/images/img1/hero.png";
    const summary = toArticleImageClientSafeBoundarySummary({
      id: "image-1",
      title: "Hero",
      previewImageUrl: "https://signed.example.com/preview",
      finalImageUrl: null,
      storageKey: forbiddenKey,
      status: "APPROVED"
    });

    assert.equal(summary.hasDocument, true);
    assert.equal("storageKey" in summary, false);
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });

  it("reports hasDocument false when storageKey is absent", () => {
    const summary = toArticleImageClientSafeBoundarySummary({
      id: "image-2",
      title: "Draft",
      previewImageUrl: null,
      finalImageUrl: null,
      storageKey: null,
      status: "DRAFT"
    });

    assert.equal(summary.hasDocument, false);
    assertNoStorageKeyLeak(summary);
  });

  it("covers hero/supporting/social variant slots without storageKey leak (G241)", () => {
    for (const variantSlot of ["hero", "supporting-1", "supporting-2", "social-preview"] as const) {
      const forbiddenKey = `tenants/acme/images/${variantSlot}.png`;
      const summary = toArticleImageClientSafeBoundarySummary({
        id: `image-${variantSlot}`,
        title: variantSlot,
        previewImageUrl: "https://signed.example.com/preview",
        finalImageUrl: null,
        storageKey: forbiddenKey,
        status: "APPROVED"
      });
      assert.equal(summary.hasDocument, true);
      assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
    }
  });

  it("proves client-safe image asset output: hasDocument only, storageKey forbidden (G484)", () => {
    const forbiddenKey = "tenants/acme/years/2026/images/g484-hero.png";
    const summary = toArticleImageClientSafeBoundarySummary({
      id: "image-g484",
      title: "G484 hero",
      previewImageUrl: "https://signed.example.com/preview/g484",
      finalImageUrl: "https://docs.example.com/export/g484-final",
      storageKey: forbiddenKey,
      status: "APPROVED"
    });

    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_image_summary", "hasDocument").allowed,
      true
    );
    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_image_summary", "storageKey").allowed,
      false
    );
    assert.equal(summary.hasDocument, true);
    assert.equal(summary.previewImageUrl, "https://signed.example.com/preview/g484");
    assert.equal(summary.finalImageUrl, "https://docs.example.com/export/g484-final");
    assert.equal("storageKey" in summary, false);
    assert.equal(
      payloadRespectsExportUrlStorageKeyMatrix("client_portal_image_summary", summary).ok,
      true
    );
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });
});
