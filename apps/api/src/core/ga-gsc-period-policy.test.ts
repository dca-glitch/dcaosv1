import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyGaGscPeriodHandling,
  daysInTargetMonth,
  gaGscMonthCalendarBounds,
  isGaGscPeriodBlockedForGeneration,
  isLeapYearMonthFebruary,
  resolveGaGscReportingPeriod
} from "./ga-gsc-period-policy";

describe("ga-gsc-period-policy", () => {
  it("G273: month boundary — closed months use first/last calendar day", () => {
    const jan = resolveGaGscReportingPeriod({
      targetMonth: "2026-01",
      reportingTimezone: "UTC",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(jan.status, "closed_month");
    assert.equal(jan.startDate, "2026-01-01");
    assert.equal(jan.endDate, "2026-01-31");
    assert.equal(daysInTargetMonth("2026-01"), 31);

    const apr = resolveGaGscReportingPeriod({
      targetMonth: "2026-04",
      reportingTimezone: "UTC",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(apr.endDate, "2026-04-30");
    assert.equal(daysInTargetMonth("2026-04"), 30);

    assert.equal(daysInTargetMonth("not-a-month"), 0);
    assert.equal(daysInTargetMonth("2026-13"), 0);
  });

  it("G273: leap and non-leap February boundaries", () => {
    assert.equal(daysInTargetMonth("2024-02"), 29);
    assert.equal(isLeapYearMonthFebruary("2024-02"), true);
    assert.equal(daysInTargetMonth("2025-02"), 28);
    assert.equal(isLeapYearMonthFebruary("2025-02"), false);

    const leap = resolveGaGscReportingPeriod({
      targetMonth: "2024-02",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(leap.endDate, "2024-02-29");
  });

  it("G274: timezone label is preserved; month bounds stay calendar-based", () => {
    const timezones = ["UTC", "Asia/Bangkok", "America/New_York", "Pacific/Kiritimati"];
    for (const reportingTimezone of timezones) {
      const range = resolveGaGscReportingPeriod({
        targetMonth: "2026-06",
        reportingTimezone,
        referenceDate: new Date("2026-07-10T12:00:00.000Z")
      });
      assert.equal(range.status, "closed_month");
      assert.equal(range.startDate, "2026-06-01");
      assert.equal(range.endDate, "2026-06-30");
      assert.equal(range.reportingTimezone, reportingTimezone);
      assert.match(range.label, new RegExp(reportingTimezone.replace("/", "\\/")));
    }
  });

  it("G275: future month rejected; current month blocked unless partial", () => {
    const future = resolveGaGscReportingPeriod({
      targetMonth: "2026-12",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(future.status, "future_month");
    assert.ok(future.errors.some((e) => /future month/i.test(e)));

    const blocked = resolveGaGscReportingPeriod({
      targetMonth: "2026-07",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(blocked.status, "blocked_current_month");

    const partial = resolveGaGscReportingPeriod({
      targetMonth: "2026-07",
      reportingTimezone: "Asia/Bangkok",
      allowPartialPeriod: true,
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(partial.status, "partial_period");
    assert.equal(partial.partialPeriod, true);
    assert.equal(partial.endDate, "2026-07-10");
    assert.ok(partial.warnings.some((w) => /partial/i.test(w)));
  });

  it("G275: invalid targetMonth / empty timezone", () => {
    const invalid = resolveGaGscReportingPeriod({
      targetMonth: "2026/07",
      reportingTimezone: "Asia/Bangkok"
    });
    assert.equal(invalid.status, "invalid");

    const noTz = resolveGaGscReportingPeriod({
      targetMonth: "2026-06",
      reportingTimezone: "   "
    });
    assert.equal(noTz.status, "invalid");
  });

  it("G521: calendar bounds and 30/31-day edge months", () => {
    assert.deepEqual(gaGscMonthCalendarBounds("2026-01"), {
      ok: true,
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      dayCount: 31
    });
    assert.deepEqual(gaGscMonthCalendarBounds("2026-09"), {
      ok: true,
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      dayCount: 30
    });
    assert.equal(gaGscMonthCalendarBounds("2026-00").ok, false);
    assert.equal(gaGscMonthCalendarBounds("bad").ok, false);

    const dec = resolveGaGscReportingPeriod({
      targetMonth: "2025-12",
      reportingTimezone: "UTC",
      referenceDate: new Date("2026-07-10T00:00:00.000Z")
    });
    assert.equal(dec.startDate, "2025-12-01");
    assert.equal(dec.endDate, "2025-12-31");
  });

  it("G522: classify future / current / partial / closed handling", () => {
    const ref = new Date("2026-07-10T00:00:00.000Z");

    const future = classifyGaGscPeriodHandling({
      targetMonth: "2026-08",
      reportingTimezone: "UTC",
      referenceDate: ref
    });
    assert.equal(future.kind, "future_month");
    assert.equal(future.mayGenerateReport, false);
    assert.equal(isGaGscPeriodBlockedForGeneration(future.status), true);

    const blocked = classifyGaGscPeriodHandling({
      targetMonth: "2026-07",
      reportingTimezone: "UTC",
      referenceDate: ref
    });
    assert.equal(blocked.kind, "blocked_current_month");
    assert.equal(blocked.requiresPartialLabel, true);
    assert.equal(blocked.mayGenerateReport, false);

    const partial = classifyGaGscPeriodHandling({
      targetMonth: "2026-07",
      reportingTimezone: "UTC",
      allowPartialPeriod: true,
      referenceDate: ref
    });
    assert.equal(partial.kind, "partial_current_month");
    assert.equal(partial.mayGenerateReport, true);
    assert.equal(partial.period.partialPeriod, true);
    assert.equal(partial.period.endDate, "2026-07-10");

    const closed = classifyGaGscPeriodHandling({
      targetMonth: "2026-06",
      reportingTimezone: "Asia/Bangkok",
      referenceDate: ref
    });
    assert.equal(closed.kind, "closed_month");
    assert.equal(closed.mayGenerateReport, true);
    assert.equal(isGaGscPeriodBlockedForGeneration(closed.status), false);
  });
});
