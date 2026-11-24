import { createApi } from "./api.js";
import { parseNumber, unitFactor, fmt, calc, compact, sig } from "./shared/core.js";
import { mascotSvg, confetti, ICONS } from "./fx.js";
import { loadProfile, saveProfile, rankOf, points, starsFor, ACHIEVEMENTS, unlock, dailySeed, todayKey, recordDaily } from "./game.js";

const $ = (s, root = document) => root.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (list) => list[Math.floor(Math.random() * list.length)];
const STAR = `<svg viewBox="0 0 24 24" class="star"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>`;
const HEART = `<svg viewBox="0 0 24 22" class="heart"><path d="M12 20s-8.5-5.3-8.5-11.2A4.8 4.8 0 0 1 12 5.6a4.8 4.8 0 0 1 8.5 3.2C20.5 14.7 12 20 12 20z"/></svg>`;
const stars = (k) => `<span class="stars" aria-label="${k} of 3 stars">${[0, 1, 2].map((i) => STAR.replace('class="star"', `class="star${i < k ? " on" : ""}"`)).join("")}</span>`;
const LINES = {
  idle: ["Grab a napkin. Let's estimate!", "Round numbers are your friends.", "Order of magnitude first, precision later.", "86,400 seconds in a day. Tattoo it somewhere."],
  think: ["Hmm… did you convert units?", "Bits or bytes? Choose wisely.", "Write it on the napkin, then commit."],
  great: ["Nailed it!", "Chef's kiss. Spot on.", "That's interview-grade precision.", "Bullseye! Keep it rolling."],
  good: ["Close enough for a whiteboard!", "Right order of magnitude. Interviewers would nod.", "In range! A little rounding drift."],
  off: ["Oof. Let's walk through it.", "Way off, but that's how you learn.", "Penny is dizzy. Check the steps!"],
};
const LABEL = { great: "SPOT ON!", good: "IN RANGE", off: "WAY OFF" };

const S = { api: null, meta: null, profile: loadProfile(), round: null, blitz: null, units: lsGet("napkin.units", {}) };

/* ---------- boot ---------- */
{
  boot().catch((e) => { $("#app").innerHTML = `<p class="err">Couldn't start: ${esc(e.message)}</p>`; });
}
async function boot() {
  S.api = await createApi();
  S.meta = await S.api.meta();
  $("#logoPenny").innerHTML = mascotSvg("idle", 40);
  $("#foot").textContent = `${S.meta.templateCount} question types, each filled with fresh numbers every time · ${S.api.mode === "server" ? "Graded by the API server" : "Running entirely in your browser"}`;
  $("#guide").innerHTML = S.meta.cheatsheet.map((g) => `<div class="guide-group"><h3>${esc(g.group)}</h3><dl>${g.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`).join("");
  bindTools();
  $("#playerBtn").addEventListener("click", openBadges);
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", onKey);
  renderPlayer();
  route();
}

function route() {
  stopBlitz();
  const h = location.hash.slice(1) || "map";
  const world = h.startsWith("world-") ? h.slice(6) : null;
  $("#tools").hidden = h === "map";
  if (h !== "map") closePanels();
  if (h === "blitz") return startBlitz();
  if (h === "daily") return startRound("mix", dailySeed(), true);
  if (world && S.meta.worlds.some((w) => w.id === world)) return startRound(world);
  renderMap();
}

/* ---------- player chip + badges ---------- */
function renderPlayer() {
  const r = rankOf(S.profile.xp);
  $("#lvl").textContent = r.level;
  $("#rankName").textContent = r.name;
  $("#xpFill").style.width = `${Math.round(r.progress * 100)}%`;
  $("#xpText").textContent = r.next > r.floor ? `${S.profile.xp.toLocaleString()} / ${r.next.toLocaleString()} XP` : `${S.profile.xp.toLocaleString()} XP`;
}
function openBadges() {
  const r = rankOf(S.profile.xp), p = S.profile;
  $("#badgesBody").innerHTML = `
    <div class="panel-head"><h2>Your napkin résumé</h2><button class="x" id="closeBadges" type="button" aria-label="Close">×</button></div>
    <div class="rank-row">${mascotSvg("great", 84)}<div style="flex:1"><b class="display" style="font-size:22px">${esc(r.name)}</b> · level ${r.level}<div class="xpbar"><i style="width:${Math.round(r.progress * 100)}%"></i></div><span class="small">${p.xp.toLocaleString()} XP${r.next > r.floor ? ` · ${(r.next - p.xp).toLocaleString()} to next rank` : ""}</span></div></div>
    <p class="small">Answered ${p.stats.answered} · Spot on ${p.stats.great} · Best streak ${p.stats.bestStreak} · Blitz best ${p.blitzBest} · Daily streak ${p.daily.streak}</p>
    <div class="badge-grid">${ACHIEVEMENTS.map((a) => `<div class="badge ${p.ach[a.id] ? "got" : "locked"}"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join("")}</div>
    <button class="link" id="resetProgress" type="button">Reset progress</button>`;
  const d = $("#badges");
  d.showModal?.() ?? d.setAttribute("open", "");
  $("#closeBadges").onclick = () => d.close?.() ?? d.removeAttribute("open");
  const reset = $("#resetProgress");
  reset.onclick = () => {
    if (reset.dataset.armed) { S.profile = loadProfile(); localStorage.removeItem("napkin.profile.v1"); S.profile = loadProfile(); saveProfile(S.profile); renderPlayer(); d.close?.(); route(); return; }
    reset.dataset.armed = "1"; reset.textContent = "Click again to wipe all XP, stars and badges";
  };
}
function award(list) {
  for (const a of list.filter(Boolean)) toast(`Badge unlocked: ${a.name}`, a.desc);
}
function toast(title, sub = "") {
  const el = document.createElement("div");
  el.className = "toast enter";
  el.innerHTML = `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}`;
  $("#toasts").appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("enter")));
  setTimeout(() => { el.classList.add("enter"); setTimeout(() => el.remove(), 420); }, 3200);
}

/* ---------- map ---------- */
function renderMap() {
  const p = S.profile;
  const today = p.daily.scores[todayKey()];
  $("#app").innerHTML = `
    <section class="hero">
      <div>
        <h1>Back-of-envelope maths, but make it a game.</h1>
        <p>Estimate QPS, storage, bandwidth and latency the way system design interviews expect. Close counts: within 2× is in range, within 1.2× is spot on. Penny will judge you, kindly.</p>
        <div class="hero-cta"><a class="btn" href="#daily">Play today's challenge</a><a class="btn plain" href="#world-units">Start with Unit Island</a></div>
      </div>
      <div class="hero-art"><div class="penny-wrap">${mascotSvg("idle", 190)}</div><div class="bubble">${esc(rand(LINES.idle))}</div></div>
    </section>
    <section class="map" id="map" aria-label="Worlds">
      <svg class="trail" id="trail" aria-hidden="true"></svg>
      ${S.meta.worlds.map((w) => {
        const st = p.worlds[w.id] || { stars: 0, best: 0 };
        return `<a class="island card" href="#world-${w.id}" style="--c:${w.color}">
          <span class="blob">${ICONS[w.id]}</span><h3>${esc(w.name)}</h3><p>${esc(w.blurb)}</p>
          <span class="meta"><span>${w.count} question types</span>${stars(st.stars)}</span></a>`;
      }).join("")}
    </section>
    <section class="modes">
      <a class="mode card" href="#blitz"><span class="blob" style="--c:var(--coral)">${ICONS.blitz}</span><span><h3>Blitz · 60 seconds</h3><p>Rapid-fire multiple choice. The wrong options are the classic slips (×8, ×1000, per day vs per second).</p></span><span class="go">Best ${p.blitzBest}</span></a>
      <a class="mode card" href="#daily"><span class="blob" style="--c:var(--sun)">${ICONS.mix}</span><span><h3>Daily challenge</h3><p>Ten mixed questions, the same for everyone today. Keep your streak going.</p></span><span class="go">${today != null ? `Today ${today}/10` : `Streak ${p.daily.streak}`}</span></a>
    </section>`;
  drawTrail();
}
function drawTrail() {
  const map = $("#map"), svg = $("#trail");
  if (!map || !svg) return;
  const draw = () => {
    const box = map.getBoundingClientRect();
    const pts = [...map.querySelectorAll(".island")].map((el) => { const b = el.getBoundingClientRect(); return [b.left - box.left + b.width / 2, b.top - box.top + b.height / 2]; });
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = `<path d="${pts.map(([x, y], i) => (i ? `Q ${(pts[i - 1][0] + x) / 2} ${Math.min(pts[i - 1][1], y) - 40} ${x} ${y}` : `M ${x} ${y}`)).join(" ")}"/>`;
  };
  draw();
  if (!S.trailObserver) S.trailObserver = new ResizeObserver(() => drawTrail());
  S.trailObserver.disconnect();
  S.trailObserver.observe(map);
  setTimeout(draw, 400);
}

/* ---------- campaign round ---------- */
async function startRound(world, seed, daily = false) {
  $("#app").innerHTML = `<p class="loading">Shuffling questions…</p>`;
  let data;
  try { data = await S.api.round(world, seed); } catch (e) { $("#app").innerHTML = `<p class="err">Couldn't load questions: ${esc(e.message)}</p><a class="btn" href="#map">Back to map</a>`; return; }
  S.round = { world, daily, seed: data.seed, questions: data.questions, i: 0, results: [], hearts: 3, streak: 0, score: 0, hints: 0, phase: "answer", started: 0, usedHint: false, busy: false };
  renderQuestion();
}
const worldOf = (id) => S.meta.worlds.find((w) => w.id === id) || { id: "mix", name: "Daily challenge", color: "#ffd23f" };

function hud() {
  const R = S.round, w = R.daily ? { id: "mix", name: "Daily challenge", color: "#ffd23f" } : worldOf(R.world);
  return `<div class="hud card">
    <span class="where"><a href="#map" class="btn plain" style="min-height:40px;padding:0 12px;font-size:15px" aria-label="Back to map">← Map</a><span class="blob" style="--c:${w.color}">${ICONS[w.id]}</span>${esc(w.name)}</span>
    <span class="pips" aria-label="Progress">${R.questions.map((_, i) => `<span class="pip ${R.results[i]?.level || (i === R.i ? "now" : "")}"></span>`).join("")}</span>
    <span class="hearts" aria-label="${R.hearts} hearts left">${[0, 1, 2].map((i) => HEART.replace('class="heart"', `class="heart${i < R.hearts ? "" : " lost"}"`)).join("")}</span>
    ${R.streak >= 2 ? `<span class="chip combo">${R.streak} streak · ×${points("great", 99, R.streak + 1, false).mult}</span>` : ""}
    <span class="chip score">${R.score.toLocaleString()} pts</span>
  </div>`;
}
function coach(mood, line) {
  return `<aside class="coach" id="coach">${mascotSvg(mood, 190)}<div class="bubble" id="say">${esc(line)}</div></aside>`;
}
function say(mood, line) {
  const c = $("#coach");
  if (!c) return;
  c.querySelector(".penny").outerHTML = mascotSvg(mood, 190);
  $("#say").textContent = line;
}

function renderQuestion() {
  const R = S.round, q = R.questions[R.i], w = worldOf(q.world);
  R.phase = "answer"; R.started = Date.now(); R.usedHint = false;
  $("#app").innerHTML = `${hud()}<div class="board">${coach("idle", R.i === 0 ? rand(LINES.idle) : R.streak >= 3 ? `${R.streak} in a row! Don't jinx it.` : rand(LINES.idle))}
    <article class="qcard card" id="qcard">
      <div class="tags"><span class="tag lv" style="--c:${w.color}">${esc(w.name)}</span><span class="tag">Level ${q.level}</span><span class="tag">Question ${R.i + 1} of ${R.questions.length}</span></div>
      <h1>${esc(q.title)}</h1>
      <p class="prompt">${esc(q.prompt)}</p>
      ${q.facts.length ? `<dl class="facts">${q.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>` : ""}
      <form id="answerForm" novalidate>
        <div class="fields">${q.answers.map(fieldHtml).join("")}</div>
        <div class="actions"><button class="btn" type="submit" id="check">Lock it in <kbd>↵</kbd></button><button class="btn plain" type="button" id="skip">Skip</button><button class="link" type="button" id="hintBtn">Ask Penny for a hint</button></div>
        <p class="err" id="formErr" hidden></p>
      </form>
      <div id="verdict"></div>
    </article></div>`;
  for (const a of q.answers) {
    const input = $(`#in-${a.key}`), sel = $(`#u-${a.key}`);
    input.addEventListener("input", () => { parsedPreview(a); if (R.phase === "answer" && !R.thinking) { R.thinking = true; say("think", rand(LINES.think)); } });
    sel.addEventListener("change", () => { S.units[a.dim] = sel.value; lsSet("napkin.units", S.units); parsedPreview(a); });
  }
  R.thinking = false;
  $("#answerForm").addEventListener("submit", (e) => { e.preventDefault(); submit(false); });
  $("#skip").addEventListener("click", () => submit(true));
  $("#hintBtn").addEventListener("click", () => { R.usedHint = true; say("think", `Hint: ${q.hint}`); $("#hintBtn").textContent = "Hint used (−25% points)"; });
  $(`#in-${q.answers[0].key}`).focus({ preventScroll: true });
}

function unitLabel(a, u) {
  if (a.dim === "rate") return `${u.replace("/s", "")} ${a.noun || ""}/s`.replace(/\s+/g, " ").replace(" /s", "/s").trim();
  if (a.dim === "count") return a.noun === "$" ? `$${u}` : a.noun === "%" ? (u ? `${u} %` : "%") : `${u ? u + " " : ""}${a.noun || "×1"}`;
  return u;
}
function fieldHtml(a) {
  const pick = S.units[a.dim] && a.units.includes(S.units[a.dim]) ? S.units[a.dim] : a.defaultUnit;
  const units = a.noun === "%" ? [""] : a.units;
  return `<div class="field"><label for="in-${a.key}">${esc(a.label)}</label>
    <input id="in-${a.key}" inputmode="decimal" autocomplete="off" placeholder="e.g. 2.5k">
    <select id="u-${a.key}" aria-label="${esc(a.label)} unit">${units.map((u) => `<option value="${esc(u)}" ${u === pick ? "selected" : ""}>${esc(unitLabel(a, u))}</option>`).join("")}</select>
    <div class="parsed" id="p-${a.key}"></div></div>`;
}
function parsedPreview(a) {
  const raw = $(`#in-${a.key}`).value, out = $(`#p-${a.key}`);
  if (!raw.trim()) { out.textContent = ""; return; }
  const v = parseNumber(raw);
  out.textContent = Number.isFinite(v) ? `= ${fmt(v * unitFactor(a.dim, $(`#u-${a.key}`).value), a.dim, a.noun)}` : "Try 1200, 1.2k or 3e6";
}

async function submit(skipped) {
  const R = S.round;
  if (R.busy || R.phase !== "answer") return;
  const q = R.questions[R.i];
  const answers = q.answers.map((a) => ({ key: a.key, value: skipped ? "" : $(`#in-${a.key}`).value, unit: $(`#u-${a.key}`).value }));
  const err = $("#formErr");
  if (!skipped) {
    const bad = q.answers.find((a, i) => !(parseNumber(answers[i].value) > 0));
    if (bad) { err.hidden = false; err.textContent = `Penny needs a positive number for “${bad.label}” (or hit Skip).`; $(`#in-${bad.key}`).focus(); return; }
  }
  err.hidden = true; R.busy = true; $("#check").disabled = true;
  try {
    const g = await S.api.grade(q.id, answers);
    const secs = (Date.now() - R.started) / 1000;
    const level = skipped ? "off" : g.level;
    R.streak = level === "off" ? 0 : R.streak + 1;
    const pts = skipped ? { total: 0, mult: 1, speed: 0 } : points(level, secs, R.streak, R.usedHint);
    R.score += pts.total;
    if (level === "off") R.hearts -= 1;
    if (R.usedHint) R.hints += 1;
    R.results[R.i] = { title: q.title, level, skipped, miss: skipped ? null : g.missRatio, secs, pts: pts.total };
    R.phase = "checked";
    progressAfterAnswer(q, level, secs, R.streak);
    $(".hud").outerHTML = hud();
    renderVerdict(q, g, level, skipped, pts);
  } catch (e) {
    err.hidden = false; err.textContent = `Grading failed: ${e.message}`; $("#check").disabled = false;
  } finally { R.busy = false; }
}

function progressAfterAnswer(q, level, secs, streak) {
  const p = S.profile, got = [];
  p.stats.answered += 1;
  if (level === "great") { p.stats.great += 1; got.push(unlock(p, "bullseye")); if (secs < 15) got.push(unlock(p, "quickdraw")); if (q.world === "network") { p.stats.networkGreat += 1; if (p.stats.networkGreat >= 5) got.push(unlock(p, "bits")); } }
  if (level === "good") p.stats.good += 1;
  p.stats.bestStreak = Math.max(p.stats.bestStreak, streak);
  if (streak >= 5) got.push(unlock(p, "roll"));
  if (streak >= 10) got.push(unlock(p, "unstoppable"));
  saveProfile(p); award(got);
}

/* log-scale target meter: ±1.5 decades around the answer */
const pos = (ratio) => Math.min(100, Math.max(0, ((Math.log10(ratio) + 1.5) / 3) * 100));
function meter(r) {
  if (!Number.isFinite(r.guess) || r.guess <= 0) return "";
  const p = pos(r.guess / r.expected);
  const zone = (cls, f) => `<span class="zone ${cls}" style="left:${pos(1 / f)}%;width:${pos(f) - pos(1 / f)}%"></span>`;
  const label = p === 0 || p === 100 ? `${sig(r.ratio, 2)}× ${r.direction > 0 ? "high" : "low"}` : "you";
  return `<div class="meter" role="img" aria-label="Your answer is ${sig(r.ratio, 2)} times ${r.direction > 0 ? "above" : "below"} the answer">
    <div class="lane">${zone("good", 2)}${zone("great", 1.2)}</div>
    ${[[0.1, "÷10"], [0.5, "÷2"], [1, "exact"], [2, "×2"], [10, "×10"]].map(([f, t]) => `<span class="tick" style="left:${pos(f)}%">${t}</span>`).join("")}
    <div class="slide" data-p="${p}" style="transform:translateX(50%)"><span class="pin ${p < 10 ? "l" : p > 90 ? "r" : ""}"><b>${label}</b><i></i></span></div>
  </div>`;
}

function renderVerdict(q, g, level, skipped, pts) {
  const R = S.round;
  const slip = g.results.find((r) => r.slip)?.slip;
  say(level, skipped ? "Skipped! Here's how Penny would do it." : slip ? `${rand(LINES.off)} ${slip}` : rand(LINES[level]));
  const card = $("#qcard");
  card.insertAdjacentHTML("afterbegin", `<span class="vstamp ${level} enter">${skipped ? "SKIPPED" : LABEL[level]}</span>`);
  const last = R.i + 1 >= R.questions.length || R.hearts <= 0;
  $("#verdict").innerHTML = `<section class="verdict enter">
    <div class="gain"><span class="pts">+${pts.total}</span>${pts.speed ? `<span class="chip">speed +${pts.speed}</span>` : ""}${pts.mult > 1 ? `<span class="chip combo">combo ×${pts.mult}</span>` : ""}${R.usedHint && pts.total ? `<span class="chip">hint −25%</span>` : ""}${level === "off" && !skipped ? `<span class="chip">−1 heart</span>` : ""}${skipped ? `<span class="chip">−1 heart</span>` : ""}</div>
    ${g.results.map((r) => `<div class="res"><div class="res-head"><h3>${esc(r.label)}</h3><span class="vals">${skipped ? "" : `You <b>${esc(r.guessText)}</b> · `}Answer <b>${esc(r.expectedText)}</b></span></div>${skipped ? "" : meter(r)}${!skipped && r.slip ? `<p class="slip">${esc(r.slip)}</p>` : ""}</div>`).join("")}
    <details class="steps" ${level !== "great" ? "open" : ""}><summary>How to estimate it</summary>${g.results.map((r) => `<h4>${esc(r.label)}</h4><ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`).join("")}</details>
    <p class="tip">${esc(g.tip)}</p>
    <div class="actions" style="margin-top:18px"><button class="btn coral" id="nextQ" type="button">${R.hearts <= 0 ? "Out of hearts. See results" : last ? "See results" : "Next question"} <kbd>↵</kbd></button></div>
  </section>`;
  for (const a of q.answers) $(`#in-${a.key}`).readOnly = true;
  $("#check").disabled = true; $("#skip").disabled = true; $("#hintBtn").disabled = true;
  $("#nextQ").addEventListener("click", nextQuestion);
  if (level === "great" && !skipped) confetti();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $(".verdict")?.classList.remove("enter"); $(".vstamp")?.classList.remove("enter");
    for (const s of document.querySelectorAll(".meter .slide")) s.style.transform = `translateX(${s.dataset.p}%)`;
  }));
  $("#nextQ").focus({ preventScroll: true });
  $("#verdict").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "nearest" });
}

function nextQuestion() {
  const R = S.round;
  if (R.hearts <= 0 || R.i + 1 >= R.questions.length) return endRound();
  R.i += 1;
  renderQuestion();
  scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
}

function endRound() {
  const R = S.round, p = S.profile;
  R.phase = "done";
  const inRange = R.results.filter((r) => r && r.level !== "off").length;
  const st = starsFor(inRange);
  const xp = R.score + inRange * 10;
  p.xp += xp;
  const got = [];
  if (R.daily) { recordDaily(p, inRange); if (p.daily.streak >= 3) got.push(unlock(p, "habit")); }
  else {
    const prev = p.worlds[R.world] || { stars: 0, best: 0, played: 0 };
    p.worlds[R.world] = { stars: Math.max(prev.stars, st), best: Math.max(prev.best, R.score), played: (prev.played || 0) + 1 };
    if (S.meta.worlds.every((w) => p.worlds[w.id]?.played)) got.push(unlock(p, "tour"));
  }
  if (st === 3) got.push(unlock(p, "gold"));
  if (inRange === 10) got.push(unlock(p, "flawless"));
  if (inRange >= 7 && R.hints === 0) got.push(unlock(p, "unaided"));
  saveProfile(p); renderPlayer(); award(got);
  const mood = st >= 2 ? "great" : st === 1 ? "good" : "off";
  const lede = R.hearts <= 0 ? "Out of hearts! Read the worked steps and try again, because the numbers change every time." : st === 3 ? "Three stars. You'd breeze through the estimation part of an interview." : st >= 1 ? "Nice work. Look over your misses below. Most were one unit conversion away." : "Tough round. Every solution is worth a second look, since the same patterns keep coming back.";
  $("#app").innerHTML = `<section class="results card">
    ${mascotSvg(mood, 150)}
    <div class="big-stars">${[0, 1, 2].map((i) => STAR.replace('class="star"', `class="star pre${i < st ? " on" : ""}"`)).join("")}</div>
    <h1>${R.daily ? "Daily challenge" : esc(worldOf(R.world).name)}: ${inRange}/10 in range</h1>
    <p class="lede">${esc(lede)}</p>
    <dl class="tally"><div><dt>Points</dt><dd>${R.score.toLocaleString()}</dd></div><div><dt>XP earned</dt><dd>+${xp.toLocaleString()}</dd></div><div><dt>Spot on</dt><dd>${R.results.filter((r) => r?.level === "great").length}</dd></div><div><dt>Rank</dt><dd style="font-size:18px">${esc(rankOf(p.xp).name)}</dd></div></dl>
    <ol class="review">${R.questions.map((q, i) => { const r = R.results[i]; return `<li><span class="display">${i + 1}</span><span>${esc(q.title)}<small>${r ? (r.skipped ? "Skipped" : `Off by ${sig(r.miss, 2)}× · ${Math.round(r.secs)} s · +${r.pts}`) : "Not reached"}</small></span>${r ? `<span class="lvchip ${r.level}">${r.skipped ? "Skipped" : LABEL[r.level].toLowerCase()}</span>` : `<span class="lvchip">—</span>`}</li>`; }).join("")}</ol>
    <div class="actions"><button class="btn" id="again" type="button">${R.daily ? "Replay today's set" : "Play again (new numbers)"}</button><a class="btn plain" href="#map">Back to map</a></div>
  </section>`;
  $("#again").onclick = () => startRound(R.world, R.daily ? dailySeed() : undefined, R.daily);
  const starsEls = document.querySelectorAll(".big-stars .star");
  starsEls.forEach((s, i) => setTimeout(() => s.classList.remove("pre"), 250 + i * 180));
  if (st >= 2) setTimeout(confetti, 600);
}

/* ---------- blitz ---------- */
async function startBlitz() {
  $("#app").innerHTML = `<p class="loading">Charging the lightning…</p>`;
  let data;
  try { data = await S.api.blitz(); } catch (e) { $("#app").innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  S.blitz = { qs: data.questions, i: 0, score: 0, combo: 0, answered: 0, misses: [], endAt: Date.now() + 60_000, locked: false, timer: 0 };
  $("#app").innerHTML = `<section class="blitz card" id="blitz">
    <div class="timebar"><i id="timeFill"></i></div>
    <div class="blitz-top"><a href="#map" class="btn plain" style="min-height:40px;padding:0 12px;font-size:15px">← Map</a><span class="chip score" id="bScore">0 correct</span><span class="chip combo" id="bCombo" hidden></span><span class="clock" id="bClock">60</span></div>
    <div id="bq"></div>
  </section>`;
  S.blitz.timer = setInterval(blitzTick, 250);
  renderBlitzQ();
}
function stopBlitz() { if (S.blitz) { clearInterval(S.blitz.timer); S.blitz = null; } }
function blitzTick() {
  const B = S.blitz;
  if (!B) return;
  const left = Math.max(0, B.endAt - Date.now());
  $("#bClock").textContent = Math.ceil(left / 1000);
  $("#timeFill").style.transform = `scaleX(${left / 60_000})`;
  if (left <= 0) endBlitz();
}
function renderBlitzQ() {
  const B = S.blitz, q = B.qs[B.i % B.qs.length];
  $("#bq").innerHTML = `<p class="tag" style="display:inline-block">${esc(worldOf(q.world).name)} · ${esc(q.title)}</p>
    <h2>${esc(q.prompt)}</h2><p class="ask">${esc(q.ask)}?</p>
    <div class="options">${q.options.map((o, i) => `<button class="opt" type="button" data-i="${i}"><kbd>${i + 1}</kbd>${esc(o)}</button>`).join("")}</div>`;
  for (const b of document.querySelectorAll(".opt")) b.addEventListener("click", () => answerBlitz(Number(b.dataset.i)));
}
async function answerBlitz(choice) {
  const B = S.blitz;
  if (!B || B.locked) return;
  B.locked = true;
  const q = B.qs[B.i % B.qs.length];
  let res;
  try { res = await S.api.checkBlitz(q.id, choice); } catch { B.locked = false; return; }
  if (S.blitz !== B) return;
  const btns = document.querySelectorAll(".opt");
  btns[res.correctIndex]?.classList.add("right");
  B.answered += 1;
  if (res.correct) { B.score += 1; B.combo += 1; } else { btns[choice]?.classList.add("wrong"); B.combo = 0; B.misses.push({ q, res, picked: q.options[choice] }); }
  $("#bScore").textContent = `${B.score} correct`;
  const c = $("#bCombo"); c.hidden = B.combo < 3; c.textContent = `${B.combo} in a row`;
  setTimeout(() => { if (S.blitz !== B) return; B.i += 1; B.locked = false; renderBlitzQ(); }, res.correct ? 280 : 900);
}
function endBlitz() {
  const B = S.blitz, p = S.profile;
  clearInterval(B.timer);
  const best = B.score > p.blitzBest;
  p.blitzBest = Math.max(p.blitzBest, B.score);
  p.xp += B.score * 15;
  const got = [];
  if (B.score >= 15) got.push(unlock(p, "blitz15"));
  if (B.score >= 30) got.push(unlock(p, "lightning"));
  saveProfile(p); renderPlayer(); award(got);
  S.blitz = null;
  const acc = B.answered ? Math.round((B.score / B.answered) * 100) : 0;
  $("#app").innerHTML = `<section class="results card">
    ${mascotSvg(B.score >= 15 ? "great" : B.score >= 8 ? "good" : "off", 150)}
    <h1>${B.score} correct in 60 seconds${best ? " · new best!" : ""}</h1>
    <p class="lede">${acc}% accuracy over ${B.answered} answers · +${B.score * 15} XP</p>
    ${B.misses.length ? `<ol class="review">${B.misses.slice(0, 8).map((m) => `<li><span class="lvchip off">×</span><span>${esc(m.q.title)}<small>You picked ${esc(m.picked)} · answer ${esc(m.res.answerText)} · ${esc(m.res.steps.at(-1))}</small></span><span></span></li>`).join("")}</ol>` : ""}
    <div class="actions"><button class="btn coral" id="again" type="button">Blitz again</button><a class="btn plain" href="#map">Back to map</a></div>
  </section>`;
  $("#again").onclick = startBlitz;
  if (best && B.score >= 5) confetti();
}

/* ---------- keyboard ---------- */
function onKey(e) {
  if (S.blitz && /^[1-4]$/.test(e.key) && !e.target.closest("textarea, input")) { e.preventDefault(); answerBlitz(Number(e.key) - 1); return; }
  if (e.key === "Escape") closePanels();
  if (e.key === "Enter" && S.round?.phase === "checked" && !e.target.closest("textarea, input, select, button, a, summary")) nextQuestion();
}

/* ---------- floating tools ---------- */
function bindTools() {
  const toggle = (fab, id) => {
    const panel = $(`#${id}`), open = panel.hidden;
    closePanels();
    if (!open) return;
    panel.hidden = false; panel.classList.add("enter"); fab.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("enter")));
    if (id === "calcPanel") $("#scratch").focus();
  };
  $("#calcFab").onclick = (e) => toggle(e.currentTarget, "calcPanel");
  $("#guideFab").onclick = (e) => toggle(e.currentTarget, "guidePanel");
  for (const x of document.querySelectorAll("[data-close]")) x.onclick = closePanels;
  const ta = $("#scratch"), gutter = $("#gutter");
  ta.value = lsGet("napkin.scratch", "");
  const draw = () => {
    gutter.innerHTML = ta.value.split("\n").map((line) => {
      const expr = line.split("=")[0];
      if (!/[\d)]/.test(expr) || /^\s*[\d.]+\s*$/.test(expr)) return " ";
      const v = calc(expr);
      return v == null ? " " : `<b>${esc(compact(v))}</b>`;
    }).join("\n");
    gutter.style.transform = `translateY(${-ta.scrollTop}px)`;
  };
  ta.addEventListener("input", () => { draw(); lsSet("napkin.scratch", ta.value); });
  ta.addEventListener("scroll", draw);
  $("#clearScratch").onclick = () => { ta.value = ""; lsSet("napkin.scratch", ""); draw(); ta.focus(); };
  draw();
}
function closePanels() {
  for (const id of ["calcPanel", "guidePanel"]) $(`#${id}`).hidden = true;
  for (const f of document.querySelectorAll(".fab")) f.setAttribute("aria-expanded", "false");
}
