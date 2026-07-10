import { ShieldOff } from "lucide-react";
import type { ReactNode } from "react";

type AccessDeniedStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Presentational access-denied state.
 * Does not implement or rewrite permission checks — display only.
 */
export function AccessDeniedState({
  title = "Access denied",
  description = "You do not have permission to view this area.",
  action
}: AccessDeniedStateProps) {
  return (
    <div className="shell-state-panel shell-state-panel--access-denied" role="status">
      <ShieldOff size={28} strokeWidth={1.75} aria-hidden="true" className="shell-state-panel__icon" />
      <h2 className="shell-state-panel__title">{title}</h2>
      <p className="shell-state-panel__description">{description}</p>
      {action ? <div className="shell-state-panel__action">{action}</div> : null}
    </div>
  );
}
