import { useState } from 'react';
import { ClipboardPaste, FilePlus2 } from 'lucide-react';
import type { WorkMode } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, InlineMessage, Select } from '@/components/ui/Inputs';
import { Modal } from '@/components/ui/Modal';

/**
 * Capture a real job description.
 *
 * This is the input the product was missing in Phase 1: the operator pastes a
 * listing from anywhere on the web, optionally names the role and company, and
 * the system analyses that text instead of reading from a fixed registry.
 * Nothing is uploaded — extraction happens in the browser.
 */

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
];

const MIN_LENGTH = 120;

interface PasteTargetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    description: string;
    role?: string;
    company?: string;
    location?: string;
    workMode?: WorkMode;
  }) => Promise<void>;
}

export function PasteTargetModal({ open, onClose, onSubmit }: PasteTargetModalProps) {
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = description.trim().length < MIN_LENGTH;

  const reset = () => {
    setDescription('');
    setRole('');
    setCompany('');
    setLocation('');
    setWorkMode('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (tooShort) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        description,
        role,
        company,
        location,
        workMode: workMode || undefined,
      });
      reset();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not analyse that description. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      wide
      title="Acquire Target From Description"
      subtitle="Paste a listing from anywhere. It is analysed in this browser and added to your registry."
      footer={
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={busy} disabled={tooShort}>
            <ClipboardPaste aria-hidden="true" className="h-3.5 w-3.5" />
            Analyse And Add
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field
          label="Job Description"
          required
          hint={tooShort ? `Minimum ${MIN_LENGTH} characters` : `${description.trim().length} characters`}
          error={tooShort && description.length > 0 ? 'Paste the full description, not just the title.' : undefined}
        >
          {(id) => (
            <textarea
              id={id}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={9}
              placeholder="Paste the full job description here — responsibilities, requirements, skills. The more you paste, the more accurate the analysis."
              className={`w-full resize-y rounded-[3px] border bg-elevated/70 px-3 py-2.5 text-sm leading-relaxed text-primary placeholder:text-muted/70 outline-none focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)] ${
                tooShort && description.length > 0 ? 'border-signal-dim' : 'border-border-subtle'
              }`}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Role" hint="optional">
            {(id) => (
              <input
                id={id}
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Machine Learning Engineer"
                className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary placeholder:text-muted/70 outline-none focus:border-signal-dim"
              />
            )}
          </Field>

          <Field label="Company" hint="optional">
            {(id) => (
              <input
                id={id}
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Your target company"
                className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary placeholder:text-muted/70 outline-none focus:border-signal-dim"
              />
            )}
          </Field>

          <Field label="Location" hint="optional">
            {(id) => (
              <input
                id={id}
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Bengaluru, India"
                className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary placeholder:text-muted/70 outline-none focus:border-signal-dim"
              />
            )}
          </Field>

          <Select
            label="Work Mode"
            value={workMode}
            onChange={(value) => setWorkMode(value as WorkMode | '')}
            options={[{ value: '', label: 'Detect from description' }, ...WORK_MODE_OPTIONS]}
          />
        </div>

        {error ? <InlineMessage tone="error" title="Analysis failed" detail={error} /> : null}

        <InlineMessage
          tone="info"
          title="Stays on this machine"
          detail="The text is parsed in your browser and stored in local storage only. Nothing is uploaded, and no key is used. In Phase 3 the same flow is handed to Gemma 4 31B IT on the server."
        />
      </div>
    </Modal>
  );
}

interface PasteResumeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (label: string, text: string) => void;
}

/**
 * Capture the operator's own document. Plain text only — no upload, no
 * parsing of binary files, nothing transmitted.
 */
export function PasteResumeModal({ open, onClose, onSubmit }: PasteResumeModalProps) {
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');

  const tooShort = text.trim().length < 80;

  const handleSubmit = () => {
    if (tooShort) return;
    onSubmit(label, text);
    setLabel('');
    setText('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Add Your Own Document"
      subtitle="Paste your resume as plain text. Common headings are detected automatically."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={tooShort}>
            <FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />
            Add Document
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Label" hint="optional">
          {(id) => (
            <input
              id={id}
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="MY RESUME — BACKEND"
              className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary placeholder:text-muted/70 outline-none focus:border-signal-dim"
            />
          )}
        </Field>

        <Field
          label="Resume Text"
          required
          hint={tooShort ? 'Minimum 80 characters' : `${text.trim().length} characters`}
        >
          {(id) => (
            <textarea
              id={id}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={14}
              placeholder={'Summary\nThree years building data platforms…\n\nExperience\nSenior Engineer, Acme — Jan 2021 — Present\n• Rebuilt the ingestion layer…'}
              className="w-full resize-y rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 font-mono text-[0.8125rem] leading-relaxed text-primary placeholder:text-muted/60 outline-none focus:border-signal-dim focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)]"
            />
          )}
        </Field>

        <InlineMessage
          tone="info"
          title="Headings that are recognised"
          detail="Summary, Profile, Objective, Skills, Education, Projects, Experience. Dated lines such as 'Engineer, Acme — Jan 2021 — Present' become experience entries; the lines beneath them become bullet points."
        />
      </div>
    </Modal>
  );
}