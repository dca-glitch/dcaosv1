import React from 'react';

/* ─── Spinner ─── */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
const sizePx    = { sm: 16, md: 24, lg: 32 };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <svg
    width={sizePx[size]}
    height={sizePx[size]}
    className={`animate-spin text-primary-text ${sizeClass[size]} ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

/* ─── Skeleton ─── */
interface SkeletonProps {
  width?:    string;
  height?:   string;
  rounded?:  boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width   = '100%',
  height  = '14px',
  rounded = false,
  className = '',
}) => (
  <div
    className={`animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{
      width,
      height,
      background: 'rgba(51,65,85,0.25)',
    }}
    aria-hidden="true"
  />
);

/* ─── Skeleton Table Row ─── */
export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr className="border-b border-border-subtle">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <Skeleton height="12px" width={i === 0 ? '80%' : i === cols - 1 ? '60%' : '70%'} />
      </td>
    ))}
  </tr>
);

/* ─── Skeleton Card ─── */
export const SkeletonCard: React.FC = () => (
  <div className="card space-y-3">
    <Skeleton height="12px" width="40%" />
    <Skeleton height="24px" width="60%" />
    <Skeleton height="10px" width="80%" />
  </div>
);
