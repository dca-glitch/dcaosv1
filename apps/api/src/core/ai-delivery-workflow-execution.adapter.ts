import type { AiProviderConfig } from "../config";
import { executeOpenRouterTextRequest } from "../services/openrouter-text.service";
import {
  AI_TEXT_BUDGET_POLICY_NAME,
  estimateApproximateInputTokens,
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

export interface AiDeliveryWorkflowExecutionStartInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  adminNotes: string | null;
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
}

export interface AiDeliveryWorkflowExecutionAdapter {
  createStartedLogEntries(input: AiDeliveryWorkflowExecutionStartInput): string[];
  execute(input: AiDeliveryWorkflowExecutionAdapterInput): Promise<AiDeliveryWorkflowExecutionAdapterOutput>;
}

type OpenRouterModelSelection = {
  model: string;
  slot: "primary" | "long_context";
};

const GENERATE_CONTENT_PLAN_MARKER = "[generate-content-plan]";
const STUB_FAIL_MARKER = "[stub-fail]";
const MAX_BRIEF_NOTES_LENGTH = 800;
const MAX_SCOPE_NOTES_LENGTH = 400;
const MAX_ADMIN_NOTES_LENGTH = 500;
const MAX_RESEARCH_SUMMARY_LENGTH = 220;
const MAX_RESEARCH_FIELD_LENGTH = 160;
const MAX_SOURCE_NOTE_LENGTH = 120;
const MAX_RESULT_SUMMARY_LENGTH = 500;

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

  return sections.join("\n");
}

function selectOpenRouterModel(config: AiProviderConfig, approximateInputTokens: number): OpenRouterModelSelection {
  if (approximateInputTokens > 1800 && config.openRouterTextLongContextModel) {
    return {
      model: config.openRouterTextLongContextModel,
      slot: "long_context"
    };
  }

  return {
    model: config.openRouterTextPrimaryModel ?? "unknown-model",
    slot: "primary"
  };
}

function createWorkflowResult(
  gateway: "local" | "openrouter",
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

export function createLocalAiDeliveryWorkflowExecutionAdapter(): AiDeliveryWorkflowExecutionAdapter {
  return {
    createStartedLogEntries(input) {
      const outputType = shouldGenerateContentPlan(input.adminNotes) ? "content_plan_draft" : "summary";
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
          generatedContentPlanItems: null
        };
      }

      const outputType: AiWorkflowOutputType = shouldGenerateContentPlan(input.adminNotes) ? "content_plan_draft" : "summary";
      const contextText = buildCompactContextText(input);
      const approximateInputTokens = estimateApproximateInputTokens(contextText);
      const effectiveBudgetDecision = getAiTextBudgetDecision(outputType, approximateInputTokens);

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
          generatedContentPlanItems
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
        generatedContentPlanItems: null
      };
    }
  };
}

export function createAiDeliveryWorkflowExecutionAdapter(config: AiProviderConfig): AiDeliveryWorkflowExecutionAdapter {
  const localAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();

  if (config.textGateway !== "openrouter") {
    return localAdapter;
  }

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

  return {
    createStartedLogEntries(input) {
      const outputType = shouldGenerateContentPlan(input.adminNotes) ? "content_plan_draft" : "summary";
      return buildExecutionLogEntries(input.startedAtIso, [
        "OpenRouter text execution started.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        `Output type: ${outputType}.`,
        "Provider call remains outside Prisma transactions."
      ]);
    },
    async execute(input) {
      const outputType: AiWorkflowOutputType = shouldGenerateContentPlan(input.adminNotes) ? "content_plan_draft" : "summary";
      const contextText = buildCompactContextText(input);
      const approximateInputTokens = estimateApproximateInputTokens(contextText);
      const budgetDecision = getAiTextBudgetDecision(outputType, approximateInputTokens);

      if (budgetDecision.inputTooLarge) {
        const safeError = "Workflow context is too large for the current text budget policy. Reduce admin notes or compact supporting context before retrying.";
        const workflowResult = createWorkflowResult(
          "openrouter",
          config.openRouterTextPrimaryModel ?? "openrouter-unconfigured",
          outputType,
          input.finishedAtIso,
          `${input.projectName} execution blocked by budget policy`,
          safeError,
          null,
          safeError,
          budgetDecision.maxOutputTokens,
          budgetDecision.approximateInputTokens
        );
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            `OpenRouter execution blocked by budget policy ${AI_TEXT_BUDGET_POLICY_NAME}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Safe error: ${safeError}`
          ]),
          executionError: safeError,
          resultPlaceholder: null,
          finalStatus: "FAILED",
          workflowResult,
          generatedContentPlanItems: null
        };
      }

      const selectedModel = selectOpenRouterModel(config, budgetDecision.approximateInputTokens);
      const prompts = outputType === "content_plan_draft"
        ? buildContentPlanPrompt(contextText)
        : buildSummaryPrompt(contextText);

      const providerResult = await executeOpenRouterTextRequest({
        config,
        model: selectedModel.model,
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
        maxOutputTokens: budgetDecision.maxOutputTokens,
        temperature: outputType === "content_plan_draft" ? 0.3 : 0.2
      });

      if (!providerResult.ok) {
        const safeError = providerResult.errorMessage ?? "OpenRouter text execution failed.";
        const workflowResult = createWorkflowResult(
          "openrouter",
          providerResult.model,
          outputType,
          input.finishedAtIso,
          `${input.projectName} OpenRouter execution failed`,
          safeError,
          null,
          safeError,
          budgetDecision.maxOutputTokens,
          budgetDecision.approximateInputTokens
        );
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
            `OpenRouter text execution failed: ${safeError}`,
            `Model slot: ${selectedModel.slot}.`,
            `Model: ${providerResult.model}.`,
            `Output type: ${outputType}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Budget policy: ${budgetDecision.budgetPolicy}.`
          ]),
          executionError: safeError,
          resultPlaceholder: null,
          finalStatus: "FAILED",
          workflowResult,
          generatedContentPlanItems: null
        };
      }

      if (outputType === "content_plan_draft") {
        const providerContent = providerResult.content ?? "";
        const parsed = parseContentPlanItemsFromProviderText(providerContent);
        if (!parsed) {
          const safeSummary = "OpenRouter returned a response, but it was not safely parseable as the expected content plan JSON. No content plan items were persisted.";
          const safeError = "Provider output was not safely parseable as structured content plan JSON.";
          const workflowResult = createWorkflowResult(
            "openrouter",
            providerResult.model,
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
              `Model slot: ${selectedModel.slot}.`,
              `Model: ${providerResult.model}.`,
              `Output type: ${outputType}.`,
              `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
              `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
              `Budget policy: ${budgetDecision.budgetPolicy}.`
            ]),
            executionError: null,
            resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
            finalStatus: "REVIEW",
            workflowResult,
            generatedContentPlanItems: null
          };
        }

        const workflowResult = createWorkflowResult(
          "openrouter",
          providerResult.model,
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
            `Model slot: ${selectedModel.slot}.`,
            `Model: ${providerResult.model}.`,
            `Output type: ${outputType}.`,
            `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
            `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
            `Budget policy: ${budgetDecision.budgetPolicy}.`
          ]),
          executionError: null,
          resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
          finalStatus: "REVIEW",
          workflowResult,
          generatedContentPlanItems: parsed.items
        };
      }

      const workflowResult = createWorkflowResult(
        "openrouter",
        providerResult.model,
        outputType,
        input.finishedAtIso,
        `${input.projectName} workflow execution summary`,
        truncateText(providerResult.content, MAX_RESULT_SUMMARY_LENGTH) ?? "OpenRouter returned an empty summary.",
        null,
        null,
        budgetDecision.maxOutputTokens,
        budgetDecision.approximateInputTokens
      );

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          "OpenRouter text execution completed successfully.",
          `Model slot: ${selectedModel.slot}.`,
          `Model: ${providerResult.model}.`,
          `Output type: ${outputType}.`,
          `Approximate input tokens: ${budgetDecision.approximateInputTokens}.`,
          `Max output tokens: ${budgetDecision.maxOutputTokens}.`,
          `Budget policy: ${budgetDecision.budgetPolicy}.`
        ]),
        executionError: null,
        resultPlaceholder: serializeAiWorkflowResultForPlaceholder(workflowResult),
        finalStatus: "REVIEW",
        workflowResult,
        generatedContentPlanItems: null
      };
    }
  };
}

export const localAiDeliveryWorkflowExecutionAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();
