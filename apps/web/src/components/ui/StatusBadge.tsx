type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function getStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "-");

  if (["accepted", "active", "approved", "delivered", "enabled", "final", "paid", "ready", "done", "success"].includes(normalized)) {
    return "success";
  }

  if (["admin-review", "draft", "pending", "to-do", "todo", "due", "in-progress", "issued", "sent", "review"].includes(normalized)) {
    return "info";
  }

  if (["missing", "overdue", "failed", "cancelled", "canceled", "rejected", "revision-requested"].includes(normalized)) {
    return "danger";
  }

  if (["archived", "deferred", "disabled", "paused"].includes(normalized)) {
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
