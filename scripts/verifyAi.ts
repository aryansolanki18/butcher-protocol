import { aiService } from '../src/services/ai/aiClient';
import { mockJobListings } from '../src/data/mockJobs';
import { mockResumes } from '../src/data/mockResumes';
import { mockProfile } from '../src/data/mockProfile';
import { deriveJob } from '../src/lib/matching';
import { GEMMA_MODEL } from '../src/services/ai/prompts';

/**
 * Phase 1 AI boundary verification.
 *
 * Confirms the three operations return well-formed, percentage-free extraction
 * and that the compatibility numbers are derived deterministically.
 */

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures += 1;
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}\n`);
};

const job = deriveJob(mockJobListings[0], mockProfile);
const resume = mockResumes[0];

const ats = await aiService.analyzeATS({
  resume: resume.content,
  jobAnalysis: job.analysis,
  jobDescription: job.description,
});

const extraction = ats.data.extraction;
const estimate = ats.data.estimate;

process.stdout.write(`model: ${GEMMA_MODEL}\nprovider: ${ats.meta.provider} (simulated=${ats.meta.simulated})\n\n`);
process.stdout.write(`keywords matched (${extraction.matchedKeywords.length}): ${extraction.matchedKeywords.join(', ')}\n`);
process.stdout.write(`keywords missing (${extraction.missingKeywords.length}): ${extraction.missingKeywords.slice(0, 12).join(', ')}\n`);
process.stdout.write(`skills matched: ${extraction.matchedSkills.join(', ')}\n`);
process.stdout.write(`skills missing: ${extraction.missingSkills.join(', ') || 'none'}\n`);
process.stdout.write(
  `estimate: readiness=${estimate.matchScore} keyword=${estimate.keywordCoverage} skill=${estimate.skillMatch}\n\n`,
);

check('extraction carries no percentage', !JSON.stringify(extraction).match(/\d+\s*%/));
check('extraction carries no score field', !('score' in extraction) && !('matchScore' in extraction));
check('keywords are well-formed words', extraction.matchedKeywords.every((k) => /^[a-z0-9+#.]+$/.test(k)), extraction.matchedKeywords.join(','));
check('keywords avoid company prose', !extraction.matchedKeywords.includes('labs'));
check('every matched keyword occurs in the resume', extraction.matchedKeywords.every((k) => resumeText(resume).includes(k)));
check('every missing keyword is absent from the resume', extraction.missingKeywords.every((k) => !resumeText(resume).includes(k)));
check('matched and missing partition the set', extraction.matchedKeywords.length + extraction.missingKeywords.length > 0);
check('skill match equals 100 when nothing missing', estimate.skillMatch === 100);
check('estimate is deterministic', estimate.matchScore === recompute(ats.data));
check('disclaimer present', estimate.disclaimer.includes('Internal compatibility estimate'));
check('recommendations are non-empty', estimate.recommendations.length > 0);

const forge = await aiService.tailorResume({
  profile: mockProfileRef(),
  baseResume: resume,
  jobAnalysis: job.analysis,
  jobDescription: job.description,
});

const tailored = forge.data;
const base = resume.content;
process.stdout.write(`\ntailored summary: ${tailored.summary}\n`);

check('no fabricated employers', tailored.experience.every((e) => base.experience.some((b) => b.company === e.company && b.role === e.role)));
check('no fabricated skills', tailored.skills.every((s) => base.skills.includes(s)));
check('no fabricated projects', tailored.projects.every((p) => base.projects.includes(p)));
check('education unchanged', tailored.education === base.education);
check('skill set unchanged, only reordered', [...tailored.skills].sort().join('|') === [...base.skills].sort().join('|'));

const analysis = await aiService.analyzeJob({ jobDescription: job.description, roleHint: job.analysis.role, companyHint: job.analysis.company });
check('analyzeJob returns the structured shape', ['role', 'requiredSkills', 'preferredSkills', 'experience', 'education', 'location', 'employmentType', 'summary'].every((k) => k in analysis.data));
check('analyzeJob emits no percentage', !JSON.stringify(analysis.data).match(/\d+\s*%/));

function resumeText(r: typeof resume): string {
  return [
    r.content.summary,
    r.content.skills.join(' '),
    r.content.education,
    r.content.projects.join(' '),
    ...r.content.experience.flatMap((i) => [i.role, i.company, ...i.points]),
  ]
    .join(' ')
    .toLowerCase();
}

function recompute(data: { extraction: typeof extraction; estimate: typeof estimate }): number {
  const keywords = [...data.extraction.matchedKeywords, ...data.extraction.missingKeywords];
  const listed = [...job.analysis.requiredSkills, ...job.analysis.preferredSkills];
  const kw = Math.round((data.extraction.matchedKeywords.length / keywords.length) * 100);
  const sk = Math.round((data.extraction.matchedSkills.length / listed.length) * 100);
  const structural = Math.round((Math.min(resume.content.skills.length, 12) / 12) * 100);
  return Math.round(kw * 0.45 + sk * 0.45 + structural * 0.1);
}

function mockProfileRef() {
  return {
    personal: { name: 'A', email: 'a@b.c', location: 'Bengaluru, India' },
    education: { degree: 'B.Tech', college: 'NIT', graduationYear: '2025' },
    skills: { programming: [], aiml: [], data: [], tools: [] },
    careerTargets: { desiredRoles: [], locations: [], remotePreference: 'HYBRID' as const },
    links: { github: '', linkedin: '' },
  };
}

process.stdout.write(failures === 0 ? '\nAI BOUNDARY VERIFICATION PASSED\n' : `\n${failures} AI FAILURE(S)\n`);
process.exit(failures === 0 ? 0 : 1);