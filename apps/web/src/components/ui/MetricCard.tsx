import type { ReactNode } from "react";
import { panelCSS } from "../../design-system/panel";

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

export function MetricCard({ label, value, helper, accent, metricKey }: MetricCardProps) {
  // `accent` retained for call-site compatibility; visual tint deferred (RingMeter / Phase 3).
  void accent;

  return (
    <div
      aria-label={buildMetricAriaLabel(label, value)}
      className="card-elevated"
      data-metric={metricKey}
      style={{
        ...panelCSS(undefined, true),
        borderRadius: "var(--ds-radius-lg)",
        padding: "var(--ds-card-padding-admin)",
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-[26px] font-semibold leading-none text-text-primary font-mono">{value}</span>
      </div>
      {helper ? (
        <p className="text-[11px] mt-1.5 text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
