import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeWordPressDraftPayload,
  sanitizeWordPressDraftText
} from "./wordpress-payload-sanitization";

describe("wordpress-payload-sanitization (G301)", () => {
  it("strips control characters from draft text", () => {
    assert.equal(sanitizeWordPressDraftText("Hello\u0000 World\u0007"), "Hello World");
    assert.equal(sanitizeWordPressDraftText("   "), null);
    assert.equal(sanitizeWordPressDraftText(null), null);
  });

  it("sanitizes draft payload fields and aliases content to body", () => {
    const sanitized = sanitizeWordPressDraftPayload({
      title: "  Title\u0001  ",
      body: " Body\u0008 line ",
      excerpt: " Excerpt ",
      categories: [" A ", "A", ""],
      tags: ["t1"],
      featuredImagePlaceholder: " hero.png ",
      applicationPassword: "must-not-survive-redaction-path"
    });

    assert.deepEqual(sanitized, {
      title: "Title",
      body: "Body line",
      content: "Body line",
      excerpt: "Excerpt",
      slug: null,
      categories: ["A"],
      tags: ["t1"],
      featuredImagePlaceholder: "hero.png"
    });
    assert.equal(JSON.stringify(sanitized).includes("applicationPassword"), false);
  });
});
