import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeMonthlyReportArticleUrl,
  validateMonthlyReportMetricRow
} from "./monthly-report-metrics-validation";

describe("monthly-report-metrics-validation", () => {
  it("G174: accepts valid non-negative clicks/impressions with CTR and position ranges", () => {
    const result = validateMonthlyReportMetricRow({
      source: "CSV_IMPORT",
      clicks: 10,
      impressions: 100,
      ctr: 0.1,
      position: 4.5,
      articleUrl: "https://example.com/article"
    });

    assert.equal(result.ok, true, result.errors.join("; "));
    assert.equal(result.normalized?.source, "CSV_IMPORT");
    assert.equal(result.normalized?.clicks, 10);
    assert.equal(result.normalized?.articleUrl, "https://example.com/article");
  });

  it("G174: rejects negative clicks/impressions and out-of-range CTR/position", () => {
    const negative = validateMonthlyReportMetricRow({
      source: "MANUAL",
      clicks: -1,
      impressions: 10
    });
    assert.equal(negative.ok, false);
    assert.ok(negative.errors.some((e) => /clicks must be non-negative/i.test(e)));

    const ctrHigh = validateMonthlyReportMetricRow({
      source: "GA4",
      clicks: 1,
      impressions: 10,
      ctr: 1.5
    });
    assert.equal(ctrHigh.ok, false);
    assert.ok(ctrHigh.errors.some((e) => /ctr must be between 0 and 1/i.test(e)));

    const positionLow = validateMonthlyReportMetricRow({
      source: "GSC",
      clicks: 1,
      impressions: 10,
      position: 0
    });
    assert.equal(positionLow.ok, false);
    assert.ok(positionLow.errors.some((e) => /position must be between 1 and 100/i.test(e)));
  });

  it("G174: requires source and sanitizes optional article URL", () => {
    const missingSource = validateMonthlyReportMetricRow({
      clicks: 0,
      impressions: 0
    });
    assert.equal(missingSource.ok, false);
    assert.ok(missingSource.errors.some((e) => /source is required/i.test(e)));

    const emptyUrl = sanitizeMonthlyReportArticleUrl("   ");
    assert.equal(emptyUrl.ok, true);
    assert.equal(emptyUrl.articleUrl, null);

    const badScheme = sanitizeMonthlyReportArticleUrl("javascript:alert(1)");
    assert.equal(badScheme.ok, false);

    const okUrl = sanitizeMonthlyReportArticleUrl("  https://puriva.example/path  ");
    assert.equal(okUrl.ok, true);
    assert.equal(okUrl.articleUrl, "https://puriva.example/path");
  });

  it("G278: expanded edge cases — NaN, infinite, unknown source, data/vbscript URLs", () => {
    const nanClicks = validateMonthlyReportMetricRow({
      source: "MANUAL",
      clicks: Number.NaN,
      impressions: 1
    });
    assert.equal(nanClicks.ok, false);

    const infImpressions = validateMonthlyReportMetricRow({
      source: "CSV_IMPORT",
      clicks: 1,
      impressions: Number.POSITIVE_INFINITY
    });
    assert.equal(infImpressions.ok, false);

    const unknownSource = validateMonthlyReportMetricRow({
      source: "LIVE_GOOGLE",
      clicks: 0,
      impressions: 0
    });
    assert.equal(unknownSource.ok, false);
    assert.ok(unknownSource.errors.some((e) => /source must be one of/i.test(e)));

    const ctrBoundary = validateMonthlyReportMetricRow({
      source: "PLACEHOLDER",
      clicks: 0,
      impressions: 0,
      ctr: 0
    });
    assert.equal(ctrBoundary.ok, true);

    const ctrOne = validateMonthlyReportMetricRow({
      source: "UNAVAILABLE",
      clicks: 0,
      impressions: 0,
      ctr: 1,
      position: 100
    });
    assert.equal(ctrOne.ok, true);

    const dataUrl = sanitizeMonthlyReportArticleUrl("data:text/html,hi");
    assert.equal(dataUrl.ok, false);
    const vbUrl = sanitizeMonthlyReportArticleUrl("vbscript:msgbox(1)");
    assert.equal(vbUrl.ok, false);

    const tooLong = sanitizeMonthlyReportArticleUrl(`https://example.com/${"a".repeat(2100)}`);
    assert.equal(tooLong.ok, false);
  });
});
