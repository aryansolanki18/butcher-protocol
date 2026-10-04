/**
 * SERVER-ONLY Gemma 4 31B IT service. DO NOT IMPORT FROM ANY CLIENT FILE.
 *
 * ── Isolation contract ───────────────────────────────────────────────────────
 * Phase 1 ships no backend, so this module is deliberately unreachable:
 *   - no UI component, page, hook or client file may import it;
 *   - it reads `GEMINI_API_KEY` from the server environment only, never from
 *     a client-exposed prefix such as `VITE_` or `NEXT_PUBLIC_`;
 *   - it throws if it is ever evaluated in a browser;
 *   - it is a stub — it performs no network call in Phase 1.
 *
 * Because nothing imports it, the bundler keeps it out of the browser bundle.
 *
 * ── Phase 3 swap point ───────────────────────────────────────────────────────
 * 1. Stand up the server route layer (Next.js route handlers, or a serverless
 *    function alongside this SPA).
 * 2. Implement `callGemma()` below with the Gemini API and
 *    `GEMINI_MODEL = 'gemma-4-31b-it'`.
 * 3. Expose `analyzeJob`, `tailorResume` and `analyzeATS` as POST endpoints.
 * 4. Flip `src/services/ai/aiClient.ts` from the mock provider to those routes.
 *    No UI component changes.
 *
 * Structured output must be parsed and validated before it leaves this file.
 */

import { ANALYZE_ATS_PROMPT, ANALYZE_JOB_PROMPT, GEMMA_MODEL, TAILOR_RESUME_PROMPT } from './prompts';
import type {
  AnalyzeATSRequest,
  AnalyzeJobRequest,
  AnalyzeJobResponse,
  ATSExtraction,
  TailorResumeRequest,
  TailorResumeResponse,
} from '@/types/ai';

const ENV_KEY_NAME = 'GEMINI_API_KEY';

/** Env access that works on Node and serverless runtimes, never in the browser. */
function serverEnv(name: string): string | undefined {
  const proc = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : undefined;
  return proc?.[name];
}

function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'gemma.ts is server-only. Route AI calls through the server API layer; never import it from client code.',
    );
  }
}

/**
 * Reads the API key from the server environment.
 * Throws rather than silently degrading, so a missing key is never masked.
 */
export function readGeminiApiKey(): string {
  assertServerOnly();
  const key = serverEnv(ENV_KEY_NAME);
  if (!key) {
    throw new Error(`${ENV_KEY_NAME} is not set on the server. Configure it before enabling Gemma.`);
  }
  return key;
}

export function geminiModelId(): string {
  return serverEnv('GEMINI_MODEL') ?? GEMMA_MODEL;
}

/** Extracts the JSON object from a model response, tolerating stray fences. */
function parseStructured<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response contained no parsable JSON object.');
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/**
 * The single outbound call to Gemma 4 31B IT. Unimplemented in Phase 1 by
 * design — no Gemini request is made anywhere in this phase.
 */
async function callGemma(_prompt: string): Promise<string> {
  assertServerOnly();
  readGeminiApiKey();
  throw new Error('Gemma integration is scheduled for Phase 3. No Gemini request is made in Phase 1.');
}

export async function analyzeJob(request: AnalyzeJobRequest): Promise<AnalyzeJobResponse> {
  void request;
  const raw = await callGemma(ANALYZE_JOB_PROMPT);
  return parseStructured<AnalyzeJobResponse>(raw);
}

export async function tailorResume(request: TailorResumeRequest): Promise<TailorResumeResponse> {
  void request;
  const raw = await callGemma(TAILOR_RESUME_PROMPT);
  return parseStructured<TailorResumeResponse>(raw);
}

export async function analyzeATS(request: AnalyzeATSRequest): Promise<ATSExtraction> {
  void request;
  const raw = await callGemma(ANALYZE_ATS_PROMPT);
  return parseStructured<ATSExtraction>(raw);
}

/**
 * Server-side surface. In Phase 3 the server routes delegate to this object.
 * Phase 1 code must not reference it from the browser.
 */
export const gemmaService = {
  analyzeJob,
  tailorResume,
  analyzeATS,
};