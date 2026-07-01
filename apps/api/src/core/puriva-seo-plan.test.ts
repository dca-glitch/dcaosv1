import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PURIVA_HIGH_RISK_CATEGORY_IDS, PURIVA_REQUIRED_SERVICE_CATEGORY_IDS } from "./puriva-service-taxonomy";
import {
  buildPurivaSeoPlanContext,
  buildPurivaWorkflowBriefPlanningInput,
  findUnsafeApprovedPhrasesInSeoPlan,
  isPurivaSeoPlanBriefAttachment,
  PURIVA_SEO_PLAN_VERSION,
  validatePurivaSeoPlanContext,
  workflowBriefPlanningMatches
} from "./puriva-seo-plan";

describe("puriva-seo-plan", () => {
  const targetMonth = "2026-07";

  it("represents all taxonomy service categories and audience segments", () => {
    const context = buildPurivaSeoPlanContext(targetMonth);

    assert.equal(context.version, PURIVA_SEO_PLAN_VERSION);
    assert.equal(context.targetMonth, targetMonth);

    const categoryIds = new Set(context.items.map((item) => item.serviceCategoryId));
    for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
      assert.ok(categoryIds.has(requiredId));
    }

    const audienceIds = new Set(context.items.flatMap((item) => item.audienceSegments));
    assert.ok(audienceIds.has("local_clients"));
    assert.ok(audienceIds.has("international_medical_tourists"));
  });

  it("requires search intent, content type, and priority on every item", () => {
    const context = buildPurivaSeoPlanContext(targetMonth);

    for (const item of context.items) {
      assert.ok(item.searchIntent);
      assert.ok(item.contentType);
      assert.ok(item.priority);
      assert.ok(item.stage);
      assert.ok(item.targetKeyword);
    }
  });

  it("flags high-risk topics for medical review with compliance annotations", () => {
    const context = buildPurivaSeoPlanContext(targetMonth);

    for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
      const items = context.items.filter((item) => item.serviceCategoryId === highRiskId);
      assert.ok(items.length > 0);
      for (const item of items) {
        assert.equal(item.medicalReviewRequired, true);
        assert.ok(item.complianceFlags.length > 0);
        assert.ok(item.complianceAssessment.action);
      }
    }
  });

  it("requires verification for hospital partner and license style planning topics", () => {
    const context = buildPurivaSeoPlanContext(targetMonth);

    assert.ok(
      context.items.some(
        (item) => item.verificationRequired && /trust|license|verification/i.test(item.title + item.planningObjective)
      )
    );
    assert.ok(context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note)));
  });

  it("avoids unsafe medical claims as approved planning conclusions", () => {
    const context = buildPurivaSeoPlanContext(targetMonth);
    const validation = validatePurivaSeoPlanContext(context);
    const unsafe = findUnsafeApprovedPhrasesInSeoPlan(context);

    assert.equal(unsafe.length, 0);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(!context.items.some((item) => /cure|guaranteed results|permanent result/i.test(item.planningObjective)));
  });

  it("builds reusable workflow brief planning input idempotently", () => {
    const first = buildPurivaWorkflowBriefPlanningInput(targetMonth);
    const second = buildPurivaWorkflowBriefPlanningInput(targetMonth);

    assert.equal(workflowBriefPlanningMatches(first, targetMonth), true);
    assert.equal(workflowBriefPlanningMatches(second, targetMonth), true);
    assert.equal(isPurivaSeoPlanBriefAttachment(first.seoPlan), true);
    assert.equal(
      (first.seoPlan as { items: unknown[] }).items.length,
      (second.seoPlan as { items: unknown[] }).items.length
    );
  });
});
