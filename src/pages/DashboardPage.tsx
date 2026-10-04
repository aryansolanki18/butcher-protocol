import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, ClipboardPaste, Radar, ScanLine, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Job } from '@/types';
import { mockIntel } from '@/data/mockIntel';
import { formatPostedAt } from '@/lib/matching';
import { Badge } from '@/components/ui/Badge';
import { PasteTargetModal } from '@/components/inputs/CaptureModals';
import { Button } from '@/components/ui/Button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressRing';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { JobCard } from '@/components/jobs/JobCard';
import { TargetDetailModal } from '@/components/jobs/TargetDetailModal';
import { useAppState } from '@/state/AppStateContext';

const QUICK_ACTIONS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/intel-feed', label: 'Scan For Jobs', icon: Radar },
  { to: '/identity-forge', label: 'Forge Resume', icon: Sparkles },
  { to: '/protocol-scan', label: 'Run Protocol Scan', icon: ScanLine },
  { to: '/operations', label: 'View Operations', icon: Activity },
];

export function DashboardPage() {
  const { jobs, operations, isSaved, toggleSaved, removeTarget, addTargetFromDescription } = useAppState();
  const [detail, setDetail] = useState<Job | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);

  const stats = useMemo(() => {
    const added = jobs.filter((job) => job.isUserAdded).length;
    return [
      { label: 'Targets Acquired', value: jobs.length, detail: `${added} added by you` },
      {
        label: 'High Match Targets',
        value: jobs.filter((job) => job.matchScore >= 80).length,
        detail: 'Match score at or above 80',
      },
      {
        label: 'ATS Readiness',
        value: `${Math.round(jobs.reduce((total, job) => total + job.matchScore, 0) / jobs.length)}%`,
        detail: 'Internal compatibility estimate',
      },
      {
        label: 'Active Operations',
        value: operations.filter((operation) => operation.status !== 'REJECTED').length,
        detail: `Of ${operations.length} tracked operations`,
      },
    ];
  }, [jobs, operations]);

  const highPriority = useMemo(() => [...jobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3), [jobs]);

  const recentIntel = useMemo(() => mockIntel.slice(0, 5), []);

  const addedByYou = useMemo(() => jobs.filter((job) => job.isUserAdded).length, [jobs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          {addedByYou > 0
            ? `You have added ${addedByYou} target${addedByYou === 1 ? '' : 's'} of your own. Every score below is computed from your live profile.`
            : 'Paste any job description to create your first target. Every score below is computed from your live profile, not stored.'}
        </p>
        <Button variant="primary" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
          Acquire Target
        </Button>
      </div>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Panel brackets className="u-shadow-panel h-full transition-colors duration-200 hover:border-border-strong">
              <PanelBody>
                <p className="u-label">{stat.label}</p>
                <p className="u-num mt-3 text-4xl font-semibold leading-none text-primary">{stat.value}</p>
                <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">{stat.detail}</p>
              </PanelBody>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>

      <Stagger className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.15fr]">
        <StaggerItem>
          <Panel className="h-full">
            <PanelHeader label="Intel Feed" hint="Recent discoveries" />
            <PanelBody>
              <ul className="flex flex-col gap-4">
                {recentIntel.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 border-l border-border-subtle pl-4">
                    <div className="min-w-0">
                      <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                        {item.headline}
                      </p>
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-secondary">{item.detail}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge tone={item.severity}>{item.severity}</Badge>
                      <time className="font-display text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                        {formatPostedAt(item.timestamp)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/intel-feed"
                className="mt-6 inline-flex items-center gap-2 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-signal transition-colors hover:text-primary"
              >
                Open Intel Feed
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </PanelBody>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel className="h-full">
            <PanelHeader label="Quick Actions" hint="Operator shortcuts" />
            <PanelBody className="grid gap-3 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to + action.label}
                  to={action.to}
                  className="group flex min-h-[92px] flex-col justify-between rounded-[4px] border border-border-subtle bg-elevated/50 p-4 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-signal-dim hover:bg-elevated"
                >
                  <action.icon aria-hidden="true" className="h-5 w-5 text-signal" strokeWidth={1.6} />
                  <span className="mt-4 font-display text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-primary">
                    {action.label}
                  </span>
                </Link>
              ))}
            </PanelBody>
          </Panel>
        </StaggerItem>
      </Stagger>

      <Stagger>
        <StaggerItem>
          <div className="mb-5 flex items-center gap-4">
            <h2 className="u-label">High Priority Targets</h2>
            <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
            <span className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">
              Sorted by match score
            </span>
          </div>
        </StaggerItem>
      </Stagger>

      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highPriority.map((job) => (
          <StaggerItem key={job.id}>
            <JobCard
              job={job}
              saved={isSaved(job.id)}
              onToggleSave={toggleSaved}
              onViewTarget={setDetail}
              onRemove={job.isUserAdded ? () => removeTarget(job.id) : undefined}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <Panel>
        <PanelHeader label="Engine Readiness" hint="Phase 1 architecture" />
        <PanelBody>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: 'Gemma 4 31B IT interface', detail: 'analyzeJob, tailorResume, analyzeATS', done: true },
              { label: 'Client AI boundary', detail: 'UI calls aiClient only', done: true },
              { label: 'Live model inference', detail: 'Scheduled for Phase 03', done: false },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                    {item.label}
                  </p>
                  <Badge tone={item.done ? 'SUCCESS' : 'LOW'} dot>
                    {item.done ? 'Prepared' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-[0.75rem] text-muted">{item.detail}</p>
                <ProgressBar value={item.done ? 100 : 0} tone={item.done ? 'var(--success-green)' : 'var(--border-strong)'} height={3} />
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>

      <TargetDetailModal
        job={detail}
        onClose={() => setDetail(null)}
        saved={detail ? isSaved(detail.id) : false}
        onToggleSave={toggleSaved}
        onRemove={
          detail?.isUserAdded
            ? () => {
                removeTarget(detail.id);
                setDetail(null);
              }
            : undefined
        }
      />

      <PasteTargetModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSubmit={async (input) => {
          await addTargetFromDescription(input);
        }}
      />
    </div>
  );
}