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

              <SectionPanel title="MI Report">
                {latestMi ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <StatusBadge status={latestMi.status} />
                    </div>
                    <p>{latestMi.summaryText ?? "No summary available."}</p>
                    {latestMi.reportJson ? (
                      <pre
                        style={{
                          fontSize: "0.75rem",
                          overflow: "auto",
                          maxHeight: "200px",
                          background: "rgba(0,0,0,0.2)",
                          padding: "0.75rem",
                          borderRadius: "6px"
                        }}
                      >
                        {JSON.stringify(latestMi.reportJson, null, 2)}
                      </pre>
                    ) : null}
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
                    <p>{latestSeo.summaryText ?? "No summary available."}</p>
                    {latestSeo.reportJson ? (
                      <pre
                        style={{
                          fontSize: "0.75rem",
                          overflow: "auto",
                          maxHeight: "200px",
                          background: "rgba(0,0,0,0.2)",
                          padding: "0.75rem",
                          borderRadius: "6px"
                        }}
                      >
                        {JSON.stringify(latestSeo.reportJson, null, 2)}
                      </pre>
                    ) : null}
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
