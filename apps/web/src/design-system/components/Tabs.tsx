import React, { useCallback, useRef } from 'react';

/* ── Shared pill styling ── */

const pillBase =
  'inline-flex items-center justify-center rounded-full font-semibold border ' +
  'transition-all duration-[120ms] ' +
  'focus:outline-none focus-visible:shadow-focus ' +
  'select-none px-4 py-2 text-body-xs';

function pillClasses(selected: boolean): { className: string; style?: React.CSSProperties } {
  if (selected) {
    return {
      className: `${pillBase} text-text-primary border-border-accent`,
      style:     { background: 'var(--primary-btn-gradient)' },
    };
  }
  return {
    className:
      `${pillBase} bg-transparent border-border text-text-secondary ` +
      'hover:text-text-primary hover:border-border-strong',
  };
}

function formatLabel(label: string, count?: number): string {
  return count !== undefined ? `${label} (${count})` : label;
}

function usePillKeyboard(
  count: number,
  refs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (index - 1 + count) % count;
        refs.current[prev]?.focus();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (index + 1) % count;
        refs.current[next]?.focus();
      }
    },
    [count, refs],
  );
}

const containerStyle: React.CSSProperties = { gap: 'var(--density-gap, 8px)' };

/* ── Tabs ── */

export interface TabOption {
  value: string;
  label: string;
}

export interface TabsProps {
  options:  TabOption[];
  value:    string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ options, value, onChange, className = '' }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleKeyDown = usePillKeyboard(options.length, refs);

  const select = (optionValue: string) => {
    onChange(optionValue);
  };

  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-center ${className}`}
      style={containerStyle}
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        const pill = pillClasses(selected);
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={pill.className}
            style={pill.style}
            onClick={() => select(opt.value)}
            onKeyDown={(e) => {
              handleKeyDown(e, index);
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select(opt.value);
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/* ── FilterPills ── */

export interface FilterPillOption {
  value: string;
  label: string;
  count?: number;
}

type FilterPillsSingleProps = {
  multiple?: false;
  options:   FilterPillOption[];
  value:     string;
  onChange:  (value: string) => void;
  ariaLabel: string;
  className?: string;
};

type FilterPillsMultiProps = {
  multiple:  true;
  options:   FilterPillOption[];
  value:     string[];
  onChange:  (value: string[]) => void;
  ariaLabel: string;
  className?: string;
};

export type FilterPillsProps = FilterPillsSingleProps | FilterPillsMultiProps;

export const FilterPills: React.FC<FilterPillsProps> = (props) => {
  const { options, ariaLabel, className = '', multiple = false } = props;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleKeyDown = usePillKeyboard(options.length, refs);

  const isSelected = (optionValue: string): boolean => {
    if (multiple) {
      return (props as FilterPillsMultiProps).value.includes(optionValue);
    }
    return (props as FilterPillsSingleProps).value === optionValue;
  };

  const toggle = (optionValue: string) => {
    if (multiple) {
      const { value, onChange } = props as FilterPillsMultiProps;
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(next);
    } else {
      (props as FilterPillsSingleProps).onChange(optionValue);
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center ${className}`}
      style={containerStyle}
    >
      {options.map((opt, index) => {
        const selected = isSelected(opt.value);
        const pill = pillClasses(selected);
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            aria-pressed={selected}
            className={pill.className}
            style={pill.style}
            onClick={() => toggle(opt.value)}
            onKeyDown={(e) => {
              handleKeyDown(e, index);
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(opt.value);
              }
            }}
          >
            {formatLabel(opt.label, opt.count)}
          </button>
        );
      })}
    </div>
  );
};
