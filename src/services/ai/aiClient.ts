/**
 * THE AI BOUNDARY.
 *
 * UI  →  aiClient (this file)  →  [Phase 3] server route  →  gemma.ts  →  Gemma 4 31B IT
 *
 * Every UI component imports only from here. Nothing in `src/components`,
 * `src/pages` or any other client module may import `gemma.ts` directly.
 *
 * Phase 1: the `mock` provider runs deterministic extraction with a simulated
 * delay. No network call, no API key, no Gemini request.
 * Phase 3: switch `ACTIVE_PROVIDER` to `'gemma'` and implement the `gemma`
 * branch to POST to the server routes. That is the only file that changes.
 */

import { mockAnalyzeATS, mockAnalyzeJob, mockTailorResume } from './mockEngine';
import { computeAtsEstimate } from '@/lib/ats';
import type { ATSAnalysis, ATSExtraction } from '@/types/ai';
import type {
  AnalyzeATSRequest,
  AnalyzeJobRequest,
  AnalyzeJobResponse,
  AIProvider,
  TailorResumeRequest,
  TailorResumeResponse,
} from '@/types/ai';
import { GEMMA_MODEL } from './prompts';

/**
 * Planned engine. Shown in the UI as an architecture statement only — Phase 1
 * performs no model inference.
 */
export const PLANNED_ENGINE = 'GEMMA 4 31B IT';
export const PLANNED_MODEL_ID = GEMMA_MODEL;

export const ACTIVE_PROVIDER: AIProvider = 'mock';

const SIMULATED_LATENCY_MS = 900;

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stable simulated delay so the UI can build honest loading states.
 * Phase 3 deletes this and awaits the network instead.
 */
async function simulateProcessing(label: string): Promise<void> {
  await delay(SIMULATED_LATENCY_MS);
  void label;
}

/* -------------------------------------------------------------------------- */
/* Operations                                                                  */
/* -------------------------------------------------------------------------- */

export interface AiOperationMeta {
  provider: AIProvider;
  model: string;
  simulated: boolean;
}

export interface AiResult<T> {
  data: T;
  meta: AiOperationMeta;
}

const MOCK_META: AiOperationMeta = { provider: 'mock', model: PLANNED_MODEL_ID, simulated: true };

/** Gemma 4 31B IT extracts structured requirements from a job description. */
export async function analyzeJob(request: AnalyzeJobRequest): Promise<AiResult<AnalyzeJobResponse>> {
  if (request.jobDescription.trim().length < 40) {
    throw new AIServiceError('Job description is too short to analyse.');
  }
  await simulateProcessing('analyzeJob');
  return { data: mockAnalyzeJob(request), meta: MOCK_META };
}

/** Tailors an existing document. Never fabricates credentials. */
export async function tailorResume(request: TailorResumeRequest): Promise<AiResult<TailorResumeResponse>> {
  if (request.jobDescription.trim().length < 40) {
    throw new AIServiceError('A target job description is required before forging.');
  }
  await simulateProcessing('tailorResume');
  return { data: mockTailorResume(request), meta: MOCK_META };
}

/**
 * Protocol scan. Returns the raw extraction only — the compatibility numbers
 * are computed by `computeAtsEstimate`, never by the model.
 */
export async function analyzeATS(
  request: AnalyzeATSRequest,
): Promise<AiResult<{ extraction: ATSExtraction; estimate: ATSAnalysis }>> {
  await simulateProcessing('analyzeATS');
  const extraction = mockAnalyzeATS(request);
  const estimate = computeAtsEstimate({ extraction, resume: request.resume, jobAnalysis: request.jobAnalysis });
  return { data: { extraction, estimate }, meta: MOCK_META };
}

/**
 * The single object the UI calls. Named `aiService` to keep it distinct from
 * the server-only `gemmaService` in `gemma.ts` — the future swap replaces the
 * bodies here, not this import path.
 */
export const aiService = {
  analyzeJob,
  tailorResume,
  analyzeATS,
};

export type AiService = typeof aiService;