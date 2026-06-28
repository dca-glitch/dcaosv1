export type AiWorkflowGatewayMode = "disabled" | "local" | "openrouter" | "unknown";

export type AiWorkflowOutputTypeName = "summary" | "content_plan_draft" | "article_draft" | "unknown";

export interface AiWorkflowBudgetSummary {
  budgetPolicy: string | null;
  approximateInputTokens: number | null;
  maxOutputTokens: number | null;
}

export interface AiWorkflowObservabilitySummary {
  version: string | null;
  gateway: AiWorkflowGatewayMode;
  model: string | null;
  outputType: AiWorkflowOutputTypeName;
  liveProviderCalled: boolean | null;
  isDeterministic: boolean | null;
  budget: AiWorkflowBudgetSummary;
  safeError: string | null;
}

export interface AiWorkflowResultSummary {
  version: string | null;
  gateway: AiWorkflowGatewayMode;
  model: string | null;
  outputType: AiWorkflowOutputTypeName;
  generatedAt: string | null;
  title: string | null;
  summary: string | null;
  safeError: string | null;
  budget: AiWorkflowBudgetSummary;
  structuredContentKind: string | null;
}

export interface AiWorkflowContextUsageSummary {
  status: "used" | "skipped" | "not_loaded" | "unknown";
  detail: string | null;
}

const SENSITIVE_JSON_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|authorization|cookie|session|credential|bearer)/i;

function toTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeGateway(value: unknown): AiWorkflowGatewayMode {
  const gateway = toTrimmedString(value)?.toLowerCase();
  if (gateway === "disabled" || gateway === "local" || gateway === "openrouter") {
    return gateway;
  }
  return "unknown";
}

function normalizeOutputType(value: unknown): AiWorkflowOutputTypeName {
  const outputType = toTrimmedString(value)?.toLowerCase();
  if (outputType === "summary" || outputType === "content_plan_draft" || outputType === "article_draft") {
    return outputType;
  }
  return "unknown";
}

function readBudget(record: Record<string, unknown>): AiWorkflowBudgetSummary {
  const budget = record.budget;
  if (!budget || typeof budget !== "object" || Array.isArray(budget)) {
    return {
      budgetPolicy: toTrimmedString(record.budgetPolicy),
      approximateInputTokens: toFiniteNumber(record.approximateInputTokens),
      maxOutputTokens: toFiniteNumber(record.maxOutputTokens)
    };
  }

  const budgetRecord = budget as Record<string, unknown>;
  return {
    budgetPolicy: toTrimmedString(budgetRecord.budgetPolicy) ?? toTrimmedString(record.budgetPolicy),
    approximateInputTokens:
      toFiniteNumber(budgetRecord.approximateInputTokens) ?? toFiniteNumber(record.approximateInputTokens),
    maxOutputTokens: toFiniteNumber(budgetRecord.maxOutputTokens) ?? toFiniteNumber(record.maxOutputTokens)
  };
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseTextResultPlaceholder(text: string): AiWorkflowResultSummary | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return null;
  }

  const gatewayMatch = text.match(/^Gateway:\s*(.+)$/m);
  const modelMatch = text.match(/^Model:\s*(.+)$/m);
  const generatedAtMatch = text.match(/^Generated at:\s*(.+)$/m);
  const budgetPolicyMatch = text.match(/^Budget policy:\s*(.+)$/m);
  const inputTokensMatch = text.match(/^Approximate input tokens:\s*(\d+)$/m);
  const maxOutputTokensMatch = text.match(/^Max output tokens:\s*(\d+)$/m);
  const safeErrorMatch = text.match(/^Safe error:\s*(.+)$/m);

  const metadataLineIndexes = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (
      line.startsWith("Gateway:") ||
      line.startsWith("Model:") ||
      line.startsWith("Generated at:") ||
      line.startsWith("Budget policy:") ||
      line.startsWith("Approximate input tokens:") ||
      line.startsWith("Max output tokens:") ||
      line.startsWith("Safe error:")
    ) {
      metadataLineIndexes.add(index);
    }
  }

  const contentLines = lines.filter((_, index) => !metadataLineIndexes.has(index));
  const gateway = normalizeGateway(gatewayMatch?.[1] ?? null);

  return {
    version: "AI_WORKFLOW_RESULT_V1",
    gateway,
    model: toTrimmedString(modelMatch?.[1] ?? null),
    outputType: "summary",
    generatedAt: toTrimmedString(generatedAtMatch?.[1] ?? null),
    title: contentLines[0] ?? null,
    summary: contentLines[1] ?? contentLines[0] ?? null,
    safeError: toTrimmedString(safeErrorMatch?.[1] ?? null),
    budget: {
      budgetPolicy: toTrimmedString(budgetPolicyMatch?.[1] ?? null),
      approximateInputTokens: inputTokensMatch ? Number(inputTokensMatch[1]) : null,
      maxOutputTokens: maxOutputTokensMatch ? Number(maxOutputTokensMatch[1]) : null
    },
    structuredContentKind: null
  };
}

export function parseAiWorkflowResultSummary(
  resultPlaceholder: string | null | undefined
): AiWorkflowResultSummary | null {
  const text = (resultPlaceholder ?? "").trim();
  if (!text) {
    return null;
  }

  if (text.startsWith("{")) {
    const record = parseJsonObject(text);
    if (!record) {
      return null;
    }

    const structuredContent = record.structuredContent;
    const structuredContentKind =
      structuredContent && typeof structuredContent === "object" && !Array.isArray(structuredContent)
        ? Object.keys(structuredContent as Record<string, unknown>)[0] ?? "object"
        : null;

    return {
      version: toTrimmedString(record.version),
      gateway: normalizeGateway(record.gateway),
      model: toTrimmedString(record.model),
      outputType: normalizeOutputType(record.outputType),
      generatedAt: toTrimmedString(record.generatedAt),
      title: toTrimmedString(record.title),
      summary: toTrimmedString(record.summary),
      safeError: toTrimmedString(record.safeError),
      budget: readBudget(record),
      structuredContentKind
    };
  }

  return parseTextResultPlaceholder(text);
}

export function parseAiWorkflowObservabilityFromExecutionLog(
  executionLog: string | null | undefined
): AiWorkflowObservabilitySummary | null {
  const text = executionLog ?? "";
  const match = text.match(/\[OBSERVABILITY\]\s*(\{[\s\S]*?\})(?:\r?\n|$)/);
  if (!match?.[1]) {
    return null;
  }

  const record = parseJsonObject(match[1]);
  if (!record) {
    return null;
  }

  const gateway = normalizeGateway(record.gateway);
  const liveProviderCalled =
    typeof record.liveProviderCalled === "boolean" ? record.liveProviderCalled : null;

  return {
    version: toTrimmedString(record.version),
    gateway,
    model: toTrimmedString(record.model),
    outputType: normalizeOutputType(record.outputType),
    liveProviderCalled,
    isDeterministic: gateway === "local" || gateway === "disabled" ? true : gateway === "openrouter" ? false : null,
    budget: {
      budgetPolicy: toTrimmedString(record.budgetPolicy),
      approximateInputTokens: toFiniteNumber(record.approximateInputTokens),
      maxOutputTokens: toFiniteNumber(record.maxOutputTokens)
    },
    safeError: toTrimmedString(record.safeError)
  };
}

export function parseAiWorkflowContextUsageFromExecutionLog(
  executionLog: string | null | undefined
): AiWorkflowContextUsageSummary {
  const lines = (executionLog ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, "").trim())
    .filter(Boolean);

  const knowledgeLine = [...lines]
    .reverse()
    .find((line) => line.toLowerCase().includes("approved knowledge context"));

  if (!knowledgeLine) {
    return { status: "unknown", detail: null };
  }

  if (knowledgeLine.toLowerCase().includes("not loaded")) {
    return { status: "not_loaded", detail: knowledgeLine };
  }

  if (knowledgeLine.toLowerCase().includes("skipped")) {
    return { status: "skipped", detail: knowledgeLine };
  }

  if (knowledgeLine.toLowerCase().includes("included")) {
    return { status: "used", detail: knowledgeLine };
  }

  return { status: "unknown", detail: knowledgeLine };
}

function sanitizeJsonValue(value: unknown, parentKey = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry, parentKey));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_JSON_KEY_PATTERN.test(key)) {
      output[key] = "[redacted]";
      continue;
    }
    output[key] = sanitizeJsonValue(entry, key);
  }
  return output;
}

export function buildSanitizedAiWorkflowJsonPreview(
  resultPlaceholder: string | null | undefined,
  maxLength = 8000
): string | null {
  const text = (resultPlaceholder ?? "").trim();
  if (!text) {
    return null;
  }

  let preview = text;
  if (text.startsWith("{")) {
    const record = parseJsonObject(text);
    if (record) {
      preview = JSON.stringify(sanitizeJsonValue(record), null, 2);
    }
  }

  if (preview.length <= maxLength) {
    return preview;
  }

  return `${preview.slice(0, maxLength)}\n… [truncated]`;
}

export function buildExecutionLogPreview(
  executionLog: string | null | undefined,
  maxLines = 40
): string | null {
  const lines = (executionLog ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const previewLines = lines.slice(-maxLines);
  return previewLines.join("\n");
}

export function shortAiWorkflowRunId(runId: string): string {
  const trimmed = runId.trim();
  if (trimmed.length <= 10) {
    return trimmed;
  }
  return trimmed.slice(0, 8);
}

export function formatAiWorkflowTokenEstimate(
  approximateInputTokens: number | null | undefined,
  maxOutputTokens: number | null | undefined
): string {
  const input = typeof approximateInputTokens === "number" && Number.isFinite(approximateInputTokens)
    ? approximateInputTokens
    : null;
  const output = typeof maxOutputTokens === "number" && Number.isFinite(maxOutputTokens)
    ? maxOutputTokens
    : null;

  if (input === null && output === null) {
    return "Not recorded";
  }
  if (input !== null && output !== null) {
    return `${input} est. in / ${output} max out`;
  }
  if (input !== null) {
    return `${input} est. in`;
  }
  return `${output} max out`;
}

export function formatAiWorkflowBudgetPolicyDisplay(budgetPolicy: string | null | undefined): string {
  const policy = typeof budgetPolicy === "string" ? budgetPolicy.trim() : "";
  return policy.length > 0 ? policy : "Not recorded";
}
