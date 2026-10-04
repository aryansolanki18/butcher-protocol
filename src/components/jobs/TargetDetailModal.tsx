import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatDate, formatPostedAt } from '@/lib/matching';
import type { Job } from '@/types';

interface TargetDetailProps {
  job: Job | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: (jobId: string) => void;
  /** Present only for targets the operator added. */
  onRemove?: (jobId: string) => void;
}

export function TargetDetailModal({ job, onClose, saved, onToggleSave, onRemove }: TargetDetailProps) {
  return (
    <Modal
      open={job !== null}
      onClose={onClose}
      wide
      title={job ? `${job.title} — ${job.company}` : 'Target'}
      subtitle={job ? `${job.source} · Posted ${formatPostedAt(job.postedAt).toLowerCase()} · ${job.id.toUpperCase()}` : undefined}
      footer={
        <>
          {job && onRemove ? (
            <Button onClick={() => onRemove(job.id)} className="mr-auto">
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Remove Target
            </Button>
          ) : null}
          <Button onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={() => job && onToggleSave(job.id)} aria-pressed={saved}>
            {saved ? 'Remove from saved' : 'Save Target'}
          </Button>
          {job ? (
            <Link
              to={`/identity-forge?target=${job.id}`}
              className="inline-flex h-11 items-center justify-center rounded-[3px] bg-signal px-5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-150 hover:bg-[#F4253F]"
            >
              Forge Resume
            </Link>
          ) : null}
        </>
      }
    >
      {job ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="u-label mb-2">Briefing</h3>
              <p className="text-sm leading-relaxed text-secondary">{job.description}</p>
            </section>

            <section>
              <h3 className="u-label mb-2">Responsibilities</h3>
              <ul className="flex flex-col gap-2">
                {job.analysis.responsibilities.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-secondary">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="u-label mb-2">Requirements</h3>
              <dl className="grid gap-x-6 gap-y-2 text-[0.8125rem] sm:grid-cols-2">
                <DetailRow label="Experience" value={job.analysis.experience} />
                <DetailRow label="Education" value={job.analysis.education} />
                <DetailRow label="Employment" value={job.analysis.employmentType} />
                <DetailRow label="Location" value={job.analysis.location} />
              </dl>
            </section>

            <section>
              <h3 className="u-label mb-2">Skill Matrix</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Required
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.analysis.requiredSkills.length === 0 ? (
                      <Chip>Not stated</Chip>
                    ) : (
                      job.analysis.requiredSkills.map((skill) => (
                        <Chip key={skill} state={job.match.matchedSkills.includes(skill) ? 'matched' : 'missing'}>
                          {skill}
                        </Chip>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Preferred
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.analysis.preferredSkills.length === 0 ? (
                      <Chip>Not stated</Chip>
                    ) : (
                      job.analysis.preferredSkills.map((skill) => (
                        <Chip key={skill} state={job.match.matchedSkills.includes(skill) ? 'matched' : 'neutral'}>
                          {skill}
                        </Chip>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-5 rounded-[4px] border border-border-subtle bg-surface p-5">
            <div className="flex flex-col items-center gap-3">
              <ProgressRing value={job.matchScore} tier={job.match.tier} size={104} label="Match score" />
              <Badge tone={job.priority} dot>
                {job.priority} priority
              </Badge>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <p className="u-label mb-2">Match Analysis</p>
              <p className="text-[0.75rem] leading-relaxed text-secondary">
                Calculated deterministically from your profile skills. Not produced by an AI model.
              </p>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <p className="u-label mb-2">Matched</p>
              <div className="flex flex-wrap gap-1.5">
                {job.match.matchedSkills.length === 0 ? <Chip>None</Chip> : job.match.matchedSkills.map((s) => <Chip key={s} state="matched">{s}</Chip>)}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <p className="u-label mb-2">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {job.match.missingSkills.length === 0 ? <Chip>None</Chip> : job.match.missingSkills.map((s) => <Chip key={s} state="missing">{s}</Chip>)}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <dl className="flex flex-col gap-2 text-[0.75rem]">
                <DetailRow label="Acquired" value={formatDate(job.postedAt)} />
                <DetailRow label="Work mode" value={job.workMode} />
                <DetailRow label="Source" value={job.source} />
              </dl>
            </div>
          </aside>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="text-secondary">{value}</dd>
    </div>
  );
}