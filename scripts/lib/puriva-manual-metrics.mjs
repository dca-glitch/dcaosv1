import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPurivaSeoPlanContext } from "./puriva-seo-plan.mjs";

const manualMetricsJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-manual-metrics.json"
);

export const PURIVA_MANUAL_METRICS_VERSION = "PURIVA_MANUAL_METRICS_V1";
export const PURIVA_MANUAL_METRICS_KIND = "puriva_manual_metrics_seed";
export const PURIVA_MANUAL_METRICS_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_MANUAL_METRICS_V1";

let cachedSeed = null;

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

export function getPurivaManualMetricsSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(manualMetricsJsonPath, "utf8"));
  }
  return cachedSeed;
}

function buildItemPlaceholder(item, perItemNote) {
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

function buildTotals(itemCount) {
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

export function buildPurivaManualMetricsContext(targetMonth, seoPlan = buildPurivaSeoPlanContext(targetMonth)) {
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

export function serializePurivaManualMetricsNotes(context) {
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

export function parsePurivaManualMetricsEmbed(notes) {
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
    const parsed = JSON.parse(jsonLine);
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

export function buildPurivaManualMetricsImportRequest(targetMonth, seoPlan) {
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

export function buildPurivaClientSafeManualMetricsDisclaimer(context = buildPurivaManualMetricsContext("2026-01")) {
  return `${context.placeholderDisclaimer} ${context.awaitingAnalyticsNote}`;
}

export function buildPurivaManualMetricsClientSafeSummary(context) {
  return {
    targetMonth: context.targetMonth,
    sourceType: "MANUAL",
    placeholderOnly: true,
    itemCount: context.itemMetrics.length,
    disclaimer: buildPurivaClientSafeManualMetricsDisclaimer(context),
    totals: context.totals
  };
}

export function consumePurivaApprovedManualMetricsSnapshot(snapshot) {
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

function collectClientFacingManualMetricsText(context) {
  return [
    context.placeholderDisclaimer,
    context.awaitingAnalyticsNote,
    ...context.verificationRequiredNotes,
    buildPurivaClientSafeManualMetricsDisclaimer(context)
  ].join("\n");
}

export function findUnsafePerformanceClaimsInManualMetrics(context = buildPurivaManualMetricsContext("2026-01")) {
  const haystack = collectClientFacingManualMetricsText(context).toLowerCase();
  return UNSAFE_PERFORMANCE_PHRASES.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function manualMetricsSnapshotHasPurivaMarker(notes) {
  return typeof notes === "string" && notes.includes(PURIVA_MANUAL_METRICS_MARKER);
}

export function validatePurivaManualMetricsContext(context = buildPurivaManualMetricsContext("2026-01"), seoPlan = buildPurivaSeoPlanContext(context.targetMonth)) {
  const errors = [];

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
