import type { ReactNode } from "react";

type EmptyStateKind = "empty" | "no-results" | "filtered" | "first-use";

type EmptyStateProps = {
  /** Optional for inline message-only empties; required for page variant. */
  title?: string;
  message: string;
  action?: ReactNode;
  variant?: "page" | "inline";
  /** Semantic kind for styling and tests; copy stays caller-owned. */
  kind?: EmptyStateKind;
};

/** Legacy product EmptyState API (title/message) — not the DS description API. */
export function EmptyState({ title, message, action, variant = "page", kind = "empty" }: EmptyStateProps) {
  if (variant === "inline") {
    const trimmedTitle = (title ?? "").trim();
    if (!trimmedTitle) {
      return (
        <div className="inline-empty" data-empty-kind={kind}>
          <p className="muted-text">{message}</p>
          {action ? <div className="state-action">{action}</div> : null}
        </div>
      );
    }
    const titleText = trimmedTitle.endsWith(".") ? trimmedTitle : `${trimmedTitle}.`;
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
      <h3>{title ?? "Nothing here"}</h3>
      <p>{message}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
