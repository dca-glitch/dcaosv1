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
    assert.match(disabled.adminLabel, /withdrawn/i);

    const missing = resolveMonthlyReportUnavailableState({
      metricsSource: { sourceType: "GA4", gaGscReadinessStatus: "missing_config" }
    });
    assert.equal(missing.unavailable, true);
    assert.equal(missing.reason, "ga_gsc_missing_config");
    assert.match(missing.adminLabel, /withdrawn/i);
  });

  it("G283: withdrawn GA/GSC and mixed unproven", () => {
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
    assert.match(notProven.adminLabel, /withdrawn/i);

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

  it("G283: former live-proof inputs remain unavailable after GA/GSC withdrawal", () => {
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
    assert.equal(live.unavailable, true);
    assert.equal(live.truth, "unavailable");
    assert.equal(live.clientMayUseLiveLanguage, false);
    assert.match(live.adminLabel, /withdrawn/i);
  });

  it("G536: empty/unavailable state — snapshot_unapproved and empty metrics never use live language", () => {
    const unapproved = resolveMonthlyReportUnavailableState({
      reportStatus: "ADMIN_REVIEW",
      metricsSource: {
        sourceType: "GA4",
        status: "APPROVED",
        gaGscReadinessStatus: "configured_shape_ok",
        liveProofApproved: true
      }
    });
    assert.equal(unapproved.unavailable, true);
    assert.equal(unapproved.clientMayUseLiveLanguage, false);
    assert.equal(unapproved.reason, "snapshot_unapproved");

    const snapshotGate = resolveMonthlyReportUnavailableState({
      reportStatus: "DRAFT",
      metricsSource: {
        sourceType: "GA4",
        status: "IMPORTED",
        gaGscReadinessStatus: "configured_shape_ok"
      }
    });
    assert.equal(snapshotGate.unavailable, true);
    assert.equal(snapshotGate.reason, "snapshot_unapproved");
    assert.equal(snapshotGate.clientLabel, "Metrics unavailable");
    assert.equal(snapshotGate.clientMayUseLiveLanguage, false);
    assert.equal(snapshotGate.mayExposeToClient, false);

    const emptyFinal = resolveMonthlyReportUnavailableState({
      reportStatus: "FINAL",
      metricsSource: null
    });
    assert.equal(emptyFinal.unavailable, true);
    assert.equal(emptyFinal.reason, "missing_source");
    assert.equal(emptyFinal.mayExposeToClient, true);
    assert.equal(emptyFinal.clientMayUseLiveLanguage, false);
    assert.match(emptyFinal.adminLabel, /no source type/i);

    const blockedPeriod = resolveMonthlyReportUnavailableState({
      dateRangeStatus: "blocked_current_month",
      reportStatus: "FINAL",
      metricsSource: {}
    });
    assert.equal(blockedPeriod.reason, "future_or_blocked_period");
    assert.equal(blockedPeriod.clientLabel, "Metrics unavailable");
  });
});
