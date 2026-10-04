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
  "requiredSkills": [],
  "preferredSkills": [],
  "experience": "",
  "education": "",
  "location": "",
  "employmentType": "",
  "summary": ""
}
Rules:
- Arrays contain short skill names exactly as written in the job description.
- Never invent a skill, employer, degree, date or number that is not stated.
- Never output a match percentage, score or rating.`;

export const ANALYZE_JOB_PROMPT = `You extract structured requirements from a job description.
Return only the JSON object described in the output contract.
${STRUCTURED_OUTPUT_CONTRACT}
Job description:
<<<JOB_DESCRIPTION>>>`;

export const TAILOR_RESUME_PROMPT = `You tailor an existing resume to a specific job description.
Reorder, reword and emphasise what the operator genuinely has.
Never fabricate experience, skills, employers, degrees or dates.
Never add a claim that is not already supported by the base resume.
Return only the JSON object described in the output contract, extended with
"summary", "experience", "skills", "education" and "projects" arrays.
${STRUCTURED_OUTPUT_CONTRACT}
Base resume:
<<<BASE_RESUME>>>
Job description:
<<<JOB_DESCRIPTION>>>`;

export const ANALYZE_ATS_PROMPT = `You compare a resume against a job description.
Report keywords and skills you can actually observe on both sides.
Do not output a score, percentage or compatibility verdict.
Return only JSON matching:
{
  "matchedKeywords": [],
  "missingKeywords": [],
  "matchedSkills": [],
  "missingSkills": [],
  "observations": []
}
${STRUCTURED_OUTPUT_CONTRACT}
Resume:
<<<RESUME>>>
Job description:
<<<JOB_DESCRIPTION>>>`;