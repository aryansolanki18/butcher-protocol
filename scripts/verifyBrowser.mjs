/**
 * Phase 1 browser verification harness.
 *
 * Drives headless Chrome over the DevTools Protocol to:
 *   1. load every route at four breakpoints,
 *   2. fail on horizontal page overflow and report the offending elements,
 *   3. collect console errors and page exceptions,
 *   4. confirm the Gemini boundary is absent from the browser runtime.
 *
 * Usage: node scripts/verifyBrowser.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:4173';
const PORT = 9333;

const ROUTES = [
  '/',
  '/login',
  '/dashboard',
  '/intel-feed',
  '/target-database',
  '/identity-forge',
  '/protocol-scan',
  '/operations',
  '/profile',
  '/settings',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1600, height: 1000 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(path) {
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return response.json();
}

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      this.events.push(message);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30_000);
    });
  }

  drainConsole() {
    const errors = [];
    for (const event of this.events) {
      if (event.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(event.params.type)) {
        errors.push(`${event.params.type}: ${event.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
      }
      if (event.method === 'Runtime.exceptionThrown') {
        errors.push(`exception: ${event.params.exceptionDetails.text} ${event.params.exceptionDetails.exception?.description ?? ''}`);
      }
      if (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params.entry.level)) {
        errors.push(`${event.params.entry.level}: ${event.params.entry.text} ${event.params.entry.url ?? ''}`);
      }
    }
    this.events = [];
    return errors;
  }
}

const OVERFLOW_PROBE = `(() => {
  const docWidth = document.documentElement.clientWidth;
  const clipped = (el) => {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') return true;
      node = node.parentElement;
    }
    return false;
  };
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= docWidth + 1 && rect.left >= -1) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (clipped(el)) continue;
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 90),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
    });
  }
  const unclippedScrollers = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && !clipped(el)) {
      unclippedScrollers.push({ tag: el.tagName.toLowerCase(), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
    }
  }
  return {
    docWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > docWidth + 1,
    offenders: offenders.slice(0, 6),
    scrollers: unclippedScrollers.slice(0, 6),
    text: (document.body.innerText || '').length,
  };
})()`;

async function main() {
  const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const { spawn } = await import('node:child_process');
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      `--remote-debugging-port=${PORT}`,
      '--user-data-dir=C:\\Users\\aryan\\AppData\\Local\\Temp\\kilo\\cdp-verify',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let target = null;
  for (let attempt = 0; attempt < 40 && !target; attempt += 1) {
    try {
      const list = await fetchJson('/json/list');
      target = list.find((entry) => entry.type === 'page');
    } catch {
      await sleep(300);
    }
  }
  if (!target) {
    child.kill();
    throw new Error('Could not attach to Chrome DevTools');
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const session = new Session(ws);
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Log.enable');

  let failures = 0;

  for (const viewport of VIEWPORTS) {
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 640,
    });

    for (const route of ROUTES) {
      session.drainConsole();
      await session.send('Page.navigate', { url: `${BASE}${route}` });
      await sleep(1400);

      const probe = await session.send('Runtime.evaluate', { expression: OVERFLOW_PROBE, returnByValue: true });
      const result = probe.result.value;
      const consoleErrors = session.drainConsole();

      const problems = [];
      if (result.overflow) problems.push(`h-overflow ${result.scrollWidth}>${result.docWidth}`);
      if (result.offenders.length > 0) {
        problems.push(`offender: ${result.offenders.map((o) => `${o.tag}[${o.left}..${o.right}] ${o.cls}`).join(' ; ')}`);
      }
      if (result.scrollers.length > 0) {
        problems.push(`unclipped scroller: ${result.scrollers.map((s) => `${s.tag} ${s.scrollWidth}>${s.clientWidth}`).join(' ; ')}`);
      }
      if (result.text < 120) problems.push(`suspiciously empty (${result.text} chars)`);
      for (const entry of consoleErrors) problems.push(`console ${entry}`);

      const status = problems.length === 0 ? 'PASS' : 'FAIL';
      if (problems.length > 0) failures += 1;
      process.stdout.write(
        `${status}  ${viewport.name.padEnd(8)} ${route.padEnd(18)} text=${String(result.text).padStart(6)} ${problems.join(' | ')}\n`,
      );
    }
  }

  // Gemini boundary must not exist in the browser runtime.
  const leak = await session.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      key: typeof GEMINI_API_KEY,
      generative: String(window).includes('generativelanguage'),
      globals: Object.keys(window).filter((k) => /gemma|gemini/i.test(k)),
    })`,
    returnByValue: true,
  });
  process.stdout.write(`\nGemini boundary in browser: ${leak.result.value}\n`);

  // Full-page captures at the two primary targets.
  if (process.env.SHOT_DIR) {
    const { mkdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    mkdirSync(process.env.SHOT_DIR, { recursive: true });
    for (const viewport of [
      { name: 'desktop', width: 1600, height: 1000 },
      { name: 'mobile', width: 390, height: 844 },
    ]) {
      await session.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width < 640,
      });
      for (const route of ROUTES) {
        await session.send('Page.navigate', { url: `${BASE}${route}` });
        await sleep(1800);
        const shot = await session.send('Page.captureScreenshot', { format: 'png' });
        const name = route === '/' ? 'root' : route.replace(/\//g, '_').replace(/^_/, '');
        const { writeFileSync } = await import('node:fs');
        writeFileSync(join(process.env.SHOT_DIR, `${viewport.name}_${name}.png`), Buffer.from(shot.data, 'base64'));
      }
    }
    process.stdout.write(`\nScreenshots written to ${process.env.SHOT_DIR}\n`);
  }

  ws.close();
  child.kill();
  process.stdout.write(failures === 0 ? '\nBROWSER VERIFICATION PASSED\n' : `\n${failures} BROWSER FAILURE(S)\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});