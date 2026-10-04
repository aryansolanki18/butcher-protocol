import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const reduced = useReducedMotion();

  useEffect(() => {
    onClose();
    // Close the drawer on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-5">
        <NavLink to="/dashboard" className="group flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-[3px] border border-signal-dim bg-signal/10 transition-colors group-hover:bg-signal/20"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--signal-red)" strokeWidth="2">
              <path d="M5 5h4v9h8v5H5z" strokeLinejoin="round" />
              <circle cx="18" cy="8" r="3.2" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-primary">
              Butcher
            </span>
            <span className="block font-display text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-signal">
              Protocol
            </span>
          </span>
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="grid h-9 w-9 place-items-center rounded-[3px] border border-border-subtle text-muted hover:text-primary lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-3 font-display text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-muted/70">
          Modules
        </p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'group relative flex min-h-10 items-center gap-3 rounded-[3px] pl-3 pr-2 transition-colors duration-150 ease-out',
                    'before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-signal before:opacity-0 before:transition-opacity before:duration-150',
                    isActive
                      ? 'bg-elevated text-primary before:opacity-100'
                      : 'text-secondary hover:bg-elevated/60 hover:text-primary before:opacity-0',
                  ].join(' ')
                }
              >
                <item.icon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-signal"
                  strokeWidth={1.7}
                />
                <span className="flex-1 font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
                {item.placeholder ? (
                  <span className="rounded-[2px] border border-border-subtle px-1.5 py-px font-display text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    P1
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border-subtle px-5 py-4">
        <p className="font-display text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-muted/70">
          Phase 01 — Development data
        </p>
        <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted">
          Frontend MVP. Gemma 4 31B IT integration is prepared but not yet active.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--spacing-sidebar)] border-r border-border-subtle bg-surface lg:block">
        {content}
      </aside>

      {/* Mobile: drawer */}
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              aria-label="Primary"
              className="absolute inset-y-0 left-0 w-[min(85vw,var(--spacing-sidebar))] border-r border-border-subtle bg-surface"
              initial={reduced ? { opacity: 0 } : { x: '-100%' }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {content}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}