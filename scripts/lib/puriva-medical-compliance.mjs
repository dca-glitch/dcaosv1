import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPurivaServiceTaxonomy } from "./puriva-service-taxonomy.mjs";

const complianceJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-medical-compliance.json"
);

export const PURIVA_MEDICAL_COMPLIANCE_VERSION = "PURIVA_MEDICAL_COMPLIANCE_V1";

let cachedConfig = null;

function getConfig() {
  if (!cachedConfig) {
    cachedConfig = JSON.parse(readFileSync(complianceJsonPath, "utf8"));
  }
  return cachedConfig;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function ruleAppliesToCategory(rule, categoryId) {
  if (!rule.categoryIds || rule.categoryIds.length === 0) {
    return true;
  }
  if (!categoryId) {
    return true;
  }
  return rule.categoryIds.includes(categoryId) || rule.categoryIds.includes("*");
}

function patternMatches(text, pattern) {
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

function evaluateRule(text, rule, categoryId) {
  if (!ruleAppliesToCategory(rule, categoryId)) {
    return null;
  }

  for (const pattern of rule.patterns) {
    const match = patternMatches(text, pattern);
    if (!match) {
      continue;
    }

    if (rule.patternRequireAny && rule.patternRequireAny.length > 0) {
      const hasRequired = rule.patternRequireAny.some((required) =>
        text.toLowerCase().includes(required.toLowerCase())
      );
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

function resolvePurivaTaxonomyFlags(categoryId, taxonomy = getPurivaServiceTaxonomy()) {
  if (!categoryId) {
    return [];
  }
  const category = taxonomy.serviceCategories.find((entry) => entry.id === categoryId);
  return category?.complianceFlags ?? [];
}

function mapTaxonomyFlagsToMedicalFlags(flags) {
  const mapped = new Set();
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

export function scanPurivaMedicalClaims({ text, categoryId }) {
  const config = getConfig();
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const matches = [];
  const seenRuleIds = new Set();

  for (const rule of config.rules) {
    const match = evaluateRule(normalized, rule, categoryId);
    if (!match || seenRuleIds.has(match.ruleId)) {
      continue;
    }
    seenRuleIds.add(match.ruleId);
    matches.push(match);
  }

  return matches;
}

function maxSeverity(current, next, config) {
  return config.severityRank[next] > config.severityRank[current] ? next : current;
}

function maxAction(current, next, config) {
  return config.actionRank[next] > config.actionRank[current] ? next : current;
}

function isSafeEducationalText(text, config) {
  const lower = text.toLowerCase();
  return config.safeEducationalPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function buildPurivaComplianceGuidance(flags) {
  const config = getConfig();
  const notes = new Set();
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

export function assessPurivaMedicalCompliance({ text, categoryId, taxonomy = getPurivaServiceTaxonomy() }) {
  const config = getConfig();
  const taxonomyFlags = resolvePurivaTaxonomyFlags(categoryId, taxonomy);
  const matches = scanPurivaMedicalClaims({ text, categoryId });

  const aggregateFlags = new Set(mapTaxonomyFlagsToMedicalFlags(taxonomyFlags));
  for (const match of matches) {
    for (const flag of match.flags) {
      aggregateFlags.add(flag);
    }
  }

  let severity = taxonomyFlags.length > 0 ? "medium" : "low";
  let action = taxonomyFlags.length > 0 ? "revise" : "allow";

  for (const match of matches) {
    severity = maxSeverity(severity, match.severity, config);
    action = maxAction(action, match.action, config);
  }

  if (matches.length === 0 && isSafeEducationalText(text, config)) {
    severity = "low";
    action = "allow";
  }

  const reviewerNotes = [
    ...matches.map((match) => match.reviewerNote),
    ...(taxonomyFlags.length > 0
      ? [`Taxonomy baseline flags for ${categoryId}: ${taxonomyFlags.join(", ")}`]
      : [])
  ];

  const guidanceNotes = [
    ...matches.map((match) => match.guidance),
    ...buildPurivaComplianceGuidance([...aggregateFlags])
  ];

  return {
    version: PURIVA_MEDICAL_COMPLIANCE_VERSION,
    categoryId: categoryId ?? null,
    taxonomyFlags,
    matches,
    aggregateFlags: [...aggregateFlags],
    severity,
    action,
    reviewerNotes,
    guidanceNotes: [...new Set(guidanceNotes)]
  };
}
