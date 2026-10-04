import type { ResumeSectionContent } from '@/types';
import type {
  AnalyzeATSRequest,
  AnalyzeJobRequest,
  AnalyzeJobResponse,
  ATSExtraction,
  TailorResumeRequest,
  TailorResumeResponse,
} from '@/types/ai';

/**
 * Deterministic stand-in for Gemma 4 31B IT, used in Phase 1.
 *
 * It performs keyword and skill extraction with plain string logic so the UI
 * can be built and reviewed without a live model. It obeys the same product
 * rules the real model must obey: it extracts and reorganises only, and it
 * never fabricates experience, employers, degrees or dates.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'across', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'being',
  'but', 'by', 'can', 'company', 'do', 'does', 'each', 'end', 'for', 'from', 'has', 'have', 'having', 'in', 'into',
  'is', 'it', 'its', 'of', 'on', 'one', 'or', 'other', 'our', 'out', 'over', 'own', 'role', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'up', 'us', 'use', 'using', 'was', 'we',
  'well', 'what', 'when', 'which', 'who', 'will', 'with', 'work', 'working', 'would', 'you', 'your',
]);

const EXPERIENCE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /(\d+)\s*[-–]\s*(\d+)\s*years?/i, label: 'years experience' },
  { pattern: /(\d+)\s*[-–]\s*(\d+)\s*months?/i, label: 'months experience' },
  { pattern: /(fresher|entry[- ]level|0\s*[-–]\s*1|graduate)/i, label: 'graduate level' },
  { pattern: /(senior|lead|principal|staff)/i, label: 'senior level' },
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Fixed-term'];

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function titleCaseFromSlug(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resumeText(content: ResumeSectionContent): string {
  return [
    content.summary,
    content.skills.join(' '),
    content.education,
    content.projects.join(' '),
    ...content.experience.flatMap((item) => [item.role, item.company, ...item.points]),
  ]
    .join(' ')
    .toLowerCase();
}

function jobText(request: AnalyzeJobRequest): string {
  return `${request.roleHint ?? ''} ${request.companyHint ?? ''} ${request.jobDescription}`.toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* analyzeJob                                                                  */
/* -------------------------------------------------------------------------- */

function detectExperience(description: string): string {
  for (const { pattern, label } of EXPERIENCE_PATTERNS) {
    if (pattern.test(description)) return label.toUpperCase();
  }
  return 'NOT SPECIFIED';
}

function detectEmploymentType(description: string): string {
  const lower = description.toLowerCase();
  return EMPLOYMENT_TYPES.find((type) => lower.includes(type.toLowerCase())) ?? 'NOT SPECIFIED';
}

function detectEducation(description: string): string {
  const match = description.match(/((?:b\.?tech|b\.?e|b\.?sc|bachelor(?:'s)?|m\.?tech|m\.?sc|master(?:'s)?|ph\.?d)[^.;|]{0,80})/i);
  return match ? match[1].trim() : 'NOT SPECIFIED';
}

function detectLocation(description: string): string {
  const match = description.match(/\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?),\s*(India|Remote|Global|UK|US)\b/);
  return match ? `${match[1]}, ${match[2]}` : 'NOT SPECIFIED';
}

/** Bare place names are never valid company names. */
const GEOGRAPHY = new Set([
  'india', 'remote', 'global', 'uk', 'us', 'usa', 'bengaluru', 'bangalore', 'hyderabad', 'pune', 'mumbai',
  'delhi', 'ncr', 'chennai', 'gurgaon', 'gurugram', 'kolkata', 'jaipur', 'ahmedabad',
]);

const COMPANY_PATTERNS: RegExp[] = [
  /\b(?:company|employer|organisation|organization)\s*[:\-]\s*([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})/,
  /^([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})\s+is\s+(?:hiring|looking|searching|building|seeking)/,
  /\b([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})\s+is\s+(?:hiring|looking|searching|seeking)/,
  /\bat\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})\b/,
];

function detectCompany(description: string): string {
  for (const pattern of COMPANY_PATTERNS) {
    const match = description.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length > 1 && !GEOGRAPHY.has(candidate.toLowerCase())) {
      return candidate.replace(/[.,]$/, '');
    }
  }
  return '';
}

function extractSkills(text: string, vocabulary: string[]): string[] {
  const lower = ` ${text.toLowerCase()} `;
  return vocabulary.filter((skill) => {
    const needle = normalise(skill);
    if (lower.includes(needle)) return true;
    const alias = needle.replace(/\s+/g, '');
    return alias !== needle && lower.includes(alias);
  });
}

const SKILL_VOCABULARY = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'C++', 'Go',
  'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Statistics',
  'PyTorch', 'TensorFlow', 'Transformers', 'Computer Vision', 'OpenCV', 'CUDA',
  'Pandas', 'NumPy', 'Spark', 'Hadoop', 'Airflow', 'Snowflake', 'Kafka',
  'Data Analysis', 'Data Visualization', 'Data Modeling', 'ETL', 'Tableau', 'Power BI', 'Excel',
  'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Git', 'CI/CD', 'FastAPI',
  'PostgreSQL', 'Redis', 'AWS', 'GCP', 'Azure', 'Model Deployment', 'MLOps', 'Research',
];

/** Sentences that state expectations, as opposed to duties or company context. */
const REQUIREMENT_MARKERS =
  /(must|required|strong|proficient|expert|solid|working knowledge|experience with|familiar with|knowledge of|ability to)/i;

/** Sentences that read as duties rather than requirements. */
const RESPONSIBILITY_MARKERS =
  /(you will|you'll|responsib|own |build |maintain |design |partner|collaborate|support|present|ship|run |lead |improve|reduce|automate)/i;

export function mockAnalyzeJob(request: AnalyzeJobRequest): AnalyzeJobResponse {
  const description = request.jobDescription;
  const haystack = jobText(request);

  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const vocabulary = extractSkills(haystack, SKILL_VOCABULARY);
  const requirementText = requirementSentences(description).join(' ');

  const requiredSkills = extractSkills(requirementText || haystack, vocabulary);
  const preferredPool = vocabulary.filter((skill) => !requiredSkills.includes(skill));
  const preferredSkills = preferredPool.filter((_, index) => index % 2 === 0);

  const responsibilities = sentences.filter((sentence) => RESPONSIBILITY_MARKERS.test(sentence)).slice(0, 4);

  const heading = sentences[0] ?? '';
  const headingParts = heading.split(/[,:—]/).map((part) => part.trim());

  return {
    role: request.roleHint ?? titleCaseFromSlug(headingParts[0] || 'Target Role'),
    company: request.companyHint?.trim() || detectCompany(description) || titleCaseFromSlug(headingParts[1] || 'Target Company'),
    requiredSkills,
    preferredSkills,
    experience: detectExperience(description),
    education: detectEducation(description),
    location: detectLocation(description),
    employmentType: detectEmploymentType(description),
    summary: heading || 'No description summary available.',
    responsibilities: responsibilities.length > 0 ? responsibilities : sentences.slice(0, 3),
  };
}

/* -------------------------------------------------------------------------- */
/* tailorResume                                                                */
/* -------------------------------------------------------------------------- */

export function mockTailorResume(request: TailorResumeRequest): TailorResumeResponse {
  const { baseResume, jobAnalysis, profile } = request;
  const wanted = [...jobAnalysis.requiredSkills, ...jobAnalysis.preferredSkills].map(normalise);
  const base = baseResume.content;

  const relevance = (text: string): number => {
    const haystack = normalise(text);
    return wanted.filter((skill) => haystack.includes(skill)).length;
  };

  const orderedSkills = [...base.skills]
    .map((skill) => ({ skill, hits: relevance(skill) }))
    .sort((a, b) => b.hits - a.hits)
    .map((entry) => entry.skill);

  const orderedExperience = base.experience
    .map((item) => ({
      item,
      hits: relevance(`${item.role} ${item.company} ${item.points.join(' ')}`),
    }))
    .sort((a, b) => b.hits - a.hits)
    .map((entry) => ({
      ...entry.item,
      points: [...entry.item.points].sort((a, b) => relevance(b) - relevance(a)),
    }));

  const topSkills = orderedSkills.slice(0, 4);
  const focusPoints = orderedExperience[0]?.points.slice(0, 2) ?? [];

  // Only reorders and compresses genuine content — nothing is added.
  const summary = [
    `${jobAnalysis.role}-focused candidate with hands-on depth in ${topSkills.join(', ')}.`,
    focusPoints[0] ? `Recent impact: ${stripTrailingPeriod(focusPoints[0])}.` : null,
    `Based in ${profile.personal.location}. Targeting ${jobAnalysis.company}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    summary,
    experience: orderedExperience,
    skills: orderedSkills,
    education: base.education,
    projects: [...base.projects],
  };
}

function stripTrailingPeriod(value: string): string {
  return value.trim().replace(/\.$/, '');
}

/* -------------------------------------------------------------------------- */
/* analyzeATS                                                                  */
/* -------------------------------------------------------------------------- */

export function mockAnalyzeATS(request: AnalyzeATSRequest): ATSExtraction {
  const text = resumeText(request.resume);

  const required = [...request.jobAnalysis.requiredSkills, ...request.jobAnalysis.preferredSkills];

  const matchedSkills = required.filter((skill) => text.includes(normalise(skill)));
  const missingSkills = required.filter((skill) => !text.includes(normalise(skill)));

  // Keywords are sampled across the whole listing, then filtered to remove
  // skill-name words and company/role context, so the ratio reflects genuine
  // domain vocabulary rather than the company paragraph.
  const context = `${request.jobAnalysis.role} ${request.jobAnalysis.company}`.toLowerCase();
  const jobTokens = tokenise(`${request.jobAnalysis.role} ${request.jobDescription}`).filter(
    (token) => !isSkillPhrase(token, required) && !new RegExp(`\\b${escapeRegExp(token)}`).test(context),
  );
  const matchedKeywords = jobTokens.filter((token) => text.includes(token));
  const missingKeywords = jobTokens.filter((token) => !text.includes(token));

  const observations: string[] = [];
  if (matchedSkills.length === 0) {
    observations.push('No required skill from the listing appears verbatim in the document.');
  } else {
    observations.push(
      `${matchedSkills.length} of ${required.length} listed skills appear in the document.`,
    );
  }
  if (missingKeywords.length > 0) {
    observations.push(`Job terms not found in the document: ${missingKeywords.slice(0, 5).join(', ')}.`);
  } else {
    observations.push('Every sampled job term appears somewhere in the document.');
  }
  observations.push('Resume wording is unchanged from the base document except for ordering.');

  return { matchedKeywords, missingKeywords, matchedSkills, missingSkills, observations };
}

function requirementSentences(description: string): string[] {
  return description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => REQUIREMENT_MARKERS.test(sentence));
}

/** Skill names are scored separately; drop their words from the keyword set. */
function isSkillPhrase(token: string, skills: string[]): boolean {
  return skills.some((skill) => normalise(skill).split(/\s+/).includes(token));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenise(value: string): string[] {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.replace(/^[.]+|[.]+$/g, ''))
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token) && !/^\d+$/.test(token));
  return [...new Set(tokens)].slice(0, 24);
}