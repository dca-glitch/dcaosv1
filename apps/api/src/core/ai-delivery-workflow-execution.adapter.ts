import type { AiProviderConfig } from "../config";
import {
  executeAiGatewayV1ProviderText,
  prepareAiGatewayV1Context,
  resolveAiGatewayExecutionMode,
  type AiGatewayOpenRouterModelSlot,
  type AiGatewayV1PreparedContext
} from "./ai-gateway-v1.service";
import {
  AI_TEXT_BUDGET_POLICY_NAME,
  getAiTextBudgetDecision,
  toAiTextBudget,
  type AiWorkflowOutputType
} from "./ai-text-budget.policy";
import {
  serializeAiWorkflowResultForPlaceholder,
  type AiWorkflowResultV1
} from "./ai-delivery-workflow-result.contract";

export interface AiDeliveryWorkflowExecutionResearchSummaryContext {
  title: string;
  summaryText: string;
  keyFindings: string | null;
  keywordOpportunities: string | null;
  contentRecommendations: string | null;
}

export interface AiDeliveryWorkflowExecutionSourceContext {
  sourceTitle: string | null;
  sourceType: string;
  reviewNotes: string | null;
  researchRequestTitle: string | null;
}

export interface AiDeliveryWorkflowExecutionContentPlanItemContext {
  id: string;
  title: string;
  targetKeyword: string | null;
  contentType: string;
  notes: string | null;
  sortOrder: number;
  approvalStatus: string | null;
}

export interface AiDeliveryWorkflowExecutionMiHandoffContext {
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: string[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
  sourceNote: string | null;
}

export interface AiDeliveryWorkflowExecutionKnowledgeContext {
  used: boolean;
  contextSection: string | null;
  selectedCount: number;
  selectedItemTitles: string[];
  skippedReason: string | null;
  sanitizeFlagCount: number;
  trimmed: boolean;
}

export interface AiDeliveryWorkflowExecutionStartInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  adminNotes: string | null;
  selectedContentPlanItem: AiDeliveryWorkflowExecutionContentPlanItemContext | null;
  startedAtIso: string;
}

export interface AiDeliveryWorkflowExecutionAdapterInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  briefNotes: string | null;
  plannedContentScopeNotes: string | null;
  adminNotes: string | null;
  existingResultPlaceholder: string | null;
  researchSummaries: AiDeliveryWorkflowExecutionResearchSummaryContext[];
  approvedSourceMetadata: AiDeliveryWorkflowExecutionSourceContext[];
  marketIntelligenceHandoffs: AiDeliveryWorkflowExecutionMiHandoffContext[];
  knowledgeContext: AiDeliveryWorkflowExecutionKnowledgeContext | null;
  selectedContentPlanItem: AiDeliveryWorkflowExecutionContentPlanItemContext | null;
  finishedAtIso: string;
}

export interface AiDeliveryGeneratedContentPlanItem {
  title: string;
  targetKeyword: string | null;
  contentType: string;
  notes: string | null;
  sortOrder: number;
  approvalStatus: "DRAFT";
  clientComment: null;
}

export interface AiDeliveryWorkflowExecutionAdapterOutput {
  finishedLogEntries: string[];
  executionError: string | null;
  resultPlaceholder: string | null;
  finalStatus: "FAILED" | "REVIEW";
  workflowResult: AiWorkflowResultV1;
  generatedContentPlanItems: AiDeliveryGeneratedContentPlanItem[] | null;
  generatedContentDraft: {
    title: string;
    slug: string | null;
    draftBody: string;
    notes: string | null;
    contentPlanItemId: string;
  } | null;
}

export interface AiDeliveryWorkflowExecutionAdapter {
  createStartedLogEntries(input: AiDeliveryWorkflowExecutionStartInput): string[];
  execute(input: AiDeliveryWorkflowExecutionAdapterInput): Promise<AiDeliveryWorkflowExecutionAdapterOutput>;
}

function buildGatewayAuditLogLines(preparedContext: AiGatewayV1PreparedContext): string[] {
  const lines: string[] = [];

  if (preparedContext.sanitizeFlags.length > 0) {
    lines.push(`Untrusted context sanitized (${preparedContext.sanitizeFlags.length} flag(s)).`);
  }

  return lines;
}

function buildGatewayProviderAuditLogLines(
  audit: Awaited<ReturnType<typeof executeAiGatewayV1ProviderText>>["audit"],
  modelSlot: AiGatewayOpenRouterModelSlot
): string[] {
  const lines = [
    `Gateway version: ${audit.gatewayVersion}.`,
    `Execution mode: ${audit.executionMode}.`,
    `Live provider called: ${audit.liveProviderCalled ? "yes" : "no"}.`
  ];

  if (audit.providerSkippedReason) {
    lines.push(`Provider skipped: ${audit.providerSkippedReason}.`);
  }

  if (audit.sanitizeFlags.length > 0) {
    lines.push(`Prompt/context sanitize flags: ${audit.sanitizeFlags.length}.`);
  }

  if (audit.liveProviderCalled) {
    lines.push(`Model slot: ${modelSlot}.`);
  }

  return lines;
}

const GENERATE_CONTENT_PLAN_MARKER = "[generate-content-plan]";
const STUB_FAIL_MARKER = "[stub-fail]";
const CONTENT_PLAN_SEARCH_INTENT_PREFIX = /^\[search-intent:([a-z_]+)\]\s*(?:\n|$)/i;
const MAX_BRIEF_NOTES_LENGTH = 800;
const MAX_SCOPE_NOTES_LENGTH = 400;
const MAX_ADMIN_NOTES_LENGTH = 500;
const MAX_RESEARCH_SUMMARY_LENGTH = 220;
const MAX_RESEARCH_FIELD_LENGTH = 160;
const MAX_SOURCE_NOTE_LENGTH = 120;
const MAX_MI_HANDOFF_FIELD_LENGTH = 160;
const MAX_RESULT_SUMMARY_LENGTH = 500;

function getWorkflowOutputType(input: Pick<AiDeliveryWorkflowExecutionAdapterInput, "adminNotes" | "selectedContentPlanItem">): AiWorkflowOutputType {
  if (input.selectedContentPlanItem) {
    return "article_draft";
  }

  return shouldGenerateContentPlan(input.adminNotes) ? "content_plan_draft" : "summary";
}

function truncateText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trim()}...` : normalized;
}

function sanitizeAdminNotesForPrompt(adminNotes: string | null): string | null {
  const normalized = adminNotes?.trim();
  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/\[stub-fail\]/gi, "")
    .replace(/\[generate-content-plan\]/gi, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function buildExecutionLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

function shouldSimulateAiDeliveryWorkflowFailure(adminNotes: string | null): boolean {
  return (adminNotes ?? "").toLowerCase().includes(STUB_FAIL_MARKER);
}

function shouldGenerateContentPlan(adminNotes: string | null): boolean {
  return (adminNotes ?? "").toLowerCase().includes(GENERATE_CONTENT_PLAN_MARKER);
}

function buildMiHandoffExecutionLogLine(handoffs: AiDeliveryWorkflowExecutionMiHandoffContext[]): string | null {
  if (handoffs.length === 0) {
    return null;
  }

  const titles = handoffs.map((handoff) => handoff.title.trim()).filter(Boolean);
  return titles.length > 0
    ? `Applied market intelligence handoff context: ${titles.join(", ")}.`
    : `Applied market intelligence handoff context: ${handoffs.length} record(s).`;
}

function buildKnowledgeContextExecutionLogLines(
  knowledgeContext: AiDeliveryWorkflowExecutionKnowledgeContext | null
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

function parseSearchIntentFromPlanNotes(notes: string | null | undefined): string | null {
  if (!notes) {
    return null;
  }

  const match = notes.match(CONTENT_PLAN_SEARCH_INTENT_PREFIX);
  return match?.[1]?.toLowerCase() ?? null;
}

function getOpenRouterFallbackReason(config: AiProviderConfig): string | null {
  if (config.textGateway !== "openrouter") {
    return null;
  }

  if (!config.hasOpenRouterApiKey) {
    return "OpenRouter API key is not configured";
  }

  if (!config.openRouterTextPrimaryModel) {
    return "OpenRouter primary text model is not configured";
  }

  return null;
}

function buildCompactContextText(input: AiDeliveryWorkflowExecutionAdapterInput): string {
  const sections: string[] = [
    `Project: ${input.projectName}`,
    `Target month: ${input.targetMonth}`,
    `Brief status: ${input.briefStatus}`
  ];

  const briefNotes = truncateText(input.briefNotes, MAX_BRIEF_NOTES_LENGTH);
  if (briefNotes) {
    sections.push(`Brief notes: ${briefNotes}`);
  }

  const scopeNotes = truncateText(input.plannedContentScopeNotes, MAX_SCOPE_NOTES_LENGTH);
  if (scopeNotes) {
    sections.push(`Scope notes: ${scopeNotes}`);
  }

  const adminNotes = truncateText(sanitizeAdminNotesForPrompt(input.adminNotes), MAX_ADMIN_NOTES_LENGTH);
  if (adminNotes) {
    sections.push(`Admin notes: ${adminNotes}`);
  }

  if (input.selectedContentPlanItem) {
    sections.push("Selected content plan item:");
    sections.push([
      input.selectedContentPlanItem.title,
      input.selectedContentPlanItem.targetKeyword ? `Keyword: ${input.selectedContentPlanItem.targetKeyword}` : null,
      `Type: ${input.selectedContentPlanItem.contentType}`,
      input.selectedContentPlanItem.notes ? `Notes: ${truncateText(input.selectedContentPlanItem.notes, MAX_RESEARCH_SUMMARY_LENGTH)}` : null,
      input.selectedContentPlanItem.approvalStatus ? `Approval status: ${input.selectedContentPlanItem.approvalStatus}` : null
    ].filter(Boolean).join(" | "));
  }

  if (input.researchSummaries.length > 0) {
    sections.push("Research summaries:");
    for (const summary of input.researchSummaries.slice(0, 3)) {
      const summaryParts = [
        summary.title.trim(),
        truncateText(summary.summaryText, MAX_RESEARCH_SUMMARY_LENGTH),
        truncateText(summary.keyFindings, MAX_RESEARCH_FIELD_LENGTH),
        truncateText(summary.keywordOpportunities, MAX_RESEARCH_FIELD_LENGTH),
        truncateText(summary.contentRecommendations, MAX_RESEARCH_FIELD_LENGTH)
      ].filter(Boolean) as string[];

      sections.push(`- ${summaryParts.join(" | ")}`);
    }
  }

  if (input.approvedSourceMetadata.length > 0) {
    sections.push("Approved source metadata:");
    for (const source of input.approvedSourceMetadata.slice(0, 4)) {
      const sourceParts = [
        source.sourceTitle?.trim() || "Untitled source",
        source.sourceType,
        source.researchRequestTitle ? `Request: ${source.researchRequestTitle}` : null,
        truncateText(source.reviewNotes, MAX_SOURCE_NOTE_LENGTH)
      ].filter(Boolean) as string[];

      sections.push(`- ${sourceParts.join(" | ")}`);
    }
  }

  if (input.marketIntelligenceHandoffs.length > 0) {
    sections.push("Market intelligence handoff context (admin-internal):");
    for (const handoff of input.marketIntelligenceHandoffs.slice(0, 2)) {
      const handoffParts = [
        handoff.title.trim(),
        truncateText(handoff.marketSummary, MAX_MI_HANDOFF_FIELD_LENGTH),
        handoff.competitorSummary ? `Competitors: ${truncateText(handoff.competitorSummary, MAX_MI_HANDOFF_FIELD_LENGTH)}` : null,
        handoff.audienceSignals.length > 0 ? `Audience: ${handoff.audienceSignals.slice(0, 3).join("; ")}` : null,
        handoff.opportunities.length > 0 ? `Opportunities: ${handoff.opportunities.slice(0, 3).join("; ")}` : null,
        handoff.risks.length > 0 ? `Risks: ${handoff.risks.slice(0, 2).join("; ")}` : null,
        handoff.recommendedActions.length > 0 ? `Actions: ${handoff.recommendedActions.slice(0, 3).join("; ")}` : null,
        truncateText(handoff.sourceNote, MAX_SOURCE_NOTE_LENGTH)
      ].filter(Boolean) as string[];

      sections.push(`- ${handoffParts.join(" | ")}`);
    }
  }

  if (input.knowledgeContext?.used && input.knowledgeContext.contextSection) {
    sections.push(input.knowledgeContext.contextSection);
  }

  return sections.join("\n");
}

function createWorkflowResult(
  gateway: "disabled" | "local" | "openrouter",
  model: string,
  outputType: AiWorkflowOutputType,
  generatedAt: string,
  title: string,
  summary: string,
  structuredContent: Record<string, unknown> | null,
  safeError: string | null,
  maxOutputTokens: number,
  approximateInputTokens: number
): AiWorkflowResultV1 {
  return {
    version: "AI_WORKFLOW_RESULT_V1",
    gateway,
    model,
    outputType,
    generatedAt,
    title,
    summary,
    structuredContent,
    safeError,
    budget: toAiTextBudget(
      getAiTextBudgetDecision(outputType, approximateInputTokens)
    )
  };
}

function buildDeterministicContentPlanItems(input: AiDeliveryWorkflowExecutionAdapterInput): AiDeliveryGeneratedContentPlanItem[] {
  const seeds = [
    ...input.researchSummaries.flatMap((summary) => [
      truncateText(summary.title, 80),
      truncateText(summary.keywordOpportunities, 80),
      truncateText(summary.contentRecommendations, 80)
    ]),
    ...input.marketIntelligenceHandoffs.flatMap((handoff) => [
      truncateText(handoff.marketSummary, 80),
      truncateText(handoff.competitorSummary, 80),
      ...handoff.opportunities.map((entry) => truncateText(entry, 80)),
      ...handoff.recommendedActions.map((entry) => truncateText(entry, 80)),
      ...handoff.audienceSignals.map((entry) => truncateText(entry, 80))
    ]),
    ...input.approvedSourceMetadata.map((source) => truncateText(source.sourceTitle, 80)),
    truncateText(input.plannedContentScopeNotes, 80),
    truncateText(input.briefNotes, 80),
    truncateText(sanitizeAdminNotesForPrompt(input.adminNotes), 80)
  ].filter(Boolean) as string[];

  const uniqueSeeds = Array.from(new Set(seeds.map((seed) => seed.trim()).filter(Boolean)));
  const fallbackSeeds = [
    `${input.projectName} monthly SEO priorities`,
    `${input.projectName} audience questions`,
    `${input.projectName} conversion opportunities`,
    `${input.projectName} competitor and positioning topics`
  ];
  const topics = [...uniqueSeeds, ...fallbackSeeds].slice(0, 4);

  return topics.map((topic, index) => {
    const normalizedKeyword = topic.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim();
    return {
      title: `${input.projectName}: ${topic}`,
      targetKeyword: truncateText(normalizedKeyword, 120),
      contentType: "article",
      notes: truncateText(`AI SEO draft rationale for ${input.targetMonth}: ${topic}`, 220),
      sortOrder: index,
      approvalStatus: "DRAFT",
      clientComment: null
    };
  });
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

function parseContentPlanItemsFromProviderText(text: string): {
  title: string;
  summary: string;
  items: AiDeliveryGeneratedContentPlanItem[];
} | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      title?: unknown;
      summary?: unknown;
      items?: unknown;
    };

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const normalizedItems = items
      .map((item, index) => {
        const value = item as Record<string, unknown>;
        const itemTitle = typeof value.title === "string" ? value.title.trim() : "";
        if (!itemTitle) {
          return null;
        }

        const targetKeyword = typeof value.targetKeyword === "string" ? value.targetKeyword.trim() : null;
        const contentType = typeof value.contentType === "string" && value.contentType.trim()
          ? value.contentType.trim()
          : "article";
        const rationale = typeof value.rationale === "string" ? value.rationale.trim() : null;

        return {
          title: itemTitle,
          targetKeyword: truncateText(targetKeyword, 120),
          contentType: truncateText(contentType, 60) ?? "article",
          notes: truncateText(rationale, 220),
          sortOrder: index,
          approvalStatus: "DRAFT" as const,
          clientComment: null
        };
      })
      .filter(Boolean) as AiDeliveryGeneratedContentPlanItem[];

    if (!title || !summary || normalizedItems.length === 0) {
      return null;
    }

    return {
      title,
      summary,
      items: normalizedItems
    };
  } catch {
    return null;
  }
}

function buildContentPlanPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You create concise admin-only SEO monthly content plan drafts. Return valid JSON only. Do not claim publication, client delivery, approvals, crawling, or autonomous execution.",
    userPrompt: [
      "Produce a short admin-facing monthly SEO content plan draft.",
      "Return valid JSON only with this shape:",
      '{"title":"string","summary":"string","items":[{"title":"string","targetKeyword":"string","contentType":"article","rationale":"string"}]}',
      "Keep items concise and practical.",
      "",
      contextText
    ].join("\n")
  };
}

function buildSlugFromText(value: string): string | null {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized ? normalized.slice(0, 80) : null;
}

function buildDeterministicContentDraft(input: AiDeliveryWorkflowExecutionAdapterInput): {
  title: string;
  slug: string | null;
  draftBody: string;
  notes: string | null;
  summary: string;
} {
  const selectedItem = input.selectedContentPlanItem;
  if (!selectedItem) {
    return {
      title: `${input.projectName} content draft`,
      slug: buildSlugFromText(`${input.projectName} content draft`),
      draftBody: `# ${input.projectName} content draft\n\nAdmin-only deterministic draft placeholder.`,
      notes: "Generated without a selected content plan item.",
      summary: "Local deterministic content draft prepared for admin review."
    };
  }

  const title = selectedItem.title.trim();
  const primaryKeyword = truncateText(selectedItem.targetKeyword, 120) ?? buildSlugFromText(title)?.replace(/-/g, " ") ?? input.projectName;
  const searchIntent = parseSearchIntentFromPlanNotes(selectedItem.notes);
  const supportingNote = truncateText(selectedItem.notes?.replace(CONTENT_PLAN_SEARCH_INTENT_PREFIX, "").trimStart(), 220)
    ?? "Focus this article on a practical, admin-reviewable draft aligned to the selected content plan item.";
  const primaryHandoff = input.marketIntelligenceHandoffs[0] ?? null;
  const marketContextLines = primaryHandoff
    ? [
        "",
        `## Market Context (admin-internal)`,
        truncateText(primaryHandoff.marketSummary, 220) ?? "Applied market intelligence handoff informs this draft angle.",
        primaryHandoff.competitorSummary ? `Competitor signals: ${truncateText(primaryHandoff.competitorSummary, 180)}` : null,
        primaryHandoff.opportunities.length > 0 ? `Opportunities: ${primaryHandoff.opportunities.slice(0, 3).join("; ")}` : null,
        primaryHandoff.recommendedActions.length > 0 ? `Recommended actions: ${primaryHandoff.recommendedActions.slice(0, 3).join("; ")}` : null
      ].filter(Boolean) as string[]
    : [];
  const draftBody = [
    `# ${title}`,
    "",
    `## Overview`,
    `${input.projectName} is preparing a ${selectedItem.contentType} draft for ${input.targetMonth} focused on ${primaryKeyword}${searchIntent ? ` with ${searchIntent} search intent` : ""}. This admin-only draft is intended for internal review before any client-facing workflow.`,
    "",
    `## Why This Topic Matters`,
    `The selected content plan item emphasizes ${primaryKeyword}. Use this section to frame the audience problem, the business relevance, and the angle that best matches the current brief status of ${input.briefStatus}.`,
    ...marketContextLines,
    "",
    `## Draft Outline`,
    `- Introduce the core audience challenge tied to ${primaryKeyword}.`,
    `- Explain the recommended approach, examples, or service angle for ${input.projectName}.`,
    `- Close with a practical next step or CTA suitable for later admin review.`,
    "",
    `## Working Notes`,
    supportingNote
  ].join("\n");

  return {
    title,
    slug: buildSlugFromText(selectedItem.targetKeyword ?? title),
    draftBody,
    notes: truncateText(`Generated from content plan item "${title}" for ${input.targetMonth}.`, 220),
    summary: `Local deterministic content draft prepared for admin review from selected content plan item "${title}".`
  };
}

function parseContentDraftFromProviderText(text: string): {
  title: string;
  slug: string | null;
  summary: string;
  draftBody: string;
  notes: string | null;
} | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as {
      title?: unknown;
      slug?: unknown;
      summary?: unknown;
      draftBody?: unknown;
      notes?: unknown;
    };

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const draftBody = typeof parsed.draftBody === "string" ? parsed.draftBody.trim() : "";
    const slugCandidate = typeof parsed.slug === "string" ? parsed.slug.trim() : "";
    const notes = typeof parsed.notes === "string" ? parsed.notes.trim() : null;

    if (!title || !summary || !draftBody) {
      return null;
    }

    return {
      title,
      slug: buildSlugFromText(slugCandidate || title),
      summary,
      draftBody,
      notes: truncateText(notes, 220)
    };
  } catch {
    return null;
  }
}

function buildContentDraftPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You create concise admin-only article drafts from a selected content plan item. Return valid JSON only. Do not claim publication, client delivery, approvals, crawling, or autonomous execution.",
    userPrompt: [
      "Produce a short admin-facing article draft from the selected content plan item.",
      "Return valid JSON only with this shape:",
      '{"title":"string","slug":"string","summary":"string","draftBody":"string","notes":"string"}',
      "Keep the draft practical, reviewable, and internally focused.",
      "",
      contextText
    ].join("\n")
  };
}

function buildSummaryPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You write concise admin-only workflow execution summaries. Do not include secrets or claim client delivery, publishing, approvals, crawling, or autonomous execution.",
    userPrompt: [
      "Create a short admin-facing workflow execution summary for DCA OS Lite.",
      "",
      contextText
    ].join("\n")
  };
}

function createDisabledAiDeliveryWorkflowExecutionAdapter(): AiDeliveryWorkflowExecutionAdapter {
  return {
    createStartedLogEntries(input) {
      const outputType = getWorkflowOutputType(input);
      return buildExecutionLogEntries(input.startedAtIso, [
        "AI text execution is disabled by configuration.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        `Output type: ${outputType}.`,
        "No provider or local deterministic generation was attempted."
      ]);
    },
    async execute(input) {
      const outputType = getWorkflowOutputType(input);
      const preparedContext = prepareAiGatewayV1Context(buildCompactContextText(input), outputType);
      const safeError = "AI text execution is disabled by configuration.";
      const workflowResult = createWorkflowResult(
        "disabled",
        "ai-disabled",
        outputType,
        input.finishedAtIso,
        `${input.projectName} AI execution disabled`,
        safeError,
        null,
        safeError,
        preparedContext.budgetDecision.maxOutputTokens,
        preparedContext.budgetDecision.approximateInputTokens
      );

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          safeError,
          `Gateway: ${workflowResult.gateway}.`,
          `Model: ${workflowResult.model}.`,
          `Output type: ${workflowResult.outputType}.`,
          ...buildGatewayAuditLogLines(preparedContext),
          ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext)
        ]),
        executionError: safeError,
        resultPlaceholder: null,
        finalStatus: "FAILED",
        workflowResult,
        generatedContentPlanItems: null,
        generatedContentDraft: null
      };
    }
  };
}

export function createLocalAiDeliveryWorkflowExecutionAdapter(): AiDeliveryWorkflowExecutionAdapter {
  return {
    createStartedLogEntries(input) {
      const outputType = getWorkflowOutputType(input);
      return buildExecutionLogEntries(input.startedAtIso, [
        "Stub execution started.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        `Output type: ${outputType}.`,
        "Local deterministic execution only. No external AI services were called."
      ]);
    },
    async execute(input) {
      if (shouldSimulateAiDeliveryWorkflowFailure(input.adminNotes)) {
        const approximateInputTokens = getAiTextBudgetDecision("summary", 0).approximateInputTokens;
        const workflowResult = createWorkflowResult(
          "local",
          "local-deterministic",
          "summary",
          input.finishedAtIso,
          "AI workflow execution failed",
          "Local deterministic workflow execution failed because admin notes include [stub-fail].",
          null,
          "Stub execution failed because admin notes include [stub-fail].",
          getAiTextBudgetDecision("summary", approximateInputTokens).maxOutputTokens,
          approximateInputTokens
        );
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            `Stub execution failed: ${workflowResult.safeError}`,
            `Gateway: ${workflowResult.gateway}.`,
            `Model: ${workflowResult.model}.`,
            `Output type: ${workflowResult.outputType}.`,
            `Budget policy: ${workflowResult.budget.budgetPolicy}.`
          ]),
          executionError: workflowResult.safeError,
          resultPlaceholder: null,
          finalStatus: "FAILED",
          workflowResult,
          generatedContentPlanItems: null,
          generatedContentDraft: null
        };
      }

      const outputType = getWorkflowOutputType(input);
      const preparedContext = prepareAiGatewayV1Context(buildCompactContextText(input), outputType);
      const effectiveBudgetDecision = preparedContext.budgetDecision;

      if (outputType === "content_plan_draft") {
        const generatedContentPlanItems = buildDeterministicContentPlanItems(input);
        const structuredContent = {
          itemCount: generatedContentPlanItems.length,
          items: generatedContentPlanItems
        };
        const workflowResult = createWorkflowResult(
          "local",
          "local-deterministic",
          outputType,
          input.finishedAtIso,
          `${input.projectName} monthly SEO content plan draft`,
          `Local deterministic content plan draft prepared for admin review with ${generatedContentPlanItems.length} item(s).`,
          structuredContent,
          null,
          effectiveBudgetDecision.maxOutputTokens,
          effectiveBudgetDecision.approximateInputTokens
        );

        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            "Stub content plan draft generated successfully.",
            ...(buildMiHandoffExecutionLogLine(input.marketIntelligenceHandoffs)
              ? [buildMiHandoffExecutionLogLine(input.marketIntelligenceHandoffs)!]
              : []),
            ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
            `Gateway: ${workflowResult.gateway}.`,
            `Model: ${workflowResult.model}.`,
            `Output type: ${workflowResult.outputType}.`,
            `Approximate input tokens: ${workflowResult.budget.approximateInputTokens}.`,
            `Max output tokens: ${workflowResult.budget.maxOutputTokens}.`,
            `Budget policy: ${workflowResult.budget.budgetPolicy}.`
          ]),
          executionError: null,
          resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
          finalStatus: "REVIEW",
          workflowResult,
          generatedContentPlanItems,
          generatedContentDraft: null
        };
      }

      if (outputType === "article_draft") {
        const generatedContentDraft = buildDeterministicContentDraft(input);
        const workflowResult = createWorkflowResult(
          "local",
          "local-deterministic",
          outputType,
          input.finishedAtIso,
          generatedContentDraft.title,
          generatedContentDraft.summary,
          {
            slug: generatedContentDraft.slug,
            draftBody: generatedContentDraft.draftBody,
            notes: generatedContentDraft.notes,
            contentPlanItemId: input.selectedContentPlanItem?.id ?? null
          },
          null,
          effectiveBudgetDecision.maxOutputTokens,
          effectiveBudgetDecision.approximateInputTokens
        );

        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            "Stub content draft generated successfully.",
            ...(buildMiHandoffExecutionLogLine(input.marketIntelligenceHandoffs)
              ? [buildMiHandoffExecutionLogLine(input.marketIntelligenceHandoffs)!]
              : []),
            ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
            `Gateway: ${workflowResult.gateway}.`,
            `Model: ${workflowResult.model}.`,
            `Output type: ${workflowResult.outputType}.`,
            `Approximate input tokens: ${workflowResult.budget.approximateInputTokens}.`,
            `Max output tokens: ${workflowResult.budget.maxOutputTokens}.`,
            `Budget policy: ${workflowResult.budget.budgetPolicy}.`
          ]),
          executionError: null,
          resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
          finalStatus: "REVIEW",
          workflowResult,
          generatedContentPlanItems: null,
          generatedContentDraft: input.selectedContentPlanItem
            ? {
                title: generatedContentDraft.title,
                slug: generatedContentDraft.slug,
                draftBody: generatedContentDraft.draftBody,
                notes: generatedContentDraft.notes,
                contentPlanItemId: input.selectedContentPlanItem.id
              }
            : null
        };
      }

      const summaryText =
        input.existingResultPlaceholder?.trim() ||
        `Stub workflow output prepared for admin review for ${input.projectName} (${input.targetMonth}). No external AI services were called.`;
      const workflowResult = createWorkflowResult(
        "local",
        "local-deterministic",
        outputType,
        input.finishedAtIso,
        `${input.projectName} workflow execution summary`,
        summaryText,
        null,
        null,
        effectiveBudgetDecision.maxOutputTokens,
        effectiveBudgetDecision.approximateInputTokens
      );

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          "Stub execution completed successfully.",
          ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
          `Gateway: ${workflowResult.gateway}.`,
          `Model: ${workflowResult.model}.`,
          `Output type: ${workflowResult.outputType}.`,
          `Approximate input tokens: ${workflowResult.budget.approximateInputTokens}.`,
          `Max output tokens: ${workflowResult.budget.maxOutputTokens}.`,
          `Budget policy: ${workflowResult.budget.budgetPolicy}.`
        ]),
        executionError: null,
        resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
        finalStatus: "REVIEW",
        workflowResult,
        generatedContentPlanItems: null,
        generatedContentDraft: null
      };
    }
  };
}

export function createAiDeliveryWorkflowExecutionAdapter(config: AiProviderConfig): AiDeliveryWorkflowExecutionAdapter {
  const localAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();
  const executionMode = resolveAiGatewayExecutionMode(config);

  if (executionMode === "disabled") {
    return createDisabledAiDeliveryWorkflowExecutionAdapter();
  }

  if (executionMode !== "openrouter") {
    const fallbackReason = getOpenRouterFallbackReason(config);
    if (fallbackReason) {
      return {
        createStartedLogEntries(input) {
          return [
            ...localAdapter.createStartedLogEntries(input),
            ...buildExecutionLogEntries(input.startedAtIso, [
              `OpenRouter gateway requested but not fully configured (${fallbackReason}); falling back to local deterministic adapter.`
            ])
          ];
        },
        execute(input) {
          return localAdapter.execute(input);
        }
      };
    }

    return localAdapter;
  }

  return {
    createStartedLogEntries(input) {
      const outputType = getWorkflowOutputType(input);
      return buildExecutionLogEntries(input.startedAtIso, [
        "OpenRouter text execution started.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        `Output type: ${outputType}.`,
        "Provider call remains outside Prisma transactions."
      ]);
    },
    async execute(input) {
      const outputType = getWorkflowOutputType(input);
      const preparedContext = prepareAiGatewayV1Context(buildCompactContextText(input), outputType);
      const contextText = preparedContext.contextText;
      const budgetDecision = preparedContext.budgetDecision;

      const prompts = outputType === "content_plan_draft"
        ? buildContentPlanPrompt(contextText)
        : outputType === "article_draft"
          ? buildContentDraftPrompt(contextText)
          : buildSummaryPrompt(contextText);

      const gatewayResult = await executeAiGatewayV1ProviderText({
        config,
        outputType,
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
        preparedContext,
        temperature: outputType === "content_plan_draft" ? 0.3 : 0.2
      });

      if (!gatewayResult.ok) {
        const safeError = gatewayResult.safeError ?? "OpenRouter text execution failed.";
        const workflowResult = createWorkflowResult(
          "openrouter",
          gatewayResult.model,
          outputType,
          input.finishedAtIso,
          gatewayResult.audit.inputTooLarge
            ? `${input.projectName} execution blocked by budget policy`
            : `${input.projectName} OpenRouter execution failed`,
          safeError,
          null,
          safeError,
          budgetDecision.maxOutputTokens,
          budgetDecision.approximateInputTokens
        );
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            gatewayResult.audit.inputTooLarge
              ? `OpenRouter execution blocked by budget policy ${AI_TEXT_BUDGET_POLICY_NAME}.`
              : `OpenRouter text execution failed: ${safeError}`,
            ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
            ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
            `Model: ${gatewayResult.model}.`,
            `Output type: ${outputType}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Budget policy: ${budgetDecision.budgetPolicy}.`,
            `Safe error: ${safeError}`
          ]),
          executionError: safeError,
          resultPlaceholder: null,
          finalStatus: "FAILED",
          workflowResult,
          generatedContentPlanItems: null,
          generatedContentDraft: null
        };
      }

      if (outputType === "content_plan_draft") {
        const providerContent = gatewayResult.content ?? "";
        const parsed = parseContentPlanItemsFromProviderText(providerContent);
        if (!parsed) {
          const safeSummary = "OpenRouter returned a response, but it was not safely parseable as the expected content plan JSON. No content plan items were persisted.";
          const safeError = "Provider output was not safely parseable as structured content plan JSON.";
          const workflowResult = createWorkflowResult(
            "openrouter",
            gatewayResult.model,
            outputType,
            input.finishedAtIso,
            `${input.projectName} content plan draft needs admin review`,
            safeSummary,
            null,
            safeError,
            budgetDecision.maxOutputTokens,
            budgetDecision.approximateInputTokens
          );
          return {
            finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
              "OpenRouter content plan response was not safely parseable as JSON.",
              ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
              `Model: ${gatewayResult.model}.`,
              `Output type: ${outputType}.`,
              `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
              `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
              `Budget policy: ${budgetDecision.budgetPolicy}.`
            ]),
            executionError: null,
            resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
            finalStatus: "REVIEW",
            workflowResult,
            generatedContentPlanItems: null,
            generatedContentDraft: null
          };
        }

        const workflowResult = createWorkflowResult(
          "openrouter",
          gatewayResult.model,
          outputType,
          input.finishedAtIso,
          parsed.title,
          parsed.summary,
          {
            itemCount: parsed.items.length,
            items: parsed.items
          },
          null,
          budgetDecision.maxOutputTokens,
          budgetDecision.approximateInputTokens
        );

        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            "OpenRouter text execution completed successfully.",
            ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
            ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
            `Model: ${gatewayResult.model}.`,
            `Output type: ${outputType}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Budget policy: ${budgetDecision.budgetPolicy}.`
          ]),
          executionError: null,
          resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
          finalStatus: "REVIEW",
          workflowResult,
          generatedContentPlanItems: parsed.items,
          generatedContentDraft: null
        };
      }

      if (outputType === "article_draft") {
        const providerContent = gatewayResult.content ?? "";
        const parsed = parseContentDraftFromProviderText(providerContent);
        if (!parsed) {
          const safeSummary = "OpenRouter returned a response, but it was not safely parseable as the expected article draft JSON. No content draft was persisted.";
          const safeError = "Provider output was not safely parseable as structured article draft JSON.";
          const workflowResult = createWorkflowResult(
            "openrouter",
            gatewayResult.model,
            outputType,
            input.finishedAtIso,
            `${input.projectName} content draft needs admin review`,
            safeSummary,
            null,
            safeError,
            budgetDecision.maxOutputTokens,
            budgetDecision.approximateInputTokens
          );
          return {
            finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
              "OpenRouter content draft response was not safely parseable as JSON.",
              ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
              `Model: ${gatewayResult.model}.`,
              `Output type: ${outputType}.`,
              `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
              `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
              `Budget policy: ${budgetDecision.budgetPolicy}.`
            ]),
            executionError: null,
            resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
            finalStatus: "REVIEW",
            workflowResult,
            generatedContentPlanItems: null,
            generatedContentDraft: null
          };
        }

        const workflowResult = createWorkflowResult(
          "openrouter",
          gatewayResult.model,
          outputType,
          input.finishedAtIso,
          parsed.title,
          parsed.summary,
          {
            slug: parsed.slug,
            draftBody: parsed.draftBody,
            notes: parsed.notes,
            contentPlanItemId: input.selectedContentPlanItem?.id ?? null
          },
          null,
          budgetDecision.maxOutputTokens,
          budgetDecision.approximateInputTokens
        );

        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            "OpenRouter text execution completed successfully.",
            ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
            ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
            `Model: ${gatewayResult.model}.`,
            `Output type: ${outputType}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Budget policy: ${budgetDecision.budgetPolicy}.`
          ]),
          executionError: null,
          resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
          finalStatus: "REVIEW",
          workflowResult,
          generatedContentPlanItems: null,
          generatedContentDraft: input.selectedContentPlanItem
            ? {
                title: parsed.title,
                slug: parsed.slug,
                draftBody: parsed.draftBody,
                notes: parsed.notes,
                contentPlanItemId: input.selectedContentPlanItem.id
              }
            : null
        };
      }

      const workflowResult = createWorkflowResult(
        "openrouter",
        gatewayResult.model,
        outputType,
        input.finishedAtIso,
        `${input.projectName} workflow execution summary`,
        truncateText(gatewayResult.content, MAX_RESULT_SUMMARY_LENGTH) ?? "OpenRouter returned an empty summary.",
        null,
        null,
        budgetDecision.maxOutputTokens,
        budgetDecision.approximateInputTokens
      );

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          "OpenRouter text execution completed successfully.",
          ...buildGatewayProviderAuditLogLines(gatewayResult.audit, gatewayResult.modelSlot),
          ...buildKnowledgeContextExecutionLogLines(input.knowledgeContext),
          `Model: ${gatewayResult.model}.`,
          `Output type: ${outputType}.`,
          `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
          `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
          `Budget policy: ${budgetDecision.budgetPolicy}.`
        ]),
        executionError: null,
        resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
        finalStatus: "REVIEW",
        workflowResult,
        generatedContentPlanItems: null,
        generatedContentDraft: null
      };
    }
  };
}

export const localAiDeliveryWorkflowExecutionAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();
