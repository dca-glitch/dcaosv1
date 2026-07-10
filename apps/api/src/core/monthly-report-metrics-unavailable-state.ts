/**
 * Monthly report unavailable-state helper — truthful labels when metrics cannot be shown.
 * Pure helper; no live Google, no storage I/O.
 */

import {
  resolveMonthlyMetricsSourceTruth,
  type MonthlyMetricsSourceTruthInput,
  type MonthlyReportMetricsSourceTruth
} from "./monthly-report-policy";

export type MonthlyReportUnavailableReason =
  | "missing_source"
  | "not_live_proven"
  | "ga_gsc_disabled"
  | "ga_gsc_missing_config"
  | "snapshot_unapproved"
  | "future_or_blocked_period"
  | "mixed_unproven";

export interface MonthlyReportUnavailableStateInput {
  metricsSource?: MonthlyMetricsSourceTruthInput | null;
  reportStatus?: string | null;
  approvedSnapshotId?: string | null;
  dateRangeStatus?: string | null;
}

export interface MonthlyReportUnavailableState {
  unavailable: boolean;
  truth: MonthlyReportMetricsSourceTruth;
  reason: MonthlyReportUnavailableReason | null;
  adminLabel: string;
  clientLabel: string;
  clientMayUseLiveLanguage: boolean;
  mayExposeToClient: boolean;
}

function inferReason(
  input: MonthlyReportUnavailableStateInput,
  truth: MonthlyReportMetricsSourceTruth
): MonthlyReportUnavailableReason | null {
  if (truth !== "unavailable") {
    return null;
  }

  const dateStatus = input.dateRangeStatus ?? "";
  if (dateStatus === "future_month" || dateStatus === "blocked_current_month" || dateStatus === "invalid") {
    return "future_or_blocked_period";
  }

  const readiness = input.metricsSource?.gaGscReadinessStatus ?? null;
  if (readiness === "disabled") {
    return "ga_gsc_disabled";
  }
  if (readiness === "missing_config") {
    return "ga_gsc_missing_config";
  }

  if (input.metricsSource?.mixedSources === true) {
    return "mixed_unproven";
  }

  if (!input.metricsSource?.sourceType) {
    return "missing_source";
  }

  if (input.reportStatus && input.reportStatus !== "FINAL" && !input.approvedSnapshotId) {
    return "snapshot_unapproved";
  }

  if (input.metricsSource?.liveProofApproved !== true) {
    return "not_live_proven";
  }

  return "not_live_proven";
}

/**
 * Resolves whether monthly metrics should be treated as unavailable for client/admin display,
 * with reason codes that never imply live GA/GSC success.
 */
export function resolveMonthlyReportUnavailableState(
  input: MonthlyReportUnavailableStateInput = {}
): MonthlyReportUnavailableState {
  const resolved = resolveMonthlyMetricsSourceTruth(input.metricsSource ?? {});
  const unavailable = resolved.truth === "unavailable";
  const reason = inferReason(input, resolved.truth);

  const reasonAdminLabels: Record<MonthlyReportUnavailableReason, string> = {
    missing_source: "metrics unavailable — no source type",
    not_live_proven: "metrics unavailable — GA/GSC not live-proven",
    ga_gsc_disabled: "metrics unavailable — GA/GSC sync disabled",
    ga_gsc_missing_config: "metrics unavailable — GA/GSC config incomplete",
    snapshot_unapproved: "metrics unavailable — approved snapshot required",
    future_or_blocked_period: "metrics unavailable — reporting period not eligible",
    mixed_unproven: "metrics unavailable — mixed sources not live-proven"
  };

  return {
    unavailable,
    truth: resolved.truth,
    reason,
    adminLabel: unavailable
      ? reason
        ? reasonAdminLabels[reason]
        : resolved.adminLabel
      : resolved.adminLabel,
    clientLabel: unavailable ? "Metrics unavailable" : resolved.clientLabel,
    // Unavailable paths never allow live language; live-proven paths inherit policy.
    clientMayUseLiveLanguage: unavailable ? false : resolved.clientMayUseLiveLanguage,
    // Client may see an unavailable notice on FINAL reports only; never invent live language.
    mayExposeToClient: unavailable ? (input.reportStatus ?? "").toUpperCase() === "FINAL" : false
  };
}
