import { TablePagination } from "../../../design-system";

export type TablePaginationBarProps = {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

/** Product wrapper around design-system TablePagination. */
export function TablePaginationBar({
  page,
  total,
  perPage,
  onPrev,
  onNext,
  className,
}: TablePaginationBarProps) {
  if (total <= 0) {
    return null;
  }

  return (
    <div className={["op-table-pagination-bar", className].filter(Boolean).join(" ")}>
      <TablePagination
        onNext={onNext}
        onPrev={onPrev}
        page={page}
        perPage={perPage}
        total={total}
      />
    </div>
  );
}
