import { Bell } from "lucide-react";
import { useFocusTrap } from "./useFocusTrap";

type NotificationPanelProps = {
  onClose: () => void;
};

/**
 * UI-only notification center. No live data wiring in Phase 2.
 * Shows an empty placeholder until a real feed is connected.
 */
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const panelRef = useFocusTrap(true);

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
        <button type="button" className="shell-topbar__icon-btn" onClick={onClose} aria-label="Close notifications">
          Close
        </button>
      </div>
      <div className="shell-notification-panel__body">
        <div className="shell-notification-panel__empty">
          <Bell size={18} strokeWidth={2} aria-hidden="true" className="shell-notification-panel__empty-icon" />
          <p>No notifications yet.</p>
          <small>Updates will appear here when available.</small>
        </div>
      </div>
    </div>
  );
}
