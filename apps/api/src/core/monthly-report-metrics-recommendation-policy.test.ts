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
});
