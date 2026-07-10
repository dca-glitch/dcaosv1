import React, { ReactNode } from 'react';

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant?:   AlertVariant;
  title?:     string;
  message:    ReactNode;
  onClose?:   () => void;
  action?:    { label: string; onClick: () => void };
  className?: string;
}

/** Spec §4.9 / §5 — semantic feedback colors via CSS vars (no sonner). */
const alertConfig: Record<AlertVariant, {
  accent: string;
  bg: string;
  icon: string;
}> = {
  success: {
    accent: 'var(--ds-accent-sage)',
    bg: 'rgba(76, 175, 133, 0.10)',
    icon: '✓',
  },
  warning: {
    accent: 'var(--ds-accent-amber)',
    bg: 'rgba(201, 138, 66, 0.10)',
    icon: '!',
  },
  danger: {
    accent: 'var(--ds-accent-coral)',
    bg: 'rgba(224, 112, 112, 0.10)',
    icon: '✕',
  },
  info: {
    accent: 'var(--ds-accent-indigo)',
    bg: 'var(--ds-primary-soft-bg)',
    icon: 'i',
  },
};

const Alert: React.FC<AlertProps> = ({
  variant   = 'info',
  title,
  message,
  onClose,
  action,
  className = '',
}) => {
  const cfg = alertConfig[variant];

  return (
    <div
      className={['flex gap-3 p-3.5 rounded-lg', className].join(' ')}
      role="alert"
      style={{
        background: cfg.bg,
        border: '1px solid var(--ds-border)',
        borderLeft: `4px solid ${cfg.accent}`,
      }}
    >
      <span
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-caption font-semibold"
        style={{ color: cfg.accent, border: `1px solid ${cfg.accent}` }}
        aria-hidden="true"
      >
        {cfg.icon}
      </span>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-body-xs font-semibold" style={{ color: cfg.accent }}>{title}</p>
        )}
        <div className={`text-body-xs mt-0.5 ${title ? 'text-text-secondary' : ''}`} style={title ? undefined : { color: cfg.accent }}>
          {message}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-body-xs font-semibold underline hover:opacity-80 transition-opacity duration-[120ms]"
            style={{ color: cfg.accent }}
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-[120ms]"
          style={{ color: cfg.accent }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;

/* ─── Toast (lightweight inline feedback — no sonner) ─── */
interface ToastProps {
  variant?: AlertVariant;
  message:  ReactNode;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'success',
  message,
  onClose,
}) => {
  const cfg = alertConfig[variant];

  return (
    <div
      className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-body-xs font-medium"
      role="status"
      style={{
        background: cfg.bg,
        border: '1px solid var(--ds-border-strong)',
        color: cfg.accent,
        boxShadow: 'var(--ds-shadow-overlay)',
      }}
    >
      <span className="flex-shrink-0 font-semibold" aria-hidden="true">{cfg.icon}</span>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-1 opacity-70 hover:opacity-100 transition-opacity duration-[120ms]"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/** Inline success / confirmed confirmation (SPEC §5). */
export const SuccessState: React.FC<{
  title?: string;
  message: ReactNode;
  className?: string;
}> = ({ title = 'Confirmed', message, className = '' }) => (
  <Alert variant="success" title={title} message={message} className={className} />
);
