import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import type {
  MarketIntelligenceHandoffSummary,
  MarketIntelligenceInsightSummary,
  MarketIntelligenceProjectSummary,
  MarketIntelligenceResearchRunSummary,
  MarketIntelligenceSourceSummary
} from "@dca-os-v1/shared";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { MetricCard, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type ProjectFormValues = {
  title: string;
  description: string;
  keywords: string;
  competitors: string;
  niche: string;
  productServiceFocus: string;
  clientId: string;
  targetMonth: string;
};

type ClientOption = {
  id: string;
  name: string;
  website: string | null;
  isArchived: boolean;
};

type AiMarketIntelligencePageProps = {
  clients: ClientOption[];
};

type SourceFormValues = {
  title: string;
  sourceUrl: string;
  sourceNotes: string;
};

type InsightFormValues = {
  title: string;
  summary: string;
  status: string;
};

const EMPTY_PROJECT_FORM: ProjectFormValues = {
  title: "",
  description: "",
  keywords: "",
  competitors: "",
  niche: "",
  productServiceFocus: "",
  clientId: "",
  targetMonth: ""
};

const INSIGHT_STATUS_OPTIONS = ["DRAFT", "NEEDS_REVISION", "REVIEWED", "APPROVED"] as const;
const HANDOFF_STATUS_OPTIONS = ["DRAFT", "READY", "APPLIED", "ARCHIVED"] as const;

const WORKFLOW_STEPS = [
  { id: "sources", label: "Add research sources", hint: "Capture URLs, competitors, and notes." },
  { id: "run", label: "Execute a research run", hint: "Generate a bounded insight from project inputs." },
  { id: "approve", label: "Approve a market insight", hint: "Human review before any handoff." },
  { id: "handoff", label: "Prepare internal handoff", hint: "Package findings for AI Delivery." },
  { id: "ready", label: "Mark handoff READY", hint: "Then attach it inside AI Delivery." }
] as const;

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: { code: "REQUEST_FAILED", message: "Request could not be completed." }
    };
  }

  return payload;
}

async function apiData<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await apiRequest<T>(method, path, body);
  if (!response.ok) {
    throw new Error(response.error.message || "Request failed.");
  }
  return response.data;
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatResultFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function renderResultData(resultData: MarketIntelligenceInsightSummary["resultData"]) {
  if (!resultData) {
    return null;
  }

  return Object.entries(resultData)
    .filter(([, value]) => {
      if (value == null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return String(value).trim().length > 0;
    })
    .map(([key, value]) => (
      <div className="dense-field" key={key}>
        <span>{formatResultFieldLabel(key)}</span>
        {Array.isArray(value) ? (
          <ul className="muted-text" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
            {value.map((entry, index) => (
              <li key={`${key}-${index}`}>{String(entry)}</li>
            ))}
          </ul>
        ) : (
          <strong>{String(value)}</strong>
        )}
      </div>
    ));
}

function projectCardStyle(selected: boolean): CSSProperties | undefined {
  return selected
    ? { borderColor: "rgba(82, 224, 255, 0.32)", background: "rgba(82, 224, 255, 0.06)" }
    : undefined;
}

export function AiMarketIntelligencePage({ clients }: AiMarketIntelligencePageProps) {
  const [projects, setProjects] = useState<MarketIntelligenceProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<"active" | "archived" | "all">("active");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sources, setSources] = useState<MarketIntelligenceSourceSummary[]>([]);
  const [runs, setRuns] = useState<MarketIntelligenceResearchRunSummary[]>([]);
  const [insights, setInsights] = useState<MarketIntelligenceInsightSummary[]>([]);
  const [handoffs, setHandoffs] = useState<MarketIntelligenceHandoffSummary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [handoffPreparing, setHandoffPreparing] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [sourceForm, setSourceForm] = useState<SourceFormValues>({ title: "", sourceUrl: "", sourceNotes: "" });
  const [insightForm, setInsightForm] = useState<InsightFormValues>({ title: "", summary: "", status: "DRAFT" });
  const [savingProject, setSavingProject] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);

  const activeClients = useMemo(
    () => clients.filter((client) => !client.isArchived),
    [clients]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (projectFilter === "active") {
          return !project.isArchived;
        }
        if (projectFilter === "archived") {
          return project.isArchived;
        }
        return true;
      }),
    [projectFilter, projects]
  );

  const approvedInsights = useMemo(
    () => insights.filter((insight) => insight.status === "APPROVED" && !insight.isArchived),
    [insights]
  );

  const readyHandoffs = useMemo(
    () => handoffs.filter((handoff) => !handoff.isArchived && (handoff.handoffStatus === "READY" || handoff.handoffStatus === "APPLIED")),
    [handoffs]
  );

  const workflowCompletion = useMemo(() => {
    const hasSources = sources.some((source) => !source.isArchived);
    const hasExecutedRun = runs.some((run) => run.status === "EXECUTED");
    const hasApprovedInsight = approvedInsights.length > 0;
    const hasHandoff = handoffs.some((handoff) => !handoff.isArchived);
    const hasReadyHandoff = readyHandoffs.length > 0;

    return {
      sources: hasSources,
      run: hasExecutedRun,
      approve: hasApprovedInsight,
      handoff: hasHandoff,
      ready: hasReadyHandoff
    };
  }, [approvedInsights.length, handoffs, readyHandoffs.length, runs, sources]);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const data = await apiData<{ projects: MarketIntelligenceProjectSummary[] }>("GET", "/market-intelligence-projects");
      setProjects(data.projects ?? []);
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : "Market Intelligence projects could not be loaded.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadProjectData = useCallback(async (projectId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [sourcesData, runsData, insightsData, handoffsData] = await Promise.all([
        apiData<{ sources: MarketIntelligenceSourceSummary[] }>("GET", `/market-intelligence-projects/${projectId}/sources`),
        apiData<{ researchRuns: MarketIntelligenceResearchRunSummary[] }>("GET", `/market-intelligence-projects/${projectId}/research-runs`),
        apiData<{ insights: MarketIntelligenceInsightSummary[] }>("GET", `/market-intelligence-projects/${projectId}/insights`),
        apiData<{ handoffs: MarketIntelligenceHandoffSummary[] }>("GET", `/market-intelligence-projects/${projectId}/handoffs`)
      ]);

      setSources(sourcesData.sources ?? []);
      setRuns(runsData.researchRuns ?? []);
      setInsights(insightsData.insights ?? []);
      setHandoffs(handoffsData.handoffs ?? []);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Project research data could not be loaded.");
      setSources([]);
      setRuns([]);
      setInsights([]);
      setHandoffs([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }
    void loadProjectData(selectedProjectId);
  }, [loadProjectData, selectedProjectId]);

  const handleCreateProject = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectForm.title.trim()) {
      setActionError("Project name is required.");
      return;
    }

    if (!projectForm.clientId) {
      setActionError("Client is required.");
      return;
    }

    setSavingProject(true);
    setActionError(null);
    try {
      await apiData<{ project: MarketIntelligenceProjectSummary }>("POST", "/market-intelligence-projects", projectForm);
      setProjectForm(EMPTY_PROJECT_FORM);
      setShowProjectModal(false);
      await loadProjects();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Project could not be created.");
    } finally {
      setSavingProject(false);
    }
  }, [loadProjects, projectForm]);

  const handleCreateSource = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !sourceForm.title.trim()) {
      setActionError("Select a project and provide a source title.");
      return;
    }

    setSavingSource(true);
    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/sources`, {
        ...sourceForm,
        projectId: selectedProjectId
      });
      setSourceForm({ title: "", sourceUrl: "", sourceNotes: "" });
      setShowSourceModal(false);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Source could not be created.");
    } finally {
      setSavingSource(false);
    }
  }, [loadProjectData, selectedProjectId, sourceForm]);

  const handleCreateInsight = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !insightForm.title.trim()) {
      setActionError("Select a project and provide an insight title.");
      return;
    }

    setSavingInsight(true);
    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/insights`, {
        ...insightForm,
        projectId: selectedProjectId
      });
      setInsightForm({ title: "", summary: "", status: "DRAFT" });
      setShowInsightModal(false);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Insight could not be created.");
    } finally {
      setSavingInsight(false);
    }
  }, [insightForm, loadProjectData, selectedProjectId]);

  const handleCreateRun = useCallback(async () => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/research-runs`, {
        projectId: selectedProjectId,
        status: "PENDING"
      });
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Research run could not be created.");
    }
  }, [loadProjectData, selectedProjectId]);

  const handleExecuteRun = useCallback(async (runId: string) => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/research-runs/${runId}/execute`);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Research run could not be executed.");
    }
  }, [loadProjectData, selectedProjectId]);

  const handlePrepareHandoff = useCallback(async (insightId: string) => {
    if (!selectedProjectId) {
      return;
    }

    setHandoffPreparing(insightId);
    setActionError(null);
    try {
      const data = await apiData<{ handoff: MarketIntelligenceHandoffSummary | null }>(
        "POST",
        `/market-intelligence-projects/${selectedProjectId}/handoffs/prepare`,
        { insightId }
      );
      if (!data.handoff) {
        setActionError("Handoff prepare failed. Ensure the insight is APPROVED.");
        return;
      }
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Handoff could not be prepared.");
    } finally {
      setHandoffPreparing(null);
    }
  }, [loadProjectData, selectedProjectId]);

  const handleUpdateHandoffStatus = useCallback(async (handoffId: string, handoffStatus: string) => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData(
        "PUT",
        `/market-intelligence-projects/${selectedProjectId}/handoffs/${handoffId}/status`,
        { handoffStatus }
      );
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Handoff status could not be updated.");
    }
  }, [loadProjectData, selectedProjectId]);

  const handleUpdateInsightStatus = useCallback(async (insightId: string, status: string) => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData("PUT", `/market-intelligence-projects/${selectedProjectId}/insights/${insightId}`, { status });
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Insight status could not be updated.");
    }
  }, [loadProjectData, selectedProjectId]);

  if (projectsLoading) {
    return <LoadingState label="Loading Market Intelligence" />;
  }

  if (projectsError) {
    return <ErrorState message={projectsError} title="Market Intelligence unavailable" />;
  }

  return (
    <section className="view-section" aria-labelledby="market-intelligence-title">
      <PageHeader
        actions={
          <button className="primary-action" onClick={() => setShowProjectModal(true)} type="button">
            New research project
          </button>
        }
        description="Admin-only competitive research. Follow the workflow below, then attach READY handoffs inside AI Delivery."
        eyebrow="Research"
        title="Market Intelligence"
        titleId="market-intelligence-title"
      />

      {actionError ? (
        <div className="state-panel" role="alert">
          <p>{actionError}</p>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)", alignItems: "start" }}>
        <aside className="entity-card">
          <div className="entity-card-header">
            <div>
              <p className="eyebrow">Projects</p>
              <h2>Research queue</h2>
            </div>
          </div>

          <div className="filter-bar" role="group" aria-label="Project filter">
            {(["active", "archived", "all"] as const).map((value) => (
              <button
                aria-pressed={projectFilter === value}
                className={projectFilter === value ? "secondary-action filter-chip is-active" : "secondary-action filter-chip"}
                key={value}
                onClick={() => setProjectFilter(value)}
                type="button"
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <EmptyState
              action={
                <button className="primary-action" onClick={() => setShowProjectModal(true)} type="button">
                  Create first project
                </button>
              }
              message="Create a research project to start the operator workflow."
              title="No projects"
            />
          ) : (
            <div className="dense-list">
              {filteredProjects.map((project) => (
                <article
                  className="entity-card dense-record"
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProjectId(project.id);
                    }
                  }}
                  role="button"
                  style={projectCardStyle(selectedProjectId === project.id)}
                  tabIndex={0}
                >
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status={project.isArchived ? "ARCHIVED" : project.status} />
                      </div>
                      <h3>{project.title}</h3>
                      <div className="dense-meta">
                        <span>{formatDateLabel(project.createdAt)}</span>
                        {project.targetMonth ? <span>{project.targetMonth}</span> : null}
                        {project.client?.name ? <span>{project.client.name}</span> : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>

        <div>
          {!selectedProject ? (
            <EmptyState
              message="Choose a research project from the left queue to run the monthly operator workflow."
              title="Select a project"
            />
          ) : detailLoading ? (
            <LoadingState label="Loading project research data" />
          ) : (
            <>
              {detailError ? <ErrorState message={detailError} title="Project data unavailable" /> : null}

              <PageHeader
                description={selectedProject.description || "No description yet."}
                eyebrow="Selected project"
                meta={
                  <div className="dense-meta">
                    {selectedProject.client?.name ? <span>Client: {selectedProject.client.name}</span> : null}
                    {selectedProject.targetMonth ? <span>Month: {selectedProject.targetMonth}</span> : null}
                    {selectedProject.niche ? <span>Niche: {selectedProject.niche}</span> : null}
                    {selectedProject.productServiceFocus ? <span>Focus: {selectedProject.productServiceFocus}</span> : null}
                  </div>
                }
                title={selectedProject.title}
              />

              <div className="summary-grid metric-grid">
                <MetricCard accent="cyan" helper="Curated references" label="Sources" value={sources.filter((s) => !s.isArchived).length} />
                <MetricCard accent="violet" helper="Bounded executions" label="Runs" value={runs.filter((r) => r.status === "EXECUTED").length} />
                <MetricCard accent="purple" helper="Approved for handoff" label="Insights" value={approvedInsights.length} />
                <MetricCard accent="success" helper="READY or APPLIED" label="Handoffs" value={readyHandoffs.length} />
              </div>

              <SectionPanel
                description="Complete each step in order. Only approved insights can become internal handoffs for AI Delivery."
                title="Operator workflow"
                tone="compact"
              >
                <div className="dense-list">
                  {WORKFLOW_STEPS.map((step) => {
                    const done = workflowCompletion[step.id];
                    return (
                      <article className="entity-card dense-record" key={step.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <h3>{step.label}</h3>
                            <div className="dense-meta">
                              <span>{step.hint}</span>
                            </div>
                          </div>
                          <StatusBadge status={done ? "done" : "pending"} />
                        </div>
                      </article>
                    );
                  })}
                </div>
                {(selectedProject.keywords || selectedProject.competitors) && (
                  <div className="dense-row-note" style={{ marginTop: "12px" }}>
                    {selectedProject.keywords ? <>Keywords: {selectedProject.keywords}. </> : null}
                    {selectedProject.competitors ? <>Competitors: {selectedProject.competitors}.</> : null}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => setShowSourceModal(true)} type="button">
                    Add source
                  </button>
                }
                description="URLs, competitor pages, and internal notes used as research evidence."
                title="Research sources"
                tone="compact"
              >
                {sources.length === 0 ? (
                  <EmptyState message="Add at least one source before running research." title="No sources yet" />
                ) : (
                  <div className="dense-list">
                    {sources.map((source) => (
                      <article className="entity-card dense-record" key={source.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={source.isArchived ? "ARCHIVED" : "ACTIVE"} />
                            </div>
                            <h3>{source.title}</h3>
                            {source.sourceUrl ? (
                              <a href={source.sourceUrl} rel="noopener noreferrer" target="_blank">
                                {source.sourceUrl}
                              </a>
                            ) : null}
                          </div>
                          {source.sourceNotes ? <div className="dense-row-note">{source.sourceNotes}</div> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => void handleCreateRun()} type="button">
                    Create run
                  </button>
                }
                description="Deterministic placeholder execution — no live crawling in MVP."
                title="Research runs"
                tone="compact"
              >
                {runs.length === 0 ? (
                  <EmptyState message="Create a run, then execute it to generate structured insight output." title="No runs yet" />
                ) : (
                  <div className="dense-list">
                    {runs.map((run) => (
                      <article className="entity-card dense-record" key={run.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={run.status} />
                            </div>
                            <div className="dense-meta">
                              {run.sourceCount !== undefined ? <span>{run.sourceCount} source(s)</span> : null}
                              <span>{formatDateLabel(run.executedAt ?? run.createdAt)}</span>
                            </div>
                          </div>
                          {run.resultSummary ? <div className="dense-row-note">{run.resultSummary}</div> : null}
                          {run.generatedInsightId ? (
                            <div className="dense-row-note">Generated insight is listed below in Market insights.</div>
                          ) : null}
                          {run.executionLog ? (
                            <details className="row-action-menu">
                              <summary>Execution log</summary>
                              <pre className="dense-row-note">{run.executionLog}</pre>
                            </details>
                          ) : null}
                          <div className="dense-actions">
                            {run.status === "PENDING" ? (
                              <button className="primary-action" onClick={() => void handleExecuteRun(run.id)} type="button">
                                Execute run
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => setShowInsightModal(true)} type="button">
                    Add insight
                  </button>
                }
                description="Review and approve findings before preparing an internal handoff."
                title="Market insights"
                tone="compact"
              >
                {insights.length === 0 ? (
                  <EmptyState message="Execute a research run or add an insight manually." title="No insights yet" />
                ) : (
                  <div className="dense-list">
                    {insights.map((insight) => (
                      <article className="entity-card dense-record" key={insight.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={insight.status} />
                            </div>
                            <h3>{insight.title}</h3>
                            {insight.sourceCount !== undefined ? (
                              <div className="dense-meta">
                                <span>Evidence from {insight.sourceCount} source(s)</span>
                              </div>
                            ) : null}
                          </div>

                          {insight.summary ? <div className="dense-row-note">{insight.summary}</div> : null}

                          {insight.resultData ? (
                            <div className="dense-fields">{renderResultData(insight.resultData)}</div>
                          ) : null}

                          {insight.reviewerNotes ? (
                            <div className="dense-row-note">
                              <strong>Reviewer notes:</strong> {insight.reviewerNotes}
                            </div>
                          ) : null}

                          <div className="dense-actions">
                            <label>
                              <span className="muted-text">Status</span>
                              <select
                                onChange={(event) => void handleUpdateInsightStatus(insight.id, event.target.value)}
                                value={insight.status}
                              >
                                {INSIGHT_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="Admin-only bridge to AI Delivery. Set handoff to READY, then attach it from the AI Delivery project screen."
                title="Internal handoffs"
                tone="compact"
              >
                {approvedInsights.length > 0 ? (
                  <div className="dense-list" style={{ marginBottom: "14px" }}>
                    {approvedInsights.map((insight) => (
                      <article className="entity-card dense-record" key={insight.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <h3>{insight.title}</h3>
                            <div className="dense-meta">
                              <span>Approved insight</span>
                            </div>
                          </div>
                          <div className="dense-actions">
                            <button
                              className="primary-action"
                              disabled={handoffPreparing === insight.id}
                              onClick={() => void handlePrepareHandoff(insight.id)}
                              type="button"
                            >
                              {handoffPreparing === insight.id ? "Preparing…" : "Prepare handoff"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Approve an insight above before preparing a handoff." title="No approved insights" />
                )}

                {handoffs.length === 0 ? (
                  <EmptyState message="Prepared handoffs appear here with DRAFT → READY → APPLIED lifecycle." title="No handoffs yet" />
                ) : (
                  <div className="dense-list">
                    {handoffs.map((handoff) => (
                      <article className="entity-card dense-record" key={handoff.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={handoff.handoffStatus} />
                            </div>
                            <h3>{handoff.title}</h3>
                            <div className="dense-meta">
                              {handoff.targetClientName ? <span>{handoff.targetClientName}</span> : null}
                              {handoff.targetMonth ? <span>{handoff.targetMonth}</span> : null}
                              {handoff.aiDeliveryProjectId ? <span>Linked to AI Delivery</span> : null}
                            </div>
                          </div>

                          {handoff.marketSummary ? <div className="dense-row-note">{handoff.marketSummary}</div> : null}

                          <div className="dense-fields">
                            {handoff.audienceSignals?.length ? (
                              <div className="dense-field">
                                <span>Audience signals</span>
                                <ul className="muted-text" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                                  {handoff.audienceSignals.map((signal, index) => (
                                    <li key={`${handoff.id}-audience-${index}`}>{signal}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.opportunities?.length ? (
                              <div className="dense-field">
                                <span>Opportunities</span>
                                <ul className="muted-text" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                                  {handoff.opportunities.map((entry, index) => (
                                    <li key={`${handoff.id}-opportunity-${index}`}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.risks?.length ? (
                              <div className="dense-field">
                                <span>Risks</span>
                                <ul className="muted-text" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                                  {handoff.risks.map((entry, index) => (
                                    <li key={`${handoff.id}-risk-${index}`}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.recommendedActions?.length ? (
                              <div className="dense-field">
                                <span>Recommended actions</span>
                                <ul className="muted-text" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                                  {handoff.recommendedActions.map((entry, index) => (
                                    <li key={`${handoff.id}-action-${index}`}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>

                          {handoff.sourceNote ? <div className="dense-row-note">{handoff.sourceNote}</div> : null}

                          <div className="dense-actions">
                            <label>
                              <span className="muted-text">Handoff status</span>
                              <select
                                onChange={(event) => void handleUpdateHandoffStatus(handoff.id, event.target.value)}
                                value={handoff.handoffStatus}
                              >
                                {HANDOFF_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </>
          )}
        </div>
      </div>

      {showProjectModal ? (
        <Modal onClose={() => setShowProjectModal(false)} title="Create research project">
          <form className="entity-form" onSubmit={handleCreateProject}>
            <p className="muted-text">Optional client/month fields help group research with AI Delivery and monthly reports.</p>
            <div className="field-grid">
              <label className="field-span-2">
                Project name — required
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={projectForm.title}
                />
              </label>
              <label className="field-span-2">
                Description
                <textarea
                  onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  value={projectForm.description}
                />
              </label>
              <label>
                Keywords
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, keywords: event.target.value }))}
                  placeholder="AI tools, SaaS pricing"
                  value={projectForm.keywords}
                />
              </label>
              <label>
                Competitors
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, competitors: event.target.value }))}
                  placeholder="Acme Corp, Rival Co"
                  value={projectForm.competitors}
                />
              </label>
              <label>
                Market niche
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, niche: event.target.value }))}
                  value={projectForm.niche}
                />
              </label>
              <label>
                Product / service focus
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, productServiceFocus: event.target.value }))}
                  value={projectForm.productServiceFocus}
                />
              </label>
              <label>
                Client — required
                <select
                  onChange={(event) => setProjectForm((current) => ({ ...current, clientId: event.target.value }))}
                  required
                  value={projectForm.clientId}
                >
                  <option value="">Select client</option>
                  {activeClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.website ? ` (${client.website})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Target month
                <input
                  onChange={(event) => setProjectForm((current) => ({ ...current, targetMonth: event.target.value }))}
                  placeholder="2026-07"
                  value={projectForm.targetMonth}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setShowProjectModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={savingProject} type="submit">
                {savingProject ? "Creating…" : "Create project"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showSourceModal ? (
        <Modal onClose={() => setShowSourceModal(false)} title="Add research source">
          <form className="entity-form" onSubmit={handleCreateSource}>
            <div className="field-grid">
              <label className="field-span-2">
                Source title — required
                <input
                  onChange={(event) => setSourceForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={sourceForm.title}
                />
              </label>
              <label className="field-span-2">
                Source URL
                <input
                  onChange={(event) => setSourceForm((current) => ({ ...current, sourceUrl: event.target.value }))}
                  value={sourceForm.sourceUrl}
                />
              </label>
              <label className="field-span-2">
                Notes
                <textarea
                  onChange={(event) => setSourceForm((current) => ({ ...current, sourceNotes: event.target.value }))}
                  rows={3}
                  value={sourceForm.sourceNotes}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setShowSourceModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={savingSource} type="submit">
                {savingSource ? "Saving…" : "Add source"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showInsightModal ? (
        <Modal onClose={() => setShowInsightModal(false)} title="Add market insight">
          <form className="entity-form" onSubmit={handleCreateInsight}>
            <div className="field-grid">
              <label className="field-span-2">
                Insight title — required
                <input
                  onChange={(event) => setInsightForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={insightForm.title}
                />
              </label>
              <label className="field-span-2">
                Summary
                <textarea
                  onChange={(event) => setInsightForm((current) => ({ ...current, summary: event.target.value }))}
                  rows={3}
                  value={insightForm.summary}
                />
              </label>
              <label>
                Status
                <select
                  onChange={(event) => setInsightForm((current) => ({ ...current, status: event.target.value }))}
                  value={insightForm.status}
                >
                  {INSIGHT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setShowInsightModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={savingInsight} type="submit">
                {savingInsight ? "Saving…" : "Add insight"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
