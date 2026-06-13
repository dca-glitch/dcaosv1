type PermissionGatePlaceholderProps = {
  label?: string;
};

export function PermissionGatePlaceholder({
  label = "Permission placeholder"
}: PermissionGatePlaceholderProps) {
  return (
    <div className="state-panel" aria-hidden="true">
      {label}
    </div>
  );
}
