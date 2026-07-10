import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessGaGscMetricsUnavailableState,
  metricsSourceTruthLabelCatalog,
  serializeMonthlyMetricsSourceTruth,
  toClientMonthlyMetricsSourceTruthView
} from "./metrics-source-truth";

describe("metrics-source-truth", () => {
  it("G276: serializes all source truth kinds without client internal leakage", () => {
    const cases: Array<{
      input: Parameters<typeof serializeMonthlyMetricsSourceTruth>[0];
      truth: string;
      mayLive: boolean;
    }> = [
      { input: { sourceType: "MANUAL" }, truth: "placeholder", mayLive: false },
      {
        input: { sourceType: "MANUAL", placeholderOnly: false },
        truth: "manual",
        mayLive: false
      },
      { input: { sourceType: "CSV_IMPORT" }, truth: "csv", mayLive: false },
      {
        input: {
          sourceType: "HYBRID",
          status: "APPROVED",
          gaGscReadinessStatus: "configured_shape_ok",
          liveProofApproved: true
        },
        truth: "live",
        mayLive: true
      },
      { input: {}, truth: "unavailable", mayLive: false },
      {
        input: {
          sourceType: "GA4",
          status: "APPROVED",
          gaGscReadinessStatus: "configured_shape_ok"
        },
        truth: "unavailable",
        mayLive: false
      }
    ];

    for (const entry of cases) {
      const serialized = serializeMonthlyMetricsSourceTruth(entry.input);
      assert.equal(serialized.truth, entry.truth);
      assert.equal(serialized.client.mayUseLiveLanguage, entry.mayLive);
      const clientView = toClientMonthlyMetricsSourceTruthView(serialized);
      assert.equal(clientView.mayUseLiveLanguage, entry.mayLive);
      assert.equal("gaGscReadinessStatus" in clientView, false);
      assert.equal("liveProofApproved" in clientView, false);
      assert.equal("internal" in clientView, false);
      const clientJson = JSON.stringify(clientView);
      assert.equal(clientJson.includes("liveProofApproved"), false);
      assert.equal(clientJson.includes("gaGscReadinessStatus"), false);
    }
  });

  it("G277: mixed-source live and unavailable labels stay truthful", () => {
    const liveMixed = serializeMonthlyMetricsSourceTruth({
      sourceType: "HYBRID",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      liveProofApproved: true,
      mixedSources: true
    });
    assert.equal(liveMixed.truth, "live");
    assert.equal(liveMixed.admin.mixedSources, true);
    assert.match(liveMixed.admin.label, /mixed/i);
    assert.equal(liveMixed.client.mayUseLiveLanguage, true);
    assert.match(liveMixed.client.label, /connected analytics/i);

    const unprovenMixed = serializeMonthlyMetricsSourceTruth({
      sourceType: "GA4",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      mixedSources: true
    });
    assert.equal(unprovenMixed.truth, "unavailable");
    assert.equal(unprovenMixed.admin.mixedSources, true);
    assert.match(unprovenMixed.admin.label, /mixed/i);
    assert.equal(unprovenMixed.client.mayUseLiveLanguage, false);
    assert.equal(unprovenMixed.client.label, "Metrics unavailable");
  });

  it("G276: client live language blocked for placeholder and csv", () => {
    const placeholder = serializeMonthlyMetricsSourceTruth({ sourceType: "MANUAL" });
    assert.equal(placeholder.truth, "placeholder");
    assert.equal(placeholder.client.mayUseLiveLanguage, false);
    assert.match(placeholder.client.label, /Placeholder/i);

    const csv = serializeMonthlyMetricsSourceTruth({ sourceType: "CSV_IMPORT" });
    assert.equal(csv.truth, "csv");
    assert.equal(csv.client.mayUseLiveLanguage, false);
    assert.equal(csv.client.label.includes("live"), false);
  });

  it("G523: label catalog matches serializer examples and blocks live language except live", () => {
    const catalog = metricsSourceTruthLabelCatalog();
    assert.equal(catalog.csv.clientMayUseLiveLanguage, false);
    assert.equal(catalog.live.clientMayUseLiveLanguage, true);
    assert.equal(catalog.unavailable.clientExample, "Metrics unavailable");

    const live = serializeMonthlyMetricsSourceTruth({
      sourceType: "HYBRID",
      status: "APPROVED",
      gaGscReadinessStatus: "configured_shape_ok",
      liveProofApproved: true
    });
    assert.equal(live.admin.label, catalog.live.adminExample);
    assert.equal(live.client.label, catalog.live.clientExample);
  });

  it("G524: assessGaGscMetricsUnavailableState reasons without Lane 6 collision", () => {
    const available = assessGaGscMetricsUnavailableState({
      metricsSource: { sourceType: "CSV_IMPORT" }
    });
    assert.equal(available.unavailable, false);
    assert.equal(available.truth, "csv");
    assert.equal(available.liveOAuthDeferred, true);

    const disabled = assessGaGscMetricsUnavailableState({
      metricsSource: {
        sourceType: "GA4",
        gaGscReadinessStatus: "disabled"
      }
    });
    assert.equal(disabled.unavailable, true);
    assert.equal(disabled.reason, "ga_gsc_disabled");
    assert.equal(disabled.clientMayUseLiveLanguage, false);

    const period = assessGaGscMetricsUnavailableState({
      metricsSource: {},
      dateRangeStatus: "future_month"
    });
    assert.equal(period.reason, "period_blocked");

    const missing = assessGaGscMetricsUnavailableState({ metricsSource: {} });
    assert.equal(missing.reason, "missing_source");
  });
});
