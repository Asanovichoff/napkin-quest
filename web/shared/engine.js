// Napkin Quest engine: deterministic, stateless. A question id is "<template>~<seed36>",
// so any server instance can rebuild and grade any question from the id alone.
import { rng, pick, shuffle, randomSeed, DIMENSIONS, unitFactor, fmt, parseNumber, sig, DAY, HOUR, YEAR } from "./core.js";
import { TEMPLATES, WORLDS } from "./bank.js";

export const ROUND_LENGTH = 10;
export const BLITZ_LENGTH = 80;
const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
export const WORLD_INFO = WORLDS.map((w) => ({ ...w, count: TEMPLATES.filter((t) => t.world === w.id).length }));
export const TEMPLATE_COUNT = TEMPLATES.length;

export const qid = (tpl, seed) => `${tpl}~${(seed >>> 0).toString(36)}`;
export function parseId(id) {
  const m = /^([a-z0-9-]{2,40})~([0-9a-z]{1,7})$/.exec(String(id));
  if (!m || !BY_ID.has(m[1])) return null;
  const seed = parseInt(m[2], 36);
  return seed <= 0xffffffff ? { tpl: BY_ID.get(m[1]), seed } : null;
}

/** Full question with answers (server / local mode only). */
export function buildQuestion(id) {
  const p = parseId(id);
  if (!p) return null;
  const r = rng(p.seed);
  const v = {};
  for (const [k, list] of Object.entries(p.tpl.vars)) v[k] = pick(r, list);
  const b = p.tpl.build(v);
  return {
    id, world: p.tpl.world, level: p.tpl.level, title: p.tpl.title, prompt: b.q, facts: b.facts || [], hint: b.hint, tip: b.tip,
    answers: b.answers.map((a, i) => ({ key: `a${i}`, noun: "", integer: false, slips: [], ...a })),
  };
}

export function publicQuestion(q) {
  return {
    id: q.id, world: q.world, level: q.level, title: q.title, prompt: q.prompt, facts: q.facts, hint: q.hint,
    answers: q.answers.map(({ key, label, dim, noun }) => ({ key, label, dim, noun, units: DIMENSIONS[dim].units.map(([u]) => u), defaultUnit: DIMENSIONS[dim].default })),
  };
}

/** A round: 10 different templates from one world (or "mix"), ordered easy → hard. */
export function buildRound(world = "mix", seed = randomSeed()) {
  const pool = TEMPLATES.filter((t) => world === "mix" || t.world === world);
  if (!pool.length) return null;
  const r = rng(seed);
  let chosen = shuffle(pool.slice(), r).slice(0, ROUND_LENGTH);
  while (chosen.length < ROUND_LENGTH) chosen.push(pick(r, pool));
  chosen = chosen.map((t, i) => ({ t, i })).sort((a, b) => a.t.level - b.t.level || a.i - b.i).map((x) => x.t);
  return { seed, world, questions: chosen.map((t) => buildQuestion(qid(t.id, Math.floor(r() * 0xffffffff)))) };
}

/* ---------- grading ---------- */
const GENERIC_SLIPS = [
  [8, "That's ×8 off: bits vs bytes."],
  [1e3, "Off by one metric prefix (K ↔ M ↔ G)."],
  [1e6, "Off by two metric prefixes."],
  [DAY, "Per-day vs per-second mix-up (86,400)."],
  [HOUR, "Per-hour vs per-second mix-up (3,600)."],
  [60, "Minutes vs seconds (×60)."],
  [24, "Hours vs days (×24)."],
  [30, "Days vs months (×30)."],
  [365, "Days vs years (×365)."],
  [10, "Off by exactly one power of ten. Check your zeros."],
];

export function gradeOne(guess, spec) {
  const e = spec.value;
  if (!Number.isFinite(guess) || guess <= 0) return { level: "off", ratio: Infinity, direction: 0, slip: null };
  const ratio = Math.max(guess / e, e / guess);
  let level = ratio <= 1.2 ? "great" : ratio <= 2 ? "good" : "off";
  if (spec.integer && e <= 20) {
    const d = Math.abs(Math.round(guess) - e);
    level = d === 0 ? "great" : d <= Math.max(1, Math.round(e * 0.25)) ? "good" : "off";
  }
  let slip = null;
  if (level === "off") {
    for (const [f, msg] of [...spec.slips, ...GENERIC_SLIPS]) {
      if (f > 1.05 && Math.abs(Math.log(ratio) - Math.log(f)) < Math.log(1.12)) { slip = msg; break; }
    }
  }
  return { level, ratio, direction: Math.sign(guess - e), slip };
}

/** answers: [{key, value, unit}] in the user's units. */
export function grade(q, answers) {
  const by = new Map((answers || []).map((a) => [a.key, a]));
  const results = q.answers.map((spec) => {
    const a = by.get(spec.key) || {};
    let guess = NaN;
    try { guess = parseNumber(a.value) * unitFactor(spec.dim, a.unit ?? DIMENSIONS[spec.dim].default); } catch { guess = NaN; }
    return { key: spec.key, label: spec.label, guess, expected: spec.value, guessText: Number.isFinite(guess) ? fmt(guess, spec.dim, spec.noun) : "—", expectedText: fmt(spec.value, spec.dim, spec.noun), steps: spec.steps, ...gradeOne(guess, spec) };
  });
  const rank = { great: 2, good: 1, off: 0 };
  const level = results.reduce((lv, r) => (rank[r.level] < rank[lv] ? r.level : lv), "great");
  const logMiss = results.reduce((s, r) => s + (Number.isFinite(r.ratio) ? Math.log10(r.ratio) : 2), 0) / results.length;
  return { id: q.id, level, missRatio: 10 ** logMiss, results, tip: q.tip };
}

/* ---------- blitz: 4-option multiple choice built from classic slips ---------- */
const BLITZ_POOL = TEMPLATES.filter((t) => t.level <= 2);
const DISTRACT = [8, 1000, 10, 100, 60, 24, 3600, 86400, 365, 30, 3, 2.5, 1e6];

export function buildBlitzQuestion(id) {
  const q = buildQuestion(id);
  if (!q) return null;
  const a = q.answers.find((x) => !x.integer) || q.answers[0];
  const r = rng(parseId(id).seed ^ 0x5bd1e995);
  const correct = fmt(a.value, a.dim, a.noun);
  const factors = shuffle([...a.slips.map(([f]) => f), ...DISTRACT].filter((f) => f > 1.5), r);
  const values = [a.value];
  const texts = [correct];
  for (const f of factors) {
    if (texts.length === 4) break;
    const v = r() < 0.5 ? a.value * f : a.value / f;
    const t = fmt(v, a.dim, a.noun);
    if (values.every((x) => Math.max(x / v, v / x) >= 2.2) && !texts.includes(t)) { values.push(v); texts.push(t); }
  }
  const order = shuffle([0, 1, 2, 3].slice(0, texts.length), r);
  return {
    question: { id, world: q.world, title: q.title, prompt: q.prompt, ask: a.label, options: order.map((i) => texts[i]) },
    correctIndex: order.indexOf(0), answerText: correct, steps: a.steps, tip: q.tip,
  };
}

export function buildBlitz(seed = randomSeed()) {
  const r = rng(seed);
  const ids = [];
  let bag = [];
  while (ids.length < BLITZ_LENGTH) {
    if (!bag.length) bag = shuffle(BLITZ_POOL.slice(), r);
    ids.push(qid(bag.pop().id, Math.floor(r() * 0xffffffff)));
  }
  return { seed, questions: ids.map((id) => buildBlitzQuestion(id).question) };
}

export function checkBlitz(id, choice) {
  const b = buildBlitzQuestion(id);
  if (!b) return null;
  return { id, correct: Number(choice) === b.correctIndex, correctIndex: b.correctIndex, answerText: b.answerText, steps: b.steps, tip: b.tip };
}

/* ---------- pocket guide ---------- */
export const CHEATSHEET = [
  { group: "Time", rows: [["1 day", "86,400 s ≈ 10⁵"], ["1 month", "≈ 2.6M s"], ["1 year", "≈ 31.5M s ≈ π×10⁷"], ["1M / day", "≈ 12 / s"], ["1B / month", "≈ 400 / s"]] },
  { group: "Size", rows: [["K → M → G → T → P", "×1,000 each"], ["2¹⁰ · 2²⁰ · 2³⁰ · 2⁴⁰", "≈ 1K · 1M · 1B · 1T"], ["1 byte", "8 bits"], ["UUID", "16 B"], ["Photo · HD minute", "~2 MB · ~40 MB"]] },
  { group: "Network", rows: [["1 Gbps", "125 MB/s"], ["1 TB / day", "≈ 93 Mbps"], ["RTT same DC", "~0.5 ms"], ["RTT cross-continent", "~150 ms"], ["Fiber", "~1 ms RTT / 100 km"]] },
  { group: "Machines", rows: [["Web server", "1K–10K req/s"], ["SQL primary", "~5K–10K writes/s"], ["Redis node", "~100K ops/s"], ["RAM · SSD · disk read", "100 ns · 100 µs · 10 ms"], ["Month", "≈ 730 hours"]] },
];

export { sig, YEAR };
