import { Spinner } from "./Spinner";

type LoadingStateProps = {
  label?: string;
  /** page = full state panel; inline = compact row for modals/sections. */
  variant?: "page" | "inline";
};

/** Canonical loading primitive — Spinner + polite live region. */
export function LoadingState({ label = "Loading", variant = "page" }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className="inline-loading" role="status" aria-live="polite">
        <Spinner size="sm" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="state-panel loading-state-panel" role="status" aria-live="polite">
      <Spinner size="sm" />
      {label}
    </div>
  );
}
