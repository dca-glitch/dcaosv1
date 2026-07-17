import type { AiOperationsRunListItem, AiWorkflowContextUsageSummary } from "@dca-os-v1/shared";
import { formatAiOperationsWorkflowKindLabel } from "@dca-os-v1/shared";

/** Client-side page size for the already-loaded runs window (API limit=100). */
export const AI_OPS_PAGE_SIZE = 20;

export type AiOpsStatusFilter = "ALL" | string;
export type AiOpsGatewayFilter = "ALL" | "disabled" | "local" | "openrouter";
export type AiOpsOutputTypeFilter = "ALL" | "summary" | "content_plan_draft" | "article_draft" | "mi_research";
export type AiOpsSourceFilter = "ALL" | "ai_delivery_workflow_run" | "market_intelligence_research_run";

export type AiOpsRunFilters = {
  search: string;
  statusFilter: AiOpsStatusFilter;
  sourceFilter: AiOpsSourceFilter;
  gatewayFilter: AiOpsGatewayFilter;
  outputTypeFilter: AiOpsOutputTypeFilter;
};

export type AiOpsContextUsageAnalytics = {
  used: number;
  skipped: number;
  notLoaded: number;
  unknown: number;
  runsWithTokenEstimate: number;
  approximateInputTokensSum: number;
  runsWithErrors: number;
};

export type AiOpsPageSlice<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export const AI_OPS_CSV_COLUMNS: Array<{
  header: string;
  value: (run: AiOperationsRunListItem) => string;
}> = [
  { header: "run_id", value: (run) => run.id },
  { header: "short_id", value: (run) => run.shortId },
  { header: "source", value: (run) => run.workflowKind },
  { header: "source_label", value: (run) => formatAiOperationsWorkflowKindLabel(run.workflowKind) },
  { header: "project", value: (run) => run.projectName },
  { header: "client", value: (run) => run.clientName ?? "" },
  { header: "target_month", value: (run) => run.targetMonth ?? "" },
  { header: "workflow_type", value: (run) => run.workflowType ?? "" },
  { header: "status", value: (run) => run.status },
  { header: "gateway", value: (run) => run.gateway ?? "" },
  { header: "provider_mode", value: (run) => run.providerMode ?? "" },
  { header: "model", value: (run) => run.model ?? "" },
  { header: "output_type", value: (run) => run.outputType ?? "" },
  { header: "context_status", value: (run) => run.contextStatus },
  { header: "input_tokens_est", value: (run) => (run.approximateInputTokens ?? "").toString() },
  { header: "max_output_tokens", value: (run) => (run.maxOutputTokens ?? "").toString() },
  { header: "budget_policy", value: (run) => run.budgetPolicy ?? "" },
  { header: "deterministic", value: (run) => (run.isDeterministic === null ? "" : run.isDeterministic ? "yes" : "no") },
  {
    header: "live_provider_called",
    value: (run) => (run.liveProviderCalled === null ? "" : run.liveProviderCalled ? "yes" : "no")
  },
  { header: "executed_at", value: (run) => run.executedAt ?? "" },
  { header: "insight_status", value: (run) => run.linkedInsightStatus ?? "" },
  { header: "handoff_status", value: (run) => run.linkedHandoffStatus ?? "" },
  { header: "title_preview", value: (run) => run.titlePreview ?? "" }
];

export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildRunsCsv(rows: AiOperationsRunListItem[]): string {
  const header = AI_OPS_CSV_COLUMNS.map((column) => column.header).join(",");
  const body = rows
    .map((run) => AI_OPS_CSV_COLUMNS.map((column) => escapeCsvCell(column.value(run))).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}

export function formatAiOpsTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function formatAiOpsLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value || !value.trim()) {
    return fallback;
  }
  return value.replace(/_/g, " ");
}

export function contextStatusLabel(status: AiWorkflowContextUsageSummary["status"]): string {
  if (status === "used") return "Context used";
  if (status === "skipped") return "Context skipped";
  if (status === "not_loaded") return "Context not loaded";
  return "Context unknown";
}

export function filterAiOperationsRuns(
  runs: AiOperationsRunListItem[],
  filters: AiOpsRunFilters
): AiOperationsRunListItem[] {
  const needle = filters.search.trim().toLowerCase();
  return runs.filter((run) => {
    if (filters.statusFilter !== "ALL" && run.status !== filters.statusFilter) {
      return false;
    }
    if (filters.sourceFilter !== "ALL" && run.workflowKind !== filters.sourceFilter) {
      return false;
    }
    if (filters.gatewayFilter !== "ALL" && (run.gateway ?? "").toLowerCase() !== filters.gatewayFilter) {
      return false;
    }
    if (filters.outputTypeFilter !== "ALL") {
      const outputType = (run.outputType ?? run.workflowType ?? "").toLowerCase();
      if (outputType !== filters.outputTypeFilter) {
        return false;
      }
    }
    if (!needle) {
      return true;
    }
    const haystack = [
      run.shortId,
      run.id,
      run.projectName,
      run.clientName,
      run.status,
      run.gateway,
      run.model,
      run.workflowKind,
      run.workflowType,
      run.titlePreview,
      run.outputType
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function paginateItems<T>(items: T[], page: number, perPage: number = AI_OPS_PAGE_SIZE): AiOpsPageSlice<T> {
  const total = items.length;
  const safePerPage = Math.max(1, perPage);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePerPage);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePerPage;
  return {
    items: items.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total,
    totalPages
  };
}

export function summarizeContextUsage(runs: AiOperationsRunListItem[]): AiOpsContextUsageAnalytics {
  const summary: AiOpsContextUsageAnalytics = {
    used: 0,
    skipped: 0,
    notLoaded: 0,
    unknown: 0,
    runsWithTokenEstimate: 0,
    approximateInputTokensSum: 0,
    runsWithErrors: 0
  };

  for (const run of runs) {
    if (run.contextStatus === "used") summary.used += 1;
    else if (run.contextStatus === "skipped") summary.skipped += 1;
    else if (run.contextStatus === "not_loaded") summary.notLoaded += 1;
    else summary.unknown += 1;

    if (typeof run.approximateInputTokens === "number" && Number.isFinite(run.approximateInputTokens)) {
      summary.runsWithTokenEstimate += 1;
      summary.approximateInputTokensSum += run.approximateInputTokens;
    }

    if (hasRunError(run)) {
      summary.runsWithErrors += 1;
    }
  }

  return summary;
}

export function hasRunError(run: Pick<AiOperationsRunListItem, "safeError" | "executionError">): boolean {
  return Boolean((run.safeError && run.safeError.trim()) || (run.executionError && run.executionError.trim()));
}

export function selectErrorLogRuns(runs: AiOperationsRunListItem[]): AiOperationsRunListItem[] {
  return runs.filter(hasRunError);
}

export function buildStatusSummaryItems(
  runs: AiOperationsRunListItem[]
): Array<{ key: string; label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const run of runs) {
    counts.set(run.status, (counts.get(run.status) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => ({ key: status, label: status, count }));
}

/** Deep-link helper: `#/ai-operations/runs/{id}` or legacy `#/ai-operations?runId=…`. */
export function parseAiOperationsRunIdFromHash(hash: string): string | null {
  const trimmed = hash.trim();
  if (!trimmed) {
    return null;
  }
  const withoutHash = trimmed.replace(/^#\/?/, "");
  const pathOnly = withoutHash.split("?")[0] ?? "";
  const pathMatch = /^ai-operations\/runs\/([^/]+)$/.exec(pathOnly);
  if (pathMatch?.[1]) {
    const fromPath = decodeURIComponent(pathMatch[1]).trim();
    if (fromPath.length > 0) {
      return fromPath;
    }
  }
  const queryIndex = withoutHash.indexOf("?");
  if (queryIndex < 0) {
    return null;
  }
  const params = new URLSearchParams(withoutHash.slice(queryIndex + 1));
  const runId = params.get("runId")?.trim();
  return runId && runId.length > 0 ? runId : null;
}

export function buildAiOperationsRunHash(runId: string | null): string {
  if (!runId) {
    return "#/ai-operations";
  }
  return `#/ai-operations/runs/${encodeURIComponent(runId)}`;
}
