import type { ReactNode } from "react";
import { Alert } from "./Alert";

type ErrorStateProps = {
  title: string;
  message: string;
  /** Optional recovery control (e.g. Try again). */
  action?: ReactNode;
  /** page = full panel Alert; inline = compact alert without orb layout. */
  variant?: "page" | "inline";
};

export function ErrorState({ title, message, action, variant = "page" }: ErrorStateProps) {
  return (
    <div className={variant === "inline" ? "error-state-inline" : "error-state-panel"}>
      <Alert message={message} title={title} variant="danger" />
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );
}
