import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientSafeUrlTruthLabel,
  assertNonLiveClientSafeUrlLabel,
  buildClientSafeStorageUrlPayload,
  CLIENT_SAFE_URL_TRUTH_LABELS,
  isClientSafeStorageUrlPayload,
  isClientSafeUrlTruthLabel,
  toClientSafeStorageUrlPayloadSnapshot,
  toClientSafeUrlTruthLabelMatrix
} from "./client-safe-storage-url-policy";

describe("client-safe-storage-url-policy (G152 / G237 / G238 / G477)", () => {
  it("allows exportUrl and downloadUrl while stripping storageKey (G237)", () => {
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
    assert.equal(payload.liveProven, false);
    assert.equal(serialized.includes("storageKey"), false);
    assert.equal(serialized.includes("tenants/internal/private-object.pdf"), false);
    assert.equal(isClientSafeStorageUrlPayload(payload), true);
  });

  it("truth-labels mocked and future URLs so they are not implied live-signed (G238)", () => {
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
    assert.equal(assertNonLiveClientSafeUrlLabel("mocked").ok, true);
    assert.equal(assertNonLiveClientSafeUrlLabel("future_placeholder").ok, true);
    assert.equal(assertNonLiveClientSafeUrlLabel("export_url").ok, true);
    assert.equal(assertNonLiveClientSafeUrlLabel("live_signed").ok, false);
  });

  it("rejects payloads that still contain storageKey or documentStorageKey", () => {
    assert.equal(
      isClientSafeStorageUrlPayload({
        exportUrl: "https://docs.example.com/x",
        storageKey: "tenants/leak/key.pdf"
      }),
      false
    );
    assert.equal(
      isClientSafeStorageUrlPayload({
        exportUrl: "https://docs.example.com/x",
        documentStorageKey: "tenants/leak/doc.pdf"
      }),
      false
    );
  });

  it("validates truth labels and rejects unknown labels", () => {
    for (const label of CLIENT_SAFE_URL_TRUTH_LABELS) {
      assert.equal(isClientSafeUrlTruthLabel(label), true);
    }
    assert.equal(isClientSafeUrlTruthLabel("live_proven"), false);
    assert.equal(isClientSafeUrlTruthLabel(""), false);
    assert.equal(isClientSafeUrlTruthLabel(null), false);

    assert.throws(() =>
      buildClientSafeStorageUrlPayload({
        exportUrl: "https://docs.example.com/x",
        truthLabel: "not_a_label" as never
      })
    );
  });

  it("trims empty URL strings to null and still reports hasDocument from storageKey input", () => {
    const payload = buildClientSafeStorageUrlPayload({
      exportUrl: "   ",
      downloadUrl: "",
      storageKey: "tenants/acme/doc.pdf",
      truthLabel: "mocked"
    });
    assert.equal(payload.exportUrl, null);
    assert.equal(payload.downloadUrl, null);
    assert.equal(payload.hasDocument, true);
    assert.equal(payload.liveProven, false);
    assert.equal(isClientSafeStorageUrlPayload(payload), true);
  });

  it("rejects payloads with invalid truthLabel field", () => {
    assert.equal(
      isClientSafeStorageUrlPayload({
        exportUrl: "https://docs.example.com/x",
        downloadUrl: null,
        hasDocument: true,
        truthLabel: "pretend_live"
      }),
      false
    );
  });

  it("exposes truth-label matrix and payload snapshot without storageKey (G477)", () => {
    const matrix = toClientSafeUrlTruthLabelMatrix();
    assert.equal(matrix.length, CLIENT_SAFE_URL_TRUTH_LABELS.length);
    assert.deepEqual(
      matrix.map((row) => row.truthLabel),
      [...CLIENT_SAFE_URL_TRUTH_LABELS]
    );

    const live = matrix.find((row) => row.truthLabel === "live_signed");
    assert.ok(live);
    assert.equal(live.mayImplyLiveSignedUrl, true);
    assert.equal(live.nonLiveAssertOk, false);

    for (const label of ["mocked", "future_placeholder", "export_url"] as const) {
      const row = matrix.find((entry) => entry.truthLabel === label);
      assert.ok(row);
      assert.equal(row.mayImplyLiveSignedUrl, false);
      assert.equal(row.nonLiveAssertOk, true);
      assert.equal(row.liveProvenImplied, false);
    }

    const payload = buildClientSafeStorageUrlPayload({
      exportUrl: "https://docs.example.com/export/g477",
      storageKey: "tenants/acme/private/g477.pdf",
      truthLabel: "export_url"
    });
    const snap = toClientSafeStorageUrlPayloadSnapshot(payload);
    assert.deepEqual(snap, {
      hasExportUrl: true,
      hasDownloadUrl: false,
      hasDocument: true,
      truthLabel: "export_url",
      liveProven: false,
      containsStorageKeyField: false
    });
    assert.equal(JSON.stringify(snap).includes("tenants/"), false);
    assert.equal(JSON.stringify(snap).includes("storageKey"), false);
  });
});
