type TenantSwitcherPlaceholderProps = {
  label?: string;
};

export function TenantSwitcherPlaceholder({
  label = "Tenant placeholder"
}: TenantSwitcherPlaceholderProps) {
  return (
    <div className="state-panel" aria-hidden="true">
      {label}
    </div>
  );
}
