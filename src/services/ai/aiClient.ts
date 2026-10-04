/**
 * THE AI BOUNDARY.
 *
 *   UI  ->  aiClient (this file)  ->  POST /api/ai/*  ->  gemma.ts  ->  Gemma 4 31B IT
 *
 * Every UI component imports only from here. Nothing in `src/components`,
 * `src/pages` or any other client module may import `gemma.ts` directly, and
 * the Gemini key never reaches the browser.
 *
 * Two providers:
 *  - `gemma` — the server at /api answered. Real model inference.
 *  - `mock`  — no server, or the server declined. Deterministic extraction
 *              runs in the browser instead, so a static-only deploy still works.
 *
 * `aiResult.meta.simulated` tells the UI which one produced the result, and the
 * UI says so. It never claims live AI when it is not live.
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
 * Planned engine, and now the configured one on the server.
 * Shown in the UI as an architecture statement.
 */
export const PLANNED_ENGINE = 'GEMMA 4 31B IT';
export const PLANNED_MODEL_ID = GEMMA_MODEL;

/** Milliseconds to wait for the server before falling back to in-browser mode. */
const SERVER_TIMEOUT_MS = 20_000;

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/* -------------------------------------------------------------------------- */
/* Server transport                                                            */
/* -------------------------------------------------------------------------- */

async function callServer<T>(route: string, body: unknown): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/ai/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { ok?: boolean; data?: T };
    return payload.ok && payload.data !== undefined ? payload.data : null;
  } catch {
    // No server, offline, or blocked. In-browser extraction takes over.
    return null;
  } finally {
    clearTimeout(timer);
  }
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
const LIVE_META: AiOperationMeta = { provider: 'gemma', model: PLANNED_MODEL_ID, simulated: false };

/** Gemma 4 31B IT extracts structured requirements from a job description. */
export async function analyzeJob(request: AnalyzeJobRequest): Promise<AiResult<AnalyzeJobResponse>> {
  if (request.jobDescription.trim().length < 40) {
    throw new AIServiceError('Job description is too short to analyse.');
  }
  const live = await callServer<AnalyzeJobResponse>('analyze-job', request);
  if (live) return { data: live, meta: LIVE_META };
  return { data: mockAnalyzeJob(request), meta: MOCK_META };
}

/** Tailors an existing document. Never fabricates credentials. */
export async function tailorResume(request: TailorResumeRequest): Promise<AiResult<TailorResumeResponse>> {
  if (request.jobDescription.trim().length < 40) {
    throw new AIServiceError('A target job description is required before forging.');
  }
  const live = await callServer<TailorResumeResponse>('tailor-resume', request);
  if (live) return { data: live, meta: LIVE_META };
  return { data: mockTailorResume(request), meta: MOCK_META };
}

/**
 * Protocol scan. The model returns extraction only; the compatibility numbers
 * are computed by `computeAtsEstimate`, never by the model.
 */
export async function analyzeATS(
  request: AnalyzeATSRequest,
): Promise<AiResult<{ extraction: ATSExtraction; estimate: ATSAnalysis }>> {
  const live = await callServer<{ extraction: ATSExtraction; estimate: ATSAnalysis }>('analyze-ats', request);
  if (live) return { data: live, meta: LIVE_META };

  const extraction = mockAnalyzeATS(request);
  const estimate = computeAtsEstimate({ extraction, resume: request.resume, jobAnalysis: request.jobAnalysis });
  return { data: { extraction, estimate }, meta: MOCK_META };
}

/**
 * The single object the UI calls. No UI component imports `gemma.ts`; this is
 * the only path from the browser to the model.
 */
export const aiService = {
  analyzeJob,
  tailorResume,
  analyzeATS,
};

export type AiService = typeof aiService;