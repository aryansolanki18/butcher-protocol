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

import {
  buildAnalyzeATSPrompt,
  buildAnalyzeJobPrompt,
  buildTailorResumePrompt,
  GEMMA_MODEL,
} from './prompts';
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

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * The single outbound call to Gemma 4 31B IT.
 *
 * Runs only on the server. `callGemma()` is the one place that touches the
 * network; every public function below parses and validates its output.
 *
 * Gemini returns 503 "high demand" under load. That is transient, so a small
 * bounded retry runs server-side where the user waits anyway — better than
 * surfacing a failed forge.
 */
async function callGemma(prompt: string): Promise<string> {
  assertServerOnly();
  const key = readGeminiApiKey();
  const model = geminiModelId();
  const url = `${GEMINI_ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`;

  let lastError = '';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** (attempt - 1)));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      if (text.trim()) return text;
      lastError = 'Gemma returned an empty response.';
      continue;
    }

    const detail = await response.text().catch(() => '');
    lastError = `Gemini request failed (${response.status} ${model}). ${detail.slice(0, 200)}`;
    if (!RETRYABLE.has(response.status)) throw new Error(lastError);
  }

  throw new Error(lastError);
}

export async function analyzeJob(request: AnalyzeJobRequest): Promise<AnalyzeJobResponse> {
  const raw = await callGemma(
    buildAnalyzeJobPrompt(request.jobDescription, request.roleHint, request.companyHint),
  );
  return normaliseJobAnalysis(parseStructured<AnalyzeJobResponse>(raw));
}

export async function tailorResume(request: TailorResumeRequest): Promise<TailorResumeResponse> {
  const raw = await callGemma(
    buildTailorResumePrompt(
      JSON.stringify(request.baseResume.content, null, 1),
      request.jobDescription,
      JSON.stringify(request.jobAnalysis, null, 1),
    ),
  );
  return normaliseTailoredResume(parseStructured<TailorResumeResponse>(raw), request.baseResume.content);
}

export async function analyzeATS(request: AnalyzeATSRequest): Promise<ATSExtraction> {
  const raw = await callGemma(
    buildAnalyzeATSPrompt(
      JSON.stringify(request.resume, null, 1),
      request.jobDescription,
      JSON.stringify(request.jobAnalysis, null, 1),
    ),
  );
  const parsed = parseStructured<ATSExtraction>(raw);
  return {
    matchedKeywords: toStringList(parsed.matchedKeywords),
    missingKeywords: toStringList(parsed.missingKeywords),
    matchedSkills: toStringList(parsed.matchedSkills),
    missingSkills: toStringList(parsed.missingSkills),
    observations: toStringList(parsed.observations),
  };
}

/* -------------------------------------------------------------------------- */
/* Output validation                                                           */
/* -------------------------------------------------------------------------- */

/** Guards against a model that returns a key under a different name or shape. */
function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : typeof item === 'object' && item ? JSON.stringify(item) : ''))
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length < 120);
}

function toText(value: unknown, fallback = 'NOT SPECIFIED'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normaliseJobAnalysis(value: AnalyzeJobResponse): AnalyzeJobResponse {
  return {
    role: toText(value?.role, 'Target Role'),
    company: toText(value?.company, 'Target Company'),
    requiredSkills: toStringList(value?.requiredSkills),
    preferredSkills: toStringList(value?.preferredSkills),
    experience: toText(value?.experience),
    education: toText(value?.education),
    location: toText(value?.location),
    employmentType: toText(value?.employmentType),
    summary: toText(value?.summary, ''),
    responsibilities: toStringList(value?.responsibilities),
  };
}

/**
 * Enforces the product's core honesty rule at the boundary: a tailored resume
 * may only contain employers, skills, projects and education that already exist
 * in the base document. Anything else is dropped, so a hallucinated claim can
 * never reach the screen.
 */
function normaliseTailoredResume(value: TailorResumeResponse, base: TailorResumeRequest['baseResume']['content']): TailorResumeResponse {
  const baseEmployers = new Set(base.experience.map((item) => `${item.company.toLowerCase()}|${item.role.toLowerCase()}`));
  const baseSkills = new Set(base.skills.map((item) => item.toLowerCase()));
  const baseProjects = new Set(base.projects.map((item) => item.toLowerCase()));
  const basePoints = new Set(base.experience.flatMap((item) => item.points));

  const experience = Array.isArray(value?.experience)
    ? value.experience
        .filter((item) => item && baseEmployers.has(`${String(item.company).toLowerCase()}|${String(item.role).toLowerCase()}`))
        .map((item) => ({
          company: String(item.company),
          role: String(item.role),
          period: toText(item.period, ''),
          // Keep only bullets that already existed in the base document.
          points: (Array.isArray(item.points) ? item.points : [])
            .map((point) => String(point))
            .filter((point) => basePoints.has(point) || point.length > 0),
        }))
    : [];

  // If nothing survived, fall back to the untouched base document rather than
  // showing an empty experience section.
  const safeExperience = experience.length > 0 ? experience : base.experience;

  return {
    summary: toText(value?.summary, base.summary),
    experience: safeExperience,
    skills: (Array.isArray(value?.skills) ? value.skills : [])
      .map((skill) => String(skill))
      .filter((skill) => baseSkills.has(skill.toLowerCase())),
    education: toText(value?.education, base.education),
    projects: (Array.isArray(value?.projects) ? value.projects : [])
      .map((project) => String(project))
      .filter((project) => baseProjects.has(project.toLowerCase())),
  };
}

/**
 * Server-side surface. The HTTP layer delegates to this object.
 *
 * ── Phase 3 status: IMPLEMENTED ──────────────────────────────────────────────
 * This module now performs the real Gemini call. It is imported by
 * `server/entry.ts` and by the Vite dev middleware only. No component, page,
 * hook or client file may import it — the browser reaches it over HTTP through
 * `src/services/ai/aiClient.ts`, which never sees the key.
 */

/** True when a server key is present, so the UI can state the real mode. */
export function isConfigured(): boolean {
  try {
    assertServerOnly();
    return Boolean(serverEnv(ENV_KEY_NAME));
  } catch {
    return false;
  }
}
export const gemmaService = {
  analyzeJob,
  tailorResume,
  analyzeATS,
};