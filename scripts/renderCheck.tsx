import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import App from '../src/App';

/**
 * Phase 1 verification harness.
 *
 * Renders every route through React's server renderer and asserts that the
 * markup contains the expected BUTCHER PROTOCOL terminology. A runtime crash
 * or a missing route produces a failure here rather than in a browser.
 */

const CASES: { path: string; expect: string[] }[] = [
  { path: '/', expect: ['Butcher', 'Protocol', 'AI-Powered Career Intelligence System', 'Initialize Protocol', 'View Intelligence'] },
  { path: '/login', expect: ['Initialize Session', 'Create Identity', 'Email', 'Password'] },
  { path: '/dashboard', expect: ['Command Center', 'Targets Acquired', 'High Match Targets', 'ATS Readiness', 'Active Operations', 'Quick Actions', 'Scan For Jobs', 'Forge Resume', 'Run Protocol Scan', 'View Operations', 'Intel Feed', 'High Priority Targets'] },
  { path: '/intel-feed', expect: ['Intel Feed', 'Target Acquired', 'Skill Matrix', 'Match Analysis', 'View Target', 'Save Target', 'Forge Resume'] },
  { path: '/target-database', expect: ['Target Database', 'Registry', 'Saved Targets', 'Added By You', 'Open Intel Feed'] },
  { path: '/identity-forge', expect: ['Identity Forge', 'Document Selected', 'Analyzing Target', 'Forging Resume', 'Identity Ready', 'Base Document', 'Forge Resume'] },
  { path: '/protocol-scan', expect: ['Protocol Scan', 'Internal compatibility estimate', 'Run Scan', 'Target'] },
  { path: '/operations', expect: ['Operation Status', 'SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER', 'Board', 'List'] },
  { path: '/profile', expect: ['Personal', 'Education', 'Skills', 'Career Targets', 'Links', 'Edit Profile', 'Programming'] },
  { path: '/settings', expect: ['Settings', 'Module not active in Phase 01', 'Planned Capabilities'] },
  { path: '/unknown-route', expect: ['Signal Lost', 'Error 404', 'Command Center'] },
];

function render(path: string): string {
  return renderToString(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App as () => ReactNode)));
}

let failures = 0;
for (const testCase of CASES) {
  try {
    const html = render(testCase.path);
    const missing = testCase.expect.filter((needle) => !html.includes(needle));
    if (missing.length > 0) {
      failures += 1;
      process.stdout.write(`FAIL  ${testCase.path} — missing: ${missing.join(' | ')}\n`);
    } else {
      process.stdout.write(`PASS  ${testCase.path} (${html.length} bytes)\n`);
    }
  } catch (error) {
    failures += 1;
    process.stdout.write(`FAIL  ${testCase.path} — threw: ${(error as Error).message}\n`);
  }
}

// Secondary route: identity forge with a target query string.
try {
  const html = render('/identity-forge?target=bp-012');
  const ok = html.includes('Arclight Inference');
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  /identity-forge?target=bp-012\n`);
  if (!ok) failures += 1;
} catch (error) {
  failures += 1;
  process.stdout.write(`FAIL  /identity-forge?target=bp-012 — threw: ${(error as Error).message}\n`);
}

process.stdout.write(`\n${failures === 0 ? 'ALL ROUTES RENDER' : `${failures} FAILURE(S)`}\n`);
process.exit(failures === 0 ? 0 : 1);