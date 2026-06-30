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
        <p className="muted-text">SEO and Market Intelligence reports will appear here.</p>
      </SectionPanel>
    </section>
  );
}
