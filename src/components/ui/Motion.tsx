import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Page transition: fade + 10px translate, 240ms. */
export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered fade-up container for dashboard widgets. */
export function Stagger({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Panel hover: lift 3px, stronger border, soft shadow. */
export function HoverLift({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const reduced = useReducedMotion();
  const interactive = Boolean(onClick);

  return (
    <motion.div
      onClick={onClick}
      whileHover={reduced || !interactive ? undefined : { y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-border-strong hover:bg-elevated ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scan-line sweep used during active processing states only.
 * Disabled entirely when the operator prefers reduced motion.
 */
export function ScanLine({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="u-scanline"
      initial={{ top: -140 }}
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}