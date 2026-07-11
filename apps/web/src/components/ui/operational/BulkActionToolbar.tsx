import { Button, type ButtonVariant } from "../Button";

export type BulkAction = {
  id: string;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
};

export type BulkActionToolbarProps = {
  selectionCount: number;
  actions: BulkAction[];
  onClear?: () => void;
  className?: string;
};

/** Shows when selectionCount > 0. Actions are caller-provided callbacks only. */
export function BulkActionToolbar({
  selectionCount,
  actions,
  onClear,
  className,
}: BulkActionToolbarProps) {
  if (selectionCount <= 0) {
    return null;
  }

  return (
    <div
      aria-label="Bulk actions"
      className={["op-bulk-toolbar", className].filter(Boolean).join(" ")}
      role="region"
    >
      <span className="op-bulk-toolbar-count">
        {selectionCount} selected
      </span>
      <div className="op-bulk-toolbar-actions">
        {actions.map((action) => (
          <Button
            disabled={action.disabled}
            key={action.id}
            onClick={action.onClick}
            size="sm"
            type="button"
            variant={action.variant ?? "secondary"}
          >
            {action.label}
          </Button>
        ))}
        {onClear ? (
          <Button onClick={onClear} size="sm" type="button" variant="tertiary">
            Clear selection
          </Button>
        ) : null}
      </div>
    </div>
  );
}
