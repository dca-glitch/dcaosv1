import { Spinner } from "../design-system";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="state-panel loading-state-panel" role="status">
      <Spinner size="sm" />
      {label}
    </div>
  );
}
