import React, {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

/* ─── shared label row ─── */
const FieldLabel: React.FC<{ label?: string; required?: boolean; htmlFor?: string }> = ({
  label,
  required,
  htmlFor,
}) =>
  label ? (
    <label
      htmlFor={htmlFor}
      className="block text-body-xs font-semibold text-text-secondary mb-1.5"
    >
      {label}
      {required && <span className="text-danger-text ml-1">*</span>}
    </label>
  ) : null;

const FieldError: React.FC<{ error?: string }> = ({ error }) =>
  error ? (
    <p className="mt-1.5 text-caption font-semibold text-danger-text">{error}</p>
  ) : null;

const FieldHelper: React.FC<{ helperText?: string; error?: string }> = ({
  helperText,
  error,
}) =>
  helperText && !error ? (
    <p className="mt-1.5 text-caption text-text-muted">{helperText}</p>
  ) : null;

/* ─────────────────────── INPUT ─────────────────────── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  error?:      string;
  helperText?: string;
  icon?:       ReactNode;
  iconRight?:  ReactNode;
  fullWidth?:  boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconRight,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <FieldLabel label={label} required={props.required} htmlFor={inputId} />
        <div className="relative">
          {icon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-md bg-card border px-3 py-2',
              'text-body-sm text-text-primary placeholder:text-text-disabled',
              'transition-all duration-[120ms]',
              'focus:outline-none focus:shadow-focus',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon      ? 'pl-9'  : '',
              iconRight ? 'pr-9'  : '',
              hasError
                ? 'border-border-danger focus:border-danger-text'
                : 'border-border focus:border-primary-text',
              className,
            ].join(' ')}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {iconRight && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none"
              aria-hidden="true"
            >
              {iconRight}
            </span>
          )}
        </div>
        <FieldError error={error} />
        <FieldHelper helperText={helperText} error={error} />
      </div>
    );
  },
);
Input.displayName = 'Input';

/* ─────────────────────── TEXTAREA ─────────────────────── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string;
  error?:      string;
  helperText?: string;
  fullWidth?:  boolean;
  minRows?:    number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      minRows   = 4,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId   = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError  = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <FieldLabel label={label} required={props.required} htmlFor={inputId} />
        <textarea
          ref={ref}
          id={inputId}
          rows={minRows}
          className={[
            'w-full rounded-md bg-card border px-3 py-2.5',
            'text-body-sm text-text-primary placeholder:text-text-disabled',
            'transition-all duration-[120ms] resize-y',
            'focus:outline-none focus:shadow-focus',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-border-danger focus:border-danger-text'
              : 'border-border focus:border-primary-text',
            className,
          ].join(' ')}
          aria-invalid={hasError}
          {...props}
        />
        <FieldError error={error} />
        <FieldHelper helperText={helperText} error={error} />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

/* ─────────────────────── SELECT ─────────────────────── */
export interface SelectOption {
  value:     string | number;
  label:     string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:      string;
  options:     SelectOption[];
  placeholder?: string;
  error?:      string;
  helperText?: string;
  icon?:       ReactNode;
  fullWidth?:  boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      icon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId  = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <FieldLabel label={label} required={props.required} htmlFor={inputId} />
        <div className="relative">
          {icon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-md bg-card border pr-8 py-2',
              'text-body-sm text-text-primary',
              'transition-all duration-[120ms] appearance-none cursor-pointer',
              'focus:outline-none focus:shadow-focus',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-9' : 'pl-3',
              hasError
                ? 'border-border-danger focus:border-danger-text'
                : 'border-border focus:border-primary-text',
              className,
            ].join(' ')}
            aria-invalid={hasError}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <FieldError error={error} />
        <FieldHelper helperText={helperText} error={error} />
      </div>
    );
  },
);
Select.displayName = 'Select';

/* ─────────────────────── CHECKBOX ─────────────────────── */
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  helperText?: string;
  error?:      string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={className}>
        <div className="flex items-center gap-2.5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="w-4 h-4 rounded-sm border border-border bg-card cursor-pointer accent-primary-text focus:outline-none focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
            {...props}
          />
          {label && (
            <label htmlFor={inputId} className="text-body-sm text-text-secondary font-medium cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error      && <p className="mt-1 ml-6 text-caption text-danger-text font-semibold">{error}</p>}
        {helperText && !error && <p className="mt-1 ml-6 text-caption text-text-muted">{helperText}</p>}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

/* ─────────────────────── RADIO GROUP ─────────────────────── */
interface RadioOption { value: string; label: string; disabled?: boolean }

interface RadioGroupProps {
  name:        string;
  label?:      string;
  options:     RadioOption[];
  value?:      string;
  onChange?:   (value: string) => void;
  helperText?: string;
  error?:      string;
  className?:  string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  helperText,
  error,
  className = '',
}) => (
  <div className={className}>
    {label && (
      <p className="text-body-xs font-semibold text-text-secondary mb-3">{label}</p>
    )}
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-2.5">
          <input
            type="radio"
            id={`${name}-${opt.value}`}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={opt.disabled}
            className="w-4 h-4 rounded-full border border-border bg-card cursor-pointer accent-primary-text focus:outline-none focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label
            htmlFor={`${name}-${opt.value}`}
            className="text-body-sm text-text-secondary font-medium cursor-pointer"
          >
            {opt.label}
          </label>
        </div>
      ))}
    </div>
    {error      && <p className="mt-2 text-caption text-danger-text font-semibold">{error}</p>}
    {helperText && !error && <p className="mt-2 text-caption text-text-muted">{helperText}</p>}
  </div>
);
