import { useCallback, useEffect, useState } from "react";
import { Alert, Button, EmptyState, LoadingState, PageHeader, SectionPanel } from "../../components/ui";
import { ClientPortalStatusBadge } from "./ClientPortalStatusBadge";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type PendingApprovalSummary,
  type PendingApprovalsResponse
} from "./client-portal-api";
import "./client-portal.css";

const AMBER_TINT = "#C98A42";

function PortalInlineLoading({ label }: { label: string }) {
  return <LoadingState label={label} variant="inline" />;
}

export function PendingApprovalsPage() {
  const [items, setItems] = useState<PendingApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await clientPortalApiRequest<PendingApprovalsResponse>("/pending-approvals");
    if (!response.ok) {
      setError(response.error.message);
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(response.data.pendingApprovals);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPendingApprovals();
  }, [loadPendingApprovals]);

  return (
    <section
      className="view-section cf-page client-portal-page"
      aria-labelledby="pending-approvals-title"
      data-density="comfortable"
    >
      <PageHeader
        action={
          <Button disabled={loading} onClick={() => void loadPendingApprovals()} variant="tertiary">
            Refresh
          </Button>
        }
        description="Review the current draft and choose approve or request changes."
        eyebrow="Client workspace"
        meta={
          <span className="muted-text">
            {items.length > 0
              ? `Next action: ${items.length === 1 ? "Review the article below" : `Review ${items.length} articles below`}`
              : "Next action: No articles waiting for your review right now"}
          </span>
        }
        title="Pending Reviews"
        titleId="pending-approvals-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <Button className="portal-subnav-link" onClick={() => navigateToClientPortalHash("client-portal")} type="button" variant="tertiary">
          Archive
        </Button>
        <Button className="portal-subnav-link is-active" type="button" variant="tertiary">
          Pending Reviews
          {items.length > 0 ? <span className="nav-count-badge">{items.length}</span> : null}
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/briefs")}
          type="button"
          variant="tertiary"
        >
          Briefs
        </Button>
      </nav>

      {loading ? <PortalInlineLoading label="Loading pending approvals" /> : null}

      {!loading && error ? <Alert message={error} title="Approvals unavailable" variant="danger" /> : null}

      {!loading && !error ? (
        <SectionPanel
          description="Review the current draft and choose approve or request changes."
          tint={items.length > 0 ? AMBER_TINT : undefined}
          title="Required attention"
          tone={items.length > 0 ? "highlight" : "compact"}
        >
          {items.length === 0 ? (
            <EmptyState message="No articles waiting for your review." title="All set" variant="inline" />
          ) : (
            <div className="client-portal-attention-list" role="list" aria-label="Pending approval articles">
              {items.map((item) => (
                <div
                  className="client-portal-attention-row is-urgent cf-record"
                  data-testid="pending-approval-record"
                  key={item.id}
                  role="listitem"
                >
                  <div className="client-portal-attention-copy">
                    <div className="cf-record-kicker">
                      <ClientPortalStatusBadge status={item.status} />
                    </div>
                    <strong>{item.title}</strong>
                    <span className="muted-text text-small">
                      {item.projectName} · Shared {formatApprovalDate(item.createdAt)}
                    </span>
                  </div>
                  <Button
                    onClick={() => navigateToClientPortalHash(`client-portal/deliverables/${item.id}/approve`)}
                    size="sm"
                    type="button"
                  >
                    Review &amp; Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}
    </section>
  );
}
