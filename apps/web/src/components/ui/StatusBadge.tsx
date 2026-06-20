type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function getStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "-");

  if (["active", "enabled", "paid", "done", "success"].includes(normalized)) {
    return "success";
  }

  if (["draft", "pending", "to-do", "todo", "due", "in-progress", "issued", "sent"].includes(normalized)) {
    return "info";
  }

  if (["overdue", "failed", "cancelled", "canceled"].includes(normalized)) {
    return "danger";
  }

  if (["archived", "disabled", "paused"].includes(normalized)) {
    return "muted";
  }

  return "neutral";
}

function formatEnumLabel(value?: string | null): string {
  if (!value) return "Not set";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = getStatusTone(status);
  const label = formatEnumLabel(status);
  return <span className={["status-badge", `status-badge-${tone}`, className].filter(Boolean).join(" ")}>{label}</span>;
}
