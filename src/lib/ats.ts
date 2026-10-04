import type { JobAnalysis, ResumeSectionContent } from '@/types';
import type { ATSAnalysis, ATSExtraction } from '@/types/ai';
import { scoreTier } from './matching';

/**
 * Deterministic ATS compatibility estimate.
 *
 * The model only extracts matched/missing keywords and skills
 * (`ATSExtraction`). Every number below is computed here, in application
 * logic, so the same inputs always produce the same estimate.
 *
 * This is an INTERNAL COMPATIBILITY ESTIMATE, not a universal ATS score.
 * No applicant tracking system shares this model, and nothing here predicts a
 * real screening decision.
 */

export const ATS_DISCLAIMER =
  'Internal compatibility estimate generated from DEVELOPMENT DATA. Not a universal ATS score and not a prediction of any employer screening decision.';

function ratio(matched: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
}

export interface AtsInputs {
  extraction: ATSExtraction;
  resume: ResumeSectionContent;
  jobAnalysis: JobAnalysis;
}

/** Recommendations are derived from the gaps, never invented. */
export function buildRecommendations(extraction: ATSExtraction, coverage: number, skillMatch: number): string[] {
  const recommendations: string[] = [];

  if (extraction.missingSkills.length > 0) {
    recommendations.push(
      `Surface the listed skills you already use in project descriptions where genuinely applicable: ${extraction.missingSkills
        .slice(0, 3)
        .join(', ')}.`,
    );
  }

  if (coverage < 90) {
    recommendations.push(
      'Mirror the exact wording used in the job description for the skills you genuinely hold, so automated keyword matching can see them.',
    );
  } else {
    recommendations.push('Keyword coverage is already strong. Keep the current phrasing stable through the next revision.');
  }

  if (skillMatch < 85) {
    recommendations.push(
      'Move relevant project detail above generic responsibilities so the required skills are visible in the first third of the document.',
    );
  }

  recommendations.push('Remove any skill from the document that you cannot discuss credibly in an interview.');

  return recommendations;
}

export function computeAtsEstimate({ extraction, resume, jobAnalysis }: AtsInputs): ATSAnalysis {
  const listed = [...jobAnalysis.requiredSkills, ...jobAnalysis.preferredSkills];
  const keywords = [...extraction.matchedKeywords, ...extraction.missingKeywords];

  const keywordCoverage = ratio(extraction.matchedKeywords.length, keywords.length);
  const skillMatch = ratio(extraction.matchedSkills.length, listed.length);

  // 45% keyword coverage, 45% skill overlap, 10% structural completeness.
  const declaredSkills = resume.skills.length;
  const structural = ratio(Math.min(declaredSkills, 12), 12);
  const matchScore = Math.round(keywordCoverage * 0.45 + skillMatch * 0.45 + structural * 0.1);

  return {
    matchScore,
    tier: scoreTier(matchScore),
    keywordCoverage,
    skillMatch,
    matchedSkills: extraction.matchedSkills,
    missingSkills: extraction.missingSkills,
    recommendations: buildRecommendations(extraction, keywordCoverage, skillMatch),
    disclaimer: ATS_DISCLAIMER,
  };
}