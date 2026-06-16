type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="state-panel loading-state-panel" role="status">
      <span className="loading-pulse" aria-hidden="true" />
      {label}
    </div>
  );
}
