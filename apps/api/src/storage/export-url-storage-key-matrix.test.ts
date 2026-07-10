import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPORT_URL_ALLOWED_FIELDS,
  STORAGE_KEY_FORBIDDEN_FIELDS,
  audienceForExportUrlMatrixSurface,
  buildExportUrlStorageKeyMatrix,
  evaluateExportUrlStorageKeyMatrix,
  isExportUrlMatrixSurface,
  payloadRespectsExportUrlStorageKeyMatrix
} from "./export-url-storage-key-matrix";

describe("export-url-storage-key-matrix (G481)", () => {
  it("marks exportUrl allowed and storageKey forbidden on all client surfaces", () => {
    const clientSurfaces = [
      "client_portal_deliverable_summary",
      "client_portal_monthly_report_summary",
      "client_portal_image_summary",
      "client_portal_download_reference"
    ] as const;

    for (const surface of clientSurfaces) {
      assert.equal(audienceForExportUrlMatrixSurface(surface), "client");
      assert.equal(evaluateExportUrlStorageKeyMatrix(surface, "exportUrl").allowed, true);
      assert.equal(evaluateExportUrlStorageKeyMatrix(surface, "hasDocument").allowed, true);
      assert.equal(evaluateExportUrlStorageKeyMatrix(surface, "storageKey").allowed, false);
      assert.equal(evaluateExportUrlStorageKeyMatrix(surface, "documentStorageKey").allowed, false);
    }
  });

  it("allows storageKey on admin surfaces only", () => {
    assert.equal(
      evaluateExportUrlStorageKeyMatrix("admin_deliverable_summary", "storageKey").allowed,
      true
    );
    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_deliverable_summary", "storageKey").allowed,
      false
    );
  });

  it("exposes stable allowed vs forbidden field lists", () => {
    assert.deepEqual(EXPORT_URL_ALLOWED_FIELDS, [
      "downloadReference",
      "downloadUrl",
      "expiresSeconds",
      "exportUrl",
      "hasDocument",
      "truthLabel"
    ]);
    assert.deepEqual(STORAGE_KEY_FORBIDDEN_FIELDS, ["documentStorageKey", "storageKey"]);
  });

  it("builds a complete matrix without live IO claims", () => {
    const rows = buildExportUrlStorageKeyMatrix();
    assert.equal(rows.length, 8 * 8);
    assert.ok(rows.every((row) => typeof row.reason === "string" && row.reason.length > 0));
    assert.equal(isExportUrlMatrixSurface("client_portal_monthly_report_summary"), true);
    assert.equal(isExportUrlMatrixSurface("not-a-surface"), false);
  });

  it("accepts client payloads with exportUrl and rejects storageKey leaks", () => {
    const ok = payloadRespectsExportUrlStorageKeyMatrix("client_portal_deliverable_summary", {
      exportUrl: "https://docs.example.com/export/x",
      hasDocument: true
    });
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.violations, []);

    const leak = payloadRespectsExportUrlStorageKeyMatrix("client_portal_monthly_report_summary", {
      exportUrl: "https://docs.example.com/export/y",
      storageKey: "tenants/acme/documents/report.pdf"
    });
    assert.equal(leak.ok, false);
    assert.ok(leak.violations.some((v) => v.includes("storageKey")));
  });
});
