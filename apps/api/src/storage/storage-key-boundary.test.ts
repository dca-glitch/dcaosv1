import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertNoStorageKeyLeak,
  collectForbiddenStorageKeyFields,
  serializedContainsStorageKeyField,
  serializedContainsTenantStoragePath,
  toStorageKeyBoundarySnapshot
} from "./storage-key-boundary";

describe("storage-key-boundary shared helper (G239)", () => {
  it("detects storageKey and documentStorageKey fields", () => {
    assert.equal(serializedContainsStorageKeyField({ id: "ok", title: "Safe" }), false);
    assert.equal(serializedContainsStorageKeyField({ storageKey: "tenants/x/y" }), true);
    assert.equal(serializedContainsStorageKeyField({ documentStorageKey: "tenants/x/y" }), true);
    assert.deepEqual(collectForbiddenStorageKeyFields({ a: { storageKey: "k" }, b: { documentStorageKey: "d" } }), [
      "documentStorageKey",
      "storageKey"
    ]);
  });

  it("detects tenant storage path values", () => {
    const key = "tenants/acme/years/2026/projects/p1/months/07/documents/file.pdf";
    assert.equal(serializedContainsTenantStoragePath({ path: key }, key), true);
    assert.equal(serializedContainsTenantStoragePath({ path: "/public/ok" }, key), false);
  });

  it("assertNoStorageKeyLeak throws on field or value leaks", () => {
    assert.throws(() => assertNoStorageKeyLeak({ storageKey: "tenants/x" }));
    assert.throws(() =>
      assertNoStorageKeyLeak(
        { exportUrl: "https://docs.example.com/x", note: "tenants/acme/private.pdf" },
        { forbiddenStorageKey: "tenants/acme/private.pdf" }
      )
    );
    assert.doesNotThrow(() =>
      assertNoStorageKeyLeak({ exportUrl: "https://docs.example.com/x", hasDocument: true })
    );
  });

  it("snapshot reports boolean leak flags only", () => {
    const forbidden = "tenants/acme/secret.pdf";
    const clean = toStorageKeyBoundarySnapshot(
      { exportUrl: "https://docs.example.com/x", hasDocument: true },
      forbidden
    );
    assert.deepEqual(clean, {
      hasStorageKeyField: false,
      hasDocumentStorageKeyField: false,
      containsForbiddenKeyValue: false,
      liveProven: false
    });

    const dirty = toStorageKeyBoundarySnapshot({ storageKey: forbidden }, forbidden);
    assert.equal(dirty.hasStorageKeyField, true);
    assert.equal(dirty.containsForbiddenKeyValue, true);
    assert.equal(dirty.liveProven, false);
    assert.equal(JSON.stringify(dirty).includes(forbidden), false);
  });
});
