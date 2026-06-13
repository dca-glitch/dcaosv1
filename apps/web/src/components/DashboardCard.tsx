import type { DashboardCardContract } from "@dca-os-v1/shared";

type DashboardCardProps = {
  card: DashboardCardContract;
};

export function DashboardCard({ card }: DashboardCardProps) {
  return (
    <article className="dashboard-card">
      <div>
        <h3>{card.title}</h3>
        {card.description ? <p>{card.description}</p> : null}
      </div>
      {card.valueLabel ? <strong>{card.valueLabel}</strong> : null}
    </article>
  );
}
