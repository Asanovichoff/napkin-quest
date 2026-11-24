// One interface, two transports. RemoteApi talks to the Node server, which keeps
// answers hidden until you submit. LocalApi runs the same engine in the browser
// for static hosting. The UI can't tell which one it's using.
import { buildRound, buildQuestion, publicQuestion, grade, buildBlitz, checkBlitz, WORLD_INFO, TEMPLATE_COUNT, CHEATSHEET } from "./shared/engine.js";

function remoteApi(base) {
  const json = async (res) => { if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText); return res.json(); };
  const post = (path, body) => fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(json);
  const q = (seed) => (seed != null ? `seed=${seed}` : "");
  return {
    mode: "server",
    meta: () => fetch(`${base}api/meta`).then(json),
    round: (world, seed) => fetch(`${base}api/round?world=${encodeURIComponent(world)}&${q(seed)}`).then(json),
    grade: (id, answers) => post("api/grade", { id, answers }),
    blitz: (seed) => fetch(`${base}api/blitz?${q(seed)}`).then(json),
    checkBlitz: (id, choice) => post("api/blitz/check", { id, choice }),
  };
}

function localApi() {
  return {
    mode: "local",
    meta: async () => ({ worlds: WORLD_INFO, templateCount: TEMPLATE_COUNT, cheatsheet: CHEATSHEET }),
    round: async (world, seed) => { const r = buildRound(world, seed); return { ...r, questions: r.questions.map(publicQuestion) }; },
    grade: async (id, answers) => { const q = buildQuestion(id); if (!q) throw new Error("Unknown question"); return grade(q, answers); },
    blitz: async (seed) => buildBlitz(seed),
    checkBlitz: async (id, choice) => checkBlitz(id, choice),
  };
}

export async function createApi(base = "./") {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(`${base}api/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok && (await res.json()).ok) return remoteApi(base);
  } catch { /* no server → local */ }
  return localApi();
}
