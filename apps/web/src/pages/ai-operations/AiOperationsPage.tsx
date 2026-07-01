import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AiOperationsRunDetail,
  AiOperationsRunListItem,
  AiOperationsRunResponse,
  AiOperationsRunsResponse,
  AiWorkflowContextUsageSummary
} from "@dca-os-v1/shared";
import { formatAiOperationsWorkflowKindLabel, formatAiWorkflowTokenEstimate } from "@dca-os-v1/shared";
import { EmptyState } from "../../components/EmptyState";
import { Modal } from "../../components/Modal";
import { Button, PageHeader, SectionPanel, StatusBadge, Table } from "../../components/ui";
import { Alert, Input, Select } from "../../design-system";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type StatusFilter = "ALL" | string;
type GatewayFilter = "ALL" | "disabled" | "local" | "openrouter";
type OutputTypeFilter = "ALL" | "summary" | "content_plan_draft" | "article_draft" | "mi_research";
type SourceFilter = "ALL" | "ai_delivery_workflow_run" | "market_intelligence_research_run";

const CSV_COLUMNS: Array<{ header: string; value: (run: AiOperationsRunListItem) => string }> = [
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
  { header: "live_provider_called", value: (run) => (run.liveProviderCalled === null ? "" : run.liveProviderCalled ? "yes" : "no") },
  { header: "executed_at", value: (run) => run.executedAt ?? "" },
  { header: "insight_status", value: (run) => run.linkedInsightStatus ?? "" },
  { header: "handoff_status", value: (run) => run.linkedHandoffStatus ?? "" },
  { header: "title_preview", value: (run) => run.titlePreview ?? "" }
];

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildRunsCsv(rows: AiOperationsRunListItem[]): string {
  const header = CSV_COLUMNS.map((column) => column.header).join(",");
  const body = rows.map((run) => CSV_COLUMNS.map((column) => escapeCsvCell(column.value(run))).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function apiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: { code: "REQUEST_FAILED", message: "Request could not be completed." }
    };
  }
  return payload;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value || !value.trim()) {
    return fallback;
  }
  return value.replace(/_/g, " ");
}

function contextStatusLabel(status: AiWorkflowContextUsageSummary["status"]): string {
  if (status === "used") return "Context used";
  if (status === "skipped") return "Context skipped";
  if (status === "not_loaded") return "Context not loaded";
  return "Context unknown";
}

function contextStatusBadge(status: AiWorkflowContextUsageSummary["status"]) {
  return <StatusBadge status={contextStatusLabel(status)} />;
}

function RunDetailModal({
  run,
  loading,
  error,
  onClose
}: {
  run: AiOperationsRunDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={run ? `Run ${run.shortId}` : "AI run detail"}>
      {loading ? (
        <div className="state-panel loading-state-panel" role="status">
          Loading run detail…
        </div>
      ) : null}
      {error ? <Alert message={error} title="Run detail blocked" variant="danger" /> : null}
      {!loading && !error && run ? (
        <div className="stack gap-md">
          <SectionPanel title="Execution summary" description="Gateway, model, and result metadata for operator review.">
            <dl className="detail-grid compact">
              <div><dt>Source</dt><dd>{formatAiOperationsWorkflowKindLabel(run.workflowKind)}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={run.status} /></dd></div>
              <div><dt>Project</dt><dd>{run.projectName}</dd></div>
              <div><dt>Client</dt><dd>{run.clientName ?? "Not linked"}</dd></div>
              <div><dt>Target month</dt><dd>{run.targetMonth ?? "Not recorded"}</dd></div>
              <div><dt>Workflow type</dt><dd>{formatLabel(run.workflowType)}</dd></div>
              <div><dt>Gateway</dt><dd>{formatLabel(run.gateway)}</dd></div>
              <div><dt>Provider mode</dt><dd>{formatLabel(run.providerMode)}</dd></div>
              <div><dt>Model</dt><dd>{run.model ?? "Not recorded"}</dd></div>
              <div><dt>Deterministic</dt><dd>{run.isDeterministic === null ? "Unknown" : run.isDeterministic ? "Yes" : "No"}</dd></div>
              <div><dt>Live provider</dt><dd>{run.liveProviderCalled === null ? "Unknown" : run.liveProviderCalled ? "Called" : "Not called"}</dd></div>
              {run.workflowKind === "ai_delivery_workflow_run" ? (
                <div><dt>Context</dt><dd>{contextStatusBadge(run.contextUsage.status)}</dd></div>
              ) : null}
              <div><dt>Executed</dt><dd>{formatTimestamp(run.executedAt)}</dd></div>
              {run.workflowKind === "ai_delivery_workflow_run" ? (
                <>
                  <div><dt>Result version</dt><dd>{run.resultVersion ?? "Not recorded"}</dd></div>
                  <div><dt>Input tokens (est.)</dt><dd>{formatAiWorkflowTokenEstimate(run.approximateInputTokens, run.maxOutputTokens)}</dd></div>
                  <div><dt>Budget policy</dt><dd>{run.budgetPolicy ?? "Not recorded"}</dd></div>
                  <div><dt>Cost note</dt><dd className="muted-copy">Estimates from execution metadata — not billing records.</dd></div>
                </>
              ) : null}
              {run.workflowKind === "market_intelligence_research_run" ? (
                <>
                  <div><dt>Linked insight</dt><dd>{run.linkedInsightId ? run.linkedInsightId.slice(0, 8) : "Not linked"}</dd></div>
                  <div><dt>Insight status</dt><dd>{formatLabel(run.linkedInsightStatus, "Not linked")}</dd></div>
                  <div><dt>Handoff status</dt><dd>{formatLabel(run.linkedHandoffStatus, "Not linked")}</dd></div>
                </>
              ) : null}
            </dl>
          </SectionPanel>

          {run.workflowKind === "ai_delivery_workflow_run" && run.resultSummary ? (
            <SectionPanel title="AI_WORKFLOW_RESULT_V1 summary" description="Parsed result contract summary.">
              <dl className="detail-grid compact">
                <div><dt>Title</dt><dd>{run.resultSummary.title ?? "Not recorded"}</dd></div>
                <div><dt>Summary</dt><dd>{run.resultSummary.summary ?? "Not recorded"}</dd></div>
                <div><dt>Output type</dt><dd>{formatLabel(run.resultSummary.outputType)}</dd></div>
                <div><dt>Generated at</dt><dd>{formatTimestamp(run.resultSummary.generatedAt)}</dd></div>
              </dl>
            </SectionPanel>
          ) : null}

          {run.workflowKind === "ai_delivery_workflow_run" && !run.resultSummary ? (
            <SectionPanel title="AI_WORKFLOW_RESULT_V1 summary">
              <EmptyState title="No parsed result" message="This run has no recorded AI_WORKFLOW_RESULT_V1 placeholder yet." />
            </SectionPanel>
          ) : null}

          {run.workflowKind === "market_intelligence_research_run" && run.miResultSummaryPreview ? (
            <SectionPanel title="Research result preview" description="Safe summary preview only — no raw prompts or provider payloads.">
              <p className="muted-copy">{run.miResultSummaryPreview}</p>
            </SectionPanel>
          ) : null}

          {run.workflowKind === "ai_delivery_workflow_run" && run.contextUsage.detail ? (
            <SectionPanel title="Context usage">
              <p className="muted-copy">{run.contextUsage.detail}</p>
            </SectionPanel>
          ) : null}

          {run.executionError || run.safeError ? (
            <SectionPanel title="Safe error details">
              {run.executionError ? <Alert message={run.executionError} variant="danger" /> : null}
              {run.safeError ? <Alert message={run.safeError} variant="warning" /> : null}
            </SectionPanel>
          ) : null}

          {run.adminNotes ? (
            <SectionPanel title="Admin notes">
              <p className="muted-copy">{run.adminNotes}</p>
            </SectionPanel>
          ) : null}

          {run.executionLogPreview ? (
            <SectionPanel title="Execution log preview" description="Recent log lines only.">
              <pre className="code-preview compact">{run.executionLogPreview}</pre>
            </SectionPanel>
          ) : null}

          {run.rawResultJsonPreview ? (
            <SectionPanel title="Sanitized raw result preview" description="Secrets and sensitive keys are redacted.">
              <pre className="code-preview compact">{run.rawResultJsonPreview}</pre>
            </SectionPanel>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

export function AiOperationsPage() {
  const [runs, setRuns] = useState<AiOperationsRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [gatewayFilter, setGatewayFilter] = useState<GatewayFilter>("ALL");
  const [outputTypeFilter, setOutputTypeFilter] = useState<OutputTypeFilter>("ALL");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detailRun, setDetailRun] = useState<AiOperationsRunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<AiOperationsRunsResponse>("/ai-operations/runs?limit=100");
      if (!response.ok) {
        setError(response.error.message);
        setRuns([]);
        return;
      }
      setRuns(response.data.runs);
    } catch {
      setError("Unable to load AI operations runs.");
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const statusOptions = useMemo(() => {
    const values = new Set(runs.map((run) => run.status));
    return ["ALL", ...Array.from(values).sort()];
  }, [runs]);

  const filteredRuns = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return runs.filter((run) => {
      if (statusFilter !== "ALL" && run.status !== statusFilter) {
        return false;
      }
      if (sourceFilter !== "ALL" && run.workflowKind !== sourceFilter) {
        return false;
      }
      if (gatewayFilter !== "ALL" && (run.gateway ?? "").toLowerCase() !== gatewayFilter) {
        return false;
      }
      if (outputTypeFilter !== "ALL") {
        const outputType = (run.outputType ?? run.workflowType ?? "").toLowerCase();
        if (outputType !== outputTypeFilter) {
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
  }, [gatewayFilter, outputTypeFilter, runs, search, sourceFilter, statusFilter]);

  const exportVisibleRunsCsv = useCallback(() => {
    if (filteredRuns.length === 0) {
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`ai-operations-runs-${stamp}.csv`, buildRunsCsv(filteredRuns));
  }, [filteredRuns]);

  const openRunDetail = useCallback(async (runId: string) => {
    setSelectedRunId(runId);
    setDetailRun(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await apiRequest<AiOperationsRunResponse>(`/ai-operations/runs/${runId}`);
      if (!response.ok) {
        setDetailError(response.error.message);
        return;
      }
      if (!response.data.run) {
        setDetailError("Run was not found.");
        return;
      }
      setDetailRun(response.data.run);
    } catch {
      setDetailError("Unable to load run detail.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeRunDetail = useCallback(() => {
    setSelectedRunId(null);
    setDetailRun(null);
    setDetailError(null);
  }, []);

  return (
    <div className="page-stack" data-density="compact">
      <PageHeader
        eyebrow="AI Operations"
        title="AI Operations Console"
        description="Review AI Delivery workflow runs and Market Intelligence research runs — gateway mode, context usage, and safe metadata."
        actions={(
          <>
            <Button disabled={filteredRuns.length === 0} onClick={exportVisibleRunsCsv} type="button" variant="secondary">
              Export CSV
            </Button>
            <Button onClick={() => void loadRuns()} type="button" variant="secondary">
              Refresh
            </Button>
          </>
        )}
      />

      {error ? <Alert message={error} title="AI Operations blocked" variant="danger" /> : null}
      {loading ? (
        <div className="state-panel loading-state-panel" role="status">
          Loading AI operations runs…
        </div>
      ) : null}

      {!loading ? (
        <SectionPanel
          title="Recent runs"
          description="Compact operator view across AI Delivery and Market Intelligence executions."
        >
          <div className="toolbar filter-bar stack gap-sm">
            <Input
              label="Search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Run id, project, client, model…"
              value={search}
            />
            <Select
              label="Source"
              onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
              options={[
                { value: "ALL", label: "All sources" },
                { value: "ai_delivery_workflow_run", label: "AI Delivery" },
                { value: "market_intelligence_research_run", label: "Market Intelligence" }
              ]}
              value={sourceFilter}
            />
            <Select
              label="Status"
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusOptions.map((option) => ({
                value: option,
                label: option === "ALL" ? "All statuses" : option
              }))}
              value={statusFilter}
            />
            <Select
              label="Gateway"
              onChange={(event) => setGatewayFilter(event.target.value as GatewayFilter)}
              options={[
                { value: "ALL", label: "All gateways" },
                { value: "disabled", label: "disabled" },
                { value: "local", label: "local" },
                { value: "openrouter", label: "openrouter" }
              ]}
              value={gatewayFilter}
            />
            <Select
              label="Output type"
              onChange={(event) => setOutputTypeFilter(event.target.value as OutputTypeFilter)}
              options={[
                { value: "ALL", label: "All output types" },
                { value: "summary", label: "summary" },
                { value: "content_plan_draft", label: "content plan draft" },
                { value: "article_draft", label: "article draft" },
                { value: "mi_research", label: "MI research" }
              ]}
              value={outputTypeFilter}
            />
            <p className="muted-copy compact">
              {filteredRuns.length} visible run(s). CSV export includes safe admin fields only — no raw JSON, secrets, or provider payloads.
            </p>
          </div>

          {filteredRuns.length === 0 ? (
            <EmptyState
              title="No AI operations runs"
              message={runs.length === 0 ? "Execute an AI Delivery workflow or Market Intelligence research run to populate this console." : "No runs match the current filters."}
            />
          ) : (
            <div className="table-scroll">
              <Table
                className="data-table compact"
                headers={[
                  { label: "Run", align: "left" },
                  { label: "Source", align: "left" },
                  { label: "Project", align: "left" },
                  { label: "Client", align: "left" },
                  { label: "Month", align: "left" },
                  { label: "Type", align: "left" },
                  { label: "Status", align: "left" },
                  { label: "Gateway", align: "left" },
                  { label: "Model", align: "left" },
                  { label: "Context", align: "left" },
                  { label: "Tokens (est.)", align: "left" },
                  { label: "Executed", align: "left" },
                  { label: "", align: "right" }
                ]}
                rows={filteredRuns.map((run) => ({
                  key: run.id,
                  cells: [
                    <span className="mono-copy" key={`${run.id}-short`} title={run.id}>{run.shortId}</span>,
                    formatAiOperationsWorkflowKindLabel(run.workflowKind),
                    run.projectName,
                    run.clientName ?? "—",
                    run.targetMonth ?? "—",
                    formatLabel(run.workflowType),
                    <StatusBadge key={`${run.id}-status`} status={run.status} />,
                    formatLabel(run.gateway),
                    run.model ?? "—",
                    contextStatusBadge(run.contextStatus),
                    formatAiWorkflowTokenEstimate(run.approximateInputTokens, run.maxOutputTokens),
                    formatTimestamp(run.executedAt),
                    <Button key={`${run.id}-review`} onClick={() => void openRunDetail(run.id)} size="sm" variant="secondary">
                      Review
                    </Button>
                  ]
                }))}
              />
            </div>
          )}
        </SectionPanel>
      ) : null}

      {selectedRunId ? (
        <RunDetailModal
          run={detailRun}
          loading={detailLoading}
          error={detailError}
          onClose={closeRunDetail}
        />
      ) : null}
    </div>
  );
}
