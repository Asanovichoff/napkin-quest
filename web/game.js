// Progression: points, combos, ranks, stars, achievements, daily streak.
// Kept in the browser (localStorage), so it's per player and per device.

const KEY = "napkin.profile.v1";
const blank = () => ({ xp: 0, stats: { answered: 0, great: 0, good: 0, bestStreak: 0, networkGreat: 0 }, worlds: {}, blitzBest: 0, daily: { last: null, streak: 0, scores: {} }, ach: {} });

export function loadProfile() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return blank(); }
}
export function saveProfile(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ } }

export const RANKS = [
  [0, "Intern"], [400, "Junior Engineer"], [1200, "Engineer"], [3000, "Senior Engineer"],
  [6000, "Staff Engineer"], [10000, "Principal Engineer"], [16000, "Distinguished Engineer"], [25000, "Napkin Legend"],
];
export function rankOf(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const [floor, name] = RANKS[i];
  const next = RANKS[i + 1]?.[0] ?? floor;
  return { name, level: i + 1, floor, next, progress: next === floor ? 1 : (xp - floor) / (next - floor) };
}

/** Points for one answered question. streak = in-range streak including this answer. */
export function points(level, seconds, streak, usedHint) {
  if (level === "off") return { base: 0, speed: 0, mult: 1, total: 0 };
  const base = level === "great" ? 100 : 40;
  const speed = Math.max(0, Math.round(50 * (1 - seconds / 45)));
  const mult = 1 + 0.25 * Math.min(Math.max(streak - 1, 0), 4);
  const total = Math.round((base + speed) * mult * (usedHint ? 0.75 : 1));
  return { base, speed, mult, total };
}

export const starsFor = (inRange) => (inRange >= 9 ? 3 : inRange >= 7 ? 2 : inRange >= 5 ? 1 : 0);

export const ACHIEVEMENTS = [
  { id: "bullseye", name: "Bullseye", desc: "Get your first answer spot on." },
  { id: "roll", name: "On a roll", desc: "5 answers in range in a row." },
  { id: "unstoppable", name: "Unstoppable", desc: "10 answers in range in a row." },
  { id: "quickdraw", name: "Quick draw", desc: "Spot on in under 15 seconds." },
  { id: "flawless", name: "Flawless", desc: "10 out of 10 in a round." },
  { id: "gold", name: "Gold standard", desc: "Earn 3 stars in any world." },
  { id: "tour", name: "World tour", desc: "Finish a round in every world." },
  { id: "bits", name: "Bit wizard", desc: "5 spot-on answers in Bandwidth Bay." },
  { id: "unaided", name: "Unaided", desc: "Finish a round with 7+ in range and no hints." },
  { id: "blitz15", name: "Blitz 15", desc: "Score 15 or more in Blitz." },
  { id: "lightning", name: "Lightning", desc: "Score 30 or more in Blitz." },
  { id: "habit", name: "Habit", desc: "Keep a 3-day daily challenge streak." },
];

export function unlock(p, id) {
  if (p.ach[id]) return null;
  p.ach[id] = Date.now();
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dailySeed(key = todayKey()) {
  let h = 2166136261;
  for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function recordDaily(p, score) {
  const key = todayKey();
  if (p.daily.scores[key] != null) { p.daily.scores[key] = Math.max(p.daily.scores[key], score); return; }
  const y = new Date(); y.setDate(y.getDate() - 1);
  p.daily.streak = p.daily.last === todayKey(y) ? p.daily.streak + 1 : 1;
  p.daily.last = key;
  p.daily.scores[key] = score;
}
