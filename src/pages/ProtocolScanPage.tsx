import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Plus, ScanLine as ScanIcon } from 'lucide-react';
import { PasteResumeModal } from '@/components/inputs/CaptureModals';
import { aiService, AIServiceError } from '@/services/ai/aiClient';
import { ATS_DISCLAIMER } from '@/lib/ats';
import type { ATSAnalysis, ATSExtraction } from '@/types/ai';
import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineMessage, Select } from '@/components/ui/Inputs';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { ProgressBar, ProgressRing } from '@/components/ui/ProgressRing';
import { ScanLine } from '@/components/ui/Motion';
import { useAppState } from '@/state/AppStateContext';

type ScanState = 'IDLE' | 'SCANNING' | 'COMPLETE' | 'ERROR';

export function ProtocolScanPage() {
  const reduced = useReducedMotion();
  const { jobs, resumes, addResumeFromText } = useAppState();

  const [jobId, setJobId] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [result, setResult] = useState<{ extraction: ATSExtraction; estimate: ATSAnalysis } | null>(null);

  const job = useMemo(() => jobs.find((item) => item.id === jobId) ?? jobs[0], [jobs, jobId]);
  const resume = useMemo(() => resumes.find((item) => item.id === resumeId) ?? resumes[0], [resumes, resumeId]);

  const runScan = async () => {
    setState('SCANNING');
    setError(null);
    try {
      const analysis = await aiService.analyzeATS({
        resume: resume.content,
        jobAnalysis: job.analysis,
        jobDescription: job.description,
      });
      setResult(analysis.data);
      setState('COMPLETE');
    } catch (caught) {
      setState('ERROR');
      setError(caught instanceof AIServiceError ? caught.message : 'Scan failed. Retry the operation.');
    }
  };

  const reset = () => {
    setState('IDLE');
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-[4px] border border-border-subtle bg-surface px-4 py-3">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-intel" />
        <p className="text-[0.8125rem] leading-relaxed text-secondary">
          <span className="font-display font-semibold uppercase tracking-[0.1em] text-primary">
            Internal compatibility estimate.
          </span>{' '}
          Every figure below is produced by deterministic application logic from an internal keyword and skill
          comparison. It is not a universal ATS score, not an official assessment, and not a prediction of any
          employer's screening decision. Scan results use development data.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Panel className="h-fit">
          <PanelHeader label="Scan Configuration" />
          <PanelBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Select
                label="Document"
                value={resume.id}
                onChange={(value) => {
                  setResumeId(value);
                  reset();
                }}
                options={resumes.map((item) => ({ value: item.id, label: item.label }))}
              />
              <button
                type="button"
                onClick={() => setPasteOpen(true)}
                className="inline-flex w-fit items-center gap-1.5 font-display text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-signal transition-colors hover:text-primary"
              >
                <Plus aria-hidden="true" className="h-3 w-3" />
                Paste my own
              </button>
            </div>
            <Select
              label="Target"
              value={job.id}
              onChange={(value) => {
                setJobId(value);
                reset();
              }}
              options={jobs.map((item) => ({ value: item.id, label: `${item.title} — ${item.company}` }))}
            />

            <Button variant="primary" fullWidth loading={state === 'SCANNING'} onClick={runScan} disabled={state === 'SCANNING'}>
              <ScanIcon aria-hidden="true" className="h-4 w-4" />
              {state === 'COMPLETE' ? 'Rescan' : 'Run Scan'}
            </Button>

            {state !== 'IDLE' ? (
              <Button fullWidth onClick={reset} disabled={state === 'SCANNING'}>
                Clear Results
              </Button>
            ) : null}

            <dl className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-[0.75rem]">
              <Row label="Document" value={resume.fileName} />
              <Row label="Target" value={`${job.company} · ${job.analysis.role}`} />
              <Row label="Engine" value="Gemma 4 31B IT (Phase 03)" />
              <Row label="Status" value={state} />
            </dl>
          </PanelBody>
        </Panel>

        <div className="flex flex-col gap-6">
          {state === 'IDLE' ? (
            <>
              <Panel>
                <PanelHeader label="Diagnostics" hint="Awaiting scan" />
                <PanelBody className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <ScanIcon aria-hidden="true" className="h-8 w-8 text-border-strong" strokeWidth={1.4} />
                  <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    No diagnostic data
                  </p>
                  <p className="max-w-sm text-[0.8125rem] leading-relaxed text-muted">
                    Run a protocol scan to compare the selected document against the target's requirements.
                  </p>
                </PanelBody>
              </Panel>

              <Panel>
                <PanelHeader label="Measurement Basis" hint="How the estimate is computed" />
                <PanelBody>
                  <dl className="grid gap-5 sm:grid-cols-3">
                    <BasisRow
                      label="Keyword Coverage"
                      weight="45%"
                      detail="Share of significant job-description terms that appear in the document."
                    />
                    <BasisRow
                      label="Skill Match"
                      weight="45%"
                      detail="Share of listed required and preferred skills present in the document."
                    />
                    <BasisRow
                      label="Structure"
                      weight="10%"
                      detail="Completeness of the declared skills section, capped at twelve entries."
                    />
                  </dl>
                  <p className="mt-5 border-t border-border-subtle pt-4 text-[0.75rem] leading-relaxed text-muted">
                    These weights live in <code className="text-secondary">src/lib/ats.ts</code> and are fixed in
                    application logic. The model extracts evidence; it never returns a score.
                  </p>
                </PanelBody>
              </Panel>
            </>
          ) : null}

          {state === 'ERROR' ? (
            <InlineMessage tone="error" title="Scan failed" detail={error ?? 'Unknown error.'} />
          ) : null}

          {state !== 'IDLE' ? (
            <div className="flex flex-col gap-6">
              <ScanDiagnostics active={state === 'SCANNING'} jobTitle={job.analysis.role} company={job.company} />

              {state === 'SCANNING' ? (
                <Panel>
                  <PanelBody className="flex flex-col items-center justify-center gap-4 py-16">
                    <motion.div
                      className="h-10 w-10 rounded-full border-2 border-border-strong border-t-signal"
                      animate={reduced ? undefined : { rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      aria-hidden="true"
                    />
                    <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      Scanning — simulated processing
                    </p>
                  </PanelBody>
                </Panel>
              ) : null}

              {result && state === 'COMPLETE' ? (
                <>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                  >
                    <MetricCard label="ATS Readiness" value={result.estimate.matchScore} detail="Internal estimate" />
                    <MetricCard label="Keyword Coverage" value={result.estimate.keywordCoverage} detail="Job terms present" />
                    <MetricCard label="Skill Match" value={result.estimate.skillMatch} detail="Listed skills matched" />
                  </motion.div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Panel>
                      <PanelHeader label="Matched Skills" hint={`${result.extraction.matchedSkills.length} found`} />
                      <PanelBody>
                        {result.extraction.matchedSkills.length === 0 ? (
                          <p className="text-[0.8125rem] text-muted">No listed skill appears in the document.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {result.extraction.matchedSkills.map((skill) => (
                              <Chip key={skill} state="matched">
                                {skill}
                              </Chip>
                            ))}
                          </div>
                        )}
                        <div className="mt-5 border-t border-border-subtle pt-4">
                          <p className="u-label mb-2">Matched Keywords</p>
                          <p className="text-[0.75rem] leading-relaxed text-secondary">
                            {result.extraction.matchedKeywords.length} job terms appear in the document.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {result.extraction.matchedKeywords.slice(0, 18).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-[2px] border border-border-subtle bg-elevated/60 px-2 py-[3px] text-[0.6875rem] text-secondary"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </PanelBody>
                    </Panel>

                    <Panel>
                      <PanelHeader
                        label="Missing Skills"
                        hint={`${result.extraction.missingSkills.length} gaps`}
                        action={
                          result.extraction.missingSkills.length > 0 ? (
                            <Badge tone="AMBER" dot>
                              <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                              Action needed
                            </Badge>
                          ) : (
                            <Badge tone="SUCCESS" dot>
                              <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                              No gaps
                            </Badge>
                          )
                        }
                      />
                      <PanelBody>
                        {result.extraction.missingSkills.length === 0 ? (
                          <p className="text-[0.8125rem] text-muted">
                            Every listed skill appears in the document. Verify this is accurate before relying on it.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {result.extraction.missingSkills.map((skill) => (
                              <Chip key={skill} state="missing">
                                {skill}
                              </Chip>
                            ))}
                          </div>
                        )}
                        <div className="mt-5 border-t border-border-subtle pt-4">
                          <p className="u-label mb-2">Observations</p>
                          <ul className="flex flex-col gap-2">
                            {result.extraction.observations.map((observation) => (
                              <li key={observation} className="text-[0.75rem] leading-relaxed text-secondary">
                                {observation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </PanelBody>
                    </Panel>
                  </div>

                  <Panel>
                    <PanelHeader label="Recommendations" hint="Derived from observed gaps" />
                    <PanelBody>
                      <ol className="flex flex-col gap-3">
                        {result.estimate.recommendations.map((recommendation, index) => (
                          <li key={recommendation} className="flex gap-3 text-[0.8125rem] leading-relaxed text-secondary">
                            <span className="u-num shrink-0 text-xs text-signal">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            {recommendation}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-5 border-t border-border-subtle pt-4 text-[0.6875rem] leading-relaxed text-muted">
                        {ATS_DISCLAIMER}
                      </p>
                    </PanelBody>
                  </Panel>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <PasteResumeModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSubmit={(label, text) => {
          const added = addResumeFromText(label, text);
          setResumeId(added.id);
          reset();
        }}
      />
    </div>
  );
}

function BasisRow({ label, weight, detail }: { label: string; weight: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-primary">
          {label}
        </dt>
        <span className="u-num text-xs text-signal">{weight}</span>
      </div>
      <dd className="text-[0.75rem] leading-relaxed text-muted">{detail}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="truncate text-secondary">{value}</dd>
    </div>
  );
}

function ScanDiagnostics({ active, jobTitle, company }: { active: boolean; jobTitle: string; company: string }) {
  return (
    <Panel className="relative overflow-hidden">
      <ScanLine active={active} />
      <PanelHeader label="Diagnostics" hint={active ? 'Scan in progress' : 'Scan complete'} />
      <PanelBody>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: '01', label: 'Parse document', state: active ? 'RUNNING' : 'COMPLETE' },
            { step: '02', label: 'Extract requirements', state: active ? 'RUNNING' : 'COMPLETE' },
            { step: '03', label: 'Compare and score', state: active ? 'PENDING' : 'COMPLETE' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-1.5 rounded-[3px] border border-border-subtle bg-elevated/40 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="u-num text-[0.625rem] text-muted">{item.step}</span>
                <Badge tone={item.state === 'COMPLETE' ? 'SUCCESS' : item.state === 'RUNNING' ? 'CRITICAL' : 'LOW'} dot>
                  {item.state}
                </Badge>
              </div>
              <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-primary">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.75rem] text-muted">
          Subject: {jobTitle} · {company}
        </p>
      </PanelBody>
    </Panel>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}>
      <Panel brackets className="h-full">
        <PanelBody className="flex flex-col items-center gap-3 text-center">
          <ProgressRing value={value} size={92} label={label} showLabel={false} />
          <div>
            <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {label}
            </p>
            <p className="mt-1 text-[0.6875rem] text-muted">{detail}</p>
          </div>
          <ProgressBar value={value} delay={0.15} height={3} />
        </PanelBody>
      </Panel>
    </motion.div>
  );
}