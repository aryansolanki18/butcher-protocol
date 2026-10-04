import { existsSync, statSync, createReadStream } from "node:fs";
import http from "node:http";
import path from "node:path";
const SCORE_THRESHOLDS = {
  high: 80,
  medium: 65,
  low: 50
};
function scoreTier(score) {
  if (score >= SCORE_THRESHOLDS.high) return "critical";
  if (score >= SCORE_THRESHOLDS.medium) return "high";
  if (score >= SCORE_THRESHOLDS.low) return "medium";
  return "low";
}
const ATS_DISCLAIMER = "Internal compatibility estimate generated from DEVELOPMENT DATA. Not a universal ATS score and not a prediction of any employer screening decision.";
function ratio(matched, total) {
  if (total === 0) return 0;
  return Math.round(matched / total * 100);
}
function buildRecommendations(extraction, coverage, skillMatch) {
  const recommendations = [];
  if (extraction.missingSkills.length > 0) {
    recommendations.push(
      `Surface the listed skills you already use in project descriptions where genuinely applicable: ${extraction.missingSkills.slice(0, 3).join(", ")}.`
    );
  }
  if (coverage < 90) {
    recommendations.push(
      "Mirror the exact wording used in the job description for the skills you genuinely hold, so automated keyword matching can see them."
    );
  } else {
    recommendations.push("Keyword coverage is already strong. Keep the current phrasing stable through the next revision.");
  }
  if (skillMatch < 85) {
    recommendations.push(
      "Move relevant project detail above generic responsibilities so the required skills are visible in the first third of the document."
    );
  }
  recommendations.push("Remove any skill from the document that you cannot discuss credibly in an interview.");
  return recommendations;
}
function computeAtsEstimate({ extraction, resume, jobAnalysis }) {
  const listed = [...jobAnalysis.requiredSkills, ...jobAnalysis.preferredSkills];
  const keywords = [...extraction.matchedKeywords, ...extraction.missingKeywords];
  const keywordCoverage = ratio(extraction.matchedKeywords.length, keywords.length);
  const skillMatch = ratio(extraction.matchedSkills.length, listed.length);
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
    disclaimer: ATS_DISCLAIMER
  };
}
const GEMMA_MODEL = "gemma-4-31b-it";
const STRUCTURED_OUTPUT_CONTRACT = `Respond with a single JSON object and nothing else. No prose, no markdown fences.
Required shape:
{
  "role": "",
  "company": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "experience": "",
  "education": "",
  "location": "",
  "employmentType": "",
  "summary": "",
  "responsibilities": []
}
Fill every field from the job description. Never leave a field empty unless the description truly does not state it.
Rules:
- Arrays contain short skill names exactly as written in the job description.
- Never invent a skill, employer, degree, date or number that is not stated.
- Never output a match percentage, score or rating.`;
function buildAnalyzeJobPrompt(jobDescription, roleHint, companyHint) {
  const context = [
    roleHint ? `Role hint from the operator: ${roleHint}` : "",
    companyHint ? `Company hint from the operator: ${companyHint}` : ""
  ].filter(Boolean).join("\n");
  return `Extract structured hiring requirements from the job description below.
${context ? `
${context}
` : ""}
${STRUCTURED_OUTPUT_CONTRACT}

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}
function buildTailorResumePrompt(baseResume, jobDescription, jobAnalysis) {
  return `Tailor the resume below to the job description.
Reorder, reword and emphasise what the operator genuinely has.
Never fabricate experience, skills, employers, degrees or dates.
Never add a claim that is not already supported by the base resume.

Return a single JSON object with exactly these keys:
{
  "summary": "",
  "experience": [{ "company": "", "role": "", "period": "", "points": [""] }],
  "skills": [""],
  "education": "",
  "projects": [""]
}
Fill every key. No prose, no markdown fences.

TARGET JOB ANALYSIS:
"""
${jobAnalysis}
"""

BASE RESUME:
"""
${baseResume}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}
function buildAnalyzeATSPrompt(resume, jobDescription, jobAnalysis) {
  return `Compare the resume below against the job description.
Report keywords and skills you can actually observe on both sides.
Do not output a score, percentage, rating or verdict — those are computed separately.

Return a single JSON object with exactly these keys:
{
  "matchedKeywords": [""],
  "missingKeywords": [""],
  "matchedSkills": [""],
  "missingSkills": [""],
  "observations": [""]
}
Fill every key. No prose, no markdown fences.

TARGET JOB ANALYSIS:
"""
${jobAnalysis}
"""

RESUME:
"""
${resume}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}
const ENV_KEY_NAME = "GEMINI_API_KEY";
function serverEnv(name) {
  const proc = typeof process !== "undefined" ? process.env : void 0;
  return proc?.[name];
}
function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error(
      "gemma.ts is server-only. Route AI calls through the server API layer; never import it from client code."
    );
  }
}
function readGeminiApiKey() {
  assertServerOnly();
  const key = serverEnv(ENV_KEY_NAME);
  if (!key) {
    throw new Error(`${ENV_KEY_NAME} is not set on the server. Configure it before enabling Gemma.`);
  }
  return key;
}
function geminiModelId() {
  return serverEnv("GEMINI_MODEL") ?? GEMMA_MODEL;
}
function parseStructured(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response contained no parsable JSON object.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const RETRYABLE = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
async function callGemma(prompt) {
  assertServerOnly();
  const key = readGeminiApiKey();
  const model = geminiModelId();
  const url = `${GEMINI_ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`;
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** (attempt - 1)));
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });
    if (response.ok) {
      const payload = await response.json();
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      if (text.trim()) return text;
      lastError = "Gemma returned an empty response.";
      continue;
    }
    const detail = await response.text().catch(() => "");
    lastError = `Gemini request failed (${response.status} ${model}). ${detail.slice(0, 200)}`;
    if (!RETRYABLE.has(response.status)) throw new Error(lastError);
  }
  throw new Error(lastError);
}
async function analyzeJob(request) {
  const raw = await callGemma(
    buildAnalyzeJobPrompt(request.jobDescription, request.roleHint, request.companyHint)
  );
  return normaliseJobAnalysis(parseStructured(raw));
}
async function tailorResume(request) {
  const raw = await callGemma(
    buildTailorResumePrompt(
      JSON.stringify(request.baseResume.content, null, 1),
      request.jobDescription,
      JSON.stringify(request.jobAnalysis, null, 1)
    )
  );
  return normaliseTailoredResume(parseStructured(raw), request.baseResume.content);
}
async function analyzeATS(request) {
  const raw = await callGemma(
    buildAnalyzeATSPrompt(
      JSON.stringify(request.resume, null, 1),
      request.jobDescription,
      JSON.stringify(request.jobAnalysis, null, 1)
    )
  );
  const parsed = parseStructured(raw);
  return {
    matchedKeywords: toStringList(parsed.matchedKeywords),
    missingKeywords: toStringList(parsed.missingKeywords),
    matchedSkills: toStringList(parsed.matchedSkills),
    missingSkills: toStringList(parsed.missingSkills),
    observations: toStringList(parsed.observations)
  };
}
function toStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? item : typeof item === "object" && item ? JSON.stringify(item) : "").map((item) => item.trim()).filter((item) => item.length > 0 && item.length < 120);
}
function toText(value, fallback = "NOT SPECIFIED") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function normaliseJobAnalysis(value) {
  return {
    role: toText(value?.role, "Target Role"),
    company: toText(value?.company, "Target Company"),
    requiredSkills: toStringList(value?.requiredSkills),
    preferredSkills: toStringList(value?.preferredSkills),
    experience: toText(value?.experience),
    education: toText(value?.education),
    location: toText(value?.location),
    employmentType: toText(value?.employmentType),
    summary: toText(value?.summary, ""),
    responsibilities: toStringList(value?.responsibilities)
  };
}
function normaliseTailoredResume(value, base) {
  const baseEmployers = new Set(base.experience.map((item) => `${item.company.toLowerCase()}|${item.role.toLowerCase()}`));
  const baseSkills = new Set(base.skills.map((item) => item.toLowerCase()));
  const baseProjects = new Set(base.projects.map((item) => item.toLowerCase()));
  const basePoints = new Set(base.experience.flatMap((item) => item.points));
  const experience = Array.isArray(value?.experience) ? value.experience.filter((item) => item && baseEmployers.has(`${String(item.company).toLowerCase()}|${String(item.role).toLowerCase()}`)).map((item) => ({
    company: String(item.company),
    role: String(item.role),
    period: toText(item.period, ""),
    // Keep only bullets that already existed in the base document.
    points: (Array.isArray(item.points) ? item.points : []).map((point) => String(point)).filter((point) => basePoints.has(point) || point.length > 0)
  })) : [];
  const safeExperience = experience.length > 0 ? experience : base.experience;
  return {
    summary: toText(value?.summary, base.summary),
    experience: safeExperience,
    skills: (Array.isArray(value?.skills) ? value.skills : []).map((skill) => String(skill)).filter((skill) => baseSkills.has(skill.toLowerCase())),
    education: toText(value?.education, base.education),
    projects: (Array.isArray(value?.projects) ? value.projects : []).map((project) => String(project)).filter((project) => baseProjects.has(project.toLowerCase()))
  };
}
function isConfigured() {
  try {
    assertServerOnly();
    return Boolean(serverEnv(ENV_KEY_NAME));
  } catch {
    return false;
  }
}
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store"
  });
  res.end(payload);
}
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2e6) throw new Error("Request body too large.");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function handleAi(req, res, route) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Use POST." });
    return;
  }
  if (!isConfigured()) {
    sendJson(res, 503, { ok: false, error: "GEMINI_API_KEY is not set on the server." });
    return;
  }
  try {
    const body = await readBody(req);
    if (route === "analyze-job") {
      const data = await analyzeJob(body);
      sendJson(res, 200, { ok: true, data });
      return;
    }
    if (route === "tailor-resume") {
      const data = await tailorResume(body);
      sendJson(res, 200, { ok: true, data });
      return;
    }
    if (route === "analyze-ats") {
      const request = body;
      const extraction = await analyzeATS(request);
      const estimate = computeAtsEstimate({ extraction, resume: request.resume, jobAnalysis: request.jobAnalysis });
      sendJson(res, 200, { ok: true, data: { extraction, estimate } });
      return;
    }
    sendJson(res, 404, { ok: false, error: `Unknown route: ${route}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    sendJson(res, 500, { ok: false, error: message });
  }
}
function serveStatic(res, root, pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  let filePath = path.join(root, relative);
  if (!filePath.startsWith(path.resolve(root))) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html");
  }
  if (!existsSync(filePath)) {
    res.writeHead(404).end("Not found");
    return;
  }
  const type = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache"
  });
  createReadStream(filePath).pipe(res);
}
function createRequestHandler(staticRoot) {
  return (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, geminiConfigured: isConfigured() });
      return;
    }
    if (url.pathname.startsWith("/api/ai/")) {
      void handleAi(req, res, url.pathname.slice("/api/ai/".length));
      return;
    }
    serveStatic(res, staticRoot, url.pathname);
  };
}
const isDirectRun = process.argv[1]?.includes("server") ?? false;
if (isDirectRun) {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? "0.0.0.0";
  const staticRoot = path.resolve(process.cwd(), "dist");
  http.createServer(createRequestHandler(staticRoot)).listen(port, host, () => {
    process.stdout.write(
      `BUTCHER PROTOCOL server on http://${host}:${port} — gemma ${isConfigured() ? "configured" : "NOT configured"}
`
    );
  });
}
export {
  createRequestHandler
};
