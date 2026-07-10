import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMonthlyReportRecommendationPolicy } from "./monthly-report-metrics-recommendation-policy";

describe("monthly-report-metrics-recommendation-policy", () => {
  it("G175: accepts metrics-based recommendations only with approved metrics truth", () => {
    const rejected = resolveMonthlyReportRecommendationPolicy({
      origin: "metrics_based",
      text: "Prioritize pages with rising impressions.",
      metricsTruth: "placeholder"
    });
    assert.equal(rejected.ok, false);

    const ok = resolveMonthlyReportRecommendationPolicy({
      origin: "metrics_based",
      text: "Prioritize pages with rising impressions.",
      metricsTruth: "csv"
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.requiresAdminReview, true);
    assert.equal(ok.liveAiBlocked, true);
  });

  it("G175: accepts manual admin-authored recommendations", () => {
    const missingFlag = resolveMonthlyReportRecommendationPolicy({
      origin: "manual_admin",
      text: "Keep medical review gate before publication."
    });
    assert.equal(missingFlag.ok, false);

    const ok = resolveMonthlyReportRecommendationPolicy({
      origin: "manual_admin",
      text: "Keep medical review gate before publication.",
      adminAuthored: true
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.clientSafe, true);
    assert.match(ok.adminLabel, /manual admin/i);
  });

  it("G175: AI-drafted requires draft flag and never allows live AI", () => {
    const noFlag = resolveMonthlyReportRecommendationPolicy({
      origin: "ai_drafted",
      text: "Draft narrative for admin review."
    });
    assert.equal(noFlag.ok, false);

    const liveBlocked = resolveMonthlyReportRecommendationPolicy({
      origin: "ai_drafted",
      text: "Draft narrative for admin review.",
      aiDraftAllowed: true,
      liveAiExecuted: true
    });
    assert.equal(liveBlocked.ok, false);
    assert.ok(liveBlocked.errors.some((e) => /live AI execution is not allowed/i.test(e)));

    const draftOk = resolveMonthlyReportRecommendationPolicy({
      origin: "ai_drafted",
      text: "Draft narrative for admin review.",
      aiDraftAllowed: true,
      liveAiExecuted: false
    });
    assert.equal(draftOk.ok, true);
    assert.equal(draftOk.liveAiBlocked, true);
    assert.match(draftOk.adminLabel, /no live AI/i);
  });

  it("G175: placeholder origin is allowed for local scaffold", () => {
    const ok = resolveMonthlyReportRecommendationPolicy({
      origin: "placeholder",
      text: "Continue foundation planning for next month."
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.origin, "placeholder");
  });

  it("G279: rejects missing origin/text; live truth allowed for metrics-based", () => {
    const missing = resolveMonthlyReportRecommendationPolicy({});
    assert.equal(missing.ok, false);
    assert.ok(missing.errors.some((e) => /origin is required/i.test(e)));
    assert.ok(missing.errors.some((e) => /text is required/i.test(e)));
    assert.equal(missing.clientLabel, "Recommendation unavailable");
    assert.equal(missing.liveAiBlocked, true);

    const liveMetrics = resolveMonthlyReportRecommendationPolicy({
      origin: "metrics_based",
      text: "Focus on pages with rising impressions after live proof.",
      metricsTruth: "live"
    });
    assert.equal(liveMetrics.ok, true);
    assert.equal(liveMetrics.requiresAdminReview, true);
    assert.equal(liveMetrics.liveAiBlocked, true);

    const unavailableMetrics = resolveMonthlyReportRecommendationPolicy({
      origin: "metrics_based",
      text: "Should fail.",
      metricsTruth: "unavailable"
    });
    assert.equal(unavailableMetrics.ok, false);

    const unknownOrigin = resolveMonthlyReportRecommendationPolicy({
      origin: "chatgpt_live",
      text: "Nope"
    });
    assert.equal(unknownOrigin.ok, false);
  });

  it("G533: recommendation source policy matrix — origins, review, live-AI block", () => {
    const matrix: Array<{
      origin: string;
      extra?: Record<string, unknown>;
      expectOk: boolean;
      expectReview?: boolean;
      expectClientSafe?: boolean;
    }> = [
      {
        origin: "metrics_based",
        extra: { metricsTruth: "manual" },
        expectOk: true,
        expectReview: true,
        expectClientSafe: true
      },
      {
        origin: "metrics_based",
        extra: { metricsTruth: "csv" },
        expectOk: true,
        expectReview: true,
        expectClientSafe: true
      },
      {
        origin: "metrics_based",
        extra: { metricsTruth: "placeholder" },
        expectOk: false
      },
      {
        origin: "manual_admin",
        extra: { adminAuthored: true },
        expectOk: true,
        expectReview: false,
        expectClientSafe: true
      },
      {
        origin: "ai_drafted",
        extra: { aiDraftAllowed: true, liveAiExecuted: false },
        expectOk: true,
        expectReview: true,
        expectClientSafe: false
      },
      {
        origin: "placeholder",
        expectOk: true,
        expectReview: false,
        expectClientSafe: true
      }
    ];

    for (const row of matrix) {
      const result = resolveMonthlyReportRecommendationPolicy({
        origin: row.origin,
        text: "Recommendation body for policy matrix.",
        ...(row.extra as object)
      });
      assert.equal(result.ok, row.expectOk, `${row.origin} ok mismatch: ${result.errors.join("; ")}`);
      assert.equal(result.liveAiBlocked, true);
      if (row.expectOk) {
        assert.equal(result.requiresAdminReview, row.expectReview);
        assert.equal(result.clientSafe, row.expectClientSafe);
      }
    }

    const liveAiAlwaysBlocked = resolveMonthlyReportRecommendationPolicy({
      origin: "manual_admin",
      text: "Should reject live AI flag.",
      adminAuthored: true,
      liveAiExecuted: true
    });
    assert.equal(liveAiAlwaysBlocked.ok, false);
    assert.ok(liveAiAlwaysBlocked.errors.some((e) => /live AI execution is not allowed/i.test(e)));
  });
});
