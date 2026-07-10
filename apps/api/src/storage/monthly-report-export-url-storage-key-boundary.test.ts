import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toClientPortalMonthlyReportSummary } from "../core/client-portal.runtime";
import {
  buildClientSafeStorageUrlPayload,
  isClientSafeStorageUrlPayload
} from "./client-safe-storage-url-policy";
import {
  evaluateExportUrlStorageKeyMatrix,
  payloadRespectsExportUrlStorageKeyMatrix
} from "./export-url-storage-key-matrix";
import { assertNoStorageKeyLeak } from "./storage-key-boundary";

/**
 * G155 / G242 / G482 — Monthly report exportUrl / storageKey boundary.
 * Prefers storage/-owned tests that import the exported client-portal monthly report serializer.
 * Does not edit client-portal or monthly-report core files.
 */
describe("monthly-report-export-url-storage-key-boundary (G155 / G242 / G482)", () => {
  it("keeps exportUrl and converts storageKey to hasDocument only", () => {
    const forbiddenKey = "tenants/acme/years/2026/projects/p1/months/07/documents/monthly-report.pdf";
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-boundary-1",
      aiDeliveryProjectId: "project-boundary-1",
      title: "July monthly report",
      recommendationsText: "Continue current plan",
      exportUrl: "https://docs.example.com/export/monthly-report",
      finalizedAt: new Date("2026-07-03T00:00:00.000Z"),
      storageKey: forbiddenKey,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.exportUrl, "https://docs.example.com/export/monthly-report");
    assert.equal(summary.hasDocument, true);
    assert.equal("storageKey" in summary, false);
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });

  it("allows exportUrl without a storage-backed document", () => {
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-boundary-2",
      aiDeliveryProjectId: "project-boundary-1",
      title: "Export-only report",
      recommendationsText: null,
      exportUrl: "https://docs.example.com/export/export-only",
      finalizedAt: null,
      storageKey: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.exportUrl, "https://docs.example.com/export/export-only");
    assert.equal(summary.hasDocument, false);
    assertNoStorageKeyLeak(summary);
  });

  it("aligns monthly-report client URL policy with exportUrl allowed and storageKey forbidden", () => {
    const payload = buildClientSafeStorageUrlPayload({
      exportUrl: "https://docs.example.com/export/monthly-report",
      downloadUrl: null,
      storageKey: "tenants/internal/monthly-report.pdf",
      truthLabel: "export_url"
    });

    assert.equal(payload.exportUrl, "https://docs.example.com/export/monthly-report");
    assert.equal(isClientSafeStorageUrlPayload(payload), true);
    assert.equal(payload.liveProven, false);
    assertNoStorageKeyLeak(payload, { forbiddenStorageKey: "tenants/internal/monthly-report.pdf" });
  });

  it("keeps hasDocument true with null exportUrl when storageKey exists (G242)", () => {
    const forbiddenKey = "tenants/acme/documents/monthly-report-storage-only.pdf";
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-boundary-3",
      aiDeliveryProjectId: "project-boundary-1",
      title: "Storage-only report",
      recommendationsText: null,
      exportUrl: null,
      finalizedAt: new Date("2026-07-03T00:00:00.000Z"),
      storageKey: forbiddenKey,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.exportUrl, null);
    assert.equal(summary.hasDocument, true);
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });

  it("proves client-safe monthly report output: exportUrl allowed, storageKey forbidden (G482)", () => {
    const forbiddenKey = "tenants/acme/years/2026/documents/g482-monthly.pdf";
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-g482",
      aiDeliveryProjectId: "project-boundary-1",
      title: "G482 monthly report",
      recommendationsText: "Keep cadence",
      exportUrl: "https://docs.example.com/export/g482-monthly",
      finalizedAt: new Date("2026-07-03T00:00:00.000Z"),
      storageKey: forbiddenKey,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_monthly_report_summary", "exportUrl").allowed,
      true
    );
    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_monthly_report_summary", "storageKey").allowed,
      false
    );
    assert.equal(summary.exportUrl, "https://docs.example.com/export/g482-monthly");
    assert.equal(summary.hasDocument, true);
    assert.equal("storageKey" in summary, false);
    assert.equal(
      payloadRespectsExportUrlStorageKeyMatrix("client_portal_monthly_report_summary", summary).ok,
      true
    );
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });
});
