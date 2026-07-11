import type { ReactNode } from "react";
import { Button } from "../Button";

export type ActionQueuePriority = "critical" | "high" | "normal" | "low";

export type ActionQueueItem = {
  id: string;
  title: string;
  description?: string;
  priority?: ActionQueuePriority;
  priorityLabel?: string;
  meta?: ReactNode;
  actionLabel?: string;
};

export type ActionQueueProps = {
  items: ActionQueueItem[];
  onAction?: (item: ActionQueueItem) => void;
  emptyMessage?: string;
  ariaLabel?: string;
  className?: string;
};

const PRIORITY_LABEL: Record<ActionQueuePriority, string> = {
  critical: "Critical",
  high: "High",
  normal: "Normal",
  low: "Low",
};

/** Presentational priority action list — callers supply items and optional onAction. */
export function ActionQueue({
  items,
  onAction,
  emptyMessage = "No actions in this queue.",
  ariaLabel = "Action queue",
  className,
}: ActionQueueProps) {
  if (items.length === 0) {
    return <p className="op-action-queue-empty">{emptyMessage}</p>;
  }

  return (
    <div
      aria-label={ariaLabel}
      className={["op-action-queue", className].filter(Boolean).join(" ")}
      role="list"
    >
      {items.map((item) => {
        const priority = item.priority ?? "normal";
        const priorityLabel = item.priorityLabel ?? PRIORITY_LABEL[priority];
        return (
          <div
            aria-label={`${priorityLabel} priority. ${item.title}`}
            className="op-action-queue-item"
            data-priority={priority}
            key={item.id}
            role="listitem"
          >
            <div className="op-action-queue-body">
              <p className="op-action-queue-title">{item.title}</p>
              {item.description ? (
                <p className="op-action-queue-description">{item.description}</p>
              ) : null}
              <p className="op-action-queue-meta">
                <span className="op-action-queue-priority">{priorityLabel} priority</span>
                {item.meta ? <span>{item.meta}</span> : null}
              </p>
            </div>
            {onAction ? (
              <Button
                onClick={() => onAction(item)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {item.actionLabel ?? "Continue"}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
