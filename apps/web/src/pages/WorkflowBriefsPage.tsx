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
    planJson: unknown;
  }>;
  aiBriefRuns?: Array<{
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
  }>;
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
      setDetailLoading(false);
      return;
    }
    setDetail(response.data);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    void loadBriefs();
  }, [loadBriefs]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  async function handleRunAi() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<{ brief: WorkflowBriefDetail }>(`/${selectedId}/run-ai`, {
      method: "POST"
    });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    await loadDetail(selectedId);
    await loadBriefs();
    setActionLoading(false);
  }

  async function handleSubmit() {
    if (!selectedId) return;
    setActionLoading(true);
    setError(null);
    const response = await workflowBriefsApiRequest<WorkflowBriefDetail>(`/${selectedId}/submit`, {
      method: "POST"
    });
    if (!response.ok) {
      setError(response.error.message);
      setActionLoading(false);
      return;
    }
    await loadDetail(selectedId);
    await loadBriefs();
    setActionLoading(false);
  }

  const latestMi = detail?.miReports?.[0];
  const latestSeo = detail?.seoReports?.[0];
  const latestPlan = detail?.productionPlans?.[0];
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
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestPlan.status} />
                    </div>
                    <h4 style={{ margin: "0 0 0.5rem" }}>{latestPlan.title}</h4>
                    <p>{latestPlan.body ?? "No plan body yet."}</p>
                  </>
                ) : (
                  <p className="muted-text">No production plan yet. Admin can create one via API.</p>
                )}
              </SectionPanel>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
