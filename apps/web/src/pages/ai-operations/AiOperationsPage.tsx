import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AiOperationsRunDetail,
  AiOperationsRunListItem,
  AiOperationsRunResponse,
  AiOperationsRunsResponse,
  AiWorkflowContextUsageSummary
} from "@dca-os-v1/shared";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { PageHeader, SectionPanel, StatusBadge } from "../../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type StatusFilter = "ALL" | string;
type GatewayFilter = "ALL" | "disabled" | "local" | "openrouter";
type OutputTypeFilter = "ALL" | "summary" | "content_plan_draft" | "article_draft";

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

function contextStatusTone(status: AiWorkflowContextUsageSummary["status"]): "success" | "warning" | "neutral" | "danger" {
  if (status === "used") return "success";
  if (status === "skipped") return "warning";
  if (status === "not_loaded") return "neutral";
  return "neutral";
}

function contextStatusBadge(status: AiWorkflowContextUsageSummary["status"]) {
  const label = contextStatusLabel(status);
  const tone = contextStatusTone(status);
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
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
      {loading ? <LoadingState label="Loading run detail…" /> : null}
      {error ? <ErrorState title="Run detail blocked" message={error} /> : null}
      {!loading && !error && run ? (
        <div className="stack gap-md">
          <SectionPanel title="Execution summary" description="Gateway, model, and result metadata for operator review.">
            <dl className="detail-grid compact">
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
              <div><dt>Context</dt><dd>{contextStatusBadge(run.contextUsage.status)}</dd></div>
              <div><dt>Executed</dt><dd>{formatTimestamp(run.executedAt)}</dd></div>
              <div><dt>Result version</dt><dd>{run.resultVersion ?? "Not recorded"}</dd></div>
              <div><dt>Input tokens (est.)</dt><dd>{run.approximateInputTokens ?? "Not recorded"}</dd></div>
              <div><dt>Max output tokens</dt><dd>{run.maxOutputTokens ?? "Not recorded"}</dd></div>
              <div><dt>Budget policy</dt><dd>{run.budgetPolicy ?? "Not recorded"}</dd></div>
            </dl>
          </SectionPanel>

          {run.resultSummary ? (
            <SectionPanel title="AI_WORKFLOW_RESULT_V1 summary" description="Parsed result contract summary.">
              <dl className="detail-grid compact">
                <div><dt>Title</dt><dd>{run.resultSummary.title ?? "Not recorded"}</dd></div>
                <div><dt>Summary</dt><dd>{run.resultSummary.summary ?? "Not recorded"}</dd></div>
                <div><dt>Output type</dt><dd>{formatLabel(run.resultSummary.outputType)}</dd></div>
                <div><dt>Generated at</dt><dd>{formatTimestamp(run.resultSummary.generatedAt)}</dd></div>
              </dl>
            </SectionPanel>
          ) : (
            <SectionPanel title="AI_WORKFLOW_RESULT_V1 summary">
              <EmptyState title="No parsed result" message="This run has no recorded AI_WORKFLOW_RESULT_V1 placeholder yet." />
            </SectionPanel>
          )}

          {run.contextUsage.detail ? (
            <SectionPanel title="Context usage">
              <p className="muted-copy">{run.contextUsage.detail}</p>
            </SectionPanel>
          ) : null}

          {run.executionError || run.safeError ? (
            <SectionPanel title="Safe error details">
              {run.executionError ? <p className="error-copy">{run.executionError}</p> : null}
              {run.safeError ? <p className="warning-copy">{run.safeError}</p> : null}
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
        run.workflowType,
        run.titlePreview
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [gatewayFilter, outputTypeFilter, runs, search, statusFilter]);

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
    <div className="page-stack">
      <PageHeader
        eyebrow="AI Operations"
        title="AI Operations Console"
        description="Review recent AI Delivery workflow runs, gateway mode, context usage, and safe result metadata."
        actions={(
          <button className="secondary-action" onClick={() => void loadRuns()} type="button">
            Refresh
          </button>
        )}
      />

      {error ? <ErrorState title="AI Operations blocked" message={error} /> : null}
      {loading ? <LoadingState label="Loading AI workflow runs…" /> : null}

      {!loading ? (
        <SectionPanel
          title="Recent workflow runs"
          description="Compact operator view across AI Delivery workflow executions."
        >
          <div className="toolbar filter-bar stack gap-sm">
            <label className="form-field inline">
              <span>Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Run id, project, client, model…"
              />
            </label>
            <label className="form-field inline">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option === "ALL" ? "All statuses" : option}</option>
                ))}
              </select>
            </label>
            <label className="form-field inline">
              <span>Gateway</span>
              <select value={gatewayFilter} onChange={(event) => setGatewayFilter(event.target.value as GatewayFilter)}>
                <option value="ALL">All gateways</option>
                <option value="disabled">disabled</option>
                <option value="local">local</option>
                <option value="openrouter">openrouter</option>
              </select>
            </label>
            <label className="form-field inline">
              <span>Output type</span>
              <select value={outputTypeFilter} onChange={(event) => setOutputTypeFilter(event.target.value as OutputTypeFilter)}>
                <option value="ALL">All output types</option>
                <option value="summary">summary</option>
                <option value="content_plan_draft">content plan draft</option>
                <option value="article_draft">article draft</option>
              </select>
            </label>
          </div>

          {filteredRuns.length === 0 ? (
            <EmptyState
              title="No AI workflow runs"
              message={runs.length === 0 ? "Execute an AI Delivery workflow run to populate this console." : "No runs match the current filters."}
            />
          ) : (
            <div className="table-scroll">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Month</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Gateway</th>
                    <th>Model</th>
                    <th>Context</th>
                    <th>Tokens</th>
                    <th>Executed</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <span className="mono-copy" title={run.id}>{run.shortId}</span>
                      </td>
                      <td>{run.projectName}</td>
                      <td>{run.clientName ?? "—"}</td>
                      <td>{run.targetMonth ?? "—"}</td>
                      <td>{formatLabel(run.workflowType)}</td>
                      <td><StatusBadge status={run.status} /></td>
                      <td>{formatLabel(run.gateway)}</td>
                      <td>{run.model ?? "—"}</td>
                      <td>{contextStatusBadge(run.contextStatus)}</td>
                      <td>
                        {run.approximateInputTokens ?? "—"}
                        {run.maxOutputTokens ? ` / ${run.maxOutputTokens}` : ""}
                      </td>
                      <td>{formatTimestamp(run.executedAt)}</td>
                      <td>
                        <button className="secondary-action" onClick={() => void openRunDetail(run.id)} type="button">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
