import { CLASSES, CLEAN, TWIN, KEY } from "./cases.js";

const CLASS_IDS = Object.keys(CLASSES);

// A review is plain lines: "S7 overclaim" (anything after the class is a note).
export function parseReview(text) {
  const flags = [];
  const seen = new Set();
  for (const raw of String(text).split(/\r?\n/)) {
    const m = raw.trim().match(/^(S\d+)\s*[:,|-]?\s*([a-z]+)/i);
    if (!m) continue;
    const id = m[1].toUpperCase();
    const cls = m[2].toLowerCase();
    if (!CLASS_IDS.includes(cls)) continue;
    const k = id + " " + cls;
    if (seen.has(k)) continue;
    seen.add(k);
    flags.push({ id, cls });
  }
  return flags;
}

// Score one lab: run on the twin (errors planted) and the clean copy (none).
// A flag on the twin counts only with the right sentence AND the right class.
// Every flag on the clean copy is a false flag.
export function score(twinFlags, cleanFlags) {
  const keySet = new Set(KEY.map((k) => k.id + " " + k.cls));
  // Some errors fit two classes; either counts, credited under the main one.
  const alias = new Map(KEY.flatMap((k) => (k.alt ?? []).map((a) => [k.id + " " + a, k.id + " " + k.cls])));
  const keyIds = new Set(KEY.map((k) => k.id));
  const norm = (f) => alias.get(f.id + " " + f.cls) ?? f.id + " " + f.cls;
  // A catch counts only if the same flag is absent on the clean copy.
  const onClean = new Set(cleanFlags.map(norm));
  const caught = new Set();
  let wrongClass = 0;
  let falseTwin = 0;
  for (const f of twinFlags) {
    const k = norm(f);
    if (keySet.has(k) && !onClean.has(k)) caught.add(k);
    else if (keyIds.has(f.id)) wrongClass++;
    else falseTwin++;
  }
  const falseClean = cleanFlags.length;
  const tp = caught.size;
  const allFlags = twinFlags.length + falseClean;
  const precision = allFlags ? tp / allFlags : 0;
  const recall = tp / KEY.length;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { caught: [...caught], tp, wrongClass, falseTwin, falseClean, precision, recall, f1 };
}

// ---- Built-in labs ----

const total = (sentences) => {
  for (const s of sentences) {
    const m = s.text.match(/\b(\d+)\s+(?:YouTube\s+)?videos\b/i);
    if (m) return Number(m[1]);
  }
  return null;
};

// Plain code, no model. Three rules, written with the key in hand: they show
// what a rule can see, not what a general checker would find.
export function plainCode(sentences) {
  const flags = [];
  const n = total(sentences);
  for (const s of sentences) {
    const t = s.text;

    // 1. A list of counts, "A (9), B (2), C and D", should add up to the stated total.
    if (n != null && /\(\d+\)/.test(t)) {
      const list = t.replace(/^.*?\bin\s+/i, "").replace(/\.$/, "");
      const items = list.split(/,\s*|\s+and\s+/).filter(Boolean);
      if (items.length >= 3) {
        const sum = items.reduce((a, it) => {
          const m = it.match(/\((\d+)\)/);
          return a + (m ? Number(m[1]) : 1);
        }, 0);
        if (sum !== n) flags.push({ id: s.id, cls: "numbers", note: `adds to ${sum}, total is ${n}` });
      }
    }

    // 2. "a of b ... about 1 in k" or "x%" must agree within a quarter.
    const of = t.match(/\b(\d+)\s+of\s+(\d+)\b/);
    if (of) {
      const real = Number(of[1]) / Number(of[2]);
      const oneIn = t.match(/about\s+1\s+in\s+(\d+)/i);
      const pct = t.match(/\((?:about\s+)?(\d+(?:\.\d+)?)%\)/);
      const said = oneIn ? 1 / Number(oneIn[1]) : pct ? Number(pct[1]) / 100 : null;
      if (said != null && Math.abs(said - real) / real > 0.25)
        flags.push({ id: s.id, cls: "numbers", note: `${of[1]}/${of[2]} = ${(real * 100).toFixed(1)}%` });
    }

    // 3. An interval that contains the null value, next to a claim of an effect.
    const ci = t.match(/CI\s+(-?\d*\.?\d+)\s+to\s+(-?\d*\.?\d+)/i);
    const nul = t.match(/(-?\d*\.?\d+)\s+is\s+chance/i);
    const claims = /\b(better|above|beats?|more)\s+than\s+chance\b|\babove\s+chance\b/i.test(t);
    const negated = /\b(not|no|none)\b/i.test(t);
    if (ci && nul && claims && !negated) {
      const [lo, hi, z] = [Number(ci[1]), Number(ci[2]), Number(nul[1])];
      if (lo <= z && z <= hi) flags.push({ id: s.id, cls: "overclaim", note: `interval ${lo} to ${hi} includes ${z}` });
    }
  }
  return flags;
}

export const flagEverything = (sentences) =>
  sentences.flatMap((s) => CLASS_IDS.map((cls) => ({ id: s.id, cls })));

export const saysNothing = () => [];

export function runLab(name, fn) {
  const twin = fn(TWIN);
  const clean = fn(CLEAN);
  return { name, twin, clean, ...score(twin, clean) };
}

export function leaderboard(extra = []) {
  const labs = [
    runLab("Plain code (no model)", plainCode),
    runLab("Flags everything", flagEverything),
    runLab("Says nothing", saysNothing),
    ...extra,
  ];
  return labs.sort((a, b) => b.f1 - a.f1 || b.tp - a.tp);
}
