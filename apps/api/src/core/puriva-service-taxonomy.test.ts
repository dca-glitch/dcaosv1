import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPurivaWorkflowBriefStructuredInput,
  findForbiddenPromotionalPhrases,
  getPurivaServiceTaxonomy,
  isPurivaWorkflowBriefStructuredInput,
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  validatePurivaServiceTaxonomy
} from "./puriva-service-taxonomy";

describe("puriva-service-taxonomy", () => {
  it("includes all required Puriva service categories", () => {
    const taxonomy = getPurivaServiceTaxonomy();
    const ids = taxonomy.serviceCategories.map((category) => category.id);

    for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
      assert.ok(ids.includes(requiredId), `missing category ${requiredId}`);
    }

    assert.equal(taxonomy.version, PURIVA_SERVICE_TAXONOMY_VERSION);
    assert.equal(taxonomy.clientDomain, "puriva.id");
  });

  it("requires audience, search intent, and content type fields on each category", () => {
    const taxonomy = getPurivaServiceTaxonomy();

    for (const category of taxonomy.serviceCategories) {
      assert.ok(category.audienceSegments.length > 0, `${category.id} audienceSegments`);
      assert.ok(category.searchIntentGroups.length > 0, `${category.id} searchIntentGroups`);
      assert.ok(category.recommendedContentTypes.length > 0, `${category.id} recommendedContentTypes`);
      assert.ok(category.contentClusters.length > 0, `${category.id} contentClusters`);
      assert.ok(category.complianceFlags.length > 0, `${category.id} complianceFlags`);
      assert.ok(category.complianceNotes.length > 0, `${category.id} complianceNotes`);
    }

    assert.equal(taxonomy.audienceSegments.length, 2);
    assert.ok(taxonomy.audienceSegments.some((segment) => segment.id === "local_clients"));
    assert.ok(taxonomy.audienceSegments.some((segment) => segment.id === "international_medical_tourists"));
  });

  it("flags high-risk medical categories with compliance controls", () => {
    const taxonomy = getPurivaServiceTaxonomy();

    for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
      const category = taxonomy.serviceCategories.find((entry) => entry.id === highRiskId);
      assert.ok(category, `missing high-risk category ${highRiskId}`);
      assert.ok(category.complianceFlags.includes("medical_claim_risk"));
      assert.ok(category.complianceFlags.includes("licensed_provider_required"));
    }

    const wegovy = taxonomy.serviceCategories.find((entry) => entry.id === "wegovy_semaglutide_weight_management");
    assert.ok(wegovy?.complianceFlags.includes("prescription_medication_risk"));

    const stemCell = taxonomy.serviceCategories.find((entry) => entry.id === "stem_cell_therapy");
    assert.ok(stemCell?.complianceNotes.some((note) => /never state or imply stem cell therapy cures/i.test(note)));
  });

  it("avoids unsafe promotional claim language in taxonomy source", () => {
    const forbidden = findForbiddenPromotionalPhrases();
    assert.deepEqual(forbidden, []);
    const validation = validatePurivaServiceTaxonomy();
    assert.equal(validation.ok, true, validation.errors.join("; "));
  });

  it("builds workflow brief structured input for AI/MI context", () => {
    const structured = buildPurivaWorkflowBriefStructuredInput();
    assert.equal(structured.kind, "puriva_service_taxonomy");
    assert.equal(structured.version, PURIVA_SERVICE_TAXONOMY_VERSION);
    assert.ok(Array.isArray(structured.keywords));
    assert.ok((structured.keywords as string[]).length > 0);
    assert.ok(Array.isArray(structured.serviceCategories));
    assert.equal(isPurivaWorkflowBriefStructuredInput(structured), true);
  });
});
