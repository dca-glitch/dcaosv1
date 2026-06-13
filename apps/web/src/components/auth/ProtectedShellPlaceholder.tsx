type ProtectedShellPlaceholderProps = {
  title?: string;
  message?: string;
};

export function ProtectedShellPlaceholder({
  title = "Protected shell placeholder",
  message = "Placeholder"
}: ProtectedShellPlaceholderProps) {
  return (
    <section className="state-panel" aria-hidden="true">
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  );
}
