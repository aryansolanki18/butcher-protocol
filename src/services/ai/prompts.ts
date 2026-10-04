/**
 * Placeholder prompt templates for Gemma 4 31B IT (`gemma-4-31b-it`).
 *
 * Phase 1 scope: short, readable templates plus the required output shape.
 * No prompt engineering, no API calls, no secrets. These are imported only by
 * the server-only `gemma.ts` in Phase 3.
 */

export const GEMMA_MODEL = 'gemma-4-31b-it';

/**
 * Structured output contract every prompt must hold the model to.
 * The model extracts; it never computes a match percentage.
 */
export const STRUCTURED_OUTPUT_CONTRACT = `Respond with a single JSON object and nothing else. No prose, no markdown fences.
Required shape:
{
  "role": "",
  "company": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "experience": "",
  "education": "",
  "location": "",
  "employmentType": "",
  "summary": "",
  "responsibilities": []
}
Fill every field from the job description. Never leave a field empty unless the description truly does not state it.
Rules:
- Arrays contain short skill names exactly as written in the job description.
- Never invent a skill, employer, degree, date or number that is not stated.
- Never output a match percentage, score or rating.`;

export function buildAnalyzeJobPrompt(jobDescription: string, roleHint?: string, companyHint?: string): string {
  const context = [
    roleHint ? `Role hint from the operator: ${roleHint}` : '',
    companyHint ? `Company hint from the operator: ${companyHint}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `Extract structured hiring requirements from the job description below.
${context ? `\n${context}\n` : ''}
${STRUCTURED_OUTPUT_CONTRACT}

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}

export function buildTailorResumePrompt(baseResume: string, jobDescription: string, jobAnalysis: string): string {
  return `Tailor the resume below to the job description.
Reorder, reword and emphasise what the operator genuinely has.
Never fabricate experience, skills, employers, degrees or dates.
Never add a claim that is not already supported by the base resume.

Return a single JSON object with exactly these keys:
{
  "summary": "",
  "experience": [{ "company": "", "role": "", "period": "", "points": [""] }],
  "skills": [""],
  "education": "",
  "projects": [""]
}
Fill every key. No prose, no markdown fences.

TARGET JOB ANALYSIS:
"""
${jobAnalysis}
"""

BASE RESUME:
"""
${baseResume}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}

export function buildAnalyzeATSPrompt(resume: string, jobDescription: string, jobAnalysis: string): string {
  return `Compare the resume below against the job description.
Report keywords and skills you can actually observe on both sides.
Do not output a score, percentage, rating or verdict — those are computed separately.

Return a single JSON object with exactly these keys:
{
  "matchedKeywords": [""],
  "missingKeywords": [""],
  "matchedSkills": [""],
  "missingSkills": [""],
  "observations": [""]
}
Fill every key. No prose, no markdown fences.

TARGET JOB ANALYSIS:
"""
${jobAnalysis}
"""

RESUME:
"""
${resume}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}