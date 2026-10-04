import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Thin corner brackets. Use sparingly, on key panels. */
  brackets?: boolean;
  children: ReactNode;
}

/**
 * Intelligence panel — the base surface for every card in the system.
 * `--bg-surface`, 1px subtle border, small radius.
 */
export function Panel({ brackets = false, className = '', children, ...rest }: PanelProps) {
  return (
    <div
      className={`relative rounded-[4px] border border-border-subtle bg-surface ${
        brackets ? 'u-brackets' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  label: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

export function PanelHeader({ label, hint, action, className = '' }: PanelHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3 ${className}`}
    >
      <div className="flex items-baseline gap-3">
        <span className="u-label">{label}</span>
        {hint ? <span className="text-[0.6875rem] text-muted/80">{hint}</span> : null}
      </div>
      {action}
    </div>
  );
}

interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PanelBody({ className = '', children, ...rest }: PanelBodyProps) {
  return (
    <div className={`p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}