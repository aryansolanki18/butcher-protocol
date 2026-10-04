import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';
import type { CareerProfile, WorkMode } from '@/types';
import { formatDate } from '@/lib/matching';
import { Button } from '@/components/ui/Button';
import { Field, InlineMessage } from '@/components/ui/Inputs';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { useAppState } from '@/state/AppStateContext';

type SectionKey = keyof CareerProfile;

const SECTIONS: { key: SectionKey; label: string; hint: string }[] = [
  { key: 'personal', label: 'Personal', hint: 'Operator identity' },
  { key: 'education', label: 'Education', hint: 'Academic record' },
  { key: 'skills', label: 'Skills', hint: 'Genuine capabilities' },
  { key: 'careerTargets', label: 'Career Targets', hint: 'Desired direction' },
  { key: 'links', label: 'Links', hint: 'Public presence' },
];

export function ProfilePage() {
  const reduced = useReducedMotion();
  const { profile, saveProfile, jobs, storageAvailable, resetLocalData } = useAppState();
  const [draft, setDraft] = useState<CareerProfile>(profile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile]);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
    setSaved(false);
  };

  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const commit = () => {
    saveProfile(draft);
    setEditing(false);
    setSaved(true);
  };

  const update = <K extends SectionKey>(section: K, patch: Partial<CareerProfile[K]>) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
  };

  const updateList = (section: 'skills', key: keyof CareerProfile['skills'], value: string) => {
    const list = draft[section][key].filter((item) => item.trim() !== '');
    update(section, { [key]: value ? [...list, value] : list } as Partial<CareerProfile['skills']>);
  };

  const removeListItem = (section: 'skills', key: keyof CareerProfile['skills'], item: string) => {
    update(section, { [key]: draft[section][key].filter((entry) => entry !== item) } as Partial<CareerProfile['skills']>);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          This profile is the single source of every match score in the product. Add or remove a skill here and all{' '}
          <span className="u-num text-primary">{jobs.length}</span> targets re-score immediately.
        </p>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button onClick={cancel} disabled={!changed}>
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button variant="primary" onClick={commit} disabled={!changed}>
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                Save Profile
              </Button>
            </>
          ) : (
            <>
              {saved ? (
                <span className="font-display text-[0.6875rem] uppercase tracking-[0.14em] text-success">
                  Saved locally
                </span>
              ) : null}
              <Button onClick={startEdit}>
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {!storageAvailable ? (
        <InlineMessage
          tone="error"
          title="Browser storage unavailable"
          detail="This browser is blocking local storage, so your profile will reset when you close the tab. Everything else still works for this session."
        />
      ) : null}

      <motion.div layout={!reduced} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {SECTIONS.map((section) => (
          <motion.div
            key={section.key}
            layout={!reduced}
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Panel className="h-full">
              <PanelHeader label={section.label} hint={section.hint} />
              <PanelBody className="flex flex-col gap-4">
                <SectionFields section={section.key} profile={draft} editing={editing} onUpdate={update} />

                {section.key === 'skills' ? (
                  <SkillEditor profile={draft} editing={editing} onAdd={updateList} onRemove={removeListItem} />
                ) : null}
              </PanelBody>
            </Panel>
          </motion.div>
        ))}

        <Panel className="h-fit">
          <PanelHeader label="Record" hint="Local data" />
          <PanelBody>
            <dl className="flex flex-col gap-2.5 text-[0.8125rem]">
              <MetaRow label="Declared skills" value={String(allSkills(draft).length)} />
              <MetaRow label="Targets scored" value={String(jobs.length)} />
              <MetaRow label="Persistence" value={storageAvailable ? 'Browser local storage' : 'Session only'} />
              <MetaRow label="Loadout" value={formatDate(new Date().toISOString())} />
            </dl>
            <p className="mt-4 border-t border-border-subtle pt-4 text-[0.75rem] leading-relaxed text-muted">
              Nothing here is uploaded. Supabase persistence is scheduled for Phase 02 and will keep this same
              shape, so the screen keeps working unchanged.
            </p>

            <div className="mt-5 border-t border-border-subtle pt-4">
              {confirmReset ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[0.8125rem] leading-relaxed text-secondary">
                    This clears your profile, pasted targets, pasted documents, saved targets and operations on
                    this machine. It cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setConfirmReset(false)}>
                      Keep My Data
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        resetLocalData();
                        setConfirmReset(false);
                        setEditing(false);
                        setSaved(false);
                      }}
                    >
                      Erase Everything
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  Reset Local Data
                </Button>
              )}
            </div>
          </PanelBody>
        </Panel>
      </motion.div>
    </div>
  );
}

type UpdateFn = <K extends SectionKey>(section: K, patch: Partial<CareerProfile[K]>) => void;

function SectionFields({
  section,
  profile,
  editing,
  onUpdate,
}: {
  section: SectionKey;
  profile: CareerProfile;
  editing: boolean;
  onUpdate: UpdateFn;
}) {
  if (section === 'personal') {
    return (
      <>
        <ReadField label="Name" value={profile.personal.name} editing={editing} onChange={(name) => onUpdate('personal', { name })} />
        <ReadField label="Email" value={profile.personal.email} editing={editing} onChange={(email) => onUpdate('personal', { email })} />
        <ReadField label="Location" value={profile.personal.location} editing={editing} onChange={(location) => onUpdate('personal', { location })} />
      </>
    );
  }
  if (section === 'education') {
    return (
      <>
        <ReadField label="Degree" value={profile.education.degree} editing={editing} onChange={(degree) => onUpdate('education', { degree })} />
        <ReadField label="College" value={profile.education.college} editing={editing} onChange={(college) => onUpdate('education', { college })} />
        <ReadField label="Graduation Year" value={profile.education.graduationYear} editing={editing} onChange={(graduationYear) => onUpdate('education', { graduationYear })} />
      </>
    );
  }
  if (section === 'careerTargets') {
    return (
      <>
        <ListField
          label="Desired Roles"
          values={profile.careerTargets.desiredRoles}
          editing={editing}
          onChange={(desiredRoles) => onUpdate('careerTargets', { desiredRoles })}
        />
        <ListField
          label="Locations"
          values={profile.careerTargets.locations}
          editing={editing}
          onChange={(locations) => onUpdate('careerTargets', { locations })}
        />
        <Field label="Remote Preference">
          {(id) => (
            <select
              id={id}
              value={profile.careerTargets.remotePreference}
              disabled={!editing}
              onChange={(event) =>
                onUpdate('careerTargets', { remotePreference: event.target.value as WorkMode })
              }
              className="w-full cursor-pointer rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary outline-none disabled:cursor-default focus:border-signal-dim"
            >
              <option value="REMOTE" className="bg-surface">Remote</option>
              <option value="HYBRID" className="bg-surface">Hybrid</option>
              <option value="ONSITE" className="bg-surface">On-site</option>
            </select>
          )}
        </Field>
      </>
    );
  }
  if (section === 'links') {
    return (
      <>
        <ReadField label="GitHub" value={profile.links.github} editing={editing} onChange={(github) => onUpdate('links', { github })} />
        <ReadField label="LinkedIn" value={profile.links.linkedin} editing={editing} onChange={(linkedin) => onUpdate('links', { linkedin })} />
      </>
    );
  }
  return null;
}

function SkillEditor({
  profile,
  editing,
  onAdd,
  onRemove,
}: {
  profile: CareerProfile;
  editing: boolean;
  onAdd: (section: 'skills', key: keyof CareerProfile['skills'], value: string) => void;
  onRemove: (section: 'skills', key: keyof CareerProfile['skills'], item: string) => void;
}) {
  const groups: { key: keyof CareerProfile['skills']; label: string }[] = [
    { key: 'programming', label: 'Programming' },
    { key: 'aiml', label: 'AI / ML' },
    { key: 'data', label: 'Data' },
    { key: 'tools', label: 'Tools' },
  ];

  return (
    <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-2">
      {groups.map((group) => (
        <SkillGroup
          key={group.key}
          label={group.label}
          items={profile.skills[group.key]}
          editing={editing}
          onAdd={(value) => onAdd('skills', group.key, value)}
          onRemove={(item) => onRemove('skills', group.key, item)}
        />
      ))}
    </div>
  );
}

function SkillGroup({
  label,
  items,
  editing,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  editing: boolean;
  onAdd: (value: string) => void;
  onRemove: (item: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="u-label">{label}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item}>
            <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-border-subtle bg-elevated/60 px-2 py-[3px] text-[0.6875rem] text-secondary">
              {item}
              {editing ? (
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                  className="text-muted transition-colors hover:text-signal"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {editing ? (
        <input
          type="text"
          placeholder={`Add ${label.toLowerCase()} skill`}
          aria-label={`Add ${label} skill`}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const value = event.currentTarget.value.trim();
            if (!value) return;
            onAdd(value);
            event.currentTarget.value = '';
          }}
          className="rounded-[3px] border border-border-subtle bg-elevated/70 px-2.5 py-1.5 text-[0.75rem] text-primary placeholder:text-muted/70 outline-none focus:border-signal-dim"
        />
      ) : null}
    </div>
  );
}

function ReadField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="text"
          value={value}
          disabled={!editing}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary outline-none disabled:cursor-default disabled:bg-transparent disabled:text-secondary focus:border-signal-dim focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)]"
        />
      )}
    </Field>
  );
}

function ListField({
  label,
  values,
  editing,
  onChange,
}: {
  label: string;
  values: string[];
  editing: boolean;
  onChange: (values: string[]) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="text"
          value={values.join(', ')}
          disabled={!editing}
          onChange={(event) => onChange(event.target.value.split(',').map((value) => value.trim()))}
          className="w-full rounded-[3px] border border-border-subtle bg-elevated/70 px-3 py-2.5 text-sm text-primary outline-none disabled:cursor-default disabled:bg-transparent disabled:text-secondary focus:border-signal-dim focus:shadow-[0_0_0_3px_rgba(225,29,56,0.12)]"
        />
      )}
    </Field>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="text-secondary">{value}</dd>
    </div>
  );
}

function allSkills(profile: CareerProfile): string[] {
  return [...profile.skills.programming, ...profile.skills.aiml, ...profile.skills.data, ...profile.skills.tools];
}