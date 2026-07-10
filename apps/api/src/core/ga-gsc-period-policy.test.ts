import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysInTargetMonth,
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
});
