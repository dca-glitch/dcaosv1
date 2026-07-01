/**
 * Puriva medical/aesthetic compliance guardrails — deterministic scanning and guidance only.
 * No content generation, provider calls, crawling, or live medical advice.
 */

import complianceData from "./puriva-medical-compliance.json";
import {
  getPurivaServiceTaxonomy,
  type PurivaComplianceFlag,
  type PurivaServiceTaxonomy
} from "./puriva-service-taxonomy";

export const PURIVA_MEDICAL_COMPLIANCE_VERSION = "PURIVA_MEDICAL_COMPLIANCE_V1";

export type PurivaMedicalComplianceFlag =
  | "medical_claim_risk"
  | "prescription_medication_risk"
  | "before_after_result_claim_risk"
  | "licensed_provider_required"
  | "guaranteed_outcome_claim"
  | "cure_claim"
  | "universal_suitability_claim"
  | "permanent_result_claim"
  | "unsafe_weight_loss_claim"
  | "hospital_partner_claim_requires_verification"
  | "medical_review_required";

export type PurivaComplianceSeverity = "low" | "medium" | "high" | "critical";

export type PurivaComplianceAction = "allow" | "revise" | "require_medical_review" | "block";

export type PurivaMedicalComplianceScanMatch = {
  ruleId: string;
  flags: PurivaMedicalComplianceFlag[];
  matchedPhrase: string;
  severity: PurivaComplianceSeverity;
  action: PurivaComplianceAction;
  reviewerNote: string;
  guidance: string;
};

export type PurivaMedicalComplianceAssessment = {
  version: typeof PURIVA_MEDICAL_COMPLIANCE_VERSION;
  categoryId: string | null;
  taxonomyFlags: PurivaComplianceFlag[];
  matches: PurivaMedicalComplianceScanMatch[];
  aggregateFlags: PurivaMedicalComplianceFlag[];
  severity: PurivaComplianceSeverity;
  action: PurivaComplianceAction;
  reviewerNotes: string[];
  guidanceNotes: string[];
};

type ComplianceRule = {
  id: string;
  flags: PurivaMedicalComplianceFlag[];
  patterns: string[];
  patternRequireAny?: string[];
  severity: PurivaComplianceSeverity;
  action: PurivaComplianceAction;
  categoryIds?: string[];
  reviewerNote: string;
  guidance: string;
};

type ComplianceConfig = {
  version: typeof PURIVA_MEDICAL_COMPLIANCE_VERSION;
  clientDomain: string;
  rules: ComplianceRule[];
  safeEducationalPatterns: string[];
  severityRank: Record<PurivaComplianceSeverity, number>;
  actionRank: Record<PurivaComplianceAction, number>;
  guidanceSnippets: Record<string, string>;
};

const config = complianceData as ComplianceConfig;

const severityOrder: PurivaComplianceSeverity[] = ["low", "medium", "high", "critical"];
const actionOrder: PurivaComplianceAction[] = ["allow", "revise", "require_medical_review", "block"];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function ruleAppliesToCategory(rule: ComplianceRule, categoryId: string | null | undefined): boolean {
  if (!rule.categoryIds || rule.categoryIds.length === 0) {
    return true;
  }
  if (!categoryId) {
    return true;
  }
  return rule.categoryIds.includes(categoryId) || rule.categoryIds.includes("*");
}

function patternMatches(text: string, pattern: string): RegExpMatchArray | null {
  const isRegex = /\\d|\\s|\(|\)|\[|\]/.test(pattern);
  if (isRegex) {
    const regex = new RegExp(pattern, "i");
    return text.match(regex);
  }
  const index = text.toLowerCase().indexOf(pattern.toLowerCase());
  if (index === -1) {
    return null;
  }
  return [text.slice(index, index + pattern.length)];
}

function evaluateRule(text: string, rule: ComplianceRule, categoryId?: string | null): PurivaMedicalComplianceScanMatch | null {
  if (!ruleAppliesToCategory(rule, categoryId)) {
    return null;
  }

  for (const pattern of rule.patterns) {
    const match = patternMatches(text, pattern);
    if (!match) {
      continue;
    }

    if (rule.patternRequireAny && rule.patternRequireAny.length > 0) {
      const hasRequired = rule.patternRequireAny.some((required) => text.toLowerCase().includes(required.toLowerCase()));
      if (!hasRequired) {
        continue;
      }
    }

    return {
      ruleId: rule.id,
      flags: rule.flags,
      matchedPhrase: match[0],
      severity: rule.severity,
      action: rule.action,
      reviewerNote: rule.reviewerNote,
      guidance: rule.guidance
    };
  }

  return null;
}

export function getPurivaMedicalComplianceConfig(): ComplianceConfig {
  return config;
}

export function resolvePurivaTaxonomyFlags(categoryId?: string | null, taxonomy: PurivaServiceTaxonomy = getPurivaServiceTaxonomy()): PurivaComplianceFlag[] {
  if (!categoryId) {
    return [];
  }
  const category = taxonomy.serviceCategories.find((entry) => entry.id === categoryId);
  return category?.complianceFlags ?? [];
}

export function mapTaxonomyFlagsToMedicalFlags(flags: PurivaComplianceFlag[]): PurivaMedicalComplianceFlag[] {
  const mapped = new Set<PurivaMedicalComplianceFlag>();
  for (const flag of flags) {
    if (
      flag === "medical_claim_risk" ||
      flag === "prescription_medication_risk" ||
      flag === "before_after_result_claim_risk" ||
      flag === "licensed_provider_required"
    ) {
      mapped.add(flag);
    }
  }
  return [...mapped];
}

export function scanPurivaMedicalClaims(input: {
  text: string;
  categoryId?: string | null;
}): PurivaMedicalComplianceScanMatch[] {
  const text = normalizeText(input.text);
  if (!text) {
    return [];
  }

  const matches: PurivaMedicalComplianceScanMatch[] = [];
  const seenRuleIds = new Set<string>();

  for (const rule of config.rules) {
    const match = evaluateRule(text, rule, input.categoryId);
    if (!match || seenRuleIds.has(match.ruleId)) {
      continue;
    }
    seenRuleIds.add(match.ruleId);
    matches.push(match);
  }

  return matches;
}

function maxSeverity(current: PurivaComplianceSeverity, next: PurivaComplianceSeverity): PurivaComplianceSeverity {
  return config.severityRank[next] > config.severityRank[current] ? next : current;
}

function maxAction(current: PurivaComplianceAction, next: PurivaComplianceAction): PurivaComplianceAction {
  return config.actionRank[next] > config.actionRank[current] ? next : current;
}

function isSafeEducationalText(text: string): boolean {
  const lower = text.toLowerCase();
  return config.safeEducationalPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function buildPurivaComplianceGuidance(flags: PurivaMedicalComplianceFlag[]): string[] {
  const notes = new Set<string>();
  for (const flag of flags) {
    const snippet = config.guidanceSnippets[flag];
    if (snippet) {
      notes.add(snippet);
    }
  }
  if (notes.size === 0) {
    notes.add("Keep content educational, consultative, and aligned with licensed provider oversight.");
  }
  return [...notes];
}

export function assessPurivaMedicalCompliance(input: {
  text: string;
  categoryId?: string | null;
  taxonomy?: PurivaServiceTaxonomy;
}): PurivaMedicalComplianceAssessment {
  const taxonomy = input.taxonomy ?? getPurivaServiceTaxonomy();
  const taxonomyFlags = resolvePurivaTaxonomyFlags(input.categoryId, taxonomy);
  const matches = scanPurivaMedicalClaims({ text: input.text, categoryId: input.categoryId });

  const aggregateFlags = new Set<PurivaMedicalComplianceFlag>(mapTaxonomyFlagsToMedicalFlags(taxonomyFlags));
  for (const match of matches) {
    for (const flag of match.flags) {
      aggregateFlags.add(flag);
    }
  }

  let severity: PurivaComplianceSeverity = taxonomyFlags.length > 0 ? "medium" : "low";
  let action: PurivaComplianceAction = taxonomyFlags.length > 0 ? "revise" : "allow";

  for (const match of matches) {
    severity = maxSeverity(severity, match.severity);
    action = maxAction(action, match.action);
  }

  if (matches.length === 0 && isSafeEducationalText(input.text)) {
    severity = "low";
    action = "allow";
  }

  const reviewerNotes = [
    ...matches.map((match) => match.reviewerNote),
    ...(taxonomyFlags.length > 0
      ? [`Taxonomy baseline flags for ${input.categoryId}: ${taxonomyFlags.join(", ")}`]
      : [])
  ];

  const guidanceNotes = [
    ...matches.map((match) => match.guidance),
    ...buildPurivaComplianceGuidance([...aggregateFlags])
  ];

  const uniqueGuidance = [...new Set(guidanceNotes)];

  return {
    version: PURIVA_MEDICAL_COMPLIANCE_VERSION,
    categoryId: input.categoryId ?? null,
    taxonomyFlags,
    matches,
    aggregateFlags: [...aggregateFlags],
    severity,
    action,
    reviewerNotes,
    guidanceNotes: uniqueGuidance
  };
}

export function summarizePurivaComplianceAssessment(assessment: PurivaMedicalComplianceAssessment): string {
  const parts = [
    `Puriva compliance ${assessment.version}`,
    `severity=${assessment.severity}`,
    `action=${assessment.action}`,
    `flags=${assessment.aggregateFlags.join(", ") || "none"}`
  ];

  if (assessment.categoryId) {
    parts.push(`category=${assessment.categoryId}`);
  }

  if (assessment.matches.length > 0) {
    parts.push(`matches=${assessment.matches.map((match) => match.ruleId).join(", ")}`);
  }

  return parts.join(" · ");
}
