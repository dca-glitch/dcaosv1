import React, { HTMLAttributes, ReactNode } from 'react';
import { panelCSS } from '../panel';

/* ─────────────────────── CARD ─────────────────────── */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children:  ReactNode;
  variant?:  'default' | 'elevated' | 'client';
  hoverable?: boolean;
  urgentBorderColor?: string;
  /** Optional accent hex for panelCSS tint (action-required panels). */
  tint?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant    = 'default',
      hoverable  = false,
      urgentBorderColor,
      tint,
      className  = '',
      style,
      ...props
    },
    ref,
  ) => {
    const variantClass: Record<string, string> = {
      default:  'card',
      elevated: 'card-elevated',
      client:   'card-client',
    };

    const raised = variant === 'elevated' || variant === 'client';
    const panelStyle = panelCSS(tint, raised);

    return (
      <div
        ref={ref}
        className={[
          variantClass[variant],
          hoverable
            ? 'hover:border-border-accent transition-colors duration-[120ms] cursor-pointer'
            : '',
          urgentBorderColor ? 'rounded-r-lg' : '',
          className,
        ].join(' ')}
        style={{
          ...panelStyle,
          borderRadius: 'var(--ds-radius-lg)',
          padding: variant === 'client' ? 'var(--ds-card-padding-client)' : 'var(--ds-card-padding-admin)',
          ...(urgentBorderColor
            ? {
                borderLeft:   `2px solid ${urgentBorderColor}`,
                borderRadius: '0 8px 8px 0',
              }
            : {}),
          ...(style ?? {}),
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

/* ─── Card sub-components ─── */
interface CardHeaderProps {
  title:      string;
  subtitle?:  string;
  action?:    ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div
    className={`flex items-start justify-between pb-3 mb-3 border-b border-border-subtle ${className}`}
  >
    <div className="flex-1 min-w-0">
      <h3 className="text-title-sm text-text-primary truncate">{title}</h3>
      {subtitle && (
        <p className="text-body-xs text-text-muted mt-0.5">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0 ml-4">{action}</div>}
  </div>
);

interface CardFooterProps {
  children:  ReactNode;
  justify?:  'start' | 'end' | 'between' | 'center';
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  justify    = 'end',
  className  = '',
}) => {
  const justifyClass = {
    start:   'justify-start',
    end:     'justify-end',
    between: 'justify-between',
    center:  'justify-center',
  }[justify];

  return (
    <div
      className={`flex items-center gap-2 pt-3 mt-3 border-t border-border-subtle ${justifyClass} ${className}`}
    >
      {children}
    </div>
  );
};

/* ─────────────────────── METRIC CARD (KPI) — numeric variant ─────────────────────── */
/* RingMeter deferred to Phase 3 (Agency Operations). */
interface MetricCardProps {
  label:      string;
  value:      string | number;
  valueColor?: 'default' | 'warning' | 'success' | 'danger' | 'primary';
  trend?:     { value: string; direction: 'up' | 'down' | 'neutral' };
  suffix?:    string;
  helper?:    string;
  mono?:      boolean;
  alert?:     boolean;
  className?: string;
  tint?:      string;
}

const valueColorClass: Record<string, string> = {
  default: 'text-text-primary',
  warning: 'text-warning-text',
  success: 'text-success-text',
  danger:  'text-danger-text',
  primary: 'text-primary-text',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  valueColor = 'default',
  trend,
  suffix,
  helper,
  mono       = true,
  alert      = false,
  className  = '',
  tint,
}) => (
  <div
    className={`card-elevated ${className}`}
    style={{
      ...panelCSS(tint, true),
      borderRadius: 'var(--ds-radius-lg)',
      padding: 'var(--ds-card-padding-admin)',
    }}
  >
    <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
      {label}
    </p>
    <div className="flex items-baseline gap-1 mt-2">
      <span
        className={[
          'text-[26px] font-semibold leading-none',
          alert ? 'text-danger-text' : valueColorClass[valueColor],
          mono ? 'font-mono' : '',
        ].join(' ')}
      >
        {value}
      </span>
      {suffix && (
        <span className="text-body-xs text-text-muted font-mono">{suffix}</span>
      )}
    </div>
    {(helper || trend) && (
      <p
        className={[
          'text-[11px] mt-1.5',
          trend?.direction === 'up'      ? 'text-success-text' :
          trend?.direction === 'down'    ? 'text-danger-text'  :
          'text-text-muted',
        ].join(' ')}
      >
        {trend
          ? `${trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} ${trend.value}`
          : helper}
      </p>
    )}
  </div>
);

/* ─────────────────────── PAGE HEADER ─────────────────────── */
interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  action?:     ReactNode;
  breadcrumb?: string;
  className?:  string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumb,
  className = '',
}) => (
  <div className={`flex items-start justify-between mb-6 ${className}`}>
    <div>
      {breadcrumb && (
        <p className="text-caption font-mono text-text-muted mb-1 uppercase tracking-wider">
          {breadcrumb}
        </p>
      )}
      <h1 className="text-title-lg font-semibold text-text-primary">{title}</h1>
      {subtitle && (
        <p className="text-body-sm text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0 ml-4 flex items-center gap-2">{action}</div>}
  </div>
);

/* ─────────────────────── SECTION LABEL ─────────────────────── */
interface SectionLabelProps {
  children:   ReactNode;
  action?:    ReactNode;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  action,
  className = '',
}) => (
  <div className={`flex items-center justify-between mb-2 ${className}`}>
    <span className="section-label flex-1">{children}</span>
    {action && <div className="flex-shrink-0 ml-3 flex items-center gap-2">{action}</div>}
  </div>
);

/* ─────────────────────── DIVIDER ─────────────────────── */
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-0 border-t border-border-subtle ${className}`} />
);

/* ─────────────────────── EMPTY STATE ─────────────────────── */
interface EmptyStateProps {
  icon?:       ReactNode;
  title:       string;
  description?: string;
  action?:     ReactNode;
  className?:  string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
  >
    {icon && (
      <div className="text-text-disabled mb-4 text-4xl" aria-hidden="true">
        {icon}
      </div>
    )}
    <h3 className="text-title-sm text-text-secondary font-semibold mb-1">{title}</h3>
    {description && (
      <p className="text-body-sm text-text-muted max-w-xs">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
