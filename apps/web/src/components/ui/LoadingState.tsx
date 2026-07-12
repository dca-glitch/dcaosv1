import { Spinner } from "./Spinner";

type LoadingStateProps = {
  label?: string;
};

/** Preserved API — visual spinner uses foundation tokens. */
export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="state-panel loading-state-panel" role="status" aria-live="polite">
      <Spinner size="sm" />
      {label}
    </div>
  );
}
