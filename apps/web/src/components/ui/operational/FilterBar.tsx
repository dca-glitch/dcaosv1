import {
  FilterPills,
  type FilterPillOption,
  type FilterPillsProps,
} from "../../../design-system";

export type { FilterPillOption, FilterPillsProps };

export type FilterBarProps = FilterPillsProps & {
  /** Extra class on the product layout wrapper. */
  className?: string;
};

/**
 * Product wrapper around design-system FilterPills.
 * Preserve accessible names via `ariaLabel` (e.g. "Projects filter").
 */
export function FilterBar({ className, ...props }: FilterBarProps) {
  return (
    <div className={["op-filter-bar", "filter-bar", className].filter(Boolean).join(" ")}>
      <FilterPills {...props} />
    </div>
  );
}

/** Alias for active/removable filter pill groups — same FilterPills contract. */
export function ActiveFilterPills(props: FilterPillsProps) {
  return <FilterPills {...props} />;
}
