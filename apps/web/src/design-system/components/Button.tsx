import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'titanium';
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
    // Spec §4.1 visual 8px radius maps to token --ds-radius-md (Tailwind rounded-md)
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md font-semibold border ' +
      'transition-[opacity,background,border-color,box-shadow,filter] duration-[120ms] ease-out ' +
      'focus:outline-none focus-visible:shadow-focus ' +
      'disabled:opacity-40 disabled:cursor-not-allowed ' +
      'select-none';

    const variants: Record<ButtonVariant, { className: string; style?: React.CSSProperties }> = {
      primary: {
        className: 'text-white border-transparent hover:brightness-110 active:brightness-95',
        style: {
          background: 'var(--ds-primary-btn-gradient)',
          boxShadow: 'var(--ds-shadow-glow)',
        },
      },
      secondary: {
        className: 'border-border text-text-secondary hover:opacity-80 active:opacity-70',
        style: {
          background: 'var(--ds-surface-panel)',
        },
      },
      ghost: {
        className:
          'bg-transparent border-transparent text-text-muted ' +
          'hover:opacity-80 hover:text-text-secondary active:opacity-70',
      },
      danger: {
        className: 'hover:opacity-80 active:opacity-70',
        style: {
          background: 'var(--ds-btn-destructive-bg)',
          borderColor: 'var(--ds-btn-destructive-border)',
          color: 'var(--ds-accent-coral)',
        },
      },
      success: {
        className: 'hover:opacity-80 active:opacity-70',
        style: {
          background: 'var(--ds-btn-success-bg)',
          borderColor: 'var(--ds-btn-success-border)',
          color: 'var(--ds-accent-sage)',
        },
      },
      titanium: {
        className: 'hover:opacity-90 active:opacity-80',
        style: {
          background: 'var(--ds-btn-titanium-gradient)',
          borderColor: 'var(--ds-btn-titanium-border)',
          color: 'var(--ds-btn-titanium-text)',
        },
      },
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-[11px]',
      md: 'px-4 py-2   text-[11px]',
      lg: 'px-5 py-2.5 text-[12px]',
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
