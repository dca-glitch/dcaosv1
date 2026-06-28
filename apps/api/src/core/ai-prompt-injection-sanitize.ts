const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ignore\s+previous\s+instructions/gi, label: "ignore previous instructions" },
  { pattern: /disregard\s+system\s+instructions/gi, label: "disregard system instructions" },
  { pattern: /reveal\s+your\s+prompt/gi, label: "reveal your prompt" },
  { pattern: /developer\s+message/gi, label: "developer message" },
  { pattern: /system\s+message/gi, label: "system message" },
  { pattern: /\bapi\s+key\b/gi, label: "API key" },
  { pattern: /\bpassword\b/gi, label: "password" },
  { pattern: /\bsecret\b/gi, label: "secret" },
  { pattern: /\btoken\b/gi, label: "token" }
];

export interface PromptInjectionSanitizeResult {
  sanitizedText: string;
  flags: string[];
  wasSanitized: boolean;
}

export function sanitizeUntrustedContextText(value: string): PromptInjectionSanitizeResult {
  if (!value.trim()) {
    return { sanitizedText: value, flags: [], wasSanitized: false };
  }

  const flags: string[] = [];
  let sanitizedText = value;

  for (const { pattern, label } of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      flags.push(label);
      sanitizedText = sanitizedText.replace(pattern, "[REDACTED-UNTRUSTED]");
    }
  }

  return {
    sanitizedText,
    flags,
    wasSanitized: flags.length > 0
  };
}
