// Napkin Quest API + static server. Zero dependencies, fully stateless.
//
//   GET  /api/health                         → { ok }
//   GET  /api/meta                           → worlds, template count, pocket guide
//   GET  /api/round?world=storage&seed=N     → 10 questions, answers stripped
//   POST /api/grade  { id, answers:[{key,value,unit}] } → levels, slips, worked steps
//   GET  /api/blitz?seed=N                   → 80 multiple-choice questions, no answers
//   POST /api/blitz/check { id, choice }     → { correct, correctIndex, steps }
//
// A question id is "<template>~<seed>", so grading rebuilds the question in O(1):
// no database, no sessions, and any instance can serve any request.

import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { buildRound, buildQuestion, publicQuestion, grade, buildBlitz, checkBlitz, WORLD_INFO, TEMPLATE_COUNT, CHEATSHEET } from "../web/shared/engine.js";

const PORT = Number(process.env.PORT) || 3000;
const WEB_ROOT = fileURLToPath(new URL("../web/", import.meta.url));
const MAX_BODY = 8 * 1024;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

// Static assets are small: load + gzip once at boot, serve from memory.
const assets = new Map();
async function loadAssets(dir = WEB_ROOT, prefix = "/") {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if ((await stat(full)).isDirectory()) { await loadAssets(full, `${prefix}${name}/`); continue; }
    const body = await readFile(full);
    assets.set(prefix + name, { body, gz: gzipSync(body), type: TYPES[extname(name)] || "application/octet-stream" });
  }
  assets.set("/", assets.get("/index.html"));
}

const WORLD_IDS = new Set(["mix", ...WORLD_INFO.map((w) => w.id)]);

function send(req, res, status, data, headers = {}) {
  const body = Buffer.from(JSON.stringify(data));
  const gz = /\bgzip\b/.test(req.headers["accept-encoding"] || "") && body.length > 1024;
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(gz && { "content-encoding": "gzip", vary: "accept-encoding" }), ...headers });
  res.end(gz ? gzipSync(body) : body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 1024 * 1024) { req.destroy(); return; } // hard stop on abuse
      if (size > MAX_BODY) { chunks.length = 0; return; } // keep draining, answer 413 at end
      chunks.push(c);
    });
    req.on("end", () => { if (size > MAX_BODY) return reject(Object.assign(new Error("Body too large"), { status: 413 })); try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); } });
    req.on("error", reject);
  });
}

function seedParam(url) {
  const raw = url.searchParams.get("seed");
  if (raw == null) return { seed: undefined };
  const seed = Number(raw);
  return Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? { seed } : { error: true };
}
const IMMUTABLE = { "cache-control": "public, max-age=31536000, immutable" };

const routes = {
  "GET /api/health": (req, res) => send(req, res, 200, { ok: true }),
  "GET /api/meta": (req, res) => send(req, res, 200, { worlds: WORLD_INFO, templateCount: TEMPLATE_COUNT, cheatsheet: CHEATSHEET }, { "cache-control": "public, max-age=3600" }),
  "GET /api/round": (req, res, url) => {
    const world = url.searchParams.get("world") || "mix";
    if (!WORLD_IDS.has(world)) return send(req, res, 400, { error: "Unknown world" });
    const { seed, error } = seedParam(url);
    if (error) return send(req, res, 400, { error: "Bad seed" });
    const round = buildRound(world, seed);
    send(req, res, 200, { ...round, questions: round.questions.map(publicQuestion) }, seed !== undefined ? IMMUTABLE : {});
  },
  "POST /api/grade": async (req, res) => {
    const body = await readJson(req);
    const q = buildQuestion(body.id);
    if (!q) return send(req, res, 404, { error: "Unknown question" });
    if (!Array.isArray(body.answers) || body.answers.length > 10) return send(req, res, 400, { error: "answers must be an array" });
    const answers = body.answers.map((a) => ({ key: String(a?.key ?? ""), value: String(a?.value ?? "").slice(0, 40), unit: String(a?.unit ?? "") }));
    send(req, res, 200, grade(q, answers));
  },
  "GET /api/blitz": (req, res, url) => {
    const { seed, error } = seedParam(url);
    if (error) return send(req, res, 400, { error: "Bad seed" });
    send(req, res, 200, buildBlitz(seed), seed !== undefined ? IMMUTABLE : {});
  },
  "POST /api/blitz/check": async (req, res) => {
    const body = await readJson(req);
    const result = checkBlitz(body.id, body.choice);
    if (!result) return send(req, res, 404, { error: "Unknown question" });
    send(req, res, 200, result);
  },
};

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://local");
    try {
      const route = routes[`${req.method} ${url.pathname}`];
      if (route) return await route(req, res, url);
      if (url.pathname.startsWith("/api/")) return send(req, res, 404, { error: "Not found" });
      if (req.method !== "GET" && req.method !== "HEAD") return send(req, res, 405, { error: "Method not allowed" });
      const asset = assets.get(normalize(decodeURIComponent(url.pathname)).replace(/\\/g, "/"));
      if (!asset) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("Not found"); }
      const gz = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
      res.writeHead(200, { "content-type": asset.type, "cache-control": "public, max-age=300", vary: "accept-encoding", ...(gz && { "content-encoding": "gzip" }) });
      res.end(req.method === "HEAD" ? undefined : gz ? asset.gz : asset.body);
    } catch (err) {
      send(req, res, err.status || 500, { error: err.status ? err.message : "Internal error" });
      if (!err.status) console.error(err);
    }
  });
}

export async function start(port = PORT) {
  await loadAssets();
  const server = createServer();
  await new Promise((r) => server.listen(port, r));
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  start().then((s) => console.log(`Napkin Quest running on http://localhost:${s.address().port}`));
}
