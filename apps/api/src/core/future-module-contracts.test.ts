/**
 * G601–G610 focused invariant tests for MI / Revenue Hub / POD shared contracts.
 * No live scrape / CRM / marketplace / image IO.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS,
  MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS,
  MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY,
  POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION,
  POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY,
  REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY,
  REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD,
  buildMarketIntelligenceAdminReviewedSourceSummary,
  buildMarketIntelligenceClientSafeSummary,
  buildMarketIntelligenceLocalResult,
  buildMarketIntelligenceSourceLabel,
  buildPodToolkitDraftBundle,
  buildPodToolkitPromptImageRequirement,
  buildRevenueHubAiRecommendation,
  buildRevenueHubOperatingContract,
  findForbiddenClientSafeMiFields,
  findMarketIntelligenceAdminReviewViolations,
  findMarketIntelligenceSourcePolicyViolations,
  findMarketIntelligenceUncontrolledScrapingViolations,
  findPodToolkitComplianceIpCautionViolations,
  findPodToolkitLiveImageViolations,
  findPodToolkitMarketplacePolicyViolations,
  findPodToolkitMarketplaceSyncViolations,
  findRevenueHubCrmLiveSyncViolations,
  findRevenueHubFinancialGuaranteeViolations,
  findRevenueHubNoLiveCrmPolicyViolations,
  findRevenueHubRecommendationGuardViolations,
  isMarketIntelligenceConfidenceLabel,
  mapOriginToSourceLabelKind,
  resolveMarketIntelligenceConfidenceLabel,
  runMarketIntelligenceLocalIngestPipeline,
  sanitizeMarketIntelligenceClientSafePayload,
  validateMarketIntelligenceSourceUrl
} from "@dca-os-v1/shared";

describe("G601 MI bounded source policy", () => {
  it("accepts the canonical no-live source policy", () => {
    const violations = findMarketIntelligenceSourcePolicyViolations(
      MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY as unknown as Record<string, unknown>
    );
    assert.deepEqual(violations, []);
    assert.equal(
      MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY.allowedOrigins.length,
      MARKET_INTELLIGENCE_ALLOWED_SOURCE_ORIGINS.length
    );
  });

  it("rejects non-bounded origins and live flags", () => {
    const violations = findMarketIntelligenceSourcePolicyViolations({
      liveCrawlingAllowed: true,
      marketplaceLiveLookupAllowed: false,
      crmLiveLookupAllowed: false,
      uncontrolledScrapingAllowed: false,
      allowedOrigins: ["operator_note", "live_scrape"]
    });
    assert.ok(violations.includes("liveCrawlingAllowed"));
    assert.ok(violations.some((v) => v.startsWith("allowedOrigins:")));
  });
});

describe("G602 MI no uncontrolled scraping invariant", () => {
  it("flags uncontrolled scraping and live crawl on unsafe policy", () => {
    const violations = findMarketIntelligenceUncontrolledScrapingViolations({
      liveCrawlingAllowed: true,
      marketplaceLiveLookupAllowed: false,
      crmLiveLookupAllowed: false,
      uncontrolledScrapingAllowed: true,
      allowedOrigins: ["operator_note", "web_crawl"]
    });
    assert.ok(violations.includes("uncontrolledScrapingAllowed"));
    assert.ok(violations.includes("liveCrawlingAllowed"));
    assert.ok(violations.some((v) => v.startsWith("allowedOrigins:")));
  });

  it("keeps builders with scraping disabled", () => {
    const local = buildMarketIntelligenceLocalResult({
      projectId: "mi_g602",
      sourceReferences: [],
      result: {
        summary: "local",
        competitors: null,
        audienceSignals: null,
        marketTrends: null,
        opportunities: null,
        threats: null,
        pricingSignals: null,
        contentOrSeoAngles: null,
        recommendedNextActions: null,
        sourceNotes: null,
        confidenceNotes: null
      }
    });
    assert.equal(local.sourcePolicy.uncontrolledScrapingAllowed, false);
    assert.equal(local.sourcePolicy.liveCrawlingAllowed, false);
  });
});

describe("G603 MI client-safe summary tests", () => {
  it("strips forbidden internals and builds admin-reviewed client-safe summary", () => {
    const unsafe: Record<string, unknown> = {
      title: "keep",
      marketSummary: "keep",
      opportunities: ["a"],
      recommendedActions: ["b"],
      status: "READY",
      tenantId: "leak",
      storageKey: "leak",
      executionLog: "leak",
      reviewerNotes: "leak",
      resultData: {},
      sourceUrl: "https://example.invalid",
      sourceNotes: "leak",
      confidenceNotes: "leak",
      provider: "leak",
      prompt: "leak",
      rawFindings: [],
      researchRunId: "leak",
      insightId: "leak"
    };

    const sanitized = sanitizeMarketIntelligenceClientSafePayload(unsafe);
    const forbidden = findForbiddenClientSafeMiFields(unsafe);
    assert.equal(forbidden.length, MARKET_INTELLIGENCE_CLIENT_SAFE_FORBIDDEN_FIELDS.length);
    assert.equal(sanitized.sanitized.tenantId, undefined);
    assert.equal(sanitized.wasSanitized, true);

    const summary = buildMarketIntelligenceClientSafeSummary({
      title: "Client-safe",
      marketSummary: "Reviewed",
      opportunities: ["one"],
      recommendedActions: ["two"],
      status: "READY"
    });
    assert.equal(summary.rawInternalsExposed, false);
    assert.equal(summary.adminReviewed, true);
    assert.equal(summary.sourceLabel.liveCrawlImplied, false);
  });
});

describe("G604 MI admin review required invariant", () => {
  it("requires operator/admin review flags on builders", () => {
    const local = buildMarketIntelligenceLocalResult({
      projectId: "mi_g604",
      sourceReferences: [],
      result: {
        summary: null,
        competitors: null,
        audienceSignals: null,
        marketTrends: null,
        opportunities: null,
        threats: null,
        pricingSignals: null,
        contentOrSeoAngles: null,
        recommendedNextActions: null,
        sourceNotes: null,
        confidenceNotes: null
      }
    });
    const admin = buildMarketIntelligenceAdminReviewedSourceSummary({
      projectId: "mi_g604",
      sources: [
        {
          id: "s1",
          title: "note",
          origin: "operator_note",
          label: buildMarketIntelligenceSourceLabel(mapOriginToSourceLabelKind("operator_note")),
          sourceUrl: null,
          notes: null
        }
      ]
    });
    const clientSafe = buildMarketIntelligenceClientSafeSummary({
      title: "t",
      marketSummary: null,
      opportunities: [],
      recommendedActions: [],
      status: "READY"
    });

    assert.deepEqual(
      findMarketIntelligenceAdminReviewViolations(local as unknown as Record<string, unknown>),
      []
    );
    assert.deepEqual(
      findMarketIntelligenceAdminReviewViolations(admin as unknown as Record<string, unknown>),
      []
    );
    assert.deepEqual(
      findMarketIntelligenceAdminReviewViolations(clientSafe as unknown as Record<string, unknown>),
      []
    );
    assert.ok(
      findMarketIntelligenceAdminReviewViolations({ operatorReviewRequired: false }).includes(
        "operatorReviewRequired"
      )
    );
    assert.ok(
      findMarketIntelligenceAdminReviewViolations({ adminReviewed: false }).includes("adminReviewed")
    );
  });
});

describe("G605 Revenue no financial guarantee tests", () => {
  it("keeps recommendations and opportunities without financial guarantees", () => {
    const recommendation = buildRevenueHubAiRecommendation({
      id: "rec_1",
      recordIds: ["r1"],
      actionType: "review_anomaly",
      summary: "Review only",
      rationale: "Advisory",
      confidence: "low"
    });
    assert.equal(recommendation.financialGuarantee, false);
    assert.equal(recommendation.guard.financialGuaranteeAllowed, false);
    assert.deepEqual(
      findRevenueHubFinancialGuaranteeViolations(
        recommendation as unknown as Record<string, unknown>
      ),
      []
    );
    assert.ok(
      findRevenueHubFinancialGuaranteeViolations({ financialGuarantee: true }).includes(
        "financialGuarantee"
      )
    );
  });
});

describe("G606 Revenue no CRM sync invariant", () => {
  it("forbids CRM live sync on default policy and operating contract", () => {
    assert.deepEqual(
      findRevenueHubNoLiveCrmPolicyViolations(
        REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY as unknown as Record<string, unknown>
      ),
      []
    );
    const operating = buildRevenueHubOperatingContract({
      tenantId: "t1",
      clientId: null,
      attributions: [
        {
          id: "a1",
          tenantId: "t1",
          clientId: null,
          leadId: null,
          opportunityId: null,
          channel: "manual_entry",
          campaignLabel: null,
          attributionNote: "manual",
          recordedAt: "2026-07-10T00:00:00.000Z",
          crmLiveSynced: false
        }
      ]
    });
    assert.equal(operating.policy.crmLiveSyncAllowed, false);
    assert.equal(operating.attributions[0]?.crmLiveSynced, false);
    assert.ok(
      findRevenueHubCrmLiveSyncViolations({ crmLiveSyncAllowed: true }).includes(
        "crmLiveSyncAllowed"
      )
    );
  });
});

describe("G607 Revenue recommendation guard tests", () => {
  it("accepts default guard and rejects payment/CRM/guarantee actions", () => {
    assert.deepEqual(
      findRevenueHubRecommendationGuardViolations(
        REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD as unknown as Record<string, unknown>
      ),
      []
    );
    const unsafe = findRevenueHubRecommendationGuardViolations({
      advisoryOnly: false,
      allowedActionTypes: ["execute_payment"],
      paymentExecutionAllowed: true,
      priceChangeAllowed: true,
      refundAllowed: true,
      externalSystemWriteAllowed: true,
      financialGuaranteeAllowed: true,
      crmLiveSyncAllowed: true,
      operatorApprovalRequired: false
    });
    assert.ok(unsafe.includes("paymentExecutionAllowed"));
    assert.ok(unsafe.includes("financialGuaranteeAllowed"));
    assert.ok(unsafe.includes("crmLiveSyncAllowed"));
    assert.ok(unsafe.includes("allowedActionTypes:execute_payment"));
  });
});

describe("G608 POD IP/compliance caution tests", () => {
  it("requires IP reviews and forbids legal-advice claims", () => {
    assert.deepEqual(
      findPodToolkitComplianceIpCautionViolations(
        POD_TOOLKIT_DEFAULT_COMPLIANCE_IP_CAUTION as unknown as Record<string, unknown>
      ),
      []
    );
    const unsafe = findPodToolkitComplianceIpCautionViolations({
      trademarkReviewRequired: false,
      copyrightReviewRequired: false,
      likenessConsentRequired: true,
      marketplacePolicyReviewRequired: true,
      legalAdviceClaimed: true,
      cautionSummary: "bad"
    });
    assert.ok(unsafe.includes("trademarkReviewRequired"));
    assert.ok(unsafe.includes("copyrightReviewRequired"));
    assert.ok(unsafe.includes("legalAdviceClaimed"));
  });
});

describe("G609 POD no marketplace sync invariant", () => {
  it("keeps marketplace sync disabled on policy and draft bundle", () => {
    assert.deepEqual(
      findPodToolkitMarketplacePolicyViolations(
        POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY as unknown as Record<string, unknown>
      ),
      []
    );
    const bundle = buildPodToolkitDraftBundle({
      projectId: "pod_1",
      tenantId: "t1",
      idea: {
        id: "idea_1",
        title: "Idea",
        conceptSummary: "Draft only",
        targetAudienceNote: null
      },
      promptImageRequirement: buildPodToolkitPromptImageRequirement({
        id: "p1",
        ideaId: "idea_1",
        promptText: "prompt",
        imageBrief: "brief"
      }),
      listingCopy: {
        id: "l1",
        ideaId: "idea_1",
        titleDraft: "title",
        descriptionDraft: "desc",
        bulletPoints: [],
        tags: []
      }
    });
    assert.equal(bundle.marketplaceSyncAllowed, false);
    assert.equal(bundle.policy.marketplaceSyncAllowed, false);
    assert.deepEqual(
      findPodToolkitMarketplaceSyncViolations(bundle as unknown as Record<string, unknown>),
      []
    );
    assert.ok(
      findPodToolkitMarketplaceSyncViolations({ marketplaceSyncAllowed: true }).includes(
        "marketplaceSyncAllowed"
      )
    );
  });
});

describe("G610 POD no live image invariant", () => {
  it("forbids live image generation on prompt requirements and draft bundles", () => {
    const prompt = buildPodToolkitPromptImageRequirement({
      id: "p2",
      ideaId: "idea_2",
      promptText: "prompt",
      imageBrief: "brief"
    });
    assert.equal(prompt.liveImageGenerationAllowed, false);
    assert.deepEqual(
      findPodToolkitLiveImageViolations(prompt as unknown as Record<string, unknown>),
      []
    );
    assert.ok(
      findPodToolkitLiveImageViolations({ liveImageGenerationAllowed: true }).includes(
        "liveImageGenerationAllowed"
      )
    );
  });
});

describe("G612 future module contract surface", () => {
  it("keeps MI / Revenue / POD no-live defaults aligned", () => {
    assert.equal(MARKET_INTELLIGENCE_DEFAULT_NO_LIVE_SOURCE_POLICY.uncontrolledScrapingAllowed, false);
    assert.equal(REVENUE_HUB_DEFAULT_RECOMMENDATION_GUARD.financialGuaranteeAllowed, false);
    assert.equal(REVENUE_HUB_DEFAULT_NO_LIVE_CRM_POLICY.crmLiveSyncAllowed, false);
    assert.equal(POD_TOOLKIT_DEFAULT_NO_LIVE_MARKETPLACE_POLICY.marketplaceSyncAllowed, false);
  });
});

describe("G613 MI local ingest → validate → dedupe → confidence labels", () => {
  it("validates source URL shape and blocks unsafe protocols", () => {
    assert.equal(validateMarketIntelligenceSourceUrl(null).ok, true);
    assert.equal(validateMarketIntelligenceSourceUrl("https://example.test/a/").ok, true);
    const blocked = validateMarketIntelligenceSourceUrl("javascript:alert(1)");
    assert.equal(blocked.ok, false);
    const missingUrl = validateMarketIntelligenceSourceUrl(null, "approved_url_reference");
    assert.equal(missingUrl.ok, false);
  });

  it("dedupes by normalized URL fingerprint and keeps structured confidence labels", () => {
    const pipeline = runMarketIntelligenceLocalIngestPipeline(
      [
        {
          origin: "approved_url_reference",
          title: "Competitor A",
          sourceUrl: "https://Example.TEST/path/"
        },
        {
          origin: "approved_url_reference",
          title: "Competitor A duplicate",
          sourceUrl: "https://example.test/path"
        },
        {
          origin: "operator_note",
          title: "Operator note",
          notes: "manual observation"
        },
        {
          origin: "approved_url_reference",
          title: "Missing URL",
          sourceUrl: ""
        }
      ],
      {
        "url:https://example.test/path": "medium"
      }
    );

    assert.equal(pipeline.liveCrawlingAllowed, false);
    assert.equal(pipeline.operatorReviewRequired, true);
    assert.equal(pipeline.ok, false);
    assert.equal(pipeline.rejected.length, 1);
    assert.equal(pipeline.deduped.unique.length, 2);
    assert.equal(pipeline.deduped.droppedCount, 1);
    assert.equal(pipeline.confidenceReviews[0]?.review.label, "medium");
    assert.equal(pipeline.confidenceReviews[0]?.review.freeTextOnly, false);
    assert.equal(pipeline.confidenceReviews[1]?.review.label, "unreviewed");
    assert.equal(resolveMarketIntelligenceConfidenceLabel("not-a-label"), "unreviewed");
    assert.equal(isMarketIntelligenceConfidenceLabel("high"), true);
    assert.equal(isMarketIntelligenceConfidenceLabel("pretty sure"), false);
  });
});
