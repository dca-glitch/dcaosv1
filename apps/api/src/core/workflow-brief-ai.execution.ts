/**
 * Workflow brief AI execution — MI + SEO report generation through AI Gateway v1 seams.
 * Local deterministic fallback always available; live provider opt-in via OpenRouter config.
 */
import { getAiProviderConfig, type AiProviderConfig } from "../config";
import {
  executeAiGatewayV1ProviderText,
  prepareAiGatewayV1Context,
  resolveAiGatewayExecutionMode,
  type AiGatewayExecutionMode
} from "./ai-gateway-v1.service";
import { toAiTextBudget, type AiTextBudget } from "./ai-text-budget.policy";

export const WORKFLOW_BRIEF_AI_RUN_VERSION = "WORKFLOW_BRIEF_AI_RUN_V1";

const STUB_FAIL_MARKER = "[stub-fail]";
const MAX_FIELD_LENGTH = 600;
const MAX_LIST_ITEM_LENGTH = 200;

export interface WorkflowBriefAiKnowledgeContextMeta {
  used: boolean;
  selectedCount: number;
  selectedItemTitles: string[];
  skippedReason: string | null;
  sanitizeFlagCount: number;
  trimmed: boolean;
}

export interface WorkflowBriefAiExecutionInput {
  briefId: string;
  title: string;
  goal: string | null;
  businessContext: string | null;
  targetAudience: string | null;
  offerContext: string | null;
  locationContext: string | null;
  notes: string | null;
  structuredInputJson: unknown;
  finishedAtIso: string;
  /** Sanitized approved-knowledge section from Context Builder — admin-internal prompt input only. */
  approvedKnowledgeSection?: string | null;
  /** Safe metadata for run audit logs — never includes raw knowledge body text. */
  knowledgeContext?: WorkflowBriefAiKnowledgeContextMeta | null;
}

export interface WorkflowBriefMiReportContent {
  summary: string;
  audienceInsights: string[];
  competitorInsights: string[];
  marketSignals: string[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
}

export interface WorkflowBriefSeoReportContent {
  keywordClusters: string[];
  topicIdeas: string[];
  contentAngles: string[];
  internalLinkIdeas: string[];
  seoNotes: string[];
}

export interface WorkflowBriefAiExecutionMeta {
  version: typeof WORKFLOW_BRIEF_AI_RUN_VERSION;
  gateway: AiGatewayExecutionMode;
  model: string;
  generatedAt: string;
  liveProviderCalled: boolean;
  isDeterministic: boolean;
  budget: AiTextBudget;
  safeError: string | null;
}

export interface WorkflowBriefAiExecutionResult {
  ok: boolean;
  mi: WorkflowBriefMiReportContent;
  seo: WorkflowBriefSeoReportContent;
  meta: WorkflowBriefAiExecutionMeta;
  executionLog: string[];
  errorMessage: string | null;
}

function truncateText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trim()}...` : normalized;
}

function normalizeStringList(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? truncateText(entry, MAX_LIST_ITEM_LENGTH) : null))
    .filter(Boolean) as string[];
}

function uniqueNonEmpty(values: Array<string | null | undefined>, maxItems = 8): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = truncateText(value ?? null, MAX_LIST_ITEM_LENGTH);
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(normalized);
    if (output.length >= maxItems) {
      break;
    }
  }
  return output;
}

function readStructuredHints(structuredInputJson: unknown): {
  keywords: string[];
  competitors: string[];
  notes: string[];
} {
  if (!structuredInputJson || typeof structuredInputJson !== "object" || Array.isArray(structuredInputJson)) {
    return { keywords: [], competitors: [], notes: [] };
  }

  const record = structuredInputJson as Record<string, unknown>;
  const keywords = normalizeStringList(record.keywords ?? record.keywordClusters ?? record.priorityKeywords);
  const competitors = normalizeStringList(record.competitors ?? record.competitorNames);
  const notes = normalizeStringList(record.notes ?? record.hints);

  return { keywords, competitors, notes };
}

export function buildWorkflowBriefKnowledgeContextLogLines(
  knowledgeContext: WorkflowBriefAiKnowledgeContextMeta | null | undefined
): string[] {
  if (!knowledgeContext) {
    return ["Approved knowledge context: not loaded."];
  }

  if (!knowledgeContext.used) {
    return [
      `Approved knowledge context skipped: ${knowledgeContext.skippedReason ?? "none eligible"}.`
    ];
  }

  const titles = knowledgeContext.selectedItemTitles.slice(0, 3).join(", ");
  const lines = [
    `Approved knowledge context included: ${knowledgeContext.selectedCount} item(s)${titles ? ` (${titles})` : ""}.`
  ];

  if (knowledgeContext.trimmed) {
    lines.push("Knowledge context trimmed to satisfy workflow token budget.");
  }

  if (knowledgeContext.sanitizeFlagCount > 0) {
    lines.push(`Knowledge context sanitized (${knowledgeContext.sanitizeFlagCount} item(s) with flags).`);
  }

  return lines;
}

export function composeWorkflowBriefAiContextText(input: WorkflowBriefAiExecutionInput): string {
  const briefContext = buildCompactBriefContext(input);
  const knowledgeSection = input.approvedKnowledgeSection?.trim();
  return knowledgeSection ? `${knowledgeSection}\n\n${briefContext}` : briefContext;
}

function buildCompactBriefContext(input: WorkflowBriefAiExecutionInput): string {
  const sections: string[] = [`Brief title: ${input.title}`];

  const goal = truncateText(input.goal, MAX_FIELD_LENGTH);
  if (goal) {
    sections.push(`Goal: ${goal}`);
  }

  const businessContext = truncateText(input.businessContext, MAX_FIELD_LENGTH);
  if (businessContext) {
    sections.push(`Business context: ${businessContext}`);
  }

  const targetAudience = truncateText(input.targetAudience, MAX_FIELD_LENGTH);
  if (targetAudience) {
    sections.push(`Target audience: ${targetAudience}`);
  }

  const offerContext = truncateText(input.offerContext, MAX_FIELD_LENGTH);
  if (offerContext) {
    sections.push(`Offer context: ${offerContext}`);
  }

  const locationContext = truncateText(input.locationContext, MAX_FIELD_LENGTH);
  if (locationContext) {
    sections.push(`Location context: ${locationContext}`);
  }

  const notes = truncateText(input.notes, MAX_FIELD_LENGTH);
  if (notes) {
    sections.push(`Notes: ${notes.replace(/\[stub-fail\]/gi, "").trim()}`);
  }

  const hints = readStructuredHints(input.structuredInputJson);
  if (hints.keywords.length > 0) {
    sections.push(`Structured keywords: ${hints.keywords.join(", ")}`);
  }
  if (hints.competitors.length > 0) {
    sections.push(`Structured competitors: ${hints.competitors.join(", ")}`);
  }
  if (hints.notes.length > 0) {
    sections.push(`Structured hints: ${hints.notes.join("; ")}`);
  }

  return sections.join("\n");
}

function buildExecutionLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

function buildObservabilityBlock(meta: WorkflowBriefAiExecutionMeta): string {
  return `[OBSERVABILITY] ${JSON.stringify({
    version: meta.version,
    gateway: meta.gateway,
    model: meta.model,
    liveProviderCalled: meta.liveProviderCalled,
    isDeterministic: meta.isDeterministic,
    budgetPolicy: meta.budget.budgetPolicy,
    approximateInputTokens: meta.budget.approximateInputTokens,
    maxOutputTokens: meta.budget.maxOutputTokens,
    safeError: meta.safeError
  })}`;
}

function buildDeterministicMiReport(input: WorkflowBriefAiExecutionInput): WorkflowBriefMiReportContent {
  const hints = readStructuredHints(input.structuredInputJson);
  const audience = truncateText(input.targetAudience, MAX_FIELD_LENGTH) ?? "General audience — refine target audience in brief";
  const goal = truncateText(input.goal, MAX_FIELD_LENGTH) ?? "Clarify primary business goal in brief";
  const offer = truncateText(input.offerContext, MAX_FIELD_LENGTH) ?? "Define offer/service focus";
  const location = truncateText(input.locationContext, MAX_FIELD_LENGTH);
  const business = truncateText(input.businessContext, MAX_FIELD_LENGTH);

  const competitorSeeds = uniqueNonEmpty([
    ...hints.competitors,
    business ? `Competitors implied by context: ${business.slice(0, 80)}` : null,
    "Add named competitors in structured input for richer competitor mapping"
  ]);

  const audienceInsights = uniqueNonEmpty([
    `Primary audience: ${audience}`,
    goal ? `Audience goal alignment: ${goal}` : null,
    offer ? `Offer relevance for audience: ${offer}` : null,
    location ? `Geo/market lens: ${location}` : null,
    ...hints.notes.map((note) => `Brief hint: ${note}`)
  ]);

  const marketSignals = uniqueNonEmpty([
    goal ? `Demand signal tied to goal: ${goal}` : null,
    offer ? `Offer positioning signal: ${offer}` : null,
    location ? `Local/regional signal: ${location}` : null,
    hints.keywords.length > 0 ? `Keyword interest: ${hints.keywords.slice(0, 4).join(", ")}` : null,
    business ? `Business context signal: ${business.slice(0, 120)}` : null,
    "Admin-reviewed deterministic analysis — no live crawl performed"
  ]);

  const opportunities = uniqueNonEmpty([
    `Content opportunity around: ${input.title}`,
    goal ? `Pursue goal-aligned messaging: ${goal}` : null,
    offer ? `Differentiate offer: ${offer}` : null,
    hints.keywords.length > 0 ? `Priority keyword themes: ${hints.keywords.slice(0, 3).join(", ")}` : null,
    location ? `Local visibility opportunity in ${location}` : null
  ]);

  const risks = uniqueNonEmpty([
    competitorSeeds.length <= 1 ? "Competitor landscape not fully mapped — add competitor names" : null,
    !input.targetAudience ? "Audience definition is thin — refine before production" : null,
    !input.goal ? "Goal not specified — strategic alignment risk" : null,
    "Deterministic placeholder — validate insights before client-facing use"
  ]);

  const recommendedActions = uniqueNonEmpty([
    "Review MI output and adjust brief fields if needed",
    "Confirm audience and offer positioning with client",
    hints.keywords.length > 0 ? `Validate keyword themes: ${hints.keywords.slice(0, 3).join(", ")}` : "Add keyword hints to structured input",
    "Proceed to SEO report review before content production planning"
  ]);

  const summary = `Market intelligence summary for "${input.title}": ${goal}. Audience focus: ${audience}.${location ? ` Market: ${location}.` : ""}`;

  return {
    summary,
    audienceInsights,
    competitorInsights: competitorSeeds,
    marketSignals,
    opportunities,
    risks,
    recommendedActions
  };
}

function buildDeterministicSeoReport(input: WorkflowBriefAiExecutionInput): WorkflowBriefSeoReportContent {
  const hints = readStructuredHints(input.structuredInputJson);
  const titleTokens = input.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  const keywordSeeds = uniqueNonEmpty([
    ...hints.keywords,
    ...titleTokens.slice(0, 4).map((token) => `${token} ${truncateText(input.locationContext, 40) ?? "services"}`.trim()),
    truncateText(input.goal, 80),
    truncateText(input.offerContext, 80)
  ]);

  const keywordClusters = uniqueNonEmpty(
    keywordSeeds.flatMap((seed, index) => [
      seed,
      index < 3 ? `${seed} guide` : null,
      index < 2 ? `${seed} benefits` : null
    ])
  );

  const topicIdeas = uniqueNonEmpty([
    `${input.title}: audience questions and FAQs`,
    input.goal ? `How to achieve: ${input.goal}` : null,
    input.offerContext ? `${input.offerContext} — buyer decision guide` : null,
    input.targetAudience ? `Content for ${input.targetAudience}` : null,
    input.locationContext ? `Local SEO topics for ${input.locationContext}` : null
  ]);

  const contentAngles = uniqueNonEmpty([
    input.targetAudience ? `Speak directly to ${input.targetAudience}` : null,
    input.offerContext ? `Lead with offer value: ${input.offerContext}` : null,
    input.businessContext ? `Authority angle: ${truncateText(input.businessContext, 100)}` : null,
    "Comparison / alternatives angle (admin review required)",
    "Problem → solution educational angle"
  ]);

  const internalLinkIdeas = uniqueNonEmpty([
    "Link service pages to supporting educational articles",
    "Cross-link location pages with core offer pages",
    "Connect FAQ hub to top conversion pages",
    keywordClusters[0] ? `Hub page for cluster: ${keywordClusters[0]}` : null
  ]);

  const seoNotes = uniqueNonEmpty([
    input.locationContext ? `Local SEO note: emphasize ${input.locationContext} in titles and schema where appropriate` : "No location context — confirm geo targeting before publish",
    hints.keywords.length > 0 ? `Priority keywords from brief: ${hints.keywords.join(", ")}` : "Add keyword hints to structured input for stronger clusters",
    "Deterministic SEO draft — validate search intent manually before production",
    "Keep internal linking suggestions admin-reviewed only"
  ]);

  return {
    keywordClusters,
    topicIdeas,
    contentAngles,
    internalLinkIdeas,
    seoNotes
  };
}

function buildCombinedPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You produce concise admin-only market intelligence and SEO analysis for a workflow brief. Return valid JSON only. Do not include secrets, credentials, or claims about live crawling, publishing, or autonomous execution.",
    userPrompt: [
      "Analyze the workflow brief context and return valid JSON only with this exact shape:",
      JSON.stringify({
        mi: {
          summary: "string",
          audienceInsights: ["string"],
          competitorInsights: ["string"],
          marketSignals: ["string"],
          opportunities: ["string"],
          risks: ["string"],
          recommendedActions: ["string"]
        },
        seo: {
          keywordClusters: ["string"],
          topicIdeas: ["string"],
          contentAngles: ["string"],
          internalLinkIdeas: ["string"],
          seoNotes: ["string"]
        }
      }),
      "Keep each list to at most 6 concise items. Be practical and review-oriented.",
      "",
      contextText
    ].join("\n")
  };
}

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fenced = fencedMatch[1].trim();
    if (fenced.startsWith("{") && fenced.endsWith("}")) {
      return fenced;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

function parseProviderCombinedResult(text: string): {
  mi: WorkflowBriefMiReportContent;
  seo: WorkflowBriefSeoReportContent;
} | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      mi?: Record<string, unknown>;
      seo?: Record<string, unknown>;
    };

    const miRaw = parsed.mi;
    const seoRaw = parsed.seo;
    if (!miRaw || !seoRaw) {
      return null;
    }

    const miSummary = typeof miRaw.summary === "string" ? miRaw.summary.trim() : "";
    if (!miSummary) {
      return null;
    }

    const mi: WorkflowBriefMiReportContent = {
      summary: miSummary,
      audienceInsights: normalizeStringList(miRaw.audienceInsights),
      competitorInsights: normalizeStringList(miRaw.competitorInsights),
      marketSignals: normalizeStringList(miRaw.marketSignals),
      opportunities: normalizeStringList(miRaw.opportunities),
      risks: normalizeStringList(miRaw.risks),
      recommendedActions: normalizeStringList(miRaw.recommendedActions)
    };

    const seo: WorkflowBriefSeoReportContent = {
      keywordClusters: normalizeStringList(seoRaw.keywordClusters),
      topicIdeas: normalizeStringList(seoRaw.topicIdeas),
      contentAngles: normalizeStringList(seoRaw.contentAngles),
      internalLinkIdeas: normalizeStringList(seoRaw.internalLinkIdeas),
      seoNotes: normalizeStringList(seoRaw.seoNotes)
    };

    if (seo.keywordClusters.length === 0 && seo.topicIdeas.length === 0) {
      return null;
    }

    return { mi, seo };
  } catch {
    return null;
  }
}

function shouldSimulateFailure(notes: string | null): boolean {
  return (notes ?? "").toLowerCase().includes(STUB_FAIL_MARKER);
}

function buildMeta(
  gateway: AiGatewayExecutionMode,
  model: string,
  finishedAtIso: string,
  liveProviderCalled: boolean,
  budget: AiTextBudget,
  safeError: string | null
): WorkflowBriefAiExecutionMeta {
  return {
    version: WORKFLOW_BRIEF_AI_RUN_VERSION,
    gateway,
    model,
    generatedAt: finishedAtIso,
    liveProviderCalled,
    isDeterministic: gateway === "local" || !liveProviderCalled,
    budget,
    safeError
  };
}

function buildReportJsonPayload(
  content: WorkflowBriefMiReportContent | WorkflowBriefSeoReportContent,
  meta: WorkflowBriefAiExecutionMeta,
  kind: "mi" | "seo"
): Record<string, unknown> {
  return {
    kind,
    version: WORKFLOW_BRIEF_AI_RUN_VERSION,
    generatedAt: meta.generatedAt,
    gateway: meta.gateway,
    model: meta.model,
    isDeterministic: meta.isDeterministic,
    ...content
  };
}

export function buildWorkflowBriefMiReportJson(
  content: WorkflowBriefMiReportContent,
  meta: WorkflowBriefAiExecutionMeta
): Record<string, unknown> {
  return buildReportJsonPayload(content, meta, "mi");
}

export function buildWorkflowBriefSeoReportJson(
  content: WorkflowBriefSeoReportContent,
  meta: WorkflowBriefAiExecutionMeta
): Record<string, unknown> {
  return buildReportJsonPayload(content, meta, "seo");
}

function buildKnowledgePrefixedExecutionLog(
  input: WorkflowBriefAiExecutionInput,
  bodyLines: string[],
  observabilityLine?: string
): string[] {
  return [
    ...buildExecutionLogEntries(input.finishedAtIso, buildWorkflowBriefKnowledgeContextLogLines(input.knowledgeContext)),
    ...buildExecutionLogEntries(input.finishedAtIso, bodyLines),
    ...(observabilityLine ? [observabilityLine] : [])
  ];
}

function buildLocalSuccessResult(
  input: WorkflowBriefAiExecutionInput,
  preparedContext: ReturnType<typeof prepareAiGatewayV1Context>,
  logPrefix: string
): WorkflowBriefAiExecutionResult {
  const mi = buildDeterministicMiReport(input);
  const seo = buildDeterministicSeoReport(input);
  const budget = toAiTextBudget(preparedContext.budgetDecision);
  const meta = buildMeta("local", "local-deterministic", input.finishedAtIso, false, budget, null);

  const executionLog = buildKnowledgePrefixedExecutionLog(
    input,
    [
      `${logPrefix} Local deterministic MI + SEO generation completed.`,
      "No external AI services were called.",
      `Gateway: ${meta.gateway}.`,
      `Model: ${meta.model}.`,
      `Approximate input tokens: ${budget.approximateInputTokens}.`,
      `Max output tokens: ${budget.maxOutputTokens}.`
    ],
    buildObservabilityBlock(meta)
  );

  return {
    ok: true,
    mi,
    seo,
    meta,
    executionLog,
    errorMessage: null
  };
}

export async function executeWorkflowBriefAiRun(
  input: WorkflowBriefAiExecutionInput,
  config: AiProviderConfig = getAiProviderConfig()
): Promise<WorkflowBriefAiExecutionResult> {
  const contextText = composeWorkflowBriefAiContextText(input);
  const preparedContext = prepareAiGatewayV1Context(contextText, "summary");
  const budget = toAiTextBudget(preparedContext.budgetDecision);

  if (shouldSimulateFailure(input.notes)) {
    const safeError = "Workflow brief AI run failed because brief notes include [stub-fail].";
    const meta = buildMeta("local", "local-deterministic", input.finishedAtIso, false, budget, safeError);
    const executionLog = buildKnowledgePrefixedExecutionLog(input, [
      safeError,
      `Gateway: ${meta.gateway}.`,
      `Model: ${meta.model}.`
    ]);

    return {
      ok: false,
      mi: buildDeterministicMiReport(input),
      seo: buildDeterministicSeoReport(input),
      meta,
      executionLog,
      errorMessage: safeError
    };
  }

  const executionMode = resolveAiGatewayExecutionMode(config);

  // Workflow brief always succeeds locally when provider is disabled or not configured.
  if (executionMode !== "openrouter") {
    const reason =
      executionMode === "disabled"
        ? "AI text gateway disabled — using local deterministic path"
        : "Live provider not enabled or not configured — using local deterministic path";
    return buildLocalSuccessResult(input, preparedContext, reason);
  }

  if (preparedContext.budgetDecision.inputTooLarge) {
    return buildLocalSuccessResult(
      input,
      preparedContext,
      "Context exceeded text budget — falling back to local deterministic path"
    );
  }

  const prompts = buildCombinedPrompt(preparedContext.contextText);
  const gatewayResult = await executeAiGatewayV1ProviderText({
    config,
    outputType: "summary",
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    preparedContext,
    temperature: 0.2
  });

  if (!gatewayResult.ok || !gatewayResult.content) {
    const fallback = buildLocalSuccessResult(
      input,
      preparedContext,
      gatewayResult.safeError
        ? `OpenRouter execution unavailable (${gatewayResult.safeError}) — local fallback`
        : "OpenRouter returned no content — local fallback"
    );
    fallback.meta = buildMeta(
      gatewayResult.audit.executionMode,
      gatewayResult.model,
      input.finishedAtIso,
      gatewayResult.audit.liveProviderCalled,
      budget,
      gatewayResult.safeError
    );
    fallback.executionLog = buildKnowledgePrefixedExecutionLog(
      input,
      [
        "OpenRouter path attempted; falling back to local deterministic MI + SEO generation.",
        gatewayResult.safeError ? `Provider note: ${gatewayResult.safeError}` : "Provider returned no usable content.",
        `Gateway: ${fallback.meta.gateway}.`,
        `Model: ${fallback.meta.model}.`
      ],
      buildObservabilityBlock(fallback.meta)
    );
    return fallback;
  }

  const parsed = parseProviderCombinedResult(gatewayResult.content);
  if (!parsed) {
    const fallback = buildLocalSuccessResult(
      input,
      preparedContext,
      "OpenRouter response was not safely parseable — local fallback"
    );
    fallback.meta = buildMeta(
      "openrouter",
      gatewayResult.model,
      input.finishedAtIso,
      true,
      budget,
      "Provider output was not safely parseable as structured MI + SEO JSON."
    );
    fallback.executionLog = buildKnowledgePrefixedExecutionLog(
      input,
      [
        "OpenRouter response received but not safely parseable; local deterministic fallback used.",
        `Model: ${gatewayResult.model}.`
      ],
      buildObservabilityBlock(fallback.meta)
    );
    return fallback;
  }

  const meta = buildMeta(
    "openrouter",
    gatewayResult.model,
    input.finishedAtIso,
    true,
    budget,
    null
  );

  const executionLog = buildKnowledgePrefixedExecutionLog(
    input,
    [
      "OpenRouter MI + SEO generation completed successfully.",
      `Gateway: ${meta.gateway}.`,
      `Model: ${meta.model}.`,
      `Live provider called: yes.`,
      `Approximate input tokens: ${budget.approximateInputTokens}.`,
      `Max output tokens: ${budget.maxOutputTokens}.`
    ],
    buildObservabilityBlock(meta)
  );

  return {
    ok: true,
    mi: parsed.mi,
    seo: parsed.seo,
    meta,
    executionLog,
    errorMessage: null
  };
}
