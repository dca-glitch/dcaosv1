import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
  variant?: "page" | "inline";
};

export function EmptyState({ title, message, action, variant = "page" }: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className="inline-empty">
        <p className="muted-text">
          <span className="inline-empty-title">{title}.</span> {message}
        </p>
        {action ? <div className="state-action">{action}</div> : null}
      </div>
    );
  }

  return (
    <div className="state-panel empty-state-panel">
      <span className="state-orb" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
