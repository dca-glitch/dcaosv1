import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AiOperationsRunDetail,
  AiOperationsRunListItem,
  AiOperationsRunResponse,
  AiOperationsRunsResponse,
  AiWorkflowContextUsageSummary
} from "@dca-os-v1/shared";
import { formatAiOperationsWorkflowKindLabel, formatAiWorkflowTokenEstimate } from "@dca-os-v1/shared";
import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  ExportButton,
  Input,
  LoadingState,
  MetricCard,
  Modal,
  PageHeader,
  SectionPanel,
  Select,
  StatusBadge,
  StatusSummaryBar,
  Table,
  TablePaginationBar,
} from "../../components/ui";
import {
  AI_OPS_PAGE_SIZE,
  buildRunsCsv,
  buildStatusSummaryItems,
  contextStatusLabel,
  filterAiOperationsRuns,
  formatAiOpsLabel,
  formatAiOpsTimestamp,
  paginateItems,
  parseAiOperationsRunIdFromHash,
  selectErrorLogRuns,
  summarizeContextUsage,
  type AiOpsGatewayFilter,
  type AiOpsOutputTypeFilter,
  type AiOpsSourceFilter,
  type AiOpsStatusFilter,
} from "./aiOperationsModel";
import "./ai-operations.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

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

function contextStatusKey(status: AiWorkflowContextUsageSummary["status"]): string {
  if (status === "used") return "completed";
  if (status === "skipped") return "archived";
  return "draft";
}

function contextStatusBadge(status: AiWorkflowContextUsageSummary["status"]) {
  return (
    <StatusBadge
      displayLabel={contextStatusLabel(status)}
      status={contextStatusKey(status)}
    />
  );
}

/**
 * Run detail uses the existing AI Operations Modal.
 * AiRunReviewModal (Phase 4) reuse is deferred — that modal is tightly coupled to
 * AI Delivery project/form/save/execute props and cannot be wired safely without changes.
 */
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
    <Modal isOpen onClose={onClose} title={run ? `Run ${run.shortId}` : "AI run detail"}>
      {loading ? <LoadingState label="Loading run detail…" /> : null}
      {error ? <ErrorState message={error} title="Run detail blocked" /> : null}
      {!loading && !error && run ? (
        <div className="ai-ops-detail-stack stack gap-md">
          <SectionPanel title="Execution summary" description="Gateway, model, and result metadata for operator review.">
            <dl className="detail-grid compact">
              <div><dt>Source</dt><dd>{formatAiOperationsWorkflowKindLabel(run.workflowKind)}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={run.status} /></dd></div>
              <div><dt>Project</dt><dd>{run.projectName}</dd></div>
              <div><dt>Client</dt><dd>{run.clientName ?? "Not linked"}</dd></div>
              <div><dt>Target month</dt><dd>{run.targetMonth ?? "Not recorded"}</dd></div>
              <div><dt>Workflow type</dt><dd>{formatAiOpsLabel(run.workflowType)}</dd></div>
              <div><dt>Gateway</dt><dd>{formatAiOpsLabel(run.gateway)}</dd></div>
              <div><dt>Provider mode</dt><dd>{formatAiOpsLabel(run.providerMode)}</dd></div>
              <div><dt>Model</dt><dd>{run.model ?? "Not recorded"}</dd></div>
              <div><dt>Deterministic</dt><dd>{run.isDeterministic === null ? "Unknown" : run.isDeterministic ? "Yes" : "No"}</dd></div>
              <div><dt>Live provider</dt><dd>{run.liveProviderCalled === null ? "Unknown" : run.liveProviderCalled ? "Called" : "Not called"}</dd></div>
              {run.workflowKind === "ai_delivery_workflow_run" ? (
                <div><dt>Context</dt><dd>{contextStatusBadge(run.contextUsage.status)}</dd></div>
              ) : null}
              <div><dt>Completed at</dt><dd>{formatAiOpsTimestamp(run.executedAt)}</dd></div>
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
                  <div><dt>Insight status</dt><dd>{formatAiOpsLabel(run.linkedInsightStatus, "Not linked")}</dd></div>
                  <div><dt>Handoff status</dt><dd>{formatAiOpsLabel(run.linkedHandoffStatus, "Not linked")}</dd></div>
                </>
              ) : null}
            </dl>
          </SectionPanel>

          {run.workflowKind === "ai_delivery_workflow_run" && run.resultSummary ? (
            <SectionPanel title="AI_WORKFLOW_RESULT_V1 summary" description="Parsed result contract summary.">
              <dl className="detail-grid compact">
                <div><dt>Title</dt><dd>{run.resultSummary.title ?? "Not recorded"}</dd></div>
                <div><dt>Summary</dt><dd>{run.resultSummary.summary ?? "Not recorded"}</dd></div>
                <div><dt>Deliverable type</dt><dd>{formatAiOpsLabel(run.resultSummary.outputType)}</dd></div>
                <div><dt>Generated at</dt><dd>{formatAiOpsTimestamp(run.resultSummary.generatedAt)}</dd></div>
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

          {run.workflowKind === "ai_delivery_workflow_run" ? (
            <SectionPanel
              title="Context usage"
              description="Status and detail from existing run metadata — no provider secrets."
            >
              <div className="stack gap-sm">
                <div>{contextStatusBadge(run.contextUsage.status)}</div>
                {run.contextUsage.detail ? (
                  <p className="ai-ops-context-detail">{run.contextUsage.detail}</p>
                ) : (
                  <p className="muted-copy">No additional context detail recorded for this run.</p>
                )}
                <dl className="detail-grid compact">
                  <div>
                    <dt>Input tokens (est.)</dt>
                    <dd>{formatAiWorkflowTokenEstimate(run.approximateInputTokens, run.maxOutputTokens)}</dd>
                  </div>
                  <div>
                    <dt>Budget policy</dt>
                    <dd>{run.budgetPolicy ?? "Not recorded"}</dd>
                  </div>
                </dl>
              </div>
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
  const [statusFilter, setStatusFilter] = useState<AiOpsStatusFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<AiOpsSourceFilter>("ALL");
  const [gatewayFilter, setGatewayFilter] = useState<AiOpsGatewayFilter>("ALL");
  const [outputTypeFilter, setOutputTypeFilter] = useState<AiOpsOutputTypeFilter>("ALL");
  const [page, setPage] = useState(1);
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
    const deepLinkId = parseAiOperationsRunIdFromHash(window.location.hash);
    if (deepLinkId) {
      window.location.hash = "#/ai-operations";
    }
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      const runId = parseAiOperationsRunIdFromHash(window.location.hash);
      if (runId && runId !== selectedRunId) {
        void openRunDetail(runId);
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openRunDetail, selectedRunId]);

  const statusOptions = useMemo(() => {
    const values = new Set(runs.map((run) => run.status));
    return ["ALL", ...Array.from(values).sort()];
  }, [runs]);

  const filteredRuns = useMemo(
    () =>
      filterAiOperationsRuns(runs, {
        search,
        statusFilter,
        sourceFilter,
        gatewayFilter,
        outputTypeFilter
      }),
    [gatewayFilter, outputTypeFilter, runs, search, sourceFilter, statusFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter, gatewayFilter, outputTypeFilter]);

  const pageSlice = useMemo(
    () => paginateItems(filteredRuns, page, AI_OPS_PAGE_SIZE),
    [filteredRuns, page]
  );

  useEffect(() => {
    if (page !== pageSlice.page) {
      setPage(pageSlice.page);
    }
  }, [page, pageSlice.page]);

  const exportVisibleRunsCsv = useCallback(() => {
    if (filteredRuns.length === 0) {
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`ai-operations-runs-${stamp}.csv`, buildRunsCsv(filteredRuns));
  }, [filteredRuns]);

  const statusSummaryItems = useMemo(() => buildStatusSummaryItems(filteredRuns), [filteredRuns]);
  const contextAnalytics = useMemo(() => summarizeContextUsage(filteredRuns), [filteredRuns]);
  const errorLogRuns = useMemo(() => selectErrorLogRuns(filteredRuns), [filteredRuns]);

  return (
    <div className="page-stack ai-ops-console" data-density="compact">
      <PageHeader
        eyebrow="AI Operations"
        title="AI Operations Console"
        description="Review AI Delivery workflow runs and Market Intelligence research runs — gateway mode, context usage, and safe metadata."
        actions={(
          <>
            <ExportButton
              disabled={filteredRuns.length === 0}
              label="Export CSV"
              onExport={exportVisibleRunsCsv}
              title={filteredRuns.length === 0 ? "No runs match the current filters" : "Export visible runs as CSV"}
            />
            <Button onClick={() => void loadRuns()} type="button" variant="secondary">
              Refresh
            </Button>
          </>
        )}
      />

      {error ? <ErrorState message={error} title="AI Operations blocked" /> : null}
      {loading ? <LoadingState label="Loading AI operations runs…" /> : null}

      {!loading && !error ? (
        <>
          <SectionPanel
            title="Context usage analytics"
            description="Aggregated from visible runs — estimates only, not billing records."
          >
            <div className="ai-ops-analytics-grid" aria-label="Context usage analytics">
              <MetricCard
                helper="Runs with context included"
                label="Context used"
                value={String(contextAnalytics.used)}
              />
              <MetricCard
                helper="Runs that skipped context"
                label="Context skipped"
                value={String(contextAnalytics.skipped)}
              />
              <MetricCard
                helper="Runs without loaded context"
                label="Not loaded"
                value={String(contextAnalytics.notLoaded)}
              />
              <MetricCard
                helper={
                  contextAnalytics.runsWithTokenEstimate > 0
                    ? `${contextAnalytics.runsWithTokenEstimate} run(s) with estimates`
                    : "No token estimates on visible runs"
                }
                label="Est. input tokens"
                value={
                  contextAnalytics.runsWithTokenEstimate > 0
                    ? String(contextAnalytics.approximateInputTokensSum)
                    : "—"
                }
              />
            </div>
          </SectionPanel>

          <SectionPanel
            title="Error log"
            description="Safe error summaries from visible runs — no provider payloads or secrets."
          >
            {errorLogRuns.length === 0 ? (
              <EmptyState
                title="No errors in visible runs"
                message="Failed or warning runs will appear here when safe error metadata is present."
              />
            ) : (
              <div className="ai-ops-error-log" role="list">
                {errorLogRuns.map((run) => (
                  <div className="ai-ops-error-log__row" key={run.id} role="listitem">
                    <div className="stack gap-xs">
                      <div className="ai-ops-error-log__meta">
                        <span className="mono-copy" title={run.id}>{run.shortId}</span>
                        <StatusBadge status={run.status} />
                        <span className="muted-copy">{formatAiOperationsWorkflowKindLabel(run.workflowKind)}</span>
                        <span className="muted-copy">{run.projectName}</span>
                      </div>
                      <p className="ai-ops-error-log__message">
                        {run.safeError?.trim() || run.executionError?.trim() || "Error recorded"}
                      </p>
                    </div>
                    <Button onClick={() => void openRunDetail(run.id)} size="sm" type="button" variant="secondary">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

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
                onChange={(event) => setSourceFilter(event.target.value as AiOpsSourceFilter)}
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
                onChange={(event) => setGatewayFilter(event.target.value as AiOpsGatewayFilter)}
                options={[
                  { value: "ALL", label: "All gateways" },
                  { value: "disabled", label: "disabled" },
                  { value: "local", label: "local" },
                  { value: "openrouter", label: "openrouter" }
                ]}
                value={gatewayFilter}
              />
              <Select
                label="Deliverable type"
                onChange={(event) => setOutputTypeFilter(event.target.value as AiOpsOutputTypeFilter)}
                options={[
                  { value: "ALL", label: "All deliverable types" },
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
              <StatusSummaryBar ariaLabel="Visible run status counts" items={statusSummaryItems} />
            </div>

            {filteredRuns.length === 0 ? (
              <EmptyState
                title="No AI operations runs"
                message={runs.length === 0 ? "Run an AI Delivery workflow or a Market Intelligence research run to populate this console." : "No runs match the current filters. Adjust filters to see more results."}
              />
            ) : (
              <>
                <div className="table-wrap table-scroll">
                  <Table
                    aria-label="AI operations runs"
                    className="data-table compact ai-ops-runs-table"
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
                      { label: "Completed at", align: "left" },
                      { label: "Actions", align: "right" }
                    ]}
                    rows={pageSlice.items.map((run) => ({
                      key: run.id,
                      cells: [
                        <span className="mono-copy" key={`${run.id}-short`} title={run.id}>{run.shortId}</span>,
                        formatAiOperationsWorkflowKindLabel(run.workflowKind),
                        run.projectName,
                        run.clientName ?? "—",
                        run.targetMonth ?? "—",
                        formatAiOpsLabel(run.workflowType),
                        <StatusBadge key={`${run.id}-status`} status={run.status} />,
                        formatAiOpsLabel(run.gateway),
                        run.model ?? "—",
                        contextStatusBadge(run.contextStatus),
                        formatAiWorkflowTokenEstimate(run.approximateInputTokens, run.maxOutputTokens),
                        formatAiOpsTimestamp(run.executedAt),
                        <Button key={`${run.id}-review`} onClick={() => void openRunDetail(run.id)} size="sm" variant="secondary">
                          Review
                        </Button>
                      ]
                    }))}
                  />
                </div>
                <TablePaginationBar
                  onNext={() => setPage((current) => current + 1)}
                  onPrev={() => setPage((current) => Math.max(1, current - 1))}
                  page={pageSlice.page}
                  perPage={pageSlice.perPage}
                  total={pageSlice.total}
                />
              </>
            )}
          </SectionPanel>
        </>
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
