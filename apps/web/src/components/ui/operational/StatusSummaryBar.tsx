export type StatusSummaryItem = {
  key: string;
  label: string;
  count: number;
};

export type StatusSummaryBarProps = {
  items: StatusSummaryItem[];
  ariaLabel?: string;
  className?: string;
};

/** Compact status count chips/strip. */
export function StatusSummaryBar({
  items,
  ariaLabel = "Status summary",
  className,
}: StatusSummaryBarProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={ariaLabel}
      className={["op-status-summary-bar", className].filter(Boolean).join(" ")}
      role="group"
    >
      {items.map((item) => (
        <span className="op-status-summary-chip" key={item.key}>
          <span>{item.label}</span>
          <span className="op-status-summary-chip-count">{item.count}</span>
        </span>
      ))}
    </div>
  );
}
