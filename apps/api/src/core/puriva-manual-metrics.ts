/**
 * Puriva manual metrics v1 — deterministic placeholder snapshot scaffolding.
 * No GA/GSC OAuth, Google API calls, crawl/fetch, or real traffic claims.
 */

import manualMetricsSeedData from "./puriva-manual-metrics.json";
import {
  buildPurivaSeoPlanContext,
  type PurivaSeoPlanContext
} from "./puriva-seo-plan";

export const PURIVA_MANUAL_METRICS_VERSION = "PURIVA_MANUAL_METRICS_V1";

export const PURIVA_MANUAL_METRICS_KIND = "puriva_manual_metrics_seed";

export const PURIVA_MANUAL_METRICS_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_MANUAL_METRICS_V1";

export type PurivaManualMetricsMeasurementStatus = "placeholder_not_measured";

export type PurivaManualMetricsItemPlaceholder = {
  seoPlanItemId: string;
  pageTitle: string;
  contentType: string;
  targetKeyword: string;
  measurementStatus: PurivaManualMetricsMeasurementStatus;
  gscClicks: 0;
  gscImpressions: 0;
  ga4Sessions: 0;
  ga4PageViews: 0;
  note: string;
};

export type PurivaManualMetricsTotals = {
  gscClicks: 0;
  gscImpressions: 0;
  gscAverageCtr: 0;
  gscAveragePosition: 0;
  ga4Sessions: 0;
  ga4Users: 0;
  ga4PageViews: 0;
  itemCount: number;
  placeholderOnly: true;
};

export type PurivaManualMetricsContext = {
  version: typeof PURIVA_MANUAL_METRICS_VERSION;
  kind: typeof PURIVA_MANUAL_METRICS_KIND;
  seedLabel: string;
  targetMonth: string;
  sourceType: "MANUAL";
  importStatus: "IMPORTED";
  placeholderDisclaimer: string;
  awaitingAnalyticsNote: string;
  itemMetrics: PurivaManualMetricsItemPlaceholder[];
  totals: PurivaManualMetricsTotals;
  verificationRequiredNotes: string[];
};

export type PurivaManualMetricsImportRequest = {
  targetMonth: string;
  sourceType: "MANUAL";
  status: "IMPORTED";
  gscClicks: 0;
  gscImpressions: 0;
  gscAverageCtr: 0;
  gscAveragePosition: 0;
  ga4Sessions: 0;
  ga4Users: 0;
  ga4PageViews: 0;
  notes: string;
};

export type PurivaManualMetricsClientSafeSummary = {
  targetMonth: string;
  sourceType: "MANUAL";
  placeholderOnly: true;
  itemCount: number;
  disclaimer: string;
  totals: PurivaManualMetricsTotals;
};

export type PurivaManualMetricsApprovedSnapshot = {
  id: string;
  targetMonth: string;
  sourceType: string;
  status: string;
  notes: string | null;
  context: PurivaManualMetricsContext | null;
  clientSafeSummary: PurivaManualMetricsClientSafeSummary | null;
};

type ManualMetricsSeedConfig = {
  version: typeof PURIVA_MANUAL_METRICS_VERSION;
  seedLabel: string;
  placeholderDisclaimer: string;
  awaitingAnalyticsNote: string;
  perItemNote: string;
  verificationRequiredNotes: string[];
};

const manualMetricsSeed = manualMetricsSeedData as ManualMetricsSeedConfig;

const UNSAFE_PERFORMANCE_PHRASES = [
  "traffic increased",
  "ranking improved",
  "top performer",
  "record-breaking",
  "doubled traffic",
  "real performance",
  "live analytics confirmed",
  "guaranteed visibility",
  "guaranteed rankings"
];

export function getPurivaManualMetricsSeed(): ManualMetricsSeedConfig {
  return manualMetricsSeed;
}

function buildItemPlaceholder(
  item: PurivaSeoPlanContext["items"][number],
  perItemNote: string
): PurivaManualMetricsItemPlaceholder {
  return {
    seoPlanItemId: item.id,
    pageTitle: item.title,
    contentType: item.contentType,
    targetKeyword: item.targetKeyword,
    measurementStatus: "placeholder_not_measured",
    gscClicks: 0,
    gscImpressions: 0,
    ga4Sessions: 0,
    ga4PageViews: 0,
    note: perItemNote
  };
}

function buildTotals(itemCount: number): PurivaManualMetricsTotals {
  return {
    gscClicks: 0,
    gscImpressions: 0,
    gscAverageCtr: 0,
    gscAveragePosition: 0,
    ga4Sessions: 0,
    ga4Users: 0,
    ga4PageViews: 0,
    itemCount,
    placeholderOnly: true
  };
}

export function buildPurivaManualMetricsContext(
  targetMonth: string,
  seoPlan: PurivaSeoPlanContext = buildPurivaSeoPlanContext(targetMonth)
): PurivaManualMetricsContext {
  const seed = getPurivaManualMetricsSeed();
  const itemMetrics = seoPlan.items.map((item) => buildItemPlaceholder(item, seed.perItemNote));

  return {
    version: PURIVA_MANUAL_METRICS_VERSION,
    kind: PURIVA_MANUAL_METRICS_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    sourceType: "MANUAL",
    importStatus: "IMPORTED",
    placeholderDisclaimer: seed.placeholderDisclaimer,
    awaitingAnalyticsNote: seed.awaitingAnalyticsNote,
    itemMetrics,
    totals: buildTotals(itemMetrics.length),
    verificationRequiredNotes: [...seed.verificationRequiredNotes]
  };
}

export function serializePurivaManualMetricsNotes(context: PurivaManualMetricsContext): string {
  const embed = {
    version: context.version,
    kind: context.kind,
    targetMonth: context.targetMonth,
    placeholderOnly: true,
    itemMetrics: context.itemMetrics,
    totals: context.totals,
    placeholderDisclaimer: context.placeholderDisclaimer,
    awaitingAnalyticsNote: context.awaitingAnalyticsNote
  };

  return [
    PURIVA_MANUAL_METRICS_MARKER,
    context.placeholderDisclaimer,
    context.awaitingAnalyticsNote,
    JSON.stringify(embed)
  ].join("\n");
}

export function parsePurivaManualMetricsEmbed(notes: string | null | undefined): PurivaManualMetricsContext | null {
  if (typeof notes !== "string" || !notes.includes(PURIVA_MANUAL_METRICS_MARKER)) {
    return null;
  }

  const jsonLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("{") && line.includes(PURIVA_MANUAL_METRICS_KIND));

  if (!jsonLine) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonLine) as {
      version?: string;
      kind?: string;
      targetMonth?: string;
      itemMetrics?: PurivaManualMetricsItemPlaceholder[];
      totals?: PurivaManualMetricsTotals;
      placeholderDisclaimer?: string;
      awaitingAnalyticsNote?: string;
    };

    if (parsed.version !== PURIVA_MANUAL_METRICS_VERSION || parsed.kind !== PURIVA_MANUAL_METRICS_KIND) {
      return null;
    }

    const seed = getPurivaManualMetricsSeed();
    const itemMetrics = Array.isArray(parsed.itemMetrics) ? parsed.itemMetrics : [];

    return {
      version: PURIVA_MANUAL_METRICS_VERSION,
      kind: PURIVA_MANUAL_METRICS_KIND,
      seedLabel: seed.seedLabel,
      targetMonth: parsed.targetMonth ?? "",
      sourceType: "MANUAL",
      importStatus: "IMPORTED",
      placeholderDisclaimer: parsed.placeholderDisclaimer ?? seed.placeholderDisclaimer,
      awaitingAnalyticsNote: parsed.awaitingAnalyticsNote ?? seed.awaitingAnalyticsNote,
      itemMetrics,
      totals: parsed.totals ?? buildTotals(itemMetrics.length),
      verificationRequiredNotes: [...seed.verificationRequiredNotes]
    };
  } catch {
    return null;
  }
}

export function buildPurivaManualMetricsImportRequest(
  targetMonth: string,
  seoPlan?: PurivaSeoPlanContext
): PurivaManualMetricsImportRequest {
  const context = buildPurivaManualMetricsContext(targetMonth, seoPlan);

  return {
    targetMonth: context.targetMonth,
    sourceType: context.sourceType,
    status: context.importStatus,
    gscClicks: context.totals.gscClicks,
    gscImpressions: context.totals.gscImpressions,
    gscAverageCtr: context.totals.gscAverageCtr,
    gscAveragePosition: context.totals.gscAveragePosition,
    ga4Sessions: context.totals.ga4Sessions,
    ga4Users: context.totals.ga4Users,
    ga4PageViews: context.totals.ga4PageViews,
    notes: serializePurivaManualMetricsNotes(context)
  };
}

export function buildPurivaClientSafeManualMetricsDisclaimer(
  context: PurivaManualMetricsContext = buildPurivaManualMetricsContext("2026-01")
): string {
  return `${context.placeholderDisclaimer} ${context.awaitingAnalyticsNote}`;
}

export function buildPurivaManualMetricsClientSafeSummary(
  context: PurivaManualMetricsContext
): PurivaManualMetricsClientSafeSummary {
  return {
    targetMonth: context.targetMonth,
    sourceType: "MANUAL",
    placeholderOnly: true,
    itemCount: context.itemMetrics.length,
    disclaimer: buildPurivaClientSafeManualMetricsDisclaimer(context),
    totals: context.totals
  };
}

export function consumePurivaApprovedManualMetricsSnapshot(snapshot: {
  id: string;
  targetMonth: string;
  sourceType: string;
  status: string;
  notes?: string | null;
} | null | undefined): PurivaManualMetricsApprovedSnapshot | null {
  if (!snapshot || snapshot.status !== "APPROVED" || snapshot.sourceType !== "MANUAL") {
    return null;
  }

  const context = parsePurivaManualMetricsEmbed(snapshot.notes ?? null);
  if (!context) {
    return null;
  }

  return {
    id: snapshot.id,
    targetMonth: snapshot.targetMonth,
    sourceType: snapshot.sourceType,
    status: snapshot.status,
    notes: snapshot.notes ?? null,
    context,
    clientSafeSummary: buildPurivaManualMetricsClientSafeSummary(context)
  };
}

function collectClientFacingManualMetricsText(context: PurivaManualMetricsContext): string {
  return [
    context.placeholderDisclaimer,
    context.awaitingAnalyticsNote,
    ...context.verificationRequiredNotes,
    buildPurivaClientSafeManualMetricsDisclaimer(context)
  ].join("\n");
}

export function findUnsafePerformanceClaimsInManualMetrics(
  context: PurivaManualMetricsContext = buildPurivaManualMetricsContext("2026-01")
): string[] {
  const haystack = collectClientFacingManualMetricsText(context).toLowerCase();
  return UNSAFE_PERFORMANCE_PHRASES.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function manualMetricsSnapshotHasPurivaMarker(notes: string | null | undefined): boolean {
  return typeof notes === "string" && notes.includes(PURIVA_MANUAL_METRICS_MARKER);
}

export function validatePurivaManualMetricsContext(
  context: PurivaManualMetricsContext = buildPurivaManualMetricsContext("2026-01"),
  seoPlan: PurivaSeoPlanContext = buildPurivaSeoPlanContext(context.targetMonth)
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.version !== PURIVA_MANUAL_METRICS_VERSION) {
    errors.push(`Unexpected manual metrics version: ${context.version}`);
  }

  if (context.sourceType !== "MANUAL") {
    errors.push("Manual metrics must use MANUAL sourceType");
  }

  if (context.itemMetrics.length !== seoPlan.items.length) {
    errors.push("Per-item manual metrics must match SEO plan item count");
  }

  for (const item of seoPlan.items) {
    if (!context.itemMetrics.some((entry) => entry.seoPlanItemId === item.id)) {
      errors.push(`Missing manual metrics placeholder for SEO item ${item.id}`);
    }
  }

  for (const entry of context.itemMetrics) {
    if (entry.measurementStatus !== "placeholder_not_measured") {
      errors.push(`Item ${entry.seoPlanItemId} must remain placeholder_not_measured`);
    }
    if (entry.gscClicks !== 0 || entry.ga4Sessions !== 0 || entry.ga4PageViews !== 0) {
      errors.push(`Item ${entry.seoPlanItemId} must use zero placeholder values`);
    }
  }

  if (!context.totals.placeholderOnly) {
    errors.push("Totals must remain placeholderOnly");
  }

  if (
    context.totals.gscClicks !== 0 ||
    context.totals.gscImpressions !== 0 ||
    context.totals.ga4Sessions !== 0 ||
    context.totals.ga4PageViews !== 0
  ) {
    errors.push("Aggregate totals must remain zero for placeholder scaffold");
  }

  if (context.totals.itemCount !== context.itemMetrics.length) {
    errors.push("Totals itemCount must match per-item metrics length");
  }

  const unsafe = findUnsafePerformanceClaimsInManualMetrics(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe performance claims: ${unsafe.join(", ")}`);
  }

  const roundTrip = parsePurivaManualMetricsEmbed(serializePurivaManualMetricsNotes(context));
  if (!roundTrip || roundTrip.itemMetrics.length !== context.itemMetrics.length) {
    errors.push("Manual metrics notes serialization round-trip failed");
  }

  return { ok: errors.length === 0, errors };
}
