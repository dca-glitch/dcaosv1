import { EmptyState } from "../components/EmptyState";
import { PageHeader, SectionPanel } from "../components/ui";

export default function MonthlyReportsPage() {
  return (
    <section className="view-section" data-density="comfortable">
      <PageHeader
        description="SEO and Market Intelligence reports will appear here."
        eyebrow="Client workspace"
        title="Monthly Reports"
        titleId="monthly-reports-title"
      />
      <SectionPanel title="Reports">
        <EmptyState
          message="SEO and Market Intelligence reports will appear here when your agency publishes them."
          title="No reports yet"
          variant="inline"
        />
      </SectionPanel>
    </section>
  );
}
