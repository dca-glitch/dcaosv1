/**
 * Workflow brief content draft generation — from seeded content plan items into AI Delivery drafts.
 * Local deterministic fallback always available; live provider opt-in via AI Gateway v1.
 */
import { getAiProviderConfig, type AiProviderConfig } from "../config";
import {
  executeAiGatewayV1ProviderText,
  prepareAiGatewayV1Context,
  resolveAiGatewayExecutionMode,
  type AiGatewayExecutionMode
} from "./ai-gateway-v1.service";
import { toAiTextBudget, type AiTextBudget } from "./ai-text-budget.policy";
import type {
  WorkflowBriefMiReportContent,
  WorkflowBriefSeoReportContent
} from "./workflow-brief-ai.execution";
import { isWorkflowBriefSeedItemForBrief } from "./workflow-brief-content-seed.execution";

export const WORKFLOW_BRIEF_DRAFT_VERSION = "WORKFLOW_BRIEF_DRAFT_V1";
export const WORKFLOW_BRIEF_DRAFT_MARKER = "workflow-brief-draft:v1";

const MAX_FIELD_LENGTH = 600;
const MAX_LIST_ITEM_LENGTH = 200;

export interface WorkflowBriefDraftPlanItemContext {
  id: string;
  title: string;
  targetKeyword: string | null;
  contentType: string;
  notes: string | null;
  sortOrder: number;
}

export interface WorkflowBriefDraftGenerationInput {
  briefId: string;
  briefTitle: string;
  goal: string | null;
  targetAudience: string | null;
  businessContext: string | null;
  projectName: string;
  targetMonth: string;
  planItem: WorkflowBriefDraftPlanItemContext;
  mi: WorkflowBriefMiReportContent;
  seo: WorkflowBriefSeoReportContent;
  recommendedContentDirection: string | null;
  finishedAtIso: string;
}

export interface WorkflowBriefGeneratedDraftContent {
  title: string;
  slug: string | null;
  draftBody: string;
  notes: string | null;
  summary: string;
}

export interface WorkflowBriefDraftExecutionMeta {
  version: typeof WORKFLOW_BRIEF_DRAFT_VERSION;
  gateway: AiGatewayExecutionMode;
  model: string;
  generatedAt: string;
  liveProviderCalled: boolean;
  isDeterministic: boolean;
  budget: AiTextBudget;
  safeError: string | null;
}

export interface WorkflowBriefDraftExecutionResult {
  ok: boolean;
  draft: WorkflowBriefGeneratedDraftContent;
  meta: WorkflowBriefDraftExecutionMeta;
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

function uniqueNonEmpty(values: Array<string | null | undefined>, maxItems = 6): string[] {
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

function buildSlugFromText(value: string): string | null {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized ? normalized.slice(0, 80) : null;
}

function buildExecutionLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

function buildObservabilityBlock(meta: WorkflowBriefDraftExecutionMeta): string {
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

function buildMeta(
  gateway: AiGatewayExecutionMode,
  model: string,
  finishedAtIso: string,
  liveProviderCalled: boolean,
  budget: AiTextBudget,
  safeError: string | null
): WorkflowBriefDraftExecutionMeta {
  return {
    version: WORKFLOW_BRIEF_DRAFT_VERSION,
    gateway,
    model,
    generatedAt: finishedAtIso,
    liveProviderCalled,
    isDeterministic: gateway === "local" || !liveProviderCalled,
    budget,
    safeError
  };
}

export function buildWorkflowBriefDraftLineageNote(
  briefId: string,
  contentPlanItemId: string,
  detail?: string | null
): string {
  const base = `[${WORKFLOW_BRIEF_DRAFT_MARKER} brief=${briefId} item=${contentPlanItemId}]`;
  const normalizedDetail = truncateText(detail, 200);
  return normalizedDetail ? `${base} ${normalizedDetail}` : base;
}

export function isWorkflowBriefDraftForBrief(notes: string | null | undefined, briefId: string): boolean {
  return (notes ?? "").includes(`${WORKFLOW_BRIEF_DRAFT_MARKER} brief=${briefId}`);
}

export function buildDeterministicWorkflowBriefContentDraft(
  input: WorkflowBriefDraftGenerationInput
): WorkflowBriefGeneratedDraftContent {
  const item = input.planItem;
  const title = item.title.trim();
  const primaryKeyword =
    truncateText(item.targetKeyword, 120) ??
    buildSlugFromText(title)?.replace(/-/g, " ") ??
    input.projectName;
  const contentAngle =
    input.seo.contentAngles[item.sortOrder] ??
    input.seo.contentAngles[0] ??
    input.recommendedContentDirection ??
    "Practical, audience-focused educational content";
  const opportunity = input.mi.opportunities[item.sortOrder] ?? input.mi.opportunities[0] ?? null;
  const audienceNote = truncateText(input.targetAudience, 180) ?? "Target audience from workflow brief";
  const supportingNote =
    truncateText(item.notes, 220) ??
    `Focus this ${item.contentType} on ${primaryKeyword} with a clear admin-reviewable structure.`;

  const draftBody = [
    `# ${title}`,
    "",
    `## Overview`,
    `${input.projectName} is preparing a ${item.contentType} draft for ${input.targetMonth} focused on **${primaryKeyword}**. This admin-only draft supports the workflow brief "${input.briefTitle}" and is intended for internal review before any client-facing deliverable workflow.`,
    "",
    `## Audience & Intent`,
    `- Primary audience: ${audienceNote}`,
    `- Content angle: ${contentAngle}`,
    opportunity ? `- Market opportunity: ${opportunity}` : null,
    `- Search/SEO focus: ${primaryKeyword}`,
    "",
    `## Draft Structure`,
    `### Introduction`,
    `Frame the core problem or question your audience faces around ${primaryKeyword}. Connect the topic to ${input.briefTitle}'s business context without making publication or approval claims.`,
    "",
    `### Core Guidance`,
    `Explain the recommended approach, practical steps, examples, or service angle. Draw from market intelligence insights:`,
    ...(input.mi.recommendedActions.length > 0
      ? input.mi.recommendedActions.slice(0, 3).map((action) => `- ${action}`)
      : [`- Provide actionable guidance aligned to ${primaryKeyword}`]),
    "",
    `### SEO & Internal Linking Notes`,
    ...(input.seo.internalLinkIdeas.length > 0
      ? input.seo.internalLinkIdeas.slice(0, 3).map((idea) => `- ${idea}`)
      : [`- Consider linking to related ${input.seo.keywordClusters[0] ?? "cluster"} content when published.`]),
    "",
    `### Conclusion / Next Step`,
    `Close with a practical next step suitable for admin review and later client packaging.`,
    "",
    `## Working Notes`,
    supportingNote
  ]
    .filter(Boolean)
    .join("\n");

  const lineageNote = buildWorkflowBriefDraftLineageNote(
    input.briefId,
    item.id,
    `Generated from seeded plan item "${title}"`
  );

  return {
    title,
    slug: buildSlugFromText(item.targetKeyword ?? title),
    draftBody,
    notes: truncateText(`${lineageNote} Keyword: ${primaryKeyword}.`, 500),
    summary: `Local deterministic content draft prepared for admin review from plan item "${title}".`
  };
}

function buildCompactDraftContext(input: WorkflowBriefDraftGenerationInput): string {
  const lines = [
    `Brief: ${input.briefTitle}`,
    input.goal ? `Goal: ${truncateText(input.goal, MAX_FIELD_LENGTH)}` : null,
    input.businessContext ? `Business context: ${truncateText(input.businessContext, MAX_FIELD_LENGTH)}` : null,
    input.targetAudience ? `Audience: ${truncateText(input.targetAudience, MAX_FIELD_LENGTH)}` : null,
    `Project: ${input.projectName} (${input.targetMonth})`,
    "",
    "Selected content plan item:",
    `- Title: ${input.planItem.title}`,
    `- Keyword: ${input.planItem.targetKeyword ?? "n/a"}`,
    `- Type: ${input.planItem.contentType}`,
    input.planItem.notes ? `- Notes: ${truncateText(input.planItem.notes, 240)}` : null,
    "",
    "MI summary:",
    truncateText(input.mi.summary, MAX_FIELD_LENGTH) ?? "n/a",
    "",
    "MI opportunities:",
    ...uniqueNonEmpty(input.mi.opportunities).map((entry) => `- ${entry}`),
    "",
    "SEO clusters:",
    ...uniqueNonEmpty(input.seo.keywordClusters).map((entry) => `- ${entry}`),
    "",
    "SEO content angles:",
    ...uniqueNonEmpty(input.seo.contentAngles).map((entry) => `- ${entry}`),
    input.recommendedContentDirection
      ? `\nRecommended direction: ${truncateText(input.recommendedContentDirection, MAX_FIELD_LENGTH)}`
      : null
  ].filter(Boolean);

  return lines.join("\n");
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function parseProviderDraftResult(text: string): WorkflowBriefGeneratedDraftContent | null {
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
      draftBody,
      notes: truncateText(notes, 500),
      summary
    };
  } catch {
    return null;
  }
}

function buildDraftPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You create concise admin-only article drafts from workflow brief seeded content plan items. Return valid JSON only. Do not claim publication, client delivery, approvals, crawling, or autonomous execution.",
    userPrompt: [
      "Produce a practical admin-facing article draft from the selected content plan item and workflow brief context.",
      "Return valid JSON only with this shape:",
      '{"title":"string","slug":"string","summary":"string","draftBody":"string","notes":"string"}',
      "The draftBody should be substantial markdown suitable for admin review.",
      "",
      contextText
    ].join("\n")
  };
}

function buildLocalSuccessResult(
  input: WorkflowBriefDraftGenerationInput,
  gateway: AiGatewayExecutionMode,
  model: string,
  budget: AiTextBudget,
  safeError: string | null
): WorkflowBriefDraftExecutionResult {
  const draft = buildDeterministicWorkflowBriefContentDraft(input);
  const meta = buildMeta(gateway, model, input.finishedAtIso, false, budget, safeError);
  return {
    ok: true,
    draft,
    meta,
    executionLog: buildExecutionLogEntries(input.finishedAtIso, [
      "Local deterministic content draft generated.",
      `Plan item: ${input.planItem.title}`,
      buildObservabilityBlock(meta)
    ]),
    errorMessage: null
  };
}

export async function executeWorkflowBriefDraftGeneration(
  input: WorkflowBriefDraftGenerationInput,
  config: AiProviderConfig = getAiProviderConfig()
): Promise<WorkflowBriefDraftExecutionResult> {
  const compactContext = buildCompactDraftContext(input);
  const preparedContext = prepareAiGatewayV1Context(compactContext, "article_draft");
  const gateway = resolveAiGatewayExecutionMode(config);
  const budget = toAiTextBudget(preparedContext.budgetDecision);

  if (gateway !== "openrouter") {
    return buildLocalSuccessResult(input, gateway, "local-deterministic", budget, null);
  }

  if (preparedContext.budgetDecision.inputTooLarge) {
    return buildLocalSuccessResult(
      input,
      gateway,
      "local-deterministic",
      budget,
      "Input exceeded token budget; used local deterministic draft."
    );
  }

  const prompt = buildDraftPrompt(preparedContext.contextText);
  const gatewayResult = await executeAiGatewayV1ProviderText({
    config,
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    outputType: "article_draft",
    preparedContext,
    temperature: 0.2
  });

  if (!gatewayResult.ok || !gatewayResult.content) {
    return buildLocalSuccessResult(
      input,
      gateway,
      gatewayResult.model ?? "local-deterministic",
      budget,
      gatewayResult.safeError ?? "Provider call failed; used local deterministic draft."
    );
  }

  const parsed = parseProviderDraftResult(gatewayResult.content);
  if (!parsed) {
    return buildLocalSuccessResult(
      input,
      gateway,
      gatewayResult.model ?? "openrouter",
      budget,
      "Provider response could not be parsed; used local deterministic draft."
    );
  }

  const lineageNote = buildWorkflowBriefDraftLineageNote(
    input.briefId,
    input.planItem.id,
    "Provider-generated draft"
  );
  const meta = buildMeta(gateway, gatewayResult.model ?? "openrouter", input.finishedAtIso, true, budget, null);

  return {
    ok: true,
    draft: {
      ...parsed,
      notes: truncateText(
        parsed.notes ? `${lineageNote} ${parsed.notes}` : lineageNote,
        500
      )
    },
    meta,
    executionLog: buildExecutionLogEntries(input.finishedAtIso, [
      "Provider-backed content draft generated.",
      `Plan item: ${input.planItem.title}`,
      buildObservabilityBlock(meta)
    ]),
    errorMessage: null
  };
}

export function filterWorkflowBriefSeedPlanItems<T extends { notes: string | null }>(
  items: T[],
  briefId: string
): T[] {
  return items.filter((item) => isWorkflowBriefSeedItemForBrief(item.notes, briefId));
}
