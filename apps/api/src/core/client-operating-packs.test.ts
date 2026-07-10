import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertPurivaAdminReviewRequired,
  assertPurivaPaidAdsOutOfScope,
  assertPurivaWebsiteSocialOnlyScope,
  CLIENT_OPERATING_PACK_CONFIGS,
  CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG,
  CLIENT_OPERATING_PACK_SAAS_READINESS,
  CLIENT_OPERATING_PACKS_VERSION,
  filterClientVisiblePackSurfaces,
  getClientOperatingPackConfig,
  getClientVisiblePackModuleKeys,
  getLaunchRequiredPackModuleKeys,
  getPackModuleEntitlement,
  getPackModuleEntitlementStatus,
  getPackModuleVisibility,
  getPurivaAllowedContentChannels,
  getPurivaWorkflowTemplate,
  isClientVisiblePackSurface,
  isPackModuleEntitledActive,
  isPurivaAdminReviewRequired,
  isPurivaPaidAdsOutOfScope,
  isPurivaWebsiteSocialOnlyScope,
  isPurivaWorkflowTemplateCatalogOnly,
  listAdminOnlyPackModuleKeys,
  listClientOperatingPackKeys,
  listPackModuleEntitlementKeys,
  listPurivaCatalogOnlyWorkflowTemplates,
  listPurivaWorkflowTemplateKeys,
  PURIVA_COMPLIANCE_PROFILE_V1,
  PURIVA_MODULE_ENTITLEMENTS,
  PURIVA_OPERATING_PACK_V1,
  PURIVA_PRIMARY_WORKFLOW_TEMPLATE_KEYS,
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
  "puriva_feedback_learning_v1",
  "puriva_article_image_package_v1"
] as const;

const EXPECTED_LAUNCH_REQUIRED_KEYS: readonly ClientOperatingPackModuleKey[] = [
  "core",
  "ai-workflow",
  "ai-seo",
  "monthly-reports",
  "client-portal",
  "wordpress-draft",
  "image-generation",
  "ga-gsc",
  "notifications",
  "market-intelligence"
];

const EXPECTED_CLIENT_VISIBLE_KEYS: readonly ClientOperatingPackModuleKey[] = [
  "monthly-reports",
  "client-portal",
  "image-generation"
];

describe("client-operating-packs", () => {
  it("G349: publishes pack config constants and lookup helpers", () => {
    assert.equal(CLIENT_OPERATING_PACKS_VERSION, "CLIENT_OPERATING_PACKS_V1");
    assert.deepEqual(listClientOperatingPackKeys(), ["puriva"]);
    assert.equal(getClientOperatingPackConfig("puriva"), PURIVA_OPERATING_PACK_V1);
    assert.equal(CLIENT_OPERATING_PACK_CONFIGS.puriva, PURIVA_OPERATING_PACK_V1);
    assert.equal(PURIVA_OPERATING_PACK_V1.firstPackProof, true);
    assert.equal(PURIVA_OPERATING_PACK_V1.coreForkAllowed, false);
    assert.equal(PURIVA_OPERATING_PACK_V1.status, "launch_blocked");
  });

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

  it("G352/G591: validates Puriva compliance profile (medical, channels, paid ads, admin review)", () => {
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

    const paidAdsEnabled = validatePurivaComplianceProfile({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      paidAdsScope: "enabled" as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1.paidAdsScope
    });
    assert.equal(paidAdsEnabled.ok, false);
    assert.ok(paidAdsEnabled.errors.some((error) => /paidAdsScope/i.test(error)));

    const wrongProfileKey = validatePurivaComplianceProfile({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      profileKey: "other_profile" as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1.profileKey
    });
    assert.equal(wrongProfileKey.ok, false);
    assert.ok(wrongProfileKey.errors.some((error) => /profileKey/i.test(error)));

    const missingMedicalRisk = validatePurivaComplianceProfile({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      riskClasses: ["before_after_results"] as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1.riskClasses
    });
    assert.equal(missingMedicalRisk.ok, false);
    assert.ok(missingMedicalRisk.errors.some((error) => /medical_aesthetic_claims/i.test(error)));
  });

  it("G350/G351/G589: maps Puriva module entitlement matrix without enforcing them", () => {
    const entitlements = CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG.puriva;
    assert.equal(entitlements, PURIVA_MODULE_ENTITLEMENTS);
    assert.deepEqual(
      entitlements.map((entry) => entry.moduleKey),
      [...EXPECTED_MODULE_KEYS]
    );
    assert.deepEqual(listPackModuleEntitlementKeys("puriva"), [...EXPECTED_MODULE_KEYS]);

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

    assert.deepEqual(getLaunchRequiredPackModuleKeys("puriva"), [...EXPECTED_LAUNCH_REQUIRED_KEYS]);
    assert.equal(getLaunchRequiredPackModuleKeys("puriva").includes("revenue-hub"), false);
    assert.equal(getLaunchRequiredPackModuleKeys("puriva").includes("pod-toolkit"), false);
    assert.equal(getLaunchRequiredPackModuleKeys("puriva").includes("finance-lite"), false);

    assert.equal(getPackModuleEntitlement("puriva", "client-portal")?.status, "enabled");
    assert.equal(getPackModuleEntitlementStatus("puriva", "ga-gsc"), "future");
    assert.equal(getPackModuleEntitlementStatus("puriva", "monthly-reports"), "partial");
    assert.equal(isPackModuleEntitledActive("puriva", "ai-seo"), true);
    assert.equal(isPackModuleEntitledActive("puriva", "wordpress-draft"), true);
    assert.equal(isPackModuleEntitledActive("puriva", "ga-gsc"), false);
    assert.equal(isPackModuleEntitledActive("puriva", "revenue-hub"), false);
    assert.equal(getPackModuleEntitlement("puriva", "core")?.clientVisibleSurface, false);
    assert.equal(getPackModuleEntitlement("puriva", "image-generation")?.clientVisibleSurface, true);
  });

  it("G351/G590: guards client-visible pack surfaces to entitled active modules", () => {
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
      isClientVisiblePackSurface({ status: "disabled", clientVisibleSurface: true }),
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
    assert.deepEqual(visibleKeys, [...EXPECTED_CLIENT_VISIBLE_KEYS]);
    assert.equal(visibleKeys.includes("ga-gsc"), false);
    assert.equal(visibleKeys.includes("notifications"), false);
    assert.equal(visibleKeys.includes("finance-lite"), false);
    assert.equal(visibleKeys.includes("revenue-hub"), false);
    assert.equal(visibleKeys.includes("core"), false);

    const portalVisibility = getPackModuleVisibility("puriva", "client-portal");
    assert.deepEqual(portalVisibility, { entitledActive: true, clientVisible: true });
    const gaVisibility = getPackModuleVisibility("puriva", "ga-gsc");
    assert.deepEqual(gaVisibility, { entitledActive: false, clientVisible: false });
    const financeVisibility = getPackModuleVisibility("puriva", "finance-lite");
    assert.deepEqual(financeVisibility, { entitledActive: true, clientVisible: false });

    const adminOnly = listAdminOnlyPackModuleKeys("puriva");
    assert.equal(adminOnly.includes("client-portal"), false);
    assert.equal(adminOnly.includes("monthly-reports"), false);
    assert.equal(adminOnly.includes("image-generation"), false);
    assert.ok(adminOnly.includes("core"));
    assert.ok(adminOnly.includes("ai-workflow"));
    assert.ok(adminOnly.includes("finance-lite"));
    assert.equal(adminOnly.length + visibleKeys.length, EXPECTED_MODULE_KEYS.length);
  });

  it("G353/G354/G592-G594: website/social allowed; paid ads out of scope; admin review required", () => {
    assert.deepEqual([...getPurivaAllowedContentChannels()], ["website", "social"]);
    assert.equal(isPurivaWebsiteSocialOnlyScope(), true);
    assert.equal(isPurivaPaidAdsOutOfScope(), true);
    assert.equal(isPurivaAdminReviewRequired(), true);
    assert.equal(PURIVA_OPERATING_PACK_V1.complianceProfile.paidAdsScope, "future_out_of_scope");
    assert.equal(PURIVA_OPERATING_PACK_V1.complianceProfile.adminReviewRequired, true);

    const channelsOk = assertPurivaWebsiteSocialOnlyScope();
    assert.equal(channelsOk.ok, true);
    assert.deepEqual(channelsOk.errors, []);

    const channelsBad = assertPurivaWebsiteSocialOnlyScope({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      contentChannels: ["website"] as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1.contentChannels
    });
    assert.equal(channelsBad.ok, false);
    assert.ok(channelsBad.errors.some((error) => /website and social/i.test(error)));

    const paidAdsOk = assertPurivaPaidAdsOutOfScope();
    assert.equal(paidAdsOk.ok, true);
    const paidAdsBad = assertPurivaPaidAdsOutOfScope({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      paidAdsScope: "enabled" as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1.paidAdsScope,
      requiredBoundaries: ["Content stays educational and consultative."]
    });
    assert.equal(paidAdsBad.ok, false);
    assert.ok(paidAdsBad.errors.some((error) => /paidAdsScope/i.test(error)));
    assert.ok(paidAdsBad.errors.some((error) => /paid ads/i.test(error)));

    const adminOk = assertPurivaAdminReviewRequired();
    assert.equal(adminOk.ok, true);
    const adminBad = assertPurivaAdminReviewRequired({
      ...PURIVA_COMPLIANCE_PROFILE_V1,
      medicalContent: false,
      adminReviewRequired: false,
      requiredHumanReview: false
    } as unknown as typeof PURIVA_COMPLIANCE_PROFILE_V1);
    assert.equal(adminBad.ok, false);
    assert.ok(adminBad.errors.some((error) => /medicalContent/i.test(error)));
    assert.ok(adminBad.errors.some((error) => /admin review/i.test(error)));
  });

  it("G355-G359/G595: catalogs workflow templates without execution hooks", () => {
    assert.deepEqual(
      PURIVA_WORKFLOW_TEMPLATE_CATALOG.map((template) => template.templateKey),
      [...EXPECTED_WORKFLOW_KEYS]
    );
    assert.deepEqual(listPurivaWorkflowTemplateKeys(), [...EXPECTED_WORKFLOW_KEYS]);
    assert.deepEqual([...PURIVA_PRIMARY_WORKFLOW_TEMPLATE_KEYS], [
      "puriva_seo_article_v1",
      "puriva_image_set_v1",
      "puriva_wordpress_draft_v1",
      "puriva_monthly_report_flow_v1"
    ]);

    for (const template of PURIVA_WORKFLOW_TEMPLATE_CATALOG) {
      assert.equal(template.status, "catalog_only");
      assert.equal(template.executionEnabled, false);
      assert.equal(template.liveProviderCalls, false);
      assert.equal(template.executionAdapter, null);
      assert.equal(isPurivaWorkflowTemplateCatalogOnly(template), true);
      assert.ok(template.steps.length > 0);
      assert.deepEqual(
        template.steps.map((step) => step.order),
        [...template.steps].sort((left, right) => left.order - right.order).map((step) => step.order)
      );
    }

    assert.equal(listPurivaCatalogOnlyWorkflowTemplates().length, PURIVA_WORKFLOW_TEMPLATE_CATALOG.length);

    for (const key of PURIVA_PRIMARY_WORKFLOW_TEMPLATE_KEYS) {
      const template = getPurivaWorkflowTemplate(key);
      assert.ok(template, `missing primary template ${key}`);
      assert.equal(template.executionEnabled, false);
      assert.equal(template.liveProviderCalls, false);
    }

    const seoArticle = getPurivaWorkflowTemplate("puriva_seo_article_v1");
    assert.ok(seoArticle?.steps.some((step) => step.key === "client_article_approval" && step.clientVisible));
    assert.ok(seoArticle?.steps.some((step) => step.key === "admin_article_review" && step.approvalGate));

    const imageSet = getPurivaWorkflowTemplate("puriva_image_set_v1");
    assert.ok(imageSet?.rules.some((rule) => /paid ads/i.test(rule)));
    assert.ok(imageSet?.steps.some((step) => step.key === "admin_image_review" && step.approvalGate));

    const wordpressDraft = getPurivaWorkflowTemplate("puriva_wordpress_draft_v1");
    assert.ok(wordpressDraft?.rules.some((rule) => /Live WordPress publish/i.test(rule)));
    assert.ok(
      wordpressDraft?.steps.some((step) => step.key === "admin_final_package_approval" && step.approvalGate)
    );

    const monthlyReport = getPurivaWorkflowTemplate("puriva_monthly_report_flow_v1");
    assert.ok(monthlyReport?.rules.some((rule) => /final report only/i.test(rule)));
    const monthlyReportSteps: readonly { actor: string; approvalGate: boolean }[] = monthlyReport?.steps ?? [];
    assert.equal(monthlyReportSteps.some((step) => step.actor === "client" && step.approvalGate), false);

    const mi = getPurivaWorkflowTemplate("puriva_market_intelligence_v1");
    assert.ok(mi);

    const revenue = getPurivaWorkflowTemplate("puriva_revenue_insight_v1");
    assert.ok(revenue?.rules.some((rule) => /future/i.test(rule)));

    const pod = getPurivaWorkflowTemplate("puriva_pod_listing_v1");
    assert.ok(pod);

    const feedbackLearning = getPurivaWorkflowTemplate("puriva_feedback_learning_v1");
    assert.ok(feedbackLearning);
    assert.equal(feedbackLearning?.executionEnabled, false);
    assert.ok(feedbackLearning?.rules.some((rule) => /admin-only/i.test(rule)));
    assert.ok(feedbackLearning?.rules.some((rule) => /cannot be weakened/i.test(rule)));
    assert.ok(
      feedbackLearning?.steps.some((step) => step.key === "admin_learning_note_review" && step.approvalGate)
    );
    assert.equal(feedbackLearning?.steps.some((step) => step.clientVisible), false);

    const articleImage = getPurivaWorkflowTemplate("puriva_article_image_package_v1");
    assert.ok(articleImage?.steps.some((step) => step.key === "client_article_approval" && step.clientVisible));
    assert.ok(articleImage?.rules.some((rule) => /Reject reason required/i.test(rule)));
  });

  it("G360/G598: assembles Puriva as first pack config with saas-later truth", () => {
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
    assert.match(CLIENT_OPERATING_PACK_SAAS_READINESS.notes, /agency delivery/i);
    assert.match(CLIENT_OPERATING_PACK_SAAS_READINESS.notes, /do not claim SaaS/i);

    const complianceCheck = validatePurivaComplianceProfile(PURIVA_OPERATING_PACK_V1.complianceProfile);
    assert.equal(complianceCheck.ok, true);
  });
});
