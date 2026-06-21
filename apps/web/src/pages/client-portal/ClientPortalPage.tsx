import { MetricCard, PageHeader, SectionPanel } from "../../components/ui";

export function ClientPortalPage() {
  return (
    <section className="view-section" aria-labelledby="client-portal-title">
      <PageHeader
        eyebrow="Client workspace"
        title="Client Portal"
        titleId="client-portal-title"
        description="Foundation view for client-facing reviews and deliverables. This shell is read-only and placeholder-only until client-safe data access is approved."
      />

      <div className="summary-grid metric-grid">
        <MetricCard accent="cyan" helper="Read-only foundation only" label="Projects" value="Placeholder" />
        <MetricCard accent="violet" helper="Existing internal review screen" label="Content plan reviews" value="Available" />
        <MetricCard accent="purple" helper="Existing internal review screen" label="Content draft reviews" value="Available" />
        <MetricCard accent="warning" helper="No publishing or downloads exposed" label="Deliverables / approvals" value="Coming soon" />
      </div>

      <SectionPanel
        title="Projects"
        description="Project summaries are intentionally not exposed in this shell yet. This section reserves the client-facing space without loading real client data."
      >
        <div className="state-panel">
          Project visibility will be added only after client-safe backend scope is approved.
        </div>
      </SectionPanel>

      <SectionPanel
        title="Content Plan Reviews"
        description="Uses the existing authenticated review route already present in the app shell."
        action={<a className="primary-action" href="#/content-plan-review">Open content plan review</a>}
      >
        <p className="muted-text">
          This link opens the existing internal review screen. No new portal-specific approval workflow is created here.
        </p>
      </SectionPanel>

      <SectionPanel
        title="Content Draft Reviews"
        description="Uses the existing authenticated draft review route already present in the app shell."
        action={<a className="primary-action" href="#/content-draft-review">Open content draft review</a>}
      >
        <p className="muted-text">
          This link opens the existing internal review screen. No new publishing, commenting, or messaging behavior is added.
        </p>
      </SectionPanel>

      <div className="entity-grid">
        <SectionPanel
          title="Deliverables"
          description="Coming soon. Deliverable publishing and client-safe downloads are not active in this shell."
        >
          <div className="state-panel">
            Deliverables remain admin-managed only. No public links, download actions, or file exposure are enabled here.
          </div>
        </SectionPanel>

        <SectionPanel
          title="Approvals"
          description="Coming soon. Formal approval workflows are not active in this shell."
        >
          <div className="state-panel">
            Approval history, accept/reject actions, and client messaging will be added only after separate scope approval.
          </div>
        </SectionPanel>
      </div>
    </section>
  );
}
