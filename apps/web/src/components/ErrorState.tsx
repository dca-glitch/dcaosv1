type ErrorStateProps = {
  title: string;
  message: string;
};

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="state-panel state-panel-error">
      <span className="state-orb state-orb-error" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
