import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLIENT_OPERATING_PACK_CONFIGS,
  CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG,
  CLIENT_OPERATING_PACK_SAAS_READINESS,
  CLIENT_OPERATING_PACKS_VERSION,
  filterClientVisiblePackSurfaces,
  getClientVisiblePackModuleKeys,
  isClientVisiblePackSurface,
  PURIVA_COMPLIANCE_PROFILE_V1,
  PURIVA_MODULE_ENTITLEMENTS,
  PURIVA_OPERATING_PACK_V1,
  PURIVA_WORKFLOW_TEMPLATE_CATALOG,
  validatePurivaComplianceProfile,
  type ClientOperatingPackModuleKey
} from "@dca-os-v1/shared";

const EXPECTED_MODULE_KEYS: readonly ClientOperatingPackModuleKey[] = [
  "core",
  "ai-workflow",
  "ai-seo",
  "monthly-reports",
  "client-portal",
  "wordpress-draft",
  "image-generation",
  "ga-gsc",
  "notifications",
  "market-intelligence",
  "revenue-hub",
  "pod-toolkit",
  "finance-lite"
];

const EXPECTED_WORKFLOW_KEYS = [
  "puriva_seo_article_v1",
  "puriva_image_set_v1",
  "puriva_wordpress_draft_v1",
  "puriva_monthly_report_flow_v1",
  "puriva_market_intelligence_v1",
  "puriva_revenue_insight_v1",
  "puriva_pod_listing_v1",
  "puriva_article_image_package_v1"
] as const;

describe("client-operating-packs", () => {
  it("publishes Puriva compliance profile constants", () => {
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.profileKey, "puriva_compliance_profile_v1");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.packKey, "puriva");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.clientDomain, "puriva.id");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.medicalContent, true);
    assert.deepEqual([...PURIVA_COMPLIANCE_PROFILE_V1.contentChannels], ["website", "social"]);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.paidAdsScope, "future_out_of_scope");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.requiredHumanReview, true);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.adminReviewRequired, true);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.clientApprovalRequiredForArticleAndImages, true);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.finalReportClientApprovalRequired, false);
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.riskClasses.includes("prescription_weight_management"));
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.riskClasses.includes("stem_cell_therapy"));
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.requiredBoundaries.some((boundary) => /cannot weaken compliance/i.test(boundary)));
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.requiredBoundaries.some((boundary) => /paid ads/i.test(boundary)));
  });

  it("validates Puriva compliance profile (G211)", () => {
    const valid = validatePurivaComplianceProfile(PURIVA_COMPLIANCE_PROFILE_V1);
    assert.equal(valid.ok, true);
    assert.deepEqual(valid.errors, []);

    const invalid = validatePurivaComplianceProfile({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      medicalContent: false,
      adminReviewRequired: false,
      contentChannels: ["website"],
      paidAdsScope: "future_out_of_scope",
      requiredBoundaries: ["Content stays educational and consultative."]
    } as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1);
    assert.equal(invalid.ok, false);
    assert.ok(invalid.errors.some((error) => /medicalContent/i.test(error)));
    assert.ok(invalid.errors.some((error) => /admin review/i.test(error)));
    assert.ok(invalid.errors.some((error) => /contentChannels/i.test(error)));
    assert.ok(invalid.errors.some((error) => /paid ads/i.test(error)));
  });

  it("maps Puriva module entitlement matrix without enforcing them (G209/G210)", () => {
    const entitlements = CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG.puriva;
    assert.equal(entitlements, PURIVA_MODULE_ENTITLEMENTS);
    assert.deepEqual(
      entitlements.map((entry) => entry.moduleKey),
      [...EXPECTED_MODULE_KEYS]
    );

    const byModule = new Map(entitlements.map((entry) => [entry.moduleKey, entry]));

    assert.equal(byModule.get("core")?.status, "enabled");
    assert.equal(byModule.get("ai-workflow")?.status, "enabled");
    assert.equal(byModule.get("ai-seo")?.status, "enabled");
    assert.equal(byModule.get("monthly-reports")?.status, "partial");
    assert.equal(byModule.get("client-portal")?.status, "enabled");
    assert.equal(byModule.get("wordpress-draft")?.status, "partial");
    assert.equal(byModule.get("image-generation")?.status, "partial");
    assert.equal(byModule.get("ga-gsc")?.status, "future");
    assert.equal(byModule.get("notifications")?.status, "future");
    assert.equal(byModule.get("market-intelligence")?.status, "enabled");
    assert.equal(byModule.get("revenue-hub")?.status, "future");
    assert.equal(byModule.get("pod-toolkit")?.status, "future");
    assert.equal(byModule.get("finance-lite")?.status, "enabled");

    assert.equal(byModule.get("ai-workflow")?.requiredForLaunch, true);
    assert.equal(byModule.get("monthly-reports")?.requiredForLaunch, true);
    assert.equal(byModule.get("ga-gsc")?.requiredForLaunch, true);
    assert.equal(byModule.get("revenue-hub")?.requiredForLaunch, false);
    assert.equal(byModule.get("finance-lite")?.requiredForLaunch, false);
    assert.equal(typeof byModule.get("client-portal")?.notes, "string");
  });

  it("guards client-visible pack surfaces to entitled active modules (G213)", () => {
    assert.equal(
      isClientVisiblePackSurface({ status: "enabled", clientVisibleSurface: true }),
      true
    );
    assert.equal(
      isClientVisiblePackSurface({ status: "partial", clientVisibleSurface: true }),
      true
    );
    assert.equal(
      isClientVisiblePackSurface({ status: "future", clientVisibleSurface: true }),
      false
    );
    assert.equal(
      isClientVisiblePackSurface({ status: "enabled", clientVisibleSurface: false }),
      false
    );

    const visible = filterClientVisiblePackSurfaces(PURIVA_MODULE_ENTITLEMENTS);
    const visibleKeys = getClientVisiblePackModuleKeys("puriva");
    assert.deepEqual(
      visible.map((entry) => entry.moduleKey),
      visibleKeys
    );
    assert.ok(visibleKeys.includes("client-portal"));
    assert.ok(visibleKeys.includes("monthly-reports"));
    assert.ok(visibleKeys.includes("image-generation"));
    assert.equal(visibleKeys.includes("ga-gsc"), false);
    assert.equal(visibleKeys.includes("notifications"), false);
    assert.equal(visibleKeys.includes("finance-lite"), false);
    assert.equal(visibleKeys.includes("revenue-hub"), false);
    assert.equal(visibleKeys.includes("core"), false);
  });

  it("catalogs workflow templates without execution hooks (G212)", () => {
    assert.deepEqual(
      PURIVA_WORKFLOW_TEMPLATE_CATALOG.map((template) => template.templateKey),
      [...EXPECTED_WORKFLOW_KEYS]
    );

    for (const template of PURIVA_WORKFLOW_TEMPLATE_CATALOG) {
      assert.equal(template.status, "catalog_only");
      assert.equal(template.executionEnabled, false);
      assert.equal(template.liveProviderCalls, false);
      assert.equal(template.executionAdapter, null);
      assert.ok(template.steps.length > 0);
      assert.deepEqual(
        template.steps.map((step) => step.order),
        [...template.steps].sort((left, right) => left.order - right.order).map((step) => step.order)
      );
    }

    const seoArticle = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_seo_article_v1"
    );
    assert.ok(seoArticle?.steps.some((step) => step.key === "client_article_approval" && step.clientVisible));

    const imageSet = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_image_set_v1"
    );
    assert.ok(imageSet?.rules.some((rule) => /paid ads/i.test(rule)));

    const wordpressDraft = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_wordpress_draft_v1"
    );
    assert.ok(wordpressDraft?.rules.some((rule) => /Live WordPress publish/i.test(rule)));

    const monthlyReport = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_monthly_report_flow_v1"
    );
    assert.ok(monthlyReport?.rules.some((rule) => /final report only/i.test(rule)));
    const monthlyReportSteps: readonly { actor: string; approvalGate: boolean }[] = monthlyReport?.steps ?? [];
    assert.equal(monthlyReportSteps.some((step) => step.actor === "client" && step.approvalGate), false);

    const mi = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_market_intelligence_v1"
    );
    assert.ok(mi);

    const revenue = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_revenue_insight_v1"
    );
    assert.ok(revenue?.rules.some((rule) => /future/i.test(rule)));

    const pod = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_pod_listing_v1"
    );
    assert.ok(pod);

    const articleImage = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_article_image_package_v1"
    );
    assert.ok(articleImage?.steps.some((step) => step.key === "client_article_approval" && step.clientVisible));
    assert.ok(articleImage?.rules.some((rule) => /Reject reason required/i.test(rule)));
  });

  it("assembles Puriva as first pack config with saas-later truth (G209/G214)", () => {
    assert.equal(PURIVA_OPERATING_PACK_V1.version, CLIENT_OPERATING_PACKS_VERSION);
    assert.equal(PURIVA_OPERATING_PACK_V1.packKey, "puriva");
    assert.equal(PURIVA_OPERATING_PACK_V1.firstPackProof, true);
    assert.equal(PURIVA_OPERATING_PACK_V1.coreForkAllowed, false);
    assert.equal(PURIVA_OPERATING_PACK_V1.status, "launch_blocked");
    assert.equal(PURIVA_OPERATING_PACK_V1.saasReadiness, CLIENT_OPERATING_PACK_SAAS_READINESS);
    assert.equal(CLIENT_OPERATING_PACK_SAAS_READINESS.label, "saas_later");
    assert.equal(CLIENT_OPERATING_PACK_SAAS_READINESS.agencyOsFirst, true);
    assert.equal(CLIENT_OPERATING_PACK_SAAS_READINESS.multiTenantSaasReady, false);
    assert.equal(CLIENT_OPERATING_PACK_CONFIGS.puriva, PURIVA_OPERATING_PACK_V1);

    const complianceCheck = validatePurivaComplianceProfile(PURIVA_OPERATING_PACK_V1.complianceProfile);
    assert.equal(complianceCheck.ok, true);
  });
});
