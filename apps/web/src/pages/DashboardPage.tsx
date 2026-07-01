import type { DashboardCardContract } from "@dca-os-v1/shared";
import { DashboardCard } from "../components/DashboardCard";
import { PageHeader } from "../components/ui";

type DashboardPageProps = {
  cards: DashboardCardContract[];
};

export function DashboardPage({ cards }: DashboardPageProps) {
  return (
    <section className="view-section" data-density="compact" id="dashboard">
      <PageHeader
        description="Legacy module shell cards. The live dashboard uses the operations command view in App."
        eyebrow="Workspace"
        meta={<span className="muted-text">Module contract preview</span>}
        title="DCA OS Foundation"
        titleId="dashboard-foundation-title"
      />
      <div className="dashboard-grid">
        {cards.map((card) => (
          <DashboardCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
