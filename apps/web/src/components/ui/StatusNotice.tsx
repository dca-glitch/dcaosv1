import { Alert, type AlertVariant } from "./Alert";

type StatusNoticeTone = "info" | "error" | "success";

type StatusNoticeProps = {
  tone: StatusNoticeTone;
  message: string;
  onDismiss?: () => void;
};

const toneToVariant: Record<StatusNoticeTone, AlertVariant> = {
  info: "info",
  error: "danger",
  success: "success",
};

export function StatusNotice({ tone, message, onDismiss }: StatusNoticeProps) {
  const dismissible = tone !== "error" && onDismiss;

  return (
    <Alert
      className={`status-notice status-notice-compact status-${tone}`}
      message={message}
      onClose={dismissible ? onDismiss : undefined}
      variant={toneToVariant[tone]}
    />
  );
}
