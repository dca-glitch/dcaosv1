import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyAiMaterialPolicy, classifyMaterialExclusion } from "./ai-material-policy.guard";

describe("ai-material-policy.guard", () => {
  it("blocks forbidden medical data for all roles", () => {
    const decision = classifyMaterialExclusion("forbidden_medical_data", "research_agent");
    assert.equal(decision.included, false);
    assert.match(decision.exclusionReason ?? "", /forbidden/i);
  });

  it("excludes SaaS/billing data by default", () => {
    const decision = classifyMaterialExclusion("saas_user_account_billing_data", "content_drafting_agent");
    assert.equal(decision.included, false);
  });

  it("allows public research for content drafting", () => {
    const decision = classifyMaterialExclusion("public_research", "content_drafting_agent");
    assert.equal(decision.included, true);
  });

  it("blocks before/after for non-vision roles", () => {
    const decision = classifyMaterialExclusion("before_after_asset", "image_generation_agent");
    assert.equal(decision.included, false);
  });

  it("allows before/after only for vision technical QA", () => {
    const decision = classifyMaterialExclusion("before_after_asset", "vision_technical_qa_agent");
    assert.equal(decision.included, true);
  });

  it("policy blocks workflow when medical data present", () => {
    const result = applyAiMaterialPolicy("seo_planning_agent", [
      {
        materialClass: "forbidden_medical_data",
        referenceId: "m1",
        label: "Patient chart",
        included: true,
        exclusionReason: null
      }
    ]);
    assert.equal(result.policyDecision.allowed, false);
    assert.equal(result.excludedMaterials.length, 1);
  });
});
