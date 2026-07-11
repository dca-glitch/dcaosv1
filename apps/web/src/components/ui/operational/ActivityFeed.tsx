import type { ReactNode } from "react";
import { ActivityItem } from "../../../design-system";

export type ActivityFeedItem = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  actor?: ReactNode;
  status?: string;
};

export type ActivityFeedProps = {
  items: ActivityFeedItem[];
  emptyMessage?: string;
  ariaLabel?: string;
  className?: string;
};

/** List wrapper around design-system ActivityItem. */
export function ActivityFeed({
  items,
  emptyMessage = "No recent activity.",
  ariaLabel = "Activity feed",
  className,
}: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="op-activity-feed-empty">{emptyMessage}</p>;
  }

  return (
    <div
      aria-label={ariaLabel}
      className={["op-activity-feed", className].filter(Boolean).join(" ")}
      role="list"
    >
      {items.map((item) => (
        <div key={item.id} role="listitem">
          <ActivityItem
            actor={item.actor}
            description={item.description}
            status={item.status}
            timestamp={item.timestamp}
            title={item.title}
          />
        </div>
      ))}
    </div>
  );
}
