import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusTrap } from "./useFocusTrap";

type NotificationPanelProps = {
  isClientRole?: boolean;
  onClose: () => void;
  token?: string | null;
  onUnreadCountChange?: (count: number) => void;
};

type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

type InboxNotification = {
  id: string;
  eventType: string;
  severity: string;
  title: string;
  body: string | null;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
};

type InboxResponse = {
  ok: boolean;
  data?: {
    notifications?: InboxNotification[];
    unreadCount?: number;
  };
};

const API_BASE_URL = "/api/v1";

function getListEndpoint(isClientRole: boolean): string {
  return isClientRole ? "/client-portal/notifications?limit=50" : "/notifications/inbox?limit=50";
}

function getReadEndpoint(isClientRole: boolean, notificationId: string): string {
  return isClientRole
    ? `/client-portal/notifications/${notificationId}/read`
    : `/notifications/inbox/${notificationId}/read`;
}

function formatRelativeTimestamp(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const now = Date.now();
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationPanel({
  isClientRole = false,
  onClose,
  token = null,
  onUnreadCountChange
}: NotificationPanelProps) {
  const panelRef = useFocusTrap(true);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(null);
      setNotifications([]);
      setUnreadCount(0);
      onUnreadCountChange?.(0);
      return;
    }

    let cancelled = false;
    async function loadNotifications() {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${getListEndpoint(isClientRole)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (!cancelled) {
          setError("Could not load notifications.");
          setNotifications([]);
          setUnreadCount(0);
          onUnreadCountChange?.(0);
          setLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as InboxResponse;
      if (cancelled) {
        return;
      }

      const nextNotifications = Array.isArray(payload.data?.notifications) ? payload.data.notifications : [];
      const nextUnreadCount = typeof payload.data?.unreadCount === "number" ? payload.data.unreadCount : 0;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      onUnreadCountChange?.(nextUnreadCount);
      setLoading(false);
    }

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [token, isClientRole, onUnreadCountChange]);

  async function handleMarkRead(notificationId: string) {
    if (!token) {
      return;
    }

    setMarkingId(notificationId);
    const response = await fetch(`${API_BASE_URL}${getReadEndpoint(isClientRole, notificationId)}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    setMarkingId(null);
    if (!response.ok) {
      return;
    }

    const nowIso = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              status: "READ",
              readAt: notification.readAt ?? nowIso
            }
          : notification
      )
    );
    setUnreadCount((current) => {
      const next = Math.max(0, current - 1);
      onUnreadCountChange?.(next);
      return next;
    });
  }

  return (
    <div
      ref={panelRef}
      id="shell-notification-panel"
      className="shell-notification-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shell-notification-title"
      tabIndex={-1}
    >
      <div className="shell-notification-panel__header">
        <h2 id="shell-notification-title" className="shell-notification-panel__title">
          Notifications
        </h2>
        <div className="shell-notification-panel__header-actions">
          {unreadCount > 0 ? <span className="shell-notification-panel__count">{unreadCount} unread</span> : null}
          <button type="button" className="shell-topbar__icon-btn" onClick={onClose} aria-label="Close notifications">
            Close
          </button>
        </div>
      </div>
      <div className="shell-notification-panel__body">
        {!token ? (
          <div className="shell-notification-panel__empty">
            <Bell size={18} strokeWidth={2} aria-hidden="true" className="shell-notification-panel__empty-icon" />
            <p>No notifications yet.</p>
            <small>Updates will appear here when available.</small>
          </div>
        ) : null}

        {token && loading ? (
          <div className="shell-notification-panel__state">
            <p>Loading notifications...</p>
          </div>
        ) : null}

        {token && !loading && error ? (
          <div className="shell-notification-panel__state" role="status" aria-live="polite">
            <p>{error}</p>
          </div>
        ) : null}

        {token && !loading && !error && notifications.length === 0 ? (
          <div className="shell-notification-panel__empty">
            <Bell size={18} strokeWidth={2} aria-hidden="true" className="shell-notification-panel__empty-icon" />
            <p>No notifications yet.</p>
            <small>Updates will appear here when available.</small>
          </div>
        ) : null}

        {token && !loading && !error && notifications.length > 0 ? (
          <ul className="shell-notification-panel__list">
            {notifications.map((notification) => {
              const unread = notification.status === "UNREAD";
              return (
                <li key={notification.id} className="shell-notification-panel__item">
                  <div className="shell-notification-panel__item-header">
                    <p className="shell-notification-panel__item-title">{notification.title}</p>
                    <span className="shell-notification-panel__item-time">
                      {formatRelativeTimestamp(notification.createdAt)}
                    </span>
                  </div>
                  {notification.body ? <p className="shell-notification-panel__item-body">{notification.body}</p> : null}
                  <div className="shell-notification-panel__item-actions">
                    <span className={unread ? "shell-notification-panel__status unread" : "shell-notification-panel__status"}>
                      {unread ? "Unread" : "Read"}
                    </span>
                    {unread ? (
                      <button
                        type="button"
                        className="shell-notification-panel__mark-read"
                        disabled={markingId === notification.id}
                        onClick={() => {
                          void handleMarkRead(notification.id);
                        }}
                      >
                        {markingId === notification.id ? "Marking..." : "Mark read"}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
