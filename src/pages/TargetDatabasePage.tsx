import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPaste } from 'lucide-react';
import type { Job } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { TargetDetailModal } from '@/components/jobs/TargetDetailModal';
import { PasteTargetModal } from '@/components/inputs/CaptureModals';
import { Button } from '@/components/ui/Button';
import { InlineMessage, SearchInput } from '@/components/ui/Inputs';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { useAppState } from '@/state/AppStateContext';

export function TargetDatabasePage() {
  const { jobs, savedJobIds, isSaved, toggleSaved, removeTarget, operations, addTargetFromDescription } = useAppState();
  const [detail, setDetail] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);

  const saved = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs
      .filter((job) => savedJobIds.includes(job.id))
      .filter((job) => !term || job.title.toLowerCase().includes(term) || job.company.toLowerCase().includes(term));
  }, [jobs, savedJobIds, search]);

  const trackedIds = useMemo(() => new Set(operations.map((operation) => operation.jobId)), [operations]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          Every target you save is held here, on this machine only. Save a target from the{' '}
          <Link to="/intel-feed" className="text-primary underline-offset-4 hover:underline">
            INTEL FEED
          </Link>
          . Scores here are live — they update whenever you change your profile.
        </p>
        <Button variant="primary" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
          Acquire Target
        </Button>
      </div>

      <Panel brackets className="u-shadow-panel">
        <PanelHeader label="Registry" hint={`${saved.length} saved`} />
        <PanelBody className="flex flex-col gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search saved targets…" label="Search saved targets" />
          <div className="grid gap-3 sm:grid-cols-3">
            <RegistryStat label="Saved Targets" value={String(saved.length)} />
            <RegistryStat label="Added By You" value={String(jobs.filter((job) => job.isUserAdded).length)} />
            <RegistryStat label="In Operations" value={String(trackedIds.size)} />
          </div>
        </PanelBody>
      </Panel>

      {saved.length === 0 ? (
        <InlineMessage
          tone="info"
          title="No saved targets yet"
          detail="Open a target from the intel feed and choose SAVE TARGET, or paste a job description to create one."
          action={
            <Link
              to="/intel-feed"
              className="inline-flex h-9 items-center rounded-[3px] bg-signal px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white"
            >
              Open Intel Feed
            </Link>
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {saved.map((job) => (
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
      )}

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
          const created = await addTargetFromDescription(input);
          if (!isSaved(created.id)) toggleSaved(created.id);
        }}
      />
    </div>
  );
}

function RegistryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[3px] border border-border-subtle bg-elevated/40 px-4 py-3">
      <span className="u-label">{label}</span>
      <span className="u-num text-lg font-semibold text-primary">{value}</span>
    </div>
  );
}