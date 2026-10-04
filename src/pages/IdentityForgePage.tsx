import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Download, FileText, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import type { ForgeStage, ResumeSectionContent } from '@/types';
import { PasteResumeModal } from '@/components/inputs/CaptureModals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineMessage, Select } from '@/components/ui/Inputs';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { ScanLine } from '@/components/ui/Motion';
import { aiService, AIServiceError } from '@/services/ai/aiClient';
import { useAppState } from '@/state/AppStateContext';

const STAGES: { key: ForgeStage; label: string }[] = [
  { key: 'DOCUMENT_SELECTED', label: 'Document Selected' },
  { key: 'ANALYZING_TARGET', label: 'Analyzing Target' },
  { key: 'FORGING_RESUME', label: 'Forging Resume' },
  { key: 'IDENTITY_READY', label: 'Identity Ready' },
];

const STAGE_INDEX: Record<ForgeStage, number> = {
  IDLE: -1,
  DOCUMENT_SELECTED: 0,
  ANALYZING_TARGET: 1,
  FORGING_RESUME: 2,
  IDENTITY_READY: 3,
};

export function IdentityForgePage() {
  const [params, setParams] = useSearchParams();
  const reduced = useReducedMotion();
  const { jobs, resumes, profile, addResumeFromText, removeResume } = useAppState();

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(params.get('target'));
  const [stage, setStage] = useState<ForgeStage>('DOCUMENT_SELECTED');
  const [error, setError] = useState<string | null>(null);
  const [forged, setForged] = useState<ResumeSectionContent | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  const resume = useMemo(() => resumes.find((item) => item.id === resumeId) ?? resumes[0], [resumes, resumeId]);
  const job = useMemo(() => jobs.find((item) => item.id === jobId) ?? jobs[0], [jobs, jobId]);

  useEffect(() => {
    const target = params.get('target');
    if (target && jobs.some((item) => item.id === target)) setJobId(target);
  }, [params, jobs]);

  const busyStage: ForgeStage = busy ? (stage === 'DOCUMENT_SELECTED' ? 'ANALYZING_TARGET' : 'FORGING_RESUME') : stage;

  const runForge = async () => {
    setBusy(true);
    setError(null);
    setForged(null);
    setEditing(false);
    setStage('ANALYZING_TARGET');
    try {
      const result = await aiService.tailorResume({
        profile,
        baseResume: resume,
        jobAnalysis: job.analysis,
        jobDescription: job.description,
      });
      setStage('FORGING_RESUME');
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setForged(applyVariant(result.data, variant));
      setStage('IDENTITY_READY');
    } catch (caught) {
      setStage('DOCUMENT_SELECTED');
      setError(caught instanceof AIServiceError ? caught.message : 'Forge failed. Retry the operation.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    setBusy(true);
    setError(null);
    setStage('ANALYZING_TARGET');
    try {
      const result = await aiService.tailorResume({
        profile,
        baseResume: resume,
        jobAnalysis: job.analysis,
        jobDescription: job.description,
      });
      setStage('FORGING_RESUME');
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setForged(applyVariant(result.data, nextVariant));
      setStage('IDENTITY_READY');
    } catch (caught) {
      setStage('IDENTITY_READY');
      setError(caught instanceof AIServiceError ? caught.message : 'Regeneration failed. Retry the operation.');
    } finally {
      setBusy(false);
    }
  };

  const selectJob = (value: string) => {
    setJobId(value);
    setParams({ target: value }, { replace: true });
    setForged(null);
    setStage('DOCUMENT_SELECTED');
  };

  const selectResume = (value: string) => {
    setResumeId(value);
    setForged(null);
    setStage('DOCUMENT_SELECTED');
  };

  const startEditing = () => {
    setDraft(forged?.summary ?? '');
    setEditing(true);
  };

  const commitEdit = () => {
    if (forged && draft.trim()) setForged({ ...forged, summary: draft.trim() });
    setEditing(false);
  };

  const activeStageIndex = STAGE_INDEX[busyStage];
  // Once forging finishes, the final step is complete too — nothing stays "running".
  const finalStepDone = stage === 'IDENTITY_READY' && !busy;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm leading-relaxed text-secondary">
        Tailor a document to a target. Content is reordered and reworded only — no experience, employer, degree
        or date is ever invented. Processing below is simulated in Phase 01.
      </p>

      <Panel brackets className="u-shadow-panel">
        <PanelHeader label="Workflow" hint="Document → Target → Identity" />
        <PanelBody>
          <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STAGES.map((item, index) => {
              const done = activeStageIndex > index || (finalStepDone && index === STAGES.length - 1);
              const active = !finalStepDone && activeStageIndex === index;
              return (
                <li
                  key={item.key}
                  aria-current={active ? 'step' : undefined}
                  className={`relative flex flex-col gap-2 rounded-[3px] border px-4 py-3 transition-colors duration-300 ${
                    active
                      ? 'border-signal-dim bg-signal/10'
                      : done
                        ? 'border-success/25 bg-success/[0.05]'
                        : 'border-border-subtle bg-elevated/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[0.5625rem] font-semibold ${
                        done
                          ? 'border-success/40 text-success'
                          : active
                            ? 'border-signal-dim text-signal'
                            : 'border-border-strong text-muted'
                      }`}
                    >
                      {done ? <Check aria-hidden="true" className="h-3 w-3" /> : index + 1}
                    </span>
                    <span
                      className={`font-display text-[0.6875rem] font-semibold uppercase tracking-[0.1em] ${
                        active ? 'text-primary' : done ? 'text-secondary' : 'text-muted'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                  {active && busy ? (
                    <motion.span
                      className="h-0.5 w-full overflow-hidden rounded-full bg-border-strong"
                      aria-hidden="true"
                    >
                      <motion.span
                        className="block h-full bg-signal"
                        initial={{ width: reduced ? '100%' : '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                      />
                    </motion.span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </PanelBody>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Panel className="h-fit">
          <PanelHeader label="Inputs" />
          <PanelBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Select
                label="Base Document"
                value={resume.id}
                onChange={selectResume}
                options={resumes.map((item) => ({ value: item.id, label: item.label }))}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={() => setPasteOpen(true)}
                  className="inline-flex items-center gap-1.5 font-display text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-signal transition-colors hover:text-primary"
                >
                  <Plus aria-hidden="true" className="h-3 w-3" />
                  Paste my own
                </button>
                {!resume.isBase ? (
                  <button
                    type="button"
                    onClick={() => {
                      removeResume(resume.id);
                      setResumeId(null);
                      setForged(null);
                      setStage('DOCUMENT_SELECTED');
                    }}
                    className="inline-flex items-center gap-1.5 font-display text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-signal"
                  >
                    <Trash2 aria-hidden="true" className="h-3 w-3" />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <Select
              label="Target"
              value={job.id}
              onChange={selectJob}
              options={jobs.map((item) => ({ value: item.id, label: `${item.title} — ${item.company}` }))}
            />

            <div className="flex flex-col gap-2 rounded-[3px] border border-border-subtle bg-elevated/40 p-3.5">
              <p className="u-label">Target Brief</p>
              <p className="text-[0.8125rem] font-semibold text-primary">{job.title}</p>
              <p className="text-[0.75rem] text-muted">
                {job.company} · {job.location} · {job.workMode}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {job.analysis.requiredSkills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-[2px] border border-border-subtle bg-surface px-2 py-[3px] text-[0.6875rem] text-secondary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <Button variant="primary" fullWidth loading={busy} onClick={runForge} disabled={busy}>
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Forge Resume
            </Button>

            <p className="text-[0.6875rem] leading-relaxed text-muted">
              Development data. The generation call runs against the mock provider in Phase 01 and is routed to
              the server-side Gemma service in Phase 03.
            </p>
          </PanelBody>
        </Panel>

        <Panel className="relative overflow-hidden">
          <ScanLine active={busy} />
          <PanelHeader
            label="Identity"
            hint={forged ? `Ordering variant ${variant + 1}` : 'Awaiting forge'}
            action={
              forged ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={editing ? commitEdit : startEditing} disabled={busy}>
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                    {editing ? 'Save Edit' : 'Edit'}
                  </Button>
                  <Button size="sm" onClick={regenerate} loading={busy} disabled={busy}>
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                  <Button size="sm" variant="secondary" disabled title="Document export arrives with PDF generation in a later phase">
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              ) : (
                <Badge tone="LOW">No document</Badge>
              )
            }
          />

          <PanelBody>
            {error ? (
              <div className="mb-5">
                <InlineMessage tone="error" title="Forge failed" detail={error} />
              </div>
            ) : null}

            {!forged ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <FileText aria-hidden="true" className="h-8 w-8 text-border-strong" strokeWidth={1.4} />
                <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  No forged document yet
                </p>
                <p className="max-w-sm text-[0.8125rem] leading-relaxed text-muted">
                  Select a base document and a target, then run the forge to produce a tailored preview.
                </p>
              </div>
            ) : (
              <ResumeDocument content={forged} editing={editing} draft={draft} onDraftChange={setDraft} jobTitle={job.title} baseLabel={resume.label} />
            )}
          </PanelBody>
        </Panel>

        <PasteResumeModal
          open={pasteOpen}
          onClose={() => setPasteOpen(false)}
          onSubmit={(label, text) => {
            const added = addResumeFromText(label, text);
            setResumeId(added.id);
            setForged(null);
            setStage('DOCUMENT_SELECTED');
          }}
        />
      </div>
    </div>
  );
}

/** Rotates ordering only. Never adds or removes a claim. */
function applyVariant(content: ResumeSectionContent, variant: number): ResumeSectionContent {
  if (variant === 0) return content;
  const skills = [...content.skills];
  const shift = variant % skills.length;
  const rotated = [...skills.slice(shift), ...skills.slice(0, shift)];
  return { ...content, skills: rotated };
}

function ResumeDocument({
  content,
  editing,
  draft,
  onDraftChange,
  jobTitle,
  baseLabel,
}: {
  content: ResumeSectionContent;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  jobTitle: string;
  baseLabel: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="u-shadow-doc relative overflow-hidden rounded-[3px] border border-border-strong bg-surface"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle bg-elevated/70 px-5 py-2.5">
        <span className="font-display text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-muted">
          Confidential
        </span>
        <span className="font-display text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-muted">
          {jobTitle} · Tailored Variant
        </span>
      </div>

      <div className="flex flex-col gap-6 px-5 py-6 sm:px-8">
        <section>
          <DocumentHeading>Summary</DocumentHeading>
          {editing ? (
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              rows={5}
              aria-label="Summary"
              className="w-full rounded-[3px] border border-signal-dim bg-elevated px-3 py-2.5 text-sm leading-relaxed text-primary outline-none focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)]"
            />
          ) : (
            <p className="text-sm leading-relaxed text-secondary">{content.summary}</p>
          )}
        </section>

        <section>
          <DocumentHeading>Experience</DocumentHeading>
          <div className="flex flex-col gap-5">
            {content.experience.map((item) => (
              <div key={`${item.company}-${item.role}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-[0.875rem] font-semibold text-primary">{item.role}</p>
                  <p className="font-display text-[0.625rem] uppercase tracking-[0.14em] text-muted">{item.period}</p>
                </div>
                <p className="mt-0.5 text-[0.8125rem] text-secondary">
                  {item.company}
                </p>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-secondary">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal/70" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <DocumentHeading>Skills</DocumentHeading>
          <div className="flex flex-wrap gap-1.5">
            {content.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-[2px] border border-border-subtle bg-elevated/70 px-2 py-[3px] text-[0.6875rem] text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <DocumentHeading>Education</DocumentHeading>
          <p className="text-[0.8125rem] leading-relaxed text-secondary">{content.education}</p>
        </section>

        <section>
          <DocumentHeading>Projects</DocumentHeading>
          <ul className="flex flex-col gap-1.5">
            {content.projects.map((project) => (
              <li key={project} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-secondary">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal/70" />
                {project}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t border-border-subtle bg-elevated/40 px-5 py-2.5 sm:px-8">
        <p className="text-[0.625rem] leading-relaxed text-muted">
          Generated from {baseLabel}. Content is reordered from that document; no credentials are fabricated.
        </p>
      </div>
    </motion.article>
  );
}

function DocumentHeading({ children }: { children: string }) {
  return (
    <h3 className="mb-2.5 border-b border-border-subtle pb-1.5 font-display text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted">
      {children}
    </h3>
  );
}