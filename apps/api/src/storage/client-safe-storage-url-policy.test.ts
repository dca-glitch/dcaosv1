import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientSafeUrlTruthLabel,
  buildClientSafeStorageUrlPayload,
  isClientSafeStorageUrlPayload
} from "./client-safe-storage-url-policy";

describe("client-safe-storage-url-policy (G152)", () => {
  it("allows exportUrl and downloadUrl while stripping storageKey", () => {
    const payload = buildClientSafeStorageUrlPayload({
      exportUrl: "https://docs.example.com/export/client-file",
      downloadUrl: "https://signed.example.com/tmp?X-Amz-Signature=abc",
      storageKey: "tenants/internal/private-object.pdf",
      truthLabel: "export_url"
    });

    const serialized = JSON.stringify(payload);
    assert.equal(payload.exportUrl, "https://docs.example.com/export/client-file");
    assert.equal(payload.downloadUrl, "https://signed.example.com/tmp?X-Amz-Signature=abc");
    assert.equal(payload.hasDocument, true);
    assert.equal(serialized.includes("storageKey"), false);
    assert.equal(serialized.includes("tenants/internal/private-object.pdf"), false);
    assert.equal(isClientSafeStorageUrlPayload(payload), true);
  });

  it("truth-labels mocked and future URLs so they are not implied live-signed", () => {
    const mocked = buildClientSafeStorageUrlPayload({
      downloadUrl: "https://mock.local/download/fixture",
      truthLabel: "mocked"
    });
    const future = buildClientSafeStorageUrlPayload({
      downloadUrl: "https://future.example/placeholder",
      truthLabel: "future_placeholder"
    });

    assert.equal(mocked.truthLabel, "mocked");
    assert.equal(future.truthLabel, "future_placeholder");
    assert.equal(assertClientSafeUrlTruthLabel("mocked").mayImplyLiveSignedUrl, false);
    assert.equal(assertClientSafeUrlTruthLabel("future_placeholder").mayImplyLiveSignedUrl, false);
    assert.equal(assertClientSafeUrlTruthLabel("live_signed").mayImplyLiveSignedUrl, true);
  });

  it("rejects payloads that still contain storageKey", () => {
    assert.equal(
      isClientSafeStorageUrlPayload({
        exportUrl: "https://docs.example.com/x",
        storageKey: "tenants/leak/key.pdf"
      }),
      false
    );
  });
});
