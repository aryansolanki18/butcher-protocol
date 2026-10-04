import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ScoreTier } from '@/types';

const TIER_STROKE: Record<ScoreTier, string> = {
  critical: 'var(--signal-red)',
  high: 'var(--warning-amber)',
  medium: 'var(--intel-blue)',
  low: 'var(--text-muted)',
};

const TIER_LABEL: Record<ScoreTier, string> = {
  critical: 'CRITICAL MATCH',
  high: 'HIGH MATCH',
  medium: 'MODERATE MATCH',
  low: 'LOW MATCH',
};

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tier?: ScoreTier;
  label?: string;
  showLabel?: boolean;
}

export function tierStroke(tier: ScoreTier): string {
  return TIER_STROKE[tier];
}

/**
 * Thin-stroke progress ring. Animates from 0 on mount.
 * The tier is spelled out in text so status never depends on colour.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 5,
  tier,
  label,
  showLabel = true,
}: ProgressRingProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (reduced) {
      setMounted(true);
      return;
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - (mounted ? clamped : 0) / 100);
  const resolvedTier = tier ?? (clamped >= 80 ? 'critical' : clamped >= 65 ? 'high' : clamped >= 50 ? 'medium' : 'low');

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Match'}: ${clamped} percent, ${TIER_LABEL[resolvedTier]}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TIER_STROKE[resolvedTier]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: reduced ? offset : offset }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="u-num text-[1.375rem] font-semibold leading-none text-primary">{clamped}</span>
      </div>
      {showLabel ? (
        <p className="mt-1 text-center font-display text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {TIER_LABEL[resolvedTier]}
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal determinate bar for keyword coverage and similar metrics. */
export function ProgressBar({
  value,
  tone = 'var(--intel-blue)',
  delay = 0,
  height = 6,
}: {
  value: number;
  tone?: string;
  delay?: number;
  height?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-border-strong"
      style={{ height }}
      role="img"
      aria-label={`${value} percent`}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: tone }}
        initial={{ width: reduced ? `${value}%` : 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}