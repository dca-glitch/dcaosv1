import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, EmptyState, LoadingState, MetricCard, PageHeader, SectionPanel } from "../components/ui";
import {
  buildClientDashboardAttentionItems,
  buildClientDashboardKpis,
  formatClientBriefArticleSummary,
  formatClientBriefDate,
  selectRecentClientBriefs
} from "./client-portal/client-dashboard-model";
import {
  clientPortalApiRequest,
  getClientPortalAuthToken,
  type ApiResponse,
  type PendingApprovalsResponse
} from "./client-portal/client-portal-api";
import { toClientBriefStatusLabel } from "./client-portal/client-portal-status";
import "./client-portal/client-portal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const AMBER_TINT = "#C98A42";

type BriefStatus = "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED";

type BriefRecord = {
  id: string;
  clientId: string;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
  title: string;
  status: BriefStatus;
  createdAt: string;
};

type MyClientResponse = {
  clientId: string;
  clientName: string;
};

type ClientDashboardPageProps = {
  user: {
    email: string;
    name?: string | null;
    status: string;
  };
};

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

async function briefsApiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const token = getClientPortalAuthToken();
  const headers = new Headers({ Accept: "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection and try again."
      }
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "The server returned an unreadable response."
      }
    };
  }

  if (!isApiEnvelope<T>(payload)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENVELOPE",
        message: "The server response was not in the expected format."
      }
    };
  }

  return payload;
}

function navigateToView(path: string) {
  window.location.hash = path.startsWith("#") ? path : `#/${path.replace(/^\//, "")}`;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function ClientDashboardPage({ user }: ClientDashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const clientResponse = await clientPortalApiRequest<MyClientResponse>("/my-client");
    if (!clientResponse.ok) {
      setBriefs([]);
      setPendingApprovalCount(0);
      setClientName(null);
      setError(clientResponse.error.message);
      setLoading(false);
      return;
    }

    setClientName(clientResponse.data.clientName);

    const [briefsResponse, approvalsResponse] = await Promise.all([
      briefsApiRequest<BriefRecord[]>(
        `/briefs?clientId=${encodeURIComponent(clientResponse.data.clientId)}`
      ),
      clientPortalApiRequest<PendingApprovalsResponse>("/pending-approvals")
    ]);

    if (!briefsResponse.ok) {
      setBriefs([]);
      setError(briefsResponse.error.message);
      setLoading(false);
      return;
    }

    setBriefs(briefsResponse.data ?? []);

    if (approvalsResponse.ok) {
      setPendingApprovalCount(
        approvalsResponse.data.count ?? approvalsResponse.data.pendingApprovals?.length ?? 0
      );
    } else {
      setPendingApprovalCount(0);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const kpis = useMemo(
    () => buildClientDashboardKpis(briefs, pendingApprovalCount),
    [briefs, pendingApprovalCount]
  );

  const attentionItems = useMemo(
    () => buildClientDashboardAttentionItems(briefs, pendingApprovalCount),
    [briefs, pendingApprovalCount]
  );

  const recentBriefs = useMemo(() => selectRecentClientBriefs(briefs, 6), [briefs]);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (error) {
    return (
      <section
        className="view-section cf-page client-dashboard-page"
        aria-labelledby="client-dashboard-title"
        data-density="comfortable"
      >
        <PageHeader
          description="Your client workspace overview."
          eyebrow="Client workspace"
          title="Dashboard"
          titleId="client-dashboard-title"
        />
        <Alert message={error} title="Dashboard unavailable" variant="danger" />
        <div className="portal-action-row">
          <Button onClick={() => void loadDashboard()} variant="secondary">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="view-section cf-page client-dashboard-page"
      aria-labelledby="client-dashboard-title"
      data-density="comfortable"
    >
      <PageHeader
        description={
          clientName
            ? `Overview for ${clientName} — items awaiting your action and recent briefs.`
            : "Your client workspace overview."
        }
        eyebrow="Client workspace"
        meta={<span className="muted-text">{user.name || user.email}</span>}
        title="Dashboard"
        titleId="client-dashboard-title"
      />

      <div className="client-dashboard-kpi-row portal-metric-grid cf-metric-strip" role="group" aria-label="Workspace summary">
        <MetricCard
          accent="cyan"
          helper="Briefs in your workspace"
          label="Active briefs"
          value={String(kpis.briefCount)}
        />
        <MetricCard
          accent="warning"
          helper="Articles waiting for you"
          label="Awaiting your approval"
          value={String(kpis.awaitingApprovalCount)}
        />
        <MetricCard
          accent="violet"
          helper="Briefs needing your input"
          label="Awaiting your input"
          value={String(kpis.awaitingBriefCount)}
        />
        <MetricCard
          accent="success"
          helper="Briefs already submitted"
          label="Submitted briefs"
          value={String(kpis.submittedBriefCount)}
        />
      </div>

      <SectionPanel
        description="Items that need a decision from you."
        tint={AMBER_TINT}
        title="Required attention"
        tone="highlight"
      >
        {attentionItems.length === 0 ? (
          <p className="muted-text" style={{ color: "rgba(110, 231, 183, 0.95)", margin: 0 }}>
            You&apos;re all caught up
          </p>
        ) : (
          <div className="client-dashboard-attention-list">
            {attentionItems.map((item) => (
              <div
                className={`client-dashboard-attention-row${item.urgent ? " is-urgent" : ""}`}
                key={item.id}
              >
                <div className="client-dashboard-attention-copy">
                  <strong>{item.title}</strong>
                  <span className="muted-text text-small">{item.detail}</span>
                </div>
                <Button onClick={() => navigateToView(item.href)} size="sm" type="button">
                  {item.kind === "approval" ? "Review & Approve" : "Open brief"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>

      <SectionPanel description="Your six most recent briefs." title="Recent briefs">
        {recentBriefs.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={() => navigateToView("briefs")} variant="secondary">
                Go to Briefs
              </Button>
            }
            message="No briefs yet. Create your first brief to get started."
            title="No briefs"
            variant="inline"
          />
        ) : (
          <div className="client-dashboard-brief-row">
            {recentBriefs.map((brief) => {
              const badge = toClientBriefStatusLabel(brief.status);
              const articleSummary = formatClientBriefArticleSummary(brief);
              return (
                <Button
                  className="entity-card dense-record client-dashboard-brief-card"
                  key={brief.id}
                  onClick={() => navigateToView("briefs")}
                  type="button"
                  variant="tertiary"
                >
                  <div className="dense-record-main dense-record-main--stack">
                    <strong>{brief.title}</strong>
                    <Badge variant={badge.tone}>{badge.label}</Badge>
                    {articleSummary ? <span className="muted-text text-small">{articleSummary}</span> : null}
                    <span className="muted-text text-small">{formatClientBriefDate(brief.createdAt)}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </SectionPanel>

      <div className="client-dashboard-bottom-grid">
        <SectionPanel
          description="Performance charts appear when analytics are shared with your account."
          title="Content performance"
        >
          <div className="client-dashboard-unavailable">
            <p className="muted-text">
              Content performance is not available yet. When your team shares analytics for your
              account, they will appear here.
            </p>
          </div>
        </SectionPanel>

        <SectionPanel description="Updates from your workspace." title="Updates">
          <div className="client-dashboard-unavailable">
            <p className="muted-text">
              Notifications are not connected in this workspace yet. Check Pending Reviews for items
              that need your approval.
            </p>
          </div>
        </SectionPanel>
      </div>
    </section>
  );
}
