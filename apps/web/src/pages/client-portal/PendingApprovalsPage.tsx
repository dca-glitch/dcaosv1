import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { Button, PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import { Alert, Spinner } from "../../design-system";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type PendingApprovalSummary,
  type PendingApprovalsResponse
} from "./client-portal-api";

function PortalInlineLoading({ label }: { label: string }) {
  return (
    <p className="cf-inline-loading" role="status">
      <Spinner size="sm" />
      {label}
    </p>
  );
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
    <section className="view-section cf-page" aria-labelledby="pending-approvals-title" data-density="comfortable">
      <PageHeader
        action={
          <Button disabled={loading} onClick={() => void loadPendingApprovals()} variant="tertiary">
            Refresh
          </Button>
        }
        description="Open each article to approve it or send it back with changes."
        eyebrow="Client workspace"
        meta={
          <span className="muted-text">
            {items.length > 0
              ? `Next action: Open ${items.length === 1 ? "the article" : "each article"} to review`
              : "Next action: Wait for the next article to arrive"}
          </span>
        }
        title="Pending Approvals"
        titleId="pending-approvals-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <Button className="portal-subnav-link" onClick={() => navigateToClientPortalHash("client-portal")} type="button" variant="tertiary">
          Archive
        </Button>
        <Button className="portal-subnav-link is-active" type="button" variant="tertiary">
          Pending Approvals
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
          description="Review article drafts and images before publication."
          title="Awaiting your approval"
          tone="compact"
        >
          {items.length === 0 ? (
            <EmptyState message="No articles need your review right now." title="All caught up" variant="inline" />
          ) : (
            <div className="cf-record-list">
              {items.map((item) => (
                <article className="cf-record dense-record" key={item.id}>
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status="Awaiting your approval" />
                        <span className="entity-pill">Next action: Open review</span>
                      </div>
                      <h3>{item.title}</h3>
                      <div className="dense-meta">
                        <span>{item.projectName}</span>
                        <span>Shared {formatApprovalDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="dense-actions">
                      <Button
                        onClick={() => navigateToClientPortalHash(`client-portal/deliverables/${item.id}/approve`)}
                        size="sm"
                        type="button"
                        variant="tertiary"
                      >
                        Open review
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionPanel>
      ) : null}
    </section>
  );
}
