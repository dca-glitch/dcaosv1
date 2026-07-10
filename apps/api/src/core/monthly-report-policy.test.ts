import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveMonthlyMetricsSourceTruth,
  resolveMonthlyReportDateRangePolicy,
  validateMonthlyReportGenerationInput
} from "./monthly-report-policy";
import { daysInTargetMonth, isLeapYearMonthFebruary, resolveGaGscReportingPeriod } from "./ga-gsc-period-policy";
import {
  serializeMonthlyMetricsSourceTruth,
  toClientMonthlyMetricsSourceTruthView
} from "./metrics-source-truth";

describe("monthly-report-policy", () => {
  it("builds closed-month date ranges by default", () => {
    const range = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-02",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    assert.equal(range.status, "closed_month");
    assert.equal(range.startDate, "2026-02-01");
    assert.equal(range.endDate, "2026-02-28");
    assert.equal(range.partialPeriod, false);
    assert.match(range.label, /Asia\/Bangkok/);
  });

  it("blocks current-month ranges unless partial period is explicit", () => {
    const blocked = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-07",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    assert.equal(blocked.status, "blocked_current_month");
    assert.ok(blocked.errors.some((error) => /closed reporting period/i.test(error)));

    const partial = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-07",
      reportingTimezone: "Asia/Bangkok",
      allowPartialPeriod: true,
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    assert.equal(partial.status, "partial_period");
    assert.equal(partial.endDate, "2026-07-10");
    assert.equal(partial.partialPeriod, true);
    assert.match(partial.label, /Partial period/);
    assert.ok(partial.warnings.some((w) => /partial current-month/i.test(w)));
  });

  it("G172: rejects future months as unavailable", () => {
    const future = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-12",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    assert.equal(future.status, "future_month");
    assert.ok(future.errors.some((error) => /future month/i.test(error)));
    assert.equal(future.startDate, "2026-12-01");
    assert.equal(future.endDate, "2026-12-31");
  });

  it("G172: leap-year February ends on day 29", () => {
    const leap = resolveGaGscReportingPeriod({
      targetMonth: "2024-02",
      reportingTimezone: "UTC",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    assert.equal(leap.status, "closed_month");
    assert.equal(leap.startDate, "2024-02-01");
    assert.equal(leap.endDate, "2024-02-29");
    assert.equal(daysInTargetMonth("2024-02"), 29);
    assert.equal(isLeapYearMonthFebruary("2024-02"), true);
    assert.equal(daysInTargetMonth("2025-02"), 28);
    assert.equal(isLeapYearMonthFebruary("2025-02"), false);
  });

  it("G172: timezone edge keeps month bounds on calendar month", () => {
    const nearMonthBoundary = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-06",
      reportingTimezone: "Pacific/Kiritimati",
      referenceDate: new Date("2026-07-01T00:30:00.000Z")
    });

    assert.equal(nearMonthBoundary.status, "closed_month");
    assert.equal(nearMonthBoundary.startDate, "2026-06-01");
    assert.equal(nearMonthBoundary.endDate, "2026-06-30");
    assert.match(nearMonthBoundary.label, /Pacific\/Kiritimati/);
  });

  it("classifies manual, placeholder, CSV, live, and unavailable metric source truth", () => {
    assert.equal(resolveMonthlyMetricsSourceTruth({ sourceType: "MANUAL" }).truth, "placeholder");
    assert.equal(
      resolveMonthlyMetricsSourceTruth({ sourceType: "MANUAL", placeholderOnly: false }).truth,
      "manual"
    );
    assert.equal(resolveMonthlyMetricsSourceTruth({ sourceType: "CSV_IMPORT" }).truth, "csv");

    const live = resolveMonthlyMetricsSourceTruth({
      sourceType: "HYBRID",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      liveProofApproved: true
    });
    assert.equal(live.truth, "live");
    assert.equal(live.clientMayUseLiveLanguage, true);

    const notProven = resolveMonthlyMetricsSourceTruth({
      sourceType: "GA4",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok"
    });
    assert.equal(notProven.truth, "unavailable");
    assert.equal(notProven.clientMayUseLiveLanguage, false);
  });

  it("G173: serializes metrics source truth for all source kinds including mixed", () => {
    const cases = [
      { input: { sourceType: "MANUAL" as const }, truth: "placeholder" },
      { input: { sourceType: "MANUAL" as const, placeholderOnly: false }, truth: "manual" },
      { input: { sourceType: "CSV_IMPORT" as const }, truth: "csv" },
      {
        input: {
          sourceType: "HYBRID" as const,
          status: "APPROVED",
          gaGscReadinessStatus: "configured_shape_ok" as const,
          liveProofApproved: true
        },
        truth: "live"
      },
      { input: {}, truth: "unavailable" },
      {
        input: {
          sourceType: "GA4" as const,
          status: "APPROVED",
          gaGscReadinessStatus: "configured_shape_ok" as const,
          liveProofApproved: true,
          mixedSources: true
        },
        truth: "live"
      }
    ];

    for (const entry of cases) {
      const serialized = serializeMonthlyMetricsSourceTruth(entry.input);
      assert.equal(serialized.truth, entry.truth);
      const clientView = toClientMonthlyMetricsSourceTruthView(serialized);
      assert.equal(clientView.truth, entry.truth);
      assert.equal("gaGscReadinessStatus" in clientView, false);
      assert.equal("liveProofApproved" in clientView, false);
      if (entry.input.mixedSources) {
        assert.equal(serialized.admin.mixedSources, true);
        assert.match(serialized.admin.label, /mixed/i);
      }
    }
  });

  it("validates report generation input without allowing live overclaims", () => {
    const dateRange = resolveMonthlyReportDateRangePolicy({
      targetMonth: "2026-06",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });

    const valid = validateMonthlyReportGenerationInput({
      reportId: "report-1",
      targetMonth: "2026-06",
      reportingTimezone: "Asia/Bangkok",
      approvedSnapshotId: "snapshot-1",
      reportStatus: "FINAL",
      dateRange,
      metricsSource: { sourceType: "MANUAL", status: "APPROVED", placeholderOnly: true }
    });

    assert.equal(valid.ok, true, valid.errors.join("; "));
    assert.equal(valid.normalized?.metricsTruth.truth, "placeholder");
    assert.equal(valid.normalized?.metricsTruth.clientMayUseLiveLanguage, false);

    const invalid = validateMonthlyReportGenerationInput({
      reportId: "report-2",
      targetMonth: "2026-07",
      reportingTimezone: "Asia/Bangkok",
      reportStatus: "ADMIN_REVIEW",
      metricsSource: { sourceType: "GA4", status: "APPROVED", gaGscReadinessStatus: "configured_shape_ok" }
    });

    assert.equal(invalid.ok, false);
    assert.ok(invalid.errors.some((error) => /approved snapshot/i.test(error)));
    assert.ok(invalid.errors.some((error) => /closed reporting period/i.test(error)));

    const futureBlocked = validateMonthlyReportGenerationInput({
      reportId: "report-3",
      targetMonth: "2027-01",
      reportingTimezone: "Asia/Bangkok",
      reportStatus: "FINAL",
      approvedSnapshotId: "snap",
      dateRange: resolveMonthlyReportDateRangePolicy({
        targetMonth: "2027-01",
        reportingTimezone: "Asia/Bangkok",
        referenceDate: new Date("2026-07-10T00:00:00.000Z")
      })
    });
    assert.equal(futureBlocked.ok, false);
    assert.ok(futureBlocked.errors.some((error) => /future month/i.test(error)));
  });

  it("G531: manual / placeholder / live metric labeling stays truthful", () => {
    const placeholder = resolveMonthlyMetricsSourceTruth({
      sourceType: "MANUAL",
      placeholderOnly: true
    });
    assert.equal(placeholder.truth, "placeholder");
    assert.match(placeholder.adminLabel, /placeholder/i);
    assert.match(placeholder.clientLabel, /Placeholder/i);
    assert.equal(placeholder.clientMayUseLiveLanguage, false);
    assert.equal(placeholder.liveGaGscProven, false);

    const manual = resolveMonthlyMetricsSourceTruth({
      sourceType: "MANUAL",
      placeholderOnly: false,
      status: "APPROVED"
    });
    assert.equal(manual.truth, "manual");
    assert.match(manual.adminLabel, /MANUAL approved/i);
    assert.match(manual.clientLabel, /approved manual snapshot/i);
    assert.equal(manual.clientMayUseLiveLanguage, false);

    const live = resolveMonthlyMetricsSourceTruth({
      sourceType: "GA4",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      liveProofApproved: true
    });
    assert.equal(live.truth, "live");
    assert.equal(live.clientMayUseLiveLanguage, true);
    assert.equal(live.liveGaGscProven, true);
    assert.match(live.clientLabel, /connected analytics/i);
    assert.equal(/live GA\/GSC/i.test(live.clientLabel), false);

    const unprovenLiveShape = resolveMonthlyMetricsSourceTruth({
      sourceType: "GSC",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      liveProofApproved: false
    });
    assert.equal(unprovenLiveShape.truth, "unavailable");
    assert.equal(unprovenLiveShape.clientMayUseLiveLanguage, false);
    assert.equal(unprovenLiveShape.clientLabel, "Metrics unavailable");
  });

  it("G532: CSV import truth labels never claim live analytics", () => {
    const csv = resolveMonthlyMetricsSourceTruth({
      sourceType: "CSV_IMPORT",
      status: "APPROVED"
    });
    assert.equal(csv.truth, "csv");
    assert.match(csv.adminLabel, /CSV imported/i);
    assert.match(csv.clientLabel, /imported snapshot/i);
    assert.equal(csv.clientMayUseLiveLanguage, false);
    assert.equal(csv.liveGaGscProven, false);
    assert.equal(/live/i.test(csv.clientLabel), false);
    assert.equal(/GA\/GSC/i.test(csv.clientLabel), false);

    const serialized = serializeMonthlyMetricsSourceTruth({
      sourceType: "CSV_IMPORT",
      status: "APPROVED"
    });
    assert.equal(serialized.truth, "csv");
    const clientView = toClientMonthlyMetricsSourceTruthView(serialized);
    assert.equal(clientView.truth, "csv");
    assert.equal("gaGscReadinessStatus" in clientView, false);
    assert.equal("liveProofApproved" in clientView, false);
    assert.equal(clientView.mayUseLiveLanguage, false);
    // Label text must not claim live analytics (ignore mayUseLiveLanguage key name).
    assert.equal(/live/i.test(clientView.label), false);
    assert.equal(/GA\/GSC/i.test(clientView.label), false);

    const gen = validateMonthlyReportGenerationInput({
      reportId: "csv-report-1",
      targetMonth: "2026-06",
      reportingTimezone: "Asia/Bangkok",
      approvedSnapshotId: "csv-snap-1",
      reportStatus: "FINAL",
      dateRange: resolveMonthlyReportDateRangePolicy({
        targetMonth: "2026-06",
        reportingTimezone: "Asia/Bangkok",
        referenceDate: new Date("2026-07-10T00:00:00.000Z")
      }),
      metricsSource: { sourceType: "CSV_IMPORT", status: "APPROVED" }
    });
    assert.equal(gen.ok, true, gen.errors.join("; "));
    assert.equal(gen.normalized?.metricsTruth.truth, "csv");
    assert.equal(gen.normalized?.metricsTruth.clientMayUseLiveLanguage, false);
  });
});
