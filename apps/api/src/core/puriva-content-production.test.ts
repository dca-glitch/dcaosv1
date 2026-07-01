import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PURIVA_HIGH_RISK_CATEGORY_IDS } from "./puriva-service-taxonomy";
import { buildPurivaSeoPlanContext } from "./puriva-seo-plan";
import {
  buildPurivaContentProductionContext,
  buildPurivaWorkflowBriefProductionInput,
  findUnsafeApprovedPhrasesInContentProduction,
  isPurivaContentProductionBriefAttachment,
  PURIVA_CONTENT_PRODUCTION_VERSION,
  PURIVA_DRAFT_INTERNAL_LABEL,
  validatePurivaContentProductionContext,
  workflowBriefProductionMatches
} from "./puriva-content-production";

describe("puriva-content-production", () => {
  const targetMonth = "2026-07";

  it("covers all SEO plan items with draft scaffolds", () => {
    const seoPlan = buildPurivaSeoPlanContext(targetMonth);
    const context = buildPurivaContentProductionContext(targetMonth, seoPlan);

    assert.equal(context.draftScaffolds.length, seoPlan.items.length);
    for (const item of seoPlan.items) {
      assert.ok(context.draftScaffolds.some((scaffold) => scaffold.seoPlanItemId === item.id));
    }
  });

  it("includes content type, audience, intent, and outline sections on each scaffold", () => {
    const context = buildPurivaContentProductionContext(targetMonth);

    for (const scaffold of context.draftScaffolds) {
      assert.ok(scaffold.contentType);
      assert.ok(scaffold.searchIntent);
      assert.ok(scaffold.audienceSegments.length > 0);
      assert.ok(scaffold.outlineSections.length > 0);
      assert.ok(scaffold.outlineSections.every((section) => section.heading && section.purpose));
    }
  });

  it("requires medical review for high-risk draft scaffolds", () => {
    const context = buildPurivaContentProductionContext(targetMonth);

    for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
      const scaffolds = context.draftScaffolds.filter((entry) => entry.serviceCategoryId === highRiskId);
      assert.ok(scaffolds.length > 0);
      for (const scaffold of scaffolds) {
        assert.equal(scaffold.medicalReviewRequired, true);
        assert.ok(scaffold.complianceFlags.length > 0);
      }
    }
  });

  it("marks verification-required topics with notes", () => {
    const context = buildPurivaContentProductionContext(targetMonth);

    const verificationScaffolds = context.draftScaffolds.filter((entry) => entry.verificationRequired);
    assert.ok(verificationScaffolds.length > 0);
    for (const scaffold of verificationScaffolds) {
      assert.ok(scaffold.verificationNotes.some((note) => /verification/i.test(note)));
    }
    assert.ok(context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note)));
  });

  it("avoids unsafe claims and keeps drafts marked internal only", () => {
    const context = buildPurivaContentProductionContext(targetMonth);
    const validation = validatePurivaContentProductionContext(context);
    const unsafe = findUnsafeApprovedPhrasesInContentProduction(context);

    assert.equal(unsafe.length, 0);
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(context.draftScaffolds.every((scaffold) => scaffold.draftBrief.includes(PURIVA_DRAFT_INTERNAL_LABEL)));
    assert.ok(!context.draftScaffolds.some((scaffold) => /cure|guaranteed results|permanent result/i.test(scaffold.draftBrief)));
  });

  it("builds reusable workflow brief production input idempotently", () => {
    const first = buildPurivaWorkflowBriefProductionInput(targetMonth);
    const second = buildPurivaWorkflowBriefProductionInput(targetMonth);

    assert.equal(workflowBriefProductionMatches(first, targetMonth), true);
    assert.equal(workflowBriefProductionMatches(second, targetMonth), true);
    assert.equal(isPurivaContentProductionBriefAttachment(first.contentProduction), true);
    assert.equal(
      (first.contentProduction as { draftScaffolds: unknown[] }).draftScaffolds.length,
      (second.contentProduction as { draftScaffolds: unknown[] }).draftScaffolds.length
    );
    assert.equal((first.contentProduction as { version: string }).version, PURIVA_CONTENT_PRODUCTION_VERSION);
  });
});
