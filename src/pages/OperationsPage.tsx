import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutList, Trash2 } from 'lucide-react';
import type { Operation, OperationStatus } from '@/types';
import { formatDate } from '@/lib/matching';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineMessage, Segmented } from '@/components/ui/Inputs';
import { Panel, PanelBody } from '@/components/ui/Panel';
import { useAppState } from '@/state/AppStateContext';

type View = 'BOARD' | 'LIST';

const OPERATION_STATUSES: OperationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER'];

const STATUS_TONE: Record<OperationStatus, 'NEUTRAL' | 'INTEL' | 'AMBER' | 'HIGH' | 'SUCCESS'> = {
  SAVED: 'NEUTRAL',
  APPLIED: 'INTEL',
  INTERVIEW: 'AMBER',
  REJECTED: 'HIGH',
  OFFER: 'SUCCESS',
};

const ADVANCE_LABEL: Record<OperationStatus, string> = {
  SAVED: 'Move to Applied',
  APPLIED: 'Move to Interview',
  INTERVIEW: 'Mark Offer',
  REJECTED: 'Reopen as Saved',
  OFFER: 'Offer Confirmed',
};

export function OperationsPage() {
  const { operations, jobs, advanceOperation, removeOperation } = useAppState();
  const [view, setView] = useState<View>('BOARD');

  /** Live scores always win, so an operation reflects the current profile. */
  const withLiveScores = useMemo(
    () =>
      operations.map((operation) => ({
        ...operation,
        matchScore: jobs.find((job) => job.id === operation.jobId)?.matchScore ?? operation.matchScore,
      })),
    [operations, jobs],
  );

  const grouped = useMemo(() => {
    const map = new Map<OperationStatus, Operation[]>();
    for (const status of OPERATION_STATUSES) map.set(status, []);
    for (const operation of withLiveScores) map.get(operation.status)?.push(operation);
    return map;
  }, [withLiveScores]);

  const active = withLiveScores.filter((operation) => operation.status !== 'REJECTED').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          Local tracking for every application. Status changes stay in this browser session — persistence
          arrives with the Phase 02 data layer.
        </p>
        <div className="flex items-center gap-3">
          <span className="u-num text-sm text-muted">{active} active</span>
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'BOARD' as View, label: 'Board' },
              { value: 'LIST' as View, label: 'List' },
            ]}
          />
        </div>
      </div>

      {withLiveScores.length === 0 ? (
        <InlineMessage
          tone="info"
          title="No operations tracked"
          detail="Save a target from the intel feed to open an operation, then track it here."
          action={
            <Link
              to="/intel-feed"
              className="inline-flex h-9 items-center rounded-[3px] bg-signal px-4 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white"
            >
              Open Intel Feed
            </Link>
          }
        />
      ) : null}

      {view === 'BOARD' ? (
        // Kanban scrolls inside its own container; the page body never scrolls sideways.
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {OPERATION_STATUSES.map((status) => {
              const column = grouped.get(status) ?? [];
              return (
                <section key={status} className="flex w-[248px] shrink-0 flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-border-strong" />
                      <h2 className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
                        {status}
                      </h2>
                    </div>
                    <span className="u-num text-[0.6875rem] text-muted">{column.length}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {column.length === 0 ? (
                      <div className="rounded-[4px] border border-dashed border-border-subtle px-4 py-8 text-center">
                        <p className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                          No operations
                        </p>
                      </div>
                    ) : (
                      column.map((operation) => (
                        <OperationCard
                          key={operation.id}
                          operation={operation}
                          onAdvance={() => advanceOperation(operation.id)}
                          onRemove={() => removeOperation(operation.id)}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Panel>
          <PanelBody className="p-0">
            <ul className="flex flex-col divide-y divide-border-subtle">
              {operations.map((operation) => (
                <li key={operation.id}>
                  <OperationRow
                    key={operation.id}
                    operation={operation}
                    onAdvance={() => advanceOperation(operation.id)}
                    onRemove={() => removeOperation(operation.id)}
                  />
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      )}

      <p className="flex items-center gap-2 font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">
        <LayoutList aria-hidden="true" className="h-3.5 w-3.5" />
        Development data · {withLiveScores.length} operations stored on this machine
      </p>
    </div>
  );
}

function OperationCard({
  operation,
  onAdvance,
  onRemove,
}: {
  operation: Operation;
  onAdvance: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[4px] border border-border-subtle bg-surface p-4 transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[0.8125rem] font-semibold text-primary">{operation.jobTitle}</p>
          <p className="truncate text-[0.75rem] text-secondary">{operation.company}</p>
        </div>
        <span className="u-num shrink-0 text-lg font-semibold text-primary">{operation.matchScore}</span>
      </div>

      <p className="text-[0.75rem] leading-relaxed text-muted">{operation.note}</p>

<div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <time className="font-display text-[0.625rem] uppercase tracking-[0.12em] text-muted">
          {formatDate(operation.date)}
        </time>
        <div className="flex gap-2">
          <Button size="sm" fullWidth onClick={onAdvance}>
            {ADVANCE_LABEL[operation.status]}
          </Button>
          <Button size="sm" onClick={onRemove} aria-label={`Remove operation for ${operation.company}`}>
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function OperationRow({
  operation,
  onAdvance,
  onRemove,
}: {
  operation: Operation;
  onAdvance: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-[200px] flex-1">
        <p className="font-display text-[0.8125rem] font-semibold text-primary">{operation.jobTitle}</p>
        <p className="text-[0.75rem] text-secondary">{operation.company}</p>
      </div>
      <div className="u-num w-20 text-right text-sm text-primary">{operation.matchScore}%</div>
      <time className="w-28 font-display text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
        {formatDate(operation.date)}
      </time>
      <Badge tone={STATUS_TONE[operation.status]} dot>
        {operation.status}
      </Badge>
      <Button size="sm" onClick={onAdvance} className="ml-auto">
        {ADVANCE_LABEL[operation.status]}
      </Button>
      <Button size="sm" onClick={onRemove} aria-label={`Remove operation for ${operation.company}`}>
        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}