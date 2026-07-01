import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  fullWidth?: boolean;
  loading?:  boolean;
  icon?:     ReactNode;
  iconRight?: ReactNode;
  children:  ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = 'primary',
      size     = 'md',
      fullWidth = false,
      loading  = false,
      disabled = false,
      icon,
      iconRight,
      className = '',
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md font-semibold border ' +
      'transition-all duration-[120ms] ' +
      'focus:outline-none focus-visible:shadow-focus ' +
      'disabled:opacity-50 disabled:cursor-not-allowed ' +
      'select-none';

    const variants: Record<ButtonVariant, { className: string; style?: React.CSSProperties }> = {
      primary: {
        className: 'text-text-primary border-border-accent hover:brightness-110 active:brightness-95',
        style:     { background: 'var(--primary-btn-gradient)' },
      },
      secondary: {
        className:
          'bg-transparent border-border text-text-secondary ' +
          'hover:border-border-strong hover:text-text-primary active:opacity-80',
      },
      ghost: {
        className:
          'bg-transparent border-transparent text-text-muted ' +
          'hover:text-text-secondary hover:bg-card active:opacity-80',
      },
      danger: {
        className:
          'bg-danger-soft border-border-danger text-danger-text ' +
          'hover:border-danger hover:text-danger hover:brightness-110 active:opacity-80',
      },
      success: {
        className:
          'bg-success-soft border-border-success text-success-text ' +
          'hover:border-success hover:brightness-110 active:opacity-80',
      },
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-body-xs',
      md: 'px-4 py-2   text-body-xs',
      lg: 'px-5 py-2.5 text-body-sm',
    };

    const v = variants[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[base, v.className, sizes[size], fullWidth ? 'w-full' : '', className].join(' ')}
        style={{ ...(v.style ?? {}), ...(style ?? {}) }}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
        ) : (
          <>
            {icon && <span className="flex-shrink-0 flex items-center" aria-hidden="true">{icon}</span>}
            <span>{children}</span>
            {iconRight && <span className="flex-shrink-0 flex items-center" aria-hidden="true">{iconRight}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
