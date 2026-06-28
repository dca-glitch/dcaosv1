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

function getAiDeliveryWorkflowRunDelegate(client: typeof prisma) {
  return (client as unknown as {
    aiDeliveryWorkflowRun: {
      findMany: (args: unknown) => Promise<WorkflowRunRow[]>;
      findFirst: (args: unknown) => Promise<WorkflowRunRow | null>;
    };
  }).aiDeliveryWorkflowRun;
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

function mergeRunMetadata(
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
    titlePreview: resultSummary?.title ?? resultSummary?.summary ?? null
  };
}

function toAiOperationsRunDetail(run: WorkflowRunRow): AiOperationsRunDetail {
  const resultSummary = parseAiWorkflowResultSummary(run.resultPlaceholder);
  const observability = parseAiWorkflowObservabilityFromExecutionLog(run.executionLog);
  const contextUsage = parseAiWorkflowContextUsageFromExecutionLog(run.executionLog);

  return {
    ...mergeRunMetadata(run, resultSummary, observability, contextUsage),
    adminNotes: run.adminNotes ?? null,
    resultSummary,
    observability,
    contextUsage,
    executionLogPreview: buildExecutionLogPreview(run.executionLog),
    rawResultJsonPreview: buildSanitizedAiWorkflowJsonPreview(run.resultPlaceholder)
  };
}

function matchesListFilters(
  item: AiOperationsRunListItem,
  filters: ListAiOperationsRunsFilters
): boolean {
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

  return true;
}

function normalizeListLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(value), 1), MAX_LIST_LIMIT);
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

  const runs = workflowRuns
    .map((run) => {
      const resultSummary = parseAiWorkflowResultSummary(run.resultPlaceholder);
      const observability = parseAiWorkflowObservabilityFromExecutionLog(run.executionLog);
      const contextUsage = parseAiWorkflowContextUsageFromExecutionLog(run.executionLog);
      return mergeRunMetadata(run, resultSummary, observability, contextUsage);
    })
    .filter((item) => matchesListFilters(item, filters));

  return { runs };
}

export async function getAiOperationsRun(
  authSession: AuthResolvedSessionContext,
  workflowRunId: string
): Promise<AiOperationsRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const run = await getAiDeliveryWorkflowRunDelegate(prisma).findFirst({
    where: {
      id: workflowRunId.trim(),
      tenantId
    },
    select: aiOperationsRunSelect
  });

  if (!run) {
    return { run: null };
  }

  return { run: toAiOperationsRunDetail(run) };
}
