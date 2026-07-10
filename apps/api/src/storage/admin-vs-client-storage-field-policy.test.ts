import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateStorageFieldPolicy,
  isClientAllowedStorageField,
  isClientForbiddenStorageField,
  payloadRespectsClientStorageFieldPolicy
} from "./admin-vs-client-storage-field-policy";

describe("admin-vs-client-storage-field-policy (G243)", () => {
  it("forbids storageKey and documentStorageKey on client surfaces", () => {
    assert.equal(isClientForbiddenStorageField("storageKey"), true);
    assert.equal(isClientForbiddenStorageField("documentStorageKey"), true);
    assert.equal(evaluateStorageFieldPolicy("client", "storageKey").allowed, false);
    assert.equal(evaluateStorageFieldPolicy("client", "documentStorageKey").allowed, false);
  });

  it("allows exportUrl / downloadUrl / hasDocument on client surfaces", () => {
    for (const field of ["exportUrl", "downloadUrl", "hasDocument", "downloadReference", "expiresSeconds", "truthLabel"]) {
      assert.equal(isClientAllowedStorageField(field), true);
      assert.equal(evaluateStorageFieldPolicy("client", field).allowed, true);
    }
  });

  it("allows storageKey on admin surfaces", () => {
    assert.equal(evaluateStorageFieldPolicy("admin", "storageKey").allowed, true);
    assert.equal(evaluateStorageFieldPolicy("admin", "documentStorageKey").allowed, true);
  });

  it("denies unknown fields on client by default", () => {
    assert.equal(evaluateStorageFieldPolicy("client", "internalBucketPath").allowed, false);
  });

  it("walks nested payloads for client policy compliance", () => {
    assert.equal(
      payloadRespectsClientStorageFieldPolicy({
        deliverable: { exportUrl: "https://docs.example.com/x", hasDocument: true }
      }),
      true
    );
    assert.equal(
      payloadRespectsClientStorageFieldPolicy({
        deliverable: { storageKey: "tenants/x/y" }
      }),
      false
    );
    assert.equal(
      payloadRespectsClientStorageFieldPolicy({
        items: [{ documentStorageKey: "tenants/x/y" }]
      }),
      false
    );
  });
});
