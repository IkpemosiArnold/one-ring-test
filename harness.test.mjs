import { test } from "node:test";
import assert from "node:assert/strict";
import { CLEAN, TWIN, KEY } from "./cases.js";
import { parseReview, score, plainCode, flagEverything, saysNothing, runLab, leaderboard } from "./harness.js";

test("twin differs from clean exactly where the key says", () => {
  const changed = TWIN.filter((s, i) => s.text !== CLEAN[i].text).map((s) => s.id);
  assert.deepEqual(changed.sort(), [...new Set(KEY.map((k) => k.id))].sort());
});

test("plain code raises no flag on the clean copy", () => {
  assert.deepEqual(plainCode(CLEAN), []);
});

test("plain code catches the three errors a rule can see, and only those", () => {
  const r = runLab("p", plainCode);
  assert.deepEqual(r.caught.sort(), ["S11 numbers", "S5 numbers", "S7 overclaim"]);
  assert.equal(r.falseTwin, 0);
  assert.equal(r.wrongClass, 0);
  assert.equal(r.falseClean, 0);
});

test("flagging everything scores zero", () => {
  const r = runLab("all", flagEverything);
  assert.equal(r.tp, 0);
  assert.equal(r.falseClean, CLEAN.length * 4);
  assert.ok(r.f1 < 0.2);
});

test("saying nothing scores zero", () => {
  const r = runLab("none", saysNothing);
  assert.equal(r.tp, 0);
  assert.equal(r.f1, 0);
});

test("right sentence, wrong class is not a catch", () => {
  const r = score(parseReview("S7 numbers"), []);
  assert.equal(r.tp, 0);
  assert.equal(r.wrongClass, 1);
});

test("parseReview reads loose lines, ignores junk and repeats", () => {
  const f = parseReview("S4 selection  dropped after scores\ns4: selection\nhello\nS9 | prereg\nS2 madeup");
  assert.deepEqual(f, [{ id: "S4", cls: "selection" }, { id: "S9", cls: "prereg" }]);
});

test("a perfect review tops the board", () => {
  const text = KEY.map((k) => `${k.id} ${k.cls}`).join("\n");
  const perfect = { name: "perfect", ...score(parseReview(text), []) };
  const board = leaderboard([perfect]);
  assert.equal(board[0].name, "perfect");
  assert.equal(board[0].f1, 1);
  assert.equal(board.at(-1).name, "Says nothing");
});

test("S10 counts under either fitting class, once", () => {
  assert.equal(score(parseReview("S10 numbers"), []).tp, 1);
  assert.equal(score(parseReview("S10 numbers\nS10 overclaim"), []).tp, 1);
});
