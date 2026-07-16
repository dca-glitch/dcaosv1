import React, { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export type TableDensity = 'admin' | 'client' | 'compact' | 'comfortable';

const densityPad: Record<TableDensity, { th: string; td: string }> = {
  admin:       { th: 'px-4 py-2.5', td: 'px-4 py-2.5' },
  compact:     { th: 'px-4 py-2.5', td: 'px-4 py-2.5' },
  client:      { th: 'px-4 py-3', td: 'px-4 py-3' },
  comfortable: { th: 'px-4 py-3', td: 'px-4 py-3' },
};

const DensityContext = React.createContext<TableDensity>('comfortable');

/* ─────────────────────── TABLE WRAPPER ─────────────────────── */
interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  density?: TableDensity;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  density = 'comfortable',
  'aria-label': ariaLabel,
  ...props
}) => (
  <DensityContext.Provider value={density}>
    <div
      className={`overflow-x-auto rounded-none border border-border ${className}`}
      data-density={density}
      role={ariaLabel ? 'region' : undefined}
      tabIndex={ariaLabel ? 0 : undefined}
      aria-label={ariaLabel ? `${ariaLabel} (scrollable)` : undefined}
      style={{ background: 'var(--ds-surface-panel)' }}
      {...props}
    >
      <table
        className="w-full border-collapse text-[14px]"
        style={{ tableLayout: 'fixed' }}
        aria-label={ariaLabel}
      >
        {children}
      </table>
    </div>
  </DensityContext.Provider>
);

/* ─────────────────────── TABLE HEAD ─────────────────────── */
export const TableHead: React.FC<{ children: ReactNode }> = ({ children }) => (
  <thead
    className="sticky top-0 z-[var(--ds-z-sticky)] border-b"
    style={{
      background: 'var(--ds-surface-inset)',
      borderColor: 'var(--ds-divider)',
    }}
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
      'group border-b last:border-0',
      'transition-colors duration-[120ms]',
      clickable ? 'cursor-pointer' : '',
      selected ? 'bg-primary-soft' : 'hover:bg-[var(--ds-surface-hover)]',
      className,
    ].join(' ')}
    style={{ borderColor: 'var(--ds-divider)' }}
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
}) => {
  const density = React.useContext(DensityContext);
  const pad = densityPad[density].th;

  return (
    <th
      className={[
        pad,
        'text-[13px] font-semibold tracking-wide text-text-muted',
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
};

interface TableDataCellProps extends TdHTMLAttributes<HTMLTableDataCellElement> {
  children:   ReactNode;
  align?:     'left' | 'center' | 'right';
  mono?:      boolean;
  muted?:     boolean;
  secondary?: boolean;
  /** Row action cell — hidden until row hover (SPEC §4.5). */
  actions?:   boolean;
}

export const Td: React.FC<TableDataCellProps> = ({
  children,
  align     = 'left',
  mono      = false,
  muted     = false,
  secondary = false,
  actions   = false,
  className = '',
  ...props
}) => {
  const density = React.useContext(DensityContext);
  const pad = densityPad[density].td;

  return (
    <td
      className={[
        pad,
        'align-middle',
        `text-${align}`,
        mono      ? 'font-mono text-[12px] text-text-muted' : '',
        muted     ? 'text-[12px] text-text-muted' : '',
        secondary ? 'text-[12px] text-text-secondary' : '',
        !mono && !muted && !secondary ? 'text-[12px] font-medium text-text-primary' : '',
        actions ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-[120ms] [@media(hover:none)]:opacity-100' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </td>
  );
};

/* ─── Convenience: two-line cell (primary + secondary row) ─── */
export const TdDouble: React.FC<{
  primary:   ReactNode;
  secondary: ReactNode;
  className?: string;
}> = ({ primary, secondary, className = '' }) => {
  const density = React.useContext(DensityContext);
  const pad = densityPad[density].td;

  return (
    <td className={`${pad} align-middle ${className}`}>
      <div className="text-[12px] text-text-primary font-medium leading-tight">{primary}</div>
      <div className="text-[12px] text-text-muted mt-0.5 leading-tight">{secondary}</div>
    </td>
  );
};

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
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle">
      <span className="text-caption text-text-muted font-mono" aria-live="polite">
        {start}–{end} of {total}. Page {page}.
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
          className="min-w-11 min-h-11 px-2 py-1 text-body-xs text-text-muted border border-border rounded hover:border-border-strong hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        <span className="px-2 text-caption text-text-muted font-mono" aria-hidden="true">
          {page}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
          className="min-w-11 min-h-11 px-2 py-1 text-body-xs text-text-muted border border-border rounded hover:border-border-strong hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────── TIMELINE ITEM ─────────────────────── */
export const TimelineItem: React.FC<{
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  status?: string;
  isLast?: boolean;
  className?: string;
}> = ({ title, meta, children, status, isLast = false, className = '' }) => (
  <div className={`relative flex gap-3 ${className}`} data-status={status}>
    <div className="flex flex-col items-center flex-shrink-0">
      <span
        className="ds-status-dot mt-1.5"
        style={{
          background: status
            ? `var(--status-${status.replace(/_/g, '-')}-text, var(--ds-accent-indigo))`
            : 'var(--ds-accent-indigo)',
        }}
        aria-hidden="true"
      />
      {!isLast && (
        <span
          className="w-px flex-1 mt-1"
          style={{ background: 'var(--ds-divider)', minHeight: 16 }}
          aria-hidden="true"
        />
      )}
    </div>
    <div className="flex-1 min-w-0 pb-4">
      <div className="text-[12px] font-medium text-text-primary">{title}</div>
      {meta && (
        <div className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--ds-text-faint)' }}>
          {meta}
        </div>
      )}
      {children && <div className="mt-1.5 text-[12px] text-text-secondary">{children}</div>}
    </div>
  </div>
);

/* ─────────────────────── ACTIVITY ITEM ─────────────────────── */
export const ActivityItem: React.FC<{
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  actor?: ReactNode;
  status?: string;
  className?: string;
}> = ({ title, description, timestamp, actor, status, className = '' }) => (
  <div
    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-[120ms] hover:bg-[var(--ds-surface-hover)] ${className}`}
    data-status={status}
  >
    <span
      className="ds-status-dot mt-1.5 flex-shrink-0"
      style={{
        background: status
          ? `var(--status-${status.replace(/_/g, '-')}-text, var(--ds-accent-indigo))`
          : 'var(--ds-accent-indigo)',
      }}
      aria-hidden="true"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-text-primary truncate">{title}</span>
        {timestamp && (
          <span className="text-[12px] font-mono flex-shrink-0" style={{ color: 'var(--ds-text-faint)' }}>
            {timestamp}
          </span>
        )}
      </div>
      {actor && <div className="text-[12px] text-text-muted mt-0.5">{actor}</div>}
      {description && <div className="text-[12px] text-text-secondary mt-1">{description}</div>}
    </div>
  </div>
);
