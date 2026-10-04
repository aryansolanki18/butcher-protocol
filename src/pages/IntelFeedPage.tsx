import { useMemo, useState } from 'react';
import { ClipboardPaste, SlidersHorizontal } from 'lucide-react';
import type { Job, WorkMode } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { TargetDetailModal } from '@/components/jobs/TargetDetailModal';
import { PasteTargetModal } from '@/components/inputs/CaptureModals';
import { Button } from '@/components/ui/Button';
import { CheckToggle, InlineMessage, RangeInput, SearchInput, Segmented, Select } from '@/components/ui/Inputs';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { useAppState } from '@/state/AppStateContext';

type SortKey = 'MATCH' | 'RECENT' | 'COMPANY' | 'TITLE';
type Scope = 'ALL' | 'SAVED' | 'ADDED';
type ModeFilter = 'ANY' | WorkMode;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'MATCH', label: 'Match' },
  { value: 'RECENT', label: 'Recent' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'TITLE', label: 'Title' },
];

const DEFAULT_FILTERS = {
  search: '',
  role: 'ALL',
  location: 'ALL',
  mode: 'ANY' as ModeFilter,
  minMatch: 0,
  sort: 'MATCH' as SortKey,
  scope: 'ALL' as Scope,
};

export function IntelFeedPage() {
  const { jobs, isSaved, toggleSaved, removeTarget, addTargetFromDescription } = useAppState();
  const [detail, setDetail] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const [search, setSearch] = useState(DEFAULT_FILTERS.search);
  const [role, setRole] = useState(DEFAULT_FILTERS.role);
  const [location, setLocation] = useState(DEFAULT_FILTERS.location);
  const [mode, setMode] = useState(DEFAULT_FILTERS.mode);
  const [minMatch, setMinMatch] = useState(DEFAULT_FILTERS.minMatch);
  const [sort, setSort] = useState(DEFAULT_FILTERS.sort);
  const [scope, setScope] = useState(DEFAULT_FILTERS.scope);

  const roles = useMemo(() => [...new Set(jobs.map((job) => job.title))].sort(), [jobs]);
  const locations = useMemo(() => [...new Set(jobs.map((job) => job.location))].sort(), [jobs]);
  const addedCount = useMemo(() => jobs.filter((job) => job.isUserAdded).length, [jobs]);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (scope === 'SAVED' && !isSaved(job.id)) return false;
      if (scope === 'ADDED' && !job.isUserAdded) return false;
      if (role !== 'ALL' && job.title !== role) return false;
      if (location !== 'ALL' && job.location !== location) return false;
      if (mode !== 'ANY' && job.workMode !== mode) return false;
      if (job.matchScore < minMatch) return false;
      if (!term) return true;
      return (
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.skills.some((skill) => skill.toLowerCase().includes(term)) ||
        job.description.toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'RECENT':
        sorted.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
        break;
      case 'COMPANY':
        sorted.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'TITLE':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        sorted.sort((a, b) => b.matchScore - a.matchScore);
    }
    return sorted;
  }, [jobs, search, role, location, mode, minMatch, sort, scope, isSaved]);

  const activeFilterCount =
    (role !== 'ALL' ? 1 : 0) + (location !== 'ALL' ? 1 : 0) + (mode !== 'ANY' ? 1 : 0) + (minMatch > 0 ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setRole('ALL');
    setLocation('ALL');
    setMode('ANY');
    setMinMatch(0);
    setSort('MATCH');
    setScope('ALL');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          Paste any job description to create a target, or work the development registry. Match scores are
          recomputed from your live profile, so editing <span className="text-primary">PROFILE</span> re-scores
          everything here instantly.
        </p>
        <div className="flex items-center gap-3">
          <span className="u-num text-sm text-muted">
            {results.length} / {jobs.length} targets
          </span>
          <Button size="sm" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters}>
            <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-1 rounded-[2px] bg-signal/20 px-1.5 py-px text-[0.625rem] text-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Button variant="primary" size="md" onClick={() => setPasteOpen(true)} className="shrink-0">
          <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
          Acquire Target
        </Button>
        <SearchInput value={search} onChange={setSearch} placeholder="Search your targets…" label="Search targets" />
        <Segmented label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      {addedNotice ? (
        <InlineMessage
          tone="success"
          title={addedNotice}
          detail="The score below is computed from your current profile. Add more skills on PROFILE to raise it."
          action={<Button size="sm" onClick={() => setAddedNotice(null)}>Dismiss</Button>}
        />
      ) : null}

      {showFilters ? (
        <div className="grid gap-5 rounded-[4px] border border-border-subtle bg-surface p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Role"
            value={role}
            onChange={setRole}
            options={[{ value: 'ALL', label: 'All roles' }, ...roles.map((value) => ({ value, label: value }))]}
          />
          <Select
            label="Location"
            value={location}
            onChange={setLocation}
            options={[{ value: 'ALL', label: 'All locations' }, ...locations.map((value) => ({ value, label: value }))]}
          />
          <RangeInput label="Match Score" value={minMatch} onChange={setMinMatch} min={0} max={95} />
          <div className="flex flex-col gap-3">
            <span className="u-label">Work Mode</span>
            <div className="flex flex-wrap gap-3">
              {(['ANY', 'REMOTE', 'HYBRID', 'ONSITE'] as ModeFilter[]).map((value) => (
                <CheckToggle
                  key={value}
                  label={value === 'ANY' ? 'Any' : value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <Segmented
              label="Scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'ALL' as Scope, label: `All targets (${jobs.length})` },
                { value: 'SAVED' as Scope, label: 'Saved only' },
                { value: 'ADDED' as Scope, label: `Pasted by me (${addedCount})` },
              ]}
            />
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <Button size="sm" onClick={resetFilters} disabled={activeFilterCount === 0 && search === ''}>
              Reset Filters
            </Button>
          </div>
        </div>
      ) : null}

      {results.length === 0 ? (
        <InlineMessage
          tone="info"
          title="No targets match the current filters"
          detail="Paste a job description to create one, widen the match threshold, or clear the filters."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => setPasteOpen(true)}>
                Acquire Target
              </Button>
              <Button size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {results.map((job) => (
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

      <PasteTargetModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSubmit={async (input) => {
          const job = await addTargetFromDescription(input);
          setAddedNotice(`TARGET ACQUIRED — ${job.company || job.title}`);
        }}
      />

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
    </div>
  );
}