import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="state-panel empty-state-panel">
      <span className="state-orb" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
