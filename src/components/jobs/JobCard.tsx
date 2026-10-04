import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Bookmark, Check, Crosshair, MapPin, Radio, Sparkles, Trash2 } from 'lucide-react';
import type { Job } from '@/types';
import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatPostedAt } from '@/lib/matching';

interface JobCardProps {
  job: Job;
  saved: boolean;
  onToggleSave: (jobId: string) => void;
  onViewTarget: (job: Job) => void;
  onForge?: (job: Job) => void;
  /** Present only for targets the operator added, enabling removal. */
  onRemove?: (jobId: string) => void;
}

const WORK_MODE_LABEL: Record<Job['workMode'], string> = {
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
  ONSITE: 'ON-SITE',
};

export function JobCard({ job, saved, onToggleSave, onViewTarget, onForge, onRemove }: JobCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springConfig = { stiffness: 260, damping: 22, mass: 0.6 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  const perspective = useTransform(rotateYSpring, (value) => `${1000 + value * 12}px`);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === 'touch' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-py * 5);
    rotateY.set(px * 5);
  };

  const resetTilt = () => {
    setHovering(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.article
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={resetTilt}
      style={
        hovering && !reduced
          ? { rotateX: rotateXSpring, rotateY: rotateYSpring, transformPerspective: perspective }
          : undefined
      }
      className="group relative flex h-full flex-col rounded-[4px] border border-border-subtle bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-border-strong hover:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_18px_40px_-24px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-3">
        <span className="u-label">Target Acquired</span>
        <div className="flex shrink-0 items-center gap-2">
          {job.matchScore >= 80 ? (
            <Badge tone={job.priority} dot>
              {job.priority}
            </Badge>
          ) : (
            <Badge tone={job.priority}>{job.priority}</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div>
          <h3 className="font-display text-[1.0625rem] font-semibold leading-snug text-primary">{job.title}</h3>
          <p className="mt-1 text-sm text-secondary">{job.company}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.75rem]">
          <div className="flex items-center gap-1.5 text-muted">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
            <dt className="sr-only">Location</dt>
            <dd className="truncate">{job.location}</dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Radio aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
            <dt className="sr-only">Work mode</dt>
            <dd>{WORK_MODE_LABEL[job.workMode]}</dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Crosshair aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
            <dt className="sr-only">Source</dt>
            <dd className="truncate">{job.source}</dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
            <dt className="sr-only">Posted</dt>
            <dd>{formatPostedAt(job.postedAt)}</dd>
          </div>
        </dl>

        <div>
          <p className="u-label mb-2">Skill Matrix</p>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 6).map((skill) => (
              <Chip key={skill} state={job.match.matchedSkills.includes(skill) ? 'matched' : 'neutral'}>
                {skill}
              </Chip>
            ))}
            {job.skills.length > 6 ? <Chip>+{job.skills.length - 6}</Chip> : null}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border-subtle pt-4">
          <div>
            <p className="u-label mb-1.5">Match Analysis</p>
            <p className="whitespace-nowrap text-[0.6875rem] leading-relaxed text-muted">
              <span className="u-num text-secondary">{job.match.matchedSkills.length}</span> matched
              <span aria-hidden="true" className="px-1.5 text-border-strong">
                ·
              </span>
              <span className="u-num text-secondary">{job.match.missingSkills.length}</span> missing
            </p>
          </div>
          <ProgressRing value={job.matchScore} tier={job.match.tier} size={72} strokeWidth={4} showLabel={false} label="Match score" />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle px-5 py-4">
        <Button size="md" variant="primary" fullWidth onClick={() => onViewTarget(job)}>
          View Target
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {onForge ? (
            <Button size="sm" onClick={() => onForge(job)}>
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Forge Resume
            </Button>
          ) : (
            <Link
              to={`/identity-forge?target=${job.id}`}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[3px] border border-border-strong font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-primary transition-colors duration-150 hover:border-signal-dim hover:bg-elevated"
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Forge Resume
            </Link>
          )}
          <Button
            size="sm"
            variant={saved ? 'primary' : 'secondary'}
            onClick={() => onToggleSave(job.id)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${job.title} at ${job.company} from saved targets` : `Save ${job.title} at ${job.company}`}
            className="whitespace-nowrap"
          >
            {saved ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save Target'}
          </Button>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(job.id)}
            className="mt-1 inline-flex items-center gap-1.5 self-start font-display text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-signal"
          >
            <Trash2 aria-hidden="true" className="h-3 w-3" />
            Remove this target
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}