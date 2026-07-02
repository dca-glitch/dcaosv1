import { EmptyState } from "../components/EmptyState";
import { Button, PageHeader, SectionPanel } from "../components/ui";
import { navigateToClientPortalHash } from "./client-portal/client-portal-api";

export default function MonthlyReportsPage() {
  return (
    <section className="view-section cf-page" aria-labelledby="monthly-reports-title" data-density="comfortable">
      <PageHeader
        description="Final SEO and market intelligence reports shared with your account."
        eyebrow="Client workspace"
        title="Monthly Reports"
        titleId="monthly-reports-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal")}
          type="button"
          variant="tertiary"
        >
          Archive
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
          type="button"
          variant="tertiary"
        >
          Pending Approvals
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/briefs")}
          type="button"
          variant="tertiary"
        >
          Briefs
        </Button>
        <Button className="portal-subnav-link is-active" type="button" variant="tertiary">
          Monthly Reports
        </Button>
      </nav>

      <p className="cf-context-strip">
        Reports appear here after your team finalizes and shares them. Open your project archive for deliverables and
        in-progress work.
      </p>

      <SectionPanel description="Final reports only — read-only client view." title="Reports" tone="compact">
        <EmptyState
          message="SEO and Market Intelligence reports will appear here when your agency publishes them."
          title="No reports yet"
          variant="inline"
        />
      </SectionPanel>

      <p className="portal-footer-note muted-text">
        Monthly reports are read-only. Use Pending Approvals to review articles before publication.
      </p>
    </section>
  );
}
