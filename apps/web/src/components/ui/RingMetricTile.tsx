import type { StatusKey } from "../../design-system/status";
import { panelCSS } from "../../design-system/panel";
import { STATUS } from "../../design-system/status";
import { RingMeter } from "./RingMeter";

export type RingMetricTileProps = {
  label: string;
  value: number;
  max?: number;
  helper?: string;
  tone?: StatusKey | "neutral";
  alert?: boolean;
  metricKey?: string;
};

function resolveTint(tone: RingMetricTileProps["tone"], alert?: boolean): string | undefined {
  if (!tone || tone === "neutral") {
    return alert ? "#A65345" : undefined;
  }
  // panelCSS requires #RRGGBB — mirror --ds-chart-* / status token hexes from tokens.css.
  const tintByTone: Partial<Record<StatusKey, string>> = {
    blocked: "#765A78",
    overdue: "#A65345",
    failed: "#A65345",
    in_review: "#9A6817",
    changes_requested: "#A65345",
    ready: "#3730A3",
    in_progress: "#3730A3",
    completed: "#4F7A5B",
    approved: "#4F7A5B",
    published: "#4F7A5B",
  };
  return tintByTone[tone] ?? (alert ? "#A65345" : undefined);
}

/**
 * Agency Operations KPI tile — Label → Helper → RingMeter (SPEC §4.3 ring variant).
 */
export function RingMetricTile({
  label,
  value,
  max,
  helper,
  tone = "neutral",
  alert = false,
  metricKey,
}: RingMetricTileProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const ringMax = max != null && Number.isFinite(max) && max > 0 ? max : Math.max(safeValue, 1);
  const tint = resolveTint(tone, alert || safeValue > 0 && (tone === "blocked" || tone === "overdue" || tone === "failed"));
  const ariaParts = [label, String(safeValue)];
  if (helper) {
    ariaParts.push(String(helper));
  }
  if (tone && tone !== "neutral") {
    ariaParts.push(STATUS[tone].label);
  }

  return (
    <div
      className="agency-ring-metric-tile"
      data-metric={metricKey}
      data-alert={alert || undefined}
      aria-label={ariaParts.join(". ")}
      style={{
        ...panelCSS(tint, true),
        borderRadius: "var(--ds-radius-lg)",
        padding: "var(--ds-card-padding-admin)",
      }}
    >
      <p className="agency-ring-metric-tile__label">{label}</p>
      {helper ? <p className="agency-ring-metric-tile__helper">{helper}</p> : null}
      <div className="agency-ring-metric-tile__ring">
        <RingMeter label={label} value={safeValue} max={ringMax} tone={tone} size="md" />
      </div>
    </div>
  );
}
