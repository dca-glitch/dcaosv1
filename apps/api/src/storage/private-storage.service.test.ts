import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPrivateStorageClientDownloadBoundary,
  getPrivateStorageDownloadReference,
  getPrivateStorageLocalMockDownloadReference,
  getPrivateStorageStatus,
  putPrivateStorageObject,
  toPrivateStorageDownloadFailurePayload
} from "./private-storage.service";
import { assertNoStorageKeyLeak } from "./storage-key-boundary";

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

  it("labels local mock download references as mocked (G487)", () => {
    const mock = getPrivateStorageLocalMockDownloadReference({
      storageKeyPresent: true,
      exportUrl: "https://docs.example.com/export/fixture"
    });

    assert.equal(mock.provider, "mock");
    assert.equal(mock.truthLabel, "mocked");
    assert.equal(mock.liveProven, false);
    assert.equal(mock.hasDocument, true);
    assert.ok(mock.downloadUrl?.includes("mock.local"));
    assert.equal("storageKey" in mock, false);
    assertNoStorageKeyLeak(mock);
  });

  it("keeps client download boundary free of storageKey when disabled (G486/G487)", () => {
    const forbiddenKey = "tenants/acme/documents/private.pdf";
    const boundary = getPrivateStorageClientDownloadBoundary({
      storageKey: forbiddenKey,
      exportUrl: null
    });

    assert.ok(boundary);
    assert.equal(boundary.liveProven, false);
    assert.equal("storageKey" in boundary, false);
    assertNoStorageKeyLeak(boundary, { forbiddenStorageKey: forbiddenKey });

    if (!getPrivateStorageStatus().configured) {
      assert.equal(boundary.truthLabel, "mocked");
      assert.equal(boundary.provider, "mock");
    } else {
      assert.equal(boundary.truthLabel, "future_placeholder");
    }
  });

  it("redacts download failure payloads without leaking keys (G488)", () => {
    const payload = toPrivateStorageDownloadFailurePayload(
      new Error("getSignedUrl failed storageKey=tenants/acme/secret.pdf")
    );
    assert.equal(payload.error.code, "DOWNLOAD_FAILED");
    assert.equal(payload.redacted, true);
    assert.equal(payload.storageKeyExposed, false);
    assert.equal(JSON.stringify(payload).includes("tenants/acme"), false);
    assertNoStorageKeyLeak(payload);
  });
});
