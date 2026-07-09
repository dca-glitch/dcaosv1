/**
 * Compliance review agent fixture contracts (G56).
 * Deterministic local tests only — no live model calls.
 */

export type ComplianceClaimCategory =
  | "safe_wellness_wording"
  | "unsupported_medical_claim"
  | "guaranteed_result_claim"
  | "before_after_misleading_claim"
  | "prescription_drug_style_claim"
  | "stem_cell_overclaim";

export type ComplianceRiskLevel = "low" | "medium" | "high" | "critical";

export interface ComplianceReviewFixture {
  id: string;
  label: string;
  sampleText: string;
  expectedRiskLevel: ComplianceRiskLevel;
  expectedClaimCategory: ComplianceClaimCategory;
  expectedSaferWording: string;
  humanReviewRequired: boolean;
}

export interface ComplianceReviewFixtureResult {
  fixtureId: string;
  riskLevel: ComplianceRiskLevel;
  claimCategory: ComplianceClaimCategory;
  saferWordingSuggestion: string;
  humanReviewRequired: boolean;
  passed: boolean;
}
