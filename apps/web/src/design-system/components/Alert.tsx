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

const alertConfig: Record<AlertVariant, {
  border:   string;
  bg:       string;
  icon:     string;
  textColor: string;
}> = {
  success: {
    border:    'border-l-4 border-l-success',
    bg:        'bg-success-soft',
    icon:      '✓',
    textColor: 'text-success-text',
  },
  warning: {
    border:    'border-l-4 border-l-warning',
    bg:        'bg-warning-soft',
    icon:      '!',
    textColor: 'text-warning-text',
  },
  danger: {
    border:    'border-l-4 border-l-danger',
    bg:        'bg-danger-soft',
    icon:      '✕',
    textColor: 'text-danger-text',
  },
  info: {
    border:    'border-l-4 border-l-primary',
    bg:        'bg-primary-soft',
    icon:      'i',
    textColor: 'text-primary-text',
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
      className={[
        'flex gap-3 p-3.5 rounded-md border border-border-subtle',
        cfg.border,
        cfg.bg,
        className,
      ].join(' ')}
      role="alert"
    >
      <span
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-caption font-semibold border border-current ${cfg.textColor}`}
        aria-hidden="true"
      >
        {cfg.icon}
      </span>

      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-body-xs font-semibold ${cfg.textColor}`}>{title}</p>
        )}
        <div className={`text-body-xs mt-0.5 ${title ? 'text-text-secondary' : cfg.textColor}`}>
          {message}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-1.5 text-body-xs font-semibold underline ${cfg.textColor} hover:opacity-80 transition-opacity`}
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className={`flex-shrink-0 ${cfg.textColor} opacity-70 hover:opacity-100 transition-opacity`}
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

/* ─── Toast (lightweight inline feedback) ─── */
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
      className={[
        'inline-flex items-center gap-2.5 px-4 py-2.5',
        'rounded-md border border-border-strong',
        'text-body-xs font-medium',
        cfg.bg,
        cfg.textColor,
      ].join(' ')}
      role="status"
    >
      <span className="flex-shrink-0 font-semibold" aria-hidden="true">{cfg.icon}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
