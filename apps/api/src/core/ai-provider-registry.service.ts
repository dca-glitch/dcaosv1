import type { AiAgentRole, AiProviderRegistryEntry, AiRoleProviderMapping } from "@dca-os-v1/shared";

export const AI_PROVIDER_REGISTRY_VERSION = "AI_PROVIDER_REGISTRY_V1";

const DISABLED_PLACEHOLDER: Omit<AiProviderRegistryEntry, "providerKey" | "displayName"> = {
  modelId: null,
  modelName: null,
  enabled: false,
  environment: "local",
  executionMode: "disabled",
  fallbackProviderKey: null,
  timeoutMs: 30_000,
  retryLimit: 0,
  estimatedCostUsdPer1kTokens: null,
  notes: "Disabled-safe placeholder; no live provider calls."
};

export const AI_PROVIDER_REGISTRY: Record<string, AiProviderRegistryEntry> = {
  local_deterministic: {
    providerKey: "local_deterministic",
    displayName: "Local Deterministic",
    modelId: "local-deterministic-v1",
    modelName: "Local Deterministic v1",
    enabled: true,
    environment: "local",
    executionMode: "local",
    fallbackProviderKey: null,
    timeoutMs: 5_000,
    retryLimit: 0,
    estimatedCostUsdPer1kTokens: 0,
    notes: "Default disabled-safe execution path."
  },
  perplexity_placeholder: {
    providerKey: "perplexity_placeholder",
    displayName: "Perplexity (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic",
    notes: "Research role placeholder; disabled until owner enables."
  },
  openai_placeholder: {
    providerKey: "openai_placeholder",
    displayName: "OpenAI (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic"
  },
  openai_mini_placeholder: {
    providerKey: "openai_mini_placeholder",
    displayName: "OpenAI Mini (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic"
  },
  anthropic_placeholder: {
    providerKey: "anthropic_placeholder",
    displayName: "Anthropic (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic"
  },
  gemini_placeholder: {
    providerKey: "gemini_placeholder",
    displayName: "Gemini (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic"
  },
  manual_stock_default: {
    providerKey: "manual_stock_default",
    displayName: "Manual / Stock Default",
    modelId: null,
    modelName: "Manual or stock asset",
    enabled: true,
    environment: "local",
    executionMode: "local",
    fallbackProviderKey: null,
    timeoutMs: 5_000,
    retryLimit: 0,
    estimatedCostUsdPer1kTokens: 0,
    notes: "Image generation defaults to manual/stock; no live image provider."
  },
  vision_qa_placeholder: {
    providerKey: "vision_qa_placeholder",
    displayName: "Vision QA (placeholder)",
    ...DISABLED_PLACEHOLDER,
    fallbackProviderKey: "local_deterministic",
    notes: "Before/after technical QA only; disabled by default."
  },
  openrouter_gateway: {
    providerKey: "openrouter_gateway",
    displayName: "OpenRouter Gateway",
    modelId: null,
    modelName: "Configured via AI_TEXT_GATEWAY",
    enabled: false,
    environment: "local",
    executionMode: "disabled",
    fallbackProviderKey: "local_deterministic",
    timeoutMs: 60_000,
    retryLimit: 1,
    estimatedCostUsdPer1kTokens: null,
    notes: "Routed through existing AI Gateway v1 when explicitly enabled."
  }
};

export const AI_ROLE_PROVIDER_MAPPINGS: AiRoleProviderMapping[] = [
  { role: "research_agent", primaryProviderKey: "perplexity_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "seo_planning_agent", primaryProviderKey: "openai_placeholder", fallbackProviderKey: "gemini_placeholder" },
  { role: "content_drafting_agent", primaryProviderKey: "openai_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "rewrite_localization_agent", primaryProviderKey: "openai_mini_placeholder", fallbackProviderKey: "gemini_placeholder" },
  { role: "compliance_review_agent", primaryProviderKey: "anthropic_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "report_narrative_agent", primaryProviderKey: "openai_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "image_prompt_agent", primaryProviderKey: "openai_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "image_generation_agent", primaryProviderKey: "manual_stock_default", fallbackProviderKey: null },
  { role: "vision_technical_qa_agent", primaryProviderKey: "vision_qa_placeholder", fallbackProviderKey: "local_deterministic" },
  { role: "local_disabled_safe_agent", primaryProviderKey: "local_deterministic", fallbackProviderKey: null }
];

export function getAiProviderRegistryEntry(providerKey: string): AiProviderRegistryEntry | null {
  return AI_PROVIDER_REGISTRY[providerKey] ?? null;
}

export function resolveProviderForRole(role: AiAgentRole): {
  primary: AiProviderRegistryEntry;
  fallback: AiProviderRegistryEntry | null;
  effective: AiProviderRegistryEntry;
  selectionReason: string;
} {
  const mapping = AI_ROLE_PROVIDER_MAPPINGS.find((entry) => entry.role === role);
  const primaryKey = mapping?.primaryProviderKey ?? "local_deterministic";
  const fallbackKey = mapping?.fallbackProviderKey ?? "local_deterministic";

  const primary = getAiProviderRegistryEntry(primaryKey) ?? AI_PROVIDER_REGISTRY.local_deterministic;
  const fallback = fallbackKey ? getAiProviderRegistryEntry(fallbackKey) : null;

  if (primary.enabled && primary.executionMode !== "disabled") {
    return {
      primary,
      fallback,
      effective: primary,
      selectionReason: `Primary provider "${primary.providerKey}" is configured for role "${role}".`
    };
  }

  if (fallback?.enabled && fallback.executionMode !== "disabled") {
    return {
      primary,
      fallback,
      effective: fallback,
      selectionReason: `Primary provider "${primary.providerKey}" is disabled; using fallback "${fallback.providerKey}".`
    };
  }

  return {
    primary,
    fallback,
    effective: AI_PROVIDER_REGISTRY.local_deterministic,
    selectionReason: `All configured providers for role "${role}" are disabled; using local deterministic fallback.`
  };
}

export function listAiProviderRegistrySnapshot(): {
  version: typeof AI_PROVIDER_REGISTRY_VERSION;
  providers: AiProviderRegistryEntry[];
  roleMappings: AiRoleProviderMapping[];
} {
  return {
    version: AI_PROVIDER_REGISTRY_VERSION,
    providers: Object.values(AI_PROVIDER_REGISTRY),
    roleMappings: AI_ROLE_PROVIDER_MAPPINGS
  };
}
