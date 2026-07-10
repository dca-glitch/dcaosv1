import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLIENT_OPERATING_PACK_CONFIGS,
  CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG,
  CLIENT_OPERATING_PACKS_VERSION,
  PURIVA_COMPLIANCE_PROFILE_V1,
  PURIVA_OPERATING_PACK_V1,
  PURIVA_WORKFLOW_TEMPLATE_CATALOG
} from "@dca-os-v1/shared";

describe("client-operating-packs", () => {
  it("publishes Puriva compliance profile constants", () => {
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.profileKey, "puriva_compliance_profile_v1");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.packKey, "puriva");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.clientDomain, "puriva.id");
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.requiredHumanReview, true);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.clientApprovalRequiredForArticleAndImages, true);
    assert.equal(PURIVA_COMPLIANCE_PROFILE_V1.finalReportClientApprovalRequired, false);
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.riskClasses.includes("prescription_weight_management"));
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.riskClasses.includes("stem_cell_therapy"));
    assert.ok(PURIVA_COMPLIANCE_PROFILE_V1.requiredBoundaries.some((boundary) => /cannot weaken compliance/i.test(boundary)));
  });

  it("maps Puriva module entitlements without enforcing them", () => {
    const entitlements = CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG.puriva;
    const byModule = new Map(entitlements.map((entry) => [entry.moduleKey, entry]));

    assert.equal(byModule.get("core")?.status, "enabled");
    assert.equal(byModule.get("ai-delivery")?.requiredForLaunch, true);
    assert.equal(byModule.get("market-intelligence")?.requiredForLaunch, true);
    assert.equal(byModule.get("client-portal")?.requiredForLaunch, true);
    assert.equal(byModule.get("finance-lite")?.requiredForLaunch, false);
    assert.equal(typeof byModule.get("client-portal")?.notes, "string");
  });

  it("catalogs workflow templates without execution hooks", () => {
    assert.equal(PURIVA_WORKFLOW_TEMPLATE_CATALOG.length, 2);

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

    const articleImage = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_article_image_package_v1"
    );
    assert.ok(articleImage?.steps.some((step) => step.key === "client_article_approval" && step.clientVisible));
    assert.ok(articleImage?.rules.some((rule) => /Reject reason required/i.test(rule)));

    const monthlyReport = PURIVA_WORKFLOW_TEMPLATE_CATALOG.find(
      (template) => template.templateKey === "puriva_monthly_report_flow_v1"
    );
    assert.ok(monthlyReport?.rules.some((rule) => /final report only/i.test(rule)));
    const monthlyReportSteps: readonly { actor: string; approvalGate: boolean }[] = monthlyReport?.steps ?? [];
    assert.equal(monthlyReportSteps.some((step) => step.actor === "client" && step.approvalGate), false);
  });

  it("assembles Puriva as first pack config, not a Core fork", () => {
    assert.equal(PURIVA_OPERATING_PACK_V1.version, CLIENT_OPERATING_PACKS_VERSION);
    assert.equal(PURIVA_OPERATING_PACK_V1.packKey, "puriva");
    assert.equal(PURIVA_OPERATING_PACK_V1.firstPackProof, true);
    assert.equal(PURIVA_OPERATING_PACK_V1.coreForkAllowed, false);
    assert.equal(PURIVA_OPERATING_PACK_V1.status, "launch_blocked");
    assert.equal(CLIENT_OPERATING_PACK_CONFIGS.puriva, PURIVA_OPERATING_PACK_V1);
  });
});
