/**
 * Metrics source truth serializer for monthly reports — admin vs client labels.
 * Pure helper; no live Google.
 */

import {
  resolveMonthlyMetricsSourceTruth,
  type MonthlyMetricsSourceTruth,
  type MonthlyMetricsSourceTruthInput,
  type MonthlyReportMetricsSourceTruth
} from "./monthly-report-policy";

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
