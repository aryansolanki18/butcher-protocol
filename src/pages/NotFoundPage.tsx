import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ROUTES = [
  { to: '/dashboard', label: 'Command Center' },
  { to: '/intel-feed', label: 'Intel Feed' },
  { to: '/identity-forge', label: 'Identity Forge' },
  { to: '/protocol-scan', label: 'Protocol Scan' },
  { to: '/operations', label: 'Operation Status' },
  { to: '/profile', label: 'Profile' },
];

export function NotFoundPage() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = 'Signal Lost — BUTCHER PROTOCOL';
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px 380px at 50% 0%, rgba(225,29,56,0.14), transparent 62%), radial-gradient(520px 320px at 20% 60%, rgba(76,141,255,0.07), transparent 60%)',
        }}
      />
      <div aria-hidden="true" className="u-noise pointer-events-none absolute inset-0" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
        >
          <p className="u-label">Error 404</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] font-bold uppercase leading-none tracking-[0.02em] text-primary">
            Signal Lost
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            The requested coordinate is not in the registry. Select a module to resume operations.
          </p>

          <ul className="mt-7 flex flex-col gap-1.5">
            {ROUTES.map((route) => (
              <li key={route.to}>
                <Link
                  to={route.to}
                  className="flex min-h-11 items-center justify-between rounded-[3px] border border-border-subtle bg-surface px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-secondary transition-colors duration-150 hover:border-signal-dim hover:text-primary"
                >
                  {route.label}
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </main>
    </div>
  );
}