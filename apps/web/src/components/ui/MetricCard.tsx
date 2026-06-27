import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: "cyan" | "violet" | "purple" | "success" | "warning";
  metricKey?: string;
};

function buildMetricAriaLabel(label: string, value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return `${label}: ${value}`;
  }

  return label;
}

export function MetricCard({ label, value, helper, accent = "violet", metricKey }: MetricCardProps) {
  return (
    <article
      aria-label={buildMetricAriaLabel(label, value)}
      className={`metric-card metric-card-${accent}`}
      data-metric={metricKey}
    >
      <span className="metric-card-label">{label}</span>
      <strong className="metric-card-value">{value}</strong>
      {helper ? <small className="metric-card-helper">{helper}</small> : null}
    </article>
  );
}