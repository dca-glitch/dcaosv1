import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Button, PageHeader, SectionPanel, StatusBadge } from "../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type WorkflowBriefSummary = {
  id: string;
  clientId: string;
  title: string;
  status: string;
  goal: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string } | null;
};

type WorkflowBriefDetail = WorkflowBriefSummary & {
  businessContext: string | null;
  targetAudience: string | null;
  offerContext: string | null;
  locationContext: string | null;
  notes: string | null;
  miReports?: Array<{
    id: string;
    status: string;
    summaryText: string | null;
    reportJson: unknown;
  }>;
  seoReports?: Array<{
    id: string;
    status: string;
    summaryText: string | null;
    reportJson: unknown;
  }>;
  productionPlans?: Array<{
    id: string;
    title: string;
    body: string | null;
    status: string;
    planJson?: unknown;
    clientVisibleSnapshotJson?: unknown;
    sentToClientAt?: string | null;
    approvedByClientAt?: string | null;
    aiDeliveryProjectId?: string | null;
    updatedAt?: string;
  }>;
  sourceProjects?: Array<{
    id: string;
    name: string;
    targetMonth: string;
    isArchived: boolean;
  }>;
  aiBriefRuns?: Array<{
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
  }>;
};

type ContentProductionSeedStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: string } | null;
  hasProductionPlan: boolean;
  productionPlanId: string | null;
  productionPlanStatus: string | null;
  isSeeded: boolean;
  contentPlanId: string | null;
  itemCount: number;
  seededAt: string | null;
  canSeed: boolean;
  blockReason: string | null;
  contentPlan: {
    id: string;
    status: string;
    itemCount: number;
    items: Array<{
      id: string;
      title: string;
      targetKeyword: string | null;
      contentType: string;
      sortOrder: number;
    }>;
  } | null;
};

async function workflowBriefsApiRequest<T>(path: string, options?: { method?: string; body?: unknown }): Promise<ApiResponse<T>> {
  const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(`${API_BASE_URL}/workflow-briefs${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  return (await response.json()) as ApiResponse<T>;
}

function BriefField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div>{value?.trim() ? value : "—"}</div>
    </div>
  );
}

type ReportListSection = {
  label: string;
  items: string[];
};

function readReportStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function buildMiReportSections(reportJson: unknown): ReportListSection[] {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return [];
  }
  const record = reportJson as Record<string, unknown>;
  return [
    { label: "Audience insights", items: readReportStringList(record.audienceInsights) },
    { label: "Competitor insights", items: readReportStringList(record.competitorInsights) },
    { label: "Market signals", items: readReportStringList(record.marketSignals) },
    { label: "Opportunities", items: readReportStringList(record.opportunities) },
    { label: "Risks", items: readReportStringList(record.risks) },
    { label: "Recommended actions", items: readReportStringList(record.recommendedActions) }
  ].filter((section) => section.items.length > 0);
}

function buildSeoReportSections(reportJson: unknown): ReportListSection[] {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return [];
  }
  const record = reportJson as Record<string, unknown>;
  return [
    { label: "Keyword clusters", items: readReportStringList(record.keywordClusters) },
    { label: "Topic ideas", items: readReportStringList(record.topicIdeas) },
    { label: "Content angles", items: readReportStringList(record.contentAngles) },
    { label: "Internal link ideas", items: readReportStringList(record.internalLinkIdeas) },
    { label: "SEO notes", items: readReportStringList(record.seoNotes) }
  ].filter((section) => section.items.length > 0);
}

function ReportSectionList({ sections }: { sections: ReportListSection[] }) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
      {sections.map((section) => (
        <div key={section.label}>
          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
            {section.label}
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {section.items.map((item) => (
              <li key={`${section.label}-${item}`} style={{ marginBottom: "0.25rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatRunTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function WorkflowBriefsPage({ canManageAi = false }: { canManageAi?: boolean }) {
  const [briefs, setBriefs] = useState<WorkflowBriefSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkflowBriefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planEditTitle, setPlanEditTitle] = useState("");
  const [planEditBody, setPlanEditBody] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showPlanEdit, setShowPlanEdit] = useState(false);
  const [seedStatus, setSeedStatus] = useState<ContentProductionSeedStatus | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  const loadBriefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<WorkflowBriefSummary[]>("/");
    if (!response.ok) {
      setError(response.error.message);
      setBriefs([]);
      setLoading(false);
      return;
    }
    setBriefs(response.data);
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (briefId: string) => {
    setDetailLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<WorkflowBriefDetail>(`/${briefId}`);
    if (!response.ok) {
      setError(response.error.message);
      setDetail(null);
      setSeedStatus(null);
      setDetailLoading(false);
      return;
    }
    setDetail(response.data);
    setDetailLoading(false);
  }, []);

  const loadSeedStatus = useCallback(async (briefId: string) => {
    setSeedLoading(true);
    const response = await workflowBriefsApiRequest<ContentProductionSeedStatus>(`/${briefId}/content-production-seed`);
    if (response.ok) {
      setSeedStatus(response.data);
    } else {
      setSeedStatus(null);
    }
    setSeedLoading(false);
  }, []);

  useEffect(() => {
    void loadBriefs();
  }, [loadBriefs]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
      if (canManageAi) {
        void loadSeedStatus(selectedId);
      } else {
        setSeedStatus(null);
      }
    } else {
      setDetail(null);
      setSeedStatus(null);
    }
  }, [selectedId, loadDetail, loadSeedStatus, canManageAi]);

  useEffect(() => {
    const plan = detail?.productionPlans?.[0];
    if (plan) {
      setPlanEditTitle(plan.title);
      setPlanEditBody(plan.body ?? "");
    } else {
      setPlanEditTitle("");
      setPlanEditBody("");
    }
    setShowPlanEdit(false);
    setRejectComment("");
  }, [detail?.id, detail?.productionPlans?.[0]?.id, detail?.productionPlans?.[0]?.updatedAt]);

  async function runAction(path: string, options?: { method?: string; body?: unknown }) {
    if (!selectedId) return false;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<unknown>(`/${selectedId}${path}`, options);
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return false;
    }
    await loadDetail(selectedId);
    await loadBriefs();
    setActionLoading(false);
    return true;
  }

  async function handleRunAi() {
    await runAction("/run-ai", { method: "POST" });
  }

  async function handleSubmit() {
    await runAction("/submit", { method: "POST" });
  }

  async function handleGeneratePlan() {
    await runAction("/production-plan/generate", { method: "POST" });
  }

  async function handleSendPlan() {
    await runAction("/production-plan/send", { method: "POST" });
  }

  async function handleSavePlanEdit() {
    if (!selectedId || !planEditTitle.trim()) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<unknown>(`/${selectedId}/production-plan`, {
      method: "PUT",
      body: { title: planEditTitle.trim(), body: planEditBody.trim() || null }
    });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    setShowPlanEdit(false);
    await loadDetail(selectedId);
    setActionLoading(false);
  }

  async function handleApprovePlan() {
    await runAction("/production-plan/approve", { method: "POST" });
  }

  async function handleRejectPlan() {
    await runAction("/production-plan/reject", {
      method: "POST",
      body: { comment: rejectComment.trim() || null }
    });
  }

  async function handleCreateProject() {
    const ok = await runAction("/create-project", { method: "POST" });
    if (ok && selectedId) {
      await loadSeedStatus(selectedId);
    }
  }

  async function handleSeedContentProduction() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{
      seeded: boolean;
      itemsCreated: number;
      contentPlan: ContentProductionSeedStatus["contentPlan"];
    }>(`/${selectedId}/seed-content-production`, { method: "POST" });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    await loadDetail(selectedId);
    await loadSeedStatus(selectedId);
    setActionLoading(false);
  }

  function openAiDeliveryModule() {
    window.history.replaceState(null, "", "/#/ai-delivery");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  const latestMi = detail?.miReports?.[0];
  const latestSeo = detail?.seoReports?.[0];
  const latestPlan = detail?.productionPlans?.[0];
  const linkedProject = detail?.sourceProjects?.[0];
  const latestRun = detail?.aiBriefRuns?.[0];
  const miSections = latestMi ? buildMiReportSections(latestMi.reportJson) : [];
  const seoSections = latestSeo ? buildSeoReportSections(latestSeo.reportJson) : [];
  const miOpportunities = miSections.find((section) => section.label === "Opportunities")?.items ?? [];
  const miRisks = miSections.find((section) => section.label === "Risks")?.items ?? [];
  const seoKeywords = seoSections.find((section) => section.label === "Keyword clusters")?.items ?? [];
  const seoTopics = seoSections.find((section) => section.label === "Topic ideas")?.items ?? [];
  const canRunAi =
    canManageAi &&
    detail &&
    ["SUBMITTED", "IN_REVIEW", "READY_FOR_AI", "AI_RESULTS_READY"].includes(detail.status);
  const hasReports = Boolean(latestMi && latestSeo);
  const canGeneratePlan = canManageAi && hasReports && detail?.status === "AI_RESULTS_READY";
  const canEditPlan =
    canManageAi && latestPlan && ["DRAFT", "CHANGES_REQUESTED"].includes(latestPlan.status);
  const canSendPlan =
    canManageAi && latestPlan && ["DRAFT", "CHANGES_REQUESTED"].includes(latestPlan.status);
  const canClientReviewPlan = latestPlan?.status === "SENT_TO_CLIENT";
  const canCreateProject = canManageAi && detail && ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"].includes(detail.status);
  const planSnapshot =
    latestPlan?.clientVisibleSnapshotJson && typeof latestPlan.clientVisibleSnapshotJson === "object"
      ? (latestPlan.clientVisibleSnapshotJson as Record<string, unknown>)
      : null;
  const planPriorityTopics = readReportStringList(planSnapshot?.priorityTopics);
  const planClusters = Array.isArray(planSnapshot?.suggestedContentClusters)
    ? (planSnapshot.suggestedContentClusters as Array<{ name?: string; topics?: unknown }>)
    : [];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="AI Delivery"
        title="Workflow Briefs"
        description="Brief-centered workflow foundation: brief input, AI reports, and production plan."
      />

      {error ? <ErrorState title="Workflow brief error" message={error} /> : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) minmax(0, 2fr)", gap: "1rem" }}>
        <SectionPanel title="Briefs">
          {loading ? (
            <LoadingState label="Loading briefs…" />
          ) : briefs.length === 0 ? (
            <EmptyState title="No workflow briefs" message="Create a brief via API or seed data to get started." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {briefs.map((brief) => (
                <li key={brief.id} style={{ marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    className={selectedId === brief.id ? "btn btn-primary" : "btn btn-secondary"}
                    style={{ width: "100%", textAlign: "left" }}
                    onClick={() => setSelectedId(brief.id)}
                  >
                    <div style={{ fontWeight: 600 }}>{brief.title}</div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
                      <StatusBadge status={brief.status} />
                      {brief.client?.name ? (
                        <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                          {brief.client.name}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>

        <div className="page-stack">
          {!selectedId ? (
            <SectionPanel title="Brief detail">
              <EmptyState title="Select a brief" message="Choose a brief from the list to view details and AI outputs." />
            </SectionPanel>
          ) : detailLoading ? (
            <LoadingState label="Loading brief detail…" />
          ) : detail ? (
            <>
              <SectionPanel
                title={detail.title}
                action={
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {detail.status === "DRAFT" ? (
                      <Button variant="secondary" disabled={actionLoading} onClick={() => void handleSubmit()}>
                        Submit
                      </Button>
                    ) : null}
                    {canRunAi ? (
                      <Button variant="primary" disabled={actionLoading} onClick={() => void handleRunAi()}>
                        Run AI
                      </Button>
                    ) : null}
                  </div>
                }
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <StatusBadge status={detail.status} />
                </div>
                <BriefField label="Goal" value={detail.goal} />
                <BriefField label="Business context" value={detail.businessContext} />
                <BriefField label="Target audience" value={detail.targetAudience} />
                <BriefField label="Offer context" value={detail.offerContext} />
                <BriefField label="Location context" value={detail.locationContext} />
                <BriefField label="Notes" value={detail.notes} />
              </SectionPanel>

              <SectionPanel title="AI Run Status">
                {latestRun ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
                      <StatusBadge status={latestRun.status} />
                      {latestRun.errorMessage ? (
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {latestRun.errorMessage}
                        </span>
                      ) : null}
                    </div>
                    <BriefField label="Started" value={formatRunTimestamp(latestRun.startedAt)} />
                    <BriefField label="Completed" value={formatRunTimestamp(latestRun.completedAt)} />
                  </>
                ) : (
                  <p className="muted-text">No AI runs yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              {(miOpportunities.length > 0 || miRisks.length > 0 || seoKeywords.length > 0 || seoTopics.length > 0) ? (
                <SectionPanel title="Key Highlights">
                  {miOpportunities.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Top opportunities
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {miOpportunities.slice(0, 3).map((item) => (
                          <li key={`opp-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {miRisks.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Key risks
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {miRisks.slice(0, 3).map((item) => (
                          <li key={`risk-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {seoKeywords.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Keyword clusters
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {seoKeywords.slice(0, 5).map((item) => (
                          <li key={`kw-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {seoTopics.length > 0 ? (
                    <div>
                      <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                        Topic ideas
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {seoTopics.slice(0, 4).map((item) => (
                          <li key={`topic-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </SectionPanel>
              ) : null}

              <SectionPanel title="MI Report">
                {latestMi ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestMi.status} />
                    </div>
                    <p style={{ marginTop: 0 }}>{latestMi.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={miSections} />
                  </>
                ) : (
                  <p className="muted-text">No MI report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel title="SEO Report">
                {latestSeo ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestSeo.status} />
                    </div>
                    <p style={{ marginTop: 0 }}>{latestSeo.summaryText ?? "No summary available."}</p>
                    <ReportSectionList sections={seoSections} />
                  </>
                ) : (
                  <p className="muted-text">No SEO report yet. Run AI from an eligible brief status.</p>
                )}
              </SectionPanel>

              <SectionPanel title="Production Plan">
                {latestPlan ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                      <StatusBadge status={latestPlan.status} />
                      {latestPlan.sentToClientAt ? (
                        <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                          Sent {formatRunTimestamp(latestPlan.sentToClientAt)}
                        </span>
                      ) : null}
                      {latestPlan.approvedByClientAt ? (
                        <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                          Approved {formatRunTimestamp(latestPlan.approvedByClientAt)}
                        </span>
                      ) : null}
                    </div>

                    {canManageAi ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {canGeneratePlan ? (
                          <Button variant="secondary" disabled={actionLoading} onClick={() => void handleGeneratePlan()}>
                            {latestPlan ? "Refresh plan" : "Generate plan"}
                          </Button>
                        ) : null}
                        {canEditPlan ? (
                          <Button variant="secondary" disabled={actionLoading} onClick={() => setShowPlanEdit((value) => !value)}>
                            {showPlanEdit ? "Cancel edit" : "Edit plan"}
                          </Button>
                        ) : null}
                        {canSendPlan ? (
                          <Button variant="primary" disabled={actionLoading} onClick={() => void handleSendPlan()}>
                            Send to client
                          </Button>
                        ) : null}
                      </div>
                    ) : null}

                    {showPlanEdit && canEditPlan ? (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label className="muted-text" style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>
                          Title
                        </label>
                        <input
                          className="form-input"
                          value={planEditTitle}
                          onChange={(event) => setPlanEditTitle(event.target.value)}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <label className="muted-text" style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>
                          Body
                        </label>
                        <textarea
                          className="form-input"
                          value={planEditBody}
                          onChange={(event) => setPlanEditBody(event.target.value)}
                          rows={8}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleSavePlanEdit()}>
                          Save plan
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ margin: "0 0 0.5rem" }}>{latestPlan.title}</h4>
                        <p style={{ whiteSpace: "pre-wrap" }}>{latestPlan.body ?? "No plan body yet."}</p>
                      </>
                    )}

                    {planPriorityTopics.length > 0 ? (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                          Priority topics
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                          {planPriorityTopics.slice(0, 6).map((item) => (
                            <li key={`plan-topic-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {planClusters.length > 0 ? (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                          Content clusters
                        </div>
                        {planClusters.slice(0, 3).map((cluster) => (
                          <div key={cluster.name ?? "cluster"} style={{ marginBottom: "0.5rem" }}>
                            <div style={{ fontWeight: 600 }}>{cluster.name ?? "Cluster"}</div>
                            <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem" }}>
                              {readReportStringList(cluster.topics)
                                .slice(0, 4)
                                .map((topic) => (
                                  <li key={`${cluster.name}-${topic}`}>{topic}</li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {canClientReviewPlan ? (
                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle, #333)" }}>
                        <div className="muted-text" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                          Review this production plan
                        </div>
                        <textarea
                          className="form-input"
                          value={rejectComment}
                          onChange={(event) => setRejectComment(event.target.value)}
                          placeholder="Optional comment if requesting changes"
                          rows={2}
                          style={{ width: "100%", marginBottom: "0.5rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <Button variant="primary" disabled={actionLoading} onClick={() => void handleApprovePlan()}>
                            Approve plan
                          </Button>
                          <Button variant="secondary" disabled={actionLoading} onClick={() => void handleRejectPlan()}>
                            Request changes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="muted-text">No production plan yet.</p>
                    {canGeneratePlan ? (
                      <Button variant="primary" disabled={actionLoading} onClick={() => void handleGeneratePlan()} style={{ marginTop: "0.5rem" }}>
                        Generate plan
                      </Button>
                    ) : (
                      <p className="muted-text" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        Run AI first to generate MI and SEO reports, then generate a production plan.
                      </p>
                    )}
                  </>
                )}
              </SectionPanel>

              {canManageAi ? (
                <SectionPanel title="Content Production">
                  {linkedProject || seedStatus?.project ? (
                    <>
                      <BriefField
                        label="Linked project"
                        value={linkedProject?.name ?? seedStatus?.project?.name ?? null}
                      />
                      <BriefField
                        label="Target month"
                        value={
                          linkedProject?.targetMonth?.slice(0, 7) ??
                          seedStatus?.project?.targetMonth?.slice(0, 7) ??
                          null
                        }
                      />
                    </>
                  ) : (
                    <>
                      <p className="muted-text">No linked AI Delivery project yet.</p>
                      {canCreateProject ? (
                        <Button variant="secondary" disabled={actionLoading} onClick={() => void handleCreateProject()} style={{ marginTop: "0.5rem" }}>
                          Create / link project
                        </Button>
                      ) : null}
                    </>
                  )}

                  {seedLoading ? <LoadingState label="Loading seed status…" /> : null}

                  {!seedLoading && seedStatus ? (
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <StatusBadge status={seedStatus.isSeeded ? "APPROVED" : "DRAFT"} />
                        <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                          {seedStatus.isSeeded
                            ? `Seeded (${seedStatus.itemCount} items)`
                            : seedStatus.canSeed
                              ? "Ready to seed"
                              : "Not seeded"}
                        </span>
                      </div>

                      {seedStatus.seededAt ? (
                        <BriefField label="Seeded at" value={formatRunTimestamp(seedStatus.seededAt)} />
                      ) : null}

                      {seedStatus.blockReason && !seedStatus.isSeeded ? (
                        <p className="muted-text" style={{ fontSize: "0.85rem" }}>{seedStatus.blockReason}</p>
                      ) : null}

                      {seedStatus.canSeed ? (
                        <Button variant="primary" disabled={actionLoading} onClick={() => void handleSeedContentProduction()} style={{ marginTop: "0.5rem" }}>
                          Seed content production
                        </Button>
                      ) : null}

                      {seedStatus.contentPlan && seedStatus.contentPlan.items.length > 0 ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div className="muted-text" style={{ fontSize: "0.8rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Seeded content plan items
                          </div>
                          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                            {seedStatus.contentPlan.items.slice(0, 8).map((item) => (
                              <li key={item.id} style={{ marginBottom: "0.35rem" }}>
                                <span style={{ fontWeight: 600 }}>{item.title}</span>
                                {item.targetKeyword ? (
                                  <span className="muted-text" style={{ fontSize: "0.8rem" }}>
                                    {" "}
                                    — {item.targetKeyword}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                          {linkedProject || seedStatus.project ? (
                            <Button variant="secondary" disabled={actionLoading} onClick={openAiDeliveryModule} style={{ marginTop: "0.5rem" }}>
                              Open AI Delivery module
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SectionPanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
