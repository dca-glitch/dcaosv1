import type { ReactNode } from "react";

type EmptyStateKind = "empty" | "no-results" | "filtered" | "first-use";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
  variant?: "page" | "inline";
  /** Optional semantic kind for future styling; copy stays caller-owned. */
  kind?: EmptyStateKind;
};

/** Legacy product EmptyState API (title/message) — not the DS description API. */
export function EmptyState({ title, message, action, variant = "page", kind = "empty" }: EmptyStateProps) {
  if (variant === "inline") {
    const titleText = title.trim().endsWith(".") ? title.trim() : `${title.trim()}.`;
    return (
      <div className="inline-empty" data-empty-kind={kind}>
        <p className="muted-text">
          <span className="inline-empty-title">{titleText}</span> {message}
        </p>
        {action ? <div className="state-action">{action}</div> : null}
      </div>
    );
  }

  return (
    <div className="state-panel empty-state-panel" data-empty-kind={kind}>
      <span className="state-orb" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
