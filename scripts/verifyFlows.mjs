/**
 * Phase 1 interaction verification.
 *
 * Drives the real UI over CDP: forge, scan, filter, save, advance, validate,
 * navigate. Asserts that each simulated AI flow reaches its success state and
 * that filtering actually narrows the registry.
 *
 * Usage: node scripts/verifyFlows.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:4173';
const PORT = 9336;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const { spawn } = await import('node:child_process');
const child = spawn(
  chrome,
  [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:\\Users\\aryan\\AppData\\Local\\Temp\\kilo\\cdp-flows',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let target = null;
for (let i = 0; i < 40 && !target; i += 1) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((e) => e.type === 'page');
  } catch { await sleep(300); }
}
if (!target) { child.kill(); throw new Error('no devtools target'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });

let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m); return; }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) {
    process.stdout.write(`      [eval error] ${r.result.exceptionDetails.text}\n`);
    return undefined;
  }
  return r.result?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const goto = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` });
  await sleep(1500);
};

const clickText = async (text, tag = 'button, a') =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
      .find((n) => (n.innerText || '').trim().toUpperCase().includes(${JSON.stringify(text.toUpperCase())}));
    if (!el) return false;
    el.click();
    return true;
  })()`);

const bodyText = () => evaluate('document.body.innerText');
const count = (needle) =>
  evaluate(`(document.body.innerText.match(new RegExp(${JSON.stringify(needle)}, 'g')) || []).length`);

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures += 1;
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}\n`);
};

/* ---------------------------------------------------------------- IDENTITY FORGE */
await goto('/identity-forge');
check('forge: idle state shown', (await bodyText()).includes('NO FORGED DOCUMENT YET'));
const forgedBefore = await count('TARGET BRIEF');
check('forge: target brief rendered', forgedBefore > 0);
await clickText('FORGE RESUME');
await sleep(2600);
const forgeText = await bodyText();
check('forge: reaches identity ready', forgeText.includes('IDENTITY READY') && !forgeText.includes('NO FORGED DOCUMENT YET'));
check('forge: renders resume sections', ['SUMMARY', 'EXPERIENCE', 'SKILLS', 'EDUCATION', 'PROJECTS'].every((s) => forgeText.includes(s)));
check('forge: confidentiality label', forgeText.includes('CONFIDENTIAL'));
await clickText('EDIT');
await sleep(400);
check('forge: edit control opens summary editor', await evaluate(`Boolean(document.querySelector('textarea[aria-label="Summary"]'))`));
await clickText('SAVE EDIT');
await sleep(300);
await clickText('REGENERATE');
await sleep(2600);
check('forge: regenerate completes', (await bodyText()).includes('IDENTITY READY'));

/* ---------------------------------------------------------------- PROTOCOL SCAN */
await goto('/protocol-scan');
check('scan: idle state shown', (await bodyText()).includes('NO DIAGNOSTIC DATA'));
check('scan: measurement basis explained', (await bodyText()).includes('MEASUREMENT BASIS'));
await clickText('RUN SCAN');
await sleep(2400);
const scanText = await bodyText();
check('scan: metrics render', ['ATS READINESS', 'KEYWORD COVERAGE', 'SKILL MATCH'].every((s) => scanText.includes(s)));
check('scan: missing skills panel', scanText.includes('MISSING SKILLS'));
check('scan: recommendations panel', scanText.includes('RECOMMENDATIONS'));
check('scan: labelled as internal estimate', scanText.toUpperCase().includes('INTERNAL COMPATIBILITY ESTIMATE'));
check('scan: diagnostics complete', scanText.includes('COMPLETE'));

/* ---------------------------------------------------------------- INTEL FEED */
await goto('/intel-feed');
const allCards = await count('TARGET ACQUIRED');
check('feed: renders all mock targets', allCards === 14, `${allCards} cards`);
await evaluate(`(() => {
  const i = document.querySelector('#intel-search');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(i, 'Quanterra');
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await sleep(500);
const filtered = await count('TARGET ACQUIRED');
check('feed: search narrows results', filtered === 1, `${filtered} card(s) for "Quanterra"`);
check('feed: search result correct', (await bodyText()).includes('Quanterra'));
await evaluate(`(() => {
  const i = document.querySelector('#intel-search');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(i, '');
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await sleep(400);
await clickText('FILTERS');
await sleep(400);
check('feed: filter panel opens', (await bodyText()).includes('MATCH SCORE') && (await bodyText()).includes('WORK MODE'));
await clickText('RESET FILTERS');
await sleep(300);
check('feed: reset restores all targets', (await count('TARGET ACQUIRED')) === 14);

const savedBefore = await evaluate(`document.body.innerText.split('SAVE TARGET').length - 1`);
await clickText('SAVE TARGET');
await sleep(400);
const savedAfter = await evaluate(`document.body.innerText.split('SAVE TARGET').length - 1`);
check('feed: save target toggles state', savedAfter === savedBefore - 1, `${savedBefore} → ${savedAfter}`);

await clickText('VIEW TARGET');
await sleep(700);
const modalText = await bodyText();
check('feed: target detail modal opens', modalText.includes('BRIEFING') && modalText.includes('RESPONSIBILITIES'));
await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
await sleep(500);
check('feed: modal closes on escape', !(await bodyText()).includes('RESPONSIBILITIES'));

/* ---------------------------------------------------------------- OPERATIONS */
await goto('/operations');
const opColumns = ['SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER'];
const opInitial = await bodyText();
check('operations: board renders columns', opColumns.every((s) => opInitial.includes(s)));
await clickText('MOVE TO APPLIED');
await sleep(500);
check('operations: status advance works', (await bodyText()).includes('MOVE TO INTERVIEW'));
await clickText('LIST');
await sleep(500);
check('operations: list view renders rows', (await evaluate(`document.querySelectorAll('time').length`)) > 0);

/* ---------------------------------------------------------------- LOGIN */
await goto('/login');
await clickText('INITIALIZE SESSION', 'button[type=submit]');
await sleep(400);
const loginErr = await bodyText();
check('login: rejects empty submit', loginErr.includes('Email is required.') && loginErr.includes('Password is required.'));
await evaluate(`(() => {
  const i = document.querySelector('input[type=email]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(i, 'not-an-email');
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await evaluate(`(() => {
  const i = document.querySelector('input[type=password]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(i, 'secret123');
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await sleep(300);
await clickText('INITIALIZE SESSION', 'button[type=submit]');
await sleep(400);
check('login: rejects malformed email', (await bodyText()).includes('Enter a valid email address.'));
await clickText('CREATE IDENTITY', 'button');
await sleep(400);
check('login: create identity mode switches', (await bodyText()).includes('CONFIRM PASSWORD'));
await clickText('INITIALIZE SESSION', 'button');
await sleep(300);

/* ---------------------------------------------------------------- SHELL NAV */
await goto('/dashboard');
const navHrefs = await evaluate(`JSON.stringify([...document.querySelectorAll('nav[aria-label="Primary"] a')].map((a) => a.getAttribute('href')))`);
const hrefs = JSON.parse(navHrefs);
check('shell: sidebar has eight modules', hrefs.length === 8, hrefs.join(','));
const expected = ['/dashboard', '/intel-feed', '/target-database', '/identity-forge', '/protocol-scan', '/operations', '/profile', '/settings'];
check('shell: sidebar hrefs match spec', expected.every((h) => hrefs.includes(h)));
for (const href of expected) {
  await goto(href);
  const ok = (await evaluate(`Boolean(document.querySelector('nav[aria-label="Primary"] a[aria-current="page"]'))`));
  if (!ok) { failures += 1; process.stdout.write(`FAIL  shell: active state on ${href}\n`); }
}
check('shell: active state on every module', true, 'verified above unless a FAIL was printed');
await goto('/');
check('landing: primary CTA present', await evaluate(`Boolean([...document.querySelectorAll('a')].find((a) => a.innerText.includes('INITIALIZE PROTOCOL')))`));
check('landing: secondary CTA present', await evaluate(`Boolean([...document.querySelectorAll('a')].find((a) => a.innerText.includes('VIEW INTELLIGENCE')))`));

/* ---------------------------------------------------------------- LINK AUDIT */
await goto('/intel-feed');
const deadLinks = await evaluate(`JSON.stringify(
  [...document.querySelectorAll('a[href^="http"]')].map((a) => a.getAttribute('href'))
)`);
check('links: no external or dead anchors', deadLinks === '[]', deadLinks);

/* ---------------------------------------------------------------- CONSOLE */
check('console: no runtime errors across flows', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

ws.close();
child.kill();
process.stdout.write(failures === 0 ? '\nFLOW VERIFICATION PASSED\n' : `\n${failures} FLOW FAILURE(S)\n`);
process.exit(failures === 0 ? 0 : 1);