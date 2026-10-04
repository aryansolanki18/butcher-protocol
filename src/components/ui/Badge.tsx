import type { ReactNode } from 'react';
import type { Priority, ScoreTier } from '@/types';

export type BadgeTone = Priority | ScoreTier | 'NEUTRAL' | 'SUCCESS' | 'INTEL' | 'AMBER';

const tones: Record<BadgeTone, string> = {
  CRITICAL: 'border-signal-dim bg-signal/10 text-[#F4526A]',
  HIGH: 'border-signal-dim bg-signal/10 text-[#F4526A]',
  MEDIUM: 'border-amber/30 bg-amber/10 text-amber',
  LOW: 'border-intel/30 bg-intel/10 text-intel',
  critical: 'border-signal-dim bg-signal/10 text-[#F4526A]',
  high: 'border-amber/30 bg-amber/10 text-amber',
  medium: 'border-intel/30 bg-intel/10 text-intel',
  low: 'border-border-strong bg-elevated text-muted',
  NEUTRAL: 'border-border-strong bg-elevated text-secondary',
  SUCCESS: 'border-success/30 bg-success/10 text-success',
  INTEL: 'border-intel/30 bg-intel/10 text-intel',
  AMBER: 'border-amber/30 bg-amber/10 text-amber',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  /** Optional dot. Status is never colour-only: the label always carries meaning. */
  dot?: boolean;
}

export function Badge({ tone = 'NEUTRAL', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-[3px] font-display text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${tones[tone]} ${className}`}
    >
      {dot ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/** Chip used inside SKILL MATRIX lists. */
export function Chip({
  children,
  state = 'neutral',
  className = '',
}: {
  children: ReactNode;
  state?: 'neutral' | 'matched' | 'missing';
  className?: string;
}) {
  const stateClass =
    state === 'matched'
      ? 'border-success/25 bg-success/[0.07] text-[#7FE0AC]'
      : state === 'missing'
        ? 'border-amber/25 bg-amber/[0.07] text-amber'
        : 'border-border-subtle bg-elevated/60 text-secondary';
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-[3px] text-[0.6875rem] leading-none ${stateClass} ${className}`}
    >
      {children}
    </span>
  );
}