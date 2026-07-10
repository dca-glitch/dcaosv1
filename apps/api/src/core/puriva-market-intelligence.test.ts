import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPurivaMarketIntelligenceContext,
  buildPurivaMiAdminSourceLabels,
  buildPurivaMiClientSafeSummary,
  buildPurivaWorkflowBriefFoundationInput,
  findForbiddenPurivaMiClientSafeFields,
  findUnsafeApprovedPhrasesInMarketIntelligence,
  isPurivaMarketIntelligenceBriefAttachment,
  PURIVA_MARKET_INTELLIGENCE_VERSION,
  PURIVA_MI_SOURCE_LABEL,
  validatePurivaMarketIntelligenceContext,
  workflowBriefFoundationMatches
} from "./puriva-market-intelligence";
import { PURIVA_REQUIRED_SERVICE_CATEGORY_IDS, PURIVA_SERVICE_TAXONOMY_VERSION } from "./puriva-service-taxonomy";

describe("puriva-market-intelligence", () => {
  it("represents all taxonomy service categories and audience segments", () => {
    const context = buildPurivaMarketIntelligenceContext();

    assert.equal(context.version, PURIVA_MARKET_INTELLIGENCE_VERSION);
    assert.equal(context.serviceCategorySummaries.length, PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.length);

    for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
      assert.ok(context.serviceCategorySummaries.some((summary) => summary.categoryId === requiredId));
      assert.ok(context.searchIntentMapping.some((entry) => entry.serviceCategoryId === requiredId));
    }

    assert.ok(context.audienceSegments.some((segment) => segment.id === "local_clients"));
    assert.ok(context.audienceSegments.some((segment) => segment.id === "international_medical_tourists"));
  });

  it("attaches compliance flags and annotations to service summaries", () => {
    const context = buildPurivaMarketIntelligenceContext();
    const wegovy = context.serviceCategorySummaries.find(
      (summary) => summary.categoryId === "wegovy_semaglutide_weight_management"
    );

    assert.ok(wegovy?.complianceFlags.includes("prescription_medication_risk"));
    assert.ok(wegovy?.complianceFlags.includes("medical_claim_risk"));
    assert.ok(context.complianceAnnotations.length > 0);
    assert.ok(context.serviceCategorySummaries.every((summary) => summary.complianceAssessment.action));
  });

  it("requires verification for hospital partner and license style claims", () => {
    const context = buildPurivaMarketIntelligenceContext();

    assert.ok(
      context.verificationRequiredNotes.some((note) =>
        /hospital|accreditation|partner|credential/i.test(note) && /requir(e|es) verification/i.test(note)
      )
    );
    assert.ok(
      context.contentGapCategories.some((gap) => /verification/i.test(gap.description) || /credential/i.test(gap.label))
    );
  });

  it("avoids unsafe medical claims as approved conclusions", () => {
    const context = buildPurivaMarketIntelligenceContext();
    const validation = validatePurivaMarketIntelligenceContext(context);
    const unsafe = findUnsafeApprovedPhrasesInMarketIntelligence(context);

    assert.equal(unsafe.length, 0);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(!context.serviceCategorySummaries.some((summary) => /cure|guaranteed results|permanent result/i.test(summary.researchSummary)));
  });

  it("builds workflow brief foundation input with reusable taxonomy and MI attachment", () => {
    const foundation = buildPurivaWorkflowBriefFoundationInput();

    assert.equal(foundation.version, PURIVA_SERVICE_TAXONOMY_VERSION);
    assert.equal(foundation.kind, "puriva_service_taxonomy");
    assert.equal(isPurivaMarketIntelligenceBriefAttachment(foundation.marketIntelligence), true);
    assert.equal(workflowBriefFoundationMatches(foundation), true);
  });

  it("builds idempotent workflow brief foundation attachment shape", () => {
    const first = buildPurivaWorkflowBriefFoundationInput();
    const second = buildPurivaWorkflowBriefFoundationInput();
    const mi = buildPurivaMarketIntelligenceContext();

    assert.equal(workflowBriefFoundationMatches(first), true);
    assert.equal(workflowBriefFoundationMatches(second), true);
    assert.equal(isPurivaMarketIntelligenceBriefAttachment(first.marketIntelligence), true);
    assert.equal(mi.serviceCategorySummaries.length, PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.length);
  });

  it("labels admin sources as operator-reviewed placeholders without live-crawl implication", () => {
    const labels = buildPurivaMiAdminSourceLabels();

    assert.ok(labels.length >= 1);
    for (const entry of labels) {
      assert.equal(entry.label.kind, "operator_reviewed_placeholder");
      assert.equal(entry.label.liveCrawlImplied, false);
      assert.equal(entry.label.marketplaceLookupImplied, false);
      assert.equal(entry.label.displayLabel, PURIVA_MI_SOURCE_LABEL.displayLabel);
      assert.ok(entry.sourceUrl.includes("example.com"));
    }
  });

  it("builds client-safe MI summary without forbidden internal fields", () => {
    const summary = buildPurivaMiClientSafeSummary();
    const asRecord = summary as unknown as Record<string, unknown>;
    const forbidden = findForbiddenPurivaMiClientSafeFields({
      ...asRecord,
      tenantId: "leak",
      sourceUrl: "https://example.invalid",
      competitorPlaceholders: []
    });

    assert.equal(summary.adminReviewed, true);
    assert.equal(summary.rawInternalsExposed, false);
    assert.equal(summary.liveCrawlImplied, false);
    assert.equal(summary.sourceLabel.liveCrawlImplied, false);
    assert.ok(forbidden.includes("tenantId"));
    assert.ok(forbidden.includes("sourceUrl"));
    assert.ok(forbidden.includes("competitorPlaceholders"));
    assert.equal(findForbiddenPurivaMiClientSafeFields(asRecord).length, 0);
  });

  it("keeps admin-reviewed source labels free of marketplace lookup claims", () => {
    const labels = buildPurivaMiAdminSourceLabels();
    const clientSafe = buildPurivaMiClientSafeSummary({
      title: "Bounded Puriva summary",
      opportunities: ["Educational positioning only"],
      recommendedActions: ["Admin review before client exposure"]
    });

    assert.equal(clientSafe.adminReviewed, true);
    assert.equal(clientSafe.sourceLabel.marketplaceLookupImplied, false);
    assert.ok(labels.every((entry) => entry.label.marketplaceLookupImplied === false));
    assert.ok(labels.every((entry) => entry.label.liveCrawlImplied === false));
  });
});
