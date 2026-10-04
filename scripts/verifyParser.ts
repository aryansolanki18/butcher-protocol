import { parseResumeText } from '../src/lib/resumeParser';

const RESUME = `Summary
Backend engineer with six years building payment systems.

Experience
Senior Engineer, Globex — Mar 2021 — Present
• Led migration of the ledger to Postgres
• Cut p99 latency by 45%

Skills
Go, Kubernetes, PostgreSQL, gRPC, Docker

Education
B.Tech Computer Science, 2019`;

const out = parseResumeText(RESUME);
console.log(JSON.stringify(out, null, 1));

const ok =
  out.content.summary.includes('payment systems') &&
  out.content.skills.includes('Go') &&
  out.content.skills.includes('Docker') &&
  out.content.education.includes('2019') &&
  out.content.experience.length === 1 &&
  out.content.experience[0].company === 'Globex' &&
  out.content.experience[0].role.includes('Senior Engineer') &&
  out.content.experience[0].period.includes('2021') &&
  out.content.experience[0].points.length === 2;
console.log(ok ? '\nPARSER OK' : '\nPARSER FAILED');
process.exit(ok ? 0 : 1);