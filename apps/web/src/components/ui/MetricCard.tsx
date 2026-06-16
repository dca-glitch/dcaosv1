import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: "cyan" | "violet" | "purple" | "success" | "warning";
};

export function MetricCard({ label, value, helper, accent = "violet" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}