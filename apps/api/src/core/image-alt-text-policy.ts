/**
 * Image alt text policy (G191).
 *
 * Pure local logic: alt text must be descriptive and neutral — no medical claims,
 * no before/after implication, and not keyword-stuffed. No provider calls, no DB.
 */

export const IMAGE_ALT_TEXT_POLICY_VERSION = "IMAGE_ALT_TEXT_POLICY_V1";

export const IMAGE_ALT_TEXT_MAX_LENGTH = 160;
export const IMAGE_ALT_TEXT_MIN_LENGTH = 8;
export const IMAGE_ALT_TEXT_MAX_KEYWORD_REPEATS = 2;

export type ImageAltTextPolicyIssueCode =
  | "empty"
  | "too_short"
  | "too_long"
  | "medical_claim"
  | "before_after_implication"
  | "keyword_stuffed"
  | "provider_or_prompt_leak";

export type ImageAltTextPolicyIssue = {
  code: ImageAltTextPolicyIssueCode;
  message: string;
};

export type ImageAltTextPolicyDecision = {
  version: typeof IMAGE_ALT_TEXT_POLICY_VERSION;
  allowed: boolean;
  normalizedAltText: string | null;
  issues: ImageAltTextPolicyIssue[];
  checks: string[];
};

const MEDICAL_CLAIM_PATTERN =
  /\b(treats?|cures?|heals?|diagnos(?:e|es|is)|clinically\s+proven|guaranteed\s+(?:results?|improvement)|medical\s+grade\s+result|FDA\s+approved\s+result|BPOM\s+approved\s+result|removes?\s+(?:wrinkles?|fat|acne)|eliminates?\s+(?:wrinkles?|fat|acne)|anti[-\s]?aging\s+result)\b/i;

const BEFORE_AFTER_PATTERN =
  /\b(before\s*\/?\s*after|before[-\s]?and[-\s]?after|after\s+treatment|transformation|glow[-\s]?up|results?\s+shown|side[-\s]?by[-\s]?side)\b/i;

const PROVIDER_OR_PROMPT_LEAK_PATTERN =
  /\b(dall[-\s]?e|midjourney|firefly|ideogram|stable\s+diffusion|openai|prompt:|negative\s+prompt|IMAGE_COMPLIANCE|PURIVA_IMAGE_PACKAGE)\b/i;

/**
 * Detects keyword stuffing by counting repeated significant tokens (length >= 4).
 * More than IMAGE_ALT_TEXT_MAX_KEYWORD_REPEATS of the same token is stuffed.
 */
function findKeywordStuffing(normalized: string): string | null {
  const tokens = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  for (const [token, count] of counts) {
    if (count > IMAGE_ALT_TEXT_MAX_KEYWORD_REPEATS) {
      return token;
    }
  }
  return null;
}

/**
 * Evaluates alt text against G191 policy: descriptive, neutral, no medical claims,
 * no before/after implication, not keyword-stuffed.
 */
export function evaluateImageAltTextPolicy(altText: string | null | undefined): ImageAltTextPolicyDecision {
  const trimmed = (altText ?? "").trim().replace(/\s+/g, " ");
  const issues: ImageAltTextPolicyIssue[] = [];
  const checks: string[] = [];

  if (!trimmed) {
    issues.push({ code: "empty", message: "Alt text is required." });
    checks.push("REJECT:empty");
    return {
      version: IMAGE_ALT_TEXT_POLICY_VERSION,
      allowed: false,
      normalizedAltText: null,
      issues,
      checks
    };
  }

  if (trimmed.length < IMAGE_ALT_TEXT_MIN_LENGTH) {
    issues.push({
      code: "too_short",
      message: `Alt text must be at least ${IMAGE_ALT_TEXT_MIN_LENGTH} characters.`
    });
    checks.push("REJECT:too_short");
  }

  if (trimmed.length > IMAGE_ALT_TEXT_MAX_LENGTH) {
    issues.push({
      code: "too_long",
      message: `Alt text must be at most ${IMAGE_ALT_TEXT_MAX_LENGTH} characters.`
    });
    checks.push("REJECT:too_long");
  }

  if (MEDICAL_CLAIM_PATTERN.test(trimmed)) {
    issues.push({
      code: "medical_claim",
      message: "Alt text must not include medical claims or treatment-outcome language."
    });
    checks.push("REJECT:medical_claim");
  }

  if (BEFORE_AFTER_PATTERN.test(trimmed)) {
    issues.push({
      code: "before_after_implication",
      message: "Alt text must not imply before/after or transformation imagery."
    });
    checks.push("REJECT:before_after_implication");
  }

  if (PROVIDER_OR_PROMPT_LEAK_PATTERN.test(trimmed)) {
    issues.push({
      code: "provider_or_prompt_leak",
      message: "Alt text must not include provider, model, or internal prompt tokens."
    });
    checks.push("REJECT:provider_or_prompt_leak");
  }

  const stuffedToken = findKeywordStuffing(trimmed);
  if (stuffedToken) {
    issues.push({
      code: "keyword_stuffed",
      message: `Alt text appears keyword-stuffed (repeated token "${stuffedToken}").`
    });
    checks.push("REJECT:keyword_stuffed");
  }

  if (issues.length === 0) {
    checks.push("ALLOW:descriptive_neutral_alt");
  }

  return {
    version: IMAGE_ALT_TEXT_POLICY_VERSION,
    allowed: issues.length === 0,
    normalizedAltText: issues.length === 0 ? trimmed : trimmed,
    issues,
    checks
  };
}
