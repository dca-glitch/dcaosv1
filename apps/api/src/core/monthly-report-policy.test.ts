import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveMonthlyMetricsSourceTruth,
  resolveMonthlyReportDateRangePolicy,
  validateMonthlyReportGenerationInput
} from "./monthly-report-policy";

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
  });
});
