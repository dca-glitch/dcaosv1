export type SortDirection = "asc" | "desc";

export type SortFieldOption = {
  value: string;
  label: string;
};

export type SortControlsProps = {
  fields: SortFieldOption[];
  field: string;
  direction: SortDirection;
  onFieldChange: (field: string) => void;
  onDirectionChange: (direction: SortDirection) => void;
  fieldLabel?: string;
  directionLabel?: string;
  className?: string;
};

/** Simple sort field + direction controls. */
export function SortControls({
  fields,
  field,
  direction,
  onFieldChange,
  onDirectionChange,
  fieldLabel = "Sort by",
  directionLabel = "Direction",
  className,
}: SortControlsProps) {
  const fieldId = "op-sort-field";
  const directionId = "op-sort-direction";

  return (
    <div
      aria-label="Sort controls"
      className={["op-sort-controls", className].filter(Boolean).join(" ")}
      role="group"
    >
      <div className="op-sort-controls-field">
        <label className="op-sort-controls-label" htmlFor={fieldId}>
          {fieldLabel}
        </label>
        <select
          className="op-sort-controls-select"
          id={fieldId}
          onChange={(event) => onFieldChange(event.target.value)}
          value={field}
        >
          {fields.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="op-sort-controls-direction">
        <label className="op-sort-controls-label" htmlFor={directionId}>
          {directionLabel}
        </label>
        <select
          className="op-sort-controls-select"
          id={directionId}
          onChange={(event) => onDirectionChange(event.target.value as SortDirection)}
          value={direction}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}
