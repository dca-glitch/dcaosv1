/**
 * Period helpers for monthly report date ranges — leap year, timezone edge notes.
 * Complements resolveMonthlyReportDateRangePolicy in monthly-report-policy.ts.
 * G521/G522: edge cases for month boundaries, future/current month handling.
 */

import {
  resolveMonthlyReportDateRangePolicy,
  type MonthlyReportDateRangePolicy,
  type MonthlyReportDateRangePolicyInput,
  type MonthlyReportDateRangeStatus
} from "./monthly-report-policy";

export function resolveGaGscReportingPeriod(
  input: MonthlyReportDateRangePolicyInput
): MonthlyReportDateRangePolicy {
  return resolveMonthlyReportDateRangePolicy(input);
}

/** UTC calendar month length (handles leap February). */
export function daysInTargetMonth(targetMonth: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    return 0;
  }
  const [year, month] = targetMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isLeapYearMonthFebruary(targetMonth: string): boolean {
  return targetMonth.endsWith("-02") && daysInTargetMonth(targetMonth) === 29;
}

/** G521 — month-start / month-end calendar strings for a valid YYYY-MM. */
export function gaGscMonthCalendarBounds(targetMonth: string): {
  ok: boolean;
  startDate: string | null;
  endDate: string | null;
  dayCount: number;
} {
  const dayCount = daysInTargetMonth(targetMonth);
  if (dayCount === 0) {
    return { ok: false, startDate: null, endDate: null, dayCount: 0 };
  }
  const endDay = String(dayCount).padStart(2, "0");
  return {
    ok: true,
    startDate: `${targetMonth}-01`,
    endDate: `${targetMonth}-${endDay}`,
    dayCount
  };
}

export type GaGscPeriodHandlingKind =
  | "closed_month"
  | "partial_current_month"
  | "blocked_current_month"
  | "future_month"
  | "invalid";

/** G522 — classify future vs current-month handling without calling Google. */
export function classifyGaGscPeriodHandling(
  input: MonthlyReportDateRangePolicyInput
): {
  kind: GaGscPeriodHandlingKind;
  status: MonthlyReportDateRangeStatus;
  allowPartialPeriod: boolean;
  requiresPartialLabel: boolean;
  mayGenerateReport: boolean;
  period: MonthlyReportDateRangePolicy;
} {
  const period = resolveGaGscReportingPeriod(input);
  const allowPartialPeriod = input.allowPartialPeriod === true;

  if (period.status === "invalid") {
    return {
      kind: "invalid",
      status: period.status,
      allowPartialPeriod,
      requiresPartialLabel: false,
      mayGenerateReport: false,
      period
    };
  }
  if (period.status === "future_month") {
    return {
      kind: "future_month",
      status: period.status,
      allowPartialPeriod,
      requiresPartialLabel: false,
      mayGenerateReport: false,
      period
    };
  }
  if (period.status === "blocked_current_month") {
    return {
      kind: "blocked_current_month",
      status: period.status,
      allowPartialPeriod,
      requiresPartialLabel: true,
      mayGenerateReport: false,
      period
    };
  }
  if (period.status === "partial_period") {
    return {
      kind: "partial_current_month",
      status: period.status,
      allowPartialPeriod,
      requiresPartialLabel: true,
      mayGenerateReport: true,
      period
    };
  }
  return {
    kind: "closed_month",
    status: period.status,
    allowPartialPeriod,
    requiresPartialLabel: false,
    mayGenerateReport: true,
    period
  };
}

/** True when status is future or blocked current month (no generation without policy change). */
export function isGaGscPeriodBlockedForGeneration(status: MonthlyReportDateRangeStatus): boolean {
  return status === "future_month" || status === "blocked_current_month" || status === "invalid";
}
