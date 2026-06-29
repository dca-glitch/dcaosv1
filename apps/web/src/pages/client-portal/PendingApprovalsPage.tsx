import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader, SectionPanel, StatusBadge } from "../../components/ui";
import {
  clientPortalApiRequest,
  formatApprovalDate,
  navigateToClientPortalHash,
  type PendingApprovalSummary,
  type PendingApprovalsResponse
} from "./client-portal-api";

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
    <section className="view-section" aria-labelledby="pending-approvals-title">
      <PageHeader
        actions={
          <button className="ghost-action" disabled={loading} onClick={() => void loadPendingApprovals()} type="button">
            Refresh
          </button>
        }
        description="Articles awaiting your review"
        eyebrow="Client workspace"
        title="Pending Approvals"
        titleId="pending-approvals-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <button className="portal-subnav-link" onClick={() => navigateToClientPortalHash("client-portal")} type="button">
          Archive
        </button>
        <button className="portal-subnav-link is-active" type="button">
          Pending Approvals
          {items.length > 0 ? <span className="nav-count-badge">{items.length}</span> : null}
        </button>
      </nav>

      {loading ? <LoadingState label="Loading pending approvals" /> : null}

      {!loading && error ? <ErrorState message={error} title="Approvals unavailable" /> : null}

      {!loading && !error ? (
        <SectionPanel description="Review article drafts and images before publication." title="Awaiting your approval">
          {items.length === 0 ? (
            <EmptyState message="No articles pending your approval" title="All caught up" variant="inline" />
          ) : (
            <div className="dense-list">
              {items.map((item) => (
                <article className="entity-card dense-record" key={item.id}>
                  <div className="dense-record-main">
                    <div className="dense-title">
                      <div className="dense-kicker">
                        <StatusBadge status="Awaiting your approval" />
                        <span className="entity-pill">{item.projectName}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p className="muted-text">Created {formatApprovalDate(item.createdAt)}</p>
                    </div>
                    <button
                      className="primary-action"
                      onClick={() => navigateToClientPortalHash(`client-portal/deliverables/${item.id}/approve`)}
                      type="button"
                    >
                      Review
                    </button>
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
