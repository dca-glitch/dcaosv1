import DSBadge from "../../design-system/components/Badge";
import type { BadgeVariant as DSBadgeVariant } from "../../design-system/components/Badge";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function getStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "-");

  if (["accepted", "active", "approved", "delivered", "enabled", "final", "paid", "ready", "done", "success"].includes(normalized)) {
    return "success";
  }

  if (["admin-review", "draft", "pending", "to-do", "todo", "due", "in-progress", "issued", "sent", "review", "awaiting-your-approval"].includes(normalized)) {
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

function toneToVariant(tone: string): DSBadgeVariant {
  if (tone === "danger") return "danger";
  if (tone === "info")   return "primary";
  if (tone === "success") return "success";
  if (tone === "muted")  return "muted";
  return "muted";
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
  const variant = toneToVariant(tone);

  return (
    <DSBadge variant={variant} className={className}>
      {label}
    </DSBadge>
  );
}
