import type { CareerProfile, Job, JobAnalysis, JobListing, MatchAnalysis, Priority, ScoreTier } from '@/types';

/**
 * Deterministic match scoring.
 *
 * This module is the reason BUTCHER PROTOCOL never asks the AI for a
 * percentage. Gemma extracts skills; this code decides the number.
 * Keep it pure and synchronous so it is trivially testable and portable to a
 * server action later.
 */

export const SCORE_THRESHOLDS = {
  high: 80,
  medium: 65,
  low: 50,
} as const;

export function scoreTier(score: number): ScoreTier {
  if (score >= SCORE_THRESHOLDS.high) return 'critical';
  if (score >= SCORE_THRESHOLDS.medium) return 'high';
  if (score >= SCORE_THRESHOLDS.low) return 'medium';
  return 'low';
}

export function priorityForTier(tier: ScoreTier): Priority {
  switch (tier) {
    case 'critical':
      return 'CRITICAL';
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

export function profileSkillSet(profile: CareerProfile): Set<string> {
  return new Set(
    [...profile.skills.programming, ...profile.skills.aiml, ...profile.skills.data, ...profile.skills.tools].map(
      normalise,
    ),
  );
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

export interface MatchInput {
  analysis: JobAnalysis;
  profile: CareerProfile;
}

/**
 * Weighted overlap between required + preferred skills and the operator's
 * genuine skill set, with a small fixed credit for role alignment.
 */
export function computeMatch({ analysis, profile }: MatchInput): MatchAnalysis {
  const owned = profileSkillSet(profile);
  const required = analysis.requiredSkills.map(normalise);
  const preferred = analysis.preferredSkills.map(normalise);

  const matchedRequired = required.filter((skill) => owned.has(skill));
  const matchedPreferred = preferred.filter((skill) => owned.has(skill));
  const missingSkills = [...required, ...preferred].filter((skill) => !owned.has(skill));

  const requiredCoverage = required.length === 0 ? 1 : matchedRequired.length / required.length;
  const preferredCoverage = preferred.length === 0 ? 0 : matchedPreferred.length / preferred.length;

  // Weighted to 100 so scores stay interpretable: 75 required coverage,
  // 15 preferred coverage, 10 role alignment.
  const skillScore = requiredCoverage * 75 + preferredCoverage * 15;

  const desiredRoles = profile.careerTargets.desiredRoles.map(normalise);
  const roleAligned = desiredRoles.some(
    (role) => role.includes(normalise(analysis.role)) || normalise(analysis.role).includes(role),
  );

  const raw = skillScore + (roleAligned ? 10 : 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    tier: scoreTier(score),
    matchedSkills: [...matchedRequired, ...matchedPreferred],
    missingSkills,
  };
}

export function formatPostedAt(iso: string, now = new Date()): string {
  const posted = new Date(iso);
  const days = Math.max(0, Math.round((now.getTime() - posted.getTime()) / 86_400_000));
  if (days === 0) return 'TODAY';
  if (days === 1) return '1 DAY AGO';
  if (days < 30) return `${days} DAYS AGO`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 MONTH AGO' : `${months} MONTHS AGO`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Joins a stored listing with a match computed against the operator's *current*
 * profile. Called on every read, so editing a skill on the profile screen
 * immediately re-scores every target in the product.
 */
export function deriveJob(listing: JobListing, profile: CareerProfile): Job {
  const match = computeMatch({ analysis: listing.analysis, profile });
  return { ...listing, matchScore: match.score, match, priority: priorityForTier(match.tier) };
}

export function deriveJobs(listings: JobListing[], profile: CareerProfile): Job[] {
  return listings.map((listing) => deriveJob(listing, profile));
}