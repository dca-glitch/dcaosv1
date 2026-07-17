import type { ReactNode } from "react";
import { panelCSS } from "../../design-system/panel";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
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
      className="metric-card"
      data-metric={metricKey}
      style={{
        ...panelCSS(),
        borderRadius: "var(--ds-radius-lg)",
        padding: "12px 16px",
      }}
    >
      <p className="text-[12px] font-semibold tracking-wide text-text-muted">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[22px] font-semibold leading-none text-text-primary font-mono">{value}</span>
      </div>
      {helper ? (
        <p className="text-[12px] mt-1 text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
