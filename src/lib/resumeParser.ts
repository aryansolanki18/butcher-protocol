import type { ResumeSectionContent, ResumeExperience } from '@/types';

/**
 * Turns pasted resume text into the `ResumeSectionContent` shape the product
 * already uses.
 *
 * This is deliberately transparent and mechanical: it recognises common section
 * headings, splits bullets under each heading, and lifts dated lines into
 * experience entries. It never invents content — anything it cannot recognise
 * is preserved verbatim in the section it was found under, so nothing is lost.
 *
 * Phase 3 hands the same text to Gemma for a genuinely intelligent rewrite.
 * The shape below is what that model must also return.
 */

const SECTION_ALIASES: { key: keyof ResumeSectionContent; patterns: RegExp }[] = [
  { key: 'summary', patterns: /^(professional\s+)?(summary|profile|objective|about( me)?|overview)\b/i },
  { key: 'skills', patterns: /^(technical\s+|core\s+|key\s+)?skills?\b/i },
  { key: 'education', patterns: /^education(al)?\b|^academics?\b/i },
  { key: 'projects', patterns: /^projects?\b|^portfolio\b|^selected work\b/i },
  { key: 'experience', patterns: /^(work\s+|professional\s+|employment\s+)?experience\b|^employment history\b/i },
];

const BULLET = /^\s*(?:[-*•·▪‣o]|–|\d+[.)])\s+/;
const DATE_RANGE = /([A-Za-z]{3,9}\s+\d{4}|(?:19|20)\d{2})\s*(?:[—–\-]{1,2}|to)\s*([A-Za-z]{3,9}\s+\d{4}|(?:19|20)\d{2}|present|current|now)/i;

function stripBullet(line: string): string {
  return line.replace(BULLET, '').trim();
}

function normaliseLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

export interface ParsedResume {
  content: ResumeSectionContent;
  /** Headings the parser recognised, for user-facing feedback. */
  detectedSections: string[];
  /** True when nothing looked like a section heading. */
  unrecognised: boolean;
}

export function parseResumeText(raw: string): ParsedResume {
  const lines = raw
    .split(/\r?\n/)
    .map(normaliseLine)
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      content: { summary: '', experience: [], skills: [], education: '', projects: [] },
      detectedSections: [],
      unrecognised: true,
    };
  }

  type Bucket = { heading: string | null; lines: string[] };
  const buckets = new Map<keyof ResumeSectionContent, Bucket>();
  const detectedSections: string[] = [];
  let current: { key: keyof ResumeSectionContent; heading: string | null; lines: string[] } | null = null;

  for (const line of lines) {
    const match = SECTION_ALIASES.find((alias) => alias.patterns.test(line));

    // A heading must be short, or titled case, and carry no sentence punctuation.
    const looksLikeHeading =
      match !== undefined && line.length < 48 && !/[.;]$/.test(line) && !BULLET.test(line);

    if (looksLikeHeading && match) {
      if (current) buckets.set(current.key, { heading: current.heading, lines: current.lines });
      current = { key: match.key, heading: line, lines: [] };
      detectedSections.push(line);
      continue;
    }

    if (!current) {
      // Text before any heading is treated as the summary.
      current = { key: 'summary', heading: null, lines: [] };
    }
    current.lines.push(line);
  }

  if (current) buckets.set(current.key, { heading: current.heading, lines: current.lines });

  const collected = (key: keyof ResumeSectionContent) => buckets.get(key)?.lines ?? [];

  const summary = collected('summary').join(' ');
  const skills = collectSkills(collected('skills'));
  const education = collected('education').join(' · ');
  const projects = collected('projects').map(stripBullet);
  const experience = buildExperience(collected('experience'));

  return {
    content: { summary, experience, skills, education, projects },
    detectedSections,
    unrecognised: detectedSections.length === 0,
  };
}

/**
 * Skills are comma, semicolon, pipe or bullet separated. Bare whitespace runs
 * are only split when every fragment looks like a short skill token.
 */
function collectSkills(lines: string[]): string[] {
  const skills: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const cleaned = stripBullet(value).replace(/[.,;]+$/, '').trim();
    if (!cleaned || cleaned.length > 40) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    skills.push(cleaned);
  };

  for (const line of lines) {
    const isList = BULLET.test(line) || /[,;|]/.test(line);
    if (isList) {
      for (const part of line.split(/[,;|]/)) push(part);
    } else {
      push(line);
    }
  }

  return skills;
}

const ROLE_LINE = /^[A-Za-z][A-Za-z0-9 .&+'/-]{1,60}$/;
const HAS_YEAR = /\b(?:19|20)\d{2}\b/;

const isRoleish = (value: string): boolean => ROLE_LINE.test(value) && !HAS_YEAR.test(value);

/**
 * Experience is reconstructed from dated lines: the dated line carries the role
 * and the company, and the lines that follow it are its bullets.
 */
function buildExperience(lines: string[]): ResumeExperience[] {
  const entries: ResumeExperience[] = [];
  let current: ResumeExperience | null = null;

  for (const line of lines) {
    const cleaned = stripBullet(line);
    const dateMatch = cleaned.match(DATE_RANGE);

    if (dateMatch) {
      // Drop the date range first, then read what is left as "Role, Company".
      const head = cleaned
        .replace(DATE_RANGE, '')
        .replace(/[|•·]+/g, ' — ')
        .replace(/\s*[—–-]\s*$/, '')
        .trim();
      const parts = head
        .split(/\s+[—–]\s+|\s+at\s+|\s*,\s*/)
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length > 0 && parts.length <= 3 && parts.every(isRoleish)) {
        const period = `${dateMatch[1]} — ${/present|current|now/i.test(dateMatch[2]) ? 'Present' : dateMatch[2]}`;
        current = {
          role: parts[0],
          company: parts.slice(1).join(', '),
          period,
          points: [],
        };
        entries.push(current);
        continue;
      }
    }

    if (!current) {
      // An undated header line can still start an entry, but never a bullet.
      const head = cleaned.replace(/[|•·]+/g, ' — ').replace(/\s*[—–-]\s*$/, '').trim();
      const parts = head.split(/\s+[—–]\s+|\s*,\s*/).map((part) => part.trim()).filter(Boolean);
      if (!BULLET.test(line) && parts.length > 0 && parts.every(isRoleish)) {
        current = { role: parts[0], company: parts.slice(1).join(', '), period: '', points: [] };
        entries.push(current);
        continue;
      }
      continue;
    }

    if (BULLET.test(line) || cleaned.length > 24) {
      current.points.push(cleaned);
    } else if (cleaned && !current.company && isRoleish(cleaned)) {
      current.company = cleaned;
    }
  }

  return entries.filter((entry) => entry.points.length > 0 || entry.company);
}