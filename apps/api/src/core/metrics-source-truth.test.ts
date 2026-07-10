import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
});
