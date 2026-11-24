import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES } from "../web/shared/bank.js";
import * as E from "../web/shared/engine.js";
import { calc, parseNumber } from "../web/shared/core.js";

test("bank has 100+ unique templates across all worlds", () => {
  assert.ok(TEMPLATES.length >= 100, `only ${TEMPLATES.length}`);
  assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, TEMPLATES.length);
  for (const w of E.WORLD_INFO) assert.ok(w.count >= 10, `${w.id} has ${w.count}`);
});

test("every template produces valid, finite questions for many seeds", () => {
  for (const t of TEMPLATES) for (let s = 1; s <= 120; s++) {
    const q = E.buildQuestion(E.qid(t.id, (s * 2654435761) >>> 0));
    assert.ok(q.prompt && q.hint && q.tip, t.id);
    for (const a of q.answers) {
      assert.ok(Number.isFinite(a.value) && a.value > 0, `${t.id}:${a.label}=${a.value}`);
      assert.ok(a.steps.length && !/undefined|NaN/.test(a.steps.join(" ")), `${t.id} steps`);
      if (a.integer) assert.equal(a.value, Math.round(a.value), `${t.id} integer`);
    }
    assert.ok(!/undefined|NaN/.test(q.prompt), `${t.id} prompt`);
  }
});

test("rounds: 10 distinct templates, deterministic, easy → hard", () => {
  for (const w of ["mix", ...E.WORLD_INFO.map((x) => x.id)]) {
    const a = E.buildRound(w, 42), b = E.buildRound(w, 42);
    assert.deepEqual(a.questions.map((q) => q.id), b.questions.map((q) => q.id));
    assert.equal(new Set(a.questions.map((q) => q.id.split("~")[0])).size, 10);
    const levels = a.questions.map((q) => q.level);
    assert.deepEqual(levels, [...levels].sort((x, y) => x - y));
  }
});

test("public questions hide answers", () => {
  const q = E.publicQuestion(E.buildRound("storage", 1).questions[0]);
  for (const a of q.answers) assert.ok(!("value" in a) && !("steps" in a) && !("slips" in a));
  assert.ok(!("tip" in q));
});

test("grading levels, units and slip detection", () => {
  const q = E.buildQuestion("n-bandwidth~1");
  const a = q.answers[0];
  const g = (val, unit) => E.grade(q, [{ key: "a0", value: String(val), unit }, { key: "a1", value: "1", unit: "B" }]).results[0];
  assert.equal(g(a.value, "bps").level, "great");
  assert.equal(g(a.value / 1e9, "Gbps").level, "great");
  assert.equal(g(a.value * 1.6, "bps").level, "good");
  assert.equal(g(a.value * 5, "bps").level, "off");
  assert.match(g(a.value / 8, "bps").slip, /bits/);
  assert.equal(g("nope", "bps").level, "off");
});

test("blitz: 4 distinct options, correct one recoverable server-side", () => {
  const b = E.buildBlitz(9);
  assert.equal(b.questions.length, E.BLITZ_LENGTH);
  for (const q of b.questions) {
    assert.equal(new Set(q.options).size, q.options.length);
    assert.ok(q.options.length >= 3);
    assert.ok(!("correctIndex" in q));
    const c = E.checkBlitz(q.id, 0);
    assert.equal(q.options[c.correctIndex], c.answerText);
  }
});

test("parsing + napkin calculator", () => {
  assert.equal(parseNumber("1.2k"), 1200);
  assert.equal(parseNumber("$4.5M"), 4.5e6);
  assert.equal(parseNumber("26%"), 26);
  assert.equal(calc("2 + 3 * 4"), 14);
  assert.equal(calc("1M / day").toFixed(2), "11.57");
  assert.equal(calc("3 tb"), 3e12);
  assert.equal(calc("alert(1)"), null);
});
