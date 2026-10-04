import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-[3px] font-display font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-signal text-white hover:bg-[#F4253F] hover:shadow-[0_0_24px_-6px_rgba(225,29,56,0.65)] active:translate-y-px',
  secondary:
    'border border-border-strong bg-transparent text-primary hover:border-signal-dim hover:bg-elevated active:translate-y-px',
  ghost: 'border border-transparent bg-transparent text-muted hover:text-primary',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[0.6875rem]',
  md: 'h-11 px-5 text-xs',
  lg: 'h-[52px] px-8 text-[0.8125rem]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-r-transparent"
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}