import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWordPressRedactedError,
  redactWordPressErrorMessage
} from "./wordpress-error-redaction";

describe("wordpress-error-redaction (G302 / G547)", () => {
  it("redacts credential-like fragments from error messages", () => {
    const redacted = redactWordPressErrorMessage(
      "Failed with Authorization: Bearer abc.token and applicationPassword=xxxx-yyyy"
    );
    assert.ok(redacted);
    assert.equal(redacted.includes("Bearer abc"), false);
    assert.equal(redacted.includes("applicationPassword"), false);
    assert.match(redacted, /\[REDACTED\]/);
  });

  it("builds serializable error shapes without secret keys", () => {
    const error = buildWordPressRedactedError({
      status: "error",
      errorMessage: "token=secret-value caused failure",
      applicationPassword: "raw-secret",
      ciphertext: "blob",
      errorCategory: "wordpress_http_error"
    });

    const serialized = JSON.stringify(error);
    assert.equal(error.ok, false);
    assert.equal(error.status, "error");
    assert.equal(error.errorCategory, "wordpress_http_error");
    assert.equal(serialized.includes("raw-secret"), false);
    assert.equal(serialized.includes("applicationPassword"), false);
    assert.equal(serialized.includes("ciphertext"), false);
    assert.equal(serialized.includes("secret-value"), false);
  });

  it("preserves provider_disabled reasons without leaking secrets", () => {
    const error = buildWordPressRedactedError({
      status: "provider_disabled",
      providerDisabledReason: "Live HTTP frozen. No Basic abc123== leak.",
      errorCategory: "wordpress_live_http_frozen"
    });

    assert.equal(error.status, "provider_disabled");
    assert.ok(error.providerDisabledReason);
    assert.equal(error.providerDisabledReason.includes("Basic abc123"), false);
  });

  it("G547 returns null for empty or non-string messages", () => {
    assert.equal(redactWordPressErrorMessage(""), null);
    assert.equal(redactWordPressErrorMessage("   "), null);
    assert.equal(redactWordPressErrorMessage(null), null);
    assert.equal(redactWordPressErrorMessage(undefined), null);
  });

  it("G547 defaults errorCategory and truncates oversized categories", () => {
    const error = buildWordPressRedactedError({
      errorMessage: "safe failure"
    });
    assert.equal(error.errorCategory, "wordpress_provider_error");

    const long = buildWordPressRedactedError({
      errorMessage: "x",
      errorCategory: "c".repeat(120)
    });
    assert.equal(long.errorCategory.length, 80);
  });
});
