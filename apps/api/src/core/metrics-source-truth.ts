/**
 * Metrics source truth serializer for monthly reports — admin vs client labels.
 * Pure helper; no live Google.
 * G523 — expanded label catalog + GA/GSC-facing unavailable bridge (not Lane 6 monthly-report-metrics-*).
 */

import {
  resolveMonthlyMetricsSourceTruth,
  type MonthlyMetricsSourceTruth,
  type MonthlyMetricsSourceTruthInput,
  type MonthlyReportMetricsSourceTruth
} from "./monthly-report-policy";

export const METRICS_SOURCE_TRUTH_KINDS = [
  "manual",
  "placeholder",
  "csv",
  "live",
  "unavailable"
] as const;

export type MetricsSourceTruthKind = (typeof METRICS_SOURCE_TRUTH_KINDS)[number];

export interface SerializedMonthlyMetricsSourceTruth {
  truth: MonthlyReportMetricsSourceTruth;
  admin: {
    label: string;
    liveGaGscProven: boolean;
    mixedSources: boolean;
    sourceType: string | null;
  };
  client: {
    label: string;
    mayUseLiveLanguage: boolean;
  };
  /** Internal ids / readiness codes never appear in client payload. */
  internal: {
    gaGscReadinessStatus: string | null;
    liveProofApproved: boolean;
  };
}

export function serializeMonthlyMetricsSourceTruth(
  input: MonthlyMetricsSourceTruthInput
): SerializedMonthlyMetricsSourceTruth {
  const resolved: MonthlyMetricsSourceTruth = resolveMonthlyMetricsSourceTruth(input);

  return {
    truth: resolved.truth,
    admin: {
      label: resolved.adminLabel,
      liveGaGscProven: resolved.liveGaGscProven,
      mixedSources: resolved.mixedSources,
      sourceType: input.sourceType ?? null
    },
    client: {
      label: resolved.clientLabel,
      mayUseLiveLanguage: resolved.clientMayUseLiveLanguage
    },
    internal: {
      gaGscReadinessStatus: input.gaGscReadinessStatus ?? null,
      liveProofApproved: input.liveProofApproved === true
    }
  };
}

/** Client-facing slice only — strips internal readiness / proof flags. */
export function toClientMonthlyMetricsSourceTruthView(
  serialized: SerializedMonthlyMetricsSourceTruth
): { truth: MonthlyReportMetricsSourceTruth; label: string; mayUseLiveLanguage: boolean } {
  return {
    truth: serialized.truth,
    label: serialized.client.label,
    mayUseLiveLanguage: serialized.client.mayUseLiveLanguage
  };
}

/** G523 — stable admin/client label pairs for each truth kind (catalog for docs/tests). */
export function metricsSourceTruthLabelCatalog(): Record<
  MetricsSourceTruthKind,
  { adminExample: string; clientExample: string; clientMayUseLiveLanguage: boolean }
> {
  return {
    placeholder: {
      adminExample: "MANUAL placeholder snapshot",
      clientExample: "Placeholder metrics for local proof",
      clientMayUseLiveLanguage: false
    },
    manual: {
      adminExample: "MANUAL approved snapshot",
      clientExample: "Metrics from approved manual snapshot",
      clientMayUseLiveLanguage: false
    },
    csv: {
      adminExample: "CSV imported snapshot",
      clientExample: "Metrics from approved imported snapshot",
      clientMayUseLiveLanguage: false
    },
    live: {
      adminExample: "LIVE_GA_GSC approved snapshot",
      clientExample: "Metrics imported from connected analytics sources",
      clientMayUseLiveLanguage: true
    },
    unavailable: {
      adminExample: "GA/GSC unavailable or not live-proven",
      clientExample: "Metrics unavailable",
      clientMayUseLiveLanguage: false
    }
  };
}

/**
 * G524 — GA/GSC-facing unavailable helper (Lane 5).
 * Complements Lane 6 monthly-report-metrics-unavailable-state without editing those files.
 */
export type GaGscMetricsUnavailableReason =
  | "missing_source"
  | "not_live_proven"
  | "ga_gsc_disabled"
  | "ga_gsc_missing_config"
  | "mixed_unproven"
  | "period_blocked";

export interface GaGscMetricsUnavailableAssessment {
  unavailable: boolean;
  truth: MonthlyReportMetricsSourceTruth;
  reason: GaGscMetricsUnavailableReason | null;
  adminLabel: string;
  clientLabel: string;
  clientMayUseLiveLanguage: boolean;
  liveOAuthDeferred: true;
}

export function assessGaGscMetricsUnavailableState(input: {
  metricsSource?: MonthlyMetricsSourceTruthInput | null;
  dateRangeStatus?: string | null;
}): GaGscMetricsUnavailableAssessment {
  const serialized = serializeMonthlyMetricsSourceTruth(input.metricsSource ?? {});
  const truth = serialized.truth;

  if (truth !== "unavailable") {
    return {
      unavailable: false,
      truth,
      reason: null,
      adminLabel: serialized.admin.label,
      clientLabel: serialized.client.label,
      clientMayUseLiveLanguage: serialized.client.mayUseLiveLanguage,
      liveOAuthDeferred: true
    };
  }

  const dateStatus = input.dateRangeStatus ?? "";
  let reason: GaGscMetricsUnavailableReason = "not_live_proven";

  if (dateStatus === "future_month" || dateStatus === "blocked_current_month" || dateStatus === "invalid") {
    reason = "period_blocked";
  } else if (input.metricsSource?.gaGscReadinessStatus === "disabled") {
    reason = "ga_gsc_disabled";
  } else if (input.metricsSource?.gaGscReadinessStatus === "missing_config") {
    reason = "ga_gsc_missing_config";
  } else if (input.metricsSource?.mixedSources === true) {
    reason = "mixed_unproven";
  } else if (!input.metricsSource?.sourceType) {
    reason = "missing_source";
  }

  return {
    unavailable: true,
    truth: "unavailable",
    reason,
    adminLabel: serialized.admin.label,
    clientLabel: "Metrics unavailable",
    clientMayUseLiveLanguage: false,
    liveOAuthDeferred: true
  };
}
