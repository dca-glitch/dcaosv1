import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  buildExecutionLogPreview,
  buildSanitizedAiWorkflowJsonPreview,
  parseAiWorkflowContextUsageFromExecutionLog,
  parseAiWorkflowObservabilityFromExecutionLog,
  parseAiWorkflowResultSummary,
  type AiOperationsRunDetail,
  type AiOperationsRunListItem,
  type AiOperationsRunResponse,
  type AiOperationsRunsResponse,
  type AiOperationsWorkflowKind,
  type AiWorkflowContextUsageSummary,
  type AiWorkflowObservabilitySummary,
  type AiWorkflowResultSummary,
  type ListAiOperationsRunsFilters
} from "@dca-os-v1/shared";
const prisma = createPrismaClient();

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 200;

const aiOperationsRunSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  status: true,
  adminNotes: true,
  resultPlaceholder: true,
  executionLog: true,
  executionError: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  updatedAt: true,
  aiDeliveryProject: {
    select: {
      id: true,
      name: true,
      targetMonth: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      },
      project: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const;

const miResearchRunSelect = {
  id: true,
  tenantId: true,
  projectId: true,
  status: true,
  resultSummary: true,
  executionLog: true,
  executedAt: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      title: true,
      targetMonth: true,
      targetClientName: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const;

type WorkflowRunRow = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  status: string;
  adminNotes: string | null;
  resultPlaceholder: string | null;
  executionLog: string | null;
  executionError: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  aiDeliveryProject: {
    id: string;
    name: string;
    targetMonth: string;
    clientId: string;
    client: { id: string; name: string } | null;
    project: { id: string; name: string } | null;
  };
};

type MiResearchRunRow = {
  id: string;
  tenantId: string;
  projectId: string;
  status: string;
  resultSummary: string | null;
  executionLog: string | null;
  executedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    title: string;
    targetMonth: string | null;
    targetClientName: string | null;
    clientId: string | null;
    client: { id: string; name: string } | null;
  };
};

type MiRunLinkSummary = {
  linkedInsightId: string | null;
  linkedInsightStatus: string | null;
  linkedHandoffStatus: string | null;
};

function getAiDeliveryWorkflowRunDelegate(client: typeof prisma) {
  return (client as unknown as {
    aiDeliveryWorkflowRun: {
      findMany: (args: unknown) => Promise<WorkflowRunRow[]>;
      findFirst: (args: unknown) => Promise<WorkflowRunRow | null>;
    };
  }).aiDeliveryWorkflowRun;
}

function getMiResearchRunDelegate(client: typeof prisma) {
  return (client as unknown as {
    marketIntelligenceResearchRun: {
      findMany: (args: unknown) => Promise<MiResearchRunRow[]>;
      findFirst: (args: unknown) => Promise<MiResearchRunRow | null>;
    };
  }).marketIntelligenceResearchRun;
}

function getMiInsightDelegate(client: typeof prisma) {
  return (client as unknown as {
    marketIntelligenceInsight: {
      findFirst: (args: unknown) => Promise<{ id: string; status: string } | null>;
    };
  }).marketIntelligenceInsight;
}

function getMiHandoffDelegate(client: typeof prisma) {
  return (client as unknown as {
    marketIntelligenceHandoff: {
      findFirst: (args: unknown) => Promise<{ handoffStatus: string } | null>;
    };
  }).marketIntelligenceHandoff;
}

function shortRunId(runId: string): string {
  return runId.length <= 10 ? runId : runId.slice(0, 8);
}

function inferWorkflowType(
  outputType: string | null,
  adminNotes: string | null
): string | null {
  if (outputType && outputType !== "unknown") {
    return outputType;
  }

  const notes = (adminNotes ?? "").toLowerCase();
  if (notes.includes("content plan")) {
    return "content_plan_draft";
  }
  if (notes.includes("article") || notes.includes("draft")) {
    return "article_draft";
  }
  if (notes.trim()) {
    return "summary";
  }

  return null;
}

function truncatePreview(value: string | null | undefined, maxLength = 160): string | null {
  const text = (value ?? "").trim();
  if (!text) {
    return null;
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

function inferMiSafeError(executionLog: string | null, status: string): string | null {
  if (status !== "FAILED" && status !== "ERROR") {
    return null;
  }
  const lines = (executionLog ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine = [...lines].reverse().find((line) => /error|fail/i.test(line));
  return errorLine ? truncatePreview(errorLine, 240) : "Research run did not complete successfully.";
}

async function resolveMiRunLinks(
  tenantId: string,
  run: MiResearchRunRow
): Promise<MiRunLinkSummary> {
  if (run.status !== "EXECUTED" || !run.executedAt) {
    return {
      linkedInsightId: null,
      linkedInsightStatus: null,
      linkedHandoffStatus: null
    };
  }

  const insight = await getMiInsightDelegate(prisma).findFirst({
    where: {
      tenantId,
      projectId: run.projectId,
      createdAt: {
        gte: new Date(run.executedAt.getTime() - 1000),
        lte: new Date(run.executedAt.getTime() + 60000)
      }
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true }
  });

  if (!insight) {
    return {
      linkedInsightId: null,
      linkedInsightStatus: null,
      linkedHandoffStatus: null
    };
  }

  const handoff = await getMiHandoffDelegate(prisma).findFirst({
    where: {
      tenantId,
      insightId: insight.id,
      isArchived: false
    },
    orderBy: { updatedAt: "desc" },
    select: { handoffStatus: true }
  });

  return {
    linkedInsightId: insight.id,
    linkedInsightStatus: insight.status,
    linkedHandoffStatus: handoff?.handoffStatus ?? null
  };
}

function mergeAiDeliveryRunMetadata(
  run: WorkflowRunRow,
  resultSummary: AiWorkflowResultSummary | null,
  observability: AiWorkflowObservabilitySummary | null,
  contextUsage: AiWorkflowContextUsageSummary
): AiOperationsRunListItem {
  const gateway = observability?.gateway ?? resultSummary?.gateway ?? null;
  const providerMode = gateway && gateway !== "unknown" ? gateway : null;
  const outputType =
    observability?.outputType && observability.outputType !== "unknown"
      ? observability.outputType
      : resultSummary?.outputType && resultSummary.outputType !== "unknown"
        ? resultSummary.outputType
        : null;
  const budget = observability?.budget ?? resultSummary?.budget ?? {
    budgetPolicy: null,
    approximateInputTokens: null,
    maxOutputTokens: null
  };
  const finishedAt = run.finishedAt ? run.finishedAt.toISOString() : null;

  return {
    id: run.id,
    shortId: shortRunId(run.id),
    workflowKind: "ai_delivery_workflow_run",
    aiDeliveryProjectId: run.aiDeliveryProjectId,
    miProjectId: null,
    projectName: run.aiDeliveryProject.name,
    clientId: run.aiDeliveryProject.client?.id ?? run.aiDeliveryProject.clientId ?? null,
    clientName: run.aiDeliveryProject.client?.name ?? null,
    linkedProjectId: run.aiDeliveryProject.project?.id ?? null,
    linkedProjectName: run.aiDeliveryProject.project?.name ?? null,
    targetMonth: String(run.aiDeliveryProject.targetMonth ?? ""),
    workflowType: inferWorkflowType(outputType, run.adminNotes),
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    finishedAt,
    executedAt: finishedAt ?? run.updatedAt.toISOString(),
    gateway: providerMode,
    providerMode,
    isDeterministic: observability?.isDeterministic ?? (providerMode === "local" || providerMode === "disabled" ? true : providerMode === "openrouter" ? false : null),
    liveProviderCalled: observability?.liveProviderCalled ?? (providerMode === "openrouter" ? true : providerMode ? false : null),
    model: observability?.model ?? resultSummary?.model ?? null,
    outputType,
    contextStatus: contextUsage.status,
    approximateInputTokens: budget.approximateInputTokens,
    maxOutputTokens: budget.maxOutputTokens,
    budgetPolicy: budget.budgetPolicy,
    safeError: observability?.safeError ?? resultSummary?.safeError ?? null,
    executionError: run.executionError ?? null,
    resultVersion: resultSummary?.version ?? null,
    resultType: outputType,
    titlePreview: resultSummary?.title ?? resultSummary?.summary ?? null,
    linkedInsightId: null,
    linkedInsightStatus: null,
    linkedHandoffStatus: null
  };
}

function mergeMiResearchRunMetadata(
  run: MiResearchRunRow,
  links: MiRunLinkSummary
): AiOperationsRunListItem {
  const executedAt = run.executedAt ? run.executedAt.toISOString() : null;
  const clientName = run.project.client?.name ?? run.project.targetClientName ?? null;

  return {
    id: run.id,
    shortId: shortRunId(run.id),
    workflowKind: "market_intelligence_research_run",
    aiDeliveryProjectId: null,
    miProjectId: run.projectId,
    projectName: run.project.title,
    clientId: run.project.client?.id ?? run.project.clientId ?? null,
    clientName,
    linkedProjectId: null,
    linkedProjectName: null,
    targetMonth: run.project.targetMonth ?? null,
    workflowType: "market_intelligence_research",
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    startedAt: run.createdAt.toISOString(),
    finishedAt: executedAt,
    executedAt: executedAt ?? run.updatedAt.toISOString(),
    gateway: "local",
    providerMode: "local",
    isDeterministic: true,
    liveProviderCalled: false,
    model: null,
    outputType: "mi_research",
    contextStatus: "unknown",
    approximateInputTokens: null,
    maxOutputTokens: null,
    budgetPolicy: null,
    safeError: inferMiSafeError(run.executionLog, run.status),
    executionError: null,
    resultVersion: null,
    resultType: "mi_research",
    titlePreview: truncatePreview(run.resultSummary),
    linkedInsightId: links.linkedInsightId,
    linkedInsightStatus: links.linkedInsightStatus,
    linkedHandoffStatus: links.linkedHandoffStatus
  };
}

function toAiDeliveryRunDetail(run: WorkflowRunRow): AiOperationsRunDetail {
  const resultSummary = parseAiWorkflowResultSummary(run.resultPlaceholder);
  const observability = parseAiWorkflowObservabilityFromExecutionLog(run.executionLog);
  const contextUsage = parseAiWorkflowContextUsageFromExecutionLog(run.executionLog);

  return {
    ...mergeAiDeliveryRunMetadata(run, resultSummary, observability, contextUsage),
    adminNotes: run.adminNotes ?? null,
    resultSummary,
    observability,
    contextUsage,
    executionLogPreview: buildExecutionLogPreview(run.executionLog),
    rawResultJsonPreview: buildSanitizedAiWorkflowJsonPreview(run.resultPlaceholder),
    miResultSummaryPreview: null
  };
}

async function toMiResearchRunDetail(run: MiResearchRunRow): Promise<AiOperationsRunDetail> {
  const links = await resolveMiRunLinks(run.tenantId, run);
  const contextUsage: AiWorkflowContextUsageSummary = { status: "unknown", detail: null };

  return {
    ...mergeMiResearchRunMetadata(run, links),
    adminNotes: null,
    resultSummary: null,
    observability: null,
    contextUsage,
    executionLogPreview: buildExecutionLogPreview(run.executionLog),
    rawResultJsonPreview: null,
    miResultSummaryPreview: truncatePreview(run.resultSummary, 4000)
  };
}

function matchesListFilters(
  item: AiOperationsRunListItem,
  filters: ListAiOperationsRunsFilters
): boolean {
  if (filters.workflowKind && filters.workflowKind !== "all" && item.workflowKind !== filters.workflowKind) {
    return false;
  }

  if (filters.status && item.status !== filters.status.trim().toUpperCase()) {
    return false;
  }

  if (filters.outputType) {
    const expected = filters.outputType.trim().toLowerCase();
    const actual = (item.outputType ?? item.workflowType ?? "").toLowerCase();
    if (actual !== expected) {
      return false;
    }
  }

  if (filters.gateway) {
    const expected = filters.gateway.trim().toLowerCase();
    const actual = (item.gateway ?? "").toLowerCase();
    if (actual !== expected) {
      return false;
    }
  }

  if (filters.clientId && item.clientId !== filters.clientId.trim()) {
    return false;
  }

  if (filters.aiDeliveryProjectId && item.aiDeliveryProjectId !== filters.aiDeliveryProjectId.trim()) {
    return false;
  }

  if (filters.miProjectId && item.miProjectId !== filters.miProjectId.trim()) {
    return false;
  }

  return true;
}

function normalizeListLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(value), 1), MAX_LIST_LIMIT);
}

function sortRunsByRecency(a: AiOperationsRunListItem, b: AiOperationsRunListItem): number {
  const aTime = Date.parse(a.executedAt ?? a.updatedAt);
  const bTime = Date.parse(b.executedAt ?? b.updatedAt);
  if (bTime !== aTime) {
    return bTime - aTime;
  }
  return b.id.localeCompare(a.id);
}

function shouldIncludeWorkflowKind(
  filters: ListAiOperationsRunsFilters,
  kind: AiOperationsWorkflowKind
): boolean {
  if (!filters.workflowKind || filters.workflowKind === "all") {
    return true;
  }
  return filters.workflowKind === kind;
}

export async function listAiOperationsRuns(
  authSession: AuthResolvedSessionContext,
  filters: ListAiOperationsRunsFilters = {}
): Promise<AiOperationsRunsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const limit = normalizeListLimit(filters.limit);
  const runs: AiOperationsRunListItem[] = [];

  if (shouldIncludeWorkflowKind(filters, "ai_delivery_workflow_run")) {
    const workflowRuns = await getAiDeliveryWorkflowRunDelegate(prisma).findMany({
      where: {
        tenantId,
        ...(filters.aiDeliveryProjectId ? { aiDeliveryProjectId: filters.aiDeliveryProjectId.trim() } : {}),
        ...(filters.status ? { status: filters.status.trim().toUpperCase() } : {}),
        ...(filters.clientId
          ? {
              aiDeliveryProject: {
                clientId: filters.clientId.trim()
              }
            }
          : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: aiOperationsRunSelect
    });

    for (const run of workflowRuns) {
      const resultSummary = parseAiWorkflowResultSummary(run.resultPlaceholder);
      const observability = parseAiWorkflowObservabilityFromExecutionLog(run.executionLog);
      const contextUsage = parseAiWorkflowContextUsageFromExecutionLog(run.executionLog);
      runs.push(mergeAiDeliveryRunMetadata(run, resultSummary, observability, contextUsage));
    }
  }

  if (shouldIncludeWorkflowKind(filters, "market_intelligence_research_run")) {
    const miRuns = await getMiResearchRunDelegate(prisma).findMany({
      where: {
        tenantId,
        ...(filters.miProjectId ? { projectId: filters.miProjectId.trim() } : {}),
        ...(filters.status ? { status: filters.status.trim().toUpperCase() } : {}),
        ...(filters.clientId
          ? {
              project: {
                clientId: filters.clientId.trim()
              }
            }
          : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: miResearchRunSelect
    });

    for (const run of miRuns) {
      runs.push(mergeMiResearchRunMetadata(run, {
        linkedInsightId: null,
        linkedInsightStatus: null,
        linkedHandoffStatus: null
      }));
    }
  }

  return {
    runs: runs.filter((item) => matchesListFilters(item, filters)).sort(sortRunsByRecency).slice(0, limit)
  };
}

export async function getAiOperationsRun(
  authSession: AuthResolvedSessionContext,
  workflowRunId: string
): Promise<AiOperationsRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const trimmedRunId = workflowRunId.trim();

  const aiDeliveryRun = await getAiDeliveryWorkflowRunDelegate(prisma).findFirst({
    where: {
      id: trimmedRunId,
      tenantId
    },
    select: aiOperationsRunSelect
  });

  if (aiDeliveryRun) {
    return { run: toAiDeliveryRunDetail(aiDeliveryRun) };
  }

  const miRun = await getMiResearchRunDelegate(prisma).findFirst({
    where: {
      id: trimmedRunId,
      tenantId
    },
    select: miResearchRunSelect
  });

  if (!miRun) {
    return { run: null };
  }

  return { run: await toMiResearchRunDetail(miRun) };
}
