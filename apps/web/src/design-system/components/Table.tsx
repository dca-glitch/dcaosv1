import React, { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/* ─────────────────────── TABLE WRAPPER ─────────────────────── */
interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => (
  <div
    className={`overflow-x-auto rounded-lg border border-border ${className}`}
    style={{ background: 'var(--surface-card)' }}
    {...props}
  >
    <table className="w-full border-collapse text-body-xs" style={{ tableLayout: 'fixed' }}>
      {children}
    </table>
  </div>
);

/* ─────────────────────── TABLE HEAD ─────────────────────── */
export const TableHead: React.FC<{ children: ReactNode }> = ({ children }) => (
  <thead
    className="border-b border-border"
    style={{ background: 'var(--surface-overlay)' }}
  >
    {children}
  </thead>
);

/* ─────────────────────── TABLE BODY ─────────────────────── */
export const TableBody: React.FC<{ children: ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
);

/* ─────────────────────── TABLE ROW ─────────────────────── */
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children:  ReactNode;
  clickable?: boolean;
  selected?:  boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  clickable  = false,
  selected   = false,
  className  = '',
  ...props
}) => (
  <tr
    className={[
      'border-b border-border-subtle last:border-0',
      'transition-colors duration-[80ms]',
      clickable ? 'cursor-pointer' : '',
      selected
        ? 'bg-primary-soft border-l-2 border-l-primary-text'
        : 'hover:bg-elevated/40',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </tr>
);

/* ─────────────────────── TABLE CELL (th/td) ─────────────────────── */
interface TableHeadCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children:  ReactNode;
  align?:    'left' | 'center' | 'right';
  sortable?: boolean;
  sorted?:   'asc' | 'desc' | null;
  onSort?:   () => void;
}

export const Th: React.FC<TableHeadCellProps> = ({
  children,
  align    = 'left',
  sortable = false,
  sorted   = null,
  onSort,
  className = '',
  ...props
}) => (
  <th
    className={[
      'px-3 py-2',
      'text-caption font-semibold uppercase tracking-wider text-text-muted',
      `text-${align}`,
      sortable ? 'cursor-pointer hover:text-text-secondary transition-colors' : '',
      className,
    ].join(' ')}
    onClick={sortable ? onSort : undefined}
    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
    {...props}
  >
    {sortable ? (
      <span className="inline-flex items-center gap-1">
        {children}
        <span className="text-text-disabled" aria-hidden="true">
          {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
        </span>
      </span>
    ) : (
      children
    )}
  </th>
);

interface TableDataCellProps extends TdHTMLAttributes<HTMLTableDataCellElement> {
  children:   ReactNode;
  align?:     'left' | 'center' | 'right';
  mono?:      boolean;
  muted?:     boolean;
  secondary?: boolean;
}

export const Td: React.FC<TableDataCellProps> = ({
  children,
  align     = 'left',
  mono      = false,
  muted     = false,
  secondary = false,
  className = '',
  ...props
}) => (
  <td
    className={[
      'px-3 py-2.5 align-middle',
      `text-${align}`,
      mono      ? 'font-mono text-body-xs text-text-muted'                  : '',
      muted     ? 'text-body-xs text-text-muted'                            : '',
      secondary ? 'text-body-xs text-text-secondary'                        : '',
      !mono && !muted && !secondary ? 'text-body-xs text-text-primary'      : '',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </td>
);

/* ─── Convenience: two-line cell (primary + secondary row) ─── */
export const TdDouble: React.FC<{
  primary:   ReactNode;
  secondary: ReactNode;
  className?: string;
}> = ({ primary, secondary, className = '' }) => (
  <td className={`px-3 py-2.5 align-middle ${className}`}>
    <div className="text-body-xs text-text-primary font-medium leading-tight">{primary}</div>
    <div className="text-caption text-text-muted mt-0.5 leading-tight">{secondary}</div>
  </td>
);

/* ─── Table pagination footer ─── */
interface TablePaginationProps {
  page:       number;
  total:      number;
  perPage:    number;
  onPrev:     () => void;
  onNext:     () => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  total,
  perPage,
  onPrev,
  onNext,
}) => {
  const start  = (page - 1) * perPage + 1;
  const end    = Math.min(page * perPage, total);
  const hasNext = end < total;
  const hasPrev = page > 1;

  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-border-subtle">
      <span className="text-caption text-text-muted font-mono">
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-2 py-1 text-body-xs text-text-muted border border-border rounded hover:border-border-strong hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        <span className="px-2 text-caption text-text-muted font-mono">{page}</span>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-2 py-1 text-body-xs text-text-muted border border-border rounded hover:border-border-strong hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
};
