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
    return alert ? "#E07070" : undefined;
  }
  // Resolve CSS var to a hex for panelCSS tint (requires #RRGGBB).
  // Use known STATUS token hexes from tokens.css for tint only.
  const tintByTone: Partial<Record<StatusKey, string>> = {
    blocked: "#E07070",
    overdue: "#E07070",
    failed: "#E07070",
    in_review: "#C98A42",
    changes_requested: "#E07070",
    ready: "#818CF8",
    in_progress: "#818CF8",
    completed: "#4CAF85",
    approved: "#4CAF85",
    published: "#4CAF85",
  };
  return tintByTone[tone] ?? (alert ? "#E07070" : undefined);
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
