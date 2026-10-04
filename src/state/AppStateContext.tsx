import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  CareerProfile,
  Job,
  JobListing,
  Operation,
  OperationStatus,
  Resume,
  WorkMode,
} from '@/types';
import { mockJobListings } from '@/data/mockJobs';
import { mockOperations } from '@/data/mockOperations';
import { mockProfile } from '@/data/mockProfile';
import { mockResumes } from '@/data/mockResumes';
import { deriveJob, deriveJobs } from '@/lib/matching';
import { parseResumeText } from '@/lib/resumeParser';
import { clearStored, createLocalId, isStorageAvailable, readStored, writeStored } from '@/lib/storage';
import { aiService } from '@/services/ai/aiClient';

/**
 * The operator's working set.
 *
 * This is the single place local data lives. Development data seeds it; anything
 * the operator adds (pasted job descriptions, pasted resumes, profile edits,
 * saved targets, operation status) is stored in the browser only.
 *
 * Match scores are never stored. They are derived on every read from the live
 * profile, so editing a skill immediately re-scores every target. Phase 2
 * replaces the persistence functions with Supabase without touching callers.
 */

const KEYS = {
  profile: 'profile',
  addedListings: 'added-listings',
  addedResumes: 'added-resumes',
  operations: 'operations',
  savedJobIds: 'saved-job-ids',
};

interface AppStateValue {
  /* Live, score-bearing views. Derived from listings + profile. */
  jobs: Job[];
  listings: JobListing[];
  resumes: Resume[];
  profile: CareerProfile;
  operations: Operation[];
  savedJobIds: string[];

  /* Capabilities, surfaced so the UI can be honest about persistence. */
  storageAvailable: boolean;
  lastWriteFailed: boolean;

  /* Profile */
  saveProfile: (profile: CareerProfile) => void;

  /* Targets */
  addTargetFromDescription: (input: {
    description: string;
    role?: string;
    company?: string;
    location?: string;
    workMode?: WorkMode;
  }) => Promise<Job>;
  removeTarget: (jobId: string) => void;

  /* Saved targets */
  isSaved: (jobId: string) => boolean;
  toggleSaved: (jobId: string) => void;

  /* Documents */
  addResumeFromText: (label: string, text: string) => Resume;
  removeResume: (resumeId: string) => void;

  /* Operations */
  advanceOperation: (operationId: string) => void;
  openOperation: (job: Job, note?: string) => void;
  removeOperation: (operationId: string) => void;

  /* Housekeeping */
  resetLocalData: () => void;
  dismissWriteFailure: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const storageReady = typeof window !== 'undefined' && isStorageAvailable();

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CareerProfile>(() => readStored(KEYS.profile, mockProfile));
  const [addedListings, setAddedListings] = useState<JobListing[]>(() => readStored<JobListing[]>(KEYS.addedListings, []));
  const [addedResumes, setAddedResumes] = useState<Resume[]>(() => readStored<Resume[]>(KEYS.addedResumes, []));
  const [operations, setOperations] = useState<Operation[]>(() => readStored(KEYS.operations, mockOperations));
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => readStored<string[]>(KEYS.savedJobIds, []));
  const [lastWriteFailed, setLastWriteFailed] = useState(false);

  // Development data first, then everything the operator added.
  const listings = useMemo(() => [...mockJobListings, ...addedListings], [addedListings]);
  const jobs = useMemo(() => deriveJobs(listings, profile), [listings, profile]);
  const resumes = useMemo(() => [...mockResumes, ...addedResumes], [addedResumes]);

  /* ---------------------------------------------------------------- persist */

  useEffect(() => {
    if (!storageReady) return;
    if (writeStored(KEYS.profile, profile) === 'failed') setLastWriteFailed(true);
  }, [profile]);

  useEffect(() => {
    if (!storageReady) return;
    if (writeStored(KEYS.addedListings, addedListings) === 'failed') setLastWriteFailed(true);
  }, [addedListings]);

  useEffect(() => {
    if (!storageReady) return;
    if (writeStored(KEYS.addedResumes, addedResumes) === 'failed') setLastWriteFailed(true);
  }, [addedResumes]);

  useEffect(() => {
    if (!storageReady) return;
    if (writeStored(KEYS.operations, operations) === 'failed') setLastWriteFailed(true);
  }, [operations]);

  useEffect(() => {
    if (!storageReady) return;
    if (writeStored(KEYS.savedJobIds, savedJobIds) === 'failed') setLastWriteFailed(true);
  }, [savedJobIds]);

  /* ---------------------------------------------------------------- profile */

  const saveProfile = useCallback((next: CareerProfile) => setProfile(next), []);

  /* ---------------------------------------------------------------- targets */

  const addTargetFromDescription = useCallback<AppStateValue['addTargetFromDescription']>(
    async ({ description, role, company, location, workMode }) => {
      const { data: analysis } = await aiService.analyzeJob({
        jobDescription: description,
        roleHint: role?.trim() || undefined,
        companyHint: company?.trim() || undefined,
      });

      const resolvedWorkMode = workMode ?? detectWorkMode(`${analysis.location} ${description}`);
      const listing: JobListing = {
        id: createLocalId('tgt'),
        title: analysis.role,
        company: analysis.company,
        location: location?.trim() || analysis.location || 'NOT SPECIFIED',
        workMode: resolvedWorkMode,
        source: 'PASTED DESCRIPTION',
        postedAt: new Date().toISOString(),
        description: description.trim(),
        skills: [...analysis.requiredSkills, ...analysis.preferredSkills],
        analysis: {
          ...analysis,
          // Keep what the operator typed; the extractor only fills the gaps.
          location: location?.trim() || analysis.location,
        },
        isUserAdded: true,
      };

      setAddedListings((current) => [listing, ...current]);
      return deriveJob(listing, profile);
    },
    [profile],
  );

  const removeTarget = useCallback((jobId: string) => {
    setAddedListings((current) => current.filter((listing) => listing.id !== jobId));
    setSavedJobIds((current) => current.filter((id) => id !== jobId));
  }, []);

  /* ----------------------------------------------------------------- saved */

  const isSaved = useCallback((jobId: string) => savedJobIds.includes(jobId), [savedJobIds]);

  const toggleSaved = useCallback((jobId: string) => {
    setSavedJobIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [jobId, ...current],
    );
  }, []);

  /* -------------------------------------------------------------- documents */

  const addResumeFromText = useCallback<AppStateValue['addResumeFromText']>((label, text) => {
    const parsed = parseResumeText(text);
    const resume: Resume = {
      id: createLocalId('doc'),
      label: label.trim() || 'PASTED DOCUMENT',
      fileName: `pasted_${new Date().toISOString().slice(0, 10)}.txt`,
      updatedAt: new Date().toISOString().slice(0, 10),
      isBase: false,
      content: parsed.content,
    };
    setAddedResumes((current) => [resume, ...current]);
    return resume;
  }, []);

  const removeResume = useCallback((resumeId: string) => {
    setAddedResumes((current) => current.filter((resume) => resume.id !== resumeId));
  }, []);

  /* ------------------------------------------------------------- operations */

  const advanceOperation = useCallback((operationId: string) => {
    setOperations((current) =>
      current.map((operation) =>
        operation.id === operationId ? { ...operation, status: nextStatus(operation.status) } : operation,
      ),
    );
  }, []);

  const openOperation = useCallback<AppStateValue['openOperation']>((job, note) => {
    setOperations((current) => {
      if (current.some((operation) => operation.jobId === job.id)) return current;
      const operation: Operation = {
        id: createLocalId('op'),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        date: new Date().toISOString().slice(0, 10),
        // Snapshot only for display continuity; the live score always wins on read.
        matchScore: job.matchScore,
        status: 'SAVED',
        note: note ?? 'Operation opened from the intel feed.',
      };
      return [operation, ...current];
    });
  }, []);

  const removeOperation = useCallback((operationId: string) => {
    setOperations((current) => current.filter((operation) => operation.id !== operationId));
  }, []);

  /* ----------------------------------------------------------- housekeeping */

  const resetLocalData = useCallback(() => {
    for (const key of Object.values(KEYS)) clearStored(key);
    setProfile(mockProfile);
    setAddedListings([]);
    setAddedResumes([]);
    setOperations(mockOperations);
    setSavedJobIds([]);
    setLastWriteFailed(false);
  }, []);

  const dismissWriteFailure = useCallback(() => setLastWriteFailed(false), []);

  const value = useMemo<AppStateValue>(
    () => ({
      jobs,
      listings,
      resumes,
      profile,
      operations,
      savedJobIds,
      storageAvailable: storageReady,
      lastWriteFailed,
      saveProfile,
      addTargetFromDescription,
      removeTarget,
      isSaved,
      toggleSaved,
      addResumeFromText,
      removeResume,
      advanceOperation,
      openOperation,
      removeOperation,
      resetLocalData,
      dismissWriteFailure,
    }),
    [
      jobs,
      listings,
      resumes,
      profile,
      operations,
      savedJobIds,
      lastWriteFailed,
      saveProfile,
      addTargetFromDescription,
      removeTarget,
      isSaved,
      toggleSaved,
      addResumeFromText,
      removeResume,
      advanceOperation,
      openOperation,
      removeOperation,
      resetLocalData,
      dismissWriteFailure,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const NEXT_STATUS: Record<OperationStatus, OperationStatus> = {
  SAVED: 'APPLIED',
  APPLIED: 'INTERVIEW',
  INTERVIEW: 'OFFER',
  REJECTED: 'SAVED',
  OFFER: 'OFFER',
};

function nextStatus(status: OperationStatus): OperationStatus {
  return NEXT_STATUS[status];
}

function detectWorkMode(text: string): WorkMode {
  const lower = text.toLowerCase();
  if (/\b(remote|work from home|distributed|anywhere)\b/.test(lower)) return 'REMOTE';
  if (/\b(hybrid|flexible location)\b/.test(lower)) return 'HYBRID';
  if (/\b(on-?site|in office|in-office|onsite)\b/.test(lower)) return 'ONSITE';
  return 'HYBRID';
}