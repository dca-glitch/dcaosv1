import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasArticleImageFinalReference,
  hasArticleImagePreviewReference,
  isStorageKeyOnlyPreviewReadyImage
} from "./article-image-reference";

describe("article-image-reference (storageKey-only approval gate)", () => {
  it("accepts Stage A storageKey-only PREVIEW_READY as a preview reference", () => {
    const stageA = {
      status: "PREVIEW_READY",
      storageKey: "tenants/t1/ai-delivery/draft/run/image-candidate.png",
      previewImageUrl: null,
      finalImageUrl: null
    };
    assert.equal(isStorageKeyOnlyPreviewReadyImage(stageA), true);
    assert.equal(hasArticleImagePreviewReference(stageA), true);
    assert.equal(hasArticleImageFinalReference(stageA), true);
  });

  it("preserves URL-backed preview and final references", () => {
    assert.equal(
      hasArticleImagePreviewReference({
        previewImageUrl: "https://cdn.example.test/preview.png",
        finalImageUrl: null,
        storageKey: null
      }),
      true
    );
    assert.equal(
      hasArticleImagePreviewReference({
        previewImageUrl: null,
        finalImageUrl: "https://cdn.example.test/final.png",
        storageKey: null
      }),
      true
    );
    assert.equal(
      hasArticleImageFinalReference({
        finalImageUrl: "https://cdn.example.test/final.png",
        storageKey: null
      }),
      true
    );
  });

  it("rejects images with neither storageKey nor usable URL", () => {
    const empty = {
      status: "PREVIEW_READY",
      storageKey: null,
      previewImageUrl: null,
      finalImageUrl: null
    };
    assert.equal(hasArticleImagePreviewReference(empty), false);
    assert.equal(hasArticleImageFinalReference(empty), false);
    assert.equal(isStorageKeyOnlyPreviewReadyImage(empty), false);
    assert.equal(
      hasArticleImagePreviewReference({
        storageKey: "   ",
        previewImageUrl: "  ",
        finalImageUrl: ""
      }),
      false
    );
  });

  it("does not treat whitespace-only storageKey as a durable asset", () => {
    assert.equal(
      hasArticleImagePreviewReference({
        storageKey: "\t  \n",
        previewImageUrl: null,
        finalImageUrl: null
      }),
      false
    );
  });
});
