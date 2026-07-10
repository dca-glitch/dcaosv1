import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  containsUnsafeStorageErrorContent,
  redactStorageErrorMessage
} from "./storage-error-redaction";

describe("storage-error-redaction (G414)", () => {
  it("redacts storageKey paths and R2 secret fragments", () => {
    const raw =
      "upload failed storageKey=tenants/acme/private/report.pdf R2_SECRET_ACCESS_KEY=should-not-leak";
    const result = redactStorageErrorMessage(raw);

    assert.equal(result.redacted, true);
    assert.equal(result.liveProven, false);
    assert.equal(result.message.includes("tenants/acme"), false);
    assert.equal(result.message.includes("should-not-leak"), false);
    assert.equal(result.message.includes("R2_SECRET_ACCESS_KEY=[redacted]") || result.message === "Storage operation failed.", true);
  });

  it("falls back when storageKey markers remain unsafe", () => {
    const result = redactStorageErrorMessage("fatal storageKey tenants/x/y.pdf");
    assert.equal(result.message, "Storage operation failed.");
    assert.equal(result.liveProven, false);
  });

  it("preserves short safe messages", () => {
    const result = redactStorageErrorMessage("Object not found in private storage.");
    assert.equal(result.message, "Object not found in private storage.");
    assert.equal(containsUnsafeStorageErrorContent("Object not found in private storage."), false);
  });

  it("detects unsafe storage error content", () => {
    assert.equal(
      containsUnsafeStorageErrorContent("R2_ACCESS_KEY_ID=AKIAEXAMPLE at Object.put (C:\\app\\storage.ts:1:1)"),
      true
    );
  });
});
