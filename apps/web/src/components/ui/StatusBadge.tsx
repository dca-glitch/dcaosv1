import {
  STATUS,
  formatStatusLabel,
  getStatusTone as canonicalGetStatusTone,
  getStatusVisual,
  normalizeStatusKey,
  statusBadgeStyle,
  toneToStatusKey,
  type LegacyStatusTone,
} from "../../design-system/status";

type StatusBadgeProps = {
  /** Semantic status key / enum — drives color, data-status, and default label. */
  status: string;
  /**
   * Visible text only. Never used as the tone/key source.
   * Prefer when a surface needs a special label (admin vs client, portal vocabulary).
   */
  displayLabel?: string;
  className?: string;
};

/** Re-export compatibility tone helper (same buckets as before). */
export function getStatusTone(status: string): string {
  return canonicalGetStatusTone(status);
}

/**
 * Canonical admin-facing lifecycle status pill.
 * `status` controls semantics/color; `displayLabel` overrides visible text only.
 */
export function StatusBadge({ status, displayLabel, className }: StatusBadgeProps) {
  const tone = canonicalGetStatusTone(status) as LegacyStatusTone;
  const key = normalizeStatusKey(status);
  const visual = getStatusVisual(status) ?? STATUS[toneToStatusKey(tone)];
  const label =
    displayLabel ?? (key ? STATUS[key].label : formatStatusLabel(status));

  return (
    <span
      className={["ds-badge", "ds-status-badge", className].filter(Boolean).join(" ")}
      data-status={key ?? "unknown"}
      style={{ ...statusBadgeStyle(visual), fontSize: "12px", textTransform: "none" }}
    >
      <span className="ds-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
