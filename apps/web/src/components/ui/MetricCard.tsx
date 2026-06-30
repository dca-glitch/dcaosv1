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

export function MetricCard({ label, value, helper, metricKey }: MetricCardProps) {
  return (
    <div
      aria-label={buildMetricAriaLabel(label, value)}
      className="card-elevated"
      data-metric={metricKey}
    >
      <p className="text-caption font-semibold uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-title-lg font-semibold leading-none text-text-primary">{value}</span>
      </div>
      {helper ? (
        <p className="text-caption mt-1.5 text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}