import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Uppercase small label above the control. Errors are text, not colour only. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="u-label">
          {label}
          {required ? <span className="ml-1 text-signal">*</span> : null}
        </label>
        {hint ? (
          <span id={hintId} className="text-[0.6875rem] text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      {children(id, describedBy)}
      {error ? (
        <p id={errorId} role="alert" className="text-[0.75rem] text-[#F4526A]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  'w-full rounded-[3px] border bg-elevated/70 px-3 py-2.5 text-sm text-primary placeholder:text-muted/70 transition-colors duration-150 outline-none focus:border-signal-dim focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)]';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  hint?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  error,
  required,
  autoComplete,
}: TextInputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(id, describedBy) => (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} ${error ? 'border-signal-dim' : 'border-border-subtle'}`}
        />
      )}
    </Field>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  error?: string;
}

export function Select({ label, value, onChange, options, hint, error }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <div className="relative">
          <select
            id={id}
            value={value}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
            className={`${controlClass} cursor-pointer appearance-none pr-9 ${
              error ? 'border-signal-dim' : 'border-border-subtle'
            }`}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-surface text-primary">
                {option.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            ▾
          </span>
        </div>
      )}
    </Field>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchInput({ value, onChange, placeholder, label = 'Search' }: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <label htmlFor="intel-search" className="sr-only">
        {label}
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5 17.5 17.5" strokeLinecap="round" />
      </svg>
      <input
        id="intel-search"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} pl-9`}
      />
    </div>
  );
}

interface RangeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}

/** Dual-bound match filter implemented as a single upper-bound slider. */
export function RangeInput({ label, value, onChange, min, max, suffix = '%' }: RangeInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="u-label">{label}</span>
        <span className="u-num text-xs text-secondary">
          {min}
          {suffix}+
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border-strong accent-[#E11D38]"
        aria-label={`${label}, minimum ${value}${suffix}`}
      />
    </div>
  );
}

/** Segmented single-select control used for sorting and compact filters. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="u-label">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`min-h-9 rounded-[3px] border px-3 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ${
                active
                  ? 'border-signal-dim bg-signal/10 text-primary'
                  : 'border-border-subtle bg-elevated/50 text-muted hover:border-border-strong hover:text-secondary'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Read-only toggle pair. Kept as a checkbox for keyboard and AT correctness. */
export function CheckToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2.5 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[2px] border transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal ${
          checked ? 'border-signal-dim bg-signal/20' : 'border-border-strong bg-elevated'
        }`}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-secondary">
        {label}
      </span>
    </label>
  );
}

/** Toast-style inline status message. Used for empty and error states. */
export function InlineMessage({
  tone,
  title,
  detail,
  action,
}: {
  tone: 'info' | 'error' | 'success';
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  const toneClass =
    tone === 'error'
      ? 'border-signal-dim bg-signal/[0.07]'
      : tone === 'success'
        ? 'border-success/30 bg-success/[0.06]'
        : 'border-border-subtle bg-elevated/60';

  return (
    <div role="status" className={`rounded-[4px] border px-4 py-3 ${toneClass}`}>
      <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-primary">{title}</p>
      {detail ? <p className="mt-1 text-[0.8125rem] leading-relaxed text-secondary">{detail}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/** Dismissible one-time notice, e.g. the DEVELOPMENT DATA marker. */
export function DismissableNotice({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) return;
    ref.current?.remove();
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="flex items-center justify-between gap-4 rounded-[3px] border border-border-subtle bg-elevated/50 px-4 py-2"
    >
      <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {children}
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="min-h-8 px-2 font-display text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-primary"
      >
        Dismiss
      </button>
    </div>
  );
}