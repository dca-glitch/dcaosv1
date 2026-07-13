import { describe, expect, it } from "vitest";
import {
  hasArticleImageFinalReferenceUi,
  hasArticleImagePreviewReferenceUi
} from "./ai-delivery-formatters";

describe("article image preview/final reference UI helpers", () => {
  it("treats hasDocument as a valid preview reference for Stage A storageKey-only images", () => {
    expect(
      hasArticleImagePreviewReferenceUi({
        previewImageUrl: null,
        finalImageUrl: null,
        hasDocument: true
      })
    ).toBe(true);
    expect(
      hasArticleImageFinalReferenceUi({
        finalImageUrl: null,
        hasDocument: true
      })
    ).toBe(true);
  });

  it("rejects empty references", () => {
    expect(
      hasArticleImagePreviewReferenceUi({
        previewImageUrl: null,
        finalImageUrl: null,
        hasDocument: false
      })
    ).toBe(false);
  });
});
