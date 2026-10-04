export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type OperationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'OFFER';

/** Score tiers drive status colour. Never colour-only in the UI. */
export type ScoreTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Structured job analysis. This is the shape Gemma 4 31B IT returns in Phase 3;
 * today it is produced by the mock engine or hand-authored as development data.
 * It carries no score by design — extraction and scoring are separate concerns.
 */
export interface JobAnalysis {
  role: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  education: string;
  location: string;
  employmentType: string;
  summary: string;
  responsibilities: string[];
}

/** Deterministic application-logic output. Never produced by the model. */
export interface MatchAnalysis {
  score: number;
  tier: ScoreTier;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * A job listing exactly as it arrives from a source, with the structured
 * analysis. Holds no score: everything below `matchScore` is derived from the
 * operator's live profile, so editing the profile re-scores every target.
 */
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  source: string;
  postedAt: string;
  description: string;
  skills: string[];
  analysis: JobAnalysis;
  /** True when the operator added it by pasting a description. */
  isUserAdded?: boolean;
}

/** A listing joined with a deterministic match, computed against a profile. */
export interface Job extends JobListing {
  /** Computed by deterministic logic in `src/lib/matching.ts`, not by AI. */
  matchScore: number;
  priority: Priority;
  match: MatchAnalysis;
}

export interface Operation {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  date: string;
  matchScore: number;
  status: OperationStatus;
  note: string;
}

export interface SkillGroups {
  programming: string[];
  aiml: string[];
  data: string[];
  tools: string[];
}

export interface CareerProfile {
  personal: {
    name: string;
    email: string;
    location: string;
  };
  education: {
    degree: string;
    college: string;
    graduationYear: string;
  };
  skills: SkillGroups;
  careerTargets: {
    desiredRoles: string[];
    locations: string[];
    remotePreference: WorkMode;
  };
  links: {
    github: string;
    linkedin: string;
  };
}

export interface ResumeExperience {
  company: string;
  role: string;
  period: string;
  points: string[];
}

export interface ResumeSectionContent {
  summary: string;
  experience: ResumeExperience[];
  skills: string[];
  education: string;
  projects: string[];
}

export interface Resume {
  id: string;
  label: string;
  fileName: string;
  updatedAt: string;
  isBase: boolean;
  content: ResumeSectionContent;
}

export type ForgeStage = 'IDLE' | 'DOCUMENT_SELECTED' | 'ANALYZING_TARGET' | 'FORGING_RESUME' | 'IDENTITY_READY';

export interface IntelItem {
  id: string;
  kind: 'TARGET_ACQUIRED' | 'MATCH_UPDATED' | 'OPERATION_MOVED' | 'SCAN_COMPLETE';
  headline: string;
  detail: string;
  timestamp: string;
  severity: Priority;
}