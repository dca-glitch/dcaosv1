import { type GaGscIntegrationReadinessStatus } from "../config/ga-gsc.config";
import { type MonthlyMetricSourceType } from "./core.types";

export type MonthlyReportMetricsSourceTruth =
  | "manual"
  | "placeholder"
  | "csv"
  | "live"
  | "unavailable";

export type MonthlyReportDateRangeStatus =
  | "closed_month"
  | "partial_period"
  | "blocked_current_month"
  | "invalid";

export interface MonthlyReportDateRangePolicyInput {
  targetMonth: string;
  reportingTimezone: string;
  allowPartialPeriod?: boolean;
  referenceDate?: Date;
}

export interface MonthlyReportDateRangePolicy {
  status: MonthlyReportDateRangeStatus;
  targetMonth: string;
  startDate: string | null;
  endDate: string | null;
  reportingTimezone: string;
  partialPeriod: boolean;
  label: string;
  errors: string[];
}

export interface MonthlyMetricsSourceTruthInput {
  sourceType?: MonthlyMetricSourceType | null;
  status?: string | null;
  placeholderOnly?: boolean | null;
  gaGscReadinessStatus?: GaGscIntegrationReadinessStatus | null;
  liveProofApproved?: boolean | null;
}

export interface MonthlyMetricsSourceTruth {
  truth: MonthlyReportMetricsSourceTruth;
  adminLabel: string;
  clientLabel: string;
  liveGaGscProven: boolean;
  clientMayUseLiveLanguage: boolean;
}

export interface MonthlyReportGenerationInputContract {
  reportId?: string | null;
  targetMonth?: string | null;
  reportingTimezone?: string | null;
  metricsSource?: MonthlyMetricsSourceTruthInput | null;
  approvedSnapshotId?: string | null;
  reportStatus?: string | null;
  dateRange?: MonthlyReportDateRangePolicy | null;
}

export interface MonthlyReportGenerationInputValidation {
  ok: boolean;
  errors: string[];
  normalized: {
    reportId: string;
    targetMonth: string;
    reportingTimezone: string;
    metricsTruth: MonthlyMetricsSourceTruth;
    dateRange: MonthlyReportDateRangePolicy;
  } | null;
}

function isTargetMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function monthEndDate(targetMonth: string): string {
  const [year, month] = targetMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function referenceTargetMonth(referenceDate: Date): string {
  return referenceDate.toISOString().slice(0, 7);
}

export function resolveMonthlyReportDateRangePolicy(
  input: MonthlyReportDateRangePolicyInput
): MonthlyReportDateRangePolicy {
  const targetMonth = input.targetMonth.trim();
  const reportingTimezone = input.reportingTimezone.trim();
  const errors: string[] = [];

  if (!isTargetMonth(targetMonth)) {
    errors.push("targetMonth must use YYYY-MM format");
  }
  if (!reportingTimezone) {
    errors.push("reportingTimezone is required");
  }

  if (errors.length > 0) {
    return {
      status: "invalid",
      targetMonth,
      startDate: null,
      endDate: null,
      reportingTimezone,
      partialPeriod: false,
      label: "Invalid monthly report date range",
      errors
    };
  }

  const referenceDate = input.referenceDate ?? new Date();
  const isCurrentMonth = referenceTargetMonth(referenceDate) === targetMonth;
  const startDate = `${targetMonth}-01`;

  if (isCurrentMonth && !input.allowPartialPeriod) {
    return {
      status: "blocked_current_month",
      targetMonth,
      startDate,
      endDate: monthEndDate(targetMonth),
      reportingTimezone,
      partialPeriod: false,
      label: "Current-month report requires explicit partial-period labeling",
      errors: ["current month is not a closed reporting period"]
    };
  }

  if (isCurrentMonth && input.allowPartialPeriod) {
    return {
      status: "partial_period",
      targetMonth,
      startDate,
      endDate: referenceDate.toISOString().slice(0, 10),
      reportingTimezone,
      partialPeriod: true,
      label: `Partial period ${startDate} through ${referenceDate.toISOString().slice(0, 10)} (${reportingTimezone})`,
      errors: []
    };
  }

  return {
    status: "closed_month",
    targetMonth,
    startDate,
    endDate: monthEndDate(targetMonth),
    reportingTimezone,
    partialPeriod: false,
    label: `Closed month ${startDate} through ${monthEndDate(targetMonth)} (${reportingTimezone})`,
    errors: []
  };
}

export function resolveMonthlyMetricsSourceTruth(
  input: MonthlyMetricsSourceTruthInput
): MonthlyMetricsSourceTruth {
  if (!input.sourceType) {
    return {
      truth: "unavailable",
      adminLabel: "metrics unavailable",
      clientLabel: "Metrics unavailable",
      liveGaGscProven: false,
      clientMayUseLiveLanguage: false
    };
  }

  if (input.sourceType === "MANUAL") {
    const placeholder = input.placeholderOnly !== false;
    return {
      truth: placeholder ? "placeholder" : "manual",
      adminLabel: placeholder ? "MANUAL placeholder snapshot" : "MANUAL approved snapshot",
      clientLabel: placeholder ? "Placeholder metrics for local proof" : "Metrics from approved manual snapshot",
      liveGaGscProven: false,
      clientMayUseLiveLanguage: false
    };
  }

  if (input.sourceType === "CSV_IMPORT") {
    return {
      truth: "csv",
      adminLabel: "CSV imported snapshot",
      clientLabel: "Metrics from approved imported snapshot",
      liveGaGscProven: false,
      clientMayUseLiveLanguage: false
    };
  }

  if (input.status === "APPROVED" && input.gaGscReadinessStatus === "configured_shape_ok" && input.liveProofApproved) {
    return {
      truth: "live",
      adminLabel: "LIVE_GA_GSC approved snapshot",
      clientLabel: "Metrics imported from connected analytics sources",
      liveGaGscProven: true,
      clientMayUseLiveLanguage: true
    };
  }

  return {
    truth: "unavailable",
    adminLabel: "GA/GSC unavailable or not live-proven",
    clientLabel: "Metrics unavailable",
    liveGaGscProven: false,
    clientMayUseLiveLanguage: false
  };
}

export function validateMonthlyReportGenerationInput(
  input: MonthlyReportGenerationInputContract
): MonthlyReportGenerationInputValidation {
  const reportId = input.reportId?.trim() ?? "";
  const targetMonth = input.targetMonth?.trim() ?? "";
  const reportingTimezone = input.reportingTimezone?.trim() ?? "";
  const errors: string[] = [];

  if (!reportId) errors.push("reportId is required");
  if (!isTargetMonth(targetMonth)) errors.push("targetMonth must use YYYY-MM format");
  if (!reportingTimezone) errors.push("reportingTimezone is required");
  if (input.reportStatus && input.reportStatus !== "FINAL" && !input.approvedSnapshotId) {
    errors.push("non-FINAL report generation requires an approved snapshot before client exposure");
  }

  const dateRange =
    input.dateRange ??
    resolveMonthlyReportDateRangePolicy({
      targetMonth,
      reportingTimezone,
      allowPartialPeriod: false
    });

  if (dateRange.status === "invalid" || dateRange.status === "blocked_current_month") {
    errors.push(...dateRange.errors);
  }

  const metricsTruth = resolveMonthlyMetricsSourceTruth(input.metricsSource ?? {});
  if (metricsTruth.truth === "live" && !input.approvedSnapshotId) {
    errors.push("live GA/GSC report generation requires an approved snapshot id");
  }

  if (metricsTruth.truth === "placeholder" && metricsTruth.clientMayUseLiveLanguage) {
    errors.push("placeholder metrics cannot use live analytics language");
  }

  if (errors.length > 0) {
    return { ok: false, errors, normalized: null };
  }

  return {
    ok: true,
    errors: [],
    normalized: {
      reportId,
      targetMonth,
      reportingTimezone,
      metricsTruth,
      dateRange
    }
  };
}
