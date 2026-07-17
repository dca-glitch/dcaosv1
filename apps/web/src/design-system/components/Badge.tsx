import React, { ReactNode } from 'react';
import {
  STATUS,
  formatStatusLabel,
  getClientStatusLabel,
  getStatusVisual,
  normalizeStatusKey,
  statusBadgeStyle,
  toneToStatusKey,
  getStatusTone,
} from '../status';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  variant?:   BadgeVariant;
  dot?:       boolean;
  icon?:      ReactNode;
  children:   ReactNode;
  className?: string;
  style?:     React.CSSProperties;
}

const variantClass: Record<BadgeVariant, string> = {
  primary: 'ds-badge-primary',
  success: 'ds-badge-success',
  warning: 'ds-badge-warning',
  danger:  'ds-badge-danger',
  muted:   'ds-badge-muted',
};

const Badge: React.FC<BadgeProps> = ({
  variant   = 'muted',
  dot       = true,
  icon,
  children,
  className = '',
  style,
}) => (
  <span
    className={`ds-badge ${variantClass[variant]} ${className}`}
    style={{ fontSize: '12px', textTransform: 'none', ...style }}
  >
    {icon && !dot && (
      <span className="flex-shrink-0 flex items-center" aria-hidden="true">{icon}</span>
    )}
    {dot && !icon && <span className="ds-badge-dot" aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;

/** Spec §4.2 status pill — colors from STATUS / CSS vars only. */
export const StatusBadge: React.FC<{
  status: string;
  displayLabel?: string;
  className?: string;
}> = ({
  status,
  displayLabel,
  className = '',
}) => {
  const visual = getStatusVisual(status) ?? STATUS[toneToStatusKey(getStatusTone(status))];
  const key = normalizeStatusKey(status);
  const label = displayLabel ?? (key ? STATUS[key].label : formatStatusLabel(status));

  return (
    <span
      className={`ds-badge ds-status-badge ${className}`.trim()}
      data-status={key ?? 'unknown'}
      style={{ ...statusBadgeStyle(visual), fontSize: '12px', textTransform: 'none' }}
    >
      <span className="ds-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
};

/** Client-facing status pill (SPEC §3.2). Returns null when status must be hidden. */
export const ClientStatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className = '',
}) => {
  const key = normalizeStatusKey(status);
  if (!key) {
    return (
      <StatusBadge status={status} className={className} />
    );
  }

  const clientLabel = getClientStatusLabel(key);
  if (clientLabel == null) return null;

  const visual = STATUS[key];
  return (
    <span
      className={`ds-badge ds-status-badge ${className}`.trim()}
      data-status={key}
      data-surface="client"
      style={{ ...statusBadgeStyle(visual), fontSize: '12px', textTransform: 'none' }}
    >
      <span className="ds-badge-dot" aria-hidden="true" />
      {clientLabel}
    </span>
  );
};

/** Compact status indicator (priority / pipeline dots). */
export const StatusDot: React.FC<{
  status: string;
  className?: string;
  title?: string;
}> = ({ status, className = '', title }) => {
  const visual = getStatusVisual(status) ?? STATUS[toneToStatusKey(getStatusTone(status))];
  const key = normalizeStatusKey(status);
  const label = title ?? (key ? STATUS[key].label : formatStatusLabel(status));

  return (
    <span
      className={`ds-status-dot ${className}`.trim()}
      data-status={key ?? undefined}
      title={label}
      aria-label={label}
      style={{
        background: visual.text,
        boxShadow: `0 0 0 1px ${visual.border}`,
      }}
    />
  );
};
