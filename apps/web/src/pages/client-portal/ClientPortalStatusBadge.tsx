import { ClientStatusBadge, StatusBadge } from "../../components/ui";
import { resolveClientStatusKey, toClientPortalStatusLabel } from "./client-portal-status";

type ClientPortalStatusBadgeProps = {
  status: string | null | undefined;
  className?: string;
};

/** Portal enums where the explicit label should win over workflow vocabulary. */
const LABEL_FIRST_STATUSES = new Set([
  "ACTIVE",
  "SENT_TO_CLIENT",
  "ADMIN_REVIEW",
  "FINAL",
  "PENDING_CLIENT_REVIEW"
]);

/**
 * Client-safe status pill for portal surfaces.
 * Uses ClientStatusBadge when the canonical map is appropriate; otherwise
 * renders the resolved client label via StatusBadge (never raw internal keys).
 */
export function ClientPortalStatusBadge({ status, className }: ClientPortalStatusBadgeProps) {
  const label = toClientPortalStatusLabel(status);
  if (!status || !label) {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  const key = resolveClientStatusKey(status);

  if (key && !LABEL_FIRST_STATUSES.has(normalized)) {
    return <ClientStatusBadge className={className} status={status} />;
  }

  return <StatusBadge className={className} status={label} />;
}
