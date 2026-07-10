import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMonthlyReportUnavailableState } from "./monthly-report-metrics-unavailable-state";

describe("monthly-report-metrics-unavailable-state", () => {
  it("G283: missing source → unavailable with client-safe label", () => {
    const state = resolveMonthlyReportUnavailableState({});
    assert.equal(state.unavailable, true);
    assert.equal(state.truth, "unavailable");
    assert.equal(state.reason, "missing_source");
    assert.equal(state.clientLabel, "Metrics unavailable");
    assert.equal(state.clientMayUseLiveLanguage, false);
  });

  it("G283: disabled / missing_config readiness reasons", () => {
    const disabled = resolveMonthlyReportUnavailableState({
      metricsSource: { sourceType: "GA4", gaGscReadinessStatus: "disabled" }
    });
    assert.equal(disabled.unavailable, true);
    assert.equal(disabled.reason, "ga_gsc_disabled");

    const missing = resolveMonthlyReportUnavailableState({
      metricsSource: { sourceType: "GA4", gaGscReadinessStatus: "missing_config" }
    });
    assert.equal(missing.unavailable, true);
    assert.equal(missing.reason, "ga_gsc_missing_config");
  });

  it("G283: not live-proven and mixed unproven", () => {
    const notProven = resolveMonthlyReportUnavailableState({
      metricsSource: {
        sourceType: "HYBRID",
        status: "APPROVED",
        gaGscReadinessStatus: "configured_shape_ok"
      }
    });
    assert.equal(notProven.unavailable, true);
    assert.equal(notProven.reason, "not_live_proven");
    assert.equal(notProven.clientMayUseLiveLanguage, false);

    const mixed = resolveMonthlyReportUnavailableState({
      metricsSource: {
        sourceType: "GA4",
        status: "APPROVED",
        gaGscReadinessStatus: "configured_shape_ok",
        mixedSources: true
      }
    });
    assert.equal(mixed.unavailable, true);
    assert.equal(mixed.reason, "mixed_unproven");
  });

  it("G283: future/blocked period and FINAL-only client exposure flag", () => {
    const future = resolveMonthlyReportUnavailableState({
      dateRangeStatus: "future_month",
      metricsSource: {}
    });
    assert.equal(future.reason, "future_or_blocked_period");
    assert.equal(future.mayExposeToClient, false);

    const finalNotice = resolveMonthlyReportUnavailableState({
      reportStatus: "FINAL",
      metricsSource: {}
    });
    assert.equal(finalNotice.mayExposeToClient, true);

    const draft = resolveMonthlyReportUnavailableState({
      reportStatus: "DRAFT",
      metricsSource: {}
    });
    assert.equal(draft.mayExposeToClient, false);
  });

  it("G283: live proven metrics are not unavailable", () => {
    const live = resolveMonthlyReportUnavailableState({
      metricsSource: {
        sourceType: "HYBRID",
        status: "APPROVED",
        gaGscReadinessStatus: "configured_shape_ok",
        liveProofApproved: true
      },
      reportStatus: "FINAL",
      approvedSnapshotId: "snap-1"
    });
    assert.equal(live.unavailable, false);
    assert.equal(live.truth, "live");
    assert.equal(live.reason, null);
    assert.equal(live.clientMayUseLiveLanguage, true);
  });
});
