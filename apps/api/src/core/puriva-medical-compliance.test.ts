import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessPurivaMedicalCompliance,
  buildPurivaComplianceGuidance,
  PURIVA_MEDICAL_COMPLIANCE_VERSION,
  scanPurivaMedicalClaims,
  summarizePurivaComplianceAssessment
} from "./puriva-medical-compliance";

describe("puriva-medical-compliance", () => {
  it("flags Wegovy universal suitability claims", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Wegovy is suitable for everyone and works for all patients.",
      categoryId: "wegovy_semaglutide_weight_management"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "universal_suitability_wegovy"));
    assert.ok(assessment.aggregateFlags.includes("universal_suitability_claim"));
    assert.ok(assessment.aggregateFlags.includes("prescription_medication_risk"));
    assert.equal(assessment.action, "require_medical_review");
  });

  it("flags unsafe rapid weight-loss promises", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Lose 20kg in 2 weeks with our rapid weight loss program.",
      categoryId: "wegovy_semaglutide_weight_management"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "unsafe_rapid_weight_loss"));
    assert.ok(assessment.aggregateFlags.includes("unsafe_weight_loss_claim"));
    assert.ok(["high", "critical"].includes(assessment.severity));
  });

  it("flags stem-cell cure claims as critical blockers", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Our stem cells can cure arthritis and reverse disease permanently.",
      categoryId: "stem_cell_therapy"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "cure_claim"));
    assert.ok(assessment.aggregateFlags.includes("cure_claim"));
    assert.equal(assessment.severity, "critical");
    assert.equal(assessment.action, "block");
  });

  it("flags permanent result claims", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Enjoy permanent results after one session.",
      categoryId: "general_aesthetic_services"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "permanent_result"));
    assert.ok(assessment.aggregateFlags.includes("permanent_result_claim"));
    assert.equal(assessment.action, "revise");
  });

  it("flags before/after transformation claims for medical review", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "See our before and after transformation results.",
      categoryId: "general_aesthetic_services"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "before_after_transformation"));
    assert.ok(assessment.aggregateFlags.includes("before_after_result_claim_risk"));
    assert.equal(assessment.action, "require_medical_review");
  });

  it("flags hospital partner and license claims for verification", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "We are an official partner hospital with international accreditation.",
      categoryId: "bali_medical_tourism_journey"
    });

    assert.ok(assessment.matches.some((match) => match.ruleId === "hospital_partner_license_claim"));
    assert.ok(assessment.aggregateFlags.includes("hospital_partner_claim_requires_verification"));
    assert.equal(assessment.action, "require_medical_review");
    assert.notEqual(assessment.action, "block");
  });

  it("allows safe educational neutral wording at low risk", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Consultation with a licensed prescriber is required to assess eligibility for weight-management treatment. Outcomes vary by patient.",
      categoryId: "wegovy_semaglutide_weight_management"
    });

    assert.equal(assessment.matches.length, 0);
    assert.equal(assessment.severity, "low");
    assert.equal(assessment.action, "allow");
  });

  it("includes taxonomy baseline flags for category assessments", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Program overview for international visitors.",
      categoryId: "stem_cell_therapy"
    });

    assert.ok(assessment.taxonomyFlags.includes("medical_claim_risk"));
    assert.ok(assessment.taxonomyFlags.includes("licensed_provider_required"));
    assert.ok(assessment.aggregateFlags.includes("medical_claim_risk"));
    assert.ok(assessment.reviewerNotes.some((note) => note.includes("Taxonomy baseline flags")));
  });

  it("scans claims and builds guidance without generating marketing copy", () => {
    const matches = scanPurivaMedicalClaims({
      text: "Guaranteed results for every client.",
      categoryId: "general_aesthetic_services"
    });

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.ruleId, "guaranteed_outcome");

    const guidance = buildPurivaComplianceGuidance(["guaranteed_outcome_claim", "medical_review_required"]);
    assert.ok(guidance.some((note) => /guaranteed outcomes/i.test(note)));
    assert.ok(guidance.every((note) => !/buy now|limited offer/i.test(note)));
  });

  it("summarizes assessments deterministically", () => {
    const assessment = assessPurivaMedicalCompliance({
      text: "Results guaranteed.",
      categoryId: "general_aesthetic_services"
    });

    const summary = summarizePurivaComplianceAssessment(assessment);
    assert.ok(summary.includes(PURIVA_MEDICAL_COMPLIANCE_VERSION));
    assert.ok(summary.includes("severity=high"));
    assert.ok(summary.includes("guaranteed_outcome"));
  });
});
