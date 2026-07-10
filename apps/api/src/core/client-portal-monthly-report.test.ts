import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";
import {
  isClientPortalMonthlyReportVisible,
  sanitizeClientPortalMonthlyReportDisplayTitle,
  toClientPortalMonthlyReportPerformanceSummary,
  toClientPortalMonthlyReportSummary
} from "./client-portal.runtime";
import { buildPurivaMonthlyReportMetricsFixture } from "./puriva-monthly-report";

describe("client portal monthly report boundary (G200)", () => {
  it("allows client visibility only for non-archived FINAL monthly reports", () => {
    assert.equal(isClientPortalMonthlyReportVisible({ status: "FINAL", isArchived: false }), true);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "DRAFT", isArchived: false }), false);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "ADMIN_REVIEW", isArchived: false }), false);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "FINAL", isArchived: true }), false);
  });

  it("sanitizes internal Puriva markers from client-visible titles", () => {
    const title = sanitizeClientPortalMonthlyReportDisplayTitle(
      "[PURIVA_LOCAL_SETUP] PURIVA_MONTHLY_REPORT_V1 Puriva monthly report scaffold - 2026-07"
    );

    assert.equal(title?.includes("PURIVA_MONTHLY_REPORT_V1"), false);
    assert.equal(title?.includes("[PURIVA_LOCAL_SETUP]"), false);
    assert.equal(title?.toLowerCase().includes("scaffold"), false);
  });

  it("keeps approved manual metrics labeled as placeholder/manual, not live GA/GSC", () => {
    const fixture = buildPurivaMonthlyReportMetricsFixture("2026-07");
    const summary = toClientPortalMonthlyReportPerformanceSummary({
      id: "snapshot-1",
      targetMonth: fixture.targetMonth,
      sourceType: fixture.sourceType,
      status: "APPROVED",
      notes: fixture.notes,
      gscClicks: fixture.gscClicks,
      gscImpressions: fixture.gscImpressions,
      gscAverageCtr: fixture.gscAverageCtr,
      gscAveragePosition: fixture.gscAveragePosition,
      ga4Sessions: fixture.ga4Sessions,
      ga4Users: fixture.ga4Users,
      ga4PageViews: fixture.ga4PageViews
    });

    assert.equal(summary.placeholderOnly, true);
    assert.equal(summary.manualSource, true);
    assert.equal(summary.disclaimer?.includes("Awaiting real GA/GSC"), true);
    assert.equal("id" in summary, false);
    assert.equal("notes" in summary, false);
    assert.equal("miHandoffId" in summary, false);
    assertClientPortalPayloadHasNoForbiddenKeys(summary);
  });

  it("exposes client-safe exportUrl and FINAL status without storageKey or internal source IDs", () => {
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-final-1",
      aiDeliveryProjectId: "project-1",
      title: "July performance",
      recommendationsText: "Keep publishing cadence",
      exportUrl: "https://docs.example.com/export/july-report",
      finalizedAt: new Date("2026-07-05T00:00:00.000Z"),
      storageKey: "tenants/internal/july-report.pdf",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z")
    });

    assert.equal(summary.status, "FINAL");
    assert.equal(summary.exportUrl, "https://docs.example.com/export/july-report");
    assert.equal(summary.hasDocument, true);
    assert.equal("storageKey" in summary, false);
    assert.equal("miHandoffId" in summary, false);
    assert.equal("adminSummaryNotes" in summary, false);
    assert.equal(collectClientPortalForbiddenPayloadKeys(summary).length, 0);
  });
});
