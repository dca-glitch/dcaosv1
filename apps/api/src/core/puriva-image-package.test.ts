import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PURIVA_HIGH_RISK_CATEGORY_IDS } from "./puriva-service-taxonomy";
import { buildPurivaContentProductionContext } from "./puriva-content-production";
import { buildPurivaSeoPlanContext } from "./puriva-seo-plan";
import {
  buildPurivaImagePackageContext,
  buildPurivaWorkflowBriefImagePackageInput,
  buildAiDeliveryArticleImageRequestsFromImagePackage,
  findUnsafeVisualPhrasesInImagePackage,
  getPurivaImagePackageSeed,
  isPurivaImagePackageBriefAttachment,
  PURIVA_IMAGE_INTERNAL_PROMPT_LABEL,
  PURIVA_IMAGE_PACKAGE_VERSION,
  validatePurivaImagePackageContext,
  workflowBriefImagePackageMatches
} from "./puriva-image-package";

describe("puriva-image-package", () => {
  const targetMonth = "2026-07";

  it("covers all SEO/content items with image package scaffolds", () => {
    const seoPlan = buildPurivaSeoPlanContext(targetMonth);
    const production = buildPurivaContentProductionContext(targetMonth, seoPlan);
    const context = buildPurivaImagePackageContext(targetMonth, production);

    assert.equal(context.imagePackages.length, seoPlan.items.length);
    assert.equal(context.imagePackages.length, production.draftScaffolds.length);
    for (const item of seoPlan.items) {
      assert.ok(context.imagePackages.some((pkg) => pkg.seoPlanItemId === item.id));
    }
  });

  it("provides three concepts per package where content type expects them", () => {
    const context = buildPurivaImagePackageContext(targetMonth);
    const seed = getPurivaImagePackageSeed();

    for (const pkg of context.imagePackages) {
      const expected = seed.conceptCountByContentType[pkg.contentType] ?? 3;
      assert.equal(pkg.concepts.length, expected, `${pkg.seoPlanItemId} (${pkg.contentType})`);
      assert.equal(pkg.packageMetadata.conceptCount, expected);
    }
  });

  it("marks prompts internal admin only with alt text drafts", () => {
    const context = buildPurivaImagePackageContext(targetMonth);

    for (const pkg of context.imagePackages) {
      for (const concept of pkg.concepts) {
        assert.ok(concept.promptScaffold.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL));
        assert.ok(concept.altTextDraft.trim().length > 0);
        assert.equal(concept.conceptStatus, "internal_prompt_scaffold");
        assert.ok(concept.visualSafetyNotes.length > 0);
      }
    }
  });

  it("flags high-risk content with compliance markers and blocks final-ready", () => {
    const context = buildPurivaImagePackageContext(targetMonth);

    for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
      const packages = context.imagePackages.filter((pkg) => pkg.serviceCategoryId === highRiskId);
      assert.ok(packages.length > 0);
      for (const pkg of packages) {
        assert.equal(pkg.medicalReviewRequired, true);
        assert.ok(pkg.complianceFlags.length > 0);
        assert.equal(pkg.finalReadyGating.allowed, false);
        assert.ok(pkg.finalReadyGating.reasons.length > 0);
      }
    }

    const wegovyPackages = context.imagePackages.filter(
      (pkg) => pkg.serviceCategoryId === "wegovy_semaglutide_weight_management"
    );
    for (const pkg of wegovyPackages) {
      assert.ok(pkg.complianceFlags.includes("prescription_medication_risk"));
    }
  });

  it("avoids unsafe visual claims in titles and alt text", () => {
    const context = buildPurivaImagePackageContext(targetMonth);
    const validation = validatePurivaImagePackageContext(context);
    const unsafe = findUnsafeVisualPhrasesInImagePackage(context);

    assert.equal(unsafe.length, 0, unsafe.join(", "));
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.ok(
      !context.imagePackages.some((pkg) =>
        pkg.concepts.some((concept) =>
          /before\s*\/\s*after|guaranteed results|dramatic transformation|real patient/i.test(
            `${concept.title} ${concept.altTextDraft}`
          )
        )
      )
    );
  });

  it("builds AI Delivery article image requests without generation fields", () => {
    const context = buildPurivaImagePackageContext(targetMonth);
    const requests = buildAiDeliveryArticleImageRequestsFromImagePackage(context);

    assert.ok(requests.length > 0);
    assert.equal(
      requests.length,
      context.imagePackages.reduce((sum, pkg) => sum + pkg.concepts.length, 0)
    );
    for (const request of requests) {
      assert.equal(request.status, "DRAFT");
      assert.ok(request.notes.includes("internal_prompt_scaffold"));
      assert.ok(request.notes.includes("admin_only"));
      assert.ok(request.prompt.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL));
      assert.ok(request.altTextDraft.trim().length > 0);
    }
  });

  it("builds reusable workflow brief image package input idempotently", () => {
    const first = buildPurivaWorkflowBriefImagePackageInput(targetMonth);
    const second = buildPurivaWorkflowBriefImagePackageInput(targetMonth);

    assert.equal(workflowBriefImagePackageMatches(first, targetMonth), true);
    assert.equal(workflowBriefImagePackageMatches(second, targetMonth), true);
    assert.equal(isPurivaImagePackageBriefAttachment(first.imagePackage), true);
    assert.equal((first.imagePackage as { version: string }).version, PURIVA_IMAGE_PACKAGE_VERSION);
    assert.equal(
      (first.imagePackage as { imagePackages: unknown[] }).imagePackages.length,
      (second.imagePackage as { imagePackages: unknown[] }).imagePackages.length
    );
  });
});
