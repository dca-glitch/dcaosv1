import type { DashboardCardContract } from "@dca-os-v1/shared";
import { DashboardCard } from "../components/DashboardCard";

type DashboardPageProps = {
  cards: DashboardCardContract[];
};

export function DashboardPage({ cards }: DashboardPageProps) {
  return (
    <section className="page-section" id="dashboard">
      <header className="section-header">
        <div>
          <p>Workspace</p>
          <h1>DCA OS Foundation</h1>
        </div>
        <span>Initial skeleton</span>
      </header>
      <div className="dashboard-grid">
        {cards.map((card) => (
          <DashboardCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
