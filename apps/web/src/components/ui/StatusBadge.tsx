import {
  STATUS,
  formatStatusLabel,
  getStatusTone as canonicalGetStatusTone,
  getStatusVisual,
  statusBadgeStyle,
  toneToStatusKey,
  type LegacyStatusTone,
} from "../../design-system/status";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

/** Re-export compatibility tone helper (same buckets as before). */
export function getStatusTone(status: string): string {
  return canonicalGetStatusTone(status);
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = canonicalGetStatusTone(status) as LegacyStatusTone;
  const visual = getStatusVisual(status) ?? STATUS[toneToStatusKey(tone)];
  const label = formatStatusLabel(status);

  return (
    <span
      className={["ds-badge", "ds-status-badge", className].filter(Boolean).join(" ")}
      style={statusBadgeStyle(visual)}
    >
      <span className="ds-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
