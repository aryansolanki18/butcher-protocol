import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Crosshair, FileSearch, Radar, ShieldCheck } from 'lucide-react';
import { mockIntel } from '@/data/mockIntel';
import { useAppState } from '@/state/AppStateContext';

const MODULES = [
  {
    icon: Radar,
    label: 'Intel Feed',
    title: 'Discover targets',
    detail: 'Structured job intelligence with search, filters and deterministic match scoring.',
  },
  {
    icon: Crosshair,
    label: 'Protocol Scan',
    title: 'Read the requirement',
    detail: 'Extract skills and keywords, then surface an internal compatibility estimate.',
  },
  {
    icon: FileSearch,
    label: 'Identity Forge',
    title: 'Tailor the document',
    detail: 'Reorder and reword what you genuinely have. Nothing is ever invented.',
  },
  {
    icon: ShieldCheck,
    label: 'Operation Status',
    title: 'Track the outcome',
    detail: 'Keep every application visible from saved through offer. You decide, not the tool.',
  },
];

export function LandingPage() {
  const reduced = useReducedMotion();
  const { jobs } = useAppState();

  useEffect(() => {
    const previous = document.title;
    document.title = 'BUTCHER PROTOCOL — AI-Powered Career Intelligence System';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <AmbientHero reduced={Boolean(reduced)} />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-[3px] border border-signal-dim bg-signal/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--signal-red)" strokeWidth="2">
              <path d="M5 5h4v9h8v5H5z" strokeLinejoin="round" />
              <circle cx="18" cy="8" r="3.2" />
            </svg>
          </span>
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Butcher Protocol
          </span>
        </div>
        <Link
          to="/login"
          className="inline-flex h-10 items-center rounded-[3px] border border-border-strong px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:border-signal-dim hover:bg-surface"
        >
          Initialize Session
        </Link>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="u-label mb-6 flex items-center gap-2.5"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
              Classified career intelligence · Phase 01
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold uppercase leading-[0.94] tracking-[0.02em] text-primary"
            >
              Butcher
              <br />
              Protocol
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 font-display text-[clamp(0.875rem,2vw,1.25rem)] font-semibold uppercase tracking-[0.22em] text-signal"
            >
              AI-Powered Career Intelligence System
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-secondary sm:text-base"
            >
              A career intelligence system that discovers opportunities, analyzes job requirements, helps tailor
              resumes, and tracks applications.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/login"
                className="group inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[3px] bg-signal px-8 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white transition-[background-color,box-shadow] duration-150 hover:bg-[#F4253F] hover:shadow-[0_0_30px_-8px_rgba(225,29,56,0.75)]"
              >
                Initialize Protocol
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#modules"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[3px] border border-border-strong px-8 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-primary transition-colors duration-150 hover:border-signal-dim hover:bg-surface"
              >
                View Intelligence
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mt-8 font-display text-[0.625rem] uppercase tracking-[0.18em] text-muted"
            >
              Presentation frontend · development data · no live model or job source
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <FloatingPanel label="Live Signals" reduced={Boolean(reduced)} delay={0.1}>
              <ul className="flex flex-col gap-3">
                {mockIntel.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex flex-col gap-1 border-l border-border-strong pl-3">
                    <span className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary">
                      {item.headline}
                    </span>
                    <span className="text-[0.75rem] leading-relaxed text-muted">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </FloatingPanel>

            <FloatingPanel label="Target Registry" reduced={Boolean(reduced)} delay={0.18}>
              <div className="flex flex-col gap-4">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[0.8125rem] font-semibold text-primary">{job.title}</p>
                      <p className="truncate text-[0.75rem] text-muted">{job.company}</p>
                    </div>
                    <span className="u-num shrink-0 text-lg font-semibold text-primary">{job.matchScore}%</span>
                  </div>
                ))}
              </div>
            </FloatingPanel>
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="mb-8 flex items-center gap-4">
            <span className="u-label">Modules</span>
            <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MODULES.map((module, index) => (
              <motion.article
                key={module.label}
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="u-brackets relative rounded-[4px] border border-border-subtle bg-surface p-6 transition-colors duration-200 hover:border-border-strong"
              >
                <module.icon aria-hidden="true" className="h-5 w-5 text-signal" strokeWidth={1.6} />
                <p className="u-label mt-4">{module.label}</p>
                <h2 className="mt-1.5 font-display text-lg font-semibold text-primary">{module.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{module.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Butcher Protocol
            </p>
            <p className="mt-1 text-[0.75rem] text-muted">
              AI-Powered Career Intelligence System. Phase 01 frontend MVP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-[3px] border border-border-subtle px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              Initialize Session
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center rounded-[3px] border border-border-subtle px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              Command Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Red ambient glow, fog gradient and grid. Landing hero only. */
function AmbientHero({ reduced }: { reduced: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(720px 420px at 22% 8%, rgba(225,29,56,0.22), transparent 62%), radial-gradient(560px 340px at 78% 22%, rgba(76,141,255,0.09), transparent 60%), linear-gradient(to bottom, rgba(5,5,6,0) 40%, var(--bg-base) 100%)',
          }}
        />
        <div className="u-grid-lines absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(70%_50%_at_30%_10%,#000,transparent)]" />
        {!reduced ? <RadarSweep /> : null}
      </div>
      <div aria-hidden="true" className="u-noise pointer-events-none absolute inset-0 z-0" />
    </>
  );
}

/** Restrained radar sweep. Slow, low opacity, decorative only. */
function RadarSweep() {
  return (
    <div
      className="absolute left-[-140px] top-[-180px] h-[520px] w-[520px] rounded-full opacity-[0.5] sm:left-[40px]"
      style={{
        background:
          'radial-gradient(circle, transparent 62%, rgba(225,29,56,0.13) 63%, transparent 64%), radial-gradient(circle, transparent 30%, rgba(225,29,56,0.08) 31%, transparent 32%)',
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(225,29,56,0.20), transparent 32%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/** Slowly drifting intelligence panel. Disabled under reduced motion. */
function FloatingPanel({
  label,
  delay,
  reduced,
  children,
}: {
  label: string;
  delay: number;
  reduced: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-[4px] border border-border-subtle bg-surface/85 p-5 backdrop-blur-sm"
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="u-label">{label}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}