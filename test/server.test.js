import { test, after } from "node:test";
import assert from "node:assert/strict";
import { start } from "../server/server.js";

const server = await start(0);
const base = `http://127.0.0.1:${server.address().port}`;
after(() => server.close());
const post = (p, body) => fetch(base + p, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

test("health, meta, static", async () => {
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { ok: true });
  const meta = await (await fetch(`${base}/api/meta`)).json();
  assert.ok(meta.templateCount >= 100 && meta.worlds.length === 6);
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.equal((await fetch(`${base}/shared/bank.js`)).status, 200);
  assert.equal((await fetch(`${base}/../server/server.js`)).status, 404);
});

test("round → grade", async () => {
  const r = await (await fetch(`${base}/api/round?world=network&seed=7`)).json();
  assert.equal(r.questions.length, 10);
  const q = r.questions[0];
  const res = await post("/api/grade", { id: q.id, answers: q.answers.map((a) => ({ key: a.key, value: "1", unit: a.defaultUnit })) });
  const g = await res.json();
  assert.equal(res.status, 200);
  assert.ok(["great", "good", "off"].includes(g.level) && g.results[0].steps.length);
});

test("blitz → check", async () => {
  const b = await (await fetch(`${base}/api/blitz?seed=3`)).json();
  const q = b.questions[0];
  const c = await (await post("/api/blitz/check", { id: q.id, choice: 0 })).json();
  assert.equal(typeof c.correct, "boolean");
  assert.equal(q.options[c.correctIndex], c.answerText);
});

test("validation", async () => {
  assert.equal((await fetch(`${base}/api/round?world=moon`)).status, 400);
  assert.equal((await fetch(`${base}/api/round?seed=-4`)).status, 400);
  assert.equal((await post("/api/grade", "{oops")).status, 400);
  assert.equal((await post("/api/grade", { id: "zz~1", answers: [] })).status, 404);
  assert.equal((await post("/api/blitz/check", { id: "zz~1", choice: 0 })).status, 404);
  assert.equal((await post("/api/grade", "x".repeat(20000))).status, 413);
});
