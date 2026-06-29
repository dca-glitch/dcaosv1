import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Button, PageHeader, SectionPanel, StatusBadge, Table } from "../../components/ui";
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

  const tableRows = useMemo(
    () =>
      items.map((item) => ({
        key: item.id,
        cells: [
          <div key={`${item.id}-title`}>
            <div style={{ marginBottom: 4 }}>
              <StatusBadge status="Awaiting your approval" />
            </div>
            <strong>{item.title}</strong>
          </div>,
          <span className="entity-pill" key={`${item.id}-project`}>
            {item.projectName}
          </span>,
          <span className="muted-text" key={`${item.id}-date`}>
            {formatApprovalDate(item.createdAt)}
          </span>,
          <Button
            key={`${item.id}-action`}
            onClick={() => navigateToClientPortalHash(`client-portal/deliverables/${item.id}/approve`)}
            size="sm"
          >
            Review
          </Button>
        ]
      })),
    [items]
  );

  return (
    <section className="view-section" aria-labelledby="pending-approvals-title">
      <PageHeader
        action={
          <Button disabled={loading} onClick={() => void loadPendingApprovals()} variant="tertiary">
            Refresh
          </Button>
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
            <div className="table-wrap">
              <Table
                headers={[
                  { label: "Article", align: "left" },
                  { label: "Project", align: "left" },
                  { label: "Created", align: "right" },
                  { label: "Action", align: "right" }
                ]}
                rows={tableRows}
              />
            </div>
          )}
        </SectionPanel>
      ) : null}
    </section>
  );
}
