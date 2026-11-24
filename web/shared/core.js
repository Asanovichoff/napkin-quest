// Core helpers shared by the question bank, engine, server and browser.
export const DAY = 86_400;
export const HOUR = 3_600;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

/* seeded RNG (mulberry32) */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (r, list) => list[Math.floor(r() * list.length)];
export function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const randomSeed = () => Math.floor(Math.random() * 0xffffffff) >>> 0;

/* units: answers are stored in a base unit; users may answer in any unit of the dimension */
export const DIMENSIONS = {
  bytes: { default: "GB", units: [["B", 1], ["KB", 1e3], ["MB", 1e6], ["GB", 1e9], ["TB", 1e12], ["PB", 1e15], ["EB", 1e18]] },
  bits: { default: "Gbps", units: [["bps", 1], ["Kbps", 1e3], ["Mbps", 1e6], ["Gbps", 1e9], ["Tbps", 1e12]] },
  rate: { default: "/s", units: [["/s", 1], ["K/s", 1e3], ["M/s", 1e6], ["B/s", 1e9]] },
  time: { default: "ms", units: [["µs", 1e-3], ["ms", 1], ["s", 1e3], ["min", 6e4], ["h", 3.6e6], ["days", 8.64e7]] },
  count: { default: "", units: [["", 1], ["K", 1e3], ["M", 1e6], ["B", 1e9], ["T", 1e12]] },
};
export function unitFactor(dim, unit) {
  const u = DIMENSIONS[dim]?.units.find(([n]) => n === unit);
  if (!u) throw new Error(`Unknown unit "${unit}" for ${dim}`);
  return u[1];
}

/* formatting */
export function sig(n, digits = 3) {
  if (!Number.isFinite(n)) return "∞";
  if (n === 0) return "0";
  const p = Number(n.toPrecision(digits));
  return Math.abs(p) >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(p);
}
export function compact(n) {
  const a = Math.abs(n);
  if (a >= 1e15) return sig(n / 1e15) + "Q";
  if (a >= 1e12) return sig(n / 1e12) + "T";
  if (a >= 1e9) return sig(n / 1e9) + "B";
  if (a >= 1e6) return sig(n / 1e6) + "M";
  if (a >= 1e4) return sig(n / 1e3) + "K";
  return sig(n);
}
export const commas = (n) => Math.round(n).toLocaleString("en-US");

export function fmt(base, dim, noun = "") {
  const units = DIMENSIONS[dim].units;
  let [unit, f] = units[0];
  for (const [u, uf] of units) if (Math.abs(base) >= uf * 0.9999) [unit, f] = [u, uf];
  const v = sig(base / f);
  if (dim === "rate") return `${v}${unit.replace("/s", "")} ${noun}/s`.replace(/\s+/g, " ").replace(" /s", "/s").trim();
  if (dim === "count") {
    if (noun === "$") return `$${v}${unit}`;
    if (noun === "%") return `${sig(base)}%`;
    return `${v}${unit}${noun ? " " + noun : ""}`;
  }
  return `${v} ${unit}`;
}

/* answer parsing: "1.2k", "3e6", "~40", "2,500", "$4.5M", "26%" */
const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, g: 1e9, t: 1e12 };
export function parseNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/[,_\s~≈$%]/g, "").toLowerCase();
  const m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([kmbgt])?$/);
  if (!m) return NaN;
  return Number(m[1]) * (m[2] ? SUFFIX[m[2]] : 1);
}

/* napkin calculator: safe recursive-descent parser, no eval */
const CONST = { day: DAY, days: DAY, hour: HOUR, hr: HOUR, h: HOUR, min: 60, month: MONTH, year: YEAR, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15 };
export function calc(expr) {
  const src = String(expr).toLowerCase().replace(/[×x·]/g, "*").replace(/÷/g, "/").replace(/,/g, "");
  const tokens = [];
  const re = /\s*(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[a-z]+|\*\*|[-+*/^%()])/gy;
  let m;
  while (re.lastIndex < src.length) {
    const at = re.lastIndex;
    if (!(m = re.exec(src))) { if (/^\s*$/.test(src.slice(at))) break; return null; }
    tokens.push(m[1]);
  }
  if (!tokens.length) return null;
  let i = 0;
  const peek = () => tokens[i], take = () => tokens[i++];
  const post = (v) => { if (peek() === "%") { take(); return v / 100; } return v; };
  function primary() {
    const t = take();
    if (t === undefined) throw 0;
    if (t === "(") { const v = add(); if (take() !== ")") throw 0; return post(v); }
    if (t === "-") return -primary();
    if (t === "+") return primary();
    if (/^[\d.]/.test(t)) { let v = Number(t); if (peek() && /^[kmbgt]$/.test(peek())) v *= SUFFIX[take()]; return post(v); }
    if (t in CONST) return post(CONST[t]);
    throw 0;
  }
  function pow() { const b = primary(); if (peek() === "^" || peek() === "**") { take(); return b ** pow(); } return b; }
  function mul() {
    let v = pow();
    while (peek() === "*" || peek() === "/" || (peek() && /^[\d.(a-z]/.test(peek()) && !/^[kmbgt]$/.test(peek()))) {
      const op = /^[*/]$/.test(peek()) ? take() : "*";
      const r = pow();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function add() { let v = mul(); while (peek() === "+" || peek() === "-") { const op = take(); const r = mul(); v = op === "+" ? v + r : v - r; } return v; }
  try { const v = add(); return i === tokens.length && Number.isFinite(v) ? v : null; } catch { return null; }
}
