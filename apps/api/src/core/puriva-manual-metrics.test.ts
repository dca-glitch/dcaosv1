import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPurivaSeoPlanContext } from "./puriva-seo-plan";
import {
  buildPurivaClientSafeManualMetricsDisclaimer,
  buildPurivaManualMetricsClientSafeSummary,
  buildPurivaManualMetricsContext,
  buildPurivaManualMetricsImportRequest,
  consumePurivaApprovedManualMetricsSnapshot,
  findUnsafePerformanceClaimsInManualMetrics,
  manualMetricsSnapshotHasPurivaMarker,
  parsePurivaManualMetricsEmbed,
  PURIVA_MANUAL_METRICS_MARKER,
  PURIVA_MANUAL_METRICS_VERSION,
  serializePurivaManualMetricsNotes,
  validatePurivaManualMetricsContext
} from "./puriva-manual-metrics";

describe("puriva-manual-metrics", () => {
  const targetMonth = "2026-07";

  it("builds per-page placeholder metrics for each planned SEO item", () => {
    const seoPlan = buildPurivaSeoPlanContext(targetMonth);
    const context = buildPurivaManualMetricsContext(targetMonth, seoPlan);

    assert.equal(context.version, PURIVA_MANUAL_METRICS_VERSION);
    assert.equal(context.itemMetrics.length, seoPlan.items.length);
    for (const item of seoPlan.items) {
      const entry = context.itemMetrics.find((metric) => metric.seoPlanItemId === item.id);
      assert.ok(entry);
      assert.equal(entry.measurementStatus, "placeholder_not_measured");
      assert.equal(entry.gscClicks, 0);
      assert.equal(entry.ga4Sessions, 0);
    }
  });

  it("keeps deterministic zero totals and manual source metadata", () => {
    const context = buildPurivaManualMetricsContext(targetMonth);

    assert.equal(context.sourceType, "MANUAL");
    assert.equal(context.importStatus, "IMPORTED");
    assert.equal(context.totals.placeholderOnly, true);
    assert.equal(context.totals.gscClicks, 0);
    assert.equal(context.totals.ga4Sessions, 0);
    assert.equal(context.totals.itemCount, context.itemMetrics.length);
  });

  it("serializes and parses manual metrics embed in snapshot notes", () => {
    const context = buildPurivaManualMetricsContext(targetMonth);
    const notes = serializePurivaManualMetricsNotes(context);

    assert.ok(manualMetricsSnapshotHasPurivaMarker(notes));
    const parsed = parsePurivaManualMetricsEmbed(notes);
    assert.ok(parsed);
    assert.equal(parsed.itemMetrics.length, context.itemMetrics.length);
  });

  it("builds API import request with placeholder notes", () => {
    const request = buildPurivaManualMetricsImportRequest(targetMonth);

    assert.equal(request.sourceType, "MANUAL");
    assert.equal(request.status, "IMPORTED");
    assert.equal(request.gscClicks, 0);
    assert.ok(request.notes.includes(PURIVA_MANUAL_METRICS_MARKER));
    assert.ok(request.notes.includes("placeholder"));
  });

  it("consumes only approved manual snapshots for client-safe summary", () => {
    const context = buildPurivaManualMetricsContext(targetMonth);
    const notes = serializePurivaManualMetricsNotes(context);

    const rejected = consumePurivaApprovedManualMetricsSnapshot({
      id: "snap-1",
      targetMonth,
      sourceType: "MANUAL",
      status: "IMPORTED",
      notes
    });
    assert.equal(rejected, null);

    const approved = consumePurivaApprovedManualMetricsSnapshot({
      id: "snap-1",
      targetMonth,
      sourceType: "MANUAL",
      status: "APPROVED",
      notes
    });
    assert.ok(approved?.clientSafeSummary);
    assert.equal(approved.clientSafeSummary.placeholderOnly, true);
    assert.ok(approved.clientSafeSummary.disclaimer.includes("placeholder"));
  });

  it("avoids real-performance claims in client-facing disclaimer copy", () => {
    const context = buildPurivaManualMetricsContext(targetMonth);
    const validation = validatePurivaManualMetricsContext(context);
    const unsafe = findUnsafePerformanceClaimsInManualMetrics(context);
    const disclaimer = buildPurivaClientSafeManualMetricsDisclaimer(context);
    const summary = buildPurivaManualMetricsClientSafeSummary(context);

    assert.equal(unsafe.length, 0);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(disclaimer.includes("placeholder"));
    assert.ok(summary.disclaimer.includes("Awaiting real GA/GSC"));
  });
});
