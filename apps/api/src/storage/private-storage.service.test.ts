import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPrivateStorageDownloadReference,
  getPrivateStorageStatus,
  putPrivateStorageObject
} from "./private-storage.service";

describe("private-storage.service — disabled-safe local behavior", () => {
  it("reports disabled mode when R2 is not configured", () => {
    const status = getPrivateStorageStatus();
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      assert.equal(status.mode, "private-r2");
      return;
    }
    assert.equal(status.mode, "disabled");
    assert.equal(status.configured, false);
    assert.ok(status.missingEnvKeys.length > 0);
  });

  it("returns null upload result when storage is disabled", async () => {
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      return;
    }

    const result = await putPrivateStorageObject({
      body: Buffer.from("disabled-safe"),
      mimeType: "application/pdf",
      namespace: "ai-delivery-deliverable",
      originalFileName: "proof.pdf",
      tenantSlugOrId: "tenant-smoke"
    });
    assert.equal(result, null);
  });

  it("returns null download reference for empty storage key", () => {
    assert.equal(getPrivateStorageDownloadReference(""), null);
    assert.equal(getPrivateStorageDownloadReference("   "), null);
  });
});
