/**
 * Workflow brief production plan generation — derived from brief + MI + SEO reports.
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
import type {
  WorkflowBriefMiReportContent,
  WorkflowBriefSeoReportContent
} from "./workflow-brief-ai.execution";

export const WORKFLOW_BRIEF_PLAN_VERSION = "WORKFLOW_BRIEF_PLAN_V1";

const MAX_FIELD_LENGTH = 600;
const MAX_LIST_ITEM_LENGTH = 200;

export interface WorkflowBriefPlanGenerationInput {
  briefId: string;
  title: string;
  goal: string | null;
  businessContext: string | null;
  targetAudience: string | null;
  offerContext: string | null;
  locationContext: string | null;
  notes: string | null;
  mi: WorkflowBriefMiReportContent;
  seo: WorkflowBriefSeoReportContent;
  finishedAtIso: string;
}

export interface WorkflowBriefContentCluster {
  name: string;
  topics: string[];
}

export interface WorkflowBriefPlanContent {
  strategicSummary: string;
  recommendedContentDirection: string;
  priorityTopics: string[];
  targetAudienceNotes: string;
  positioningNotes: string;
  seoFocusAreas: string[];
  suggestedContentClusters: WorkflowBriefContentCluster[];
  executionNotes: string[];
}

export interface WorkflowBriefClientVisiblePlanSnapshot {
  strategicSummary: string;
  recommendedContentDirection: string;
  priorityTopics: string[];
  targetAudienceNotes: string;
  positioningNotes: string;
  seoFocusAreas: string[];
  suggestedContentClusters: WorkflowBriefContentCluster[];
}

export interface WorkflowBriefPlanExecutionMeta {
  version: typeof WORKFLOW_BRIEF_PLAN_VERSION;
  gateway: AiGatewayExecutionMode;
  model: string;
  generatedAt: string;
  liveProviderCalled: boolean;
  isDeterministic: boolean;
  budget: AiTextBudget;
  safeError: string | null;
}

export interface WorkflowBriefPlanExecutionResult {
  ok: boolean;
  plan: WorkflowBriefPlanContent;
  clientSnapshot: WorkflowBriefClientVisiblePlanSnapshot;
  meta: WorkflowBriefPlanExecutionMeta;
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

function buildExecutionLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

function buildObservabilityBlock(meta: WorkflowBriefPlanExecutionMeta): string {
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
): WorkflowBriefPlanExecutionMeta {
  return {
    version: WORKFLOW_BRIEF_PLAN_VERSION,
    gateway,
    model,
    generatedAt: finishedAtIso,
    liveProviderCalled,
    isDeterministic: gateway === "local" || !liveProviderCalled,
    budget,
    safeError
  };
}

function buildClientSnapshotFromPlan(plan: WorkflowBriefPlanContent): WorkflowBriefClientVisiblePlanSnapshot {
  return {
    strategicSummary: plan.strategicSummary,
    recommendedContentDirection: plan.recommendedContentDirection,
    priorityTopics: plan.priorityTopics,
    targetAudienceNotes: plan.targetAudienceNotes,
    positioningNotes: plan.positioningNotes,
    seoFocusAreas: plan.seoFocusAreas,
    suggestedContentClusters: plan.suggestedContentClusters
  };
}

function buildDeterministicPlan(input: WorkflowBriefPlanGenerationInput): WorkflowBriefPlanContent {
  const goal = truncateText(input.goal, MAX_FIELD_LENGTH) ?? "Clarify primary business goal";
  const audience = truncateText(input.targetAudience, MAX_FIELD_LENGTH) ?? "General audience — refine in brief";
  const offer = truncateText(input.offerContext, MAX_FIELD_LENGTH) ?? "Define offer focus";
  const location = truncateText(input.locationContext, MAX_FIELD_LENGTH);
  const business = truncateText(input.businessContext, MAX_FIELD_LENGTH);

  const strategicSummary = `Production plan for "${input.title}": ${input.mi.summary} Primary goal: ${goal}.`;

  const recommendedContentDirection = uniqueNonEmpty([
    input.mi.recommendedActions[0] ?? null,
    input.seo.contentAngles[0] ?? null,
    goal ? `Align content with goal: ${goal}` : null,
    offer ? `Lead with offer value: ${offer}` : null
  ])[0] ?? "Educational authority content aligned to brief goal and audience";

  const priorityTopics = uniqueNonEmpty([
    ...input.seo.topicIdeas.slice(0, 4),
    ...input.mi.opportunities.slice(0, 3),
    `${input.title}: core FAQ and decision-support content`
  ]);

  const targetAudienceNotes = uniqueNonEmpty([
    audience,
    ...input.mi.audienceInsights.slice(0, 3),
    input.mi.marketSignals[0] ?? null
  ]).join(" | ");

  const positioningNotes = uniqueNonEmpty([
    offer,
    business ? `Business context: ${business}` : null,
    location ? `Geo positioning: ${location}` : null,
    input.mi.competitorInsights[0] ? `Competitive lens: ${input.mi.competitorInsights[0]}` : null
  ]).join(" | ");

  const seoFocusAreas = uniqueNonEmpty([
    ...input.seo.keywordClusters.slice(0, 5),
    ...input.seo.seoNotes.slice(0, 2),
    location ? `Local SEO for ${location}` : null
  ]);

  const clusterSeeds = input.seo.keywordClusters.slice(0, 3);
  const suggestedContentClusters: WorkflowBriefContentCluster[] = clusterSeeds.length > 0
    ? clusterSeeds.map((cluster, index) => ({
        name: cluster,
        topics: uniqueNonEmpty([
          input.seo.topicIdeas[index] ?? null,
          input.seo.contentAngles[index] ?? null,
          `${cluster} — buyer guide`,
          index === 0 ? input.seo.internalLinkIdeas[0] ?? null : null
        ], 4)
      }))
    : [
        {
          name: input.title,
          topics: priorityTopics.slice(0, 4)
        }
      ];

  const executionNotes = uniqueNonEmpty([
    "Admin-only: validate MI/SEO outputs before client send",
    input.mi.risks[0] ? `Risk watch: ${input.mi.risks[0]}` : null,
    input.seo.seoNotes.find((note) => note.toLowerCase().includes("deterministic"))
      ? "Deterministic plan draft — review keyword intent manually"
      : null,
    "Confirm content cluster priorities with client before production kickoff",
    "Link internal pages per SEO report suggestions during draft phase"
  ]);

  return {
    strategicSummary,
    recommendedContentDirection,
    priorityTopics,
    targetAudienceNotes,
    positioningNotes,
    seoFocusAreas,
    suggestedContentClusters,
    executionNotes
  };
}

function buildPlanBody(plan: WorkflowBriefPlanContent): string {
  const sections = [
    `## Strategic summary\n${plan.strategicSummary}`,
    `## Recommended content direction\n${plan.recommendedContentDirection}`,
    `## Priority topics\n${plan.priorityTopics.map((topic) => `- ${topic}`).join("\n")}`,
    `## Target audience\n${plan.targetAudienceNotes}`,
    `## Positioning\n${plan.positioningNotes}`,
    `## SEO focus areas\n${plan.seoFocusAreas.map((area) => `- ${area}`).join("\n")}`,
    `## Suggested content clusters\n${plan.suggestedContentClusters
      .map((cluster) => `### ${cluster.name}\n${cluster.topics.map((topic) => `- ${topic}`).join("\n")}`)
      .join("\n\n")}`
  ];
  return sections.join("\n\n");
}

function buildCompactPlanContext(input: WorkflowBriefPlanGenerationInput): string {
  const sections = [
    `Brief title: ${input.title}`,
    input.goal ? `Goal: ${input.goal}` : null,
    input.targetAudience ? `Target audience: ${input.targetAudience}` : null,
    input.offerContext ? `Offer: ${input.offerContext}` : null,
    input.locationContext ? `Location: ${input.locationContext}` : null,
    `MI summary: ${input.mi.summary}`,
    `MI opportunities: ${input.mi.opportunities.slice(0, 4).join("; ")}`,
    `MI risks: ${input.mi.risks.slice(0, 3).join("; ")}`,
    `SEO keyword clusters: ${input.seo.keywordClusters.slice(0, 5).join(", ")}`,
    `SEO topic ideas: ${input.seo.topicIdeas.slice(0, 5).join("; ")}`,
    `SEO content angles: ${input.seo.contentAngles.slice(0, 3).join("; ")}`
  ].filter(Boolean);

  return sections.join("\n");
}

function buildPlanPrompt(contextText: string): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt:
      "You produce a practical pre-production content plan from a workflow brief and its MI/SEO analysis. Return valid JSON only. Include admin-only executionNotes separately from client-safe fields.",
    userPrompt: [
      "Generate a production plan and return valid JSON only with this exact shape:",
      JSON.stringify({
        strategicSummary: "string",
        recommendedContentDirection: "string",
        priorityTopics: ["string"],
        targetAudienceNotes: "string",
        positioningNotes: "string",
        seoFocusAreas: ["string"],
        suggestedContentClusters: [{ name: "string", topics: ["string"] }],
        executionNotes: ["string — admin internal only"]
      }),
      "Keep lists concise (max 6 items). Be practical for a content production team.",
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

function normalizeClusterList(value: unknown): WorkflowBriefContentCluster[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const topics = Array.isArray(record.topics)
        ? record.topics
            .map((topic) => (typeof topic === "string" ? truncateText(topic, MAX_LIST_ITEM_LENGTH) : null))
            .filter(Boolean) as string[]
        : [];
      if (!name) {
        return null;
      }
      return { name, topics };
    })
    .filter(Boolean) as WorkflowBriefContentCluster[];
}

function parseProviderPlanResult(text: string): WorkflowBriefPlanContent | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const strategicSummary = typeof parsed.strategicSummary === "string" ? parsed.strategicSummary.trim() : "";
    const recommendedContentDirection =
      typeof parsed.recommendedContentDirection === "string" ? parsed.recommendedContentDirection.trim() : "";

    if (!strategicSummary || !recommendedContentDirection) {
      return null;
    }

    const priorityTopics = uniqueNonEmpty(
      Array.isArray(parsed.priorityTopics)
        ? parsed.priorityTopics.map((entry) => (typeof entry === "string" ? entry : null))
        : []
    );

    const targetAudienceNotes =
      typeof parsed.targetAudienceNotes === "string" ? parsed.targetAudienceNotes.trim() : "";
    const positioningNotes = typeof parsed.positioningNotes === "string" ? parsed.positioningNotes.trim() : "";

    const seoFocusAreas = uniqueNonEmpty(
      Array.isArray(parsed.seoFocusAreas)
        ? parsed.seoFocusAreas.map((entry) => (typeof entry === "string" ? entry : null))
        : []
    );

    const suggestedContentClusters = normalizeClusterList(parsed.suggestedContentClusters);
    const executionNotes = uniqueNonEmpty(
      Array.isArray(parsed.executionNotes)
        ? parsed.executionNotes.map((entry) => (typeof entry === "string" ? entry : null))
        : []
    );

    if (priorityTopics.length === 0 && suggestedContentClusters.length === 0) {
      return null;
    }

    return {
      strategicSummary,
      recommendedContentDirection,
      priorityTopics,
      targetAudienceNotes: targetAudienceNotes || "Review audience notes with client",
      positioningNotes: positioningNotes || "Review positioning with client",
      seoFocusAreas,
      suggestedContentClusters,
      executionNotes
    };
  } catch {
    return null;
  }
}

export function buildWorkflowBriefPlanJson(
  content: WorkflowBriefPlanContent,
  meta: WorkflowBriefPlanExecutionMeta
): Record<string, unknown> {
  return {
    kind: "production_plan",
    version: WORKFLOW_BRIEF_PLAN_VERSION,
    generatedAt: meta.generatedAt,
    gateway: meta.gateway,
    model: meta.model,
    isDeterministic: meta.isDeterministic,
    ...content
  };
}

export function buildWorkflowBriefClientVisiblePlanJson(
  snapshot: WorkflowBriefClientVisiblePlanSnapshot,
  meta: WorkflowBriefPlanExecutionMeta
): Record<string, unknown> {
  return {
    kind: "production_plan_client",
    version: WORKFLOW_BRIEF_PLAN_VERSION,
    generatedAt: meta.generatedAt,
    ...snapshot
  };
}

export function buildProductionPlanTitle(briefTitle: string): string {
  return `Production Plan — ${briefTitle}`;
}

export function buildProductionPlanBodyFromContent(content: WorkflowBriefPlanContent): string {
  return buildPlanBody(content);
}

function buildLocalSuccessResult(
  input: WorkflowBriefPlanGenerationInput,
  preparedContext: ReturnType<typeof prepareAiGatewayV1Context>,
  logPrefix: string
): WorkflowBriefPlanExecutionResult {
  const plan = buildDeterministicPlan(input);
  const clientSnapshot = buildClientSnapshotFromPlan(plan);
  const budget = toAiTextBudget(preparedContext.budgetDecision);
  const meta = buildMeta("local", "local-deterministic", input.finishedAtIso, false, budget, null);

  const executionLog = [
    ...buildExecutionLogEntries(input.finishedAtIso, [
      `${logPrefix} Local deterministic production plan generation completed.`,
      "No external AI services were called.",
      `Gateway: ${meta.gateway}.`,
      `Model: ${meta.model}.`
    ]),
    buildObservabilityBlock(meta)
  ];

  return {
    ok: true,
    plan,
    clientSnapshot,
    meta,
    executionLog,
    errorMessage: null
  };
}

export async function executeWorkflowBriefPlanGeneration(
  input: WorkflowBriefPlanGenerationInput,
  config: AiProviderConfig = getAiProviderConfig()
): Promise<WorkflowBriefPlanExecutionResult> {
  const contextText = buildCompactPlanContext(input);
  const preparedContext = prepareAiGatewayV1Context(contextText, "summary");
  const budget = toAiTextBudget(preparedContext.budgetDecision);
  const executionMode = resolveAiGatewayExecutionMode(config);

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

  const prompts = buildPlanPrompt(preparedContext.contextText);
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
    return fallback;
  }

  const parsed = parseProviderPlanResult(gatewayResult.content);
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
      "Provider output was not safely parseable as structured production plan JSON."
    );
    return fallback;
  }

  const clientSnapshot = buildClientSnapshotFromPlan(parsed);
  const meta = buildMeta("openrouter", gatewayResult.model, input.finishedAtIso, true, budget, null);

  const executionLog = [
    ...buildExecutionLogEntries(input.finishedAtIso, [
      "OpenRouter production plan generation completed successfully.",
      `Gateway: ${meta.gateway}.`,
      `Model: ${meta.model}.`
    ]),
    buildObservabilityBlock(meta)
  ];

  return {
    ok: true,
    plan: parsed,
    clientSnapshot,
    meta,
    executionLog,
    errorMessage: null
  };
}
