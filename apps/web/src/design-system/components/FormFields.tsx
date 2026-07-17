import React, {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useId,
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

const FieldError: React.FC<{ error?: string; id?: string }> = ({ error, id }) =>
  error ? (
    <p id={id} className="mt-1.5 text-caption font-semibold text-danger-text" role="alert">
      {error}
    </p>
  ) : null;

const FieldHelper: React.FC<{ helperText?: string; error?: string; id?: string }> = ({
  helperText,
  error,
  id,
}) =>
  helperText && !error ? (
    <p id={id} className="mt-1.5 text-caption text-text-muted">
      {helperText}
    </p>
  ) : null;

function describedById(
  inputId: string | undefined,
  hasError: boolean,
  helperText?: string,
): string | undefined {
  if (!inputId) return undefined;
  if (hasError) return `${inputId}-error`;
  if (helperText) return `${inputId}-helper`;
  return undefined;
}

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
    const reactId = useId();
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : reactId);
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
              'w-full rounded-md bg-[var(--ds-surface-white)] border px-3 py-2',
              'text-body-sm text-text-primary placeholder:text-text-disabled',
              'transition-[border-color,box-shadow,opacity] duration-[120ms] ease-out',
              'focus:outline-none focus:shadow-focus',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              icon      ? 'pl-9'  : '',
              iconRight ? 'pr-9'  : '',
              hasError
                ? 'border-border-danger focus:border-danger-text'
                : 'border-border focus:border-[var(--ds-focus-ring-color)]',
              className,
            ].join(' ')}
            aria-invalid={hasError}
            aria-describedby={describedById(inputId, hasError, helperText)}
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
        <FieldError error={error} id={`${inputId}-error`} />
        <FieldHelper helperText={helperText} error={error} id={`${inputId}-helper`} />
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
    const reactId = useId();
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : reactId);
    const hasError  = !!error;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <FieldLabel label={label} required={props.required} htmlFor={inputId} />
        <textarea
          ref={ref}
          id={inputId}
          rows={minRows}
          className={[
            'w-full rounded-md bg-[var(--ds-surface-white)] border px-3 py-2.5',
            'text-body-sm text-text-primary placeholder:text-text-disabled',
            'transition-[border-color,box-shadow,opacity] duration-[120ms] ease-out resize-y',
            'focus:outline-none focus:shadow-focus',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            hasError
              ? 'border-border-danger focus:border-danger-text'
              : 'border-border focus:border-[var(--ds-focus-ring-color)]',
            className,
          ].join(' ')}
          aria-invalid={hasError}
          aria-describedby={describedById(inputId, hasError, helperText)}
          {...props}
        />
        <FieldError error={error} id={`${inputId}-error`} />
        <FieldHelper helperText={helperText} error={error} id={`${inputId}-helper`} />
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
    const reactId = useId();
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : reactId);
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
              'w-full rounded-md bg-[var(--ds-surface-white)] border pr-8 py-2',
              'text-body-sm text-text-primary',
              'transition-[border-color,box-shadow,opacity] duration-[120ms] ease-out appearance-none cursor-pointer',
              'focus:outline-none focus:shadow-focus',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              icon ? 'pl-9' : 'pl-3',
              hasError
                ? 'border-border-danger focus:border-danger-text'
                : 'border-border focus:border-[var(--ds-focus-ring-color)]',
              className,
            ].join(' ')}
            aria-invalid={hasError}
            aria-describedby={describedById(inputId, hasError, helperText)}
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
        <FieldError error={error} id={`${inputId}-error`} />
        <FieldHelper helperText={helperText} error={error} id={`${inputId}-helper`} />
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
    const reactId = useId();
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : reactId);
    const hasError = !!error;

    return (
      <div className={className}>
        <div className="flex items-center gap-2.5 min-h-11">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="w-4 h-4 rounded-sm border border-border bg-[var(--ds-surface-white)] cursor-pointer accent-primary-text focus:outline-none focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
            aria-invalid={hasError}
            aria-describedby={describedById(inputId, hasError, helperText)}
            {...props}
          />
          {label && (
            <label htmlFor={inputId} className="text-body-sm text-text-secondary font-medium cursor-pointer py-2">
              {label}
            </label>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 ml-6 text-caption text-danger-text font-semibold" role="alert">
            {error}
          </p>
        ) : null}
        {helperText && !error ? (
          <p id={`${inputId}-helper`} className="mt-1 ml-6 text-caption text-text-muted">
            {helperText}
          </p>
        ) : null}
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
}) => {
  const labelId = useId();
  return (
    <div
      className={className}
      role="radiogroup"
      aria-labelledby={label ? labelId : undefined}
      aria-invalid={error ? true : undefined}
    >
      {label && (
        <p id={labelId} className="text-body-xs font-semibold text-text-secondary mb-3">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2.5 min-h-11">
            <input
              type="radio"
              id={`${name}-${opt.value}`}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={opt.disabled}
              className="w-4 h-4 rounded-full border border-border bg-[var(--ds-surface-white)] cursor-pointer accent-primary-text focus:outline-none focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor={`${name}-${opt.value}`}
              className="text-body-sm text-text-secondary font-medium cursor-pointer py-2"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-caption text-danger-text font-semibold" role="alert">{error}</p> : null}
      {helperText && !error ? <p className="mt-2 text-caption text-text-muted">{helperText}</p> : null}
    </div>
  );
};
