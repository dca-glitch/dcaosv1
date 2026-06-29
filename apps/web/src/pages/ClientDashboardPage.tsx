import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Badge, Button, PageHeader, SectionPanel } from "../components/ui";
import {
  clientPortalApiRequest,
  getClientPortalAuthToken,
  type ApiResponse,
  type PendingApprovalsResponse
} from "./client-portal/client-portal-api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

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

function formatBriefDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
}

function formatArticleSummary(brief: BriefRecord): string | null {
  const parts: string[] = [];
  if (brief.hubCount > 0) parts.push(`Hub ×${brief.hubCount}`);
  if (brief.geoSeoCount > 0) parts.push(`Geo SEO ×${brief.geoSeoCount}`);
  if (brief.lifestyleCount > 0) parts.push(`Lifestyle ×${brief.lifestyleCount}`);
  if (brief.otherCount > 0) parts.push(`Other ×${brief.otherCount}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function getBriefStatusBadge(status: BriefStatus): { label: string; variant: "success" | "info" | "warning" } {
  if (status === "DRAFT") return { label: "Draft", variant: "warning" };
  if (status === "SUBMITTED") return { label: "Submitted", variant: "success" };
  if (status === "AWAITING_CLIENT") return { label: "Awaiting your input", variant: "info" };
  return { label: status, variant: "warning" };
}

function ActivityFeedPlaceholder() {
  return (
    <div
      className="brief-ai-research-placeholder"
      style={{
        border: "1px dashed rgba(148, 163, 184, 0.35)",
        borderRadius: "8px",
        background: "rgba(148, 163, 184, 0.06)",
        padding: "1rem 1.25rem"
      }}
    >
      <p className="muted-text" style={{ margin: 0 }}>
        Your recent activity will appear here.
      </p>
    </div>
  );
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

  const recentBriefs = useMemo(
    () =>
      [...briefs]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 6),
    [briefs]
  );

  const awaitingBriefCount = useMemo(
    () => briefs.filter((brief) => brief.status === "AWAITING_CLIENT").length,
    [briefs]
  );

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (error) {
    return (
      <section className="view-section" aria-labelledby="client-dashboard-title">
        <PageHeader
          description="Your client workspace overview."
          eyebrow="Client workspace"
          title="Dashboard"
          titleId="client-dashboard-title"
        />
        <ErrorState message={error} title="Dashboard unavailable" />
        <div className="portal-action-row">
          <Button onClick={() => void loadDashboard()} variant="secondary">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" aria-labelledby="client-dashboard-title">
      <PageHeader
        description={
          clientName
            ? `Overview for ${clientName} — recent briefs and items awaiting your action.`
            : "Your client workspace overview."
        }
        eyebrow="Client workspace"
        meta={<span className="muted-text">{user.name || user.email}</span>}
        title="Dashboard"
        titleId="client-dashboard-title"
      />

      <SectionPanel description="Your six most recent briefs." title="Recent Briefs">
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
          <div
            className="client-dashboard-brief-row"
            style={{
              display: "flex",
              gap: "0.75rem",
              overflowX: "auto",
              paddingBottom: "0.25rem"
            }}
          >
            {recentBriefs.map((brief) => {
              const badge = getBriefStatusBadge(brief.status);
              const articleSummary = formatArticleSummary(brief);
              return (
                <button
                  className="entity-card dense-record client-dashboard-brief-card"
                  key={brief.id}
                  onClick={() => navigateToView("briefs")}
                  style={{
                    cursor: "pointer",
                    flex: "0 0 min(260px, 80vw)",
                    minWidth: "220px",
                    textAlign: "left"
                  }}
                  type="button"
                >
                  <div className="dense-record-main dense-record-main--stack">
                    <strong>{brief.title}</strong>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {articleSummary ? <span className="muted-text text-small">{articleSummary}</span> : null}
                    <span className="muted-text text-small">{formatBriefDate(brief.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionPanel>

      <div
        className="dashboard-grid client-dashboard-bottom-grid"
        style={{ marginTop: "1.25rem" }}
      >
        <SectionPanel description="Items that need your attention." title="Awaiting Your Action">
          {awaitingBriefCount === 0 && pendingApprovalCount === 0 ? (
            <p className="muted-text" style={{ color: "rgba(110, 231, 183, 0.95)", margin: 0 }}>
              ✓ You&apos;re all caught up
            </p>
          ) : (
            <div className="quick-link-list">
              {awaitingBriefCount > 0 ? (
                <button
                  className="subtle-action"
                  onClick={() => navigateToView("briefs")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                  type="button"
                >
                  📋 {awaitingBriefCount} brief{awaitingBriefCount === 1 ? "" : "s"} awaiting your input
                </button>
              ) : null}
              {pendingApprovalCount > 0 ? (
                <button
                  className="subtle-action"
                  onClick={() => navigateToView("pending-approvals")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                  type="button"
                >
                  📄 {pendingApprovalCount} article{pendingApprovalCount === 1 ? "" : "s"} pending your approval
                </button>
              ) : null}
            </div>
          )}
        </SectionPanel>

        <SectionPanel description="Updates from your workspace." title="Recent Activity">
          <ActivityFeedPlaceholder />
        </SectionPanel>
      </div>
    </section>
  );
}
