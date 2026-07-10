import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMonthlyReportExportTruth } from "./monthly-report-metrics-export-truth";

describe("monthly-report-metrics-export-truth", () => {
  it("G284: no document → truthful unavailable labels", () => {
    const result = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL"
    });
    assert.equal(result.kind, "no_document");
    assert.equal(result.hasDocument, false);
    assert.equal(result.exportUrl, null);
    assert.equal(result.storageKeyExposed, false);
    assert.equal(result.clientSafe, true);
  });

  it("G284: client-safe exportUrl without exposing storageKey", () => {
    const storageKey = "private/reports/secret-storage-key-xyz";
    const result = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL",
      storageKeyPresent: true,
      exportUrl: "https://docs.example.com/export/july-report"
    });

    assert.equal(result.kind, "client_safe_export_url");
    assert.equal(result.hasDocument, true);
    assert.equal(result.exportUrl, "https://docs.example.com/export/july-report");
    assert.equal(result.storageKeyExposed, false);
    assert.match(result.adminLabel, /storageKey internal/i);

    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes(storageKey), false);
    assert.equal("storageKey" in result, false);
    assert.equal(result.storageKeyExposed, false);
  });

  it("G284: document present without client URL", () => {
    const result = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL",
      hasDocument: true
    });
    assert.equal(result.kind, "document_present_no_client_url");
    assert.equal(result.exportUrl, null);
    assert.equal(result.clientLabel, "Document on file");
  });

  it("G284: admin document-only never serializes storageKey value", () => {
    const secretKey = "private/reports/admin-only-key-abc";
    const result = resolveMonthlyReportExportTruth({
      audience: "admin",
      storageKeyPresent: true
    });
    assert.equal(result.kind, "admin_document_only");
    assert.equal(result.hasDocument, true);
    assert.equal(result.storageKeyExposed, false);
    assert.match(result.adminLabel, /not serialized/i);
    assert.equal(JSON.stringify(result).includes(secretKey), false);
    assert.equal("storageKey" in result, false);
  });

  it("G284: rejects non-http exportUrl and non-FINAL client status", () => {
    const badUrl = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL",
      exportUrl: "javascript:alert(1)"
    });
    assert.equal(badUrl.clientSafe, false);
    assert.ok(badUrl.errors.some((e) => /http\(s\)/i.test(e)));

    const draft = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "DRAFT",
      hasDocument: true,
      exportUrl: "https://docs.example.com/x"
    });
    assert.equal(draft.clientSafe, false);
    assert.ok(draft.errors.some((e) => /FINAL/i.test(e)));
  });

  it("G535: export/download boundary — hasDocument boolean only; never storageKey field", () => {
    const clientUrl = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL",
      hasDocument: true,
      storageKeyPresent: true,
      exportUrl: "https://cdn.example.com/reports/june.pdf"
    });
    assert.equal(clientUrl.kind, "client_safe_export_url");
    assert.equal(clientUrl.hasDocument, true);
    assert.equal(clientUrl.exportUrl, "https://cdn.example.com/reports/june.pdf");
    assert.equal(clientUrl.storageKeyExposed, false);
    assert.equal("storageKey" in clientUrl, false);
    assert.equal("storageKeyPresent" in clientUrl, false);
    assert.match(clientUrl.clientLabel, /Download available/i);

    const adminWithUrl = resolveMonthlyReportExportTruth({
      audience: "admin",
      storageKeyPresent: true,
      exportUrl: "https://cdn.example.com/reports/june.pdf"
    });
    assert.equal(adminWithUrl.hasDocument, true);
    assert.equal(adminWithUrl.storageKeyExposed, false);
    assert.match(adminWithUrl.adminLabel, /not serialized/i);
    assert.equal(JSON.stringify(adminWithUrl).includes("private/"), false);

    const httpOk = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "FINAL",
      exportUrl: "http://localhost:5173/export/local-proof"
    });
    assert.equal(httpOk.kind, "client_safe_export_url");
    assert.equal(httpOk.clientSafe, true);

    const adminReviewBlocked = resolveMonthlyReportExportTruth({
      audience: "client",
      reportStatus: "ADMIN_REVIEW",
      hasDocument: true,
      exportUrl: "https://docs.example.com/x"
    });
    assert.equal(adminReviewBlocked.clientSafe, false);
    assert.ok(adminReviewBlocked.errors.some((e) => /FINAL/i.test(e)));
  });
});
