import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeWordPressDraftPayload,
  sanitizeWordPressDraftText
} from "./wordpress-payload-sanitization";

describe("wordpress-payload-sanitization (G301 / G546)", () => {
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

  it("G546 redacts credential-shaped fragments inside draft body text", () => {
    const sanitized = sanitizeWordPressDraftText(
      "Intro. applicationPassword: xxxx-yyyy then more copy."
    );
    assert.ok(sanitized);
    assert.equal(sanitized.includes("xxxx-yyyy"), false);
    assert.equal(sanitized.includes("applicationPassword"), false);
    assert.match(sanitized, /\[REDACTED\]/);
  });

  it("G546 uses content alias when body is absent and lowercases slug", () => {
    const sanitized = sanitizeWordPressDraftPayload({
      title: "T",
      content: "From content field",
      slug: "  Mixed-Case-Slug  "
    });
    assert.equal(sanitized.body, "From content field");
    assert.equal(sanitized.content, "From content field");
    assert.equal(sanitized.slug, "mixed-case-slug");
  });

  it("G546 returns null for non-string text input", () => {
    assert.equal(sanitizeWordPressDraftText(12 as unknown as string), null);
  });
});
