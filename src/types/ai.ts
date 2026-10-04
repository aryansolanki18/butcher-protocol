/**
 * AI service contract.
 *
 * This file is the only place that describes what BUTCHER PROTOCOL needs from
 * a model. Both the Phase 1 mock engine and the Phase 3 server-side Gemma 4
 * 31B IT service must satisfy these types, so swapping the implementation
 * never changes a single UI component.
 *
 * Model: Gemma 4 31B IT via the Gemini API. Identifier: `gemma-4-31b-it`.
 * The key (`GEMINI_API_KEY`) is read on the server only.
 */

import type { CareerProfile, JobAnalysis, OperationStatus, Resume, ResumeSectionContent } from '@/types';

/* -------------------------------------------------------------------------- */
/* Operations                                                                  */
/* -------------------------------------------------------------------------- */

export interface AnalyzeJobRequest {
  jobDescription: string;
  roleHint?: string;
  companyHint?: string;
}

export type AnalyzeJobResponse = JobAnalysis;

export interface TailorResumeRequest {
  profile: CareerProfile;
  baseResume: Resume;
  jobAnalysis: JobAnalysis;
  jobDescription: string;
}

export type TailorResumeResponse = ResumeSectionContent;

export interface AnalyzeATSRequest {
  resume: ResumeSectionContent;
  jobAnalysis: JobAnalysis;
  jobDescription: string;
}

export interface ATSAnalysis {
  /** Deterministic application logic. Never returned by the model. */
  matchScore: number;
  tier: 'critical' | 'high' | 'medium' | 'low';
  keywordCoverage: number;
  skillMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  /** Always surfaced in the UI as INTERNAL COMPATIBILITY ESTIMATE. */
  disclaimer: string;
}

/** Raw extraction from the model. Free of any computed percentage. */
export interface ATSExtraction {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  observations: string[];
}

/* -------------------------------------------------------------------------- */
/* Service surface                                                             */
/* -------------------------------------------------------------------------- */

export interface AIService {
  analyzeJob(request: AnalyzeJobRequest): Promise<AnalyzeJobResponse>;
  tailorResume(request: TailorResumeRequest): Promise<TailorResumeResponse>;
  analyzeATS(request: AnalyzeATSRequest): Promise<ATSExtraction>;
}

/**
 * The three operations the product is designed around. Phase 1 returns mock
 * data with a simulated delay; Phase 3 replaces the bodies with fetches to the
 * server routes, which in turn call the server-only Gemma service.
 */
export type AIProvider = 'mock' | 'gemma';

export interface ForgeStageEvent {
  stage: 'ANALYZING_TARGET' | 'FORGING_RESUME';
  label: string;
}

export interface OperationDraft {
  jobTitle: string;
  company: string;
  status: OperationStatus;
  note: string;
}