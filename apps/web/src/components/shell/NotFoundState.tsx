import { FileQuestion } from "lucide-react";
import type { ReactNode } from "react";

type NotFoundStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Presentational 404 state for shell-level unknown routes.
 * Does not alter hash routing or permission logic by itself.
 */
export function NotFoundState({
  title = "Page not found",
  description = "This route is not available in DCA OS Lite.",
  action
}: NotFoundStateProps) {
  return (
    <div className="shell-state-panel shell-state-panel--not-found" role="status">
      <FileQuestion size={28} strokeWidth={1.75} aria-hidden="true" className="shell-state-panel__icon" />
      <h2 className="shell-state-panel__title">{title}</h2>
      <p className="shell-state-panel__description">{description}</p>
      {action ? <div className="shell-state-panel__action">{action}</div> : null}
    </div>
  );
}
