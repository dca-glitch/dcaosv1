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
      <button className="secondary-action" disabled={saving} onClick={onCancel} type="button">
        Cancel
      </button>
      <button className="primary-action" disabled={disabled} type="submit">
        {saving ? "Saving" : label}
      </button>
    </div>
  );
}
