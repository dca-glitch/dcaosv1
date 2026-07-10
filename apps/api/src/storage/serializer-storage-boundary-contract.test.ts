/**
 * G478 PARTIAL — Lane-1 serializer boundary contract tests.
 * Does not import or edit Lane 2 serializer files
 * (deliverable/image/monthly-report *-serializer-storage-key-boundary*).
 * Proves shared boundary + client-safe URL + field-policy contracts used by those serializers.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { payloadRespectsClientStorageFieldPolicy } from "./admin-vs-client-storage-field-policy";
import {
  buildClientSafeStorageUrlPayload,
  isClientSafeStorageUrlPayload,
  toClientSafeStorageUrlPayloadSnapshot
} from "./client-safe-storage-url-policy";
import {
  assertNoStorageKeyLeak,
  collectForbiddenStorageKeyFieldPaths,
  toStorageKeyBoundarySnapshot
} from "./storage-key-boundary";

describe("serializer-storage-boundary-contract (G478 PARTIAL — Lane 1)", () => {
  it("models deliverable client summary shape without storageKey", () => {
    const forbidden = "tenants/acme/years/2026/projects/p1/months/07/documents/deliverable.pdf";
    const clientSummary = buildClientSafeStorageUrlPayload({
      exportUrl: "https://docs.example.com/export/deliverable",
      storageKey: forbidden,
      truthLabel: "export_url"
    });

    assertNoStorageKeyLeak(clientSummary, { forbiddenStorageKey: forbidden });
    assert.equal(payloadRespectsClientStorageFieldPolicy(clientSummary), true);
    assert.equal(isClientSafeStorageUrlPayload(clientSummary), true);
    assert.deepEqual(toStorageKeyBoundarySnapshot(clientSummary, forbidden), {
      hasStorageKeyField: false,
      hasDocumentStorageKeyField: false,
      containsForbiddenKeyValue: false,
      forbiddenFieldPathCount: 0,
      liveProven: false
    });
  });

  it("models image variant client shape with hasDocument only", () => {
    const forbidden = "tenants/acme/years/2026/projects/p1/months/07/images/img1/hero.png";
    const variants = ["hero", "supporting-1", "supporting-2", "social-preview"].map((variant) =>
      buildClientSafeStorageUrlPayload({
        downloadUrl: `https://signed.example.com/tmp/${variant}`,
        storageKey: `${forbidden.replace("hero.png", `${variant}.png`)}`,
        truthLabel: "mocked"
      })
    );

    for (const payload of variants) {
      assertNoStorageKeyLeak(payload, { forbiddenStorageKey: forbidden });
      assert.equal(payload.hasDocument, true);
      assert.equal(payload.liveProven, false);
      assert.equal(toClientSafeStorageUrlPayloadSnapshot(payload).containsStorageKeyField, false);
    }
  });

  it("models monthly-report exportUrl shape and rejects nested storageKey leaks", () => {
    const forbidden = "tenants/acme/years/2026/projects/p1/months/07/documents/monthly-report.pdf";
    const safe = buildClientSafeStorageUrlPayload({
      exportUrl: "https://docs.example.com/export/monthly-report",
      storageKey: forbidden,
      truthLabel: "export_url"
    });
    assertNoStorageKeyLeak(safe, { forbiddenStorageKey: forbidden });

    const leaked = {
      report: {
        exportUrl: "https://docs.example.com/export/monthly-report",
        documentStorageKey: forbidden
      }
    };
    assert.equal(payloadRespectsClientStorageFieldPolicy(leaked), false);
    assert.deepEqual(collectForbiddenStorageKeyFieldPaths(leaked), ["report.documentStorageKey"]);
    assert.throws(() => assertNoStorageKeyLeak(leaked, { forbiddenStorageKey: forbidden }));
  });
});
