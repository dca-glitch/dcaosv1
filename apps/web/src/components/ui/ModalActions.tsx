import { Button } from "./Button";

type ModalActionsProps = {
  disabled: boolean;
  label?: string;
  onCancel: () => void;
  saving: boolean;
};

export function ModalActions({
  disabled,
  label = "Save",
  onCancel,
  saving
}: ModalActionsProps) {
  return (
    <div className="modal-footer">
      <Button variant="secondary" disabled={saving} onClick={onCancel} type="button">
        Cancel
      </Button>
      <Button variant="primary" disabled={disabled} type="submit">
        {saving ? "Saving" : label}
      </Button>
    </div>
  );
}
