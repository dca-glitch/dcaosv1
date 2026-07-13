/** Pure helpers for MonthlyReportPanel — unit-tested, extraction-friendly. */

export const MONTHLY_REPORT_STATUSES = ["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"] as const;
export type MonthlyReportStatus = (typeof MONTHLY_REPORT_STATUSES)[number];

export const MONTHLY_REPORT_WORKFLOW_STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "ADMIN_REVIEW", label: "Admin review" },
  { key: "FINAL", label: "Final" }
] as const;

export type MonthlyReportWorkflowStepKey = (typeof MONTHLY_REPORT_WORKFLOW_STEPS)[number]["key"];

export type MonthlyReportFormValues = {
  title: string;
  adminSummaryNotes: string;
  recommendationsText: string;
  exportUrl: string;
};

export type MonthlyMetricSnapshotFormValues = {
  targetMonth: string;
  sourceType: "MANUAL" | "CSV_IMPORT" | "GA4" | "GSC" | "HYBRID";
  status: "DRAFT" | "IMPORTED";
  gscClicks: string;
  gscImpressions: string;
  gscAverageCtr: string;
  gscAveragePosition: string;
  ga4Sessions: string;
  ga4Users: string;
  ga4PageViews: string;
  notes: string;
};

export type ReportShellCopy = {
  status: string;
  headline: string;
  documentState: string;
  handoffState: string;
  visibilityState: string;
  actionHint: string;
};

export type MetricsShellCopy = {
  dataStatus: "NO_DATA" | "PARTIAL" | "READY";
  trendHint: string;
  snapshotCount: number;
  trendMonthCount: number;
};

export function formatReportStatus(value: string | null | undefined): string {
  if (!value) return "No status";
  if (value === "DRAFT") return "Draft";
  if (value === "ADMIN_REVIEW") return "Admin review";
  if (value === "FINAL") return "Final";
  if (value === "ARCHIVED") return "Archived";
  return value.toLowerCase().replace(/_/g, " ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

export function formatDeliveryType(value: string | null | undefined): string {
  if (!value) return "N/A";
  return value.toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

export function isSafeExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function emptyForm(): MonthlyReportFormValues {
  return {
    title: "",
    adminSummaryNotes: "",
    recommendationsText: "",
    exportUrl: ""
  };
}

export function formFromReport(report: {
  title: string | null;
  adminSummaryNotes: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
}): MonthlyReportFormValues {
  return {
    title: report.title ?? "",
    adminSummaryNotes: report.adminSummaryNotes ?? "",
    recommendationsText: report.recommendationsText ?? "",
    exportUrl: report.exportUrl ?? ""
  };
}

export function emptyMetricsForm(targetMonth: string): MonthlyMetricSnapshotFormValues {
  return {
    targetMonth,
    sourceType: "HYBRID",
    status: "IMPORTED",
    gscClicks: "",
    gscImpressions: "",
    gscAverageCtr: "",
    gscAveragePosition: "",
    ga4Sessions: "",
    ga4Users: "",
    ga4PageViews: "",
    notes: ""
  };
}

export function parseMetricInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatMetricInteger(value: number | null | undefined): string {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

export function formatMetricDecimal(value: number | null | undefined): string {
  return typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
}

export function formatPeriodMeta(targetMonth: string | null | undefined): string | null {
  const trimmed = targetMonth?.trim();
  return trimmed ? trimmed : null;
}

export function formatLastUpdatedMeta(updatedAt: string | null | undefined): string | null {
  if (!updatedAt) return null;
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

export function resolveWorkflowStepKey(
  status: string | null | undefined,
  isArchived: boolean
): MonthlyReportWorkflowStepKey | "ARCHIVED" {
  if (isArchived || status === "ARCHIVED") return "ARCHIVED";
  if (status === "ADMIN_REVIEW") return "ADMIN_REVIEW";
  if (status === "FINAL") return "FINAL";
  return "DRAFT";
}

export function isWorkflowStepComplete(
  stepKey: MonthlyReportWorkflowStepKey,
  currentKey: MonthlyReportWorkflowStepKey | "ARCHIVED"
): boolean {
  if (currentKey === "ARCHIVED") return true;
  const order: MonthlyReportWorkflowStepKey[] = ["DRAFT", "ADMIN_REVIEW", "FINAL"];
  return order.indexOf(stepKey) < order.indexOf(currentKey as MonthlyReportWorkflowStepKey);
}

export function isWorkflowStepCurrent(
  stepKey: MonthlyReportWorkflowStepKey,
  currentKey: MonthlyReportWorkflowStepKey | "ARCHIVED"
): boolean {
  return currentKey === stepKey;
}

export function buildReportShellCopy(input: {
  status: string;
  isArchived: boolean;
  title: string | null;
  hasDocument: boolean;
  exportUrl: string | null;
  projectName: string;
}): ReportShellCopy {
  const status = input.isArchived ? "Archived" : formatReportStatus(input.status);
  const headline = input.title?.trim() || `${input.projectName} monthly report`;
  const documentState = input.hasDocument ? "Document attached" : "No document attached";
  const handoffState = input.exportUrl ? "Handoff URL set" : "No handoff URL set";
  const visibilityState = input.status === "FINAL" ? "Client-safe when FINAL" : "Internal working copy";
  const actionHint = input.isArchived
    ? "Restore to resume edits."
    : input.status === "FINAL"
      ? "FINAL — visible in Client Portal monthly reports as a client-safe snapshot with approved metrics only. Live GA/GSC sync is WITHDRAWN."
      : "Review, finalize, then attach the report document and approved snapshot notes. Client Portal shows the report only after FINAL.";

  return {
    status,
    headline,
    documentState,
    handoffState,
    visibilityState,
    actionHint
  };
}

export function buildMetricsShellCopy(input: {
  dataStatus: "NO_DATA" | "PARTIAL" | "READY";
  snapshotCount: number;
  trendMonthCount: number;
}): MetricsShellCopy {
  const trendHint =
    input.dataStatus === "READY"
      ? "Trend summary is ready from approved snapshots."
      : input.dataStatus === "PARTIAL"
        ? "Trend summary is partial; approve more snapshots to complete it."
        : "No approved snapshot data yet. Import or approve snapshots to populate the trend summary.";

  return {
    dataStatus: input.dataStatus,
    trendHint,
    snapshotCount: input.snapshotCount,
    trendMonthCount: input.trendMonthCount
  };
}
