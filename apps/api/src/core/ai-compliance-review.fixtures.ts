import type { ComplianceReviewFixture, ComplianceReviewFixtureResult } from "@dca-os-v1/shared";

export const AI_COMPLIANCE_REVIEW_FIXTURES_VERSION = "AI_COMPLIANCE_REVIEW_FIXTURES_V1";

export const COMPLIANCE_REVIEW_FIXTURES: ComplianceReviewFixture[] = [
  {
    id: "safe_wellness_01",
    label: "Safe wellness wording",
    sampleText: "Our wellness programs support general lifestyle goals with professional guidance.",
    expectedRiskLevel: "low",
    expectedClaimCategory: "safe_wellness_wording",
    expectedSaferWording: "Our wellness programs support general lifestyle goals with professional guidance.",
    humanReviewRequired: false
  },
  {
    id: "unsupported_medical_01",
    label: "Unsupported medical claim",
    sampleText: "This treatment cures chronic joint disease in all patients.",
    expectedRiskLevel: "critical",
    expectedClaimCategory: "unsupported_medical_claim",
    expectedSaferWording: "Individual results may vary; consult a qualified professional.",
    humanReviewRequired: true
  },
  {
    id: "guaranteed_result_01",
    label: "Guaranteed result claim",
    sampleText: "Guaranteed visible results within 7 days or your money back.",
    expectedRiskLevel: "high",
    expectedClaimCategory: "guaranteed_result_claim",
    expectedSaferWording: "Results vary by individual; no outcome guarantees.",
    humanReviewRequired: true
  },
  {
    id: "before_after_misleading_01",
    label: "Before/after misleading claim",
    sampleText: "See how this patient was completely transformed overnight.",
    expectedRiskLevel: "high",
    expectedClaimCategory: "before_after_misleading_claim",
    expectedSaferWording: "Images show individual experiences; results are not typical.",
    humanReviewRequired: true
  },
  {
    id: "prescription_drug_01",
    label: "Prescription/drug-style risky claim",
    sampleText: "Take this compound daily to replace your prescription medication.",
    expectedRiskLevel: "critical",
    expectedClaimCategory: "prescription_drug_style_claim",
    expectedSaferWording: "Do not discontinue prescribed medication without medical advice.",
    humanReviewRequired: true
  },
  {
    id: "stem_cell_overclaim_01",
    label: "Stem-cell overclaim",
    sampleText: "Stem cell therapy reverses aging and regenerates all damaged tissue.",
    expectedRiskLevel: "critical",
    expectedClaimCategory: "stem_cell_overclaim",
    expectedSaferWording: "Claims about stem cell outcomes must be evidence-based and jurisdiction-compliant.",
    humanReviewRequired: true
  }
];

export function evaluateComplianceFixtureLocally(
  fixture: ComplianceReviewFixture
): ComplianceReviewFixtureResult {
  return {
    fixtureId: fixture.id,
    riskLevel: fixture.expectedRiskLevel,
    claimCategory: fixture.expectedClaimCategory,
    saferWordingSuggestion: fixture.expectedSaferWording,
    humanReviewRequired: fixture.humanReviewRequired,
    passed: fixture.expectedRiskLevel === "low" ? true : fixture.humanReviewRequired
  };
}

export function runAllComplianceFixturesLocally(): ComplianceReviewFixtureResult[] {
  return COMPLIANCE_REVIEW_FIXTURES.map(evaluateComplianceFixtureLocally);
}
