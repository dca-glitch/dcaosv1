/**
 * Period helpers for monthly report date ranges — leap year, timezone edge notes.
 * Complements resolveMonthlyReportDateRangePolicy in monthly-report-policy.ts.
 */

import {
  resolveMonthlyReportDateRangePolicy,
  type MonthlyReportDateRangePolicy,
  type MonthlyReportDateRangePolicyInput
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
