import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Panel, PanelBody } from '@/components/ui/Panel';

interface PlaceholderPageProps {
  module: string;
  title: string;
  description: string;
  phase: string;
  planned: string[];
  children?: ReactNode;
}

/**
 * Placeholder module. Used by Target Database and Settings in Phase 01.
 * Same shell, same tone, no dead links, no fake functionality.
 */
export function PlaceholderPage({ module, title, description, phase, planned }: PlaceholderPageProps) {
  useEffect(() => {
    document.title = `${title} — BUTCHER PROTOCOL`;
  }, [title]);

  return (
    <div className="flex flex-col gap-6">
      <Panel brackets className="u-shadow-panel">
        <PanelBody className="flex flex-col items-start gap-5 py-10 sm:py-14">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-[3px] border border-border-strong bg-elevated"
          >
            <Construction className="h-5 w-5 text-amber" strokeWidth={1.6} />
          </span>
          <div>
            <p className="u-label">{module}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold uppercase tracking-[0.06em] text-primary">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary">{description}</p>
          </div>

          <div className="w-full rounded-[4px] border border-border-subtle bg-canvas/50 px-4 py-3.5">
            <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-amber">
              Module not active in Phase 01
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-secondary">
              This module is staged for {phase}. No live behaviour is attached to it yet.
            </p>
          </div>

          <div>
            <p className="u-label mb-3">Planned Capabilities</p>
            <ul className="flex flex-col gap-2">
              {planned.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-secondary">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center rounded-[3px] bg-signal px-5 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#F4253F]"
            >
              Return to Command Center
            </Link>
            <Link
              to="/intel-feed"
              className="inline-flex h-10 items-center rounded-[3px] border border-border-strong px-5 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:border-signal-dim hover:bg-elevated"
            >
              Open Intel Feed
            </Link>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}