import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  MarketIntelligenceFindingSummary,
  MarketIntelligenceHandoffSummary,
  MarketIntelligenceInsightSummary,
  MarketIntelligenceProjectSummary,
  MarketIntelligenceResearchRunSummary,
  MarketIntelligenceSourceSummary,
  MarketIntelligenceSummaryRecord
} from "@dca-os-v1/shared";
import { Modal } from "../../components/ui";
import {
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingState,
  MetricCard,
  PageHeader,
  SectionPanel,
  StatusBadge,
  StatusNotice,
  Table,
} from "../../components/ui";
import {
  MI_PROJECT_FILTER_OPTIONS,
  filterMiProjects,
  formatMiDateLabel,
  formatMiLastUpdatedLabel,
  formatMiResultFieldLabel,
  parseMiListField,
  type MiProjectFilter
} from "./aiMarketIntelligenceModel";
import "./ai-market-intelligence.css";

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

type FindingFormValues = {
  findingCategory: string;
  findingText: string;
  priority: string;
};

const FINDING_CATEGORY_OPTIONS = ["COMPETITOR", "MARKET_TREND", "OPPORTUNITY", "RISK", "AUDIENCE", "PRICING", "CONTENT_ANGLE", "OTHER"] as const;
const FINDING_PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"] as const;

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
  { id: "sources", label: "Add sources", hint: "Capture URLs, competitors, and notes." },
  { id: "run", label: "Run research", hint: "Generate bounded output from project inputs." },
  { id: "approve", label: "Approve insight", hint: "Human review before any handoff." },
  { id: "handoff", label: "Prepare handoff", hint: "Package findings for AI Delivery." },
  { id: "ready", label: "Mark READY", hint: "Attach it inside AI Delivery." }
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
        <span>{formatMiResultFieldLabel(key)}</span>
        {Array.isArray(value) ? (
          <ul className="muted-text compact-nested-list">
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

export function AiMarketIntelligencePage({ clients }: AiMarketIntelligencePageProps) {
  const [projects, setProjects] = useState<MarketIntelligenceProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<MiProjectFilter>("active");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sources, setSources] = useState<MarketIntelligenceSourceSummary[]>([]);
  const [runs, setRuns] = useState<MarketIntelligenceResearchRunSummary[]>([]);
  const [insights, setInsights] = useState<MarketIntelligenceInsightSummary[]>([]);
  const [findings, setFindings] = useState<MarketIntelligenceFindingSummary[]>([]);
  const [summaries, setSummaries] = useState<MarketIntelligenceSummaryRecord[]>([]);
  const [summaryPreview, setSummaryPreview] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<MarketIntelligenceHandoffSummary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [handoffPreparing, setHandoffPreparing] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [sourceForm, setSourceForm] = useState<SourceFormValues>({ title: "", sourceUrl: "", sourceNotes: "" });
  const [insightForm, setInsightForm] = useState<InsightFormValues>({ title: "", summary: "", status: "DRAFT" });
  const [findingForm, setFindingForm] = useState<FindingFormValues>({ findingCategory: "COMPETITOR", findingText: "", priority: "MEDIUM" });
  const [savingProject, setSavingProject] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);
  const [savingFinding, setSavingFinding] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [applySummaryId, setApplySummaryId] = useState<string | null>(null);
  const [applyTarget, setApplyTarget] = useState<"delivery" | "brief" | "seo" | "monthly_report">("delivery");
  const [applyDeliveryProjectId, setApplyDeliveryProjectId] = useState("");
  const [applyReportId, setApplyReportId] = useState("");
  const [applySaving, setApplySaving] = useState(false);
  const [deliveryProjects, setDeliveryProjects] = useState<Array<{ id: string; name: string; clientId: string }>>([]);
  const [deliveryReports, setDeliveryReports] = useState<Array<{ id: string; title: string | null; status: string }>>([]);

  const activeClients = useMemo(
    () => clients.filter((client) => !client.isArchived),
    [clients]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(
    () => filterMiProjects(projects, projectFilter),
    [projectFilter, projects]
  );

  const selectedKeywords = useMemo(
    () => parseMiListField(selectedProject?.keywords),
    [selectedProject?.keywords]
  );

  const selectedCompetitors = useMemo(
    () => parseMiListField(selectedProject?.competitors),
    [selectedProject?.competitors]
  );

  const projectLastUpdatedLabel = useMemo(() => {
    if (!selectedProject) {
      return null;
    }
    return formatMiLastUpdatedLabel([
      selectedProject,
      ...sources,
      ...runs,
      ...insights,
      ...findings,
      ...summaries,
      ...handoffs
    ]);
  }, [findings, handoffs, insights, runs, selectedProject, sources, summaries]);

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
      const [sourcesData, runsData, insightsData, findingsData, summariesData, handoffsData] = await Promise.all([
        apiData<{ sources: MarketIntelligenceSourceSummary[] }>("GET", `/market-intelligence-projects/${projectId}/sources`),
        apiData<{ researchRuns: MarketIntelligenceResearchRunSummary[] }>("GET", `/market-intelligence-projects/${projectId}/research-runs`),
        apiData<{ insights: MarketIntelligenceInsightSummary[] }>("GET", `/market-intelligence-projects/${projectId}/insights`),
        apiData<{ findings: MarketIntelligenceFindingSummary[] }>("GET", `/market-intelligence-projects/${projectId}/findings`),
        apiData<{ summaries: MarketIntelligenceSummaryRecord[] }>("GET", `/market-intelligence-projects/${projectId}/summaries`),
        apiData<{ handoffs: MarketIntelligenceHandoffSummary[] }>("GET", `/market-intelligence-projects/${projectId}/handoffs`)
      ]);

      setSources(sourcesData.sources ?? []);
      setRuns(runsData.researchRuns ?? []);
      setInsights(insightsData.insights ?? []);
      setFindings(findingsData.findings ?? []);
      setSummaries(summariesData.summaries ?? []);
      setHandoffs(handoffsData.handoffs ?? []);
      setSummaryPreview(null);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Project research data could not be loaded.");
      setSources([]);
      setRuns([]);
      setInsights([]);
      setFindings([]);
      setSummaries([]);
      setHandoffs([]);
      setSummaryPreview(null);
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

  const handleCreateFinding = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId || !findingForm.findingText.trim()) {
      setActionError("Select a project and provide finding text.");
      return;
    }

    setSavingFinding(true);
    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/findings`, {
        ...findingForm,
        projectId: selectedProjectId
      });
      setFindingForm({ findingCategory: "COMPETITOR", findingText: "", priority: "MEDIUM" });
      setShowFindingModal(false);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Finding could not be created.");
    } finally {
      setSavingFinding(false);
    }
  }, [findingForm, loadProjectData, selectedProjectId]);

  const openEditFinding = useCallback((finding: MarketIntelligenceFindingSummary) => {
    setEditingFindingId(finding.id);
    setFindingForm({
      findingCategory: finding.findingCategory,
      findingText: finding.findingText,
      priority: finding.priority ?? "MEDIUM"
    });
    setActionError(null);
  }, []);

  const handleUpdateFinding = useCallback(async () => {
    if (!selectedProjectId || !editingFindingId || !findingForm.findingText.trim()) {
      return;
    }

    setSavingFinding(true);
    setActionError(null);
    try {
      await apiData("PUT", `/market-intelligence-projects/${selectedProjectId}/findings/${editingFindingId}`, findingForm);
      setEditingFindingId(null);
      setFindingForm({ findingCategory: "COMPETITOR", findingText: "", priority: "MEDIUM" });
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Finding could not be updated.");
    } finally {
      setSavingFinding(false);
    }
  }, [editingFindingId, findingForm, loadProjectData, selectedProjectId]);

  const handleArchiveFinding = useCallback(async (findingId: string) => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/findings/${findingId}/archive`);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Finding could not be archived.");
    }
  }, [loadProjectData, selectedProjectId]);

  const loadDeliveryReports = useCallback(async (aiDeliveryProjectId: string) => {
    if (!aiDeliveryProjectId) {
      setDeliveryReports([]);
      return;
    }
    try {
      const data = await apiData<{ report: { id: string; title: string | null; status: string } | null }>(
        "GET",
        `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`
      );
      setDeliveryReports(data.report ? [data.report] : []);
    } catch {
      setDeliveryReports([]);
    }
  }, []);

  const handleGenerateSummaryPreview = useCallback(async () => {
    if (!selectedProjectId) {
      return;
    }

    setGeneratingSummary(true);
    setActionError(null);
    try {
      const data = await apiData<{ preview: { summaryText: string } }>(
        "POST",
        `/market-intelligence-projects/${selectedProjectId}/summaries/generate`,
        { persist: false }
      );
      setSummaryPreview(data.preview?.summaryText ?? null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Summary preview could not be generated.");
    } finally {
      setGeneratingSummary(false);
    }
  }, [selectedProjectId]);

  const handleSaveGeneratedSummary = useCallback(async () => {
    if (!selectedProjectId) {
      return;
    }

    setGeneratingSummary(true);
    setActionError(null);
    try {
      await apiData(
        "POST",
        `/market-intelligence-projects/${selectedProjectId}/summaries/generate`,
        { persist: true }
      );
      setSummaryPreview(null);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Summary could not be saved.");
    } finally {
      setGeneratingSummary(false);
    }
  }, [loadProjectData, selectedProjectId]);

  const handleFinalizeSummary = useCallback(async (summaryId: string) => {
    if (!selectedProjectId) {
      return;
    }

    setActionError(null);
    try {
      await apiData("POST", `/market-intelligence-projects/${selectedProjectId}/summaries/${summaryId}/finalize`);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Summary could not be finalized.");
    }
  }, [loadProjectData, selectedProjectId]);

  const openSummaryApply = useCallback(async (summaryId: string) => {
    setApplySummaryId(summaryId);
    setApplyTarget("delivery");
    setApplyDeliveryProjectId("");
    setApplyReportId("");
    setDeliveryReports([]);
    setActionError(null);
    try {
      const data = await apiData<{ aiDeliveryProjects: Array<{ id: string; name: string; clientId: string }> }>(
        "GET",
        "/ai-delivery-projects"
      );
      const clientId = selectedProject?.clientId ?? null;
      const filtered = (data.aiDeliveryProjects ?? []).filter((project) => !clientId || project.clientId === clientId);
      setDeliveryProjects(filtered);
    } catch {
      setDeliveryProjects([]);
    }
  }, [selectedProject?.clientId]);

  const handleApplySummaryTarget = useCallback(async () => {
    if (!selectedProjectId || !applySummaryId || !applyDeliveryProjectId.trim()) {
      return;
    }

    setApplySaving(true);
    setActionError(null);
    try {
      await apiData(
        "POST",
        `/market-intelligence-projects/${selectedProjectId}/summaries/${applySummaryId}/apply`,
        {
          target: applyTarget,
          aiDeliveryProjectId: applyDeliveryProjectId.trim(),
          reportId: applyTarget === "monthly_report" ? applyReportId.trim() || null : null
        }
      );
      setApplySummaryId(null);
      await loadProjectData(selectedProjectId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Summary could not be applied.");
    } finally {
      setApplySaving(false);
    }
  }, [applyDeliveryProjectId, applyReportId, applySummaryId, applyTarget, loadProjectData, selectedProjectId]);

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
    <section className="view-section mi-page" aria-labelledby="market-intelligence-title">
      <PageHeader
        actions={
          <button className="primary-action" onClick={() => setShowProjectModal(true)} type="button">
            New project
          </button>
        }
        description="Admin-only research. Sources are manually recorded and reviewed; no live crawling. Approved insights can become READY handoffs into AI Delivery."
        eyebrow="Research"
        title="Market Intelligence"
        titleId="market-intelligence-title"
      />

      {actionError ? <StatusNotice tone="error" message={actionError} /> : null}

      <div className="mi-split-layout">
        <aside className="entity-card mi-queue-sidebar">
          <div className="entity-card-header">
            <div>
              <p className="eyebrow">Projects</p>
              <h2>Research queue</h2>
            </div>
          </div>

          <FilterBar
            ariaLabel="Project filter"
            onChange={(value) => setProjectFilter(value as MiProjectFilter)}
            options={MI_PROJECT_FILTER_OPTIONS}
            value={projectFilter}
          />

          {filteredProjects.length === 0 ? (
            <EmptyState
              message="Create a project to start the workflow."
              title="No projects in this filter"
              variant="inline"
            />
          ) : (
            <div className="dense-list">
              {filteredProjects.map((project) => (
                <article
                  className={`entity-card dense-record${selectedProjectId === project.id ? " portal-record-selected" : ""}`}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProjectId(project.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status={project.isArchived ? "ARCHIVED" : project.status} />
                      </div>
                      <h3>{project.title}</h3>
                      <div className="dense-meta">
                        <span>{formatMiDateLabel(project.updatedAt || project.createdAt)}</span>
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

        <div className="mi-detail-stack">
          {!selectedProject ? (
            <EmptyState
              message="Choose a project from the left queue."
              title="No project selected"
              variant="inline"
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
                    {projectLastUpdatedLabel ? (
                      <span className="mi-last-updated muted-text">Last updated: {projectLastUpdatedLabel}</span>
                    ) : null}
                  </div>
                }
                title={selectedProject.title}
              />

              <div className="summary-grid metric-grid operator-summary-metrics mi-summary-metrics">
                <MetricCard accent="cyan" helper="Curated references" label="Sources" value={sources.filter((s) => !s.isArchived).length} />
                <MetricCard accent="warning" helper="Admin notes" label="Findings" value={findings.filter((f) => !f.isArchived).length} />
                <MetricCard accent="violet" helper="Bounded runs" label="Runs" value={runs.filter((r) => r.status === "EXECUTED").length} />
                <MetricCard accent="purple" helper="Approved handoff" label="Insights" value={approvedInsights.length} />
                <MetricCard accent="cyan" helper="Draft or final" label="Summaries" value={summaries.filter((s) => !s.isArchived).length} />
                <MetricCard accent="success" helper="READY or APPLIED" label="Handoffs" value={readyHandoffs.length} />
              </div>

              <SectionPanel
                description="Complete each step in order. Only approved insights can become handoffs for AI Delivery."
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
                          <StatusBadge
                            displayLabel={done ? "Done" : "Pending"}
                            status={done ? "done" : "pending"}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </SectionPanel>

              <SectionPanel
                description="Topics and search phrases recorded on this project. Manual input only — no live keyword API."
                title="Keyword and topic research"
                tone="compact"
              >
                {selectedKeywords.length === 0 ? (
                  <EmptyState
                    message="Add keywords when creating or editing the project."
                    title="No keywords recorded"
                    variant="inline"
                  />
                ) : (
                  <div className="mi-chip-row" aria-label="Project keywords">
                    {selectedKeywords.map((keyword) => (
                      <span className="mi-chip" key={keyword}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="Competitor names recorded on this project. Tracking is operator-curated — no live crawl."
                title="Competitor tracking"
                tone="compact"
              >
                {selectedCompetitors.length === 0 ? (
                  <EmptyState
                    message="Add competitors when creating or editing the project."
                    title="No competitors recorded"
                    variant="inline"
                  />
                ) : (
                  <div className="mi-chip-row" aria-label="Project competitors">
                    {selectedCompetitors.map((competitor) => (
                      <span className="mi-chip" key={competitor}>
                        {competitor}
                      </span>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => setShowSourceModal(true)} type="button">
                    New source
                  </button>
                }
                description="Manually recorded URLs, competitor pages, and notes. Approve each source before it informs insights or handoffs."
                title="Research sources"
                tone="compact"
              >
                {sources.length === 0 ? (
                  <EmptyState message="Add at least one source before running research." title="No sources yet" variant="inline" />
                ) : (
                  <div className="mi-table-wrap table-wrap table-scroll">
                    <Table
                      aria-label="Market intelligence sources"
                      headers={[
                        { label: "Status" },
                        { label: "Title" },
                        { label: "URL" },
                        { label: "Updated" }
                      ]}
                      rows={sources.map((source) => ({
                        key: source.id,
                        cells: [
                          <StatusBadge key={`${source.id}-status`} status={source.isArchived ? "ARCHIVED" : "ACTIVE"} />,
                          <span key={`${source.id}-title`}>
                            {source.title}
                            {source.sourceNotes ? (
                              <span className="muted-text"> — {source.sourceNotes}</span>
                            ) : null}
                          </span>,
                          source.sourceUrl ? (
                            <a href={source.sourceUrl} key={`${source.id}-url`} rel="noopener noreferrer" target="_blank">
                              {source.sourceUrl}
                            </a>
                          ) : (
                            <span className="muted-text" key={`${source.id}-url`}>
                              —
                            </span>
                          ),
                          <span key={`${source.id}-updated`}>{formatMiDateLabel(source.updatedAt || source.createdAt)}</span>
                        ]
                      }))}
                    />
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => setShowFindingModal(true)} type="button">
                    New finding
                  </button>
                }
                description="Admin-written findings from curated sources only."
                title="Research findings"
                tone="compact"
              >
                {findings.length === 0 ? (
                  <EmptyState message="Add findings after recording sources." title="No findings yet" variant="inline" />
                ) : (
                  <div className="mi-table-wrap table-wrap table-scroll">
                    <Table
                      aria-label="Market intelligence findings"
                      headers={[
                        { label: "Category" },
                        { label: "Priority" },
                        { label: "Finding" },
                        { label: "Updated" },
                        { label: "Actions" }
                      ]}
                      rows={findings.map((finding) => ({
                        key: finding.id,
                        cells: [
                          <StatusBadge key={`${finding.id}-cat`} status={finding.findingCategory} />,
                          finding.priority ? (
                            <StatusBadge key={`${finding.id}-pri`} status={finding.priority} />
                          ) : (
                            <span className="muted-text" key={`${finding.id}-pri`}>
                              —
                            </span>
                          ),
                          <span key={`${finding.id}-text`}>{finding.findingText}</span>,
                          <span key={`${finding.id}-updated`}>{formatMiDateLabel(finding.updatedAt || finding.createdAt)}</span>,
                          <div className="dense-actions" key={`${finding.id}-actions`}>
                            <button className="ghost-action" onClick={() => openEditFinding(finding)} type="button">
                              Edit
                            </button>
                            <button className="ghost-action" onClick={() => void handleArchiveFinding(finding.id)} type="button">
                              Archive
                            </button>
                          </div>
                        ]
                      }))}
                    />
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <button className="secondary-action" disabled={!selectedProjectId} onClick={() => void handleCreateRun()} type="button">
                    Run
                  </button>
                }
                description="Deterministic execution only; no live crawling in MVP."
                title="Research runs"
                tone="compact"
              >
                {runs.length === 0 ? (
                  <EmptyState message="Create a run to generate structured insight output." title="No runs yet" variant="inline" />
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
                              <span>{formatMiDateLabel(run.executedAt ?? run.updatedAt ?? run.createdAt)}</span>
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
                  <EmptyState message="Execute a research run or add an insight manually." title="No insights yet" variant="inline" />
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
                action={
                  <div className="dense-actions">
                    <button className="secondary-action" disabled={!selectedProjectId || generatingSummary} onClick={() => void handleGenerateSummaryPreview()} type="button">
                      {generatingSummary ? "Generating…" : "Preview summary"}
                    </button>
                    <button className="primary-action" disabled={!selectedProjectId || generatingSummary} onClick={() => void handleSaveGeneratedSummary()} type="button">
                      Save summary
                    </button>
                  </div>
                }
                description="Deterministic admin draft from sources and findings. Labeled internal until Block 2 integration. No live AI provider."
                title="MI summary"
                tone="compact"
              >
                {summaryPreview ? (
                  <pre className="dense-row-note">{summaryPreview}</pre>
                ) : null}
                {summaries.length === 0 ? (
                  <EmptyState message="Generate and save a summary from current sources and findings." title="No summaries yet" variant="inline" />
                ) : (
                  <div className="dense-list">
                    {summaries.map((summary) => (
                      <article className="entity-card dense-record" key={summary.id}>
                        <div className="dense-record-main">
                          <div className="dense-title">
                            <div className="dense-kicker">
                              <StatusBadge status={summary.status} />
                            </div>
                            <h3>{summary.title}</h3>
                            {summary.sourceNotes ? <div className="dense-meta"><span>{summary.sourceNotes}</span></div> : null}
                          </div>
                          <details className="row-action-menu">
                            <summary>Summary text</summary>
                            <pre className="dense-row-note">{summary.summaryText}</pre>
                          </details>
                          {summary.integrationContext?.version === "MI_SUMMARY_V1" ? (
                            <div className="dense-row-note muted-text">MI_SUMMARY_V1</div>
                          ) : null}
                          {summary.linkage?.aiDeliveryProjectName || summary.linkage?.aiDeliveryProjectId ? (
                            <div className="dense-row-note muted-text">
                              Linked delivery: {summary.linkage.aiDeliveryProjectName ?? summary.linkage.aiDeliveryProjectId}
                            </div>
                          ) : null}
                          {summary.linkage?.monthlyReportId ? (
                            <div className="dense-row-note muted-text">
                              Linked report: {summary.linkage.monthlyReportTitle ?? summary.linkage.monthlyReportId}
                            </div>
                          ) : null}
                          {summary.appliedAt || summary.linkage?.appliedAt ? (
                            <div className="dense-row-note muted-text">
                              Applied: {formatMiDateLabel(summary.appliedAt ?? summary.linkage?.appliedAt ?? null)}
                            </div>
                          ) : null}
                          <div className="dense-actions">
                            {summary.status !== "FINALIZED" ? (
                              <button className="primary-action" onClick={() => void handleFinalizeSummary(summary.id)} type="button">
                                Finalize
                              </button>
                            ) : (
                              <button className="ghost-action" onClick={() => void openSummaryApply(summary.id)} type="button">
                                Apply to delivery
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel
                description="Admin-only bridge to AI Delivery and monthly reports. Only admin-reviewed summaries become handoffs. Set READY, then attach from the AI Delivery project screen. Raw source archives are not client-visible."
                title="Internal handoffs"
                tone="compact"
              >
                {approvedInsights.length > 0 ? (
                  <div className="dense-list mi-handoff-list-spaced">
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
                  <EmptyState message="Approve an insight above before preparing a handoff." title="No approved insights" variant="inline" />
                )}

                {handoffs.length === 0 ? (
                  <EmptyState message="Prepared handoffs appear here with DRAFT → READY → APPLIED lifecycle." title="No handoffs yet" variant="inline" />
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
                                <ul className="muted-text compact-nested-list">
                                  {handoff.audienceSignals.map((signal, index) => (
                                    <li key={`${handoff.id}-audience-${index}`}>{signal}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.opportunities?.length ? (
                              <div className="dense-field">
                                <span>Opportunities</span>
                                <ul className="muted-text compact-nested-list">
                                  {handoff.opportunities.map((entry, index) => (
                                    <li key={`${handoff.id}-opportunity-${index}`}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.risks?.length ? (
                              <div className="dense-field">
                                <span>Risks</span>
                                <ul className="muted-text compact-nested-list">
                                  {handoff.risks.map((entry, index) => (
                                    <li key={`${handoff.id}-risk-${index}`}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {handoff.recommendedActions?.length ? (
                              <div className="dense-field">
                                <span>Recommended actions</span>
                                <ul className="muted-text compact-nested-list">
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
        <Modal isOpen onClose={() => setShowProjectModal(false)} title="Create research project">
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
        <Modal isOpen onClose={() => setShowSourceModal(false)} title="Add research source">
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
                {savingSource ? "Saving…" : "New source"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showInsightModal ? (
        <Modal isOpen onClose={() => setShowInsightModal(false)} title="Add market insight">
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

      {showFindingModal ? (
        <Modal isOpen onClose={() => setShowFindingModal(false)} title="Add research finding">
          <form className="entity-form" onSubmit={handleCreateFinding}>
            <div className="field-grid">
              <label>
                Category
                <select
                  onChange={(event) => setFindingForm((current) => ({ ...current, findingCategory: event.target.value }))}
                  value={findingForm.findingCategory}
                >
                  {FINDING_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  onChange={(event) => setFindingForm((current) => ({ ...current, priority: event.target.value }))}
                  value={findingForm.priority}
                >
                  {FINDING_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-span-2">
                Finding text — required
                <textarea
                  onChange={(event) => setFindingForm((current) => ({ ...current, findingText: event.target.value }))}
                  required
                  rows={4}
                  value={findingForm.findingText}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setShowFindingModal(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={savingFinding} type="submit">
                {savingFinding ? "Saving…" : "New finding"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editingFindingId ? (
        <Modal isOpen onClose={() => setEditingFindingId(null)} title="Edit research finding">
          <div className="entity-form">
            <div className="field-grid">
              <label>
                Category
                <select
                  onChange={(event) => setFindingForm((current) => ({ ...current, findingCategory: event.target.value }))}
                  value={findingForm.findingCategory}
                >
                  {FINDING_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  onChange={(event) => setFindingForm((current) => ({ ...current, priority: event.target.value }))}
                  value={findingForm.priority}
                >
                  {FINDING_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-span-2">
                Finding text
                <textarea
                  onChange={(event) => setFindingForm((current) => ({ ...current, findingText: event.target.value }))}
                  required
                  rows={4}
                  value={findingForm.findingText}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setEditingFindingId(null)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={savingFinding} onClick={() => void handleUpdateFinding()} type="button">
                {savingFinding ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {applySummaryId ? (
        <Modal isOpen onClose={() => setApplySummaryId(null)} title="Apply finalized MI summary">
          <div className="entity-form">
            <label>
              Target
              <select onChange={(event) => setApplyTarget(event.target.value as typeof applyTarget)} value={applyTarget}>
                <option value="delivery">AI Delivery context</option>
                <option value="brief">AI Delivery brief notes</option>
                <option value="seo">SEO / content plan notes</option>
                <option value="monthly_report">Monthly report recommendations</option>
              </select>
            </label>
            <label>
              AI Delivery project
              <select
                onChange={(event) => {
                  const nextProjectId = event.target.value;
                  setApplyDeliveryProjectId(nextProjectId);
                  setApplyReportId("");
                  void loadDeliveryReports(nextProjectId);
                }}
                value={applyDeliveryProjectId}
              >
                <option value="">Select project</option>
                {deliveryProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            {applyTarget === "monthly_report" ? (
              <>
                <label>
                  Monthly report
                  <select onChange={(event) => setApplyReportId(event.target.value)} value={applyReportId}>
                    <option value="">Select report</option>
                    {deliveryReports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.title ?? report.id} ({report.status})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Or report ID (fallback)
                  <input onChange={(event) => setApplyReportId(event.target.value)} type="text" value={applyReportId} />
                </label>
              </>
            ) : null}
            <div className="modal-footer">
              <button className="secondary-action" onClick={() => setApplySummaryId(null)} type="button">
                Cancel
              </button>
              <button
                className="primary-action"
                disabled={applySaving || !applyDeliveryProjectId.trim() || (applyTarget === "monthly_report" && !applyReportId.trim())}
                onClick={() => void handleApplySummaryTarget()}
                type="button"
              >
                {applySaving ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
