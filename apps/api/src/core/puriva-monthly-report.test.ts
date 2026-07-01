import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPurivaMonthlyReportAdminSummaryNotes,
  buildPurivaMonthlyReportClientRecommendationsText,
  buildPurivaMonthlyReportClientSafeSummary,
  buildPurivaMonthlyReportContext,
  buildPurivaMonthlyReportMetricsFixture,
  findUnsafeApprovedPhrasesInMonthlyReport,
  monthlyReportHasPurivaMarker,
  monthlyReportMetricsHasPurivaMarker,
  PURIVA_MONTHLY_REPORT_MARKER,
  PURIVA_MONTHLY_REPORT_VERSION,
  purivaMonthlyReportTitle,
  validatePurivaMonthlyReportContext
} from "./puriva-monthly-report";

describe("puriva-monthly-report", () => {
  const targetMonth = "2026-07";

  it("aggregates delivery status from SEO, content, and image scaffolds", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);

    assert.equal(context.version, PURIVA_MONTHLY_REPORT_VERSION);
    assert.equal(context.targetMonth, targetMonth);
    assert.ok(context.deliveryStatus.plannedSeoItemCount >= 6);
    assert.equal(
      context.deliveryStatus.draftScaffoldCount,
      context.deliveryStatus.plannedSeoItemCount
    );
    assert.equal(
      context.deliveryStatus.imagePackageCount,
      context.deliveryStatus.draftScaffoldCount
    );
    assert.ok(context.deliveryStatus.imageConceptCount > 0);
  });

  it("includes medical review and verification blockers", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);

    assert.ok(context.deliveryStatus.medicalReviewBlockerCount > 0);
    assert.ok(context.deliveryStatus.verificationBlockerCount > 0);
    assert.ok(context.deliveryStatus.medicalReviewBlockers.length > 0);
    assert.ok(context.deliveryStatus.verificationBlockers.length > 0);
    assert.ok(
      context.deliveryStatus.verificationBlockers.some((entry) => entry.source === "seo_plan")
    );
  });

  it("describes foundation release state without implying finalized delivery", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);

    assert.ok(
      ["foundation_scaffold_only", "awaiting_medical_review", "awaiting_verification"].includes(
        context.deliveryStatus.finalReleaseState
      )
    );
    assert.ok(
      context.deliveryStatus.releaseStateNotes.some((note) => /not finalized|blocked|hidden/i.test(note))
    );
  });

  it("builds compliance-safe next-month recommendations from templates", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);
    const validation = validatePurivaMonthlyReportContext(context);
    const unsafe = findUnsafeApprovedPhrasesInMonthlyReport(context);

    assert.equal(unsafe.length, 0);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(context.nextMonthRecommendations.length >= 3);
    assert.ok(
      context.nextMonthRecommendations.some((entry) => /medical review/i.test(entry.recommendation))
    );
    assert.ok(
      context.nextMonthRecommendations.some((entry) => entry.verificationRequired)
    );
  });

  it("keeps admin summary internal and client recommendations free of scaffold labels", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);
    const adminNotes = buildPurivaMonthlyReportAdminSummaryNotes(context);
    const clientSummary = buildPurivaMonthlyReportClientSafeSummary(context);
    const clientText = buildPurivaMonthlyReportClientRecommendationsText(context);

    assert.ok(adminNotes.includes(PURIVA_MONTHLY_REPORT_MARKER));
    assert.ok(adminNotes.includes("Admin-only scaffold context"));
    assert.ok(!clientText.includes("INTERNAL ADMIN IMAGE PROMPT"));
    assert.ok(!clientText.includes("INTERNAL DRAFT SCAFFOLD"));
    assert.ok(!clientText.includes("structuredInputJson"));
    assert.ok(clientSummary.recommendationsText.includes("not approved treatment advice"));
  });

  it("builds placeholder metrics fixture with marker and zero live claims", () => {
    const fixture = buildPurivaMonthlyReportMetricsFixture(targetMonth);

    assert.equal(fixture.sourceType, "MANUAL");
    assert.equal(fixture.gscClicks, 0);
    assert.ok(fixture.notes.includes("PURIVA_MANUAL_METRICS_V1"));
    assert.ok(/placeholder|manual/i.test(fixture.notes));
  });

  it("includes manual metrics context aligned to SEO plan items", () => {
    const context = buildPurivaMonthlyReportContext(targetMonth);

    assert.equal(context.manualMetrics.itemMetrics.length, context.deliveryStatus.plannedSeoItemCount);
    assert.equal(context.manualMetrics.totals.placeholderOnly, true);
  });

  it("detects Puriva monthly report marker for idempotent setup", () => {
    const title = purivaMonthlyReportTitle(targetMonth);

    assert.ok(monthlyReportHasPurivaMarker({ title }));
    assert.ok(title.includes(PURIVA_MONTHLY_REPORT_MARKER));
  });
});
