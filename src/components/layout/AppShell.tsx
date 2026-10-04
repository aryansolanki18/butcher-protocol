import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NAV_ITEMS, navLabelFor } from '@/lib/nav';
import { Sidebar } from './Sidebar';
import { useAppState } from '@/state/AppStateContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();
  const { profile, jobs } = useAppState();
  const title = navLabelFor(location.pathname);

  return (
    <div className="relative min-h-screen bg-base">
      {/* Ambient signal lighting. Fixed so it never scrolls with content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(900px 480px at 12% -8%, rgba(225,29,56,0.10), transparent 62%), radial-gradient(700px 420px at 92% 4%, rgba(76,141,255,0.06), transparent 60%)',
        }}
      />
      <div aria-hidden="true" className="u-noise pointer-events-none fixed inset-0 z-0" />

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="relative z-10 lg:pl-[var(--spacing-sidebar)]">
        <header className="sticky top-0 z-20 h-16 border-b border-border-subtle bg-base/85 backdrop-blur-md">
          <div className="flex h-full items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] border border-border-subtle text-secondary transition-colors hover:border-border-strong hover:text-primary lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="min-w-0 flex-1">
              <motion.h1
                key={title}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="u-page-title truncate"
              >
                {title}
              </motion.h1>
            </div>

            <div className="hidden items-center gap-2 rounded-[3px] border border-border-subtle bg-surface px-3 py-1.5 md:flex">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-secondary">
                Protocol Online
              </span>
            </div>

            <button
              type="button"
              aria-label={`Notifications, ${jobs.length} tracked targets`}
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[3px] border border-border-subtle text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              <Bell className="h-4 w-4" strokeWidth={1.7} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            </button>

            <Link
              to="/profile"
              className="flex shrink-0 items-center gap-2.5 rounded-[3px] border border-border-subtle bg-surface py-1 pl-1 pr-2 transition-colors hover:border-border-strong"
            >
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-[2px] bg-signal/15 font-display text-[0.6875rem] font-bold tracking-[0.06em] text-[#F4526A]"
              >
                {initials(profile.personal.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block font-display text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary">
                  Operator
                </span>
                <span className="block font-display text-[0.5625rem] uppercase tracking-[0.16em] text-muted">
                  {NAV_ITEMS.length} modules
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}