import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { computeAtsEstimate } from '../src/lib/ats';
import { analyzeATS, analyzeJob, isConfigured, tailorResume } from '../src/services/ai/gemma';
import type { AnalyzeATSRequest, AnalyzeJobRequest, TailorResumeRequest } from '../src/types/ai';

/**
 * The API boundary.
 *
 *   browser (aiClient)  ->  POST /api/ai/*  ->  gemma.ts  ->  Gemma 4 31B IT
 *
 * The Gemini key is read here, on the server, from GEMINI_API_KEY. It is never
 * sent to the browser and never appears in any response.
 *
 * Percentages are still computed locally, in `src/lib/ats.ts`. The model only
 * extracts; it never returns a score.
 */

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    // A pasted job description is small; anything larger is a mistake.
    if (size > 2_000_000) throw new Error('Request body too large.');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleAi(req: http.IncomingMessage, res: http.ServerResponse, route: string): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Use POST.' });
    return;
  }
  if (!isConfigured()) {
    sendJson(res, 503, { ok: false, error: 'GEMINI_API_KEY is not set on the server.' });
    return;
  }

  try {
    const body = (await readBody(req)) as Record<string, unknown>;

    if (route === 'analyze-job') {
      const data = await analyzeJob(body as unknown as AnalyzeJobRequest);
      sendJson(res, 200, { ok: true, data });
      return;
    }

    if (route === 'tailor-resume') {
      const data = await tailorResume(body as unknown as TailorResumeRequest);
      sendJson(res, 200, { ok: true, data });
      return;
    }

    if (route === 'analyze-ats') {
      const request = body as unknown as AnalyzeATSRequest;
      const extraction = await analyzeATS(request);
      // Deterministic estimate, computed here — never returned by the model.
      const estimate = computeAtsEstimate({ extraction, resume: request.resume, jobAnalysis: request.jobAnalysis });
      sendJson(res, 200, { ok: true, data: { extraction, estimate } });
      return;
    }

    sendJson(res, 404, { ok: false, error: `Unknown route: ${route}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    sendJson(res, 500, { ok: false, error: message });
  }
}

function serveStatic(res: http.ServerResponse, root: string, pathname: string): void {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  let filePath = path.join(root, relative);

  // Contain the request inside the served directory.
  if (!filePath.startsWith(path.resolve(root))) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404).end('Not found');
    return;
  }

  const type = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(filePath).pipe(res);
}

export function createRequestHandler(staticRoot: string) {
  return (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true, geminiConfigured: isConfigured() });
      return;
    }
    if (url.pathname.startsWith('/api/ai/')) {
      void handleAi(req, res, url.pathname.slice('/api/ai/'.length));
      return;
    }
    serveStatic(res, staticRoot, url.pathname);
  };
}

/* Entry point when run directly: `npm run serve` */
const isDirectRun = process.argv[1]?.includes('server') ?? false;
if (isDirectRun) {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '0.0.0.0';
  const staticRoot = path.resolve(process.cwd(), 'dist');

  http
    .createServer(createRequestHandler(staticRoot))
    .listen(port, host, () => {
      process.stdout.write(
        `BUTCHER PROTOCOL server on http://${host}:${port} — gemma ${isConfigured() ? 'configured' : 'NOT configured'}\n`,
      );
    });
}