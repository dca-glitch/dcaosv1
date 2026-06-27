type StatusNoticeTone = "info" | "error" | "success";

type StatusNoticeProps = {
  tone: StatusNoticeTone;
  message: string;
  onDismiss?: () => void;
};

export function StatusNotice({ tone, message, onDismiss }: StatusNoticeProps) {
  const dismissible = tone !== "error" && onDismiss;

  return (
    <div className={`status-notice status-notice-compact status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="status-notice-text">{message}</span>
      {dismissible ? (
        <button
          aria-label="Dismiss notice"
          className="status-notice-dismiss ghost-action"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
